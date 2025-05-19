import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createCanvas } from 'canvas';
import {
  Chart,
  ArcElement,
  BarElement,
  LineElement,
  PieController,
  DoughnutController,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ChartConfiguration,
} from 'chart.js';
// Use named import for ChartDataLabels
const ChartDataLabels = require('chartjs-plugin-datalabels');
import { jsPDF } from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { PinnedChart } from '../pinnedCharts/pinnedChart.entity';

// Debug: Log all components to check for undefined values
console.log('Chart.js components:', {
  ArcElement,
  BarElement,
  LineElement,
  PieController,
  DoughnutController,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
});

// Register only the necessary Chart.js components
try {
  Chart.register(
    ArcElement,
    BarElement,
    LineElement,
    PieController,
    DoughnutController,
    BarController,
    LineController,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
  );
  console.log('Chart.js registration successful');
} catch (error) {
  console.error('Error during Chart.js registration:', error.message);
  throw new Error(`Chart.js registration failed: ${error.message}`);
}

interface ChartData {
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  labels: string[];
  data: number[];
  title: string;
  prompt: string;
  query: string;
  pinnedChartId?: number;
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
      if (
        userRequest.toLowerCase().includes('total') &&
        !userRequest.toLowerCase().includes('total price')
      ) {
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
      if (
        query.toUpperCase().includes('P.') ||
        query.toUpperCase().includes('FROM P ')
      ) {
        if (!query.toUpperCase().includes('PRODUCTS P')) {
          throw new HttpException(
            'Query uses alias "p" without referencing the products table (e.g., "products p")',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Validate WHERE clause for conditional requests
      if (
        userRequest.toLowerCase().includes('greater than') &&
        !query.toUpperCase().includes('WHERE')
      ) {
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
          const stringKey =
            Object.keys(row).find(
              (k) => k.toLowerCase().includes('date') || typeof row[k] === 'string',
            ) || Object.keys(row)[0];
          return row[stringKey].toString();
        });
        data = result.map((row: any) => {
          const numericKey =
            Object.keys(row).find((k) => typeof row[k] === 'number') ||
            Object.keys(row)[1] ||
            Object.keys(row)[0];
          return Number(row[numericKey]);
        });
      }
      // Handle single-row, multi-column results
      else if (result.length === 1 && Object.keys(result[0]).length > 1) {
        chartType = 'doughnut';
        labels = Object.keys(result[0]).filter(
          (k) => typeof result[0][k] === 'number',
        );
        data = labels.map((k) => Number(result[0][k]));
      }
      // Handle multiple rows (e.g., "get all products")
      else {
        chartType = 'bar';
        labels = result.map((row: any) => {
          const stringKey =
            Object.keys(row).find((k) => typeof row[k] === 'string') ||
            Object.keys(row)[0];
          return row[stringKey].toString();
        });
        data = result.map((row: any) => {
          const numericKey =
            Object.keys(row).find((k) => typeof row[k] === 'number') ||
            Object.keys(row)[1] ||
            Object.keys(row)[0];
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
              const stringKey =
                Object.keys(row).find(
                  (k) => k.toLowerCase().includes('date') || typeof row[k] === 'string',
                ) || Object.keys(row)[0];
              return row[stringKey].toString();
            });
            data = result.map((row: any) => {
              const numericKey =
                Object.keys(row).find((k) => typeof row[k] === 'number') ||
                Object.keys(row)[1] ||
                Object.keys(row)[0];
              return Number(row[numericKey]);
            });
          }
          // Handle single-row, multi-column results
          else if (result.length === 1 && Object.keys(result[0]).length > 1) {
            chartType = 'doughnut';
            labels = Object.keys(result[0]).filter(
              (k) => typeof result[0][k] === 'number',
            );
            data = labels.map((k) => Number(result[0][k]));
          }
          // Handle multiple rows (e.g., "get all products")
          else {
            chartType = 'bar';
            labels = result.map((row: any) => {
              const stringKey =
                Object.keys(row).find((k) => typeof row[k] === 'string') ||
                Object.keys(row)[0];
              return row[stringKey].toString();
            });
            data = result.map((row: any) => {
              const numericKey =
                Object.keys(row).find((k) => typeof row[k] === 'number') ||
                Object.keys(row)[1] ||
                Object.keys(row)[0];
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

  async downloadChart(chartData: ChartData, format: 'png' | 'pdf' = 'png'): Promise<Buffer> {
    try {
      const width = 1000;
      const height = 750;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      const chartConfig: ChartConfiguration<'bar' | 'line' | 'pie' | 'doughnut'> = {
        type: chartData.chartType,
        data: {
          labels: chartData.labels,
          datasets: [{
            label: chartData.title,
            data: chartData.data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 2,
          }],
        },
        options: {
          responsive: false,
          layout: {
            padding: 20,
          },
          plugins: {
            title: {
              display: true,
              text: chartData.title,
              font: {
                size: 24,
                weight: 'bold',
              },
              color: '#000',
              padding: 20,
            },
            legend: {
              display: chartData.chartType !== 'pie' && chartData.chartType !== 'doughnut',
              labels: {
                font: {
                  size: 16,
                },
                color: '#000',
              },
            },
            // @ts-ignore: Extend Chart.js with datalabels plugin
            datalabels: {
              display: true,
              color: '#000',
              font: {
                size: 18,
                weight: 'bold',
              },
              formatter: (value: number, context: any): string => {
                if (chartData.chartType === 'pie' || chartData.chartType === 'doughnut') {
                  const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${value} (${percentage}%)`;
                }
                return value.toString();
              },
              anchor: 'center',
              align: 'center',
            },
          },
          scales: chartData.chartType === 'bar' || chartData.chartType === 'line' ? {
            x: {
              ticks: {
                font: { size: 14 },
                color: '#000',
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                font: { size: 14 },
                color: '#000',
              },
            },
          } : undefined,
        },
      };

      // Render chart
      new Chart(canvas as any, chartConfig);

      if (format === 'png') {
        return canvas.toBuffer('image/png', { compressionLevel: 6 });
      } else if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [width, height],
        });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        return Buffer.from(pdf.output('arraybuffer'));
      } else {
        throw new HttpException(
          'Unsupported format. Use "png" or "pdf".',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.log('Error generating chart:', error.message);
      throw new HttpException(
        `Failed to generate chart: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export default DeepseekService;