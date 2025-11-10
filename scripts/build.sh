#!/bin/bash
set -e

echo "Building client..."
cd client
npm install
npm run build

echo "Building server..."
cd ../server
npm install
npm run build

echo "Build complete!"
