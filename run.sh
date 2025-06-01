#!/bin/bash

# Enhanced script with logging and model status monitoring
# File to store process IDs
PID_FILE="pids.txt"
LOG_DIR="logs"
DATE=$(date +"%Y%m%d_%H%M%S")

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Color codes for better console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# Function to log to file and console
log_message() {
    local message="$1"
    local log_file="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$log_file"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -ti :$port > /dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill a process on a specific port and verify it's freed
kill_port() {
    local port=$1
    local service_name=$2
    local retries=3
    local attempt=1
    
    print_status $YELLOW "Checking port $port ($service_name)..."
    
    if ! check_port $port; then
        print_status $GREEN "Port $port is already free."
        return 0
    fi
    
    while [ $attempt -le $retries ]; do
        print_status $YELLOW "Attempt $attempt: Killing processes using port $port ($service_name)..."
        
        if [ "$port" -eq 3002 ]; then
            # Use fuser to kill processes on port 3002
            fuser -k 3002/tcp 2>/dev/null
        else
            # Use lsof and kill for other ports
            lsof -ti :$port | xargs kill -9 2>/dev/null
        fi
        
        sleep 2  # Increased delay to allow the system to release the port
        
        if ! check_port $port; then
            print_status $GREEN "Port $port is now free."
            return 0
        fi
        
        print_status $RED "Port $port is still in use, retrying..."
        attempt=$((attempt + 1))
    done
    
    print_status $RED "Error: Failed to free port $port after $retries attempts."
    return 1
}

# Function to kill all required ports
kill_all_ports() {
    print_status $CYAN "Killing all required ports..."
    kill_port 11434 "Ollama"
    kill_port 8000 "Flask API"
    kill_port 3000 "NestJS Backend"
    kill_port 3002 "Next.js Frontend"
}

# Function to check model availability
check_model_status() {
    local max_attempts=10
    local attempt=1
    
    print_status $CYAN "Checking DeepSeek Coder v2 model availability..."
    
    while [ $attempt -le $max_attempts ]; do
        print_status $YELLOW "Attempt $attempt: Checking model status..."
        
        # Check if Ollama is responding
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            # Check if DeepSeek model is available
            local model_check=$(curl -s http://localhost:11434/api/tags | grep -o "deepseek-coder-v2:16b" || echo "")
            
            if [ -n "$model_check" ]; then
                print_status $GREEN "✅ DeepSeek Coder v2:16b model is available!"
                return 0
            else
                print_status $YELLOW "⚠️  DeepSeek Coder v2:16b model not found. Available models:"
                curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "Unable to fetch model list"
            fi
        else
            print_status $YELLOW "Ollama server not ready yet..."
        fi
        
        sleep 3
        attempt=$((attempt + 1))
    done
    
    print_status $RED "❌ Failed to verify DeepSeek Coder v2:16b model after $max_attempts attempts"
    return 1
}

# Function to monitor Flask API health
check_flask_health() {
    local max_attempts=10
    local attempt=1
    
    print_status $CYAN "Checking Flask API health..."
    
    while [ $attempt -le $max_attempts ]; do
        print_status $YELLOW "Attempt $attempt: Checking Flask API health..."
        
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            local health_response=$(curl -s http://localhost:8000/health)
            local status=$(echo "$health_response" | jq -r '.status' 2>/dev/null || echo "unknown")
            local model_available=$(echo "$health_response" | jq -r '.model_available' 2>/dev/null || echo "unknown")
            
            print_status $GREEN "✅ Flask API is healthy!"
            print_status $BLUE "   Status: $status"
            print_status $BLUE "   Model Available: $model_available"
            print_status $BLUE "   Full Response: $health_response"
            return 0
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_status $RED "❌ Flask API health check failed after $max_attempts attempts"
    return 1
}

# Function to stop all processes listed in PID_FILE and kill ports
stop_processes() {
    print_status $CYAN "Stopping all services..."
    
    if [ -f "$PID_FILE" ]; then
        print_status $YELLOW "Stopping all processes listed in $PID_FILE..."
        while read -r pid; do
            if kill -0 $pid 2>/dev/null; then
                kill $pid
                print_status $GREEN "Stopped process $pid"
            fi
        done < "$PID_FILE"
        rm "$PID_FILE"
    else
        print_status $YELLOW "No PID file found. No processes to stop."
    fi
    
    # Kill all required ports after stopping processes
    kill_all_ports
    print_status $GREEN "All services stopped."
}

# Function to monitor service status
monitor_services() {
    print_status $CYAN "=== SERVICE STATUS SUMMARY ==="
    
    # Check Ollama
    if check_port 11434; then
        print_status $GREEN "✅ Ollama Server: Running (Port 11434)"
    else
        print_status $RED "❌ Ollama Server: Not Running"
    fi
    
    # Check Flask API
    if check_port 8000; then
        print_status $GREEN "✅ Flask API: Running (Port 8000)"
    else
        print_status $RED "❌ Flask API: Not Running"
    fi
    
    # Check NestJS Backend
    if check_port 3000; then
        print_status $GREEN "✅ NestJS Backend: Running (Port 3000)"
    else
        print_status $RED "❌ NestJS Backend: Not Running"
    fi
    
    # Check Next.js Frontend
    if check_port 3002; then
        print_status $GREEN "✅ Next.js Frontend: Running (Port 3002)"
    else
        print_status $RED "❌ Next.js Frontend: Not Running"
    fi
    
    print_status $CYAN "================================"
}

# Trap SIGINT (Ctrl+C) to ensure cleanup
trap 'echo ""; print_status $RED "Script interrupted. Cleaning up..."; stop_processes; exit 1' SIGINT

# Check if the script is called with arguments
case "$1" in
    "stop")
        stop_processes
        exit 0
        ;;
    "status")
        monitor_services
        exit 0
        ;;
    "restart")
        print_status $CYAN "Restarting all services..."
        stop_processes
        sleep 3
        ;;
    "")
        # Default behavior - start services
        ;;
    *)
        echo "Usage: $0 [stop|status|restart]"
        echo "  stop    - Stop all services"
        echo "  status  - Check service status"
        echo "  restart - Restart all services"
        echo "  (no arg) - Start all services"
        exit 1
        ;;
esac

print_status $PURPLE "=== STARTING AI DASHBOARD SERVICES ==="

# Ensure no previous processes are running (from PID_FILE)
stop_processes

# Kill processes using the required ports with retry mechanism
print_status $CYAN "Killing processes using required ports before starting services..."
kill_all_ports

# Start Ollama Server
print_status $CYAN "Starting Ollama server..."
export OLLAMA_NUM_PARALLEL=1
ollama serve > "$LOG_DIR/ollama_${DATE}.log" 2>&1 &
OLLAMA_PID=$!
echo $OLLAMA_PID >> $PID_FILE
print_status $GREEN "Ollama server started with PID: $OLLAMA_PID"

# Wait for Ollama to be ready and check model
sleep 8
check_model_status

# Start Flask API (deepseek-api)
print_status $CYAN "Starting Flask API..."
cd /home/ailab/deepseek-coder-api || { 
    print_status $RED "Flask API directory (/home/ailab/deepseek-coder-api) not found. Please check the directory path."
    exit 1 
}

source venv/bin/activate
python3 app.py > "../$LOG_DIR/flask_api_${DATE}.log" 2>&1 &
FLASK_PID=$!
echo $FLASK_PID >> "../$PID_FILE"
print_status $GREEN "Flask API started with PID: $FLASK_PID"
cd - > /dev/null

# Wait for Flask API to be ready and check health
sleep 8
check_flask_health

# Start Backend (be-dashboard)
print_status $CYAN "Starting NestJS Backend..."
cd be-dashboard || { 
    print_status $RED "Backend directory (be-dashboard) not found. Please check the directory name."
    exit 1
}

npm run start > "../$LOG_DIR/nestjs_backend_${DATE}.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID >> ../$PID_FILE
print_status $GREEN "NestJS Backend started with PID: $BACKEND_PID"
cd ..

sleep 8  # Increased delay to ensure backend starts before frontend

# Start Frontend (fe-dashboard)
print_status $CYAN "Starting Next.js Frontend..."
cd fe-dashboard || { 
    print_status $RED "Frontend directory (fe-dashboard) not found. Please check the directory name."
    exit 1
}

npm run dev > "../$LOG_DIR/nextjs_frontend_${DATE}.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID >> ../$PID_FILE
print_status $GREEN "Next.js Frontend started with PID: $FRONTEND_PID"
cd ..

sleep 5

# Final status check
print_status $PURPLE "=== STARTUP COMPLETE ==="
monitor_services

print_status $GREEN "All services started successfully!"
print_status $BLUE "PIDs saved in: $PID_FILE"
print_status $BLUE "Logs saved in: $LOG_DIR/"
print_status $YELLOW "Commands available:"
print_status $YELLOW "  ./run.sh stop    - Stop all services"
print_status $YELLOW "  ./run.sh status  - Check service status"
print_status $YELLOW "  ./run.sh restart - Restart all services"
print_status $CYAN "Access the application at: http://localhost:3002"

# Keep the script running and provide periodic status updates
print_status $CYAN "Monitoring services... (Press Ctrl+C to stop)"
while true; do
    sleep 30
    print_status $BLUE "=== Periodic Status Check ==="
    
    # Quick health check for Flask API
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        health_response=$(curl -s http://localhost:8000/health)
        model_status=$(echo "$health_response" | jq -r '.model_available' 2>/dev/null || echo "unknown")
        print_status $GREEN "Flask API & DeepSeek Model: Healthy (Model Available: $model_status)"
    else
        print_status $RED "Flask API: Not responding"
    fi
done