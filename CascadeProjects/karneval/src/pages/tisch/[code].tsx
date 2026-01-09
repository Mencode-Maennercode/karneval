import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { database, ref, push, onValue } from '@/lib/firebase';
import { getTableNumber, isValidTableCode } from '@/lib/tables';
import { menuItems, categories, premiumItems, formatPrice, MenuItem } from '@/lib/menu';

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

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export default function TablePage() {
  const router = useRouter();
  const { code } = router.query;
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [isShutdown, setIsShutdown] = useState(false);
  const [isOrderFormDisabled, setIsOrderFormDisabled] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [, setTick] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showIOSInstallHint, setShowIOSInstallHint] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // New menu state
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState<string>('alle');
  const [showCart, setShowCart] = useState(false);
  
  // Selection modals
  const [showBottleSelection, setShowBottleSelection] = useState(false);
  const [showBeerCrateSelection, setShowBeerCrateSelection] = useState(false);
  const [showWineBottleSelection, setShowWineBottleSelection] = useState(false);
  const [showShotSelection, setShowShotSelection] = useState(false);
  
  // Temporary quantity for modals
  const [tempQuantity, setTempQuantity] = useState<{ [key: string]: number }>({});

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

  useEffect(() => {
    const orderFormRef = ref(database, 'system/orderFormDisabled');
    const unsubscribe = onValue(orderFormRef, (snapshot) => {
      setIsOrderFormDisabled(snapshot.val() === true);
    });
    return () => unsubscribe();
  }, []);

  // Set the tisch manifest for PWA with dynamic start_url
  useEffect(() => {
    if (!code) return;
    
    // Create dynamic manifest with current table URL
    const manifest = {
      name: `Karneval Tisch ${tableNumber || ''}`,
      short_name: `Tisch ${tableNumber || ''}`,
      description: 'Tisch-App für das Karneval Bestellsystem - Bestelle Getränke direkt vom Tisch',
      start_url: `/tisch/${code}`,
      scope: `/tisch/${code}`,
      display: 'standalone',
      background_color: '#009640',
      theme_color: '#009640',
      orientation: 'portrait',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable any'
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable any'
        }
      ]
    };

    // Create blob URL for dynamic manifest
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(blob);

    // Update or create manifest link
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.href = manifestUrl;
    } else {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = manifestUrl;
      document.head.appendChild(manifestLink);
    }

    return () => {
      URL.revokeObjectURL(manifestUrl);
    };
  }, [code, tableNumber]);

  // PWA Install Detection
  useEffect(() => {
    // Check if already installed as PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isInStandaloneMode) {
      // Already installed, don't show button
      return;
    }

    if (isIOS) {
      // iOS doesn't support beforeinstallprompt, show manual instructions
      setShowInstallButton(true);
    }

    // Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Subscribe to all orders to calculate popular items
  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersArray = Object.entries(data).map(([id, order]: [string, any]) => ({
          id,
          ...order
        }));
        setAllOrders(ordersArray);
      } else {
        setAllOrders([]);
      }
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

  // Cart helper functions
  const addToCart = (itemId: string) => {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getCartQuantity = (itemId: string) => cart[itemId] || 0;

  const cartTotal = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    const item = menuItems.find(i => i.id === itemId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const cartItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  // Calculate top 5 popular items based on all orders (excluding glasses)
  const getTop5PopularItems = (): Set<string> => {
    const itemCounts: { [key: string]: number } = {};
    
    allOrders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: OrderItem) => {
          const menuItem = menuItems.find(m => m.name === item.name);
          if (menuItem && menuItem.category !== 'glaeser') {
            itemCounts[menuItem.id] = (itemCounts[menuItem.id] || 0) + item.quantity;
          }
        });
      }
    });
    
    const sortedItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([itemId]) => itemId);
    
    return new Set(sortedItems);
  };

  const top5PopularIds = getTop5PopularItems();

  // Get items with dynamic popularity
  const getItemsWithDynamicPopularity = () => {
    return menuItems.map(item => ({
      ...item,
      isPopular: top5PopularIds.has(item.id)
    }));
  };

  const dynamicMenuItems = getItemsWithDynamicPopularity();

  const handleOrder = async () => {
    if (cartItemCount === 0) return;
    
    const items: OrderItem[] = Object.entries(cart).map(([itemId, qty]) => {
      const item = menuItems.find(i => i.id === itemId)!;
      return { name: item.name, price: item.price, quantity: qty };
    });

    const timestamp = Date.now();

    await push(ref(database, 'orders'), {
      tableCode: code,
      tableNumber: tableNumber,
      items: items,
      total: cartTotal,
      type: 'order',
      timestamp: timestamp,
      status: 'new',
    });

    // Add to order history
    setOrderHistory(prev => [{ items, total: cartTotal, timestamp }, ...prev]);

    setOrderSent(true);
    setCart({});
    setShowCart(false);
    
    // Vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    setTimeout(() => setOrderSent(false), 3000);
  };

  const handleClearCart = () => {
    setCart({});
    setShowCart(false);
  };

  // Filter items by category and sort by popularity
  const getFilteredItems = () => {
    let items = activeCategory === 'alle' ? dynamicMenuItems : dynamicMenuItems.filter(i => i.category === activeCategory);
    
    // Sort by popularity (popular items first)
    items = [...items].sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return 0;
    });
    
    return items;
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

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIOS) {
      setShowIOSInstallHint(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallButton(false);
      }
      setDeferredPrompt(null);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-evm-green to-green-700 relative overflow-hidden">
      {/* Background Logo Watermark */}
      <div className="pointer-events-none absolute top-6 right-[-4%] opacity-15 rotate-12">
        <img
          src="https://www.energieschub.evm.de/media/ecb72371a2/1a53b5737ffd_180x180_boxed.jpg"
          alt="Logo Hintergrund"
          className="w-96 md:w-[36rem] mix-blend-multiply rounded-full saturate-150 brightness-110"
        />
      </div>
      {/* Header */}
      <div className="bg-evm-yellow p-4 shadow-lg relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="https://www.energieschub.evm.de/media/ecb72371a2/1a53b5737ffd_180x180_boxed.jpg" 
              alt="Logo" 
              className="w-16 h-16 rounded-full shadow-md mix-blend-multiply"
            />
            <h1 className="text-xl sm:text-2xl font-extrabold text-evm-green drop-shadow">Fastelovend 2026</h1>
          </div>
          <button 
            onClick={handleCallWaiter}
            className="bg-evm-green text-white px-4 py-2 rounded-xl font-bold shadow-lg active:scale-95 transition-transform whitespace-nowrap"
          >
            🙋 Köbes
          </button>
          <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur text-evm-green font-black text-xl sm:text-2xl shadow-lg whitespace-nowrap">
            Tisch {tableNumber}
          </span>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Order Form */}
          <div>
            {/* Success Messages */}
            {orderSent && (
              <div className="bg-white/90 backdrop-blur rounded-xl p-4 mb-4 text-center shadow-lg animate-pulse">
                <p className="text-evm-green font-bold text-lg">✅ Bestellung gesendet!</p>
              </div>
            )}
            {waiterCalled && (
              <div className="bg-white/90 backdrop-blur rounded-xl p-4 mb-4 text-center shadow-lg animate-pulse">
                <p className="text-evm-green font-bold text-lg">✅ Kellner wird gerufen!</p>
              </div>
            )}

            {/* Order Form - only show when not disabled */}
        {!isOrderFormDisabled ? (
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl mb-4 overflow-hidden">
            {/* Category Tabs */}
            <div className="flex overflow-x-auto bg-gray-100 p-1 gap-1">
              <button
                onClick={() => setActiveCategory('alle')}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                  activeCategory === 'alle' ? 'bg-evm-green text-white' : 'bg-white text-gray-700'
                }`}
              >
                🍹 Alle
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                    activeCategory === cat.id ? 'bg-evm-green text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Premium Items - "Für den Tisch" Section */}
              {activeCategory === 'alle' && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-2">
                    <span className="text-lg">✨</span> Für den ganzen Tisch
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Flasche Unalkoholisch Button */}
                    <button
                      onClick={() => setShowBottleSelection(true)}
                      className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-2xl">🍾</span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          ab 5,00 €
                        </span>
                      </div>
                      <p className="font-bold text-sm text-gray-800">Flasche Unalkoholisch</p>
                      <p className="text-xs text-gray-500">Wasser / Cola / Limo</p>
                    </button>

                    {/* Kiste Bier Button */}
                    <button
                      onClick={() => setShowBeerCrateSelection(true)}
                      className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-2xl">📦</span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          60,00 €
                        </span>
                      </div>
                      <p className="font-bold text-sm text-gray-800">Kiste Bier</p>
                      <p className="text-xs text-gray-500">24 Flaschen</p>
                    </button>

                    {/* Wein/Secco Flasche Button */}
                    <button
                      onClick={() => setShowWineBottleSelection(true)}
                      className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-2xl">🍾</span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          ab 18,00 €
                        </span>
                      </div>
                      <p className="font-bold text-sm text-gray-800">Wein / Secco Flasche</p>
                      <p className="text-xs text-gray-500">Verschiedene Sorten</p>
                    </button>

                    {/* Kurze Button */}
                    <button
                      onClick={() => setShowShotSelection(true)}
                      className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-2xl">🥃</span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          50,00 €
                        </span>
                      </div>
                      <p className="font-bold text-sm text-gray-800">Kiste Kurze</p>
                      <p className="text-xs text-gray-500">Berliner / Bärbelchen / Glitter</p>
                    </button>

                  </div>
                </div>
              )}

              {/* Regular Items */}
              <h3 className="text-sm font-bold text-gray-600 mb-2">
                {activeCategory === 'alle' ? '🥤 Getränke' : categories.find(c => c.id === activeCategory)?.emoji + ' ' + categories.find(c => c.id === activeCategory)?.name}
              </h3>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {getFilteredItems().map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      item.isPopular ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div>
                        <p className="font-bold text-gray-800">
                          {item.name}
                          {item.isPopular && <span className="ml-2 text-xs text-green-600">⭐ Beliebt</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.size && <span>{item.size} · </span>}
                          <span className="font-semibold text-evm-green">{formatPrice(item.price)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getCartQuantity(item.id) > 0 && (
                        <>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold active:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="font-bold text-xl w-8 text-center">{getCartQuantity(item.id)}</span>
                        </>
                      )}
                      <button
                        onClick={() => addToCart(item.id)}
                        className="w-10 h-10 bg-evm-green text-white rounded-full text-xl font-bold active:bg-green-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary & Order Button */}
              {cartItemCount > 0 && (
                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-700">{cartItemCount} Artikel</span>
                    <span className="text-2xl font-bold text-evm-green">{formatPrice(cartTotal)}</span>
                  </div>
                  <button
                    onClick={handleOrder}
                    className="w-full py-4 rounded-xl text-xl font-bold bg-evm-green text-white active:scale-95 shadow-lg transition-all"
                  >
                    🛒 Bestellen ({formatPrice(cartTotal)})
                  </button>
                  <button
                    onClick={handleClearCart}
                    className="w-full mt-2 py-2 rounded-lg text-sm font-bold bg-gray-200 text-gray-600"
                  >
                    🔄 Warenkorb leeren
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100/90 backdrop-blur rounded-2xl p-6 shadow-xl mb-4 text-center">
            <div className="text-4xl mb-3">🚫</div>
            <h2 className="text-xl font-bold text-yellow-800 mb-2">Bestellung momentan nicht möglich</h2>
            <p className="text-yellow-700">Bitte rufen Sie den Köbes über den Button unten.</p>
          </div>
        )}

        <p className="text-white/70 text-center mt-6 text-sm">
          Bezahlung erfolgt am Tisch
        </p>

        {/* PWA Install Button */}
        {showInstallButton && !isStandalone && (
          <button
            onClick={handleInstallClick}
            className="w-full bg-white/90 backdrop-blur text-evm-green py-4 rounded-2xl text-lg font-bold shadow-xl active:scale-95 transition-transform mt-4 flex items-center justify-center gap-2"
          >
            <span className="text-2xl">📲</span>
            <span>Tisch {tableNumber} als App speichern</span>
          </button>
        )}

        {/* Selection Modals */}
        {/* Bottle Selection Modal */}
        {showBottleSelection && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">🍾 Flasche wählen</h2>
                <button onClick={() => { setShowBottleSelection(false); setTempQuantity({}); }} className="text-2xl text-gray-500">✕</button>
              </div>
              <div className="space-y-3 mb-4">
                {menuItems.filter(i => ['flasche-wasser', 'flasche-cola', 'flasche-limo'].includes(i.id)).map(item => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="text-left">
                          <p className="font-bold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.size}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-evm-green">{formatPrice(item.price)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setTempQuantity(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                        className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold active:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold w-12 text-center">{tempQuantity[item.id] || 0}</span>
                      <button
                        onClick={() => setTempQuantity(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                        className="w-10 h-10 bg-evm-green text-white rounded-full text-xl font-bold active:bg-green-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {Object.values(tempQuantity).some(q => q > 0) && (
                <button
                  onClick={() => {
                    Object.entries(tempQuantity).forEach(([itemId, qty]) => {
                      for (let i = 0; i < qty; i++) {
                        addToCart(itemId);
                      }
                    });
                    setTempQuantity({});
                    setShowBottleSelection(false);
                  }}
                  className="w-full py-3 bg-evm-green text-white rounded-xl font-bold text-lg"
                >
                  Hinzufügen
                </button>
              )}
            </div>
          </div>
        )}

        {/* Beer Crate Selection Modal */}
        {showBeerCrateSelection && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">📦 Kiste wählen</h2>
                <button onClick={() => { setShowBeerCrateSelection(false); setTempQuantity({}); }} className="text-2xl text-gray-500">✕</button>
              </div>
              <div className="space-y-3 mb-4">
                {menuItems.filter(i => i.id.includes('kiste-bier')).map(item => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="text-left">
                          <p className="font-bold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-evm-green">{formatPrice(item.price)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setTempQuantity(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                        className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold active:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold w-12 text-center">{tempQuantity[item.id] || 0}</span>
                      <button
                        onClick={() => setTempQuantity(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                        className="w-10 h-10 bg-evm-green text-white rounded-full text-xl font-bold active:bg-green-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {Object.values(tempQuantity).some(q => q > 0) && (
                <button
                  onClick={() => {
                    Object.entries(tempQuantity).forEach(([itemId, qty]) => {
                      for (let i = 0; i < qty; i++) {
                        addToCart(itemId);
                      }
                    });
                    setTempQuantity({});
                    setShowBeerCrateSelection(false);
                  }}
                  className="w-full py-3 bg-evm-green text-white rounded-xl font-bold text-lg"
                >
                  Hinzufügen
                </button>
              )}
            </div>
          </div>
        )}

        {/* Wine Bottle Selection Modal */}
        {showWineBottleSelection && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">🍾 Wein/Secco wählen</h2>
                <button onClick={() => { setShowWineBottleSelection(false); setTempQuantity({}); }} className="text-2xl text-gray-500">✕</button>
              </div>
              <div className="space-y-3 mb-4">
                {menuItems.filter(i => ['flasche-secco', 'flasche-wein-blanc', 'flasche-wein-weissburgunder', 'flasche-wein-jubilus', 'luftikuss'].includes(i.id)).map(item => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="text-left">
                          <p className="font-bold text-gray-800">{item.name}</p>
                          {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                        </div>
                      </div>
                      <span className="text-lg font-bold text-evm-green">{formatPrice(item.price)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setTempQuantity(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                        className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold active:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold w-12 text-center">{tempQuantity[item.id] || 0}</span>
                      <button
                        onClick={() => setTempQuantity(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                        className="w-10 h-10 bg-evm-green text-white rounded-full text-xl font-bold active:bg-green-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {Object.values(tempQuantity).some(q => q > 0) && (
                <button
                  onClick={() => {
                    Object.entries(tempQuantity).forEach(([itemId, qty]) => {
                      for (let i = 0; i < qty; i++) {
                        addToCart(itemId);
                      }
                    });
                    setTempQuantity({});
                    setShowWineBottleSelection(false);
                  }}
                  className="w-full py-3 bg-evm-green text-white rounded-xl font-bold text-lg"
                >
                  Hinzufügen
                </button>
              )}
            </div>
          </div>
        )}

        {/* Shot/Kurze Selection Modal */}
        {showShotSelection && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">🥃 Kiste Kurze wählen</h2>
                <button onClick={() => { setShowShotSelection(false); setTempQuantity({}); }} className="text-2xl text-gray-500">✕</button>
              </div>
              <div className="space-y-3 mb-4">
                {menuItems.filter(i => i.id.includes('kiste-klopfer')).map(item => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="text-left">
                          <p className="font-bold text-gray-800">{item.name}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-evm-green">{formatPrice(item.price)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setTempQuantity(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                        className="w-10 h-10 bg-gray-200 rounded-full text-xl font-bold active:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold w-12 text-center">{tempQuantity[item.id] || 0}</span>
                      <button
                        onClick={() => setTempQuantity(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                        className="w-10 h-10 bg-evm-green text-white rounded-full text-xl font-bold active:bg-green-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {Object.values(tempQuantity).some(q => q > 0) && (
                <button
                  onClick={() => {
                    Object.entries(tempQuantity).forEach(([itemId, qty]) => {
                      for (let i = 0; i < qty; i++) {
                        addToCart(itemId);
                      }
                    });
                    setTempQuantity({});
                    setShowShotSelection(false);
                  }}
                  className="w-full py-3 bg-evm-green text-white rounded-xl font-bold text-lg"
                >
                  Hinzufügen
                </button>
              )}
            </div>
          </div>
        )}
          </div>

          {/* Right Column - Order History */}
          <div>
            {recentOrders.length > 0 && (
              <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl">
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

      {/* iOS Install Hint Modal */}
      {showIOSInstallHint && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowIOSInstallHint(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl mb-4">🍺</div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tisch {tableNumber} App installieren</h2>
            <p className="text-sm text-gray-600 mb-4">
              Installiere diese Seite als App auf deinem Handy - so findest du sie immer schnell wieder!
            </p>
            <div className="text-left space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-xl">
                <span className="text-2xl">1️⃣</span>
                <span className="text-gray-700">Tippe unten auf <strong>Teilen</strong> (das Quadrat mit Pfeil)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-xl">
                <span className="text-2xl">2️⃣</span>
                <span className="text-gray-700">Scrolle und tippe auf <strong>"Zum Home-Bildschirm"</strong></span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-xl">
                <span className="text-2xl">3️⃣</span>
                <span className="text-gray-700">Tippe oben rechts auf <strong>"Hinzufügen"</strong></span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Die App öffnet immer direkt Tisch {tableNumber}!
            </p>
            <button
              onClick={() => setShowIOSInstallHint(false)}
              className="w-full py-3 bg-evm-green text-white rounded-xl font-bold"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
