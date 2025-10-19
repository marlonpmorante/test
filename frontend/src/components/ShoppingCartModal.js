import React from 'react';
import { FaShoppingCart, FaTimes, FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

const ShoppingCartModal = ({ isOpen, onClose, cart, onRemoveFromCart, onUpdateQuantity, onClearCart }) => {
  if (!isOpen) return null;

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      onRemoveFromCart(itemId);
    } else {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="shopping-cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FaShoppingCart className="modal-icon" />
            Shopping Cart ({cart.length} items)
          </div>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <FaShoppingCart className="empty-cart-icon" />
              <p>Your cart is empty</p>
              <p>Add some products to get started!</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-price">₱{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          <FaMinus />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <FaPlus />
                        </button>
                      </div>
                      <div className="item-total">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => onRemoveFromCart(item.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₱{totalPrice.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₱{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {cart.length > 0 && (
            <button className="clear-cart-btn" onClick={onClearCart}>
              <FaTrash /> Clear Cart
            </button>
          )}
          <button className="close-modal-btn" onClick={onClose}>
            Close
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

          .shopping-cart-modal {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          }

          .empty-cart {
            text-align: center;
            padding: 40px 20px;
            color: #666;
          }

          .empty-cart-icon {
            font-size: 3rem;
            color: #ddd;
            margin-bottom: 20px;
          }

          .empty-cart p {
            margin: 10px 0;
            font-size: 1.1rem;
          }

          .cart-items {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 12px;
            border: 1px solid #e9ecef;
            transition: all 0.2s ease;
          }

          .cart-item:hover {
            background: #e9ecef;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .item-info {
            flex: 1;
          }

          .item-name {
            margin: 0 0 5px 0;
            font-size: 1rem;
            font-weight: 600;
            color: #333;
            line-height: 1.3;
          }

          .item-price {
            margin: 0;
            font-size: 0.9rem;
            color: #666;
          }

          .item-controls {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .quantity-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            background: white;
            border-radius: 8px;
            padding: 5px;
            border: 1px solid #ddd;
          }

          .quantity-btn {
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s;
            font-size: 0.8rem;
          }

          .quantity-btn:hover {
            background: #5a6fd8;
          }

          .quantity {
            font-weight: 600;
            min-width: 20px;
            text-align: center;
          }

          .item-total {
            font-weight: 700;
            color: #333;
            font-size: 1.1rem;
            min-width: 80px;
            text-align: right;
          }

          .remove-btn {
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s;
            font-size: 0.9rem;
          }

          .remove-btn:hover {
            background: #c82333;
          }

          .cart-summary {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
            border: 1px solid #e9ecef;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 1.1rem;
          }

          .summary-row.total {
            font-weight: 700;
            font-size: 1.3rem;
            color: #333;
            border-top: 2px solid #667eea;
            padding-top: 10px;
            margin-top: 10px;
          }

          .modal-footer {
            display: flex;
            justify-content: space-between;
            padding: 20px 25px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
            gap: 15px;
          }

          .clear-cart-btn {
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 20px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background-color 0.2s;
          }

          .clear-cart-btn:hover {
            background: #c82333;
          }

          .close-modal-btn {
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 25px;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.2s;
          }

          .close-modal-btn:hover {
            background: #5a6268;
          }

          @media (max-width: 768px) {
            .shopping-cart-modal {
              width: 95%;
              margin: 10px;
            }

            .cart-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 15px;
            }

            .item-controls {
              width: 100%;
              justify-content: space-between;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ShoppingCartModal;
