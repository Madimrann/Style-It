#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎉 Welcome to StyleIt FYP Setup!');
console.log('================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from env.example');
  } else {
    // Create basic .env file
    const envContent = `# Clarifai API Configuration
REACT_APP_CLARIFAI_API_KEY=your_clarifai_api_key_here

# Application Configuration
REACT_APP_APP_NAME=StyleIt
REACT_APP_VERSION=1.0.0`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file');
  }
  console.log('📝 Please update your Clarifai API key in .env file\n');
} else {
  console.log('✅ .env file already exists\n');
}

console.log('🚀 Setup Complete!');
console.log('\nNext steps:');
console.log('1. Get your free Clarifai API key from: https://clarifai.com');
console.log('2. Update REACT_APP_CLARIFAI_API_KEY in .env file');
console.log('3. Run: npm start');
console.log('4. Open: http://localhost:3000');
console.log('\n📱 Your StyleIt AI Fashion Assistant is ready! ✨');
