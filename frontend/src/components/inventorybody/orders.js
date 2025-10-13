import React, { useState } from 'react';
import { FaShoppingCart, FaPlus, FaMinus, FaTrash, FaSearch, FaTimesCircle, FaCheckCircle } from 'react-icons/fa'; // Importing icons

const sampleProducts = [
  { id: 1, name: 'Paracetamol 500mg', price: 5, image: 'https://via.placeholder.com/100?text=Paracetamol' },
  { id: 2, name: 'Cough Syrup', price: 8, image: 'https://via.placeholder.com/100?text=Cough+Syrup' },
  { id: 3, name: 'Vitamin C Tablets', price: 10, image: 'https://via.placeholder.com/100?text=Vitamin+C' },
];

const Orders = () => {
  const [cart, setCart] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [showCatalog, setShowCatalog] = useState(true);
  const [customerInfo, setCustomerInfo] = useState({ name: '', contact: '', address: '', type: 'Pickup' });
  const [searchQuery, setSearchQuery] = useState('');

  // Add product to the cart
  const handleAddToCart = (product) => {
    const exists = cart.find((item) => item.id === product.id);
    if (exists) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setShowCatalog(false);
  };

  // Change quantity for a specific product in the cart
  const handleQuantityChange = (id, delta) => {
    setCart(cart.map((item) => {
      if (item.id === id) {
        const updatedQty = item.quantity + delta;
        return updatedQty > 0 ? { ...item, quantity: updatedQty } : item;
      }
      return item;
    }));
  };

  // Delete an item from the cart
  const handleDeleteItem = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Handle customer information changes
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({ ...customerInfo, [name]: value });
  };

  // Submit the order and store sales data with unique ID
  const handleSubmitOrder = () => {
    if (!customerInfo.name || !customerInfo.contact || (customerInfo.type === 'Delivery' && !customerInfo.address)) {
      alert('Please complete customer information.');
      return;
    }

    const newSale = {
      id: Date.now() + Math.floor(Math.random() * 1000), // Unique ID for sale
      customer: customerInfo.name,
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      date: new Date().toLocaleString(),
    };

    setSalesData([...salesData, newSale]);
    alert('Order placed successfully!');
    setCart([]);
    setCustomerInfo({ name: '', contact: '', address: '', type: 'Pickup' });
    setShowCatalog(true);
    setSearchQuery('');
  };

  // Add more products
  const handleAddMore = () => {
    setShowCatalog(true);
    setSearchQuery('');
  };

  // Filter products based on search query
  const filteredProducts = sampleProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate the total price dynamically based on quantity
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <div className="orders-container">
      {showCatalog && (
        <>
          <h2>Product Catalog</h2>
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search for a product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bar"
            />
          </div>
          <div className="product-list">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <div key={p.id} className="product-card">
                  <img src={p.image} alt={p.name} />
                  <h4>{p.name}</h4>
                  <p>₱{p.price}</p>
                  <button onClick={() => handleAddToCart(p)}><FaShoppingCart /> Add to Cart</button>
                </div>
              ))
            ) : (
              <p>No matching products found.</p>
            )}
          </div>
        </>
      )}

      {!showCatalog && (
        <>
          <h3>Shopping Cart</h3>
          {cart.length === 0 ? (
            <p>No items in cart.</p>
          ) : (
            <table className="order-table">
              <thead>
                <tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th>Action</th></tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>₱{item.price}</td>
                    <td>
                      <button onClick={() => handleQuantityChange(item.id, -1)}><FaMinus /></button>
                      <span className="qty">{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item.id, 1)}><FaPlus /></button>
                    </td>
                    <td>₱{item.price * item.quantity}</td>
                    <td><button className="delete-btn" onClick={() => handleDeleteItem(item.id)}><FaTrash /></button></td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="3"><strong>Total</strong></td>
                  <td><strong>₱{calculateTotal()}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}

          <h3>Customer Information</h3>
          <input name="name" placeholder="Name" value={customerInfo.name} onChange={handleCustomerChange} />
          <input name="contact" placeholder="Contact Number" value={customerInfo.contact} onChange={handleCustomerChange} />
          <select name="type" value={customerInfo.type} onChange={handleCustomerChange}>
            <option value="Pickup">Pickup</option>
            <option value="Delivery">Delivery</option>
          </select>
          {customerInfo.type === 'Delivery' && (
            <input name="address" placeholder="Delivery Address" value={customerInfo.address} onChange={handleCustomerChange} />
          )}

          <button onClick={handleSubmitOrder}><FaCheckCircle /> Place Order</button>
          <button onClick={handleAddMore}><FaPlus /> Add More Products</button>
        </>
      )}

      {salesData.length > 0 && (
        <>
          <h3>Sales Report</h3>
          <table className="order-table">
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Total</th><th>Date</th></tr>
            </thead>
            <tbody>
              {salesData.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.id}</td>
                  <td>{sale.customer}</td>
                  <td>₱{sale.total}</td>
                  <td>{sale.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <style jsx>{`
        .orders-container {
          max-width: 100%;
          background-color: transparent;
          margin: auto;
          border-radius: 10px;
          padding: 2rem;
          background-color: rgba(255, 255, 255, 0.8);
        }

        .product-list {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .product-card {
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 1rem;
          width: 160px;
          text-align: center;
        }

        .product-card img {
          width: 100px;
          height: 100px;
          object-fit: contain;
          margin-bottom: 0.5rem;
        }

        .search-input-container {
          position: relative;
          margin-bottom: 1rem;
          width: 50%;
        }

        .search-bar {
          padding: 0.5rem 0.5rem 0.5rem 2.5rem; /* Increased left padding for icon */
          width: 100%;
          border-radius: 16px;
          border: 1px solid #ccc;
        }

        .search-icon {
          position: absolute;
          left: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          color: #555;
        }

        table {
          width: 100%;
          margin-top: 1rem;
          border-collapse: collapse;
        }

        table, th, td {
          border: 1px solid #ccc;
        }

        th, td {
          padding: 0.5rem;
          text-align: center;
        }

        .qty {
          margin: 0 0.5rem;
        }

        input, select {
          display: block;
          margin: 0.5rem 0;
          padding: 0.5rem;
          width: 100%;
        }

        button {
          padding: 0.4rem 0.8rem;
          margin: 0.2rem;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          display: inline-flex; /* To align icon and text */
          align-items: center; /* To vertically center icon and text */
          gap: 0.5rem; /* Space between icon and text */
        }

        button:hover {
          background: #1976d2;
        }

        .delete-btn {
          background-color: #f44336;
        }

        .delete-btn:hover {
          background-color: #d32f2f;
        }
      `}</style>
    </div>
  );
};

export default Orders;