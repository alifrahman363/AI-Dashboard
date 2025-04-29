#!/bin/bash

# File to store process IDs
PID_FILE="pids.txt"

# Function to stop all processes listed in PID_FILE
stop_processes() {
    if [ -f "$PID_FILE" ]; then
        echo "Stopping all processes listed in $PID_FILE..."
        while read -r pid; do
            if kill -0 $pid 2>/dev/null; then
                kill $pid
                echo "Stopped process $pid"
            fi
        done < "$PID_FILE"
        rm "$PID_FILE"
    else
        echo "No PID file found. No processes to stop."
    fi
}

# Check if the script is called with 'stop' argument
if [ "$1" = "stop" ]; then
    stop_processes
    exit 0
fi

# Ensure no previous processes are running (from PID_FILE)
stop_processes

# Kill processes using the required ports
echo "Killing processes using required ports..."
lsof -ti :11434 | xargs kill -9 2>/dev/null  # Ollama
lsof -ti :8000 | xargs kill -9 2>/dev/null   # Flask API
lsof -ti :3000 | xargs kill -9 2>/dev/null   # NestJS Backend
lsof -ti :3001 | xargs kill -9 2>/dev/null   # Next.js Frontend
sleep 1

# Start Ollama Server
echo "Starting Ollama server..."
export OLLAMA_NUM_PARALLEL=1
ollama serve &
OLLAMA_PID=$!
echo $OLLAMA_PID >> $PID_FILE
sleep 5

# Start Flask API (deepseek-api)
echo "Starting Flask API..."
cd /home/alif/deepseek-api || { echo "Flask API directory (/home/alif/deepseek-api) not found. Please check the directory path."; exit 1; }
source venv/bin/activate
python3 app.py &
FLASK_PID=$!
echo $FLASK_PID >> $PID_FILE
cd - > /dev/null
sleep 5

# Start Backend (be-dashboard)
echo "Starting NestJS Backend..."
cd be-dashboard || { echo "Backend directory (be-dashboard) not found. Please check the directory name."; exit 1; }
npm run start &
BACKEND_PID=$!
echo $BACKEND_PID >> ../$PID_FILE
cd ..
sleep 5  # Brief delay to ensure backend starts before frontend

# Start Frontend (fe-dashboard)
echo "Starting Next.js Frontend..."
cd fe-dashboard || { echo "Frontend directory (fe-dashboard) not found. Please check the directory name."; exit 1; }
npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID >> ../$PID_FILE
cd ..

echo "All services started. PIDs saved in $PID_FILE"
echo "To stop all services, run: ./run.sh stop"
echo "Access the application at: http://localhost:3001"