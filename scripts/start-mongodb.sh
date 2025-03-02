#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if container is already running
if docker ps | grep -q "mongodb-tehuacan"; then
    echo "MongoDB container is already running."
else
    # Check if container exists but is stopped
    if docker ps -a | grep -q "mongodb-tehuacan"; then
        echo "Starting existing MongoDB container..."
        docker start mongodb-tehuacan
    else
        echo "Creating and starting MongoDB container..."
        docker run --name mongodb-tehuacan \
            -p 27017:27017 \
            -v mongodb_data:/data/db \
            -d \
            mongo:latest
    fi
fi

echo "MongoDB is running at mongodb://localhost:27017"
echo "To connect to MongoDB shell: docker exec -it mongodb-tehuacan mongosh" 