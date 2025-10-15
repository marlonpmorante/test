// index.js
const express = require('express');
const mysql = require('mysql2/promise'); // Using promise-based version
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
// Respect environment PORT in production
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all origins (for development)
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
// Trust reverse proxies (needed for accurate req.protocol on Railway)
app.set('trust proxy', 1);
// Serve static images from the 'uploads' directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir); // Create 'uploads' directory if it doesn't exist
}
app.use('/uploads', express.static(uploadsDir));

// Helper to build absolute URLs behind proxies (e.g., Railway)
function getBaseUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    return `${proto}://${host}`;
}

// Database connection pool using environment variables
// Define DB_* variables in your environment or a .env file
// Example:
// DB_HOST=localhost
// DB_USER=root
// DB_PASSWORD=yourpassword
// DB_NAME=drugstore
// DB_PORT=3306
const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'drugstore',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : (process.env.MYSQLPORT ? parseInt(process.env.MYSQLPORT, 10) : 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Connected to MySQL database!');
        connection.release(); // Release the connection back to the pool
    })
    .catch(err => {
        console.error('Error connecting to MySQL:', err.message);
        // You should see a successful connection log or a different error (e.g., wrong password)
        process.exit(1); // Exit the process if unable to connect to the database
    });

// Multer storage configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // Files will be stored in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });


// --- API Endpoints for Products ---
// GET all products
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products');
        // Prepend base URL to image paths for frontend consumption
        const productsWithImageUrls = rows.map(product => ({
            ...product,
            imageUrl: product.imageUrl ? `${getBaseUrl(req)}/uploads/${path.basename(product.imageUrl)}` : null
        }));
        res.json(productsWithImageUrls);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Error fetching products', error: err.message });
    }
});

// POST a new product with image upload
app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const {
            medicineId, supplierName, medicineName, genericName,
            brandName, category, description, form, strength,
            unit, reorderLevel, price, quantity, deliveryDate, barcode
        } = req.body;

        if (!medicineId || !supplierName || !genericName || !brandName || !category || !price || !quantity || !deliveryDate || !barcode) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        const imageUrl = req.file ? req.file.path : null; // Path where the image is saved on the server

        const [result] = await pool.query(
            `INSERT INTO products (medicineId, supplierName, medicineName, genericName, brandName, category, description, form, strength, unit, reorderLevel, price, quantity, deliveryDate, imageUrl, barcode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                medicineId, supplierName, medicineName, genericName,
                brandName, category, description, form, strength,
                unit, reorderLevel, price, quantity, deliveryDate, imageUrl, barcode
            ]
        );

        const newProduct = {
            id: result.insertId,
            medicineId, supplierName, medicineName, genericName,
            brandName, category, description, form, strength,
            unit, reorderLevel, price, quantity, deliveryDate,
            imageUrl: imageUrl ? `${getBaseUrl(req)}/uploads/${path.basename(imageUrl)}` : null,
            barcode
        };

        res.status(201).json({ message: 'Product added successfully!', product: newProduct });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A product with this Medicine ID or Barcode already exists.', error: err.message });
        }
        console.error('Error adding product:', err);
        res.status(500).json({ message: 'Error adding product', error: err.message });
    }
});

// PUT (Update) an existing product with optional image upload
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            medicineId, supplierName, medicineName, genericName,
            brandName, category, description, form, strength,
            unit, reorderLevel, price, quantity, deliveryDate, barcode
        } = req.body;

        if (!medicineId || !supplierName || !genericName || !brandName || !category || !price || !quantity || !deliveryDate || !barcode) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        let imageUrl = req.file ? req.file.path : null;

        // Fetch current product to handle image deletion if a new one is uploaded
        const [currentProducts] = await pool.query('SELECT imageUrl FROM products WHERE id = ?', [id]);
        const currentProduct = currentProducts[0];

        if (req.file && currentProduct && currentProduct.imageUrl) {
            // Delete old image if a new one is uploaded
            const oldImagePath = path.join(uploadsDir, path.basename(currentProduct.imageUrl));
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
                console.log(`Deleted old image: ${oldImagePath}`);
            }
        } else if (!req.file && currentProduct && currentProduct.imageUrl) {
            // If no new file and previous image exists, retain the old image URL
            imageUrl = currentProduct.imageUrl;
        }

        const [result] = await pool.query(
            `UPDATE products SET
                medicineId = ?, supplierName = ?, medicineName = ?, genericName = ?,
                brandName = ?, category = ?, description = ?, form = ?, strength = ?,
                unit = ?, reorderLevel = ?, price = ?, quantity = ?, deliveryDate = ?,
                imageUrl = ?, barcode = ?
             WHERE id = ?`,
            [
                medicineId, supplierName, medicineName, genericName,
                brandName, category, description, form, strength,
                unit, reorderLevel, price, quantity, deliveryDate, imageUrl, barcode, id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const updatedProduct = {
            id: parseInt(id),
            medicineId, supplierName, medicineName, genericName,
            brandName, category, description, form, strength,
            unit, reorderLevel, price, quantity, deliveryDate,
            imageUrl: imageUrl ? `${getBaseUrl(req)}/uploads/${path.basename(imageUrl)}` : null,
            barcode
        };

        res.json({ message: 'Product updated successfully!', product: updatedProduct });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A product with this Medicine ID or Barcode already exists.', error: err.message });
        }
        console.error('Error updating product:', err);
        res.status(500).json({ message: 'Error updating product', error: err.message });
    }
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch product to delete its image file
        const [products] = await pool.query('SELECT imageUrl FROM products WHERE id = ?', [id]);
        const product = products[0];

        if (product && product.imageUrl) {
            const imagePath = path.join(uploadsDir, path.basename(product.imageUrl));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`Deleted image file: ${imagePath}`);
            }
        }

        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.json({ message: 'Product deleted successfully!' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Error deleting product', error: err.message });
    }
});



// --- API Endpoints for Categories ---
// GET all categories
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Error fetching categories', error: err.message });
    }
});

// POST a new category
app.post('/api/categories', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }
        const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
        res.status(201).json({ message: 'Category added successfully!', category: { id: result.insertId, name } });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Category already exists.' });
        }
        console.error('Error adding category:', err);
        res.status(500).json({ message: 'Error adding category', error: err.message });
    }
});

// PUT (Update) a category
app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        const [result] = await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category updated successfully!', category: { id: parseInt(id), name } });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Category name already exists.' });
        }
        console.error('Error updating category:', err);
        res.status(500).json({ message: 'Error updating category', error: err.message });
    }
});

// DELETE a category
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if any products are associated with this category
        const [productsCount] = await pool.query('SELECT COUNT(*) AS count FROM products WHERE category = (SELECT name FROM categories WHERE id = ?)', [id]);
        if (productsCount[0].count > 0) {
            return res.status(400).json({ message: 'Cannot delete category as products are still assigned to it.' });
        }

        const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category deleted successfully!' });
    } catch (err) {
        console.error('Error deleting category:', err);
        res.status(500).json({ message: 'Error deleting category', error: err.message });
    }
});


// --- API Endpoints for Receipts/Orders ---
// POST a new receipt
app.post('/api/receipts', async (req, res) => {
    const connection = await pool.getConnection(); // Get a connection from the pool
    try {
        await connection.beginTransaction(); // Start a transaction

        const {
            customerName, customerAddress, customerTin,
            totalPrice, discountPercent, discountAmount,
            netPay, cashGiven, changeAmount, paymentMethod,
            vatableSale, vatAmount, transaction_date, cart
        } = req.body;

        // 1. Insert into receipts table
        const [receiptResult] = await connection.query(
            `INSERT INTO receipts (
                customer_name, customer_address, customer_tin,
                total_price, discount_percent, discount_amount,
                net_pay, cash_given, change_amount, payment_method,
                vatable_sale, vat_amount, transaction_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                customerName, customerAddress, customerTin,
                totalPrice, discountPercent, discountAmount,
                netPay, cashGiven, changeAmount, paymentMethod,
                vatableSale, vatAmount, transaction_date
            ]
        );

        const receiptId = receiptResult.insertId;

        // 2. Insert into receipt_items table for each item in the cart
        for (const item of cart) {
            await connection.query(
                `INSERT INTO receipt_items (
                    receipt_id, product_id, product_name, quantity, price
                ) VALUES (?, ?, ?, ?, ?)`,
                [receiptId, item.id, item.name, item.quantity, item.price]
            );

            // Optionally, update product quantity in the products table
            await connection.query(
                'UPDATE products SET quantity = quantity - ? WHERE id = ?',
                [item.quantity, item.id]
            );
        }

        await connection.commit(); // Commit the transaction
        res.status(201).json({ message: 'Receipt saved successfully!', receiptId: receiptId });

    } catch (err) {
        await connection.rollback(); // Rollback the transaction in case of error
        console.error('Error saving receipt:', err);
        res.status(500).json({ message: 'Error saving receipt', error: err.message });
    } finally {
        connection.release(); // Release the connection back to the pool
    }
});

// GET all receipts with their items
app.get('/api/receipts', async (req, res) => {
    try {
        // Fetch all receipts
        const [receipts] = await pool.query('SELECT * FROM receipts ORDER BY transaction_date DESC');

        // For each receipt, fetch its associated items
        const receiptsWithItems = await Promise.all(receipts.map(async (receipt) => {
            const [items] = await pool.query('SELECT product_id, product_name, quantity, price FROM receipt_items WHERE receipt_id = ?', [receipt.id]);
            return {
                ...receipt,
                cart: items
            };
        }));

        res.json(receiptsWithItems);
    } catch (err) {
        console.error('Error fetching receipts:', err);
        res.status(500).json({ message: 'Error fetching receipts', error: err.message });
    }
});

// GET a single receipt by ID with its items
app.get('/api/receipts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the receipt
        const [receipts] = await pool.query('SELECT * FROM receipts WHERE id = ?', [id]);
        if (receipts.length === 0) {
            return res.status(404).json({ message: 'Receipt not found.' });
        }
        const receipt = receipts[0];

        // Fetch associated items
        const [items] = await pool.query('SELECT product_id, product_name, quantity, price FROM receipt_items WHERE receipt_id = ?', [id]);

        res.json({ ...receipt, cart: items });
    } catch (err) {
        console.error('Error fetching single receipt:', err);
        res.status(500).json({ message: 'Error fetching receipt', error: err.message });
    }
});

// DELETE a receipt and its associated items
app.delete('/api/receipts/:id', async (req, res) => {
    const connection = await pool.getConnection(); // Get a connection from the pool
    try {
        await connection.beginTransaction(); // Start a transaction

        const { id } = req.params;

        // 1. Delete associated receipt items first
        const [itemsResult] = await connection.query('DELETE FROM receipt_items WHERE receipt_id = ?', [id]);
        console.log(`Deleted ${itemsResult.affectedRows} items for receipt ID ${id}`);

        // 2. Delete the receipt itself
        const [receiptResult] = await connection.query('DELETE FROM receipts WHERE id = ?', [id]);

        if (receiptResult.affectedRows === 0) {
            await connection.rollback(); // Rollback if receipt not found
            return res.status(404).json({ message: 'Receipt not found.' });
        }

        await connection.commit(); // Commit the transaction
        res.json({ message: 'Receipt deleted successfully!' });

    } catch (err) {
        await connection.rollback(); // Rollback the transaction in case of error
        console.error('Error deleting receipt:', err);
        res.status(500).json({ message: 'Error deleting receipt', error: err.message });
    } finally {
        connection.release(); // Release the connection back to the pool
    }
});

// NEW: API Endpoint for Sales Report (Aggregate Sales Data)
app.get('/api/sales-report', async (req, res) => {
    try {
        // This query aggregates sales data from receipts and their items
        // You can customize this query based on the specific sales report you need
        const [salesData] = await pool.query(`
            SELECT
                r.transaction_date,
                ri.product_name,
                ri.quantity AS quantity_sold,
                ri.price AS item_price,
                (ri.quantity * ri.price) AS total_item_sale,
                r.customer_name,
                r.payment_method,
                r.total_price AS receipt_total_price,
                r.discount_amount,
                r.net_pay,
                r.vat_amount
            FROM
                receipts r
            JOIN
                receipt_items ri ON r.id = ri.receipt_id
            ORDER BY
                r.transaction_date DESC, ri.product_name ASC
        `);
        res.json(salesData);
    } catch (err) {
        console.error('Error fetching sales report:', err);
        res.status(500).json({ message: 'Error fetching sales report', error: err.message });
    }
});


// --- API Endpoints for Users (Authentication and Management) ---
// GET all users (Excludes password for security)
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, role FROM users');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});

// POST a new user (for registration or adding members/admins)
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            return res.status(400).json({ message: 'Username, password, and role are required.' });
        }
        // IMPORTANT: In a real application, you MUST hash the password here (e.g., using bcrypt).
        // For simplicity, it's stored in plain text as per the provided AddMember.js component's expectation.
        const [result] = await pool.query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, password, role]
        );
        res.status(201).json({ message: 'User added successfully!', user: { id: result.insertId, username, role } });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        console.error('Error adding user:', err);
        res.status(500).json({ message: 'Error adding user', error: err.message });
    }
});

// DELETE a user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ message: 'User deleted successfully!' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Error deleting user', error: err.message });
    }
});

// POST for user login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // IMPORTANT: In a real application, you would compare the provided password with the hashed password.
        // Example: const isPasswordValid = await bcrypt.compare(password, user.password);
        const isPasswordValid = (password === user.password); // For demonstration, comparing plain text

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // In a real application, you would generate a JWT token here for session management
        res.json({ message: 'Login successful!', user: { id: user.id, username: user.username, role: user.role } });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'An unexpected error occurred during login.', error: err.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});