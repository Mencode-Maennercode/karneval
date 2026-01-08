import { useState, useEffect, useCallback, useRef } from 'react';
import { database, ref, onValue, remove, push } from '@/lib/firebase';

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

type AlertPhase = 'red' | 'orange' | 'green' | 'expired';

function getAlertPhase(timestamp: number): AlertPhase {
  const elapsed = Date.now() - timestamp;
  const minutes = elapsed / 60000;
  if (minutes < 1) return 'red';
  if (minutes < 3) return 'orange';
  if (minutes < 5) return 'green';
  return 'expired';
}

function getAlertBgColor(phase: AlertPhase): string {
  switch (phase) {
    case 'red': return 'bg-red-500';
    case 'orange': return 'bg-orange-500';
    case 'green': return 'bg-green-500';
    default: return 'bg-gray-400';
  }
}

// ============ AUDIO ALARM SYSTEM ============
// Creates a LOUD alarm using Web Audio API - works on ALL devices!
class AlarmSystem {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  // Initialize audio context (must be called from user gesture)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext.state === 'running';
  }

  // Play a beep sound
  private playBeep(frequency: number, duration: number) {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.value = frequency;
    osc.type = 'square'; // Loud, harsh sound
    
    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration);
  }

  // Start the alarm - plays repeatedly until stopped
  startAlarm() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Play alarm pattern immediately and every 2 seconds
    const playPattern = () => {
      if (!this.isPlaying) return;
      
      // Alarm pattern: high-low-high-low beeps
      this.playBeep(880, 0.2);  // A5
      setTimeout(() => this.playBeep(660, 0.2), 250);  // E5
      setTimeout(() => this.playBeep(880, 0.2), 500);  // A5
      setTimeout(() => this.playBeep(660, 0.2), 750);  // E5
      
      // Also trigger vibration
      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 300, 100, 300]);
      }
    };

    playPattern();
    this.intervalId = setInterval(playPattern, 2000);
  }

  // Stop the alarm
  stopAlarm() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0); // Stop vibration
    }
  }

  // Test alarm (single beep)
  testAlarm() {
    this.init();
    this.playBeep(880, 0.3);
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }
}

// Global alarm instance
const alarm = typeof window !== 'undefined' ? new AlarmSystem() : null;

export default function WaiterPage() {
  const [waiterName, setWaiterName] = useState('');
  const [assignedTables, setAssignedTables] = useState<number[]>([]);
  const [isSetup, setIsSetup] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tableInput, setTableInput] = useState('');
  const [, setTick] = useState(0);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  
  // NEW: Alarm state
  const [alarmActive, setAlarmActive] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [showActivation, setShowActivation] = useState(true);
  const [wakeLock, setWakeLock] = useState<any>(null);
  
  // Waiter order form state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderTableNumber, setOrderTableNumber] = useState<number | null>(null);
  const [orderWater, setOrderWater] = useState(0);
  const [orderBeer, setOrderBeer] = useState(0);
  const [orderSent, setOrderSent] = useState(false);

  // Force re-render every 10 seconds to update alert phases
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Check saved settings on mount
  useEffect(() => {
    const enabled = localStorage.getItem('alarmEnabled') === 'true';
    setAlarmEnabled(enabled);
    setShowActivation(!enabled);
  }, []);

  // Request Wake Lock to keep screen active
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isSetup && alarmEnabled) {
        try {
          const lock = await (navigator as any).wakeLock.request('screen');
          setWakeLock(lock);
          console.log('Wake Lock activated - screen will stay on');
        } catch (err) {
          console.log('Wake Lock failed:', err);
        }
      }
    };
    
    requestWakeLock();
    
    // Re-acquire wake lock when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSetup && alarmEnabled) {
        requestWakeLock();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [isSetup, alarmEnabled]);

  // Load saved waiter data from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('waiterName');
    const savedTables = localStorage.getItem('waiterTables');
    
    if (savedName && savedTables) {
      setWaiterName(savedName);
      setAssignedTables(JSON.parse(savedTables));
      setIsSetup(true);
    }
  }, []);

  // Subscribe to orders - trigger alarm on new orders
  useEffect(() => {
    if (!isSetup) return;

    const ordersRef = ref(database, 'orders');
    
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList: Order[] = Object.entries(data).map(([id, order]: [string, any]) => ({
          id,
          ...order,
        }));
        
        // Filter by assigned tables and not expired
        const myOrders = orderList
          .filter(order => 
            assignedTables.includes(order.tableNumber) && 
            getAlertPhase(order.timestamp) !== 'expired'
          )
          .sort((a, b) => b.timestamp - a.timestamp);
        
        // NEW ORDER DETECTED - TRIGGER ALARM!
        if (myOrders.length > lastOrderCount && lastOrderCount >= 0 && alarmEnabled) {
          const newOrder = myOrders[0];
          setNewOrderAlert(newOrder);
          setAlarmActive(true);
          
          // Start the loud alarm!
          if (alarm) {
            alarm.startAlarm();
          }
        }
        
        setLastOrderCount(myOrders.length);
        setOrders(myOrders);
      } else {
        setOrders([]);
        setLastOrderCount(0);
      }
    });
    
    return () => unsubscribe();
  }, [isSetup, assignedTables, lastOrderCount, alarmEnabled]);

  const handleSetup = () => {
    if (!waiterName.trim()) {
      alert('Bitte Namen eingeben!');
      return;
    }
    if (assignedTables.length === 0) {
      alert('Bitte mindestens einen Tisch auswählen!');
      return;
    }
    
    localStorage.setItem('waiterName', waiterName);
    localStorage.setItem('waiterTables', JSON.stringify(assignedTables));
    setIsSetup(true);
  };

  const handleAddTable = () => {
    const num = parseInt(tableInput);
    if (num >= 1 && num <= 44 && !assignedTables.includes(num)) {
      setAssignedTables([...assignedTables, num].sort((a, b) => a - b));
      setTableInput('');
    }
  };

  const handleRemoveTable = (num: number) => {
    setAssignedTables(assignedTables.filter(t => t !== num));
  };

  const handleDismiss = async (orderId: string) => {
    await remove(ref(database, `orders/${orderId}`));
  };

  const handleReset = () => {
    localStorage.removeItem('waiterName');
    localStorage.removeItem('waiterTables');
    setWaiterName('');
    setAssignedTables([]);
    setIsSetup(false);
  };

  // ACTIVATE ALARM SYSTEM - must be called from user tap!
  const handleActivateAlarm = () => {
    if (alarm) {
      alarm.init();
      alarm.testAlarm(); // Play test sound to confirm it works
    }
    setAlarmEnabled(true);
    setShowActivation(false);
    localStorage.setItem('alarmEnabled', 'true');
  };

  // Stop alarm and dismiss the alert
  const handleDismissAlarm = () => {
    if (alarm) {
      alarm.stopAlarm();
    }
    setAlarmActive(false);
    setNewOrderAlert(null);
  };

  // Test the alarm
  const handleTestAlarm = () => {
    if (alarm) {
      alarm.init();
      alarm.testAlarm();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Open order form for a specific table
  const handleOpenOrderForm = (tableNum: number) => {
    setOrderTableNumber(tableNum);
    setOrderWater(0);
    setOrderBeer(0);
    setOrderSent(false);
    setShowOrderForm(true);
  };

  // Submit waiter order
  const handleSubmitWaiterOrder = async () => {
    if (!orderTableNumber) return;
    
    const orderTotal = orderWater * 1 + orderBeer * 2;
    if (orderTotal === 0) return;

    const items: { name: string; price: number; quantity: number }[] = [];
    if (orderWater > 0) items.push({ name: 'Wasser', price: 1, quantity: orderWater });
    if (orderBeer > 0) items.push({ name: 'Bier', price: 2, quantity: orderBeer });

    await push(ref(database, 'orders'), {
      tableCode: `waiter-${orderTableNumber}`,
      tableNumber: orderTableNumber,
      items: items,
      total: orderTotal,
      type: 'order',
      timestamp: Date.now(),
      status: 'new',
      orderedBy: waiterName,
    });

    setOrderSent(true);
    
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    setTimeout(() => {
      setShowOrderForm(false);
      setOrderSent(false);
    }, 1500);
  };

  // Setup Screen
  if (!isSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-evm-green to-green-800 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center text-white mb-8 pt-8">
            <h1 className="text-3xl font-bold mb-2">👤 Kellner-Ansicht</h1>
            <p className="opacity-80">Einrichtung</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">Dein Name</label>
              <input
                type="text"
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                placeholder="z.B. Max"
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl"
              />
            </div>

            {/* Table Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">Deine Tische</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  min="1"
                  max="44"
                  value={tableInput}
                  onChange={(e) => setTableInput(e.target.value)}
                  placeholder="Nur Zahl eingeben (1-44)"
                  className="flex-1 p-3 border-2 border-gray-300 rounded-xl"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
                />
                <button
                  onClick={handleAddTable}
                  className="px-6 py-3 bg-evm-green text-white rounded-xl font-bold"
                >
                  +
                </button>
              </div>
              
              {assignedTables.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignedTables.map(num => (
                    <span 
                      key={num}
                      onClick={() => handleRemoveTable(num)}
                      className="px-4 py-2 bg-evm-yellow rounded-lg font-bold cursor-pointer hover:bg-yellow-400"
                    >
                      T{num} ✕
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Select */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Schnellauswahl:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAssignedTables([1,2,3,4,5,6,7,8,9,10,11])}
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                  1-11
                </button>
                <button
                  onClick={() => setAssignedTables([12,13,14,15,16,17,18,19,20,21,22])}
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                  12-22
                </button>
                <button
                  onClick={() => setAssignedTables([23,24,25,26,27,28,29,30,31,32,33])}
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                  23-33
                </button>
                <button
                  onClick={() => setAssignedTables([34,35,36,37,38,39,40,41,42,43,44])}
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                  34-44
                </button>
              </div>
            </div>

            <button
              onClick={handleSetup}
              className="w-full py-4 bg-evm-green text-white rounded-xl text-xl font-bold"
            >
              Starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Waiter View
  return (
    <div className="min-h-screen bg-gray-100">
      {/* FULL SCREEN ALARM ALERT - Flashing! */}
      {alarmActive && newOrderAlert && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-pulse"
          style={{ 
            background: 'linear-gradient(45deg, #ff0000, #ff6600, #ff0000)',
            animation: 'flash 0.5s infinite alternate'
          }}
          onClick={handleDismissAlarm}
        >
          <style jsx>{`
            @keyframes flash {
              0% { background: #ff0000; }
              100% { background: #ffff00; }
            }
          `}</style>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-8xl mb-4">🚨</div>
            <h1 className="text-4xl font-black text-red-600 mb-4">
              NEUE BESTELLUNG!
            </h1>
            <div className="text-6xl font-black text-gray-900 mb-4">
              Tisch {newOrderAlert.tableNumber}
            </div>
            {newOrderAlert.type === 'waiter_call' ? (
              <p className="text-2xl text-orange-600 font-bold">🙋 Kellner gerufen!</p>
            ) : (
              <p className="text-2xl text-green-600 font-bold">
                💰 {newOrderAlert.total?.toFixed(2)} €
              </p>
            )}
            <button
              onClick={handleDismissAlarm}
              className="mt-8 w-full py-6 bg-green-600 text-white rounded-2xl text-2xl font-black"
            >
              ✅ VERSTANDEN - ALARM STOPPEN
            </button>
          </div>
        </div>
      )}

      {/* ONE-TAP ACTIVATION SCREEN */}
      {showActivation && !alarmActive && (
        <div className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">🔊</div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Alarm aktivieren</h2>
            
            <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 mb-6 text-left">
              <p className="font-bold text-red-700 mb-2">⚠️ WICHTIG!</p>
              <p className="text-red-600">
                Tippe auf den Button um den <strong>LAUTEN ALARM</strong> zu aktivieren.
                Bei jeder neuen Bestellung ertönt ein lauter Alarm + Vibration!
              </p>
            </div>

            <div className="bg-yellow-100 border-2 border-yellow-500 rounded-xl p-4 mb-6 text-left">
              <p className="font-bold text-yellow-700 mb-2">📱 Handy-Lautstärke!</p>
              <p className="text-yellow-600">
                Stelle sicher dass dein <strong>Handy NICHT auf lautlos</strong> ist!
                Der Alarm funktioniert über den Lautsprecher.
              </p>
            </div>

            <button
              onClick={handleActivateAlarm}
              className="w-full py-6 bg-red-600 text-white rounded-2xl text-2xl font-black animate-pulse"
            >
              🔊 ALARM AKTIVIEREN
            </button>
            
            <p className="mt-4 text-gray-500 text-sm">
              Du hörst einen Test-Ton wenn aktiviert
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-evm-green text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">👤 {waiterName}</h1>
            <p className="text-sm opacity-80">
              Tische: {assignedTables.join(', ')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTestAlarm}
              className="px-3 py-2 bg-white/20 rounded-lg text-sm"
            >
              🔊 Test
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-white/20 rounded-lg text-sm"
            >
              Ändern
            </button>
          </div>
        </div>
        {alarmEnabled && (
          <div className="mt-2 bg-green-500 rounded-lg px-3 py-1 text-sm text-center">
            ✅ Alarm aktiv - Handy laut lassen!
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="p-4">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">✨</p>
            <p className="text-xl text-gray-500">Keine Bestellungen</p>
            <p className="text-gray-400 mt-2">Alarm ertönt bei neuen Bestellungen</p>
            
            {/* Test Alarm Button */}
            <button
              onClick={handleTestAlarm}
              className="mt-6 px-6 py-3 bg-evm-green text-white rounded-xl font-bold"
            >
              🔊 Alarm testen
            </button>
            
            {!alarmEnabled && (
              <button
                onClick={() => setShowActivation(true)}
                className="mt-3 px-6 py-3 bg-red-600 text-white rounded-xl font-bold block mx-auto"
              >
                ⚠️ Alarm aktivieren
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const phase = getAlertPhase(order.timestamp);
              return (
                <div
                  key={order.id}
                  onClick={() => handleDismiss(order.id)}
                  className={`${getAlertBgColor(phase)} text-white rounded-xl p-4 shadow-lg cursor-pointer active:scale-98 transition-transform`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-4xl font-black">
                      T{order.tableNumber}
                    </span>
                    <span className="text-lg opacity-80">
                      {formatTime(order.timestamp)}
                    </span>
                  </div>
                  
                  {order.type === 'waiter_call' ? (
                    <div className="text-xl font-bold">
                      🙋 Kellner gerufen!
                    </div>
                  ) : (
                    <div>
                      <div className="text-xl font-bold mb-2">🛒 Bestellung</div>
                      {order.items && (
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-lg">
                              <span>{item.quantity}x {item.name}</span>
                              <span>{(item.price * item.quantity).toFixed(2)} €</span>
                            </div>
                          ))}
                          <div className="border-t border-white/30 pt-2 mt-2 font-bold text-xl">
                            Gesamt: {order.total?.toFixed(2)} €
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm mt-3 opacity-70">
                    Tippen zum Erledigen
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Count Badge */}
      {orders.length > 0 && (
        <div className="fixed bottom-6 right-6 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl">
          {orders.length}
        </div>
      )}

      {/* Quick Order Buttons for assigned tables */}
      <div className="fixed bottom-6 left-6 right-24">
        <div className="bg-white rounded-2xl shadow-xl p-3">
          <p className="text-xs text-gray-500 mb-2 text-center">🛒 Bestellung aufgeben für:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {assignedTables.map(tableNum => (
              <button
                key={tableNum}
                onClick={() => handleOpenOrderForm(tableNum)}
                className="px-4 py-2 bg-evm-green text-white rounded-lg font-bold text-sm active:scale-95 transition-transform"
              >
                T{tableNum}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Waiter Order Form Modal */}
      {showOrderForm && orderTableNumber && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            {orderSent ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-2xl font-bold text-green-600">Bestellung gesendet!</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    🛒 Bestellung T{orderTableNumber}
                  </h2>
                  <button
                    onClick={() => setShowOrderForm(false)}
                    className="text-2xl text-gray-500"
                  >
                    ✕
                  </button>
                </div>

                {/* Water */}
                <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-xl">
                  <div>
                    <p className="font-bold text-lg">💧 Wasser</p>
                    <p className="text-gray-600">1,00 €</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setOrderWater(Math.max(0, orderWater - 1))}
                      className="w-12 h-12 bg-gray-200 rounded-full text-2xl font-bold active:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold w-8 text-center">{orderWater}</span>
                    <button 
                      onClick={() => setOrderWater(orderWater + 1)}
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
                      onClick={() => setOrderBeer(Math.max(0, orderBeer - 1))}
                      className="w-12 h-12 bg-gray-200 rounded-full text-2xl font-bold active:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold w-8 text-center">{orderBeer}</span>
                    <button 
                      onClick={() => setOrderBeer(orderBeer + 1)}
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
                    <span className="text-3xl font-bold text-evm-green">
                      {(orderWater * 1 + orderBeer * 2).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowOrderForm(false)}
                    className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSubmitWaiterOrder}
                    disabled={orderWater + orderBeer === 0}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg ${
                      orderWater + orderBeer > 0
                        ? 'bg-evm-green text-white'
                        : 'bg-gray-300 text-gray-500'
                    }`}
                  >
                    Bestellen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
