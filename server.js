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
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'autocrm',
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
    
    // Test database tables
    const orgResult = await client.query('SELECT COUNT(*) as count FROM organizations');
    const userResult = await client.query('SELECT COUNT(*) as count FROM users');
    const leadResult = await client.query('SELECT COUNT(*) as count FROM leads');
    
    client.release();
    
    console.log('✅ Test endpoint successful');
    res.json({
      success: true,
      organizations: orgResult.rows[0].count,
      users: userResult.rows[0].count,
      leads: leadResult.rows[0].count,
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
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get default organization
    const orgResult = await client.query('SELECT id FROM organizations LIMIT 1');
    const organizationId = orgResult.rows.length > 0 ? orgResult.rows[0].id : null;

    // Create user (let PostgreSQL generate UUID for id)
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role, organization_id, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, name, role`,
      [email, hashedPassword, name, 'sales_person', organizationId, true, new Date(), new Date()]
    );

    client.release();

    const user = userResult.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
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
        email: user.email,
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
    console.log('🔍 Login attempt received:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    console.log('🔍 Looking up user:', email);
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    client.release();
    
    if (result.rows.length === 0) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const user = result.rows[0];
    console.log('✅ User found:', user.email, 'Role:', user.role);
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log('🔍 Password match:', passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    const updateClient = await pool.connect();
    await updateClient.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    updateClient.release();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
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
        email: user.email,
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
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
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
        email: user.email,
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
      'SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE id = $1',
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
      `UPDATE users 
       SET name = COALESCE($1, name), 
           role = COALESCE($2, role), 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING id, email, name, role, is_active, created_at, updated_at`,
      [updates.name, updates.role, userId]
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
    const result = await client.query('SELECT * FROM organizations');
    client.release();
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Products endpoints
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Getting products for user:', req.user.id);
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT * FROM products 
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = $1)
      AND is_active = true
      ORDER BY name ASC
    `, [req.user.id]);
    
    client.release();
    console.log(`✅ Found ${result.rows.length} products`);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { sku, name, description, price, stock, category } = req.body;

    if (!sku || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'SKU, name, and price are required'
      });
    }

    console.log('🔍 Creating product:', { sku, name, price });
    const client = await pool.connect();

    // Get user's organization
    const userResult = await client.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const organizationId = userResult.rows[0].organization_id;

    // Check if SKU already exists
    const existingProduct = await client.query(
      'SELECT id FROM products WHERE sku = $1 AND organization_id = $2',
      [sku, organizationId]
    );

    if (existingProduct.rows.length > 0) {
      client.release();
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }

    // Insert new product
    const result = await client.query(`
      INSERT INTO products (
        sku, name, description, price, stock, category, organization_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [sku, name, description, price, stock || 0, category || 'General', organizationId, true]);

    client.release();

    console.log('✅ Product created successfully:', result.rows[0].sku);
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('❌ Create product error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create product'
    });
  }
});

// Customers endpoints
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Getting customers for user:', req.user.id);
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT * FROM customers 
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = $1)
      ORDER BY name ASC
    `, [req.user.id]);
    
    client.release();
    console.log(`✅ Found ${result.rows.length} customers`);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Get customers error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, company, address, gstin, billing_address, shipping_address } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    console.log('🔍 Creating customer:', { name, email, company });
    const client = await pool.connect();

    // Get user's organization
    const userResult = await client.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const organizationId = userResult.rows[0].organization_id;

    // Insert new customer
    const result = await client.query(`
      INSERT INTO customers (
        name, email, phone, company, address, gstin, billing_address, shipping_address, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [name, email, phone, company, address, gstin, billing_address, shipping_address, organizationId]);

    client.release();

    console.log('✅ Customer created successfully:', result.rows[0].name);
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('❌ Create customer error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create customer'
    });
  }
});

// Orders endpoints
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Getting orders for user:', req.user.id);
    const client = await pool.connect();
    
    // Get orders with customer information and items
    const result = await client.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.company as customer_company,
        u.name as created_by_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.organization_id = (SELECT organization_id FROM users WHERE id = $1)
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    
    // Get order items for each order
    for (const order of result.rows) {
      const itemsResult = await client.query(`
        SELECT * FROM order_items 
        WHERE order_id = $1 
        ORDER BY created_at
      `, [order.id]);
      order.items = itemsResult.rows;
    }
    
    client.release();
    console.log(`✅ Found ${result.rows.length} orders`);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Get orders error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const {
      customer_id,
      order_date,
      delivery_date,
      status = 'draft',
      priority = 'medium',
      payment_terms = 'net30',
      shipping_address,
      billing_address,
      notes,
      items = []
    } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one order item is required'
      });
    }

    console.log('🔍 Creating order for customer:', customer_id);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get user's organization
      const userResult = await client.query(
        'SELECT organization_id FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const organizationId = userResult.rows[0].organization_id;

      // Verify customer belongs to organization
      const customerResult = await client.query(
        'SELECT id FROM customers WHERE id = $1 AND organization_id = $2',
        [customer_id, organizationId]
      );

      if (customerResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // Calculate totals
      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      for (const item of items) {
        const itemTotal = item.quantity * item.unit_price;
        const discount = item.discount || 0;
        const taxRate = item.tax_rate || 0.18; // Default 18% GST
        const taxAmount = (itemTotal - discount) * taxRate;
        
        subtotal += itemTotal;
        totalDiscount += discount;
        totalTax += taxAmount;
      }

      const totalAmount = subtotal - totalDiscount + totalTax;

      // Insert new order
      const orderResult = await client.query(`
        INSERT INTO orders (
          order_number, customer_id, order_date, delivery_date, status, priority, 
          payment_terms, subtotal, tax_amount, discount_amount, total_amount,
          shipping_address, billing_address, notes, organization_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        orderNumber, customer_id, order_date, delivery_date, status, priority,
        payment_terms, subtotal, totalTax, totalDiscount, totalAmount,
        shipping_address, billing_address, notes, organizationId, req.user.id
      ]);

      const order = orderResult.rows[0];

      // Insert order items
      const orderItems = [];
      for (const item of items) {
        const itemTotal = item.quantity * item.unit_price;
        const discount = item.discount || 0;
        const taxRate = item.tax_rate || 0.18;
        const taxAmount = (itemTotal - discount) * taxRate;
        const totalPrice = itemTotal - discount + taxAmount;

        const itemResult = await client.query(`
          INSERT INTO order_items (
            order_id, product_id, product_sku, product_name, quantity, 
            unit_price, discount, total_price, tax_rate, tax_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          order.id, item.product_id, item.product_sku, item.product_name,
          item.quantity, item.unit_price, discount, totalPrice, taxRate, taxAmount
        ]);

        orderItems.push(itemResult.rows[0]);
      }

      await client.query('COMMIT');
      client.release();

      console.log('✅ Order created successfully:', orderNumber);
      res.status(201).json({
        success: true,
        data: {
          ...order,
          items: orderItems
        },
        message: 'Order created successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create order'
    });
  }
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Getting order:', id);
    
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.company as customer_company,
        u.name as created_by_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = $1 AND o.organization_id = (SELECT organization_id FROM users WHERE id = $2)
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items
    const itemsResult = await client.query(`
      SELECT * FROM order_items 
      WHERE order_id = $1 
      ORDER BY created_at
    `, [id]);

    client.release();

    console.log('✅ Order retrieved successfully');
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('❌ Get order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get leads
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Getting leads for user:', req.user.id);
    const client = await pool.connect();
    
    // Get leads with related information
    const result = await client.query(`
      SELECT 
        l.*,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        cb.name as created_by_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users cb ON l.created_by = cb.id
      WHERE l.organization_id = (SELECT organization_id FROM users WHERE id = $1)
      ORDER BY l.created_at DESC
    `, [req.user.id]);
    
    client.release();
    console.log(`✅ Found ${result.rows.length} leads`);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Get leads error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Create lead
app.post('/api/leads', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      position,
      address,
      source,
      status = 'new',
      priority = 'medium',
      notes
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Lead name is required'
      });
    }

    console.log('🔍 Creating lead:', { name, email, company });
    const client = await pool.connect();

    // Get user's organization
    const userResult = await client.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const organizationId = userResult.rows[0].organization_id;

    // Insert new lead
    const result = await client.query(`
      INSERT INTO leads (
        name, email, phone, company, position, address, source, status, priority, notes, assigned_to, organization_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      name, email, phone, company, position, address, source || 'other',
      status, priority, notes, req.user.id, organizationId, req.user.id
    ]);

    // Log the lead creation activity
    // If you have a lead_activities table, log the creation activity there
    await client.query(`
      INSERT INTO lead_activities (lead_id, activity_type, title, description, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      result.rows[0].id,
      'note',
      'Lead Created',
      `Lead created by ${req.user.name}`,
      req.user.id
    ]);

    client.release();

    console.log('✅ Lead created successfully:', result.rows[0].id);
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Lead created successfully'
    });
  } catch (error) {
    console.error('❌ Create lead error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create lead'
    });
  }
});

// Get single lead
app.get('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Getting lead:', id);
    
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        l.*,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        cb.name as created_by_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users cb ON l.created_by = cb.id
      WHERE l.id = $1 AND l.organization_id = (SELECT organization_id FROM users WHERE id = $2)
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Get lead activities
    const activitiesResult = await client.query(`
      SELECT 
        la.*,
        u.name as created_by_name
      FROM lead_activities la
      LEFT JOIN users u ON la.created_by = u.id
      WHERE la.lead_id = $1
      ORDER BY la.activity_date DESC
    `, [id]);

    client.release();

    console.log('✅ Lead retrieved successfully');
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        activities: activitiesResult.rows
      }
    });
  } catch (error) {
    console.error('❌ Get lead error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update lead
app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('🔍 Updating lead:', id);
    const client = await pool.connect();

    // Check if lead exists and belongs to user's organization
    const existingLead = await client.query(`
      SELECT * FROM leads 
      WHERE id = $1 AND organization_id = (SELECT organization_id FROM users WHERE id = $2)
    `, [id, req.user.id]);

    if (existingLead.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Update lead
    const result = await client.query(`
      UPDATE leads SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        company = COALESCE($4, company),
        position = COALESCE($5, position),
        address = COALESCE($6, address),
        source = COALESCE($7, source),
        status = COALESCE($8, status),
        priority = COALESCE($9, priority),
        notes = COALESCE($10, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
      updates.name, updates.email, updates.phone, updates.company,
      updates.position, updates.address, updates.source, updates.status,
      updates.priority, updates.notes, id
    ]);

    // Log the update activity
    await client.query(`
      INSERT INTO lead_activities (lead_id, activity_type, title, description, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      id,
      'note',
      'Lead Updated',
      `Lead information updated by ${req.user.name}`,
      req.user.id
    ]);

    client.release();

    console.log('✅ Lead updated successfully');
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Lead updated successfully'
    });
  } catch (error) {
    console.error('❌ Update lead error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete lead
app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Deleting lead:', id);
    
    const client = await pool.connect();

    // Check if lead exists and belongs to user's organization
    const existingLead = await client.query(`
      SELECT * FROM leads 
      WHERE id = $1 AND organization_id = (SELECT organization_id FROM users WHERE id = $2)
    `, [id, req.user.id]);

    if (existingLead.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Delete lead (activities will be deleted by CASCADE)
    await client.query('DELETE FROM leads WHERE id = $1', [id]);
    client.release();

    console.log('✅ Lead deleted successfully');
    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete lead error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats/:organisationId', authenticateToken, async (req, res) => {
  try {
    const { organisationId } = req.params;
    console.log('🔍 Getting dashboard stats for organisation:', organisationId);
    
    const client = await pool.connect();
    
    // Get user's organization for filtering data
    const userResult = await client.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userOrganizationId = userResult.rows[0].organization_id;
    
    // Get total revenue from orders
    const revenueResult = await client.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders 
      WHERE organization_id = $1
    `, [userOrganizationId]);

    // Get active customers count
    const customersResult = await client.query(`
      SELECT COUNT(*) as active_customers
      FROM customers 
      WHERE organization_id = $1
    `, [userOrganizationId]);

    // Get pending bills count (assuming orders with draft or pending status)
    const billsResult = await client.query(`
      SELECT COUNT(*) as pending_bills
      FROM orders 
      WHERE organization_id = $1 AND status IN ('draft', 'pending')
    `, [userOrganizationId]);

    // Get recent leads (last 5)
    const leadsResult = await client.query(`
      SELECT l.*, u.name as assigned_to_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.organization_id = $1
      ORDER BY l.created_at DESC
      LIMIT 5
    `, [userOrganizationId]);

    // Get recent orders (last 5)
    const ordersResult = await client.query(`
      SELECT o.*, c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.organization_id = $1
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [userOrganizationId]);

    client.release();

    const stats = {
      total_revenue: parseFloat(revenueResult.rows[0].total_revenue) || 0,
      active_customers: parseInt(customersResult.rows[0].active_customers) || 0,
      pending_bills: parseInt(billsResult.rows[0].pending_bills) || 0,
      growth_percentage: 0, // Calculate based on your business logic
      recent_leads: leadsResult.rows,
      recent_orders: ordersResult.rows
    };

    console.log('✅ Dashboard stats retrieved successfully');
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
