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

  // Force re-render every 10 seconds to update alert phases
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
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
        
        // Vibrate if new orders came in
        if (myOrders.length > lastOrderCount && lastOrderCount > 0) {
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
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
          </div>
        </div>
      </div>
    );
  }

  // Main Waiter View
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-evm-green text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">👤 {waiterName}</h1>
            <p className="text-sm opacity-80">
              Tische: {assignedTables.join(', ')}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white/20 rounded-lg text-sm"
          >
            Ändern
          </button>
        </div>
      </div>

      {/* Orders */}
      <div className="p-4">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">✨</p>
            <p className="text-xl text-gray-500">Keine Bestellungen</p>
            <p className="text-gray-400 mt-2">Dein Handy vibriert bei neuen Bestellungen</p>
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
