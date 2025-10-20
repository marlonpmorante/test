import React, { useState, useEffect } from 'react';
import { FaKeyboard, FaTimes, FaPlus } from 'react-icons/fa';

const ManualAddModal = ({ isOpen, onClose, onAdd }) => {
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setQuantity(1);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!code) {
      alert('Enter a code/ID/barcode');
      return;
    }
    const qty = parseInt(quantity, 10) || 1;
    if (qty < 1) {
      alert('Quantity must be at least 1');
      return;
    }
    onAdd?.({ code: String(code).trim(), quantity: qty });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="manual-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FaKeyboard className="modal-icon" /> Manual Add
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label htmlFor="code">Code / ID / Barcode</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter code, ID, or barcode"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="add-btn" onClick={handleSubmit}>
            <FaPlus /> Add to Cart
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
          .manual-add-modal {
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          label { font-weight: 600; color: #3c3c3c; }
          input {
            padding: 10px 12px;
            border: 2px solid #d9d9d9;
            border-radius: 10px;
            font-size: 0.95rem;
          }
          .modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 14px 20px; background: #f8f9fa; border-top: 1px solid #eee; }
          .add-btn { background: #667eea; color: white; border: none; border-radius: 10px; padding: 12px 16px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 8px; }
          .close-btn { background: #6c757d; color: white; border: none; border-radius: 10px; padding: 12px 16px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        `}</style>
      </div>
    </div>
  );
};

export default ManualAddModal;