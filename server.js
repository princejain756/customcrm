import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// PostgreSQL connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  database: process.env.POSTGRES_DB || 'scanbill_tally',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test database connection on startup
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    console.log('🔍 Health check requested');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Health check successful');
    res.json({ 
      status: 'healthy', 
      timestamp: result.rows[0].now,
      message: 'PostgreSQL connection successful'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    console.log('🔍 Test endpoint requested');
    const client = await pool.connect();
    
    // Test organizations
    const orgResult = await client.query('SELECT COUNT(*) as count FROM organisations');
    const profileResult = await client.query('SELECT COUNT(*) as count FROM profiles');
    
    client.release();
    
    console.log('✅ Test endpoint successful');
    res.json({
      success: true,
      organizations: orgResult.rows[0].count,
      profiles: profileResult.rows[0].count,
      message: 'Database connection and queries working'
    });
  } catch (error) {
    console.error('❌ Test endpoint failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and name are required' 
      });
    }

    const client = await pool.connect();
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT * FROM profiles WHERE id = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Hash password (we'll store this in a separate auth table in production)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user profile using email as ID
    const profileResult = await client.query(
      `INSERT INTO profiles (id, name, role, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, name, 'sales_person', true, new Date(), new Date()]
    );

    client.release();

    const user = profileResult.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.id, 
        name: user.name, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.id,
        name: user.name,
        role: user.role
      },
      token,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM profiles WHERE id = $1',
      [email]
    );
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const user = result.rows[0];
    
    // For demo purposes, accept 'password123' as the default password
    // In production, you'd verify against the hashed password stored in a separate auth table
    if (password !== 'password123') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.id, 
        name: user.name, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.id,
        name: user.name,
        role: user.role
      },
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

app.post('/api/auth/validate', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user still exists in database
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM profiles WHERE id = $1 AND is_active = true',
      [decoded.id]
    );
    client.release();

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.id,
        name: user.name,
        role: user.role
      },
      message: 'Token valid'
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed' 
    });
  }
});

app.get('/api/auth/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM profiles WHERE id = $1',
      [userId]
    );
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    res.json({
      success: true,
      profile: result.rows[0],
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profile' 
    });
  }
});

app.put('/api/auth/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Ensure user can only update their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const client = await pool.connect();
    const result = await client.query(
      `UPDATE profiles 
       SET name = COALESCE($1, name), 
           role = COALESCE($2, role), 
           updated_at = $3
       WHERE id = $4 RETURNING *`,
      [updates.name, updates.role, new Date(), userId]
    );
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    res.json({
      success: true,
      profile: result.rows[0],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

// Get organizations
app.get('/api/organizations', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM organisations');
    client.release();
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leads
app.get('/api/leads', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM leads');
    client.release();
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  
  // Test database connection
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
}); 