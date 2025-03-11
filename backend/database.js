// PostgreSQL database configuration and utility functions
import pkg from 'pg';
const { Pool } = pkg;

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'taskdb',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Initialize database and create tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memories (
        id SERIAL PRIMARY KEY,
        content VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      );
    `);
    console.log('Database initialized with simplified schema');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Create a new task
async function createTask(title, data = {}) {
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, data) VALUES ($1, $2) RETURNING *',
      [title, data]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

// Get task by ID
async function getTask(id) {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
}

// Update task
async function updateTask(id, updates) {
  try {
    const { title, data, status } = updates;
    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title), 
           data = COALESCE($2, data), 
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING *`,
      [title, data, status, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

// Delete task
async function deleteTask(id) {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// Get all tasks
async function getAllTasks() {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    throw error;
  }
}

// Search tasks - supports searching by title and within JSON data
async function searchTasks(query) {
  try {
    // Build the query to search in both title and JSON description field
    const searchQuery = `
      SELECT * FROM tasks 
      WHERE title ILIKE $1 
         OR data->>'description' ILIKE $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(searchQuery, [`%${query}%`]);
    return result.rows;
  } catch (error) {
    console.error('Error searching tasks:', error);
    throw error;
  }
}

// Advanced search with filters
async function advancedSearch({ query, status, dateFrom, dateTo }) {
  try {
    let sqlQuery = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (query) {
      sqlQuery += ` AND (title ILIKE $${paramIndex} OR data->>'description' ILIKE $${paramIndex})`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    if (status) {
      sqlQuery += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (dateFrom) {
      sqlQuery += ` AND created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      sqlQuery += ` AND created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    sqlQuery += ' ORDER BY created_at DESC';
    
    const result = await pool.query(sqlQuery, params);
    return result.rows;
  } catch (error) {
    console.error('Error in advanced search:', error);
    throw error;
  }
}

// Utility to check database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

export {
  initDatabase,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getAllTasks,
  searchTasks,
  advancedSearch,
  testConnection,
  pool
}; 