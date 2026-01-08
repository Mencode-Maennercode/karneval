import { useState, useEffect, useCallback } from 'react';
import { database, ref, onValue, remove, set } from '@/lib/firebase';
import { getTableNumber } from '@/lib/tables';
import QRCode from 'qrcode';

interface Order {
  id: string;
  tableCode: string;
  tableNumber: number;
  type: 'order' | 'waiter_call';
  items?: { name: string; price: number; quantity: number }[];
  total?: number;
  timestamp: number;
  status: string;
}

type AlertPhase = 'red-blink' | 'red-solid' | 'orange' | 'green' | 'expired';

function getAlertPhase(timestamp: number): AlertPhase {
  const elapsed = Date.now() - timestamp;
  const minutes = elapsed / 60000;
  
  if (minutes < 1) return 'red-blink'; // 0-1 Min: Rot blinkend
  if (minutes < 2) return 'red-solid'; // 1-2 Min: Rot ohne blinken
  if (minutes < 4) return 'orange'; // 2-4 Min: Orange ohne blinken
  if (minutes < 6) return 'green'; // 4-6 Min: Grün ohne blinken
  return 'expired';
}

function getAlertClass(phase: AlertPhase): string {
  switch (phase) {
    case 'red-blink': return 'alert-red-blink';
    case 'red-solid': return 'bg-red-600';
    case 'orange': return 'bg-orange-500';
    case 'green': return 'bg-green-600';
    default: return '';
  }
}

export default function BarDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showWaiterQR, setShowWaiterQR] = useState(false);
  const [waiterQRCode, setWaiterQRCode] = useState('');
  const [pin, setPin] = useState('');
  const [isShutdown, setIsShutdown] = useState(false);
  const [, setTick] = useState(0);

  // Force re-render every 10 seconds to update alert phases
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList: Order[] = Object.entries(data).map(([id, order]: [string, any]) => ({
          id,
          ...order,
        }));
        // Sort by timestamp descending (newest first)
        orderList.sort((a, b) => b.timestamp - a.timestamp);
        setOrders(orderList);
      } else {
        setOrders([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const shutdownRef = ref(database, 'system/shutdown');
    const unsubscribe = onValue(shutdownRef, (snapshot) => {
      setIsShutdown(snapshot.val() === true);
    });
    return () => unsubscribe();
  }, []);

  const handleDismiss = async (orderId: string) => {
    await remove(ref(database, `orders/${orderId}`));
  };

  const handleEmergencyToggle = async () => {
    if (isShutdown) {
      // Deactivate shutdown
      await set(ref(database, 'system/shutdown'), false);
      setShowEmergencyModal(false);
    } else {
      setShowEmergencyModal(true);
    }
  };

  const handleEmergencyConfirm = async () => {
    if (pin === '1234') {
      await set(ref(database, 'system/shutdown'), true);
      setShowEmergencyModal(false);
      setPin('');
    } else {
      alert('Falscher PIN!');
    }
  };

  // Filter out expired orders
  const activeOrders = orders.filter(order => getAlertPhase(order.timestamp) !== 'expired');

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShowWaiterQR = async () => {
    const waiterUrl = `${window.location.origin}/kellner`;
    const qrDataUrl = await QRCode.toDataURL(waiterUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#009640',
        light: '#FFFFFF',
      },
    });
    setWaiterQRCode(qrDataUrl);
    setShowWaiterQR(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🍺 Theke</h1>
            <p className="text-gray-400">
              {activeOrders.length} aktive Meldungen
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShowWaiterQR}
              className="px-6 py-3 rounded-xl font-bold text-xl bg-evm-green hover:bg-green-700 transition-all"
            >
              👤 Kellner-QR
            </button>
            <button
              onClick={handleEmergencyToggle}
              className={`px-6 py-3 rounded-xl font-bold text-xl transition-all ${
                isShutdown 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isShutdown ? '✅ System aktivieren' : '🚨 NOTFALL-STOPP'}
            </button>
          </div>
        </div>
      </div>

      {/* Shutdown Banner */}
      {isShutdown && (
        <div className="bg-red-600 p-4 text-center">
          <p className="text-2xl font-bold">⚠️ SYSTEM ABGESCHALTET ⚠️</p>
          <p>Gäste sehen eine Abschaltungs-Meldung</p>
        </div>
      )}

      {/* Orders Grid */}
      <div className="max-w-6xl mx-auto p-4">
        {activeOrders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">☕</p>
            <p className="text-2xl text-gray-500">Keine aktiven Meldungen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map((order) => {
              const phase = getAlertPhase(order.timestamp);
              return (
                <div
                  key={order.id}
                  onClick={() => handleDismiss(order.id)}
                  className={`rounded-xl p-4 mb-3 cursor-pointer transition-all hover:opacity-80 text-white ${getAlertClass(phase)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bar-table-number">
                      T{order.tableNumber}
                    </span>
                    <span className="text-lg opacity-80">
                      {formatTime(order.timestamp)}
                    </span>
                  </div>
                  
                  {order.type === 'waiter_call' ? (
                    <div className="bar-display">
                      <span className="text-3xl">🙋</span>
                      <span className="ml-2">Kellner gerufen</span>
                    </div>
                  ) : (
                    <div>
                      <div className="bar-display mb-2">
                        <span className="text-3xl">🛒</span>
                        <span className="ml-2">Bestellung</span>
                      </div>
                      {order.items && (
                        <div className="space-y-1 text-xl">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span>{(item.price * item.quantity).toFixed(2)} €</span>
                            </div>
                          ))}
                          <div className="border-t border-white/30 pt-2 mt-2 font-bold text-2xl">
                            Gesamt: {order.total?.toFixed(2)} €
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm mt-3 opacity-70">
                    Klicken zum Entfernen
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Waiter QR Modal */}
      {showWaiterQR && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowWaiterQR(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-black" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-evm-green text-center">
              👤 Kellner-Zugang
            </h2>
            <p className="mb-4 text-gray-700 text-center">
              Kellner können diesen QR-Code scannen, um sich anzumelden.
            </p>
            {waiterQRCode && (
              <div className="flex justify-center mb-4">
                <img src={waiterQRCode} alt="Kellner QR Code" className="rounded-xl shadow-lg" />
              </div>
            )}
            <p className="text-sm text-gray-500 text-center mb-4">
              {window.location.origin}/kellner
            </p>
            <button
              onClick={() => setShowWaiterQR(false)}
              className="w-full py-3 bg-evm-green text-white rounded-xl font-bold"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-black">
            <h2 className="text-2xl font-bold mb-4 text-red-600">
              🚨 Notfall-Abschaltung
            </h2>
            <p className="mb-4 text-gray-700">
              Bitte PIN eingeben um das Bestellsystem abzuschalten. 
              Gäste sehen dann eine Hinweis-Meldung.
            </p>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN eingeben"
              className="w-full p-4 text-2xl text-center border-2 border-gray-300 rounded-xl mb-4"
              autoFocus
            />
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowEmergencyModal(false);
                  setPin('');
                }}
                className="flex-1 py-3 bg-gray-200 rounded-xl font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleEmergencyConfirm}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold"
              >
                Abschalten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
