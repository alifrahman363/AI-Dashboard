import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DataSource } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinnedChart } from '../pinnedCharts/pinnedChart.entity';

// Define the ChartData interface to match the frontend's expectation
interface ChartData {
  chartType: 'bar' | 'pie' | 'line' | 'doughnut';
  labels: string[];
  data: number[];
  title: string;
  prompt: string;
  query: string;
  pinnedChartId?: number; // Optional, used for pinned charts
}

@Injectable()
export class DeepseekService {
  constructor(
    private readonly httpService: HttpService,
    private readonly dataSource: DataSource,
    @InjectRepository(PinnedChart)
    private readonly pinnedChartRepository: Repository<PinnedChart>,
  ) { }

  private readonly schema = `
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

  private readonly aiPromptTemplate = `
    Using the schema: {schema}
    Generate a valid MySQL SELECT query for the request: {userRequest}
    Rules:
    - ONLY return the query as a single line of text.
    - NO explanations, reasoning, comments, or extra text.
    - Always use table aliases in the format 'table_name alias' in the FROM clause (e.g., 'FROM products p', never 'FROM p').
    - For requests asking for a count (e.g., "total products", "total orders"), use COUNT(*) with the alias 'count' (e.g., 'SELECT COUNT(*) as count FROM products p').
    - For requests listing items (e.g., "get all products"), select a string column and a numeric column for charting (e.g., 'SELECT p.name, p.price FROM products p').
    - For conditions (e.g., "greater than", "less than"), use a WHERE clause (e.g., 'WHERE p.price > 50').
    - Examples:
      - Request: "total products?" -> Query: "SELECT COUNT(*) as count FROM products p"
      - Request: "Get all products with a price greater than 50" -> Query: "SELECT p.name, p.price FROM products p WHERE p.price > 50"
    - Ensure the query is valid MySQL syntax, references actual table names, and uses aliases correctly.
  `;

  async sendPrompt(userRequest: string): Promise<any> {
    try {
      console.log('User request:', userRequest);

      // Generate the query
      const prompt = this.aiPromptTemplate
        .replace('{schema}', this.schema)
        .replace('{userRequest}', userRequest);

      const deepseekUrl = 'http://localhost:8000/api/prompt';
      const response = await firstValueFrom(
        this.httpService.post(deepseekUrl, { prompt }),
      );
      const rawResponse = response.data.response.trim();

      // Extract the query
      const match = rawResponse.match(/^\s*SELECT\s+.*$/im);
      if (!match) {
        throw new HttpException(
          'No valid SELECT query found in response',
          HttpStatus.BAD_REQUEST,
        );
      }
      const query = match[0].trim();

      // Validate SELECT
      if (!query.toUpperCase().startsWith('SELECT')) {
        throw new HttpException(
          'Response is not a valid SELECT query',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate COUNT for "total" requests
      if (userRequest.toLowerCase().includes('total') && !userRequest.toLowerCase().includes('total price')) {
        if (!query.toUpperCase().includes('COUNT')) {
          throw new HttpException(
            'Expected COUNT query for total request (e.g., total products)',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (!query.toUpperCase().includes('COUNT(*) AS COUNT')) {
          throw new HttpException(
            'COUNT query must have alias "count" (e.g., COUNT(*) as count)',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Validate table alias usage
      if (query.toUpperCase().includes('P.') || query.toUpperCase().includes('FROM P ')) {
        if (!query.toUpperCase().includes('PRODUCTS P')) {
          throw new HttpException(
            'Query uses alias "p" without referencing the products table (e.g., "products p")',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Validate WHERE clause for conditional requests
      if (userRequest.toLowerCase().includes('greater than') && !query.toUpperCase().includes('WHERE')) {
        throw new HttpException(
          'Expected WHERE clause for conditional request (e.g., price greater than)',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Log the query for debugging
      console.log('Generated query:', query);

      // Execute the query
      const result = await this.dataSource.query(query);

      // Handle empty results
      if (!result || result.length === 0) {
        throw new HttpException(
          'Query returned no results',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Format for Chart.js
      let chartType = 'bar'; // Default
      let labels: string[] = [];
      let data: number[] = [];
      let title = userRequest;

      // Handle "total" requests (e.g., "total products")
      if (query.toUpperCase().includes('COUNT')) {
        chartType = 'pie';
        const key = Object.keys(result[0])[0]; // Should be 'count'
        labels = [key];
        data = [Number(result[0][key])];
      }
      // Handle time-based requests (e.g., "per month", "over time")
      else if (userRequest.toLowerCase().match(/per month|over time|by date/)) {
        chartType = 'line';
        labels = result.map((row: any) => {
          const stringKey = Object.keys(row).find(k => k.toLowerCase().includes('date') || typeof row[k] === 'string') || Object.keys(row)[0];
          return row[stringKey].toString();
        });
        data = result.map((row: any) => {
          const numericKey = Object.keys(row).find(k => typeof row[k] === 'number') || Object.keys(row)[1] || Object.keys(row)[0];
          return Number(row[numericKey]);
        });
      }
      // Handle single-row, multi-column results
      else if (result.length === 1 && Object.keys(result[0]).length > 1) {
        chartType = 'doughnut';
        labels = Object.keys(result[0]).filter(k => typeof result[0][k] === 'number');
        data = labels.map(k => Number(result[0][k]));
      }
      // Handle multiple rows (e.g., "get all products")
      else {
        chartType = 'bar';
        labels = result.map((row: any) => {
          const stringKey = Object.keys(row).find(k => typeof row[k] === 'string') || Object.keys(row)[0];
          return row[stringKey].toString();
        });
        data = result.map((row: any) => {
          const numericKey = Object.keys(row).find(k => typeof row[k] === 'number') || Object.keys(row)[1] || Object.keys(row)[0];
          return Number(row[numericKey]);
        });
      }

      // Validate chart data
      if (labels.length === 0 || data.length === 0 || labels.length !== data.length) {
        throw new HttpException(
          'Invalid chart data generated from query result',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        prompt: userRequest,
        query,
        chartType,
        labels,
        data,
        title,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to generate or execute MySQL query: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPinnedCharts(): Promise<ChartData[]> {
    try {
      // Fetch all pinned charts
      const pinnedCharts = await this.pinnedChartRepository.find({
        where: { isPinned: true },
        order: { createdAt: 'DESC' },
      });

      // If no pinned charts are found, return an empty array
      if (!pinnedCharts || pinnedCharts.length === 0) {
        return [];
      }

      // Map each pinned chart to ChartData format by executing its query
      const chartDataPromises = pinnedCharts.map(async (chart) => {
        try {
          // Execute the raw SQL query
          const result = await this.dataSource.query(chart.query);

          // Handle empty results
          if (!result || result.length === 0) {
            throw new HttpException(
              `Query for pinned chart ${chart.id} returned no results`,
              HttpStatus.BAD_REQUEST,
            );
          }

          // Format for Chart.js (reusing logic from sendPrompt)
          let chartType = 'bar'; // Default
          let labels: string[] = [];
          let data: number[] = [];
          const title = chart.prompt;

          // Handle "total" requests (e.g., "total products")
          if (chart.query.toUpperCase().includes('COUNT')) {
            chartType = 'pie';
            const key = Object.keys(result[0])[0]; // Should be 'count'
            labels = [key];
            data = [Number(result[0][key])];
          }
          // Handle time-based requests (e.g., "per month", "over time")
          else if (chart.prompt.toLowerCase().match(/per month|over time|by date/)) {
            chartType = 'line';
            labels = result.map((row: any) => {
              const stringKey = Object.keys(row).find(k => k.toLowerCase().includes('date') || typeof row[k] === 'string') || Object.keys(row)[0];
              return row[stringKey].toString();
            });
            data = result.map((row: any) => {
              const numericKey = Object.keys(row).find(k => typeof row[k] === 'number') || Object.keys(row)[1] || Object.keys(row)[0];
              return Number(row[numericKey]);
            });
          }
          // Handle single-row, multi-column results
          else if (result.length === 1 && Object.keys(result[0]).length > 1) {
            chartType = 'doughnut';
            labels = Object.keys(result[0]).filter(k => typeof result[0][k] === 'number');
            data = labels.map(k => Number(result[0][k]));
          }
          // Handle multiple rows (e.g., "get all products")
          else {
            chartType = 'bar';
            labels = result.map((row: any) => {
              const stringKey = Object.keys(row).find(k => typeof row[k] === 'string') || Object.keys(row)[0];
              return row[stringKey].toString();
            });
            data = result.map((row: any) => {
              const numericKey = Object.keys(row).find(k => typeof row[k] === 'number') || Object.keys(row)[1] || Object.keys(row)[0];
              return Number(row[numericKey]);
            });
          }

          // Validate chart data
          if (labels.length === 0 || data.length === 0 || labels.length !== data.length) {
            throw new HttpException(
              `Invalid chart data generated from query result for pinned chart ${chart.id}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }

          return {
            chartType,
            labels,
            data,
            title,
            prompt: chart.prompt,
            query: chart.query,
            pinnedChartId: chart.id,
          } as ChartData;
        } catch (error) {
          throw new HttpException(
            `Failed to process pinned chart ${chart.id}: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      });

      // Wait for all chart data transformations to complete
      return Promise.all(chartDataPromises);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve pinned charts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}