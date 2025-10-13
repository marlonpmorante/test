const express = require('express');
const router = express.Router();
const db = require('../db'); // Your MySQL connection

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('GET categories error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new category
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
    res.status(201).json({ message: 'Category added' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category already exists' });
    }
    console.error('POST category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit category
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  try {
    await db.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    res.json({ message: 'Category updated' });
  } catch (err) {
    console.error('PUT category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('DELETE category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
