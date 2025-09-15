#!/bin/bash

# Install Chrome for Puppeteer
echo "📦 Installing Chrome for Puppeteer..."
apt-get update
apt-get install -y wget gnupg
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list
apt-get update
apt-get install -y google-chrome-stable

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build the frontend
echo "🏗️ Building frontend..."
npm run build

# Install Puppeteer browsers
echo "🤖 Installing Puppeteer browsers..."
cd server
npx puppeteer browsers install chrome

echo "✅ Build completed successfully!"