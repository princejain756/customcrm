import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    // Check if response has content
    const text = await response.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log(`❌ ${method} ${endpoint}: Invalid JSON response - "${text}"`);
      return { success: false, status: response.status, error: 'Invalid JSON response' };
    }

    console.log(`✅ ${method} ${endpoint}: ${response.status}`);
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🔍 Testing API endpoints...\n');

  // Test health endpoint
  await testEndpoint('/health');

  // Test authentication endpoints
  await testEndpoint('/auth/register', 'POST', {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  });

  await testEndpoint('/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'password123'
  });

  // Test data endpoints
  await testEndpoint('/organizations');
  await testEndpoint('/leads');

  // Test test endpoint
  await testEndpoint('/test');

  console.log('\n✅ API testing completed!');
}

runTests().catch(console.error); 