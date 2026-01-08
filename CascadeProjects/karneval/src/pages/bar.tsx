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

interface TableStats {
  tableNumber: number;
  totalOrders: number;
  totalAmount: number;
  items: { [key: string]: { quantity: number; amount: number } };
}

interface Statistics {
  tables: { [key: number]: TableStats };
  totalAmount: number;
  totalOrders: number;
  itemTotals: { [key: string]: { quantity: number; amount: number } };
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
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showWaiterQR, setShowWaiterQR] = useState(false);
  const [waiterQRCode, setWaiterQRCode] = useState('');
  const [pin, setPin] = useState('');
  const [unlockPin, setUnlockPin] = useState('');
  const [isShutdown, setIsShutdown] = useState(false);
  const [showOrderFormModal, setShowOrderFormModal] = useState(false);
  const [orderFormPin, setOrderFormPin] = useState('');
  const [isOrderFormDisabled, setIsOrderFormDisabled] = useState(false);
  const [, setTick] = useState(0);
  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>({
    tables: {},
    totalAmount: 0,
    totalOrders: 0,
    itemTotals: {}
  });

  // Force re-render every 10 seconds to update alert phases
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    console.log('Bar: Setting up Firebase listener for orders');
    
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      console.log('Bar: Firebase update received', snapshot.exists());
      const data = snapshot.val();
      if (data) {
        const orderList: Order[] = Object.entries(data).map(([id, order]: [string, any]) => ({
          id,
          ...order,
        }));
        // Sort by timestamp descending (newest first)
        orderList.sort((a, b) => b.timestamp - a.timestamp);
        console.log('Bar: Updated orders count:', orderList.length);
        setOrders(orderList);
      } else {
        console.log('Bar: No orders in database');
        setOrders([]);
      }
    }, (error) => {
      console.error('Bar: Firebase listener error:', error);
    });
    
    return () => {
      console.log('Bar: Cleaning up Firebase listener');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const shutdownRef = ref(database, 'system/shutdown');
    const unsubscribe = onValue(shutdownRef, (snapshot) => {
      setIsShutdown(snapshot.val() === true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const orderFormRef = ref(database, 'system/orderFormDisabled');
    const unsubscribe = onValue(orderFormRef, (snapshot) => {
      setIsOrderFormDisabled(snapshot.val() === true);
    });
    return () => unsubscribe();
  }, []);

  // Listen for statistics
  useEffect(() => {
    const statsRef = ref(database, 'statistics');
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStatistics(data);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDismiss = async (orderId: string) => {
    // Find the order to update statistics before removing
    const order = orders.find(o => o.id === orderId);
    if (order && order.type === 'order' && order.items) {
      // Update statistics in Firebase
      const statsRef = ref(database, 'statistics');
      const currentStats = { ...statistics };
      
      // Initialize table stats if not exists
      if (!currentStats.tables[order.tableNumber]) {
        currentStats.tables[order.tableNumber] = {
          tableNumber: order.tableNumber,
          totalOrders: 0,
          totalAmount: 0,
          items: {}
        };
      }
      
      const tableStats = currentStats.tables[order.tableNumber];
      tableStats.totalOrders += 1;
      tableStats.totalAmount += order.total || 0;
      
      // Update item counts for table
      order.items.forEach(item => {
        if (!tableStats.items[item.name]) {
          tableStats.items[item.name] = { quantity: 0, amount: 0 };
        }
        tableStats.items[item.name].quantity += item.quantity;
        tableStats.items[item.name].amount += item.price * item.quantity;
        
        // Update global item totals
        if (!currentStats.itemTotals[item.name]) {
          currentStats.itemTotals[item.name] = { quantity: 0, amount: 0 };
        }
        currentStats.itemTotals[item.name].quantity += item.quantity;
        currentStats.itemTotals[item.name].amount += item.price * item.quantity;
      });
      
      // Update global totals
      currentStats.totalOrders += 1;
      currentStats.totalAmount += order.total || 0;
      
      await set(statsRef, currentStats);
    }
    
    await remove(ref(database, `orders/${orderId}`));
  };

  const handleEmergencyToggle = async () => {
    if (isShutdown) {
      // Show unlock modal to reactivate
      setShowUnlockModal(true);
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

  const handleUnlockConfirm = async () => {
    if (unlockPin === '1234') {
      await set(ref(database, 'system/shutdown'), false);
      setShowUnlockModal(false);
      setUnlockPin('');
    } else {
      alert('Falscher PIN!');
    }
  };

  const handleOrderFormToggle = async () => {
    if (orderFormPin === '1234') {
      await set(ref(database, 'system/orderFormDisabled'), !isOrderFormDisabled);
      setShowOrderFormModal(false);
      setOrderFormPin('');
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
          <div className="flex gap-3 flex-wrap justify-end">
            <button
              onClick={() => setShowStatistics(true)}
              className="px-6 py-3 rounded-xl font-bold text-xl bg-purple-600 hover:bg-purple-700 transition-all"
            >
              📊 Statistik
            </button>
            <button
              onClick={handleShowWaiterQR}
              className="px-6 py-3 rounded-xl font-bold text-xl bg-evm-green hover:bg-green-700 transition-all"
            >
              👤 Kellner-QR
            </button>
            <button
              onClick={() => setShowOrderFormModal(true)}
              className={`px-6 py-3 rounded-xl font-bold text-xl transition-all ${
                isOrderFormDisabled 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isOrderFormDisabled ? '🛒 Bestellungen aktivieren' : '🚫 Bestellungen sperren'}
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

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-gray-900">
            <h2 className="text-3xl font-bold mb-4 text-center">🔓 System aktivieren</h2>
            <p className="text-gray-600 mb-6 text-center">
              Gib den PIN ein um das System wieder zu aktivieren
            </p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={unlockPin}
              onChange={(e) => setUnlockPin(e.target.value)}
              placeholder="PIN eingeben"
              className="w-full p-4 text-2xl text-center border-2 border-gray-300 rounded-xl mb-4 font-mono"
              maxLength={4}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlockConfirm()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockPin('');
                }}
                className="flex-1 px-6 py-4 bg-gray-300 text-gray-700 rounded-xl font-bold text-xl"
              >
                Abbrechen
              </button>
              <button
                onClick={handleUnlockConfirm}
                className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-bold text-xl"
              >
                ✅ Aktivieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Form Toggle Modal */}
      {showOrderFormModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-gray-900">
            <h2 className="text-3xl font-bold mb-4 text-center">
              {isOrderFormDisabled ? '🛒 Bestellungen aktivieren' : '🚫 Bestellungen sperren'}
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              {isOrderFormDisabled 
                ? 'Gib den PIN ein um das Bestellformular für alle Tische wieder zu aktivieren.'
                : 'Gib den PIN ein um das Bestellformular für alle Tische zu sperren. Der "Köbes komm ran" Button bleibt sichtbar!'}
            </p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={orderFormPin}
              onChange={(e) => setOrderFormPin(e.target.value)}
              placeholder="PIN eingeben"
              className="w-full p-4 text-2xl text-center border-2 border-gray-300 rounded-xl mb-4 font-mono"
              maxLength={4}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleOrderFormToggle()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOrderFormModal(false);
                  setOrderFormPin('');
                }}
                className="flex-1 px-6 py-4 bg-gray-300 text-gray-700 rounded-xl font-bold text-xl"
              >
                Abbrechen
              </button>
              <button
                onClick={handleOrderFormToggle}
                className={`flex-1 px-6 py-4 text-white rounded-xl font-bold text-xl ${
                  isOrderFormDisabled ? 'bg-green-600' : 'bg-yellow-600'
                }`}
              >
                {isOrderFormDisabled ? '✅ Aktivieren' : '🔒 Sperren'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shutdown Banner */}
      {isShutdown && (
        <div className="bg-red-600 p-4 text-center">
          <p className="text-2xl font-bold">⚠️ SYSTEM ABGESCHALTET ⚠️</p>
          <p>Gäste sehen eine Abschaltungs-Meldung</p>
        </div>
      )}

      {/* Order Form Disabled Banner */}
      {isOrderFormDisabled && !isShutdown && (
        <div className="bg-yellow-600 p-4 text-center">
          <p className="text-2xl font-bold">🚫 BESTELLFORMULAR GESPERRT 🚫</p>
          <p>Gäste können nur den Köbes-Button nutzen</p>
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

      {/* Statistics Modal */}
      {showStatistics && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full text-gray-900 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-purple-600">📊 Statistik</h2>
              <button
                onClick={() => setShowStatistics(false)}
                className="text-3xl text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Global Summary */}
            <div className="bg-purple-100 rounded-xl p-4 mb-6">
              <h3 className="text-xl font-bold text-purple-800 mb-3">📈 Gesamt</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-3xl font-bold text-purple-600">{statistics.totalOrders}</p>
                  <p className="text-gray-600">Bestellungen</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-3xl font-bold text-green-600">{statistics.totalAmount.toFixed(2)} €</p>
                  <p className="text-gray-600">Umsatz</p>
                </div>
              </div>
              
              {/* Most ordered items globally */}
              {Object.keys(statistics.itemTotals).length > 0 && (
                <div className="mt-4">
                  <p className="font-bold text-purple-800 mb-2">🏆 Meistbestellt:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statistics.itemTotals)
                      .sort((a, b) => b[1].quantity - a[1].quantity)
                      .map(([name, data]) => (
                        <span key={name} className="bg-white px-3 py-1 rounded-full text-sm font-bold">
                          {name}: {data.quantity}x ({data.amount.toFixed(2)} €)
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Per Table Statistics */}
            <h3 className="text-xl font-bold text-gray-800 mb-3">🪑 Nach Tisch</h3>
            {Object.keys(statistics.tables).length === 0 ? (
              <p className="text-gray-500 text-center py-8">Noch keine Bestellungen abgeschlossen</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(statistics.tables)
                  .sort((a, b) => b.totalAmount - a.totalAmount)
                  .map((table) => (
                    <div key={table.tableNumber} className="border-2 border-gray-200 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl font-bold text-evm-green">T{table.tableNumber}</span>
                        <span className="text-lg font-bold text-green-600">{table.totalAmount.toFixed(2)} €</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{table.totalOrders} Bestellungen</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(table.items)
                          .sort((a, b) => b[1].quantity - a[1].quantity)
                          .map(([name, data]) => (
                            <span key={name} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                              {name}: {data.quantity}x
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            
            <button
              onClick={() => setShowStatistics(false)}
              className="w-full mt-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-xl"
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
