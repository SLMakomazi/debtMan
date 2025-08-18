#!/bin/bash

# Set permissions for npm
npm config set unsafe-perm true

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps

# Build frontend
echo "Building frontend..."
npm run build

# Go back to root directory
cd ..
