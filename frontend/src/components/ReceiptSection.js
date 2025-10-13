import React from 'react';

export default function ReceiptSection({
  customer,
  cart,
  totalPrice,
  discountPercent,
  discountAmount,
  netPay,
  cashGiven,
  change,
  paymentMethod,
  vatableSale,
  vatAmount,
  transaction_date = new Date().toISOString(),
}) {
  return (
    <div className="receipt">
      <div className="header">
        <p>R.B. Gonzales Pharmacy</p>
        <p>MUNICIPALITY OF BOLALACAO, ISLAND OF MINDORO</p>
        <p>Campaasan, Bulalacao, Oriental Mindoro</p>
        <p>VAT REG TIN: 201-277-095-00328</p>
        <p>MIN: 17111713493850977 S/N: 41-BAWXH</p>
        <p>SALES INVOICE</p>
      </div>
      <div className="trans-info">
        <p>
          Trans. Date: {new Date(transaction_date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })}{' '}
          {new Date(transaction_date).toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </p>
        <p>PST 384-006-00224713 TH 3840060000235221</p>
        <p>C: 171 {customer.name || 'GUEST'} / B: 1 Bagger</p>
      </div>

      <table className="items">
        <thead>
          <tr>
            <th>Qty</th>
            <th>Desc</th>
            <th style={{ textAlign: 'right' }}>Amt</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index}>
              <td>{item.quantity}</td>
              <td>{typeof item.name === 'string' ? item.name.substring(0, 20) : ''}</td>
              <td style={{ textAlign: 'right' }}>
                {(item.price * item.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="total-section">
        Subtotal <span className="value">{totalPrice.toFixed(2)}</span>
      </div>
      <div className="total-section">
        Total Discount ({discountPercent.toFixed(2)}%) <span className="value">{discountAmount.toFixed(2)}</span>
      </div>
      <div className="total-section bold">
        Total <span className="value">{netPay.toFixed(2)}</span>
      </div>
      <div className="total-section">
        CASH <span className="value">{cashGiven.toFixed(2)}</span>
      </div>
      <div className="total-section">
        CHANGE <span className="value">{change.toFixed(2)}</span>
      </div>

      <div className="other-info">
        <p>Item Purchased: {cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
        <p>
          VATable Sale (V) <span className="value">{vatableSale.toFixed(2)}</span>
        </p>
        <p>
          VAT (12%) <span className="value">{vatAmount.toFixed(2)}</span>
        </p>
        <p>VAT Exempt Sale (E) <span className="value">0.00</span></p>
        <p>Zero Rated Sale (Z) <span className="value">0.00</span></p>
      </div>

      <div className="payment-info">
        <p>Payment Method: <span className="value">{paymentMethod}</span></p>
      </div>

      <div className="footer">
        <p>THANK YOU FOR SHOPPING</p>
      </div>
    </div>
  );
}
