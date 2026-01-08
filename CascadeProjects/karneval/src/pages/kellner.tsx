import { useState, useEffect, useCallback } from 'react';
import { database, ref, onValue, remove, set, get } from '@/lib/firebase';
import { getTableNumber, getAllTableCodes } from '@/lib/tables';

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

export default function WaiterPage() {
  const [waiterName, setWaiterName] = useState('');
  const [assignedTables, setAssignedTables] = useState<number[]>([]);
  const [isSetup, setIsSetup] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tableInput, setTableInput] = useState('');
  const [, setTick] = useState(0);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [showVibrationBanner, setShowVibrationBanner] = useState(true);

  // Force re-render every 10 seconds to update alert phases
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Check if app is installed and handle install prompt
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Check if vibration was already enabled
    const vibEnabled = localStorage.getItem('vibrationEnabled') === 'true';
    setVibrationEnabled(vibEnabled);
    setShowVibrationBanner(!vibEnabled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

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

  // Subscribe to orders
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
        
        // Vibrate strongly and notify if new orders came in
        if (myOrders.length > lastOrderCount && lastOrderCount > 0) {
          // Strong, long vibration pattern
          if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500, 200, 500, 200, 500]);
          }
          
          // Show notification (works even when app is in background)
          if ('Notification' in window && Notification.permission === 'granted') {
            const newOrder = myOrders[0];
            const title = newOrder.type === 'waiter_call' 
              ? `🙋 Tisch ${newOrder.tableNumber} ruft!`
              : `🍺 Neue Bestellung Tisch ${newOrder.tableNumber}`;
            const body = newOrder.type === 'waiter_call'
              ? 'Kellner wird gerufen'
              : `${newOrder.total?.toFixed(2)} € - Tippe zum Öffnen`;
            
            new Notification(title, {
              body,
              icon: '/icons/icon.svg',
              tag: 'new-order-' + newOrder.id,
              requireInteraction: true,
            });
          }
          
          // Also play a sound if possible
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 1.0;
            audio.play().catch(() => {});
          } catch (e) {}
        }
        setLastOrderCount(myOrders.length);
        setOrders(myOrders);
      } else {
        setOrders([]);
        setLastOrderCount(0);
      }
    });
    return () => unsubscribe();
  }, [isSetup, assignedTables, lastOrderCount]);

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

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Dein Browser unterstützt keine Benachrichtigungen');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    
    if (permission === 'granted') {
      // Show test notification
      new Notification('🍺 Kellner-App aktiviert!', {
        body: 'Du erhältst jetzt Benachrichtigungen bei neuen Bestellungen',
        icon: '/icons/icon.svg',
      });
      // Also activate vibration
      triggerVibration();
    }
  };

  // Vibration function that works reliably
  const triggerVibration = () => {
    try {
      // Try multiple vibration patterns to ensure it works
      if ('vibrate' in navigator) {
        // Strong vibration pattern: 500ms on, 200ms off, repeated
        const pattern = [500, 200, 500, 200, 500, 200, 500, 200, 500];
        navigator.vibrate(pattern);
        return true;
      }
    } catch (e) {
      console.log('Vibration failed:', e);
    }
    return false;
  };

  const handleActivateVibration = () => {
    // This function MUST be called from a user gesture (tap/click)
    const success = triggerVibration();
    if (success) {
      setVibrationEnabled(true);
      setShowVibrationBanner(false);
      localStorage.setItem('vibrationEnabled', 'true');
      alert('✅ Vibration aktiviert! Dein Handy vibriert jetzt bei neuen Bestellungen.');
    } else {
      alert('⚠️ Vibration wird von deinem Gerät nicht unterstützt.');
    }
  };

  const handleTestVibration = () => {
    triggerVibration();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

            {/* Install App Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-bold text-gray-700 mb-3">📱 App installieren</h3>
              
              {isInstalled ? (
                <div className="text-green-600 font-medium flex items-center gap-2">
                  <span>✅</span> App ist installiert!
                </div>
              ) : installPrompt ? (
                <button
                  onClick={handleInstall}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold"
                >
                  📲 App installieren
                </button>
              ) : (
                <div className="text-sm text-gray-500">
                  <p className="mb-2"><strong>Android:</strong> Tippe auf ⋮ → "Zum Startbildschirm hinzufügen"</p>
                  <p><strong>iPhone:</strong> Tippe auf Teilen → "Zum Home-Bildschirm"</p>
                </div>
              )}

              {/* Notification Permission */}
              <div className="mt-4">
                {notificationsEnabled ? (
                  <div className="text-green-600 font-medium flex items-center gap-2">
                    <span>🔔</span> Benachrichtigungen aktiviert!
                  </div>
                ) : (
                  <button
                    onClick={handleEnableNotifications}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold"
                  >
                    🔔 Benachrichtigungen aktivieren
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Waiter View
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Vibration Activation Banner - MUST tap to enable */}
      {showVibrationBanner && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="text-6xl mb-4">📳</div>
            <h2 className="text-2xl font-bold mb-2">Vibration aktivieren</h2>
            <p className="text-gray-600 mb-6">
              Tippe auf den Button um Vibration zu aktivieren. 
              Dein Handy vibriert dann bei neuen Bestellungen!
            </p>
            <button
              onClick={handleActivateVibration}
              className="w-full py-4 bg-red-600 text-white rounded-xl text-xl font-bold animate-pulse"
            >
              📳 JETZT AKTIVIEREN
            </button>
            <button
              onClick={() => setShowVibrationBanner(false)}
              className="mt-3 text-gray-500 text-sm"
            >
              Später
            </button>
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
              onClick={handleTestVibration}
              className="px-3 py-2 bg-white/20 rounded-lg text-sm"
            >
              📳 Test
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-white/20 rounded-lg text-sm"
            >
              Ändern
            </button>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="p-4">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">✨</p>
            <p className="text-xl text-gray-500">Keine Bestellungen</p>
            <p className="text-gray-400 mt-2">Dein Handy vibriert bei neuen Bestellungen</p>
            
            {/* Test Vibration Button */}
            <button
              onClick={handleTestVibration}
              className="mt-6 px-6 py-3 bg-evm-green text-white rounded-xl font-bold"
            >
              📳 Vibration testen
            </button>
            
            {!vibrationEnabled && (
              <button
                onClick={handleActivateVibration}
                className="mt-3 px-6 py-3 bg-red-600 text-white rounded-xl font-bold block mx-auto"
              >
                ⚠️ Vibration aktivieren
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
    </div>
  );
}
