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
        if [ "$port" -eq 3002 ]; then
            # Use fuser to kill processes on port 3002
            fuser -k 3002/tcp 2>/dev/null
            sleep 1  # Brief delay to allow the system to release the port
            if ! lsof -ti :$port > /dev/null; then
                echo "Port $port is now free."
                return 0
            fi
        else
            # Use lsof and kill for other ports
            lsof -ti :$port | xargs kill -9 2>/dev/null
            sleep 1  # Brief delay to allow the system to release the port
            if ! lsof -ti :$port > /dev/null; then
                echo "Port $port is now free."
                return 0
            fi
        fi
        echo "Port $port is still in use, retrying..."
        attempt=$((attempt + 1))
    done

    echo "Error: Failed to free port $port after $retries attempts."
    return 1
}

# Function to kill required ports (only backend and frontend)
kill_required_ports() {
    echo "Killing required ports..."
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

    # Kill required ports after stopping processes
    kill_required_ports
}

# Function to wait for backend to be ready
wait_for_backend() {
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for backend to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000 > /dev/null 2>&1 || curl -s http://localhost:3000/health > /dev/null 2>&1; then
            echo "Backend is ready!"
            return 0
        fi
        echo "Waiting for backend... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "Warning: Backend may not be fully ready, but continuing with frontend startup..."
    return 1
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
kill_required_ports

# Start Backend (be-dashboard)
echo "Starting NestJS Backend..."
cd be-dashboard || { echo "Backend directory (be-dashboard) not found. Please check the directory name."; exit 1; }
npm run start &
BACKEND_PID=$!
echo $BACKEND_PID >> ../$PID_FILE
cd ..

# Wait for backend to be fully ready
wait_for_backend

# Start Frontend (fe-dashboard)
echo "Starting Next.js Frontend..."
cd fe-dashboard || { echo "Frontend directory (fe-dashboard) not found. Please check the directory name."; exit 1; }
npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID >> ../$PID_FILE
cd ..

echo "All services started. PIDs saved in $PID_FILE"
echo "Backend running on: http://localhost:3000"
echo "Frontend running on: http://localhost:3002"
echo "To stop all services, run: ./run.sh stop"
echo "Access the application at: http://localhost:3002"