import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testAuth() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const health = await fetch(`${API_BASE}/health`);
    const healthData = await health.json();
    console.log('✅ Health check:', healthData.status);

    // Test 2: Register new user
    console.log('\n2. Testing user registration...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
    });
    const registerData = await registerResponse.json();
    console.log('✅ Registration:', registerData.success ? 'SUCCESS' : 'FAILED');
    if (registerData.success) {
      console.log('   User:', registerData.user.name);
      console.log('   Token received:', !!registerData.token);
    }

    // Test 3: Login
    console.log('\n3. Testing login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login:', loginData.success ? 'SUCCESS' : 'FAILED');
    if (loginData.success) {
      console.log('   User:', loginData.user.name);
      console.log('   Token received:', !!loginData.token);
    }

    // Test 4: Validate token
    if (loginData.token) {
      console.log('\n4. Testing token validation...');
      const validateResponse = await fetch(`${API_BASE}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: loginData.token })
      });
      const validateData = await validateResponse.json();
      console.log('✅ Token validation:', validateData.success ? 'SUCCESS' : 'FAILED');
    }

    // Test 5: Get profile
    if (loginData.token) {
      console.log('\n5. Testing profile retrieval...');
      const profileResponse = await fetch(`${API_BASE}/auth/profile/${loginData.user.id}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      const profileData = await profileResponse.json();
      console.log('✅ Profile retrieval:', profileData.success ? 'SUCCESS' : 'FAILED');
    }

    // Test 6: Get organizations
    console.log('\n6. Testing organizations endpoint...');
    const orgResponse = await fetch(`${API_BASE}/organizations`);
    const orgData = await orgResponse.json();
    console.log('✅ Organizations:', Array.isArray(orgData) ? `${orgData.length} found` : 'FAILED');

    console.log('\n🎉 Authentication flow test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Login with: admin@example.com / password123');
    console.log('   3. Or register a new account');
    console.log('   4. Test the full application functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth(); 