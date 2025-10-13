import React, { useState, useEffect } from 'react';
import { FaSearch, FaCalendarAlt } from 'react-icons/fa';

const SalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);

  // Fetch sales data from the backend
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/sales-report');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setSalesData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sales report:', err);
        setError(`Failed to load sales report: ${err.message}`);
        setLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  // Filter sales data based on search terms and date range
  useEffect(() => {
    let currentFilteredSales = salesData.filter(sale => {
      const matchesProductName = sale.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCustomerName = sale.customer_name ? sale.customer_name.toLowerCase().includes(searchCustomer.toLowerCase()) : true;

      const transactionDate = new Date(sale.transaction_date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const matchesDateRange = (!start || transactionDate >= start) && (!end || transactionDate <= end);

      return matchesProductName && matchesCustomerName && matchesDateRange;
    });

    // Sort by transaction date descending
    currentFilteredSales.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

    setFilteredSales(currentFilteredSales);
  }, [salesData, searchTerm, searchCustomer, startDate, endDate]);

  const calculateTotals = () => {
    return filteredSales.reduce((acc, sale) => {
      // Explicitly convert to number using parseFloat and default to 0 if null, undefined, or NaN
      acc.totalQuantitySold += (parseFloat(sale.quantity_sold) || 0);
      acc.totalGrossSales += (parseFloat(sale.total_item_sale) || 0);
      acc.totalDiscountAmount += (parseFloat(sale.discount_amount) || 0);
      acc.totalNetPay += (parseFloat(sale.net_pay) || 0);
      acc.totalVatAmount += (parseFloat(sale.vat_amount) || 0);
      return acc;
    }, {
      totalQuantitySold: 0,
      totalGrossSales: 0,
      totalDiscountAmount: 0,
      totalNetPay: 0,
      totalVatAmount: 0
    });
  };

  const { totalQuantitySold = 0, totalGrossSales = 0, totalDiscountAmount = 0, totalNetPay = 0, totalVatAmount = 0 } = calculateTotals();

  if (loading) return <div className="loading-message">Loading sales report...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="sales-report-container">
      <h2>Sales Report</h2>
              <div className="filters-section">
        <div className="filter-group">
          <FaSearch className="filter-icon" />
          <input
            type="text"
            placeholder="Search by Product Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <FaSearch className="filter-icon" />
          <input
            type="text"
            placeholder="Search by Customer Name"
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group date-filter">
          <FaCalendarAlt className="filter-icon" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="filter-input"
            title="Start Date"
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="filter-input"
            title="End Date"
          />
        </div>
      </div>

      <div className="sales-summary">
        <h3>Summary</h3>
        <div className="summary-cards">
          <div className="summary-card">Total Quantity Sold: <span>{totalQuantitySold.toFixed(2)}</span></div>
          <div className="summary-card">Total Gross Sales: <span>₱{totalGrossSales.toFixed(2)}</span></div>
          <div className="summary-card">Total Discount Amount: <span>₱{totalDiscountAmount.toFixed(2)}</span></div>
          <div className="summary-card">Total Net Pay: <span>₱{totalNetPay.toFixed(2)}</span></div>
          <div className="summary-card">Total VAT Amount: <span>₱{totalVatAmount.toFixed(2)}</span></div>
        </div>
      </div>

      {filteredSales.length > 0 ? (
        <div className="table-responsive">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product Name</th>
                <th>Quantity Sold</th>
                <th>Item Price (₱)</th>
                <th>Total Item Sale (₱)</th>
                <th>Customer Name</th>
                <th>Payment Method</th>
                <th>Receipt Total (₱)</th>
                <th>Discount (₱)</th>
                <th>Net Pay (₱)</th>
                <th>VAT (₱)</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale, index) => (
                <tr key={index}>
                  <td>{new Date(sale.transaction_date).toLocaleDateString()}</td>
                  <td>{sale.product_name}</td>
                  <td>{sale.quantity_sold}</td>
                  {/* Explicitly convert to number before calling toFixed */}
                  <td>{(parseFloat(sale.item_price) || 0).toFixed(2)}</td>
                  <td>{(parseFloat(sale.total_item_sale) || 0).toFixed(2)}</td>
                  <td>{sale.customer_name || 'N/A'}</td>
                  <td>{sale.payment_method}</td>
                  <td>{(parseFloat(sale.receipt_total_price) || 0).toFixed(2)}</td>
                  <td>{(parseFloat(sale.discount_amount) || 0).toFixed(2)}</td>
                  <td>{(parseFloat(sale.net_pay) || 0).toFixed(2)}</td>
                  <td>{(parseFloat(sale.vat_amount) || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-results-message">No sales data found matching your criteria.</p>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

        .sales-report-container {
          font-family: 'Poppins', sans-serif;
          padding: 40px;
          max-width: 1500px;
          margin: -9px auto;
          background-color: #ffffffff;
          min-height: 80vh;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          animation: fadeIn 0.8s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        h2 {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 30px;
          font-size: 3em;
          font-weight: 700;
          letter-spacing: 1.5px;
          position: relative;
        }

        h2::after {
          content: '';
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 4px;
          background-color: #3498db;
          border-radius: 2px;
        }

        h3 {
          color: #34495e;
          margin-bottom: 25px;
          font-size: 1.8em;
          font-weight: 600;
          border-left: 5px solid #3498db;
          padding-left: 15px;
        }

        .loading-message, .error-message, .no-results-message {
          text-align: center;
          padding: 30px;
          font-size: 1.5em;
          color: #e74c3c;
          background-color: #fce8e8;
          border-radius: 10px;
          margin-top: 30px;
        }

        .loading-message {
          color: #2980b9;
          background-color: #e8f5fd;
        }

        .filters-section {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 40px;
          padding: 25px;
          background: linear-gradient(135deg, #e0f2f7 0%, #d4eaf0 100%);
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          justify-content: center;
          align-items: center;
        }

        .filter-group {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border: 1px solid #cce7f0;
          border-radius: 8px;
          padding: 10px 15px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
        }

        .filter-group:focus-within {
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
        }

        .filter-icon {
          color: #3498db;
          margin-right: 10px;
          font-size: 1.2em;
        }

        .filter-input {
          border: none;
          flex-grow: 1;
          padding: 8px;
          font-size: 1.1em;
          background-color: transparent;
          color: #333;
        }

        .filter-input::placeholder {
          color: #999;
        }

        .filter-input:focus {
          outline: none;
        }

        .date-filter {
          display: flex;
          gap: 10px;
        }

        .date-separator {
          padding: 0 8px;
          color: #555;
          font-size: 1em;
          display: flex;
          align-items: center;
          font-weight: 600;
        }

        .sales-summary {
          background: linear-gradient(45deg, #e8f8f8 0%, #dff7f7 100%); /* Softer gradient */
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.07);
          margin-bottom: 40px;
          border: 1px solid #c0e0e0;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 25px;
        }

        .summary-card {
          background-color: #ffffff;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          text-align: center;
          color: #34495e;
          font-size: 1.15em;
          font-weight: 600;
          border: 1px solid #e0e0e0;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .summary-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .summary-card span {
          color: #27ae60; /* Vibrant green for monetary values */
          font-size: 1.8em;
          display: block;
          margin-top: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .sales-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 30px;
          background-color: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.07);
        }

        .sales-table th,
        .sales-table td {
          border: 1px solid #f0f0f0;
          padding: 15px;
          text-align: left;
          font-size: 1em;
          color: #444;
        }

        .sales-table th {
          background-color: #eaf6fa; /* Light blue header */
          font-weight: 700;
          color: #2c3e50;
          position: sticky;
          top: 0;
          z-index: 1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sales-table tbody tr:nth-child(even) {
          background-color: #f9fcfe;
        }

        .sales-table tbody tr:hover {
          background-color: #eef7fc;
          transform: scale(1.005);
          transition: all 0.2s ease;
        }

        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
        }

        @media (max-width: 1024px) {
          .summary-cards {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .filters-section {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-group {
            width: 100%;
          }
          .summary-cards {
            grid-template-columns: 1fr; /* Stack cards on smaller screens */
          }
          .summary-card {
            width: 100%;
          }
          h2 {
            font-size: 2.5em;
          }
          h3 {
            font-size: 1.5em;
          }
        }

        @media (max-width: 480px) {
          .sales-report-container {
            padding: 15px;
            margin: 15px auto;
          }
          h2 {
            font-size: 2em;
            margin-bottom: 25px;
          }
          .filters-section {
            padding: 15px;
            gap: 10px;
          }
          .filter-input {
            padding: 6px;
            font-size: 1em;
          }
        }
      `}</style>
    </div>
  );
};

export default SalesReport;