/**
 * LocalStorage Valentine Order Checker
 *
 * HOW TO USE:
 * 1. Go to: https://www.wingside.ng
 * 2. Press F12 to open Developer Console
 * 3. Go to "Console" tab
 * 4. Copy and paste this ENTIRE script
 * 5. Press Enter
 *
 * This will show all cart data including notes from Valentine's orders
 */

(function() {
  console.clear();
  console.log('%c🔍 Wingside LocalStorage Checker', 'font-size: 20px; font-weight: bold; color: #F7C400;');
  console.log('%c=====================================', 'color: #F7C400;');

  // Check for cart data
  const cartData = localStorage.getItem('wingside-cart');

  if (!cartData) {
    console.log('%c❌ No cart data found in localStorage', 'color: red; font-size: 14px;');
    console.log('This browser has not placed any orders or the data was cleared.');
    return;
  }

  try {
    const cart = JSON.parse(cartData);

    if (!Array.isArray(cart) || cart.length === 0) {
      console.log('%c⚠️ Cart is empty', 'color: orange; font-size: 14px;');
      return;
    }

    console.log(`%c✅ Found ${cart.length} items in cart`, 'color: green; font-size: 16px; font-weight: bold;');
    console.log('');

    // Check for Valentine's items
    let valentineItems = cart.filter(item =>
      item.name?.toLowerCase().includes('valentine') ||
      item.name?.toLowerCase().includes('handwritten') ||
      item.deliveryDate === '2026-02-14' ||
      item.notes
    );

    if (valentineItems.length > 0) {
      console.log(`%c🌹 Found ${valentineItems.length} Valentine's Day items!`, 'color: #ff1493; font-size: 16px; font-weight: bold;');
      console.log('');

      valentineItems.forEach((item, index) => {
        console.log(`%c📦 Item ${index + 1}: ${item.name}`, 'color: #F7C400; font-size: 14px; font-weight: bold;');

        if (item.notes) {
          console.log(`%c💌 NOTE: ${item.notes}`, 'color: #ff1493; font-size: 14px; font-weight: bold; background: #fff0f5; padding: 5px;');
        }

        if (item.deliveryDate) {
          console.log(`📅 Delivery Date: ${item.deliveryDate}`);
        }

        if (item.deliveryTime) {
          console.log(`🕒 Delivery Time: ${item.deliveryTime}`);
        }

        if (item.flavor) {
          const flavors = Array.isArray(item.flavor) ? item.flavor.join(', ') : item.flavor;
          console.log(`🍗 Flavors: ${flavors}`);
        }

        console.log(`💰 Price: ₦${item.price.toLocaleString()}`);
        console.log(`🔢 Quantity: ${item.quantity}`);
        console.log('---');
      });
    }

    // Show all items
    console.log('');
    console.log('%c📋 All Cart Items:', 'color: #333; font-size: 16px; font-weight: bold;');
    console.table(cart.map(item => ({
      Name: item.name,
      Notes: item.notes || 'N/A',
      DeliveryDate: item.deliveryDate || 'N/A',
      DeliveryTime: item.deliveryTime || 'N/A',
      Price: `₦${item.price}`,
      Quantity: item.quantity
    })));

    // Export function
    console.log('');
    console.log('%c📤 To export this data, run:', 'color: blue; font-size: 14px; font-weight: bold;');
    console.log('%ccopy(JSON.stringify(valentineItems, null, 2))', 'background: #f0f0f0; padding: 5px; font-family: monospace;');
    console.log('Then paste into a text file and send to admin.');

    // Make data available globally
    window.valentineOrderData = valentineItems.length > 0 ? valentineItems : cart;
    console.log('');
    console.log('%cData saved to: window.valentineOrderData', 'color: green;');

  } catch (error) {
    console.error('❌ Error parsing cart data:', error);
    console.log('Raw cart data:', cartData);
  }

  // Check for other relevant data
  console.log('');
  console.log('%c🔑 Other LocalStorage Keys:', 'color: #333; font-size: 14px; font-weight: bold;');

  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.includes('wingside') || key.includes('order') || key.includes('cart')) {
      const value = localStorage.getItem(key);
      console.log(`${key}: ${value?.substring(0, 100)}${value?.length > 100 ? '...' : ''}`);
    }
  });

  console.log('');
  console.log('%c✅ Check complete!', 'color: green; font-size: 16px; font-weight: bold;');
})();
