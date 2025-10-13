import React, { useState, useEffect } from 'react';
import { FaPrint, FaBan } from 'react-icons/fa';

export default function GenerateBillPage({
  customer,
  cart,
  totalPrice,
  discountPercent,
  discountAmount,
  netPay,
  vatableSale,
  vatAmount,
  onGoBack,
  onPrintReceipt,
  onSaveReceipt,
  cashGiven: initialCashGiven
}) {
  const [cashGiven, setCashGiven] = useState(initialCashGiven || 0);
  const [change, setChange] = useState(0);

  useEffect(() => {
    setChange(cashGiven - netPay);
  }, [cashGiven, netPay]);

  const currentReceiptDetails = {
    customer: customer,
    cart: cart,
    totalPrice: totalPrice,
    discountPercent: discountPercent,
    discountAmount: discountAmount,
    netPay: netPay,
    cashGiven: cashGiven,
    change: change, // Reverted to 'change' to match what handlePrint expects
    paymentMethod: 'Cash',
    vatableSale: vatableSale,
    vatAmount: vatAmount,
    transaction_date: new Date().toISOString(),
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
      <h2 style={{ marginBottom: '15px' }}>Generate Bill</h2>

      <div style={{ marginBottom: '15px' }}>
        <p><strong>Customer:</strong> {customer.name || 'Walk-in Customer'}</p>
        <p><strong>Address:</strong> {customer.address || 'N/A'}</p>
        <p><strong>TIN:</strong> {customer.tin || 'N/A'}</p>
      </div>

      <h3 style={{ marginBottom: '10px' }}>Cart Items:</h3>
      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px', border: '1px solid #eee', borderRadius: '4px', padding: '5px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '5px' }}>Qty</th>
              <th style={{ textAlign: 'left', padding: '5px' }}>Item</th>
              <th style={{ textAlign: 'right', padding: '5px' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '5px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '10px' }}>Cart is empty</td>
              </tr>
            ) : (
              cart.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '5px' }}>{item.quantity}</td>
                  <td style={{ padding: '5px' }}>{item.name}</td>
                  <td style={{ textAlign: 'right', padding: '5px' }}>{item.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '5px' }}>{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'right', marginBottom: '15px' }}>
        <p><strong>Subtotal:</strong> {totalPrice.toFixed(2)}</p>
        <p><strong>Discount ({discountPercent.toFixed(2)}%):</strong> {discountAmount.toFixed(2)}</p>
        <h3><strong>Net Pay:</strong> {netPay.toFixed(2)}</h3>
        <p><strong>VATable Sale:</strong> {vatableSale.toFixed(2)}</p>
        <p><strong>VAT (12%):</strong> {vatAmount.toFixed(2)}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Payment Details (Cash):</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Cash Given:</label>
          <input
            type="number"
            value={cashGiven}
            onChange={(e) => setCashGiven(parseFloat(e.target.value))}
            step="0.01"
            min="0"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Change:</label>
          <input
            type="text"
            value={change.toFixed(2)}
            readOnly
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            onPrintReceipt(currentReceiptDetails);
            onSaveReceipt(currentReceiptDetails);
          }}
          disabled={cart.length === 0 || cashGiven < netPay}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: cart.length === 0 || cashGiven < netPay ? 0.6 : 1
          }}
        >
          <FaPrint style={{ marginRight: '5px' }} /> Print & Save Receipt
        </button>
        <button
          onClick={onGoBack}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#ccc',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <FaBan style={{ marginRight: '5px' }} /> Back to POS
        </button>
      </div>
    </div>
  );
}