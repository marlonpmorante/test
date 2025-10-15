// --- In src\pages\main.js (or MainApp.js) ---

// 1. These imports are missing and must be added at the top:
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';

// 2. The rest of your imports follow below:
import InventoryForm from '../components/InventoryForm';
import Orders from '../components/inventorybody/orders';
import StockReport from '../components/inventorybody/StockReport';
import AddMember from '../components/AddUser';
import SalesReport from '../components/inventorybody/SalesReport';
import ReceiptHistoryPage from '../components/inventorybody/ReceiptHistoryPage';
import logo from '../assets/logo.png';

// ... rest of the file ...

import { FaHome, FaBoxes, FaUserPlus, FaSignOutAlt, FaChartBar, FaRegUserCircle, FaReceipt, FaCube, FaPlusSquare, FaTags, FaDollarSign } from 'react-icons/fa';

// New component for Product Summary on Dashboard
const ProductSummaryDashboard = ({ showMessageBox }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch products
        const productsResponse = await fetch('http://localhost:5000/api/products');
        if (!productsResponse.ok) {
          throw new Error(`HTTP error! status: ${productsResponse.status} for products`);
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);

        // Fetch categories
        const categoriesResponse = await fetch('http://localhost:5000/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error(`HTTP error! status: ${categoriesResponse.status} for categories`);
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        setError(null);
      } catch (err) {
        console.error('Error fetching data for dashboard:', err);
        setError('Failed to load dashboard summary.');
        showMessageBox('error', 'Failed to load dashboard summary.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showMessageBox]);

  const totalUniqueProducts = products.length;
  const totalQuantityInStock = products.reduce((sum, product) => sum + (product.quantity || 0), 0);
  const totalCategories = categories.length;

  if (loading) {
    return <div className="dashboard-summary-box loading">Loading product data...</div>;
  }

  if (error) {
    return <div className="dashboard-summary-box error">Error: {error}</div>;
  }

  return (
    <>
      <div className="dashboard-summary-box unique-products">
        <div className="icon-wrapper"><FaBoxes className="summary-icon" /></div>
        <h3 className="summary-title">Unique Products</h3>
        <p className="summary-value">{totalUniqueProducts}</p>
      </div>
      <div className="dashboard-summary-box total-quantity">
        <div className="icon-wrapper"><FaCube className="summary-icon" /></div>
        <h3 className="summary-title">Total Items in Stock</h3>
        <p className="summary-value">{totalQuantityInStock}</p>
      </div>
      <div className="dashboard-summary-box total-categories">
        <div className="icon-wrapper"><FaTags className="summary-icon" /></div>
        <h3 className="summary-title">Total Categories</h3>
        <p className="summary-value">{totalCategories}</p>
      </div>
    </>
  );
};

// New component for Receipt Summary on Dashboard
const ReceiptSummaryDashboard = ({ showMessageBox }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/receipts');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setReceipts(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching receipts for dashboard:', err);
        setError('Failed to load receipt summary.');
        showMessageBox('error', 'Failed to load receipt summary for dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, [showMessageBox]);

  const totalReceipts = receipts.length;

  if (loading) {
    return <div className="dashboard-summary-box loading">Loading receipt data...</div>;
  }

  if (error) {
    return <div className="dashboard-summary-box error">Error: {error}</div>;
  }

  return (
    <div className="dashboard-summary-box total-receipts">
      <div className="icon-wrapper"><FaReceipt className="summary-icon" /></div>
      <h3 className="summary-title">Total Receipts</h3>
      <p className="summary-value">{totalReceipts}</p>
    </div>
  );
};

// New component for Daily Sales Summary on Dashboard
const DailySalesSummary = ({ showMessageBox }) => {
  const [dailySales, setDailySales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDailySales = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`http://localhost:5000/api/sales-report?startDate=${today}&endDate=${today}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const salesData = await response.json();
        
        const totalNetPay = salesData.reduce((sum, sale) => sum + (parseFloat(sale.net_pay) || 0), 0);
        setDailySales(totalNetPay);
        setError(null);
      } catch (err) {
        console.error('Error fetching daily sales:', err);
        setError('Failed to load daily sales.');
        showMessageBox('error', 'Failed to load daily sales summary.');
      } finally {
        setLoading(false);
      }
    };
    fetchDailySales();
  }, [showMessageBox]);

  if (loading) {
    return <div className="dashboard-summary-box loading">Loading sales data...</div>;
  }

  if (error) {
    return <div className="dashboard-summary-box error">Error: {error}</div>;
  }

  return (
    <div className="dashboard-summary-box daily-sales">
      <div className="icon-wrapper">
        <FaDollarSign className="summary-icon" />
      </div>
      <h3 className="summary-title">Today's Sales</h3>
      <p className="summary-value">₱{dailySales.toFixed(2)}</p>
    </div>
  );
};

// New component for the Pharmacy Introduction Box
const PharmacyIntroBox = () => {
  return (
    <div className="pharmacy-intro-box">
      <div className="intro-content">
        <h2>Welcome to R.B Gonzales Pharmacy</h2>
        <p>
          Your trusted partner in health and wellness. We are committed to providing
          quality medical products and exceptional service to our community.
        </p>
      </div>
    </div>
  );
};

const MainApp = ({ onLogout, userRole, username }) => {
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [messageBox, setMessageBox] = useState({
    isVisible: false,
    type: '',
    message: '',
    onConfirm: null,
  });

  const showMessageBox = (type, message, onConfirm = null) => {
    setMessageBox({ isVisible: true, type, message, onConfirm });
  };

  const hideMessageBox = () => {
    setMessageBox({ isVisible: false, type: '', message: '', onConfirm: null });
  };

  const handlePrintReceipt = (receiptData) => {
    console.log("Print Receipt triggered:", receiptData);
    showMessageBox('success', `Receipt ${receiptData.receipt_number} generated successfully!`);
    setTimeout(() => {
      navigate('/receipt-history', { state: { newReceipt: receiptData } });
    }, 1500);
  };

  const handleGoToReceiptHistory = () => {
    navigate('/receipt-history');
  };

  const handleGoBackToPOS = () => {
    navigate('/orders');
  };

  return (
    <div className="app-container">
      <header className="header-navbar">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="app-logo" />
          <span className="app-name">R.B Gonzales Pharmacy</span>
        </div>
        <div className="header-info">
          <div className="user-info">
            <FaRegUserCircle className="profile-icon" />
            <span className="username">{username}</span>
          </div>
          <button onClick={onLogout} className="logout-button">
            <FaSignOutAlt className="logout-icon" /> Logout
          </button>
        </div>
      </header>

      <div className="main-content-area">
        <nav
          className={`side-navbar ${isSidebarVisible ? 'visible' : 'hidden'}`}
          onMouseEnter={() => setIsSidebarVisible(true)}
          onMouseLeave={() => setIsSidebarVisible(false)}
        >
          {userRole === 'admin' && (
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <FaHome className="nav-icon" /> <span>Dashboard</span>
            </NavLink>
          )}

          {userRole === 'admin' && (
            <>
              <NavLink
                to="/add-member"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <FaUserPlus className="nav-icon" /> <span>Add User</span>
              </NavLink>
          <NavLink
            to="/stock-report"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <FaPlusSquare className="nav-icon" /> <span>Add Stock</span>
          </NavLink>
          <NavLink
            to="/sales-report"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <FaChartBar className="nav-icon" /> <span>Sales Report</span>
          </NavLink>
          <NavLink
            to="/receipt-history"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <FaReceipt className="nav-icon" /> <span>Receipt History</span>
          </NavLink>
            </>
          )}
          <NavLink
            to="/inventory"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
                <FaBoxes className="nav-icon" /> <span>Inventory Management</span>
              </NavLink>

        </nav>

        <main className="content-area">
          <Routes>
            {userRole === 'admin' && (
              <>
                <Route path="/" element={<HomeDashboard showMessageBox={showMessageBox} />} />
                <Route path="/add-member" element={<AddMember showMessageBox={showMessageBox} />} />
                <Route path="/orders" element={<Orders onPrintReceipt={handlePrintReceipt} onGoToReceiptHistory={handleGoToReceiptHistory} />} />
                <Route path="/stock-report" element={<StockReport />} />
                <Route path="/sales-report" element={<SalesReport />} />
                <Route path="/receipt-history" element={<ReceiptHistoryPage onGoBackToPOS={handleGoBackToPOS} onPrintReceipt={handlePrintReceipt} />} />
              </>
            )}
            <Route path="/inventory" element={<InventoryForm showMessageBox={showMessageBox} />} />
            {userRole === 'member' && <Route path="/" element={<InventoryForm showMessageBox={showMessageBox} />} />}
          </Routes>
        </main>
      </div>

      {messageBox.isVisible && (
        <div className="message-box-overlay">
          <div className={`message-box ${messageBox.type}`}>
            <p>{messageBox.message}</p>
            <div className="message-box-actions">
              {messageBox.onConfirm && (
                <button
                  onClick={() => {
                    messageBox.onConfirm();
                    hideMessageBox();
                  }}
                  className="confirm-button"
                >
                  Confirm
                </button>
              )}
              <button onClick={hideMessageBox} className="ok-button">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The style block below uses the 'jsx' attribute which is specific to styled-jsx/Next.js/similar tools. 
          For a standard React app using CSS modules or a plain CSS file, 
          you would typically extract these styles into a separate MainApp.css file 
          and import it at the top of this file. 
          We'll keep the block as-is, assuming a build process that handles it (e.g., CRA with specific Babel/Webpack configuration) 
          or understanding that this is the content the user wants converted. 
          If you intend to use this in a plain React project, you must manually move these styles.
      */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');

        /* The following styles ensure the app takes up the full browser view */
        html, body, #__next, #root {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          overflow: auto;
        }

        .app-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background-color: #f0f2f5;
          font-family: 'Roboto', sans-serif;
          color: #333;
        }

        .header-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #2c3e50;
          padding: 15px 30px;
          color: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          flex-wrap: wrap;
          gap: 15px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .app-logo {
          height: 45px;
          width: 45px;
          border-radius: 50%;
          background-color: white;
          padding: 3px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .app-name {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 1.8em;
          color: #ecf0f1;
          letter-spacing: 1px;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 25px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .date-time {
          font-size: 0.95em;
          opacity: 0.9;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 5px;
          background-color: rgba(255, 255, 255, 0.1);
        }

        .profile-icon {
          font-size: 1.4em;
          color: #3498db;
        }

        .username {
          font-weight: 600;
          color: #ecf0f1;
        }

        .logout-button {
          padding: 10px 20px;
          background-color: #e74c3c;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1em;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .logout-button:hover {
          background-color: #c0392b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        }

        .main-content-area {
          display: flex;
          flex: 1;
          padding: 20px;
          gap: 10px;
          overflow: auto;
        }

        /* Sidebar visibility styles */
        .side-navbar {
          width: 60px;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.08);
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          transition: width 0.3s ease-in-out;
        }

        .side-navbar.visible {
          width: 230px;
        }

        .side-navbar .nav-link span {
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .side-navbar.visible .nav-link span {
            display: inline;
            opacity: 1;
        }

        .side-navbar.visible .nav-link {
          justify-content: flex-start;
          padding: 15px 25px;
        }

        .side-navbar.hidden .nav-link {
            justify-content: center;
            padding: 15px 0;
        }


        .nav-link {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px 25px;
          width: 100%;
          color: #555;
          text-decoration: none;
          font-size: 1.1em;
          font-weight: 500;
          transition: all 0.3s ease;
          border-left: 5px solid transparent;
          box-sizing: border-box;
        }

        .nav-link:hover {
          background-color: #f0f2f5;
          color: #3498db;
          border-left-color: #3498db;
        }

        .nav-link.active {
          background-color: #e8f5fd;
          color: #2980b9;
          border-left-color: #2980b9;
          font-weight: 600;
        }

        .nav-icon {
          font-size: 1.3em;
        }

        .content-area {
          flex-grow: 1;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.08);
          padding: 30px;
          overflow: auto;
        }

        .dashboard-row-container {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .dashboard-summary-box {
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
          min-width: 200px;
          color: white;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .dashboard-summary-box:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .summary-icon {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .summary-title {
            font-size: 1.2em;
            font-weight: 600;
            margin: 0;
        }

        .summary-value {
            font-size: 2.5em;
            font-weight: 700;
            margin: 5px 0 0;
        }

        /* New specific styles for the daily sales box */
        .dashboard-summary-box.daily-sales {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
        }

        /* New specific styles for the other boxes with new colors */
        .dashboard-summary-box.unique-products {
            background: linear-gradient(135deg, #3498db, #5dade2);
        }

        .dashboard-summary-box.total-quantity {
            background: linear-gradient(135deg, #7f8c8d, #95a5a6);
        }

        .dashboard-summary-box.total-categories {
            background: linear-gradient(135deg, #8e44ad, #9b59b6);
        }

        .dashboard-summary-box.total-receipts {
            background: linear-gradient(135deg, #e67e22, #f39c12);
        }

        /* Styles for the new Pharmacy Intro Box */
        .pharmacy-intro-box {
          background-color: #e8f5e9;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          padding: 70px;
          display: flex;
          align-items: center;
          gap: 90px;
          margin-top: 70px;

        }

      
        .intro-content h2 {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.8em;
          font-weight: 700;
          color: #388e3c;
          margin: 70px 90px 10px 40px;
          text-align: center;
        }

        .intro-content p {
          font-size: 1.5em;
          line-height: 1.6;
          color: #555;
          margin: 40px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

const HomeDashboard = ({ showMessageBox }) => {
  return (
    <div className="home-dashboard">
      <h1>Dashboard</h1>
      <div className="dashboard-row-container">
        <ProductSummaryDashboard showMessageBox={showMessageBox} />
        <ReceiptSummaryDashboard showMessageBox={showMessageBox} />
        <DailySalesSummary showMessageBox={showMessageBox} />
      </div>
      <PharmacyIntroBox />
    </div>
  );
};

export default MainApp;