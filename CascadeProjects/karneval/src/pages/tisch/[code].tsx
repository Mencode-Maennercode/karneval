import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { database, ref, push, onValue } from '@/lib/firebase';
import { getTableNumber, isValidTableCode } from '@/lib/tables';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderHistory {
  items: OrderItem[];
  total: number;
  timestamp: number;
}

export default function TablePage() {
  const router = useRouter();
  const { code } = router.query;
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [isShutdown, setIsShutdown] = useState(false);
  const [water, setWater] = useState(0);
  const [beer, setBeer] = useState(0);
  const [orderSent, setOrderSent] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (code && typeof code === 'string') {
      if (isValidTableCode(code)) {
        setTableNumber(getTableNumber(code));
      }
    }
  }, [code]);

  useEffect(() => {
    const shutdownRef = ref(database, 'system/shutdown');
    const unsubscribe = onValue(shutdownRef, (snapshot) => {
      setIsShutdown(snapshot.val() === true);
    });
    return () => unsubscribe();
  }, []);

  // Force re-render every 30 seconds to clean up old orders
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      // Clean up orders older than 6 minutes
      setOrderHistory(prev => 
        prev.filter(order => {
          const elapsed = Date.now() - order.timestamp;
          return elapsed < 6 * 60 * 1000; // 6 minutes
        })
      );
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const total = water * 1 + beer * 2;

  const handleOrder = async () => {
    if (total === 0) return;
    
    const items: OrderItem[] = [];
    if (water > 0) items.push({ name: 'Wasser', price: 1, quantity: water });
    if (beer > 0) items.push({ name: 'Bier', price: 2, quantity: beer });

    const timestamp = Date.now();

    await push(ref(database, 'orders'), {
      tableCode: code,
      tableNumber: tableNumber,
      items: items,
      total: total,
      type: 'order',
      timestamp: timestamp,
      status: 'new',
    });

    // Add to order history
    setOrderHistory(prev => [{ items, total, timestamp }, ...prev]);

    setOrderSent(true);
    setWater(0);
    setBeer(0);
    
    // Vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    setTimeout(() => setOrderSent(false), 3000);
  };

  const handleNewOrder = () => {
    setWater(0);
    setBeer(0);
    setOrderSent(false);
  };

  // Filter order history to only show orders from last 6 minutes
  const recentOrders = orderHistory.filter(order => {
    const elapsed = Date.now() - order.timestamp;
    return elapsed < 6 * 60 * 1000; // 6 minutes
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCallWaiter = async () => {
    await push(ref(database, 'orders'), {
      tableCode: code,
      tableNumber: tableNumber,
      type: 'waiter_call',
      timestamp: Date.now(),
      status: 'new',
    });

    setWaiterCalled(true);
    
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    
    setTimeout(() => setWaiterCalled(false), 3000);
  };

  if (!code || !tableNumber) {
    return (
      <div className="min-h-screen bg-evm-green flex items-center justify-center p-4">
        <div className="text-white text-center">
          <p className="text-2xl">Laden...</p>
        </div>
      </div>
    );
  }

  if (isShutdown) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-2xl">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-700 mb-4">System außer Betrieb</h1>
          <p className="text-gray-700 text-lg">
            Das System wurde aus technischen Gründen abgeschaltet. 
            Kellner kommen jetzt regelmäßig an Ihren Tisch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-evm-green to-green-700">
      {/* Header */}
      <div className="bg-evm-yellow p-4 shadow-lg">
        <div className="flex items-center justify-center gap-4">
          <img 
            src="https://www.energieschub.evm.de/media/ecb72371a2/1a53b5737ffd_180x180_boxed.jpg" 
            alt="Logo" 
            className="w-12 h-12 rounded-lg"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-evm-green">🎭 Karneval 2026</h1>
            <p className="text-sm font-medium">Tisch {tableNumber}</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Order Form */}
          <div>
            {/* Success Messages */}
            {orderSent && (
              <div className="bg-white rounded-xl p-4 mb-4 text-center shadow-lg animate-pulse">
                <p className="text-evm-green font-bold text-lg">✅ Bestellung gesendet!</p>
              </div>
            )}
            {waiterCalled && (
              <div className="bg-white rounded-xl p-4 mb-4 text-center shadow-lg animate-pulse">
                <p className="text-evm-green font-bold text-lg">✅ Kellner wird gerufen!</p>
              </div>
            )}

            {/* Order Form */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-4">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-800">Bestellung</h2>
          
          {/* Water */}
          <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-xl">
            <div>
              <p className="font-bold text-lg">💧 Wasser</p>
              <p className="text-gray-600">1,00 €</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setWater(Math.max(0, water - 1))}
                className="w-12 h-12 bg-gray-200 rounded-full text-2xl font-bold active:bg-gray-300"
              >
                -
              </button>
              <span className="text-2xl font-bold w-8 text-center">{water}</span>
              <button 
                onClick={() => setWater(water + 1)}
                className="w-12 h-12 bg-evm-green text-white rounded-full text-2xl font-bold active:bg-green-700"
              >
                +
              </button>
            </div>
          </div>

          {/* Beer */}
          <div className="flex items-center justify-between mb-6 p-3 bg-amber-50 rounded-xl">
            <div>
              <p className="font-bold text-lg">🍺 Bier</p>
              <p className="text-gray-600">2,00 €</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setBeer(Math.max(0, beer - 1))}
                className="w-12 h-12 bg-gray-200 rounded-full text-2xl font-bold active:bg-gray-300"
              >
                -
              </button>
              <span className="text-2xl font-bold w-8 text-center">{beer}</span>
              <button 
                onClick={() => setBeer(beer + 1)}
                className="w-12 h-12 bg-evm-green text-white rounded-full text-2xl font-bold active:bg-green-700"
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-200 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Gesamt:</span>
              <span className="text-3xl font-bold text-evm-green">{total.toFixed(2)} €</span>
            </div>
          </div>

          {/* Order Button */}
          <button 
            onClick={handleOrder}
            disabled={total === 0}
            className={`w-full py-4 rounded-xl text-xl font-bold transition-all ${
              total > 0 
                ? 'bg-evm-green text-white active:scale-95 shadow-lg' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            🛒 Bestellen
          </button>

          {/* New Order Button */}
          {(water > 0 || beer > 0) && (
            <button 
              onClick={handleNewOrder}
              className="w-full mt-3 py-3 rounded-xl text-lg font-bold bg-gray-200 text-gray-700 active:scale-95 transition-all"
            >
              🔄 Neue Bestellung
            </button>
          )}
        </div>

        {/* Call Waiter Button */}
        <button 
          onClick={handleCallWaiter}
          className="w-full bg-evm-yellow text-black py-5 rounded-2xl text-xl font-bold shadow-xl active:scale-95 transition-transform mt-4"
        >
          🙋 Kellner rufen
        </button>

        <p className="text-white/70 text-center mt-6 text-sm">
          Bezahlung erfolgt am Tisch
        </p>
          </div>

          {/* Right Column - Order History */}
          <div>
            {recentOrders.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-center mb-4 text-gray-800">
                  📋 Deine Bestellungen
                </h2>
                <div className="space-y-4">
                  {recentOrders.map((order, idx) => (
                    <div key={idx} className="border-2 border-evm-green rounded-xl p-4 bg-green-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">{formatTime(order.timestamp)}</span>
                        <span className="text-lg font-bold text-evm-green">{order.total.toFixed(2)} €</span>
                      </div>
                      <div className="space-y-1">
                        {order.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between text-gray-700">
                            <span>{item.quantity}x {item.name}</span>
                            <span>{(item.price * item.quantity).toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Bestellungen werden 6 Minuten angezeigt
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
