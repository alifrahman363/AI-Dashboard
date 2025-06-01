# AI Dashboard

AI Dashboard is a full-stack application that enables users to generate charts from natural language prompts by querying a MySQL database. It features a Next.js frontend, a NestJS backend, and a Flask app powered by the Ollama language model (`deepseek-coder-v2:16b`) for SQL query generation, optimized for NVIDIA GPU acceleration.

## Features

- **Natural Language Queries**: Input prompts like "Get all products with a price greater than 500" or "Total orders by user" to generate charts.
- **Dynamic Chart Generation**: Supports bar, pie, line, and doughnut charts using Chart.js.
- **Side-by-Side Charts**: Displays multiple charts with horizontal scrolling.
- **Clear Charts**: Includes a "Clear Charts" button to remove all displayed charts.
- **Responsive Design**: Built with Tailwind CSS for a modern, responsive UI.
- **GPU Acceleration**: Utilizes NVIDIA GPU with CUDA 12.6 for fast query generation with `deepseek-coder-v2:16b`.

![Dashboard Screenshot 1](https://github.com/user-attachments/assets/2a131917-de74-4421-8a21-51fdfd85bc82)
![Dashboard Screenshot 2](https://github.com/user-attachments/assets/82d621b1-135c-4f4d-bbca-516714ac1200)
![Dashboard Screenshot 3](https://github.com/user-attachments/assets/4467244c-e6d2-4248-91b2-0889933f16b5)
![Dashboard Screenshot 4](https://github.com/user-attachments/assets/13058ee0-7b49-4dfb-8e57-9a473f0f7e33)

## Tech Stack

- **Frontend**: Next.js 14, React, Chart.js (`react-chartjs-2`), Tailwind CSS
- **Backend**:
  - **NestJS**: Handles API requests, processes prompts, and executes MySQL queries.
  - **Flask**: Generates SQL queries using Ollama (`deepseek-coder-v2:16b`).
- **Database**: MySQL
- **Language Model**: Ollama (`deepseek-coder-v2:16b`)
- **GPU Support**: NVIDIA driver (570.86.15 or later), CUDA 12.6
- **Other Libraries**:
  - TypeORM (NestJS database interaction)
  - Axios (HTTP requests)
  - TypeScript (type safety)

## Project Structure

```
.
├── deepseek-api/               # Flask app for SQL query generation
│   ├── app.py                 # Main Flask app (configured for deepseek-coder-v2:16b)
│   ├── venv/                  # Virtual environment
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
│   │   │   ├── deepseek.service.ts  # Service for prompt processing
│   │   │   └── ...
│   │   └── ...
│   ├── package.json           # Backend dependencies
│   └── ormconfig.json         # TypeORM MySQL configuration
└── README.md                  # Project documentation
```

## Prerequisites

- **Node.js**: v18 or later
- **Python**: v3.8 or later
- **MySQL**: v8.0 or later
- **Ollama**: For running `deepseek-coder-v2:16b`
- **Git**
- **NVIDIA GPU**: Compatible with CUDA 12.6 (e.g., RTX 3090, ~10GB VRAM required)
- **NVIDIA Driver**: Version 570.86.15 or later
- **CUDA Toolkit**: 12.6
- **Operating System**: Ubuntu 22.04 (or compatible Linux distribution)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Set Up GPU Environment

To enable GPU acceleration for `deepseek-coder-v2:16b`, install NVIDIA drivers and CUDA 12.6.

#### Install NVIDIA Driver

1. Update package list:
   ```bash
   sudo apt update
   ```
2. Install NVIDIA driver:
   ```bash
   sudo apt install nvidia-driver-570-server nvidia-utils-570-server
   ```
3. Reboot:
   ```bash
   sudo reboot
   ```
4. Verify driver:
   ```bash
   nvidia-smi
   ```
   Expected: Table showing GPU, driver ~570.86.15, CUDA 12.6.

#### Install CUDA 12.6

1. Add NVIDIA CUDA repository:
   ```bash
   wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
   sudo dpkg -i cuda-keyring_1.0-1_all.deb
   sudo apt update
   ```
2. Install CUDA Toolkit:
   ```bash
   sudo apt install cuda-toolkit-12-6
   ```
3. Update environment variables:
   ```bash
   echo 'export PATH=/usr/local/cuda-12.6/bin:$PATH' >> ~/.bashrc
   echo 'export LD_LIBRARY_PATH=/usr/local/cuda-12.6/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
   source ~/.bashrc
   ```
4. Verify CUDA:
   ```bash
   nvcc --version
   ```
   Expected: `Cuda compilation tools, release 12.6`.

### 3. Set Up the Database

#### Install MySQL

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Create Database and Tables

1. Log in to MySQL:
   ```bash
   mysql -u root -p
   ```
2. Create database and tables:
   ```sql
   CREATE DATABASE deepseek_db;
   USE deepseek_db;

   CREATE TABLE products (
       id INT PRIMARY KEY,
       name VARCHAR(255),
       description TEXT,
       price DECIMAL(10,2),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   CREATE TABLE users (
       id INT PRIMARY KEY,
       username VARCHAR(255) UNIQUE,
       email VARCHAR(255) UNIQUE,
       password VARCHAR(255),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE orders (
       id INT PRIMARY KEY,
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

#### Update Database Configuration

Update `deepseek-backend/ormconfig.json` with your MySQL credentials:

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

### 4. Set Up the Flask App

#### Navigate to Flask Directory

```bash
cd deepseek-api
```

#### Set Up Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies

Create `requirements.txt`:

```plaintext
flask==3.0.3
requests==2.31.0
ollama==0.3.3
```

Install:
```bash
pip install -r requirements.txt
```

#### Configure Flask for `deepseek-coder-v2:16b`

Modify `app.py` to use `deepseek-coder-v2:16b`:

```python
from flask import Flask, request, jsonify
import ollama

app = Flask(__name__)

MODEL_NAME = 'deepseek-coder-v2:16b'

@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        response = ollama.generate(
            model=MODEL_NAME,
            prompt=f"Generate a MySQL query for: {prompt}. Use tables: products(id, name, description, price, created_at, updated_at), users(id, username, email, password, created_at), orders(id, user_id, subtotal, discount, total_price, created_at), order_products(order_id, product_id). Ensure the query is safe and valid."
        )
        return jsonify({'response': response['response']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

#### Install and Start Ollama

1. Install Ollama:
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```
2. Start Ollama server:
   ```bash
   ollama serve &
   ```
3. Pull `deepseek-coder-v2:16b`:
   ```bash
   ollama pull deepseek-coder-v2:16b
   ```
4. Verify model (uses ~10GB VRAM):
   ```bash
   nvidia-smi
   ```

#### Run Flask App

```bash
python3 app.py
```

Access at `http://localhost:8000`.

### 5. Set Up NestJS Backend

#### Navigate to Backend Directory

```bash
cd deepseek-backend
```

#### Install Dependencies

```bash
npm install
```

#### Run Backend

```bash
npm run start
```

Access at `http://localhost:3000`.

### 6. Set Up Next.js Frontend

#### Navigate to Frontend Directory

```bash
cd deepseek-frontend
```

#### Install Dependencies

```bash
npm install
```

#### Run Frontend

```bash
npm run dev
```

Access at `http://localhost:3001`.

## Usage

1. Open `http://localhost:3001`.
2. Enter prompts like:
   - "Get all products with a price greater than 500"
   - "Total orders by user"
   - "Top 5 products by order count"
3. Click "Generate" to create charts.
4. Use "Clear Charts" to reset the display.

## Example Prompts and Results

- **Prompt**: "Get all products with a price greater than 500"
  - **Query**: `SELECT name, price FROM products WHERE price > 500`
  - **Result**: Bar chart of qualifying products.
- **Prompt**: "Total orders by user"
  - **Query**: `SELECT u.username, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id`
  - **Result**: Pie chart of order counts per user.
- **Prompt**: "Top 5 products by order count"
  - **Query**: `SELECT p.name, COUNT(op.product_id) as count FROM products p JOIN order_products op ON p.id = op.product_id GROUP BY p.id ORDER BY count DESC LIMIT 5`
  - **Result**: Bar chart of top products.

## Troubleshooting

### GPU Issues

- **Error**: `nvidia-smi` not found or GPU not detected
  - Reinstall driver:
    ```bash
    sudo apt install nvidia-driver-570-server
    ```
  - Verify CUDA:
    ```bash
    nvcc --version
    ```
- **Error**: Ollama not using GPU
  - Check `nvidia-smi` for `ollama` process (~10GB VRAM).
  - Restart Ollama:
    ```bash
    pkill ollama
    ollama serve &
    ```

### Flask App Errors

- **Error**: `ModuleNotFoundError: No module named 'ollama'`
  - Install:
    ```bash
    pip install ollama
    ```
- **Error**: Flask fails to start
  - Check port 8000:
    ```bash
    lsof -i :8000
    kill -9 <PID>
    ```

### NestJS Backend Errors

- **Error**: Database connection failed
  - Verify `ormconfig.json` credentials.
  - Ensure MySQL is running:
    ```bash
    sudo systemctl start mysql
    ```

### Frontend Errors

- **Error**: Charts not displaying
  - Check browser console (Ctrl+Shift+I).
  - Test backend:
    ```bash
    curl -X POST http://localhost:3000/deepseek/prompt -H "Content-Type: application/json" -d '{"prompt": "Get all products with a price greater than 500"}'
    ```

## Future Improvements

- Support complex prompts (e.g., "Monthly sales trends").
- Add parameterized queries to prevent SQL injection.
- Enable individual chart removal.
- Enhance UI error messages.

## License

MIT License.

## Contact

Open an issue on the GitHub repository or contact maintainers for support.
