const fs = require('fs');
const path = require('path');

const frontendEnvPath = path.join(__dirname, 'frontend', '.env');

// Check if .env file already exists
if (!fs.existsSync(frontendEnvPath)) {
  const envContent = `# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Environment
NODE_ENV=development

# Authentication
REACT_APP_AUTH_TOKEN_KEY=debt_manager_auth_token

# Feature Flags
REACT_APP_ENABLE_CREDIT_SCORE=true
REACT_APP_ENABLE_PAYMENTS=true

# Google Analytics (optional)
# REACT_APP_GA_TRACKING_ID=UA-XXXXX-X
`;

  fs.writeFileSync(frontendEnvPath, envContent);
  console.log('✅ Frontend .env file created successfully');
} else {
  console.log('ℹ️  Frontend .env file already exists');
}

// Update backend .env with frontend URL if needed
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  let backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  
  if (!backendEnv.includes('FRONTEND_URL')) {
    backendEnv += '\n# Frontend URL for CORS\nFRONTEND_URL=http://localhost:3000\n';
    fs.writeFileSync(backendEnvPath, backendEnv);
    console.log('✅ Backend .env updated with FRONTEND_URL');
  }
}
