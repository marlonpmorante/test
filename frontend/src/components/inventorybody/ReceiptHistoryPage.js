import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config';
import { FaPrint, FaEye, FaTrash } from 'react-icons/fa';

export default function ReceiptHistoryPage({ onGoBackToPOS, onPrintReceipt, onGoBack }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false); // New state for details loading
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  // Function to fetch all receipts from the backend
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/receipts'));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setReceipts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('Failed to load receipt history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchReceipts();
  }, []);


  const handleViewReceiptDetails = async (receiptId) => {
    try {
      setLoadingDetails(true); // Set loading for details
      const res = await fetch(apiUrl(`/receipts/${receiptId}`));
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setSelectedReceipt(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching receipt details:', err);
      setError('Failed to load receipt details. Please try again.');
    } finally {
      setLoadingDetails(false); // Clear loading
    }
  };

  const handleCloseDetails = () => {
    setSelectedReceipt(null);
    setError(null);
  };

  const handleDeleteClick = (receipt) => {
    setReceiptToDelete(receipt);
    setShowConfirmModal(true);
  };

  const showCustomNotification = (message, type) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotificationModal(true);
  };

  const handleCloseNotification = () => {
    setShowNotificationModal(false);
    setNotificationMessage('');
    setNotificationType('success');
  };

  const handleConfirmDelete = async () => {
    if (receiptToDelete) {
      try {
        const response = await fetch(apiUrl(`/receipts/${receiptToDelete.id}`), {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await fetchReceipts(); // Refresh the list of receipts
        setShowConfirmModal(false);
        setReceiptToDelete(null);
        showCustomNotification('Receipt deleted successfully!', 'success');
      } catch (err) {
        console.error('Error deleting receipt:', err);
        setShowConfirmModal(false);
        setReceiptToDelete(null);
        showCustomNotification('Failed to delete receipt. Please try again.', 'error');
      }
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setReceiptToDelete(null);
  };

  // Confirmation Modal Component
  const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
    <div className="custom-modal-overlay">
      <div className="custom-modal-content">
        <p>{message}</p>
        <div className="custom-modal-actions">
          <button
            onClick={onConfirm}
            className="custom-modal-button confirm-button"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="custom-modal-button cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Notification Modal Component
  const NotificationModal = ({ message, type, onClose }) => (
    <div className="custom-modal-overlay">
      <div className="custom-modal-content">
        <p className={type === 'error' ? 'error-message-text' : 'success-message-text'}>{message}</p>
        <button
          onClick={onClose}
          className="custom-modal-button"
        >
          OK
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-message">
        <p>Loading receipt history...</p>
      </div>
    );
  }

  return (
    <div className="receipt-history-container">
      <h2>Receipt History</h2>
      {error && (
        <div className="error-container">{error}</div>
      )}
      {selectedReceipt ? (
        loadingDetails ? (
          <div className="loading-message">
            <p>Loading receipt details...</p>
          </div>
        ) : (
          <div className="receipt-details-card">
            <h3>Receipt Details (Receipt No: {selectedReceipt.receipt_number || selectedReceipt.id})</h3>
            <p><strong>Date:</strong> {new Date(selectedReceipt.transaction_date).toLocaleString()}</p>
            <p><strong>Customer:</strong> {selectedReceipt.customer_name || 'N/A'}</p>
            <p><strong>Address:</strong> {selectedReceipt.customer_address || 'N/A'}</p>
            <p><strong>TIN:</strong> {selectedReceipt.customer_tin || 'N/A'}</p>
            <p><strong>Payment Method:</strong> {selectedReceipt.payment_method}</p>

            <h4 className="section-title">Items:</h4>
            <table className="receipt-items-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="text-right">Qty</th>
                  <th scope="col" className="text-right">Price</th>
                  <th scope="col" className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedReceipt.cart && selectedReceipt.cart.length > 0 ? (
                  selectedReceipt.cart.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td className="text-right">{parseFloat(item.price).toFixed(2)}</td>
                      <td className="text-right">{(parseFloat(item.quantity) * parseFloat(item.price)).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-items-message">No items for this receipt.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <p className="summary-line"><strong>Subtotal:</strong> {parseFloat(selectedReceipt.total_price).toFixed(2)}</p>
            <p className="summary-line"><strong>Discount ({selectedReceipt.discount_percent}%):</strong> {parseFloat(selectedReceipt.discount_amount).toFixed(2)}</p>
            <p className="summary-line total-line">Net Pay: {parseFloat(selectedReceipt.net_pay).toFixed(2)}</p>
            <p className="summary-line">Cash Given: {parseFloat(selectedReceipt.cash_given).toFixed(2)}</p>
            <p className="summary-line">Change: {parseFloat(selectedReceipt.change_amount).toFixed(2)}</p>
            <p className="summary-line">VATable Sale: {parseFloat(selectedReceipt.vatable_sale).toFixed(2)}</p>
            <p className="summary-line">VAT Amount: {parseFloat(selectedReceipt.vat_amount).toFixed(2)}</p>

            <div className="button-group">
              <button
                onClick={handleCloseDetails}
                className="action-button secondary-button"
              >
                Close Details
              </button>
              <button
                onClick={() => {
                  const receiptDataToPrint = {
                    customer: { name: selectedReceipt.customer_name, address: selectedReceipt.customer_address, tin: selectedReceipt.customer_tin },
                    cart: selectedReceipt.cart?.map(item => ({ id: item.product_id, name: item.product_name, quantity: item.quantity, price: item.price })),
                    totalPrice: selectedReceipt.total_price,
                    discountPercent: selectedReceipt.discount_percent,
                    discountAmount: selectedReceipt.discount_amount,
                    netPay: selectedReceipt.net_pay,
                    cashGiven: selectedReceipt.cash_given,
                    change: selectedReceipt.change_amount,
                    paymentMethod: selectedReceipt.payment_method,
                    vatableSale: selectedReceipt.vatable_sale,
                    vatAmount: selectedReceipt.vat_amount,
                    transaction_date: selectedReceipt.transaction_date,
                  };
                  console.log("Attempting to re-print receipt with data:", receiptDataToPrint);
                  onPrintReceipt(receiptDataToPrint);
                }}
                className="action-button primary-button"
              >
                <FaPrint /> Re-print Receipt
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="table-responsive">
          <table className="receipts-table">
            <thead>
              <tr>
                <th>Receipt Number</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="text-right">Items (Count)</th>
                <th className="text-right">Total Qty</th>
                <th className="text-right">Gross Amount</th>
                <th className="text-right">Net Pay</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-receipts-message">No receipts found.</td>
                </tr>
              ) : (
                receipts.map((receipt) => {
                  const totalItemsCount = receipt.cart?.length || 0;
                  const totalQuantity = receipt.cart?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
                  const grossAmount = (parseFloat(receipt.total_price) || 0).toFixed(2);

                  return (
                    <tr key={receipt.id}>
                      <td>{receipt.receipt_number || receipt.id}</td>
                      <td>{new Date(receipt.transaction_date).toLocaleString()}</td>
                      <td>{receipt.customer_name || 'GUEST'}</td>
                      <td>{totalItemsCount}</td>
                      <td>{totalQuantity}</td>
                      <td>{grossAmount}</td>
                      <td>{parseFloat(receipt.net_pay).toFixed(2)}</td>
                      <td className="text-center">
                        <button
                          onClick={() => handleViewReceiptDetails(receipt.id)}
                          className="icon-button view-button"
                        >
                          <FaEye /> View
                        </button>
                        <button
                          onClick={() => handleDeleteClick(receipt)}
                          className="icon-button delete-button"
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showConfirmModal && (
        <ConfirmationModal
          message={`Are you sure you want to delete receipt ${receiptToDelete?.receipt_number || receiptToDelete?.id}? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {showNotificationModal && (
        <NotificationModal
          message={notificationMessage}
          type={notificationType}
          onClose={handleCloseNotification}
        />
      )}

      <style jsx>{`
        .receipt-history-container {
          font-family: 'Arial', sans-serif;
          padding: 20px;
          max-width: 1500px; /* Increased max-width for better table display */
          margin: 20px auto;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        h2 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
          font-size: 2.5em;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }

        h3 {
          color: #555;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee; /* Added for section titles */
          padding-bottom: 8px; /* Added for section titles */
        }

        .section-title {
          color: #555;
          margin-top: 25px;
          margin-bottom: 15px;
          font-size: 1.3em;
        }

        .loading-message, .error-message {
          text-align: center;
          padding: 20px;
          font-size: 1.2em;
          color: #e74c3c;
        }

        .loading-message {
          color: #3498db;
        }

        .error-container {
          text-align: center;
          padding: 20px;
          color: red;
          background-color: #ffe6e6;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .nav-button {
          background-color: #6c757d;
          color: white;
          padding: 12px 25px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          display: inline-flex; /* Changed to inline-flex for better alignment */
          align-items: center;
          gap: 5px;
          transition: background-color 0.3s ease;
          margin-bottom: 20px;
        }

        .nav-button:hover {
          background-color: #5a6268;
        }

        .back-to-pos {
          margin-right: auto; /* Push button to the left */
        }

        .receipt-details-card {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          margin-bottom: 25px;
        }

        .receipt-details-card p {
          margin-bottom: 8px;
          font-size: 1.05em;
          color: #333;
        }

        .receipt-items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 15px;
          background-color: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .receipt-items-table th,
        .receipt-items-table td {
          border: 1px solid #eee;
          padding: 12px;
          text-align: left;
          font-size: 0.95em;
        }

        .receipt-items-table th {
          background-color: #f2f2f2;
          font-weight: bold;
          color: #333;
        }

        .receipt-items-table tr:nth-child(even) {
          background-color: #f8f8f8;
        }

        .receipt-items-table tr:hover {
          background-color: #f1f1f1;
        }

        .no-items-message, .no-receipts-message {
          text-align: center;
          padding: 20px;
          color: #777;
          font-style: italic;
        }

        .text-right {
          text-align: right;
        }

        .text-center {
          text-align: center;
        }

        .summary-line {
          text-align: right;
          margin-bottom: 5px;
          color: #333;
        }

        .total-line {
          font-weight: bold;
          font-size: 1.15em;
          margin-top: 15px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }

        .button-group {
          display: flex;
          gap: 15px;
          margin-top: 30px;
          justify-content: flex-end; /* Align buttons to the right */
        }

        .action-button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.3s ease;
        }

        .primary-button {
          background-color: #167bb9;
          color: white;
        }

        .primary-button:hover {
          background-color: #136a9e;
        }

        .secondary-button {
          background-color: #6c757d;
          color: white;
        }

        .secondary-button:hover {
          background-color: #5a6268;
        }

        .receipts-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background-color: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .receipts-table th,
        .receipts-table td {
          border: 1px solid #eee;
          padding: 12px;
          text-align: left;
          font-size: 0.95em;
        }

        .receipts-table th {
          background-color: #f2f2f2;
          font-weight: bold;
          color: #333;
        }

        .receipts-table tr:nth-child(even) {
          background-color: #f8f8f8;
        }

        .receipts-table tr:hover {
          background-color: #f1f1f1;
        }

        .table-responsive {
          overflow-x: auto;
          margin-top: 20px; /* Adjusted margin */
          background: #fff; /* Added background for consistency */
          border-radius: 8px; /* Added border-radius */
          padding: 8px; /* Added padding */
          max-height: calc(100vh - 200px); /* Adjusted for overall container */
        }

        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.1em;
          margin: 0 5px;
          padding: 5px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
          display: inline-flex; /* Ensures icon and text are aligned */
          align-items: center;
          gap: 5px;
        }

        .icon-button.view-button {
          color: #167bb9;
        }

        .icon-button.view-button:hover {
          background-color: #e6f7ff;
        }

        .icon-button.delete-button {
          color: #dc3545;
        }

        .icon-button.delete-button:hover {
          background-color: #ffe6e6;
        }

        /* Custom Modal Styles (copied from StockReport.js) */
        .custom-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .custom-modal-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            text-align: center;
            width: 90%;
            max-width: 400px;
            color: #333;
        }

        .custom-modal-content p {
            margin-bottom: 20px;
            font-size: 1.1em;
        }

        .error-message-text {
          color: red;
        }

        .success-message-text {
          color: green;
        }

        .custom-modal-button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            transition: background-color 0.3s ease;
        }

        .custom-modal-button:hover {
            background-color: #0056b3;
        }

        .custom-modal-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 20px;
        }

        .custom-modal-actions .confirm-button {
            background-color: #28a745;
        }

        .custom-modal-actions .confirm-button:hover {
            background-color: #218838;
        }

        .custom-modal-actions .cancel-button {
            background-color: #dc3545;
        }

        .custom-modal-actions .cancel-button:hover {
            background-color: #c82333;
        }

        @media (max-width: 768px) {
          .nav-button {
            width: 100%;
            justify-content: center;
            margin-bottom: 15px;
          }
          .receipt-history-container {
            padding: 15px;
            margin: 10px auto;
          }
          .receipts-table th,
          .receipts-table td {
            padding: 8px;
            font-size: 0.9em;
          }
          .button-group {
            flex-direction: column;
            gap: 10px;
          }
          .action-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}