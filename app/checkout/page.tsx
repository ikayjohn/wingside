"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Address, PromoCode, PromoCodeValidationResponse, OrderAddon } from '@/types/checkout';

interface DeliveryArea {
  id: string;
  name: string;
  description?: string;
  delivery_fee: number;
  min_order_amount: number;
  estimated_time?: string;
}

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  opening_hours?: string;
  estimated_time: string;
}

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    deliveryArea: '',
    firstName: '',
    lastName: '',
    phone: '',
    streetAddress: '',
    streetAddress2: '',
    city: 'Port Harcourt',
    email: '',
    createAccount: false,
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    referralCode: '',
  });

  const supabase = createClient();

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeValidationResponse | null>(null);
  const [promoError, setPromoError] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Referral code states
  const [referralValidated, setReferralValidated] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [referralInfo, setReferralInfo] = useState<any>(null);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingPickup, setLoadingPickup] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');

  // Wallet payment states
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'nomba' | 'wallet'>('paystack');
  const [walletBalance, setWalletBalance] = useState(0);
  const [wallet, setWallet] = useState<any>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [settings, setSettings] = useState<any>({
    currency_symbol: '₦',
    min_order_amount: '2000',
  });

  // Payment gateway enable/disable states
  const [enabledGateways, setEnabledGateways] = useState({
    paystack: true,
    nomba: true,
    wallet: true,
  });

  // Load settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);

          // Extract payment gateway settings
          const gateways = {
            paystack: data.settings.payment_gateway_paystack_enabled === 'true',
            nomba: data.settings.payment_gateway_nomba_enabled === 'true',
            wallet: data.settings.payment_gateway_wallet_enabled === 'true',
          };
          setEnabledGateways(gateways);

          // Auto-select first available payment method if current is disabled
          const availableMethods = Object.entries(gateways)
            .filter(([_, enabled]) => enabled)
            .map(([method]) => method);

          if (!availableMethods.includes(paymentMethod)) {
            setPaymentMethod(availableMethods[0] as 'paystack' | 'nomba' | 'wallet');
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('wingside-cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Load promo code from localStorage on mount
  useEffect(() => {
    const savedPromo = localStorage.getItem('wingside-promo');
    if (savedPromo) {
      try {
        setAppliedPromo(JSON.parse(savedPromo));
      } catch (e) {
        console.error('Error loading promo code:', e);
      }
    }
  }, []);

  // Check for existing authenticated user and prefill form
  useEffect(() => {
    const checkExistingUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // User is already logged in, prefill form and hide account creation
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          firstName: profile?.full_name?.split(' ')[0] || '',
          lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
          phone: profile?.phone?.replace('+234', '') || '',
          createAccount: false, // Hide account creation for existing users
        }));

        // Fetch saved addresses
        try {
          const response = await fetch('/api/user/addresses');
          if (response.ok) {
            const data = await response.json();
            setSavedAddresses(data.addresses || []);

            // Auto-select default address if available
            const defaultAddress = data.addresses?.find((addr: Address) => addr.is_default);
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id);
              populateAddressFields(defaultAddress);
            }
          }
        } catch (error) {
          console.error('Error fetching addresses:', error);
        }

        // Fetch wallet information for payment option
        setLoadingWallet(true);
        try {
          const walletResponse = await fetch('/api/embedly/wallets');
          const walletData = await walletResponse.json();

          if (walletData.success && walletData.hasWallet && walletData.wallet) {
            setWallet(walletData.wallet);
            setWalletBalance(walletData.wallet.availableBalance);
          } else {
            // User doesn't have a wallet, keep paystack payment as default
            setPaymentMethod('paystack');
          }
        } catch (error) {
          console.error('Error fetching wallet:', error);
          setPaymentMethod('paystack');
        } finally {
          setLoadingWallet(false);
        }
      }
    };

    checkExistingUser();
  }, []);

  // Fetch delivery areas and pickup locations from database
  useEffect(() => {
    fetchDeliveryAreas();
    fetchPickupLocations();
  }, []);

  const fetchDeliveryAreas = async () => {
    try {
      const response = await fetch('/api/delivery-areas');
      const data = await response.json();
      if (data.deliveryAreas) {
        setDeliveryAreas(data.deliveryAreas);
      }
    } catch (error) {
      console.error('Error fetching delivery areas:', error);
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchPickupLocations = async () => {
    try {
      const response = await fetch('/api/pickup-locations');
      const data = await response.json();
      if (data.pickupLocations) {
        setPickupLocations(data.pickupLocations);
      }
    } catch (error) {
      console.error('Error fetching pickup locations:', error);
    } finally {
      setLoadingPickup(false);
    }
  };

  // Reset delivery area when switching between delivery and pickup
  useEffect(() => {
    setFormData(prev => ({ ...prev, deliveryArea: '' }));
  }, [orderType]);

  // Get delivery fee for selected area
  const getDeliveryFee = () => {
    if (!formData.deliveryArea) return 0;

    // Pickup is always free
    const pickupLocation = pickupLocations.find(p => p.id === formData.deliveryArea);
    if (pickupLocation) return 0;

    // Find delivery area from database
    const area = deliveryAreas.find(a => a.id === formData.deliveryArea);
    return area ? area.delivery_fee : 0;
  };

  // Get delivery area display name
  const getDeliveryAreaName = () => {
    if (!formData.deliveryArea) return '';

    // Check if it's a pickup location
    const pickupLocation = pickupLocations.find(p => p.id === formData.deliveryArea);
    if (pickupLocation) {
      return `Pickup – ${pickupLocation.name}, ${pickupLocation.address}`;
    }

    // Delivery area from database
    const area = deliveryAreas.find(a => a.id === formData.deliveryArea);
    if (area) {
      return area.description ? `${area.name} (${area.description})` : area.name;
    }

    return formData.deliveryArea;
  };

  // Populate form fields with selected address
  const populateAddressFields = (address: Address) => {
    setFormData(prev => ({
      ...prev,
      streetAddress: address.street_address || '',
      streetAddress2: '',
      city: address.city || '',
    }));
  };

  // Handle address selection change
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);

    if (addressId === 'new') {
      // Clear address fields for new address entry
      setFormData(prev => ({
        ...prev,
        streetAddress: '',
        streetAddress2: '',
        city: 'Port Harcourt',
      }));
    } else {
      // Populate with selected address
      const address = savedAddresses.find(addr => addr.id === addressId);
      if (address) {
        populateAddressFields(address);
      }
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = getDeliveryFee();
  const discount = appliedPromo ? appliedPromo.discountAmount : 0;
  const referralDiscount = referralValidated && subtotal + deliveryFee >= 1000 ? (referralInfo?.rewards?.referredReward || 500) : 0;
  const total = subtotal + deliveryFee - discount - referralDiscount;

  const formatPrice = (price: number) => {
    const symbol = settings.currency_symbol || '₦';
    return symbol + price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format phone number to ensure it's always in correct Nigerian format
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return phone;

    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Remove leading 0 if present (common mistake: 0801 -> 801)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }

    // Limit to 10 digits (Nigerian mobile numbers without country code)
    cleaned = cleaned.slice(0, 10);

    return cleaned;
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setApplyingPromo(true);
    setPromoError('');

    try {
      const orderAmount = subtotal + deliveryFee;

      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderAmount }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppliedPromo(data);
        setPromoError('');
      } else {
        setPromoError(data.error || 'Invalid promo code');
        setAppliedPromo(null);
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      setPromoError('Error applying promo code');
      setAppliedPromo(null);
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  // Save promo code to localStorage whenever it changes
  useEffect(() => {
    if (appliedPromo) {
      localStorage.setItem('wingside-promo', JSON.stringify(appliedPromo));
    } else {
      localStorage.removeItem('wingside-promo');
    }
  }, [appliedPromo]);

  const validateReferralCode = async () => {
    if (!formData.referralCode.trim()) {
      setReferralError('Please enter a referral code');
      return;
    }

    setValidatingReferral(true);
    setReferralError('');

    try {
      const response = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: formData.referralCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setReferralValidated(true);
        setReferralInfo(data);
        setReferralError('');
        console.log('Referral code validated:', data.message);
      } else {
        setReferralError(data.error || 'Invalid referral code');
        setReferralValidated(false);
        setReferralInfo(null);
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setReferralError('Error validating referral code');
      setReferralValidated(false);
      setReferralInfo(null);
    } finally {
      setValidatingReferral(false);
    }
  };

  const clearReferralCode = () => {
    setReferralValidated(false);
    setFormData(prev => ({ ...prev, referralCode: '' }));
    setReferralError('');
    setReferralInfo(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCartItems(prev => {
      const newCart = prev.map((item, i) => {
        if (i === index) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      localStorage.setItem('wingside-cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    localStorage.setItem('wingside-cart', JSON.stringify(newCart));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validation
    if (cartItems.length === 0) {
      setSubmitError('Your cart is empty');
      return;
    }

    if (!formData.deliveryArea) {
      setSubmitError('Please select a delivery area or pickup location');
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      setSubmitError('Please enter your full name');
      return;
    }

    if (!formData.phone) {
      setSubmitError('Please enter your phone number');
      return;
    }

    // Format phone number before submission
    const formattedPhone = formatPhoneNumber(formData.phone);
    if (formattedPhone.length < 10) {
      setSubmitError('Please enter a valid Nigerian phone number');
      return;
    }

    if (!formData.email) {
      setSubmitError('Please enter your email address');
      return;
    }

    if (orderType === 'delivery' && !formData.streetAddress) {
      setSubmitError('Please enter your delivery address');
      return;
    }

    if (!formData.agreeTerms) {
      setSubmitError('Please agree to the terms and conditions');
      return;
    }

    // Validate password if creating account
    if (formData.createAccount) {
      if (!formData.password) {
        setSubmitError('Please enter a password to create your account');
        return;
      }
      if (formData.password.length < 6) {
        setSubmitError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setSubmitError('Passwords do not match');
        return;
      }
    }

    setSubmitting(true);

    // Create account if checkbox is checked
    let userId: string | null = null;
    if (formData.createAccount) {
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: `${formData.firstName} ${formData.lastName}`,
              phone: `+234${formattedPhone}`,
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setSubmitError('This email is already registered. Please log in or use a different email.');
          } else {
            setSubmitError(signUpError.message);
          }
          setSubmitting(false);
          return;
        }

        if (signUpData.user) {
          userId = signUpData.user.id;

          // Create profile
          const { error: profileError } = await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: formData.email,
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: `+234${formattedPhone}`,
            role: 'customer',
          });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Continue anyway - auth user was created
          }

          // Sync new customer to Zoho CRM and Embedly
          fetch('/api/integrations/sync-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: signUpData.user.id,
              email: formData.email,
              full_name: `${formData.firstName} ${formData.lastName}`,
              phone: `+234${formattedPhone}`,
              address: formData.streetAddress,
              city: formData.city,
              state: 'Rivers',
            }),
          }).catch(console.error); // Fire and forget

          // Create address for the user
          if (orderType === 'delivery' && formData.streetAddress) {
            await supabase.from('addresses').insert({
              user_id: signUpData.user.id,
              label: 'Home',
              street_address: formData.streetAddress + (formData.streetAddress2 ? ', ' + formData.streetAddress2 : ''),
              city: formData.city,
              state: 'Rivers',
              is_default: true,
            });
          }
        }
      } catch (error) {
        console.error('Account creation error:', error);
        setSubmitError('Failed to create account. Please try again.');
        setSubmitting(false);
        return;
      }
    }

    try {
      // Transform cart items to API format
      const orderItems = cartItems.map((item) => {
        // Extract flavors array
        let flavors: string[] = [];
        if (Array.isArray(item.flavor)) {
          flavors = item.flavor;
        } else if (item.flavor && item.flavor !== 'Regular') {
          flavors = [item.flavor];
        }

        // Build addons object
        const addons: OrderAddon = {};
        if (item.rice) {
          addons.rice = Array.isArray(item.rice) ? item.rice : [item.rice];
        }
        if (item.drink) {
          addons.drink = Array.isArray(item.drink) ? item.drink : [item.drink];
        }
        if (item.milkshake) {
          addons.milkshake = item.milkshake;
        }

        return {
          product_id: item.productId || null,
          product_name: item.name,
          size: item.size,
          flavors: flavors.length > 0 ? flavors : null,
          addons: Object.keys(addons).length > 0 ? addons : null,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        };
      });

      // Build delivery address text
      const deliveryAddressText = orderType === 'delivery'
        ? `${formData.streetAddress}${formData.streetAddress2 ? ', ' + formData.streetAddress2 : ''}, ${formData.city}`
        : getDeliveryAreaName();

      // Build order data
      const orderData = {
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: `+234${formattedPhone}`,
        user_id: userId, // Link order to user if account was created
        delivery_address_id: null,
        delivery_address_text: deliveryAddressText,
        payment_method: paymentMethod, // Use selected payment method
        delivery_fee: deliveryFee,
        tax: 0,
        notes: '',
        promo_code_id: appliedPromo?.promoCode?.id || null,
        discount_amount: discount,
        referral_code: referralValidated ? formData.referralCode : null,
        referral_discount: referralValidated && total >= 1000 ? (referralInfo?.rewards?.referredReward || 500) : 0,
        items: orderItems,
      };

      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf/token');
      const csrfData = await csrfResponse.json();

      if (!csrfResponse.ok) {
        throw new Error('Failed to get security token');
      }

      // Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [csrfData.headerName]: csrfData.token,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // If promo code was applied, increment its usage count
      if (appliedPromo?.promoCode?.id) {
        await fetch(`/api/promo-codes/${appliedPromo.promoCode.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            [csrfData.headerName]: csrfData.token,
          },
          body: JSON.stringify({ increment_usage: true }),
        });
      }

      // Save address for existing logged-in users (not creating new account)
      if (isLoggedIn && !formData.createAccount && orderType === 'delivery' && formData.streetAddress && selectedAddressId === 'new') {
        try {
          await supabase.from('addresses').insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            label: 'Home',
            street_address: formData.streetAddress + (formData.streetAddress2 ? ', ' + formData.streetAddress2 : ''),
            city: formData.city,
            state: 'Rivers',
            is_default: false,
          });
          console.log('Address saved for existing user');
        } catch (addressError) {
          console.error('Error saving address:', addressError);
          // Don't fail the order if address save fails
        }
      }

      if (paymentMethod === 'wallet') {
        // Process full wallet payment
        if (!wallet || walletBalance < total) {
          throw new Error('Insufficient wallet balance for this order');
        }

        const walletPaymentResponse = await fetch('/api/embedly/wallet-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [csrfData.headerName]: csrfData.token,
          },
          body: JSON.stringify({
            order_id: data.order.id,
            amount: total,
            remarks: `Payment for Wingside order #${data.order.id}`,
          }),
        });

        const walletPaymentData = await walletPaymentResponse.json();

        if (!walletPaymentResponse.ok) {
          console.error('Wallet payment failed:', walletPaymentData);

          // Handle inactive wallet specifically
          if (walletPaymentData.code === 'WALLET_INACTIVE') {
            throw new Error(`${walletPaymentData.error}. ${walletPaymentData.details || 'Please create a new wallet or contact support.'}`);
          }

          throw new Error(walletPaymentData.error || walletPaymentData.details || 'Wallet payment failed');
        }

        // Clear cart and show success
        localStorage.removeItem('wingside-cart');
        setCartItems([]);

        // Redirect to success page
        window.location.href = `/order-success?order_id=${data.order.id}&payment_method=wallet`;
      } else if (paymentMethod === 'nomba') {
        // Initialize payment with Nomba
        const paymentResponse = await fetch('/api/payment/nomba/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [csrfData.headerName]: csrfData.token,
          },
          body: JSON.stringify({
            order_id: data.order.id,
            amount: total,
            email: formData.email,
            metadata: {
              customer_name: `${formData.firstName} ${formData.lastName}`,
              phone: `+234${formattedPhone}`,
            },
          }),
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || 'Failed to initialize payment');
        }

        // Clear cart (will be restored if payment fails)
        localStorage.removeItem('wingside-cart');
        setCartItems([]);

        // Redirect to Nomba checkout page
        window.location.href = paymentData.checkout_url;
      } else {
        // Initialize payment with Paystack (default)
        const paymentResponse = await fetch('/api/payment/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: data.order.id,
            amount: total,
            email: formData.email,
            metadata: {
              customer_name: `${formData.firstName} ${formData.lastName}`,
              phone: `+234${formattedPhone}`,
            },
          }),
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || 'Failed to initialize payment');
        }

        // Clear cart (will be restored if payment fails)
        localStorage.removeItem('wingside-cart');
        setCartItems([]);

        // Redirect to Paystack payment page
        window.location.href = paymentData.authorization_url;
      }
    } catch (error: any) {
      console.error('Error submitting order:', error);
      const errorMessage = error?.message || 'Failed to submit order. Please try again.';
      setSubmitError(errorMessage);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="relative h-[150px] md:h-[300px] overflow-hidden">
        <img
          src="/order-hero.png"
          alt="Wings and more"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 pt-12 md:pt-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            CHECKOUT
          </h1>
        </div>
      </section>


      {/* Checkout Form Section */}
      <section className="py-8 md:py-12 gutter-x">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Left Column - Billing Details */}
              <div>
                {/* Delivery/Pickup Selection */}
                <div className="delivery-pickup-selector">
                  {/* Delivery Option */}
                  <div
                    className={`delivery-pickup-card ${orderType === 'delivery' ? 'active' : ''}`}
                    onClick={() => setOrderType('delivery')}
                  >
                    <div className="delivery-pickup-radio">
                      <div className={`radio-dot ${orderType === 'delivery' ? 'active' : ''}`}></div>
                    </div>
                    <div className="delivery-pickup-icon delivery-icon">
                      <img src="/delivery.svg" alt="Delivery" width="28" height="28" />
                    </div>
                    <h3 className="delivery-pickup-title">Delivery</h3>
                    <p className="delivery-pickup-desc">We'll bring it to your door</p>
                    <div className="delivery-pickup-time">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      20-30 mins
                    </div>
                  </div>

                  {/* Pickup Option */}
                  <div
                    className={`delivery-pickup-card ${orderType === 'pickup' ? 'active' : ''}`}
                    onClick={() => setOrderType('pickup')}
                  >
                    <div className="delivery-pickup-radio">
                      <div className={`radio-dot ${orderType === 'pickup' ? 'active' : ''}`}></div>
                    </div>
                    <div className="delivery-pickup-icon pickup-icon">
                      <img src="/pickup.svg" alt="Pickup" width="28" height="28" />
                    </div>
                    <h3 className="delivery-pickup-title">Pick Up</h3>
                    <p className="delivery-pickup-desc">Collect from our store</p>
                    <div className="delivery-pickup-time">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      20-30 mins
                    </div>
                  </div>
                </div>

                {/* Delivery Area / Pickup Store */}
                <div className="mb-8">
                  <label className="checkout-label">
                    {orderType === 'delivery' ? 'Delivery Area' : 'Pickup Store'}
                  </label>
                  <div className="relative">
                    <select
                      name="deliveryArea"
                      value={formData.deliveryArea}
                      onChange={handleInputChange}
                      className="checkout-select"
                    >
                      <option value="">
                        {orderType === 'delivery' ? 'Choose delivery area' : 'Choose pickup location'}
                      </option>
                      {orderType === 'pickup' ? (
                        loadingPickup ? (
                          <option value="">Loading pickup locations...</option>
                        ) : pickupLocations.length === 0 ? (
                          <option value="">No pickup locations available</option>
                        ) : (
                          pickupLocations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name}, {location.address} — FREE
                              {location.estimated_time && ` • ${location.estimated_time}`}
                            </option>
                          ))
                        )
                      ) : loadingAreas ? (
                        <option value="">Loading delivery areas...</option>
                      ) : (
                        <>
                          {deliveryAreas.map((area) => (
                            <option key={area.id} value={area.id}>
                              {area.name}
                              {area.description && ` (${area.description})`}
                              {' — ₦'}
                              {area.delivery_fee.toLocaleString()}
                              {area.estimated_time && ` • ${area.estimated_time}`}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <div className="checkout-select-arrow">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div>
                  <h2 className="text-lg font-bold mb-4">Delivery Details</h2>

                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="checkout-label">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        className="checkout-input"
                      />
                    </div>
                    <div>
                      <label className="checkout-label">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        className="checkout-input"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="mb-4">
                    <label className="checkout-label">Contact Phone Number</label>
                    <div className="flex">
                      <div className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                        +234
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          // Only allow numbers and limit to 10 digits (Nigerian format without leading 0)
                          let value = e.target.value.replace(/\D/g, '');
                          // Remove leading 0 if present (common mistake: 0801 -> 801)
                          if (value.startsWith('0')) {
                            value = value.slice(1);
                          }
                          // Limit to 10 digits
                          value = value.slice(0, 10);
                          setFormData(prev => ({ ...prev, phone: value }));
                        }}
                        placeholder="801 234 5678"
                        className="checkout-input rounded-l-none flex-1"
                       />
                    </div>
                  </div>

                  {/* Address Selector - Only for logged-in users with saved addresses */}
                  {isLoggedIn && savedAddresses.length > 0 && orderType === 'delivery' && (
                    <div className="mb-4">
                      <label className="checkout-label">Select Address</label>
                      <select
                        value={selectedAddressId}
                        onChange={(e) => handleAddressSelect(e.target.value)}
                        className="checkout-input"
                      >
                        <option value="new">+ Add New Address</option>
                        {savedAddresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.label || 'Address'} - {address.street_address}, {address.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Street Address */}
                  <div className="mb-4">
                    <label className="checkout-label">Street Address</label>
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      placeholder="House number and street address"
                      className="checkout-input"
                      disabled={isLoggedIn && selectedAddressId !== 'new'}
                    />
                  </div>

                  {/* City & Email Row */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="checkout-label">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        readOnly
                        className="checkout-input bg-gray-100 cursor-not-allowed"
                        disabled={isLoggedIn && selectedAddressId !== 'new'}
                      />
                    </div>
                    <div>
                      <label className="checkout-label">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@mail.com"
                        className="checkout-input"
                      />
                    </div>
                  </div>

                  {/* Create Account Checkbox - Only show for non-logged-in users */}
                  {!isLoggedIn && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="createAccount"
                          id="createAccount"
                          checked={formData.createAccount}
                          onChange={handleInputChange}
                          className="checkout-checkbox"
                        />
                        <label htmlFor="createAccount" className="text-sm text-gray-700">
                          Create an account to track orders and earn rewards
                        </label>
                      </div>

                      {/* Password fields - shown when createAccount is checked */}
                      {formData.createAccount && (
                        <div className="mt-4 p-4 bg-[#FDF5E5] rounded-lg border border-[#F7C400]/30">
                          <p className="text-sm text-[#552627] font-medium mb-3">
                            Create your password to complete registration
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="checkout-label">Password</label>
                              <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Min. 6 characters"
                                className="checkout-input"
                                minLength={6}
                              />
                            </div>
                            <div>
                              <label className="checkout-label">Confirm Password</label>
                              <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Re-enter password"
                                className="checkout-input"
                              />
                            </div>
                          </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Your account will be created with the email: <strong>{formData.email || 'Enter email above'}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div>
                <div className="checkout-summary-card">
                  <h2 className="text-lg font-bold mb-6">Order Summary</h2>
                  
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">Your cart is empty</p>
                        <Link href="/order" className="text-xs text-yellow-600 hover:text-yellow-700 mt-2 inline-block">
                          Go to Order Page
                        </Link>
                      </div>
                    ) : (
                      cartItems.map((item, index) => {
                        const flavorDisplay = Array.isArray(item.flavor)
                          ? item.flavor.join(', ')
                          : item.flavor;
                        const riceDisplay = Array.isArray(item.rice)
                          ? item.rice.join(', ')
                          : item.rice;
                        const drinkDisplay = Array.isArray(item.drink)
                          ? item.drink.join(', ')
                          : item.drink;

                        return (
                          <div key={index} className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.size}</p>
                              {flavorDisplay !== 'Regular' && (
                                <p className="text-xs text-gray-400 mt-0.5">{flavorDisplay}</p>
                              )}
                              {riceDisplay && (
                                <p className="text-xs text-gray-400 mt-0.5">Rice: {riceDisplay}</p>
                              )}
                              {drinkDisplay && (
                                <p className="text-xs text-gray-400 mt-0.5">Drink: {drinkDisplay}</p>
                              )}
                              {item.milkshake && (
                                <p className="text-xs text-gray-400 mt-0.5">Milkshake: {item.milkshake}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(index, -1)}
                                  className="checkout-qty-btn"
                                >
                                  −
                                </button>
                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(index, 1)}
                                  className="checkout-qty-btn checkout-qty-btn-plus"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm font-medium min-w-[80px] text-right">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFromCart(index)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                aria-label="Remove item"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Subtotal */}
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium">{formatPrice(subtotal)}</span>
                  </div>

                  {/* Delivery Fee / Pickup */}
                  <div className="mb-4">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={orderType === 'pickup' ? '/pickup.svg' : '/delivery.svg'}
                          alt={orderType === 'pickup' ? 'Pickup' : 'Delivery'}
                          width="16"
                          height="16"
                          className="text-gray-400"
                        />
                        <span className="text-sm text-gray-600">
                          {orderType === 'pickup' ? 'Pickup' : 'Delivery Fee'}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${deliveryFee === 0 ? 'text-green-600' : ''}`}>
                        {orderType === 'pickup'
                          ? 'FREE'
                          : deliveryFee === 0
                            ? 'FREE'
                            : formData.deliveryArea
                              ? formatPrice(deliveryFee)
                              : 'Pending'
                        }
                      </span>
                    </div>
                    {formData.deliveryArea && (
                      <p className="text-xs text-gray-400 mt-1 ml-6">
                        {getDeliveryAreaName()}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Promo Code */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <polyline points="20 12 20 22 4 22 4 12"></polyline>
                        <rect x="2" y="7" width="20" height="5"></rect>
                        <line x1="12" y1="22" x2="12" y2="7"></line>
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                      </svg>
                      <span className="text-sm text-gray-600">Promo Code</span>
                    </div>
                    {!appliedPromo ? (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value)
                              setPromoError('')
                            }}
                            placeholder="Enter promo code"
                            className="checkout-input flex-1"
                            disabled={applyingPromo}
                          />
                          <button
                            type="button"
                            onClick={applyPromoCode}
                            disabled={applyingPromo}
                            className="checkout-apply-btn"
                          >
                            {applyingPromo ? 'Applying...' : 'Apply'}
                          </button>
                        </div>
                        {promoError && (
                          <p className="text-xs text-red-600 mt-2">{promoError}</p>
                        )}
                      </>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-green-800">{appliedPromo.promoCode.code}</p>
                            <p className="text-xs text-green-600">{appliedPromo.message}</p>
                          </div>
                          <button
                            type="button"
                            onClick={removePromoCode}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

  
                  {/* Divider */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Discount */}
                  {appliedPromo && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-green-600 font-medium">Discount ({appliedPromo.promoCode.code})</span>
                      <span className="text-sm font-medium text-green-600">-{formatPrice(discount)}</span>
                    </div>
                  )}

                  {/* Referral Discount */}
                  {referralDiscount > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-yellow-600 font-medium">Referral Discount</span>
                      <span className="text-sm font-medium text-yellow-600">-{formatPrice(referralDiscount)}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between mb-6">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-lg">{formatPrice(total)}</span>
                  </div>

                  {/* Payment Method Selection - Show for all users */}
                  {!loadingWallet && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        <span className="text-sm text-gray-600">Payment Method</span>
                      </div>

                      <div className="space-y-3">
                        {/* Paystack Card Payment Option */}
                        {enabledGateways.paystack && (
                          <label
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                              paymentMethod === 'paystack'
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="paystack"
                                checked={paymentMethod === 'paystack'}
                                onChange={(e) => setPaymentMethod(e.target.value as 'paystack' | 'nomba')}
                                className="w-4 h-4 text-yellow-400 focus:ring-yellow-400"
                              />
                              <div>
                                <span className="font-medium text-gray-900">Pay with Card (Paystack)</span>
                                <p className="text-xs text-gray-500">Pay securely with Visa, Mastercard, or Verve</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                              </svg>
                            </div>
                          </label>
                        )}

                        {/* Card or Transfer Payment Option */}
                        {enabledGateways.nomba && (
                          <label
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                              paymentMethod === 'nomba'
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="nomba"
                                checked={paymentMethod === 'nomba'}
                                onChange={(e) => setPaymentMethod(e.target.value as 'paystack' | 'nomba')}
                                className="w-4 h-4 text-yellow-400 focus:ring-yellow-400"
                              />
                              <div>
                                <span className="font-medium text-gray-900">Pay with Card or Transfer</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <img src="/visa.svg" alt="Visa" className="h-6 w-auto" />
                              <img src="/mastercard.svg" alt="Mastercard" className="h-6 w-auto" />
                              <img src="/verve.svg" alt="Verve" className="h-6 w-auto" />
                            </div>
                          </label>
                        )}

                        {/* Wallet Payment Option - Only show if user has wallet and wallet is enabled */}
                        {isLoggedIn && enabledGateways.wallet && wallet && walletBalance > 0 && (
                          <label
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                              paymentMethod === 'wallet'
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${walletBalance < total ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="wallet"
                                checked={paymentMethod === 'wallet'}
                                onChange={(e) => setPaymentMethod(e.target.value as 'paystack' | 'nomba' | 'wallet')}
                                disabled={walletBalance < total}
                                className="w-4 h-4 text-yellow-400 focus:ring-yellow-400"
                              />
                              <div>
                                <span className="font-medium text-gray-900">Pay with Wallet</span>
                                <p className="text-xs text-gray-500">
                                  {walletBalance >= total
                                    ? `Available balance: ₦${walletBalance.toLocaleString()}`
                                    : `Insufficient balance (₦${walletBalance.toLocaleString()})`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <img src="/wallet.svg" alt="Wallet" className="h-6 w-auto" />
                            </div>
                          </label>
                        )}

                        {/* Insufficient Balance Warning */}
                        {paymentMethod === 'wallet' && wallet && walletBalance < total && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-yellow-800">
                              ⚠️ Insufficient wallet balance. Please add funds to your wallet or pay with card.
                            </p>
                            <button
                              type="button"
                              onClick={() => window.location.href = '/my-account/dashboard'}
                              className="text-xs text-yellow-700 underline hover:no-underline mt-1"
                            >
                              Add funds to wallet
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                      <p className="text-sm">{submitError}</p>
                    </div>
                  )}

                  {/* Place Order Button */}
                  <button
                    type="submit"
                    disabled={submitting || cartItems.length === 0}
                    className="checkout-submit-btn disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing Order...' : 'Place Order'}
                  </button>

                  {/* Trust Badges */}
                  <div className="flex justify-center gap-8 mt-6">
                    <div className="flex flex-col items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <span className="text-xs text-gray-500">Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <rect x="1" y="3" width="15" height="13"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                      </svg>
                      <span className="text-xs text-gray-500">Fast Delivery</span>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-2 mt-6">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      className="checkout-checkbox mt-0.5"
                    />
                    <label htmlFor="agreeTerms" className="text-xs text-gray-600">
                      I have read and agree to the website{' '}
                      <Link href="/terms" className="text-blue-600 underline">
                        terms and conditions
                      </Link>
                      {' '}*
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}