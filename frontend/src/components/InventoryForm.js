import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl, DELETE_PASSWORD } from '../config';
import { FaBan, FaPrint, FaShoppingCart } from 'react-icons/fa';
import ReceiptModal from './ReceiptModal';
import PaymentModal from './PaymentModal';

// Helper functions lifted to top-level for stability in hooks
const codesEqual = (a, b) => {
  const sa = String(a ?? '').trim();
  const sb = String(b ?? '').trim();
  if (sa === sb) return true;
  const na = Number(sa);
  const nb = Number(sb);
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
};
const getFullProductName = (product) => {
  const supplierName = product.supplierName || '';
  const brandName = product.brandName || '';
  const medicineName = product.medicineName || '';
  const form = product.form || '';
  const strength = product.strength || '';
  return `${supplierName} (${brandName}) - ${medicineName}, ${form}, ${strength}`;
};

const formatDateTimeForMySQL = (dateString) => {
  const date = new Date(dateString);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export default function InventoryForm() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState({ name: '', contact: '', tin: '', address: '' });
  const [cashGiven, setCashGiven] = useState('');
  const [discountType, setDiscountType] = useState('none');
  const [customDiscount, setCustomDiscount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const scanInputRef = useRef(null);
  const [scanQuantity, setScanQuantity] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(apiUrl('/products'));
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, []);


  const findProductByCode = (code) => {
    return products.find(p => (
      (p.barcode && codesEqual(p.barcode, code)) ||
      (p.medicineId && codesEqual(p.medicineId, code)) ||
      (p.id && codesEqual(p.id, code))
    ));
  };

  const handleScanProduct = (code, quantity = 1) => {
    const product = findProductByCode(code);
    if (product) {
      if (product.quantity === 0) {
        alert(`${getFullProductName(product)} is out of stock.`);
        return;
      }
      if (product.quantity < quantity) {
        alert(`Not enough stock for ${getFullProductName(product)}. Available: ${product.quantity}`);
        return;
      }

      const existingIndex = cart.findIndex(item => String(item.id) === String(product.id));
      const updatedCart = [...cart];

      const productToAdd = {
        id: product.id,
        name: getFullProductName(product),
        price: parseFloat(product.price),
        quantity: quantity
      };

      if (existingIndex >= 0) {
        updatedCart[existingIndex].quantity += quantity;
      } else {
        updatedCart.push(productToAdd);
      }
      setCart(updatedCart);

      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id
            ? { ...p, quantity: p.quantity - quantity }
            : p
        )
      )

    } else {
      alert('Product not found with code: ' + code);
    }
  };

  const handleRemoveFromCart = (productId) => {
    const providedPassword = window.prompt('Enter password to remove item from cart:');
    if (!providedPassword) return;
    if (String(providedPassword) !== String(DELETE_PASSWORD || '')) {
      alert('Incorrect password.');
      return;
    }
    const itemToRemove = cart.find(item => item.id === productId);
    if (!itemToRemove) return;

    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId
          ? { ...p, quantity: p.quantity + itemToRemove.quantity }
          : p
      )
    );
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setCurrentReceipt(null);
  };

  const handleSaveReceipt = async () => {
    if (!currentReceipt) return;

    const dataToSend = {
      customerName: currentReceipt.customer.name,
      customerAddress: currentReceipt.customer.address,
      customerTin: currentReceipt.customer.tin,
      cart: currentReceipt.cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: currentReceipt.totalPrice,
      discountPercent: currentReceipt.discountPercent,
      discountAmount: currentReceipt.discountAmount,
      netPay: currentReceipt.netPay,
      cashGiven: currentReceipt.cashGiven,
      changeAmount: currentReceipt.change,
      paymentMethod: 'cash',
      vatableSale: currentReceipt.vatableSale,
      vatAmount: currentReceipt.vatAmount,
      transaction_date: formatDateTimeForMySQL(currentReceipt.transaction_date),
    };

    try {
      const res = await fetch(apiUrl('/receipts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      const data = await res.json();
      if (res.ok) {
        console.log('Receipt saved successfully:', data);
        setCart([]);
        setCustomer({ name: '', contact: '', tin: '', address: '' });
        setCashGiven('');
        setDiscountType('none');
        setCustomDiscount(0);
        setShowReceiptModal(false);
        setCurrentReceipt(null);
        alert('Receipt saved successfully!');
      } else {
        console.error('Failed to save receipt:', data.error);
        alert('Failed to save receipt: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      alert('Error saving receipt. Please check server connection.');
    }
      };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePaymentConfirm = useCallback(({ discountType: confirmedDiscountType, effectiveDiscountPercent, discountAmount, netPay, cashGiven, change }) => {
    const vatRate = 0.12;
    const vatableSaleCalc = netPay / (1 + vatRate);
    const vatAmountCalc = netPay - vatableSaleCalc;


    const receiptData = {
      customer: customer,
      cart: cart,
      totalPrice: totalPrice,
      discountPercent: effectiveDiscountPercent,
      discountType: confirmedDiscountType,
      discountAmount: discountAmount,
      netPay: netPay,
      cashGiven: parseFloat(cashGiven) || 0,
      change: change,
      paymentMethod: 'cash',
      vatableSale: vatableSaleCalc,
      vatAmount: vatAmountCalc,
      transaction_date: new Date().toISOString(),
    };
    
    setDiscountType(confirmedDiscountType);
    if (confirmedDiscountType === 'custom') {
      setCustomDiscount(effectiveDiscountPercent);
    }
    setCashGiven(String(cashGiven));
    setCurrentReceipt(receiptData);
    setShowPaymentModal(false);
    setShowReceiptModal(true);
  }, [cart, customer, totalPrice]);

  const handlePrint = useCallback(() => {
    if (cart.length === 0) {
      alert('Cart is empty. Nothing to print.');
      return;
    }
    setShowPaymentModal(true);
  }, [cart.length]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Defensive check to prevent TypeError
      if (!event || !event.key) {
        return;
      }
      
      // Prevent default behavior for keys that might have native actions (e.g., space scrolls)
      if (['Enter', 'p', 'Backspace'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }

      // Check for modifier keys to avoid conflicts (e.g., Ctrl+P for print)
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      // Global shortcuts
      switch (event.key.toLowerCase()) {
        case 'p':
          // Print button
          handlePrint();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrint]);

  if (loading) return <div className="loading-message">Loading products...</div>;

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');

        :root {
          --primary-color:rgb(28, 177, 247);
          --secondary-color:rgb(44, 150, 220);
          --accent-color: #e21c83;
          --text-dark: #333333;
          --text-light: #f0f0f0;
          --bg-light: #f8f9fa;
          --bg-dark: #2c3e50;
          --border-color: #dcdcdc;
          --shadow-light: rgba(0, 0, 0, 0.08);
          --shadow-medium: rgba(0, 0, 0, 0.15);
          --success-color: #28a745;
          --danger-color: #dc3545;
          --info-color: #17a2b8;
        }

        * {
          box-sizing: border-box;
        }

        html, body, #__next, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        body {
          font-family: 'Poppins', sans-serif;
          background-color: var(--bg-light);
          color: var(--text-dark);
        }

        .container {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
          padding: 20px;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          background: linear-gradient(135deg, var(--bg-light) 0%, rgb(190, 233, 231) 100%);
        }

        .card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 8px 25px var(--shadow-light), 0 4px 10px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease;
          border: 1px solid #f0f0f0;
          height: 86%;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 35px var(--shadow-medium);
        }

        h2, h3 {
          margin-bottom: 20px;
          font-size: 2em;
          font-weight: 700;
          color: var(--secondary-color);
          border-left: 6px solid var(--accent-color);
          padding-left: 15px;
          padding-bottom: 5px;
          display: flex;
          align-items: center;
          background: linear-gradient(90deg, var(--secondary-color) 0%, rgba(137, 44, 220, 0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        h3 {
          font-size: 1.6em;
          color: var(--primary-color);
          border-left: 4px solid var(--accent-color);
          background: -webkit-linear-gradient(45deg, var(--primary-color), var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .loading-message {
          text-align: center;
          padding: 30px;
          font-size: 1.6em;
          color: var(--info-color);
          background-color: #e0f7fa;
          border-radius: 15px;
          margin: 40px auto;
          border: 1px solid var(--info-color);
          box-shadow: 0 5px 15px rgba(23, 162, 184, 0.2);
          max-width: 500px;
        }

        input[type="text"], input[type="number"], input[type="date"], select {
          padding: 12px 15px;
          margin-bottom: 15px;
          font-size: 1rem;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          width: 100%;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          background-color: #fcfcfc;
          color: var(--text-dark);
        }

        input[type="text"]:focus, input[type="number"]:focus, input[type="date"]:focus, select:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(212, 0, 255, 0.2);
          outline: none;
          background-color: #ffffff;
        }

        button {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          letter-spacing: 0.5px;
        }

        button:active {
          transform: translateY(1px);
          box-shadow: 0 1px 6px rgba(0,0,0,0.2);
        }

        button.primary {
          background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
          color: white;
        }

        button.primary:hover {
          background: linear-gradient(45deg, var(--secondary-color), var(--primary-color));
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(106, 5, 126, 0.4);
        }

        button.secondary {
          background: linear-gradient(45deg, #6C7A89, #596570);
          color: white;
        }

        button.secondary:hover {
          background: linear-gradient(45deg, #596570, #6C7A89);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(108, 122, 137, 0.4);
        }

        button.success {
          background: linear-gradient(45deg, var(--success-color), #218838);
          color: white;
        }

        button.success:hover {
          background: linear-gradient(45deg, #218838, var(--success-color));
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }

        button.error {
          background: linear-gradient(45deg, var(--danger-color), #c82333);
          color: white;
        }

        button.error:hover {
          background: linear-gradient(45deg, #c82333, var(--danger-color));
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 0.95rem;
          margin-bottom: 15px;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        table thead {
          flex-shrink: 0;
        }

        table tbody {
          flex-grow: 1;
          overflow-y: auto;
          display: block;
          width: 100%;
          padding-right: 5px;
        }

        table tr {
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        th, td {
          text-align: left;
          padding: 12px 12px;
          border-bottom: 1px solid #EAEAEA;
          white-space: normal;
          overflow-wrap: break-word;
        }

        .products-table th:nth-child(1), .products-table td:nth-child(1) { width: 45%; }
        .products-table th:nth-child(2), .products-table td:nth-child(2) { width: 15%; }
        .products-table th:nth-child(3), .products-table td:nth-child(3) { width: 15%; }
        .products-table th:nth-child(4), .products-table td:nth-child(4) { width: 25%; }
        .products-table th:nth-child(5), .products-table td:nth-child(5) { width: 10%; }

        .cart-table th:nth-child(1), .cart-table td:nth-child(1) { width: 45%; }
        .cart-table th:nth-child(2), .cart-table td:nth-child(2) { width: 15%; }
        .cart-table th:nth-child(3), .cart-table td:nth-child(3) { width: 20%; }
        .cart-table th:nth-child(4), .cart-table td:nth-child(4) { width: 20%; }
        .cart-table th:nth-child(5), .cart-table td:nth-child(5) { width: 10%; }

        th {
          background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
          color: var(--text-light);
          font-weight: 700;
          position: sticky;
          top: 0;
          z-index: 1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        th:first-child {
          border-top-left-radius: 10px;
        }

        th:last-child {
          border-top-right-radius: 10px;
        }

        tbody tr:nth-child(even) {
          background-color: #f8faff;
        }

        tbody tr:hover {
          background-color: #eef2f7;
          cursor: pointer;
          transform: scale(1.005);
          transition: all 0.2s ease-in-out;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .overflow-scroll {
          overflow: hidden;
          height: 100%;
          border-radius: 10px;
          border: 1px solid #E0E0E0;
          display: flex;
          flex-direction: column;
        }

        .product-table-wrapper, .cart-table-wrapper {
            flex-grow: 1;
            overflow-y: auto;
            border-radius: 10px;
        }

        .cart-table {
          height: auto;
          table-layout: auto;
        }

        .cart-table tbody tr {
            display: table-row;
        }

        .text-center {
          text-align: center;
        }

        .form-section {
          padding-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .label-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        label {
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 8px;
          display: block;
        }

        .inline-input-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .inline-input-group input {
          margin-bottom: 0;
          flex-grow: 1;
        }

        .product-list {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
          overflow-y: auto;
          max-height: 450px;
        }

        .product-item {
          display: grid;
          grid-template-columns: 3fr 1fr 1fr;
          align-items: center;
          gap: 10px;
          background-color: #f0f8ff;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #e0eaf4;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: transform 0.2s ease;
        }

        .product-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .product-info {
          display: flex;
          flex-direction: column;
        }

        .product-name {
          font-weight: 600;
          color: var(--text-dark);
          line-height: 1.2;
        }

        .product-price {
          font-size: 0.9em;
          color: #666;
        }

        .product-actions {
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 200px;
        }

        .product-actions input {
          width: 60px;
          padding: 5px;
          text-align: center;
          margin: 0;
        }

        .product-actions button {
          padding: 8px;
          box-shadow: none;
        }

        .product-actions button:hover {
          transform: none;
          box-shadow: 2px 5px rgba(0,0,0,0.1);
        }

        .summary-card {
          display: flex;
          flex-direction: column;
          gap: 15px;
          background: linear-gradient(145deg, #ffffff, #f0f2f5);
          padding: 25px;
          border-radius: 16px;
          box-shadow: 0 8px 25px var(--shadow-light);
          height: 86%;
          overflow-y: hidden;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px dashed var(--border-color);
        }

        .summary-row:last-of-type {
            border-bottom: none;
        }

        .summary-row.total {
          border-bottom: none;
          font-size: 1.5em;
          font-weight: 700;
          color: var(--primary-color);
        }

        .summary-row span:first-child {
          font-weight: 500;
        }

        .summary-row span:last-child {
          font-weight: 700;
        }

        .cart-list {
          flex-grow: 1;
          overflow-y: auto;
          max-height: 300px;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 0.5fr;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-bottom: 1px dashed #eee;
          transition: background-color 0.2s ease;
        }

        .cart-item:hover {
          background-color: #f0f8ff;
        }

        .cart-item button {
          padding: 5px 8px;
          font-size: 0.8em;
          box-shadow: none;
        }

        .cash-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px dashed var(--border-color);
        }

        .cash-section label {
          margin-bottom: 5px;
        }

        .cash-section input {
          margin-bottom: 10px;
        }

        .cash-info {
          display: flex;
          justify-content: space-between;
          font-size: 1.1em;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .cash-info.change {
          color: var(--danger-color);
        }

        .summary-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 50px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 80%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: #fff;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          max-width: 90%;
          overflow-y: auto;
          max-height: 60vh;
        }

        .modal-options {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 20px;
        }

        .modal-option-button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .modal-option-button.cancel {
          background-color: #ccc;
          color: #333;
        }

        .modal-option-button.cancel:hover {
          background-color: #bbb;
        }

        .modal-option-button {
          background: var(--primary-color);
          color: #fff;
        }

        .modal-option-button:hover {
          background: var(--secondary-color);
        }

        .empty-cart-message {
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #777;
        }
        
        .empty-cart-message p {
            font-size: 1.2rem;
            font-weight: 500;
        }
        
        @media (max-width: 1024px) {
            .container {
                grid-template-columns: 1fr;
            }
        }

        /* NEW CSS based on the image */
        .grid-container {
          display: grid;
          grid-template-columns: 1fr; /* Single centered column */
          justify-items: center;
          gap: 20px;
          padding: 20px;
          height: 80vh;
          width: 100%;
          overflow: hidden;
          background: linear-gradient(135deg, #E0F2F1 0%, #B2EBF2 100%);
        }

        .ui-card {
          background: #FFFFFF;
          border-radius: 20px; /* More rounded corners */
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          border: 1px solid #DCDCDC;
          height: 100%;
          width: min(1200px, 95vw);
          font-size: 0.9rem; /* Slightly smaller text */
        }

        .ui-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 1.4em; /* Slightly smaller */
          font-weight: 700;
          color: #00796B; /* Teal color */
          border-left: 6px solid #FF5722; /* Orange accent */
          padding-left: 15px;
        }

        .cart-button {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 0.8em;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .cart-button:hover {
          background: linear-gradient(45deg, #764ba2, #667eea);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .ui-card-header svg {
          margin-right: 10px;
          color: #FF5722;
        }

        .ui-payment-card {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-top: 0;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #DCDCDC;
          height: 100%;
          justify-content: space-between;
          overflow-y: auto;
        }

        .ui-form-group {
          margin-bottom: 20px;
        }

        .ui-input-group {
          display: flex;
          gap: 10px;
        }

        .ui-input {
          padding: 12px 15px;
          border: 2px solid #B0BEC5;
          border-radius: 10px;
          width: 100%;
          transition: border-color 0.3s;
        }

        .ui-input:focus {
          border-color: #00796B;
          outline: none;
        }

        .ui-button {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          white-space: nowrap;
        }

        .ui-button-primary { background-color: #00796B; color: #fff; }
        .ui-button-primary:hover { background-color: #0a8a7b; }

        .ui-button-secondary {
          background-color: #607D8B;
          color: white;
        }

        .ui-button-secondary:hover {
          background-color: #546E7A;
        }

        .ui-table {
          display: table; /* Override global table flex styles */
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          flex-grow: 1;
        }
        .ui-table thead {
          display: table-header-group; /* Ensure header renders like a normal table */
        }
        .ui-table tbody {
          display: table-row-group; /* Ensure body renders rows */
          overflow: visible; /* Let rows be visible */
        }
        .ui-table tr {
          display: table-row; /* Override global tr styles */
          width: auto;
          table-layout: auto;
        }

        .ui-table th {
          background-color: #00796B;
          color: white;
          padding: 12px;
          text-align: left;
        }
        
        .ui-table td {
          padding: 12px;
          border-bottom: 1px solid #E0E0E0;
        }

        .ui-table-container {
          height: calc(100% - 120px); /* Adjust height for header and search bar */
          overflow-y: auto;
          border-radius: 10px;
          border: 1px solid #E0E0E0;
        }

        .ui-cart-section {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          min-height: 420px; /* Ensure cart area is always visible */
        }

        .ui-cart-list {
          flex-grow: 1;
          overflow-y: auto;
          height: 100%;
          position: relative; /* Anchor for sticky header */
          border-left: 5px solid #00796B; /* Vertical bar */
          padding-left: 15px;
          padding-bottom: 56px; /* Space for sticky total footer */
        }
        /* Keep Print button visible */
        .ui-payment-actions {
          position: sticky;
          bottom: 0;
          background: #fff;
          padding: 12px 0;
          border-top: 1px solid #E0E0E0;
          z-index: 2;
          display: flex;
          justify-content: flex-end;
        }
          

        /* Ensure cart header stays visible while scrolling */
        .ui-table thead th {
          position: sticky;
          top: 0;
          z-index: 5;
          background-color: #00796B; /* match header background */
          color: #fff;
        }

        /* Clamp long item names to two lines */
        .ui-table td:first-child {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* Ensure cart header stays visible while scrolling */
        .ui-table thead th {
          position: sticky;
          top: 0;
          z-index: 5;
          background-color: #00796B; /* match header background */
          color: #fff;
        }

        .qty-input {
          width: 80px;
          text-align: center;
        }

        .ui-payment-details {
          padding-top: 2px;
          border-top: 2px dashed #B0BEC5;
        }

        .ui-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 1.2rem;
          margin-bottom: 10px;
        }

        .ui-net-payable {
          font-weight: 700;
          font-size: 1.5rem;
          color: #00796B;
        }
        
        .ui-payment-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        
        .ui-payment-actions button {
          padding: 15px 25px;
        }

        .ui-button-success {
          background-color: #4CAF50;
          color: white;
        }

        .ui-button-success:hover {
          background-color: #43A047;
        }

        .ui-button-clear {
          background-color: #F44336;
          color: white;
        }

        .ui-button-clear:hover {
          background-color: #E53935;
        }

        .empty-cart-message p {
            font-size: 1rem;
            color: #757575;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            white-space: nowrap;
        }

        .scroll-bar-label {
            position: absolute;
            right: 0;
            top: 50%;
            transform: rotate(90deg) translate(-50%, -50%);
            transform-origin: top left;
            font-size: 10px;
            color: #00796B;
            font-weight: bold;
            letter-spacing: 2px;
        }

        @media (max-width: 1200px) {
          .grid-container {
            grid-template-columns: 1fr;
          }
        }

        .receipt-scrollable-content {
          max-height: 250px;
          overflow-y: auto;
          border: 1px solid #eee;
          border-radius: 8px;
        }
      `}</style>

      <div className="grid-container">
        {/* POS Cart Only */}
        <div className="ui-card">
          <div className="ui-card-header">
            <FaShoppingCart /> Point of Sale
          </div>
          <div className="ui-form-group">
            <label htmlFor="scanInput">Scan barcode or enter code</label>
            <div className="ui-input-group">
              <input
                type="text"
                id="scanInput"
                placeholder="Scan barcode or enter code then Enter"
                className="ui-input"
                ref={scanInputRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    const value = e.currentTarget.value.trim();
                    if (value) {
                      const qty = Number.isFinite(Number(scanQuantity)) && Number(scanQuantity) > 0 ? Number(scanQuantity) : 1;
                      handleScanProduct(value, qty);
                      e.currentTarget.value = '';
                      // Move focus to qty for fast workflows
                      const qtyEl = document.getElementById('scanQty');
                      if (qtyEl) qtyEl.focus();
                    }
                  }
                }}
              />
              <input
                type="number"
                id="scanQty"
                min="1"
                className="ui-input qty-input"
                placeholder="Qty"
                value={scanQuantity}
                onChange={(e) => setScanQuantity(Math.max(1, Number(e.target.value) || 1))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    const code = (scanInputRef.current?.value || '').trim();
                    if (code) {
                      const qty = Number.isFinite(Number(scanQuantity)) && Number(scanQuantity) > 0 ? Number(scanQuantity) : 1;
                      handleScanProduct(code, qty);
                      if (scanInputRef.current) {
                        scanInputRef.current.value = '';
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          
          <div className="ui-cart-section">
            <div className="ui-cart-list">
              {cart.length > 0 ? (
                <>
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>₱{item.price.toFixed(2)}</td>
                          <td>₱{(item.price * item.quantity).toFixed(2)}</td>
                          <td>
                            <button className="ui-button ui-button-clear" onClick={() => handleRemoveFromCart(item.id)}>
                              <FaBan />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="ui-summary-footer">
                    <div className="ui-summary-row">
                      <span>Total Price:</span>
                      <span>₱{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-cart-message">
                  <p>Empty cart</p>
                </div>
              )}
            </div>

            
          </div>
          <div className="ui-payment-actions">
            <button className="ui-button ui-button-success" onClick={handlePrint} data-action="print" disabled={cart.length === 0}>
              <FaPrint /> Print
            </button>
          </div>
        </div>
      </div>
                  
      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalPrice={totalPrice}
        defaultDiscountType={discountType}
        defaultCustomDiscount={customDiscount}
        defaultCashGiven={cashGiven}
        onConfirm={handlePaymentConfirm}
      />
      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={handleCloseReceiptModal}
        receiptData={currentReceipt}
        onPrint={() => {
          // Print functionality is handled within the modal
        }}
        onSave={handleSaveReceipt}
      />
    </>
  );
}
