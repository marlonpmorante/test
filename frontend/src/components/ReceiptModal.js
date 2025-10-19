import React from 'react';
import { FaPrint, FaTimes, FaDownload } from 'react-icons/fa';

const ReceiptModal = ({ isOpen, onClose, receiptData, onPrint, onSave }) => {
  if (!isOpen || !receiptData) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Receipt</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 0;
              padding: 10px;
            }
            .receipt { 
              width: 280px; 
              margin: 0 auto; 
              padding: 10px; 
              border: 1px dashed #000; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 10px; 
              line-height: 1.2; 
            }
            .trans-info { 
              margin-bottom: 10px; 
              font-size: 11px; 
            }
            .items { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 10px; 
            }
            .items th, .items td { 
              padding: 3px 5px; 
              text-align: left; 
              border-bottom: 1px dotted #ccc; 
            }
            .items th { 
              font-weight: bold; 
              background-color: #f0f0f0;
            }
            .total-section { 
              text-align: right; 
              margin-bottom: 5px; 
              font-size: 11px; 
            }
            .total-section.bold { 
              font-weight: bold; 
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              margin-top: 15px; 
              font-size: 10px; 
            }
            .customer-info { 
              margin-top: 10px; 
              font-size: 11px; 
              border-top: 1px dashed #000; 
              padding-top: 8px; 
            }
            .customer-field { 
              margin-bottom: 3px; 
            }
            .value { 
              float: right; 
            }
            .payment-info { 
              margin-top: 10px; 
              font-size: 11px; 
              border-top: 1px dashed #000; 
              padding-top: 8px; 
            }
            .other-info {
              margin-top: 10px;
              font-size: 10px;
              border-top: 1px dashed #000;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <p><strong>R.B. Gonzales Pharmacy</strong></p>
              <p>MUNICIPALITY OF BOLALACAO, ISLAND OF MINDORO</p>
              <p>Campaasan, Bulalacao, Oriental Mindoro</p>
              <p>VAT REG TIN: 201-277-095-00328</p>
              <p>MIN: 17111713493850977 S/N: 41-BAWXH</p>
              <p><strong>SALES INVOICE</strong></p>
            </div>
            <div class="trans-info">
              <p>Trans. Date: ${formatDate(receiptData.transaction_date)} ${formatTime(receiptData.transaction_date)}</p>
              <p>PST 384-006-00224713 TH 3840060000235221</p>
              <p>C: 171 ${receiptData.customer?.name || 'GUEST'} / B: 1 Bagger</p>
            </div>

            <table class="items">
              <thead>
                <tr><th>Qty</th><th>Desc</th><th style="text-align: right;">Amt</th></tr>
              </thead>
              <tbody>
                ${receiptData.cart?.map(item => `
                  <tr>
                    <td>${item.quantity}</td>
                    <td>${typeof item.name === 'string' ? item.name.substring(0, 20) : ''}</td>
                    <td style="text-align: right;">₱${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>

            <div class="total-section">
              Subtotal <span class="value">₱${(receiptData.totalPrice || 0).toFixed(2)}</span>
            </div>
            <div class="total-section">
              Total Discount (${receiptData.discountType === 'none' ? '0' : receiptData.discountType}) (${(receiptData.discountPercent || 0).toFixed(2)}%) <span class="value">₱${(receiptData.discountAmount || 0).toFixed(2)}</span>
            </div>
            <div class="total-section bold">
              Total <span class="value">₱${(receiptData.netPay || 0).toFixed(2)}</span>
            </div>
            <div class="total-section">
              CASH <span class="value">₱${(receiptData.cashGiven || 0).toFixed(2)}</span>
            </div>
            <div class="total-section">
              CHANGE <span class="value">₱${(receiptData.change || 0).toFixed(2)}</span>
            </div>

            <div class="other-info">
              <p>Item Purchased: ${receiptData.cart?.reduce((sum, item) => sum + item.quantity, 0) || 0}</p>
              <p>
                VATable Sale (V) <span class="value">₱${(receiptData.vatableSale || 0).toFixed(2)}</span>
              </p>
              <p>
                VAT (12%) <span class="value">₱${(receiptData.vatAmount || 0).toFixed(2)}</span>
              </p>
              <p>VAT Exempt Sale (E) <span class="value">₱0.00</span></p>
              <p>Zero Rated Sale (Z) <span class="value">₱0.00</span></p>
            </div>

            <div class="payment-info">
              <p>Payment Method: <span class="value">Cash</span></p>
            </div>

            <div class="footer">
              <p><strong>THANK YOU FOR SHOPPING</strong></p>
              <p>Please keep this receipt for your records</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FaPrint className="modal-icon" />
            Receipt Preview
          </div>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="receipt-preview">
            <div className="receipt-header">
              <h3>R.B. Gonzales Pharmacy</h3>
              <p>MUNICIPALITY OF BOLALACAO, ISLAND OF MINDORO</p>
              <p>Campaasan, Bulalacao, Oriental Mindoro</p>
              <p>VAT REG TIN: 201-277-095-00328</p>
              <p>MIN: 17111713493850977 S/N: 41-BAWXH</p>
              <p><strong>SALES INVOICE</strong></p>
            </div>

            <div className="transaction-info">
              <p><strong>Trans. Date:</strong> {formatDate(receiptData.transaction_date)} {formatTime(receiptData.transaction_date)}</p>
              <p>PST 384-006-00224713 TH 3840060000235221</p>
              <p>C: 171 {receiptData.customer?.name || 'GUEST'} / B: 1 Bagger</p>
            </div>

            <div className="items-section">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Qty</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.cart?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.quantity}</td>
                      <td>{item.name}</td>
                      <td>₱{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  )) || []}
                </tbody>
              </table>
            </div>

            <div className="totals-section">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>₱{(receiptData.totalPrice || 0).toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Discount ({receiptData.discountType === 'none' ? '0' : receiptData.discountType}) ({(receiptData.discountPercent || 0).toFixed(2)}%):</span>
                <span>-₱{(receiptData.discountAmount || 0).toFixed(2)}</span>
              </div>
              <div className="total-row bold">
                <span>Total:</span>
                <span>₱{(receiptData.netPay || 0).toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Cash Given:</span>
                <span>₱{(receiptData.cashGiven || 0).toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Change:</span>
                <span>₱{(receiptData.change || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="other-info">
              <p>Items Purchased: {receiptData.cart?.reduce((sum, item) => sum + item.quantity, 0) || 0}</p>
              <p>VATable Sale (V): ₱{(receiptData.vatableSale || 0).toFixed(2)}</p>
              <p>VAT (12%): ₱{(receiptData.vatAmount || 0).toFixed(2)}</p>
              <p>VAT Exempt Sale (E): ₱0.00</p>
              <p>Zero Rated Sale (Z): ₱0.00</p>
            </div>

            <div className="payment-info">
              <p><strong>Payment Method:</strong> Cash</p>
            </div>

            <div className="receipt-footer">
              <p><strong>THANK YOU FOR SHOPPING</strong></p>
              <p>Please keep this receipt for your records</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn print-btn" onClick={handlePrint}>
            <FaPrint /> Print Receipt
          </button>
          <button className="action-btn save-btn" onClick={onSave}>
            <FaDownload /> Save Receipt
          </button>
          <button className="action-btn close-btn" onClick={onClose}>
            <FaTimes /> Close
          </button>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
          }

          .receipt-modal {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: slideIn 0.3s ease-out;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-50px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 25px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border-bottom: 1px solid #e0e0e0;
          }

          .modal-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.4rem;
            font-weight: 600;
          }

          .modal-icon {
            font-size: 1.2rem;
          }

          .close-button {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: background-color 0.2s;
          }

          .close-button:hover {
            background-color: rgba(255, 255, 255, 0.2);
          }

          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 20px 25px;
            background: #f8f9fa;
          }

          .receipt-preview {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
          }

          .receipt-header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }

          .receipt-header h3 {
            margin: 0 0 5px 0;
            font-size: 16px;
            font-weight: bold;
          }

          .receipt-header p {
            margin: 2px 0;
            font-size: 11px;
          }

          .transaction-info {
            margin-bottom: 15px;
            font-size: 11px;
          }

          .transaction-info p {
            margin: 2px 0;
          }

          .items-section {
            margin-bottom: 15px;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }

          .items-table th,
          .items-table td {
            padding: 3px 5px;
            text-align: left;
            border-bottom: 1px dotted #ccc;
          }

          .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .items-table td:last-child {
            text-align: right;
          }

          .totals-section {
            margin-bottom: 15px;
            border-top: 1px dashed #333;
            padding-top: 10px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 11px;
          }

          .total-row.bold {
            font-weight: bold;
            font-size: 13px;
            border-top: 1px solid #333;
            padding-top: 5px;
            margin-top: 5px;
          }

          .other-info {
            margin-bottom: 15px;
            font-size: 10px;
            border-top: 1px dashed #333;
            padding-top: 10px;
          }

          .other-info p {
            margin: 2px 0;
          }

          .payment-info {
            margin-bottom: 15px;
            font-size: 11px;
            border-top: 1px dashed #333;
            padding-top: 10px;
          }

          .receipt-footer {
            text-align: center;
            font-size: 11px;
            border-top: 2px solid #333;
            padding-top: 10px;
          }

          .receipt-footer p {
            margin: 3px 0;
          }

          .modal-footer {
            display: flex;
            justify-content: space-between;
            padding: 20px 25px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
            gap: 10px;
          }

          .action-btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            font-size: 14px;
          }

          .print-btn {
            background: #007bff;
            color: white;
          }

          .print-btn:hover {
            background: #0056b3;
            transform: translateY(-2px);
          }

          .save-btn {
            background: #28a745;
            color: white;
          }

          .save-btn:hover {
            background: #1e7e34;
            transform: translateY(-2px);
          }

          .close-btn {
            background: #6c757d;
            color: white;
          }

          .close-btn:hover {
            background: #545b62;
            transform: translateY(-2px);
          }

          @media (max-width: 768px) {
            .receipt-modal {
              width: 95%;
              margin: 10px;
            }

            .modal-footer {
              flex-direction: column;
            }

            .action-btn {
              justify-content: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ReceiptModal;
