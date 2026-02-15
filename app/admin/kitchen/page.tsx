'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  product_name: string;
  product_size: string;
  flavors: string[];
  addons: any;
  quantity: number;
  notes: string;
}

export default function KitchenDisplayPage() {
  const { authorized, loading } = useRoleAccess({
    requiredPermission: 'orders',
    requiredLevel: 'view'
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [flashAlert, setFlashAlert] = useState(false);
  const [lastOrderTime, setLastOrderTime] = useState<string>('--');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fetch initial orders
  useEffect(() => {
    if (!authorized) return;
    fetchOrders();
  }, [authorized]);

  // Real-time subscription
  useEffect(() => {
    if (!authorized) return;

    const supabase = createClient();

    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('Order change:', payload);

          if (payload.eventType === 'INSERT') {
            // Fetch full order with items
            const { data } = await supabase
              .from('orders')
              .select(`
                *,
                order_items (*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data && ['confirmed', 'preparing', 'ready'].includes(data.status)) {
              handleNewOrder(data);
            }
          } else if (payload.eventType === 'UPDATE') {
            handleOrderUpdate(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authorized]);

  const fetchOrders = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .in('status', ['confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching orders:', error);
    }

    if (data) {
      console.log('Fetched orders:', data);
      setOrders(data);
    }
  };

  const handleNewOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
    setLastOrderTime('Just now');

    // Audio alert
    if (audioEnabled) {
      playBeep();
    }

    // Visual flash
    setFlashAlert(true);
    setTimeout(() => setFlashAlert(false), 3000);

    // Browser push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New Order: ${order.order_number}`, {
        body: `${order.customer_name} - ₦${order.total.toLocaleString()}`,
        icon: '/logo.png',
        tag: order.id,
      });
    }
  };

  const handleOrderUpdate = (updatedOrder: any) => {
    if (['confirmed', 'preparing', 'ready'].includes(updatedOrder.status)) {
      setOrders(prev =>
        prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)
      );
    } else {
      // Order moved to different status (delivered, cancelled, etc.)
      setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
    }
  };

  const playBeep = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      await containerRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  const getTimeAgo = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  const OrderColumn = ({ title, status, color }: { title: string, status: string, color: string }) => {
    const columnOrders = orders.filter(o => o.status === status);

    const headerColors = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500'
    };

    return (
      <div className="bg-gray-800 rounded-2xl p-4 overflow-y-auto max-h-[85vh]">
        <h2 className={`${headerColors[color as keyof typeof headerColors]} text-white text-xl font-bold text-center py-2 px-3 rounded-xl mb-4`}>
          {title} ({columnOrders.length})
        </h2>
        <div className="flex flex-col gap-3">
          {columnOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">No orders</p>
            </div>
          ) : (
            columnOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-lg">
                {/* Order Header */}
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                  <span className="text-lg font-bold text-[#552627]">{order.order_number}</span>
                  <span className="text-gray-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {getTimeAgo(order.created_at)}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="mb-3">
                  <div className="font-semibold text-base mb-1 flex items-center gap-2 text-gray-900">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {order.customer_name}
                  </div>
                  {order.customer_phone && (
                    <div className="text-gray-500 text-xs flex items-center gap-1 ml-6">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {order.customer_phone}
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-3">
                  {order.order_items?.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-start gap-2">
                        <span className="bg-[#F7C400] text-black px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 mt-0.5">
                          {item.quantity}x
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 leading-tight">
                            {item.product_name}
                            {item.product_size && <span className="text-gray-500 font-normal"> ({item.product_size})</span>}
                          </div>
                          {item.flavors?.length > 0 && (
                            <div className="text-[#F7C400] text-xs mt-1 flex items-start gap-1">
                              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className="leading-tight">{item.flavors.join(', ')}</span>
                            </div>
                          )}
                          {/* Notes - Always show */}
                          <div className={`text-xs mt-1.5 flex items-start gap-1 p-1.5 rounded border ${
                            item.notes
                              ? 'text-red-700 bg-red-50 border-red-200 font-medium'
                              : 'text-gray-400 bg-gray-50 border-gray-200 italic'
                          }`}>
                            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="leading-tight">
                              {item.notes || 'No special instructions'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="text-xl font-bold text-[#552627] text-right pt-2 border-t border-gray-200">
                  ₦{order.total.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-4xl text-[#F7C400]">
        <svg className="animate-spin h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div>Loading Kitchen Display...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[#1a1a1a] text-white p-6">
      {/* Flash overlay */}
      {flashAlert && (
        <div
          className="fixed inset-0 border-8 border-red-500 pointer-events-none z-[9999] animate-pulse"
          style={{ animation: 'pulse 0.5s ease-in-out 3' }}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b-2 border-gray-700">
        <h1 className="text-3xl font-bold text-[#F7C400] flex items-center gap-3">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Kitchen Display System
        </h1>
        <div className="flex items-center gap-4 text-base">
          <span className="bg-red-500 text-white px-4 py-1.5 rounded-full font-bold animate-pulse flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="6" />
            </svg>
            LIVE
          </span>
          <span className="flex items-center gap-2 text-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {lastOrderTime}
          </span>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
            title={audioEnabled ? "Mute audio alerts" : "Enable audio alerts"}
          >
            {audioEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-3 gap-4 min-h-[85vh]">
        <OrderColumn title="CONFIRMED" status="confirmed" color="blue" />
        <OrderColumn title="PREPARING" status="preparing" color="purple" />
        <OrderColumn title="READY" status="ready" color="green" />
      </div>

      {/* Notification Warning */}
      {Notification.permission === 'denied' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold shadow-xl flex items-center gap-2 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Browser notifications blocked
        </div>
      )}
    </div>
  );
}
