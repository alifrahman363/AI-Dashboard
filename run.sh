#!/bin/bash

# File to store process IDs
PID_FILE="pids.txt"

# Function to kill a process on a specific port and verify it's freed
kill_port() {
    local port=$1
    local service_name=$2
    local retries=3
    local attempt=1

    while [ $attempt -le $retries ]; do
        echo "Attempt $attempt: Killing processes using port $port ($service_name)..."
        lsof -ti :$port | xargs kill -9 2>/dev/null
        sleep 1  # Brief delay to allow the system to release the port
        if ! lsof -ti :$port > /dev/null; then
            echo "Port $port is now free."
            return 0
        fi
        echo "Port $port is still in use, retrying..."
        attempt=$((attempt + 1))
    done

    echo "Error: Failed to free port $port after $retries attempts."
    return 1
}

# Function to kill all required ports
kill_all_ports() {
    echo "Killing all required ports..."
    kill_port 11434 "Ollama"
    kill_port 8000 "Flask API"
    kill_port 3000 "NestJS Backend"
    kill_port 3002 "Next.js Frontend"
}

# Function to stop all processes listed in PID_FILE and kill ports
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

    # Kill all required ports after stopping processes
    kill_all_ports
}

# Trap SIGINT (Ctrl+C) to ensure cleanup
trap 'echo "Script interrupted. Cleaning up..."; stop_processes; exit 1' SIGINT

# Check if the script is called with 'stop' argument
if [ "$1" = "stop" ]; then
    stop_processes
    exit 0
fi

# Ensure no previous processes are running (from PID_FILE)
stop_processes

# Kill processes using the required ports with retry mechanism
echo "Killing processes using required ports before starting services..."
kill_all_ports

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
echo "Access the application at: http://localhost:3002"

# Optional: Comment showing how to kill a port manually
# fuser -k 3002/tcp