import React, { useMemo, useState, useEffect } from 'react';
import { FaMoneyBillWave, FaTimes, FaCheck } from 'react-icons/fa';

const PaymentModal = ({
  isOpen,
  onClose,
  totalPrice,
  defaultDiscountType = 'none',
  defaultCustomDiscount = 0,
  defaultCashGiven = '',
  onConfirm,
}) => {
  if (!isOpen) return null;

  const [discountType, setDiscountType] = useState(defaultDiscountType);
  const [customDiscount, setCustomDiscount] = useState(defaultCustomDiscount);
  const [cashGiven, setCashGiven] = useState(defaultCashGiven);

  useEffect(() => {
    setDiscountType(defaultDiscountType);
    setCustomDiscount(defaultCustomDiscount);
    setCashGiven(defaultCashGiven);
  }, [defaultDiscountType, defaultCustomDiscount, defaultCashGiven]);

  const { effectiveDiscountPercent, discountAmount, netPay, change } = useMemo(() => {
    const discountRates = {
      none: 0,
      senior: 20,
      pwd: 20,
      student: 10,
    };
    const percent = discountType === 'custom' ? (parseFloat(customDiscount) || 0) : discountRates[discountType] || 0;
    const discount = (parseFloat(totalPrice) || 0) * percent / 100;
    const net = (parseFloat(totalPrice) || 0) - discount;
    const cash = parseFloat(cashGiven) || 0;
    const chg = cash - net;
    return {
      effectiveDiscountPercent: percent,
      discountAmount: discount,
      netPay: net,
      change: chg,
    };
  }, [discountType, customDiscount, totalPrice, cashGiven]);

  const handleConfirm = () => {
    if ((parseFloat(cashGiven) || 0) < netPay) {
      alert('Cash given is less than the net payable amount.');
      return;
    }
    onConfirm?.({
      discountType,
      effectiveDiscountPercent,
      discountAmount,
      netPay,
      cashGiven: parseFloat(cashGiven) || 0,
      change,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FaMoneyBillWave className="modal-icon" /> Payment
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="summary">
            <div className="row">
              <span>Subtotal:</span>
              <span>₱{(parseFloat(totalPrice) || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="discountType">Discount Type</label>
            <select
              id="discountType"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
            >
              <option value="none">No Discount</option>
              <option value="senior">Senior Citizen</option>
              <option value="pwd">Person With Disability (PWD)</option>
              <option value="student">Student</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {discountType === 'custom' && (
            <div className="field">
              <label htmlFor="customDiscount">Custom Discount (%)</label>
              <input
                id="customDiscount"
                type="number"
                min="0"
                max="100"
                value={customDiscount}
                onChange={(e) => setCustomDiscount(e.target.value)}
                placeholder="Enter %"
              />
            </div>
          )}

          <div className="summary">
            <div className="row">
              <span>Discount ({effectiveDiscountPercent.toFixed(2)}%):</span>
              <span>-₱{discountAmount.toFixed(2)}</span>
            </div>
            <div className="row total">
              <span>Net Payable:</span>
              <span>₱{netPay.toFixed(2)}</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="cashGiven">Cash Given</label>
            <input
              id="cashGiven"
              type="number"
              value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="summary">
            <div className="row">
              <span>Change:</span>
              <span>₱{change.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="confirm-btn" onClick={handleConfirm}>
            <FaCheck /> Confirm & Preview
          </button>
          <button className="close-btn" onClick={onClose}>
            <FaTimes /> Cancel
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
            backdrop-filter: blur(4px);
          }
          .payment-modal {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.25);
            width: 92%;
            max-width: 520px;
            max-height: 88vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: linear-gradient(135deg, #00796B 0%, #20c997 100%);
            color: #fff;
          }
          .modal-title { display: flex; align-items: center; gap: 10px; font-weight: 700; }
          .modal-icon { font-size: 1.2rem; }
          .close-button {
            background: transparent;
            border: none;
            color: #fff;
            font-size: 1.2rem;
            cursor: pointer;
            border-radius: 6px;
            padding: 6px;
          }
          .modal-body { padding: 18px 20px; overflow-y: auto; }
          .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
          label { font-weight: 600; color: #00796B; }
          input, select {
            padding: 10px 12px;
            border: 2px solid #B0BEC5;
            border-radius: 10px;
            font-size: 0.95rem;
          }
          .summary { border-top: 1px dashed #B0BEC5; padding-top: 10px; margin-top: 8px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .row.total { font-weight: 700; font-size: 1.1rem; color: #00796B; }
          .modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 14px 20px; background: #f8f9fa; border-top: 1px solid #eee; }
          .confirm-btn { background: #4CAF50; color: white; border: none; border-radius: 10px; padding: 12px 16px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 8px; }
          .close-btn { background: #6c757d; color: white; border: none; border-radius: 10px; padding: 12px 16px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        `}</style>
      </div>
    </div>
  );
};

export default PaymentModal;
