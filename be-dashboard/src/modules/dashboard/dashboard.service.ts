import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Product } from '../products/products.entity';
import { Order } from '../order/order.entity';
import { User } from '../user/user.entity';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Order) private orderRepo: Repository<Order>,
    ) { }

    async processQuery(userQuery: string): Promise<any> {
        // Step 1: Construct AI prompt with detailed schema and instructions
        const schema = `
      Table products (
        id INT PRIMARY KEY,
        name VARCHAR,
        description TEXT,
        price DECIMAL(10,2),
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      ) -- Stores product information like name and price;
      
      Table users (
        id INT PRIMARY KEY,
        username VARCHAR UNIQUE,
        email VARCHAR UNIQUE,
        password VARCHAR,
        created_at TIMESTAMP
      ) -- Stores user information like username and email;
      
      Table orders (
        id INT PRIMARY KEY,
        user_id INT,
        subtotal DECIMAL(10,2),
        discount DECIMAL(10,2),
        total_price DECIMAL(10,2),
        created_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) -- Stores order details like total price and user;
      
      Table order_products (
        order_id INT,
        product_id INT,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      ) -- Links orders to products (many-to-many);
    `;
        const aiPrompt = `
      You are an expert MySQL query generator. Using the schema below, generate a valid MySQL SELECT query for the user's request. Follow these rules:
      - Schema: ${schema}
      - Only generate SELECT queries (no DROP, DELETE, UPDATE, INSERT).
      - Use table aliases (e.g., 'o' for orders, 'p' for products, 'u' for users, 'op' for order_products).
      - Match the query to the appropriate table based on the prompt:
        - For "products" or "product" (e.g., "how many products", "average product price"), use the products table.
        - For "users" or "user" (e.g., "how many users", "user count"), use the users table.
        - For "orders" or "order" (e.g., "total sales", "how many orders"), use the orders table.
        - For relationships, use JOINs with order_products if needed.
      - For counting rows (e.g., "how many", "count"), use COUNT(*) with alias 'count'.
      - For averages (e.g., "average price"), use AVG(column) with alias 'average_price'.
      - For sums (e.g., "total sales"), use SUM(column) with alias 'total_sales'.
      - For date-based queries (e.g., "today", "till date"), use CURDATE() or no date filter for cumulative data.
      - For predictive queries (e.g., "next month"), return historical data (last 6 months) with MONTH(o.created_at).
      - If the query is vague, return a relevant query based on the most likely table (e.g., orders for sales, users for counts).
      - Return only the SQL query, no explanations or code fences.
      User request: "${userQuery}"
    `;

        // Step 2: Get SQL query from Hugging Face
        const sqlQuery = await this.callAIApi(aiPrompt, userQuery);
        this.logger.log(`SQL Query Before Execution: ${sqlQuery}`);

        // Step 3: Validate and execute query
        try {
            const result = await this.executeSafeQuery(sqlQuery);
            this.logger.log(`Query Result: ${JSON.stringify(result)}`);

            // Step 4: Format data for chart
            const chartData = this.formatForChart(result, userQuery);
            return chartData;
        } catch (error) {
            this.logger.error(`Query Error: ${error.message}`);
            return { error: `Invalid query or database error: ${error.message}` };
        }
    }

    private async callAIApi(prompt: string, userQuery: string): Promise<string> {
        try {
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/codellama/CodeLlama-7b-hf',
                { inputs: prompt },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const sql = response.data[0]?.generated_text?.trim();
            this.logger.log(`Raw API Response: ${sql}`);
            return typeof sql === 'string' && sql.length > 0 ? sql : this.getFallbackQuery(userQuery);
        } catch (error) {
            this.logger.error(`API Error: ${error.message}, Status: ${error.response?.status}`);
            return this.getFallbackQuery(userQuery);
        }
    }

    private getFallbackQuery(userQuery: string): string {
        const lowerQuery = userQuery.toLowerCase();
        if (lowerQuery.includes('product')) {
            if (lowerQuery.includes('average')) {
                return 'SELECT AVG(p.price) as average_price FROM products p';
            }
            if (lowerQuery.includes('count') || lowerQuery.includes('many')) {
                return 'SELECT COUNT(*) as count FROM products p';
            }
        }
        if (lowerQuery.includes('user')) {
            if (lowerQuery.includes('count') || lowerQuery.includes('many')) {
                return 'SELECT COUNT(*) as count FROM users u';
            }
        }
        return 'SELECT COUNT(*) as count FROM orders';
    }

    private async executeSafeQuery(sql: string): Promise<any> {
        const lowerSql = sql.toLowerCase();
        if (!lowerSql.startsWith('select') || lowerSql.match(/(drop|delete|update|insert|alter|truncate)/i)) {
            throw new Error('Only SELECT queries are allowed');
        }
        const validTables = ['products', 'users', 'orders', 'order_products'];
        const usesValidTable = validTables.some(table => lowerSql.includes(table));
        if (!usesValidTable) {
            throw new Error('Query must reference products, users, orders, or order_products');
        }

        // Route queries to appropriate repository
        if (lowerSql.includes('products')) {
            return await this.productRepo.query(sql);
        }
        if (lowerSql.includes('users')) {
            return await this.userRepo.query(sql);
        }
        return this.orderRepo.query(sql);
    }

    private formatForChart(data: any, query: string): any {
        if (!data || !Array.isArray(data) || data.length === 0) {
            this.logger.warn('No data returned from query');
            return {
                labels: ['No Data'],
                datasets: [{
                    label: query,
                    data: [0],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                }],
            };
        }

        // Dynamically extract labels and values
        const labels = data.map(row =>
            row.date || row.created_at || row.name || row.username || row.id || 'Result'
        );
        const values = data.map(row =>
            row.count || row.average_price || row.total_sales || row.total_price || row.subtotal || row.price || row.quantity || 0
        );

        // Simple projection for predictive queries
        if (query.toLowerCase().includes('growth') && query.toLowerCase().includes('next')) {
            const historical = values.slice(0, 6);
            const avgGrowth = historical.length > 1
                ? (historical[0] - historical[1]) / historical[1] : 0;
            const predicted = historical[0] * (1 + avgGrowth);
            labels.push('Next Month');
            values.push(predicted);
        }

        return {
            labels,
            datasets: [{
                label: query,
                data: values,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
            }],
        };
    }
}