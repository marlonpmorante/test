import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl } from '../config';
import { FaSave, FaBan, FaSearch, FaPrint, FaMoneyBillWave, FaBarcode, FaBoxOpen, FaDollarSign, FaClipboardList, FaShoppingCart } from 'react-icons/fa';

export default function InventoryForm() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productQuantities, setProductQuantities] = useState({});
  const [customer, setCustomer] = useState({ name: '', contact: '', tin: '', address: '' });
  const [cashGiven, setCashGiven] = useState('');
  const [discountType, setDiscountType] = useState('none');
  const [customDiscount, setCustomDiscount] = useState(0);
  const [isScanMode, setIsScanMode] = useState(true);
  const scanInputRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(apiUrl('/products'));
        const data = await res.json();
        setProducts(data);
        const initialQuantities = data.reduce((acc, product) => {
          acc[product.id] = 1;
          return acc;
        }, {});
        setProductQuantities(initialQuantities);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isScanMode && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [isScanMode]);

  const getFullProductName = (product) => {
    const supplierName = product.supplierName || '';
    const brandName = product.brandName || '';
    const medicineName = product.medicineName || '';
    const form = product.form || '';
    const strength = product.strength || '';
    return `${supplierName} (${brandName}) - ${medicineName}, ${form}, ${strength}`;
  };

  const handleProductQuantityChange = (productId, value) => {
    const newQuantity = parseInt(value) || 1;
    setProductQuantities(prev => ({
      ...prev,
      [productId]: newQuantity > 0 ? newQuantity : 1
    }));
  };

  const handleAddToCart = (productToAdd, quantity) => {
    if (!productToAdd) return alert('Select a product first');
    if (quantity < 1) return alert('Quantity must be at least 1');

    if (productToAdd.quantity < quantity) {
      alert(`Not enough stock for ${getFullProductName(productToAdd)}. Available: ${productToAdd.quantity}`);
      return;
    }
    if (productToAdd.quantity === 0) {
      alert(`${getFullProductName(productToAdd)} is out of stock.`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.id === productToAdd.id);
    let updatedCart = [...cart];

    const productCartEntry = {
      id: productToAdd.id,
      name: getFullProductName(productToAdd),
      price: parseFloat(productToAdd.price),
      quantity: quantity
    };

    if (existingIndex >= 0) {
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart.push(productCartEntry);
    }
    setCart(updatedCart);

    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productToAdd.id
          ? { ...p, quantity: p.quantity - quantity }
          : p
      )
    );

    setProductQuantities(prev => ({
      ...prev,
      [productToAdd.id]: 1
    }));
  };

  const handleScanProduct = (productId) => {
    const product = products.find(p => (p.medicineId || p.id).toString() === productId.toString());
    if (product) {
      if (product.quantity === 0) {
        alert(`${getFullProductName(product)} is out of stock.`);
        return;
      }
      if (product.quantity < 1) {
        alert(`Not enough stock for ${getFullProductName(product)}. Available: ${product.quantity}`);
        return;
      }

      const existingIndex = cart.findIndex(item => item.id === product.id);
      let updatedCart = [...cart];

      const productToAdd = {
        id: product.id,
        name: getFullProductName(product),
        price: parseFloat(product.price),
        quantity: 1
      };

      if (existingIndex >= 0) {
        updatedCart[existingIndex].quantity += 1;
      } else {
        updatedCart.push(productToAdd);
      }
      setCart(updatedCart);

      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id
            ? { ...p, quantity: p.quantity - 1 }
            : p
        )
      )

    } else {
      alert('Product not found with ID: ' + productId);
    }
  };

  const handleRemoveFromCart = (productId) => {
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

  const handleClearCart = useCallback(() => setCart([]), []);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountRates = {
    none: 0,
    senior: 20,
    pwd: 20,
    student: 10,
  };
  const effectiveDiscountPercent = discountType === 'custom' ? customDiscount : discountRates[discountType];
  const discountAmount = (totalPrice * effectiveDiscountPercent) / 100;
  const netPay = totalPrice - discountAmount;
  const change = (parseFloat(cashGiven) || 0) - netPay;
  const vatRate = 0.12;
  const vatableSale = netPay / (1 + vatRate);
  const vatAmount = netPay - vatableSale;

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

  const handlePrint = useCallback(async () => {
    const currentReceipt = {
      customer: customer,
      cart: cart,
      totalPrice: totalPrice,
      discountPercent: effectiveDiscountPercent,
      discountType: discountType,
      discountAmount: discountAmount,
      netPay: netPay,
      cashGiven: parseFloat(cashGiven) || 0,
      change: change,
      paymentMethod: 'cash',
      vatableSale: vatableSale,
      vatAmount: vatAmount,
      transaction_date: new Date().toISOString(),
    };

    if (currentReceipt.cart.length === 0) {
      alert('Cart is empty. Nothing to print.');
      return;
    }
    
    if (currentReceipt.cashGiven < currentReceipt.netPay) {
      alert('Cash given is less than the net payable amount.');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Receipt</title>
          <style>
            body { font-family: monospace; font-size: 10px; }
            .receipt { width: 280px; margin: 0 auto; padding: 10px; border: 1px dashed #000; }
            .header { text-align: center; margin-bottom: 5px; line-height: 1.1; }
            .trans-info { margin-bottom: 5px; font-size: 0.9em; }
            .items { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
            .items th, .items td { padding: 2px 5px; text-align: left; border-bottom: 1px dotted #ccc; }
            .items th { font-weight: bold; }
            .total-section { text-align: right; margin-bottom: 2px; font-size: 0.9em; }
            .total-section.bold { font-weight: bold; }
            .footer { text-align: center; margin-top: 10px; font-size: 0.8em; }
            .customer-info { margin-top: 10px; font-size: 0.9em; border-top: 1px dashed #000; padding-top: 5px; }
            .customer-field { margin-bottom: 3px; }
            .value { float: right; }
             .payment-info { margin-top: 10px; font-size: 0.9em; border-top: 1px dashed #000; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <p>R.B. Gonzales Pharmacy</p>
              <p>MUNICIPALITY OF BOLALACAO, ISLAND OF MINDORO</p>
              <p>Campaasan, Bulalacao, Oriental Mindoro</p>
              <p>VAT REG TIN: 201-277-095-00328</p>
              <p>MIN: 17111713493850977 S/N: 41-BAWXH</p>
              <p>SALES INVOICE</p>
            </div>
            <div class="trans-info">
              <p>Trans. Date: ${new Date(currentReceipt.transaction_date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })} ${new Date(currentReceipt.transaction_date).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}</p>
              <p>PST 384-006-00224713 TH 3840060000235221</p>
              <p>C: 171 ${currentReceipt.customer.name || 'GUEST'} / B: 1 Bagger</p>
            </div>

            <table class="items">
              <thead>
                <tr><th>Qty</th><th>Desc</th><th style="text-align: right;">Amt</th></tr>
              </thead>
              <tbody>
                ${currentReceipt.cart
        .map(
          (item) => `
                <tr>
                  <td>${item.quantity}</td>
                  <td>${typeof item.name === 'string' ? item.name.substring(0, 20) : ''}</td>
                  <td style="text-align: right;">${(
              item.price * item.quantity
            ).toFixed(2)}</td>
                </tr>
              `
        )
        .join('')}
              </tbody>
            </table>

            <div class="total-section">
              Subtotal <span class="value">${currentReceipt.totalPrice.toFixed(2)}</span>
            </div>
            <div class="total-section">
              Total Discount (${currentReceipt.discountType === 'none' ? '0' : currentReceipt.discountType}) (${currentReceipt.discountPercent.toFixed(2)}%) <span class="value">${currentReceipt.discountAmount.toFixed(2)}</span>
            </div>
            <div class="total-section bold">
              Total <span class="value">${currentReceipt.netPay.toFixed(2)}</span>
            </div>
              <div class="total-section">
              CASH <span class="value">${currentReceipt.cashGiven.toFixed(2)}</span>
            </div>
            <div class="total-section">
              CHANGE <span class="value">${currentReceipt.change.toFixed(2)}</span>
            </div>

            <div class="other-info">
              <p>Item Purchased: ${currentReceipt.cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    )}</p>
              <p>
                VATable Sale (V) <span class="value">${currentReceipt.vatableSale.toFixed(2)}</span>
              </p>
              <p>
                VAT (${(vatRate * 100).toFixed(0)}%) <span class="value">${currentReceipt.vatAmount.toFixed(2)}</span>
              </p>
              <p>VAT Exempt Sale (E) <span class="value">0.00</span></p>
              <p>Zero Rated Sale (Z) <span class="value">0.00</span></p>
            </div>

             <div class="payment-info">
                <p>Payment Method: <span class="value">Cash</span></p>
            </div>

            <div class="footer">
              <p>THANK YOU FOR SHOPPING</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();

    // After printing, save the receipt and clear the cart
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
      } else {
        console.error('Failed to save receipt:', data.error);
        alert('Failed to save receipt: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      alert('Error saving receipt. Please check server connection.');
    }
  }, [cart, customer, totalPrice, effectiveDiscountPercent, discountType, discountAmount, netPay, cashGiven, change, vatableSale, vatAmount, formatDateTimeForMySQL]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Defensive check to prevent TypeError
      if (!event || !event.key) {
        return;
      }
      
      // Prevent default behavior for keys that might have native actions (e.g., space scrolls)
      if (['Enter', 'p', 'c', 'Backspace'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }

      // Check for modifier keys to avoid conflicts (e.g., Ctrl+P for print)
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const activeElement = document.activeElement;

      // Handle actions for the focused elements first
      // Assuming a product input field is focused
      if (activeElement && activeElement.tagName === 'INPUT' && activeElement.dataset.productId) {
        if (event.key === 'Enter') {
          const productId = activeElement.dataset.productId;
          const product = products.find(p => p.id.toString() === productId);
          const quantity = productQuantities[productId] || 1;
          if (product) {
            handleAddToCart(product, quantity);
          }
        }
      }

      // Global shortcuts
      switch (event.key.toLowerCase()) {
        case 'p':
          // Print button
          handlePrint();
          break;
        case 'c':
          // Clear cart button
          handleClearCart();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrint, handleClearCart, handleAddToCart, products, productQuantities]);

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
          grid-template-columns: 1.3fr 1.3fr 1.2fr; /* Three columns as per the image */
          gap: 20px;
          padding: 20px;
          height: 80vh;
          width: 100%;
          overflow: hidden;
          background: linear-gradient(135deg, #E0F2F1 0%, #B2EBF2 100%); /* Light blueish gradient */
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
        }

        .ui-card-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          font-size: 1.8em;
          font-weight: 700;
          color: #00796B; /* Teal color */
          border-left: 6px solid #FF5722; /* Orange accent */
          padding-left: 15px;
        }

        .ui-card-header svg {
          margin-right: 10px;
          color: #FF5722;
        }

        .ui-payment-card {
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #DCDCDC;
          height: 100%;
          justify-content: space-between;
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
        }

        .ui-button-secondary {
          background-color: #607D8B;
          color: white;
        }

        .ui-button-secondary:hover {
          background-color: #546E7A;
        }

        .ui-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          flex-grow: 1;
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
        }

        .ui-cart-list {
          flex-grow: 1;
          overflow-y: auto;
          border-left: 5px solid #00796B; /* Vertical bar */
          padding-left: 15px;
        }

        .ui-payment-details {
          padding-top: 20px;
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
        {/* Available Products Card */}
        <div className="ui-card">
          <div className="ui-card-header">
            <FaBoxOpen /> Available Products
          </div>
          <div className="ui-form-group">
            <label htmlFor="searchProduct">Search by Product Name or Barcode</label>
            <div className="ui-input-group">
              <input
                type="text"
                id="searchProduct"
                placeholder="Scan or type barcode"
                className="ui-input"
                ref={isScanMode ? scanInputRef : null}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    handleScanProduct(value);
                    e.target.value = '';
                  }
                }}
              />
              <button className="ui-button ui-button-secondary" onClick={() => setIsScanMode(!isScanMode)}>
                <FaBarcode /> {isScanMode ? 'Manual' : 'Scan'}
              </button>
            </div>
          </div>
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>{getFullProductName(product)}</td>
                    <td>{product.quantity}</td>
                    <td>₱{product.price}</td>
                    <td>
                      <div className="product-actions">
                        <input
                          type="number"
                          min="1"
                          value={productQuantities[product.id] || 1}
                          onChange={(e) => handleProductQuantityChange(product.id, e.target.value)}
                          data-product-id={product.id}
                        />
                        <button
                          className="ui-button ui-button-primary"
                          onClick={() => handleAddToCart(product, productQuantities[product.id] || 1)}
                          disabled={product.quantity <= 0}
                          data-action="add"
                        >
                          Add
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shopping Cart Card */}
        <div className="ui-card">
          <div className="ui-card-header">
            <FaShoppingCart /> Shopping Cart
          </div>
          <div className="ui-cart-section">
            <div className="ui-cart-list">
              {cart.length > 0 ? (
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
                    {cart.map((item, index) => (
                      <tr key={index}>
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
              ) : (
                <div className="empty-cart-message">
                  <p>Empty cart</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Card */}
        <div className="ui-payment-card">
          <div className="ui-card-header">
            <FaMoneyBillWave /> Payment
          </div>
          <div className="ui-payment-details">
            <div className="ui-form-group">
              <label htmlFor="discountType">Discount Type</label>
              <select
                id="discountType"
                className="ui-input"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="none">No Discount</option>
                <option value="senior">Senior Citizen</option>
                <option value="pwd">Person With Disability (PWD)</option>
                <option value="student">Student</option>
                <option value="custom">Custom</option>
              </select>
              {discountType === 'custom' && (
                <input
                  type="number"
                  placeholder="Enter %"
                  className="ui-input"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(parseFloat(e.target.value) || 0)}
                />
              )}
            </div>
            <div className="ui-summary-row">
              <span>Total Price:</span>
              <span>₱{totalPrice.toFixed(2)}</span>
            </div>
            <div className="ui-summary-row">
              <span>Discount ({effectiveDiscountPercent}%):</span>
              <span>-₱{discountAmount.toFixed(2)}</span>
            </div>
            <div className="ui-summary-row ui-net-payable">
              <span>Net Payable:</span>
              <span>₱{netPay.toFixed(2)}</span>
            </div>
            <div className="ui-form-group">
              <label htmlFor="cashGiven">Cash Given</label>
              <input
                type="text"
                id="cashGiven"
                className="ui-input"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="ui-summary-row">
                <span>Change:</span>
                <span>₱{(change).toFixed(2)}</span>
            </div>
          </div>
          <div className="ui-payment-actions">
            <button className="ui-button ui-button-success" onClick={handlePrint} data-action="print">
              <FaPrint /> Print
            </button>
            <button className="ui-button ui-button-clear" onClick={handleClearCart} data-action="clear">
              <FaBan /> Clear cart
            </button>
          </div>
        </div>
      </div>
    </>
  );
}