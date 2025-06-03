import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createCanvas } from 'canvas';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PieController,
  Title,
  Tooltip,
} from 'chart.js';
import * as fs from 'fs';
import { jsPDF } from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { promisify } from 'util';
import * as XLSX from 'xlsx';
import { PinnedChart } from '../pinnedCharts/pinnedChart.entity';
const ChartDataLabels = require('chartjs-plugin-datalabels');
const unlinkAsync = promisify(fs.unlink);

// Debug: Log Chart.js components
console.log('Chart.js components:', {
  ArcElement, BarElement, LineElement, PieController, DoughnutController,
  BarController, LineController, CategoryScale, LinearScale, Title, Tooltip,
  Legend, ChartDataLabels,
});

// Register Chart.js components
try {
  Chart.register(
    ArcElement, BarElement, LineElement, PieController, DoughnutController,
    BarController, LineController, CategoryScale, LinearScale, Title, Tooltip,
    Legend, ChartDataLabels
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

export interface ChartDataForExcel {
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  labels: string[];
  data: number[];
  title: string;
  prompt: string;
  query?: string;
  pinnedChartId?: number;
}

interface ExcelAnalysisResult {
  chartData: ChartDataForExcel;
  summary: string;
}

@Injectable()
export class DeepseekService {
  private readonly baseUrl = 'http://10.38.62.7:8000'; // DeepSeek API URL
  private readonly httpTimeout = 30000; // 30 seconds timeout

  constructor(
    private readonly httpService: HttpService,
    private readonly dataSource: DataSource,
    @InjectRepository(PinnedChart)
    private readonly pinnedChartRepository: Repository<PinnedChart>,
  ) {
    this.httpService.axiosRef.defaults.timeout = this.httpTimeout;
    this.httpService.axiosRef.defaults.headers.post['Content-Type'] = 'application/json';
  }

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
  - Return ONLY the query as a single line of text, with no explanations or extra text.
  - Use table aliases in the format 'table_name alias' (e.g., 'FROM products p') and ensure every alias used (e.g., 'p.') is explicitly defined in FROM or JOIN clauses.
  - Include only necessary tables and joins based on the request; avoid redundant joins (e.g., use 'orders o' for order metrics, not 'products p' unless product data is required).
  - For time-series requests (e.g., 'per month', 'by date'), group by DATE_FORMAT(column, '%Y-%m') with alias 'month' and select a numeric column (e.g., COUNT(*) as count, SUM(o.total_price) as total).
  - For product quantity requests (e.g., 'products sold'), use COUNT(op.product_id) from 'order_products op' joined with 'orders o'.
  - For count requests (e.g., 'total products'), use COUNT(*) with alias 'count' unless time-series is specified.
  - For single-row aggregations (e.g., 'average price', 'min max'), select multiple numeric columns with descriptive aliases (e.g., AVG(p.price) as avg_price) from the relevant table.
  - For listing items (e.g., 'get all products'), select one string column and one numeric column (e.g., 'SELECT p.name, p.price FROM products p').
  - For conditions (e.g., 'greater than', 'less than'), use a WHERE clause (e.g., 'WHERE p.price > 100').
  - For user-specific requests (e.g., 'users with more than N orders'), use subqueries on 'users u' or 'orders o' (e.g., 'WHERE o.user_id IN (SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > N)').
  - Ensure valid MySQL syntax, exact table/column names from the schema, and consistent aliases throughout the query.
  Examples:
  - Request: 'total products?' -> Query: 'SELECT COUNT(*) as count FROM products p'
  - Request: 'Show the count of orders per month in 2025' -> Query: 'SELECT DATE_FORMAT(o.created_at, '%Y-%m') as month, COUNT(*) as count FROM orders o WHERE YEAR(o.created_at) = 2025 GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')'
  - Request: 'Show the total quantity of products sold per month in 2025' -> Query: 'SELECT DATE_FORMAT(o.created_at, '%Y-%m') as month, COUNT(op.product_id) as count FROM orders o JOIN order_products op ON o.id = op.order_id WHERE YEAR(o.created_at) = 2025 GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')'
  - Request: 'average, min, max price of products costing more than 100' -> Query: 'SELECT AVG(p.price) as avg_price, MIN(p.price) as min_price, MAX(p.price) as max_price FROM products p WHERE p.price > 100'
  - Request: 'total order value per month in 2025 for users who placed more than 5 orders' -> Query: 'SELECT DATE_FORMAT(o.created_at, '%Y-%m') as month, SUM(o.total_price) as total_value FROM orders o WHERE o.user_id IN (SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > 5) AND YEAR(o.created_at) = 2025 GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')'
  - Request: 'average order subtotal, discount, and total price for users with at least one order costing more than 500' -> Query: 'SELECT AVG(o.subtotal) as avg_subtotal, AVG(o.discount) as avg_discount, AVG(o.total_price) as avg_total_price FROM orders o WHERE o.user_id IN (SELECT DISTINCT user_id FROM orders WHERE total_price > 500)'
  `;

  private async makeDeepSeekRequest<T = any>(
    endpoint: string,
    payload: any,
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<T> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const requestPayload = {
          ...payload,
          temperature: options.temperature || 0.5, // Balanced for DeepSeek Coder V2
          max_tokens: options.maxTokens || 2048,   // Increased for complex queries
          stream: options.stream || false,
        };

        console.log(`DeepSeek API request (attempt ${attempt}):`, {
          endpoint,
          payload: requestPayload,
        });

        const response = await firstValueFrom(
          this.httpService.post(`${this.baseUrl}${endpoint}`, requestPayload),
        );

        if (!response.data || !response.data.response) {
          throw new Error('Invalid response format from DeepSeek API');
        }

        console.log('DeepSeek API response received successfully');
        return response.data;
      } catch (error) {
        lastError = error;
        console.error(`DeepSeek API request failed (attempt ${attempt}):`, {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        if (attempt === maxRetries) {
          break;
        }

        const waitTime = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new HttpException(
      `DeepSeek API failed after ${maxRetries} attempts: ${lastError.message}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private validateAndCleanQuery(rawResponse: string, userRequest: string): string {
    const cleanedResponse = rawResponse.trim();

    const queryMatch = cleanedResponse.match(/^\s*SELECT\s+.*$/im);
    if (!queryMatch) {
      throw new HttpException(
        'No valid SELECT query found in response',
        HttpStatus.BAD_REQUEST,
      );
    }

    const query = queryMatch[0].trim();

    if (!query.toUpperCase().startsWith('SELECT')) {
      throw new HttpException(
        'Response is not a valid SELECT query',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate time-series requests
    if (this.isTimeSeriesRequest(userRequest)) {
      if (!query.toUpperCase().includes('GROUP BY') || !query.toUpperCase().includes('DATE_FORMAT')) {
        throw new HttpException(
          'Time-series query must include GROUP BY with DATE_FORMAT',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Relaxed COUNT validation
    if (userRequest.toLowerCase().includes('total') && !this.isTimeSeriesRequest(userRequest)) {
      if (!query.toUpperCase().includes('COUNT')) {
        throw new HttpException(
          'Expected COUNT query for total request',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    this.validateTableAliases(query);

    if (userRequest.toLowerCase().includes('greater than') && !query.toUpperCase().includes('WHERE')) {
      throw new HttpException(
        'Expected WHERE clause for conditional request',
        HttpStatus.BAD_REQUEST,
      );
    }

    return query;
  }

  private validateTableAliases(query: string): void {
    const upperQuery = query.toUpperCase();
    const aliasChecks = [
      { alias: 'P.', table: 'PRODUCTS P' },
      { alias: 'U.', table: 'USERS U' },
      { alias: 'O.', table: 'ORDERS O' },
      { alias: 'OP.', table: 'ORDER_PRODUCTS OP' },
    ];
    for (const check of aliasChecks) {
      if (upperQuery.includes(check.alias) && !upperQuery.includes(check.table)) {
        console.error(`Invalid query with alias error: ${query}`);
        throw new HttpException(
          `Query uses alias without proper table reference: ${check.table}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private formatChartData(result: any[], userRequest: string, query: string): {
    chartType: 'bar' | 'line' | 'pie' | 'doughnut';
    labels: string[];
    data: number[];
    title: string;
  } {
    if (!result || result.length === 0) {
      throw new HttpException(
        'Query returned no results',
        HttpStatus.BAD_REQUEST,
      );
    }

    let chartType: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';
    let labels: string[] = [];
    let data: number[] = [];
    const title = userRequest;

    if (this.isTimeSeriesRequest(userRequest)) {
      chartType = 'line';
      ({ labels, data } = this.extractTimeSeriesData(result));
    } else if (result.length === 1 && Object.keys(result[0]).length > 1) {
      chartType = 'doughnut';
      ({ labels, data } = this.extractDoughnutData(result[0]));
    } else if (query.toUpperCase().includes('COUNT') && result.length === 1) {
      chartType = 'pie';
      const key = Object.keys(result[0])[0];
      labels = [key];
      data = [Number(result[0][key]) || 0];
    } else {
      chartType = 'bar';
      ({ labels, data } = this.extractBarData(result));
    }

    if (labels.length === 0 || data.length === 0) {
      throw new HttpException(
        'No valid data found for chart generation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (labels.length !== data.length) {
      throw new HttpException(
        'Mismatch between labels and data arrays',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { chartType, labels, data, title };
  }

  private isTimeSeriesRequest(userRequest: string): boolean {
    const timePatterns = /per month|over time|by date|monthly|daily|yearly|trend/i;
    return timePatterns.test(userRequest);
  }

  private extractTimeSeriesData(result: any[]): { labels: string[]; data: number[] } {
    const labels = result.map((row: any) => {
      const dateKey = Object.keys(row).find(k =>
        k.toLowerCase().includes('date') ||
        k.toLowerCase().includes('time') ||
        !isNaN(Date.parse(String(row[k])))
      );
      const stringKey = Object.keys(row).find(k => typeof row[k] === 'string');
      const key = dateKey || stringKey || Object.keys(row)[0];
      return String(row[key]);
    });

    const data = result.map((row: any) => {
      const numericKey = Object.keys(row).find(k => typeof row[k] === 'number') ||
        Object.keys(row).find(k => !isNaN(Number(row[k]))) ||
        Object.keys(row)[1] || Object.keys(row)[0];
      return Number(row[numericKey]) || 0;
    });

    return { labels, data };
  }

  private extractDoughnutData(row: any): { labels: string[]; data: number[] } {
    const numericEntries = Object.entries(row).filter(([_, value]) =>
      typeof value === 'number' || !isNaN(Number(value))
    );

    const labels = numericEntries.map(([key]) => key);
    const data = numericEntries.map(([_, value]) => Number(value) || 0);

    return { labels, data };
  }

  private extractBarData(result: any[]): { labels: string[]; data: number[] } {
    const labels = result.map((row: any) => {
      const stringKey = Object.keys(row).find(k => typeof row[k] === 'string') ||
        Object.keys(row)[0];
      return String(row[stringKey]);
    });

    const data = result.map((row: any) => {
      const numericKey = Object.keys(row).find(k => typeof row[k] === 'number') ||
        Object.keys(row).find(k => !isNaN(Number(row[k]))) ||
        Object.keys(row)[1] || Object.keys(row)[0];
      return Number(row[numericKey]) || 0;
    });

    return { labels, data };
  }

  async sendPrompt(userRequest: string): Promise<any> {
    try {
      console.log('Processing user request:', userRequest);

      const prompt = this.aiPromptTemplate
        .replace('{schema}', this.schema)
        .replace('{userRequest}', userRequest);

      const apiResponse = await this.makeDeepSeekRequest('/api/chat', {
        messages: [{ role: 'user', content: prompt }],
      }, {
        temperature: 0.5,  // Balanced for DeepSeek Coder V2
        maxTokens: 2048,   // Increased for complex queries
      });

      const rawResponse = apiResponse.response;
      const query = this.validateAndCleanQuery(rawResponse, userRequest);
      console.log('Generated and validated query:', query);

      let result: any[];
      try {
        result = await this.dataSource.query(query);
      } catch (dbError) {
        throw new HttpException(
          `Database query failed: ${dbError.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const chartData = this.formatChartData(result, userRequest, query);

      return {
        prompt: userRequest,
        query,
        ...chartData,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to process request: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPinnedCharts(): Promise<ChartData[]> {
    try {
      const pinnedCharts = await this.pinnedChartRepository.find({
        where: { isPinned: true },
        order: { createdAt: 'DESC' },
      });

      if (!pinnedCharts || pinnedCharts.length === 0) {
        return [];
      }

      const chartPromises = pinnedCharts.map(async (chart) => {
        try {
          const result = await Promise.race([
            this.dataSource.query(chart.query),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Query timeout')), 10000)
            )
          ]) as any[];

          if (!result || result.length === 0) {
            console.warn(`Pinned chart ${chart.id} returned no results, skipping`);
            return null;
          }

          const chartData = this.formatChartData(result, chart.prompt, chart.query);

          return {
            ...chartData,
            prompt: chart.prompt,
            query: chart.query,
            pinnedChartId: chart.id,
          } as ChartData;
        } catch (error) {
          console.error(`Error processing pinned chart ${chart.id}:`, error.message);
          return null;
        }
      });

      const chartResults = await Promise.all(chartPromises);
      return chartResults.filter(chart => chart !== null);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve pinned charts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async downloadChart(chartData: ChartData, format: 'png' | 'pdf' = 'png'): Promise<Buffer> {
    try {
      const width = 1200;
      const height = 800;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Extend Chart.js plugin options to include datalabels for TypeScript
      type ChartJsWithDatalabelsOptions = ChartConfiguration<'bar' | 'line' | 'pie' | 'doughnut'> & {
        options: {
          plugins: {
            datalabels?: any;
            [key: string]: any;
          };
        };
      };

      const chartConfig: ChartJsWithDatalabelsOptions = {
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
              'rgba(255, 159, 64, 0.8)',
              'rgba(199, 199, 199, 0.8)',
              'rgba(83, 102, 255, 0.8)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(199, 199, 199, 1)',
              'rgba(83, 102, 255, 1)',
            ],
            borderWidth: 2,
          }],
        },
        options: {
          responsive: false,
          layout: {
            padding: 30,
          },
          plugins: {
            title: {
              display: true,
              text: chartData.title,
              font: {
                size: 28,
                weight: 'bold',
              },
              color: '#000',
              padding: 25,
            },
            legend: {
              display: chartData.chartType !== 'pie' && chartData.chartType !== 'doughnut',
              labels: {
                font: {
                  size: 18,
                },
                color: '#000',
                padding: 15,
              },
            },
            datalabels: {
              display: true,
              color: '#000',
              font: {
                size: 16,
                weight: 'bold',
              },
              formatter: (value: number, context: any): string => {
                if (chartData.chartType === 'pie' || chartData.chartType === 'doughnut') {
                  const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
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
                font: { size: 16 },
                color: '#000',
                maxRotation: 45,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                font: { size: 16 },
                color: '#000',
              },
            },
          } : undefined,
        },
      };

      try {
        new Chart(canvas as any, chartConfig);
      } catch (chartError) {
        throw new Error(`Chart rendering failed: ${chartError.message}`);
      }

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
      console.error('Error generating chart:', error.message);
      throw new HttpException(
        `Failed to generate chart: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async analyzeExcel(file: Express.Multer.File, userRequest: string): Promise<ExcelAnalysisResult> {
    let filePath: string | null = null;

    try {
      filePath = file.path;

      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.readFile(filePath);
      } catch (xlsxError) {
        throw new Error(`Failed to read Excel file: ${xlsxError.message}`);
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Excel file contains no sheets');
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        throw new HttpException('Excel file is empty or invalid', HttpStatus.BAD_REQUEST);
      }

      const sampleData = jsonData.slice(0, 10);
      const dataKeys = Object.keys(jsonData[0]);
      const summaryPrompt = `
        Analyze this Excel dataset and provide a concise summary (max 50 words) for: "${userRequest}"
        
        Dataset info:
        - Total rows: ${jsonData.length}
        - Columns: ${dataKeys.join(', ')}
        - Sample data: ${JSON.stringify(sampleData)}
        
        Focus on key metrics, trends, and insights relevant to the request.
        Return only the summary text without explanations.
      `;

      const summaryResponse = await this.makeDeepSeekRequest('/api/chat', {
        messages: [{ role: 'user', content: summaryPrompt }],
      }, {
        temperature: 0.5,
        maxTokens: 256,  // Increased for detailed summaries
      });

      const summary = summaryResponse.response.trim();
      const chartData = this.extractExcelChartData(jsonData, userRequest);

      await unlinkAsync(filePath);
      filePath = null;

      return {
        chartData,
        summary,
      };
    } catch (error) {
      if (filePath) {
        await unlinkAsync(filePath).catch((err) =>
          console.error('Error deleting file:', err)
        );
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to analyze Excel file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private extractExcelChartData(jsonData: any[], userRequest: string): ChartDataForExcel {
    const firstRow = jsonData[0];
    const keys = Object.keys(firstRow);

    const numericColumns = keys.filter(key =>
      jsonData.some(row => typeof row[key] === 'number' || !isNaN(Number(row[key])))
    );

    const stringColumns = keys.filter(key =>
      jsonData.some(row => typeof row[key] === 'string' && !key.toLowerCase().includes('date'))
    );

    const dateColumns = keys.filter(key =>
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('time') ||
      jsonData.some(row => !isNaN(Date.parse(String(row[key]))))
    );

    let chartType: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';
    let labels: string[] = [];
    let data: number[] = [];
    const title = userRequest;

    if (userRequest.toLowerCase().match(/total|count|sum/)) {
      chartType = 'pie';
      if (numericColumns.length === 0) {
        throw new HttpException('No numeric column found for total analysis', HttpStatus.BAD_REQUEST);
      }
      const numericColumn = numericColumns[0];
      const total = jsonData.reduce((sum: number, row: any) => {
        const value = Number(row[numericColumn]);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
      labels = [numericColumn];
      data = [total];
    } else if (this.isTimeSeriesRequest(userRequest)) {
      chartType = 'line';
      if (dateColumns.length === 0 || numericColumns.length === 0) {
        throw new HttpException('Date or numeric column missing for time analysis', HttpStatus.BAD_REQUEST);
      }
      const dateColumn = dateColumns[0];
      const numericColumn = numericColumns[0];

      labels = jsonData.map((row: any) => String(row[dateColumn]));
      data = jsonData.map((row: any) => {
        const value = Number(row[numericColumn]);
        return isNaN(value) ? 0 : value;
      });
    } else {
      chartType = 'bar';
      if (stringColumns.length === 0 || numericColumns.length === 0) {
        throw new HttpException('String or numeric column missing for analysis', HttpStatus.BAD_REQUEST);
      }
      const stringColumn = stringColumns[0];
      const numericColumn = numericColumns[0];

      labels = jsonData.map((row: any) => String(row[stringColumn]));
      data = jsonData.map((row: any) => {
        const value = Number(row[numericColumn]);
        return isNaN(value) ? 0 : value;
      });
    }

    if (labels.length === 0 || data.length === 0) {
      throw new HttpException('No valid data extracted from Excel', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (labels.length !== data.length) {
      throw new HttpException('Data consistency error in Excel analysis', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      chartType,
      labels,
      data,
      title,
      prompt: userRequest,
    };
  }
}