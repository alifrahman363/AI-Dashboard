# AI Dashboard

AI Dashboard is a full-stack application that allows users to generate charts from natural language prompts by querying a MySQL database. The application uses a Next.js frontend for the user interface, a NestJS backend to process requests and execute database queries, and a Flask app to generate SQL queries using the Ollama language model (`deepseek-coder`).

## Features

- **Natural Language Queries**: Users can input prompts like "Get all products with a price greater than 500" or "Total products?" to generate charts.
- **Dynamic Chart Generation**: Supports multiple chart types (bar, pie, line, doughnut) using Chart.js, based on the query results.
- **Side-by-Side Charts**: Displays multiple charts side by side with horizontal scrolling.
- **Clear Charts**: Includes a "Clear Charts" button to remove all displayed charts.
- **Responsive Design**: Built with Tailwind CSS for a responsive and modern UI.

![AI Dashboard 1](https://github.com/user-attachments/assets/88aa9df2-4b55-4add-904d-bcff34022238)

![AI Dashboard 2](https://github.com/user-attachments/assets/d372e06a-bc1c-4a3b-b819-962df40edc1b)

## Tech Stack

- **Frontend**: Next.js 14, React, Chart.js (`react-chartjs-2`), Tailwind CSS
- **Backend**:
  - **NestJS**: Handles API requests, processes prompts, and executes MySQL queries.
  - **Flask**: Generates SQL queries from user prompts using Ollama.
- **Database**: MySQL
- **Language Model**: Ollama (`deepseek-coder` model) for SQL query generation
- **Other Libraries**:
  - TypeORM (for database interaction in NestJS)
  - Axios (for HTTP requests)
  - TypeScript (for type safety)

## Project Structure

```
.
├── deepseek-api/               # Flask app for SQL query generation
│   ├── app.py                 # Main Flask app
│   ├── venv/                  # Virtual environment for Flask
│   └── requirements.txt       # Python dependencies
├── deepseek-frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx       # Main page with chart generation UI
│   │   │   └── globals.css    # Tailwind CSS styles
│   │   └── ...
│   ├── package.json           # Frontend dependencies
│   └── tailwind.config.ts     # Tailwind configuration
├── deepseek-backend/          # NestJS backend
│   ├── src/
│   │   ├── deepseek/
│   │   │   ├── deepseek.service.ts  # Service for prompt processing and query execution
│   │   │   └── ...
│   │   └── ...
│   ├── package.json           # Backend dependencies
│   └── ormconfig.json         # TypeORM configuration for MySQL
└── README.md                  # Project documentation
```

## Prerequisites

- **Node.js** (v18 or later)
- **Python** (v3.8 or later)
- **MySQL** (v8.0 or later)
- **Ollama**: For running the `deepseek-coder` model locally
- **Git**

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Set Up the Database

#### Install MySQL (if not already installed)

- **On Ubuntu**:
  ```bash
  sudo apt update
  sudo apt install mysql-server
  sudo systemctl start mysql
  sudo systemctl enable mysql
  ```

- **On macOS**:
  ```bash
  brew install mysql
  brew services start mysql
  ```

#### Create the Database and Tables

1. **Log in to MySQL**:
   ```bash
   mysql -u root -p
   ```

2. **Create the database and tables**:
   ```sql
   CREATE DATABASE deepseek_db;
   USE deepseek_db;

   CREATE TABLE products (
       id INT PRIMARY KEY AUTO_INCREMENT,
       name VARCHAR(255),
       description TEXT,
       price DECIMAL(10,2),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   CREATE TABLE users (
       id INT PRIMARY KEY AUTO_INCREMENT,
       username VARCHAR(255) UNIQUE,
       email VARCHAR(255) UNIQUE,
       password VARCHAR(255),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE orders (
       id INT PRIMARY KEY AUTO_INCREMENT,
       user_id INT,
       subtotal DECIMAL(10,2),
       discount DECIMAL(10,2),
       total_price DECIMAL(10,2),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (user_id) REFERENCES users(id)
   );

   CREATE TABLE order_products (
       order_id INT,
       product_id INT,
       FOREIGN KEY (order_id) REFERENCES orders(id),
       FOREIGN KEY (product_id) REFERENCES products(id),
       PRIMARY KEY (order_id, product_id)
   );
   ```

#### Insert Sample Data

```sql
INSERT INTO products (name, description, price) VALUES
('Wireless Mouse', 'A wireless mouse', 60.00),
('Wireless Headphones', 'Noise-canceling headphones', 120.00),
('Laptop', 'High-performance laptop', 999.99),
('Keyboard', 'Mechanical keyboard', 79.99);

INSERT INTO users (username, email, password) VALUES
('john_doe', 'john@example.com', 'hashed_password'),
('jane_smith', 'jane@example.com', 'hashed_password');

INSERT INTO orders (user_id, subtotal, discount, total_price) VALUES
(1, 180.00, 10.00, 170.00),
(2, 999.99, 0.00, 999.99);

INSERT INTO order_products (order_id, product_id) VALUES
(1, 1),
(1, 2),
(2, 3);
```

#### Update Database Configuration

Update the `ormconfig.json` in the NestJS backend (`deepseek-backend/ormconfig.json`) with your MySQL credentials:

```json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "your_username",
  "password": "your_password",
  "database": "deepseek_db",
  "entities": ["dist/**/*.entity{.ts,.js}"],
  "synchronize": false
}
```

### 3. Set Up the Flask App (Prompt Processing Service)

#### Navigate to the Flask App Directory

```bash
cd deepseek-api
```

#### Set Up a Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies

Create a `requirements.txt` file:

```plaintext
flask==3.0.3
ollama==0.3.3
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

#### Install and Start Ollama

1. **Install Ollama (if not already installed)**:
   - On Ubuntu/macOS, follow the instructions at [Ollama’s official site](https://ollama.ai).
   - Example for Ubuntu:
     ```bash
     curl -fsSL https://ollama.ai/install.sh | sh
     ```

2. **Start the Ollama server**:
   ```bash
   ollama serve
   ```

3. **Pull the `deepseek-coder` model**:
   ```bash
   ollama pull deepseek-coder
   ```

#### Run the Flask App

```bash
python3 app.py
```

The Flask app should run on `http://localhost:8000`.

### 4. Set Up the NestJS Backend

#### Navigate to the Backend Directory

```bash
cd deepseek-backend
```

#### Install Dependencies

```bash
npm install
```

#### Run the Backend

```bash
npm run start
```

The NestJS app should run on `http://localhost:3000`.

### 5. Set Up the Next.js Frontend

#### Navigate to the Frontend Directory

```bash
cd deepseek-frontend
```

#### Install Dependencies

```bash
npm install
```

#### Run the Frontend

```bash
npm run dev
```

The frontend should run on `http://localhost:3001`.

## Usage

### Access the Application

Open your browser and navigate to `http://localhost:3001`.

### Generate Charts

- Enter a prompt in the input field, such as:
  - "Get all products with a price greater than 500"
  - "Total products?"
  - "Get all products with a price greater than 50"
- Click the "Generate" button to create a chart based on the query results.
- Charts are displayed side by side with horizontal scrolling.

### Clear Charts

Click the "Clear Charts" button to remove all displayed charts.

## Example Prompts and Results

- **Prompt**: "Get all products with a price greater than 500"
  - **Generated Query**: `SELECT p.name, p.price FROM products p WHERE p.price > 500`
  - **Result**: Bar chart showing "Laptop" with a price of 999.99.

- **Prompt**: "Total products?"
  - **Generated Query**: `SELECT COUNT(*) as count FROM products p`
  - **Result**: Pie chart showing a count of 4.

- **Prompt**: "Get all products with a price greater than 50"
  - **Generated Query**: `SELECT p.name, p.price FROM products p WHERE p.price > 50`
  - **Result**: Bar chart showing "Wireless Mouse" (60.00), "Wireless Headphones" (120.00), "Laptop" (999.99), and "Keyboard" (79.99).

## Troubleshooting

### Flask App Errors

#### Error: `ModuleNotFoundError: No module named 'ollama'`

- Ensure the `ollama` package is installed:
  ```bash
  pip install ollama
  ```
- Verify the Ollama server is running:
  ```bash
  ollama serve
  ```
- Pull the `deepseek-coder` model:
  ```bash
  ollama pull deepseek-coder
  ```

#### Error: Flask app fails to start

- Check the Flask logs for errors:
  ```bash
  python3 app.py
  ```
- Ensure the port `8000` is not in use:
  ```bash
  lsof -i :8000
  kill -9 <PID>
  ```

### NestJS Backend Errors

#### Error: Database connection failed

- Verify your MySQL credentials in `ormconfig.json`.
- Ensure MySQL is running:
  ```bash
  sudo systemctl start mysql
  ```

#### Error: `Failed to generate or execute MySQL query`

- Check the NestJS logs for the specific error.
- Ensure the Flask app is running on `http://localhost:8000`.

### Frontend Errors

#### Error: Charts not displaying

- Check the browser console for errors (Ctrl+Shift+I).
- Ensure the NestJS backend is running on `http://localhost:3000`.
- Verify the API response by testing the endpoint directly:
  ```bash
  curl -X POST http://localhost:3000/deepseek/prompt -H "Content-Type: application/json" -d '{"prompt": "Get all products with a price greater than 500"}'
  ```

## Future Improvements

- **Support More Query Types**: Add support for prompts like "Get all products with a price less than 100" or "Get total orders per month".
- **Parameterized Queries**: Use parameterized queries in the Flask app and NestJS backend to prevent SQL injection.
- **Individual Chart Removal**: Add a close button to each chart card to remove individual charts.
- **Improved Error Handling**: Provide more specific error messages in the UI for failed queries.

## License

This project is licensed under the MIT License.

## Contact

For issues or contributions, please open an issue on the repository or contact the maintainers.
