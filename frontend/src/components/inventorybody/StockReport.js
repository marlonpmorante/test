import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config';
import { FaPlus, FaList, FaTags, FaEdit, FaTrash, FaTimes, FaSearch } from 'react-icons/fa';

// Fix for "ResizeObserver loop completed with undelivered notifications" error
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
    return;
  }
  originalWarn(...args);
};

const StockManagement = () => {
  const [stocks, setStocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [entry, setEntry] = useState({
    medicineId: '', supplierName: '', medicineName: '', genericName: '',
    brandName: '', category: '', description: '', form: '', strength: '',
    unit: '', reorderLevel: '', price: '', quantity: '', deliveryDate: '', image: null,
    barcode: '',
  });
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('add');
  const [searchCategoryTerm, setSearchCategoryTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Products
        const productsRes = await fetch(apiUrl('/products'));
        if (!productsRes.ok) throw new Error(`HTTP error! status: ${productsRes.status}`);
        const productsData = await productsRes.json();
        setStocks(productsData);

        // Fetch Categories
        const categoriesRes = await fetch(apiUrl('/categories'));
        if (!categoriesRes.ok) throw new Error(`HTTP error! status: ${categoriesRes.status}`);
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.map(cat => cat.name));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntry({ ...entry, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setEntry({ ...entry, image: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredFields = ['medicineId', 'supplierName', 'medicineName', 'genericName', 'brandName', 'category', 'price', 'quantity', 'deliveryDate', 'barcode'];
    if (requiredFields.some(field => !entry[field])) {
      showCustomAlert('Please fill all required fields.');
      return;
    }

    const formData = new FormData();
    Object.keys(entry).forEach(key => {
      if (key === 'image' && entry[key] === null) {
        return;
      }
      formData.append(key, entry[key]);
    });

    const url = editIndex !== null ? apiUrl(`/products/${editIndex}`) : apiUrl('/products');
    const method = editIndex !== null ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const updated = editIndex !== null
          ? stocks.map(item => item.id === data.product.id ? data.product : item)
          : [...stocks, data.product];
        setStocks(updated);
        setEntry({
          medicineId: '', supplierName: '', medicineName: '', genericName: '',
          brandName: '', category: '', description: '', form: '', strength: '',
          unit: '', reorderLevel: '', price: '', quantity: '', deliveryDate: '', image: null,
          barcode: '',
        });
        setEditIndex(null);
        showCustomAlert('Product saved successfully!');
      } else {
        const errorData = await res.json();
        showCustomAlert('Error: ' + (errorData.message || 'Failed to save product.'));
      }
    } catch (error) {
      showCustomAlert('An unexpected error occurred while saving the product.');
      console.error('Submit error:', error);
    }
  };

  const handleEdit = (id) => {
    const selected = stocks.find(stock => stock.id === id);
    if (selected) {
      setEntry({
        ...selected,
        deliveryDate: selected.deliveryDate ? new Date(selected.deliveryDate).toISOString().split('T')[0] : '',
        image: null,
      });
      setEditIndex(id);
      setViewMode('add');
    }
  };

  const handleDelete = async (id) => {
    showCustomConfirm('Are you sure you want to delete this item?', async () => {
      try {
        const res = await fetch(apiUrl(`/products/${id}`), { method: 'DELETE' });
        if (res.ok) {
          setStocks(stocks.filter(stock => stock.id !== id));
          showCustomAlert('Product deleted successfully!');
        } else {
          const errorData = await res.json();
          showCustomAlert('Delete failed: ' + (errorData.message || 'Unknown error.'));
        }
      } catch (error) {
        showCustomAlert('An error occurred while deleting the product.');
        console.error('Delete error:', error);
      }
    });
  };

  const handleCancelEdit = () => {
    setEntry({
      medicineId: '', supplierName: '', medicineName: '', genericName: '',
      brandName: '', category: '', description: '', form: '', strength: '',
      unit: '', reorderLevel: '', price: '', quantity: '', deliveryDate: '', image: null,
      barcode: '',
    });
    setEditIndex(null);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      showCustomAlert('Category name cannot be empty.');
      return;
    }
    try {
      const res = await fetch(apiUrl('/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories([...categories, data.category.name]);
        setNewCategory('');
        showCustomAlert('Category added successfully!');
      } else {
        const errorData = await res.json();
        showCustomAlert('Error adding category: ' + (errorData.message || 'Unknown error.'));
      }
    } catch (error) {
      showCustomAlert('An unexpected error occurred while adding the category.');
      console.error('Add category error:', error);
    }
  };

  const handleCategoryEdit = async (oldCategoryName) => {
    const newName = prompt('Edit category name:', oldCategoryName);
    if (newName && newName.trim() !== '' && newName !== oldCategoryName) {
      try {
        const allCategoriesRes = await fetch(apiUrl('/categories'));
        const allCategoriesData = await allCategoriesRes.json();
        const categoryToEdit = allCategoriesData.find(cat => cat.name === oldCategoryName);

        if (!categoryToEdit) {
          showCustomAlert('Category not found for editing.');
          return;
        }

        const res = await fetch(apiUrl(`/categories/${categoryToEdit.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim() }),
        });
        if (res.ok) {
          const updatedCategories = categories.map(cat =>
            cat === oldCategoryName ? newName.trim() : cat
          );
          setCategories(updatedCategories);

          setStocks(stocks.map(stock =>
            stock.category === oldCategoryName ? { ...stock, category: newName.trim() } : stock
          ));
          showCustomAlert('Category updated!');
        } else {
          const errorData = await res.json();
          showCustomAlert('Error updating category: ' + (errorData.message || 'Unknown error.'));
        }
      } catch (error) {
        showCustomAlert('An unexpected error occurred while updating the category.');
        console.error('Edit category error:', error);
      }
    }
  };

  const handleCategoryDelete = async (categoryToDeleteName) => {
    try {
      const allCategoriesRes = await fetch(apiUrl('/categories'));
      const allCategoriesData = await allCategoriesRes.json();
      const categoryToDelete = allCategoriesData.find(cat => cat.name === categoryToDeleteName);

      if (!categoryToDelete) {
        showCustomAlert('Category not found for deletion.');
        return;
      }

      showCustomConfirm(`Are you sure you want to delete the category "${categoryToDeleteName}"?`, async () => {
        const res = await fetch(apiUrl(`/categories/${categoryToDelete.id}`), { method: 'DELETE' });
        if (res.ok) {
          setCategories(categories.filter(cat => cat !== categoryToDeleteName));
          showCustomAlert('Category deleted successfully!');
        } else {
          const errorData = await res.json();
          showCustomAlert('Delete failed: ' + (errorData.message || 'Unknown error.'));
        }
      });
    } catch (error) {
      showCustomAlert('An error occurred while deleting the category.');
      console.error('Delete category error:', error);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchCategoryTerm.toLowerCase())
  );

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setIsAlertVisible(true);
  };

  const hideCustomAlert = () => {
    setIsAlertVisible(false);
    setAlertMessage('');
  };

  const showCustomConfirm = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setIsConfirmVisible(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setIsConfirmVisible(false);
    setConfirmMessage('');
    setConfirmAction(null);
  };

  const handleCancelConfirm = () => {
    setIsConfirmVisible(false);
    setConfirmMessage('');
    setConfirmAction(null);
  };

  if (loading) return <div className="loading-message">Loading stock data...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="stock-container">
      <h1>Stock Management System</h1>
      <div className="nav-buttons-container">
        <button onClick={() => setViewMode('add')} className="nav-button primary">
          <FaPlus style={{ marginRight: '6px' }} /> Add Product
        </button>
        <button onClick={() => setViewMode('view')} className="nav-button secondary">
          <FaList style={{ marginRight: '6px' }} /> View All Products
        </button>
        <button onClick={() => setViewMode('category')} className="nav-button success">
          <FaTags style={{ marginRight: '6px' }} /> Manage Categories
        </button>
      </div>

      {isAlertVisible && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <p>{alertMessage}</p>
            <div className="custom-modal-single-action">
              <button onClick={hideCustomAlert} className="custom-modal-button primary">OK</button>
            </div>
          </div>
        </div>
      )}

      {isConfirmVisible && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <p>{confirmMessage}</p>
            <div className="custom-modal-actions">
              <button onClick={handleConfirm} className="custom-modal-button success">Yes</button>
              <button onClick={handleCancelConfirm} className="custom-modal-button error">No</button>
            </div>
          </div>
        </div>
      )}


      {viewMode === 'add' && (
        <div className="form-section card">
          <h2>{editIndex !== null ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} className="stock-form">
            <input type="text" name="medicineId" placeholder="Medicine ID" value={entry.medicineId} onChange={handleChange} required />
            <input type="text" name="supplierName" placeholder="Supplier Name" value={entry.supplierName} onChange={handleChange} required />
            <input type="text" name="medicineName" placeholder="Medicine Name" value={entry.medicineName} onChange={handleChange} required />
            <input type="text" name="genericName" placeholder="Generic Name" value={entry.genericName} onChange={handleChange} required />
            <input type="text" name="brandName" placeholder="Brand Name" value={entry.brandName} onChange={handleChange} required />
            <input type="text" name="barcode" placeholder="Product Barcode" value={entry.barcode} onChange={handleChange} required />
            <select name="category" value={entry.category} onChange={handleChange} required>
              <option value="" disabled>Select Category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input type="text" name="form" placeholder="Form (Tablet, Syrup)" value={entry.form} onChange={handleChange} />
            <input type="text" name="strength" placeholder="Strength (e.g., 500mg)" value={entry.strength} onChange={handleChange} />
            <input type="text" name="unit" placeholder="Unit" value={entry.unit} onChange={handleChange} />
            <input type="number" name="reorderLevel" placeholder="Reorder Level" value={entry.reorderLevel} onChange={handleChange} />
            <textarea name="description" placeholder="Description" value={entry.description} onChange={handleChange} />
            <input type="number" name="price" placeholder="Price" value={entry.price} onChange={handleChange} required />
            <input type="number" name="quantity" placeholder="Quantity" value={entry.quantity} onChange={handleChange} required />
            <label htmlFor="deliveryDate" className="date-label">Delivery Date:</label>
            <input type="date" name="deliveryDate" id="deliveryDate" value={entry.deliveryDate} onChange={handleChange} required />
            <label htmlFor="productImage" className="file-label">Product Image:</label>
            <input type="file" name="image" id="productImage" accept="image/*" onChange={handleImageChange} />
            {editIndex !== null && entry.imageUrl && (
              <div className="current-image-preview">
                Current Image: <img src={entry.imageUrl} alt="Current Product" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="primary">
                {editIndex !== null ? (
                  <>
                    <FaEdit style={{ marginRight: '6px' }} /> Update Product
                  </>
                ) : (
                  <>
                    <FaPlus style={{ marginRight: '6px' }} /> Add Product
                  </>
                )}
              </button>
              {editIndex !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="error"
                >
                  <FaTimes style={{ marginRight: '6px' }} /> Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {viewMode === 'view' && (
        <div className="products-by-category card">
          <h2>All Products by Category</h2>
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search Category"
              value={searchCategoryTerm}
              onChange={(e) => setSearchCategoryTerm(e.target.value)}
              className="search-input"
            />
          </div>
          {filteredCategories.length > 0 ? (
            filteredCategories.map(category => {
              const productsInCategory = stocks.filter(stock => stock.category === category);
              if (productsInCategory.length === 0) {
                return null;
              }
              return (
                <div key={category} className="category-box">
                  <h3>{category} Products ({productsInCategory.length})</h3>
                  <div className="product-grid">
                    {productsInCategory.map(stock => (
                      <div key={stock.id} className="product-card">
                        <div className="product-image-container">
                          {stock.imageUrl ? (
                            <img
                              src={stock.imageUrl}
                              alt={stock.medicineId}
                              className="product-image"
                            />
                          ) : (
                            <div className="no-image-placeholder">No Image</div>
                          )}
                        </div>
                        <div className="product-details">
                          <p className="product-name">{stock.brandName} <span className="generic-name">({stock.medicineName})</span></p>
                          <p className="product-price">Price: ₱{parseFloat(stock.price).toFixed(2)}</p>
                          <p className="product-quantity">Quantity: {stock.quantity}</p>
                          <p className="product-id">ID: {stock.medicineId}</p>
                          <p className="product-supplier">Supplier: {stock.supplierName}</p>
                          <p className="product-barcode">Barcode: {stock.barcode}</p>
                          <p className="product-delivery-date">Delivered: {stock.deliveryDate ? new Date(stock.deliveryDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="product-actions">
                          <button onClick={() => handleEdit(stock.id)} title="Edit" className="icon-btn primary">
                            <FaEdit /> Edit
                          </button>
                          <button onClick={() => handleDelete(stock.id)} title="Delete" className="icon-btn error">
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-results-message">No categories match your search or no products found in these categories.</p>
          )}
        </div>
      )}

      {viewMode === 'category' && (
        <div className="category-section card">
          <h2>Manage Product Categories</h2>
          <form onSubmit={handleCategorySubmit} className="category-form">
            <h3>Add New Category</h3>
            <input
              type="text"
              placeholder="New Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              required
            />
            <button type="submit" className="primary">
              <FaPlus style={{ marginRight: '6px' }} /> Add Category
            </button>
          </form>

          <div className="category-list-container">
            <h3>Current Categories ({categories.length})</h3>
            {categories.length > 0 ? (
              <ul>
                {categories.map((cat, idx) => (
                  <li key={idx}>
                    <span>{cat}</span>
                    <div className="category-actions">
                      <button onClick={() => handleCategoryEdit(cat)} title="Edit Category" className="icon-btn primary">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleCategoryDelete(cat)} title="Delete Category" className="icon-btn error">
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No categories defined yet. Add some above!</p>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        /* Import Google Font - Poppins and Open Sans for a modern look */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');

        :root {
          --primary-color:rgb(28, 177, 247); /* Deep Violet */
          --secondary-color:rgb(44, 150, 220); /* Medium Purple */
          --accent-color: #e21c83; /* Raspberry Pink */
          --text-dark: #333333;
          --text-light: #f0f0f0;
          --bg-light: #f8f9fa;
          --bg-dark: #2c3e50;
          --border-color: #dcdcdc;
          --shadow-light: rgba(0, 0, 0, 0.08);
          --shadow-medium: rgba(0, 0, 0, 0.15);
          --success-color: #28a745;
          --danger-color: #dc3545;
          --info-color: #17a2b8;
        }

        * {
          box-sizing: border-box;
        }

        html, body, #__next, #root {
            height: 98%;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        body {
          font-family: 'Poppins', sans-serif;
          background-color: var(--bg-light);
          color: var(--text-dark);
        }

        .stock-container {
          padding: 20px 5vw;
          max-width: 100vw;
          margin: 0 auto;
          background: linear-gradient(135deg, #E0F2F1 0%, #B2EBF2 100%);
          min-height: 80vh;
          overflow-y: auto;
          animation: slideInFromTop 0.8s ease-out;
        }

        @keyframes slideInFromTop {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        h1 {
          text-align: center;
          margin-bottom: 40px;
          font-size: 2.2em;
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-shadow: 1px 1px 2px rgba(20, 167, 212, 0.05), 0.05);
          background: linear-gradient(90deg, var(--secondary-color) 0%, rgba(137, 44, 220, 0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        h2 {
          margin-bottom: 20px;
          font-size: 2em;
          font-weight: 700;
          color: var(--secondary-color);
          border-left: 6px solid var(--accent-color);
          padding-left: 15px;
          padding-bottom: 5px;
          display: flex;
          align-items: center;
          background: linear-gradient(90deg, var(--secondary-color) 0%, rgba(137, 44, 220, 0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: slideInLeft 0.6s ease-out;
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        h3 {
          font-size: 1.6em;
          color: var(--primary-color);
          border-left: 4px solid var(--accent-color);
          padding-left: 12px;
          padding-bottom: 5px;
          margin-bottom: 20px;
          background: -webkit-linear-gradient(45deg, var(--primary-color), var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .loading-message, .error-message, .no-results-message {
          text-align: center;
          padding: 30px;
          font-size: 1.6em;
          color: var(--info-color);
          background-color: #e0f7fa;
          border-radius: 15px;
          margin: 40px auto;
          border: 1px solid var(--info-color);
          box-shadow: 0 5px 15px rgba(23, 162, 184, 0.2);
          max-width: 500px;
        }

        .error-message {
          color: var(--danger-color);
          background-color: #ffebeb;
          border: 1px solid var(--danger-color);
          box-shadow: 0 5px 15px rgba(220, 53, 69, 0.2);
        }

        .nav-buttons-container {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 50px;
          flex-wrap: wrap;
        }

        button {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          letter-spacing: 0.5px;
        }

        button:active {
          transform: translateY(1px);
          box-shadow: 0 1px 6px rgba(0,0,0,0.2);
        }

        button.primary {
          background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
          color: white;
        }
        button.primary:hover {
          background: linear-gradient(45deg, var(--secondary-color), var(--primary-color));
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(106, 5, 126, 0.4);
        }

        button.secondary {
          background: linear-gradient(45deg, #6C7A89, #596570);
          color: white;
        }
        button.secondary:hover {
          background: linear-gradient(45deg, #596570, #6C7A89);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(108, 122, 137, 0.4);
        }

        button.success {
          background: linear-gradient(45deg, var(--success-color), #218838);
          color: white;
        }
        button.success:hover {
          background: linear-gradient(45deg, #218838, var(--success-color));
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }

        button.error {
          background: linear-gradient(45deg, var(--danger-color), #c82333);
          color: white;
        }
        button.error:hover {
          background: linear-gradient(45deg, #c82333, var(--danger-color));
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }

        .nav-button {
        }

        .card {
          background: #fff5f5ff;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 8px 25px var(--shadow-light), 0 10px 10px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease;
          border: 1px solid #f0f0f0;
          margin-bottom: 35px;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 35px var(--shadow-medium);
        }

        .stock-form, .category-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 25px;
        }

        .stock-form input[type="text"],
        .stock-form input[type="number"],
        .stock-form input[type="date"],
        .stock-form select,
        .stock-form textarea,
        .category-form input[type="text"] {
          padding: 12px 15px;
          margin-bottom: 0;
          font-size: 1rem;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          width: 90%;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          background-color: #fcfcfc;
          color: var(--text-dark);
        }

        .stock-form input[type="text"]:focus,
        .stock-form input[type="number"]:focus,
        .stock-form input[type="date"]:focus,
        .stock-form select:focus,
        .stock-form textarea:focus,
        .category-form input[type="text"]:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(212, 0, 255, 0.2);
          background-color: #ffffff;
        }

        .stock-form textarea {
          grid-column: span 2;
          min-height: 120px;
          resize: vertical;
        }

        .date-label, .file-label {
            font-size: 0.95em;
            color: #555;
            margin-top: 5px;
            margin-bottom: -15px;
            grid-column: span 1;
            align-self: flex-end;
            font-weight: 500;
        }

        .form-actions {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 30px;
        }

        .current-image-preview {
          grid-column: 1 / -1;
          text-align: center;
          margin-top: 20px;
          color: #555;
          font-size: 0.95em;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }

        .product-card {
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .product-image-container {
          width: 100%;
          height: 200px;
          overflow: hidden;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f8f8f8;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .no-image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #e9e9e9;
            color: #777;
            font-size: 1.1em;
            font-style: italic;
        }

        .product-details {
          padding: 18px;
          flex-grow: 1;
        }

        .product-details p {
          margin-bottom: 8px;
          font-size: 0.95em;
          color: #333;
          line-height: 1.4;
        }

        .product-details .product-name {
          font-weight: 600;
          font-size: 1.15em;
          color: var(--text-dark);
          margin-bottom: 10px;
        }

        .product-details .generic-name {
            font-weight: 400;
            color: #555;
            font-size: 0.9em;
        }

        .product-details .product-price {
          font-weight: 700;
          color: var(--success-color);
          font-size: 1.05em;
        }

        .product-details .product-quantity {
            font-weight: 500;
            color: var(--primary-color);
        }

        .product-actions {
          display: flex;
          justify-content: space-around;
          padding: 15px;
          border-top: 1px solid #f0f0f0;
          background-color: #fbfbfb;
        }

        .product-actions .icon-btn {
            border-radius: 6px;
            padding: 8px 15px;
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.9em;
        }

        .product-actions .icon-btn:hover {
            transform: translateY(-2px);
        }

        .category-list-container ul {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
        }

        .category-list-container li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background-color: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
        }

        .category-list-container li:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }

        .category-list-container li span {
          font-size: 1.15em;
          color: var(--text-dark);
          font-weight: 500;
        }

        .category-actions {
          display: flex;
          gap: 10px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          padding: 6px 12px;
          background-color: #fff;
          box-shadow: 0 3px 10px rgba(0,0,0,0.06);
          transition: all 0.3s ease;
        }

        .search-bar:focus-within {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(106, 5, 126, 0.15);
        }

        .search-icon {
          margin-right: 8px;
          color: var(--primary-color);
          font-size: 1.4em;
        }

        .search-input {
          border: none;
          flex-grow: 1;
          padding: 8px 0;
          font-size: 1em;
          background-color: transparent;
          color: var(--text-dark);
        }

        .search-input::placeholder {
          color: #999;
        }

        .search-input:focus {
          outline: none;
        }

        .custom-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeInOverlay 0.3s ease-out;
        }

        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .custom-modal-content {
            background: linear-gradient(145deg, #ffffff, #f7f7f7);
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            width: 90%;
            max-width: 500px;
            text-align: center;
            animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid var(--secondary-color);
            color: var(--text-dark);
        }

        @keyframes zoomIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .custom-modal-content p {
            margin-bottom: 20px;
            font-size: 1.2em;
            line-height: 1.5;
            color: #444;
            font-weight: 500;
        }

        .custom-modal-single-action {
          display: flex;
          justify-content: center;
          margin-top: 25px;
        }

        .custom-modal-actions {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 25px;
        }

        .custom-modal-button {
          padding: 14px 25px;
          border-radius: 10px;
          font-size: 1.05rem;
          box-shadow: 0 4px 12px rgba(106, 5, 126, 0.3);
        }

        .custom-modal-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(106, 5, 126, 0.4);
        }

        @media (max-width: 1200px) {
          .stock-container {
            padding: 15px 5vw;
          }
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .stock-container {
            padding: 10px 5vw;
          }
          .nav-buttons-container {
            flex-direction: column;
            gap: 15px;
          }
          .nav-button {
            width: 100%;
            justify-content: center;
          }
          .stock-form {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          .stock-form textarea {
            grid-column: span 1;
          }
          h1 {
            font-size: 2.8em;
            margin-bottom: 30px;
          }
          h2 {
            font-size: 2em;
            padding-left: 15px;
          }
          .card {
            padding: 20px;
          }
          .custom-modal-content {
            padding: 25px;
          }
          .product-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .stock-container {
            padding: 8px 5vw;
          }
          h1 {
            font-size: 2.2em;
            margin-bottom: 25px;
          }
          h2 {
            font-size: 1.8em;
          }
          .form-actions {
            flex-direction: column;
            gap: 10px;
          }
          .form-actions button,
          .category-form button {
            width: 100%;
            padding: 12px;
          }
          .category-list-container li {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            padding: 10px;
          }
          .category-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .custom-modal-content {
            padding: 15px;
          }
          .custom-modal-content h3 {
            font-size: 1.4em;
          }
          .custom-modal-button {
            padding: 10px 15px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default StockManagement;