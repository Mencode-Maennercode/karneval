// Menu configuration for the Karneval ordering system

export interface MenuItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  size?: string;
  category: string;
  isPremium?: boolean; // Subtly highlighted items
  isPopular?: boolean; // Shown in quick access
  description?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
  items: MenuItem[];
}

// All menu items organized by category
export const menuItems: MenuItem[] = [
  // Softdrinks
  { id: 'cola', name: 'Cola', emoji: '🥤', price: 2.50, size: '0,2l', category: 'softdrinks', isPopular: true },
  { id: 'cola-zero', name: 'Cola Zero', emoji: '🥤', price: 2.50, size: '0,2l', category: 'softdrinks' },
  { id: 'limo', name: 'Limo', emoji: '🍋', price: 2.50, size: '0,2l', category: 'softdrinks' },
  { id: 'apfelschorle', name: 'Apfelschorle', emoji: '🍎', price: 2.50, size: '0,2l', category: 'softdrinks', isPopular: true },
  { id: 'wasser', name: 'Wasser', emoji: '💧', price: 2.50, size: '0,2l', category: 'softdrinks', isPopular: true },
  { id: 'flasche-wasser', name: 'Flasche Wasser', emoji: '💧', price: 5.00, size: '0,75l', category: 'softdrinks', isPremium: true, description: 'Für den ganzen Tisch' },
  { id: 'flasche-cola', name: 'Flasche Cola', emoji: '🍾', price: 6.00, size: '1,0l', category: 'softdrinks', isPremium: true, description: 'Zum Teilen' },
  { id: 'flasche-limo', name: 'Flasche Limo', emoji: '🍾', price: 6.00, size: '1,0l', category: 'softdrinks', isPremium: true, description: 'Zum Teilen' },
  
  // Bier
  { id: 'pils', name: 'Pils', emoji: '🍺', price: 3.00, size: '0,33l', category: 'bier', isPopular: true },
  { id: 'koelsch', name: 'Kölsch', emoji: '🍺', price: 3.00, size: '0,33l', category: 'bier', isPopular: true },
  { id: 'radler-00', name: 'Radler 0,0%', emoji: '🍺', price: 3.00, size: '0,33l', category: 'bier' },
  { id: 'kiste-bier-bitburger', name: 'Kiste Bitburger', emoji: '📦', price: 60.00, category: 'bier', isPremium: true, description: '24 Flaschen Bitburger' },
  { id: 'kiste-bier-koelsch', name: 'Kiste Kölsch', emoji: '📦', price: 60.00, category: 'bier', isPremium: true, description: '24 Flaschen Kölsch' },
  { id: 'kiste-bier-gemischt', name: 'Kiste Gemischt', emoji: '📦', price: 60.00, category: 'bier', isPremium: true, description: '10 Bitburger, 10 Kölsch, 4 Radler 0,0%' },
  
  // Wein & Sekt
  { id: 'glas-wein-blanc', name: 'Glas Blanc de noir', emoji: '🍷', price: 6.00, size: '0,2l', category: 'wein', description: 'trocken' },
  { id: 'glas-wein-weissburgunder', name: 'Glas Weißburgunder', emoji: '🍷', price: 6.00, size: '0,2l', category: 'wein', description: 'trocken' },
  { id: 'glas-wein-jubilus', name: 'Glas Jubilus', emoji: '🍷', price: 6.00, size: '0,2l', category: 'wein', description: 'feinherb' },
  { id: 'flasche-wein-blanc', name: 'Flasche Blanc de noir', emoji: '🍾', price: 20.00, category: 'wein', isPremium: true, description: 'trocken' },
  { id: 'flasche-wein-weissburgunder', name: 'Flasche Weißburgunder', emoji: '🍾', price: 20.00, category: 'wein', isPremium: true, description: 'trocken' },
  { id: 'flasche-wein-jubilus', name: 'Flasche Jubilus', emoji: '🍾', price: 20.00, category: 'wein', isPremium: true, description: 'feinherb' },
  { id: 'glas-secco', name: 'Glas Secco', emoji: '🥂', price: 6.00, size: '0,2l', category: 'wein', isPopular: true },
  { id: 'flasche-secco', name: 'Flasche Secco', emoji: '🍾', price: 18.00, category: 'wein', isPremium: true },
  { id: 'luftikuss', name: 'LuftiKuss', emoji: '🍾', price: 20.00, category: 'wein', isPremium: true, description: 'Alkoholfreier Sekt' },
  
  // Kurze (Shots)
  { id: 'berliner-luft', name: 'Berliner Luft', emoji: '🧊', price: 3.00, category: 'kurze', isPopular: true },
  { id: 'baerbelchen', name: 'Bärbelchen', emoji: '🍬', price: 3.00, category: 'kurze' },
  { id: 'glitter-pitter', name: 'Glitter Pitter', emoji: '✨', price: 3.00, category: 'kurze' },
  { id: 'kiste-klopfer-berliner', name: 'Kiste Berliner Luft', emoji: '📦', price: 50.00, category: 'kurze', isPremium: true },
  { id: 'kiste-klopfer-baerbelchen', name: 'Kiste Bärbelchen', emoji: '📦', price: 50.00, category: 'kurze', isPremium: true },
  { id: 'kiste-klopfer-glitter', name: 'Kiste Glitter Pitter', emoji: '📦', price: 50.00, category: 'kurze', isPremium: true },
  
  // Gläser (leer)
  { id: 'glas-normal', name: 'Glas (leer)', emoji: '🥃', price: 0.00, category: 'glaeser' },
  { id: 'glas-wein-leer', name: 'Weinglas (leer)', emoji: '🍷', price: 0.00, category: 'glaeser' },
];

export const categories: MenuCategory[] = [
  {
    id: 'softdrinks',
    name: 'Softdrinks',
    emoji: '🥤',
    items: menuItems.filter(item => item.category === 'softdrinks'),
  },
  {
    id: 'bier',
    name: 'Bier',
    emoji: '🍺',
    items: menuItems.filter(item => item.category === 'bier'),
  },
  {
    id: 'wein',
    name: 'Wein & Sekt',
    emoji: '🍷',
    items: menuItems.filter(item => item.category === 'wein'),
  },
  {
    id: 'kurze',
    name: 'Kurze',
    emoji: '🥃',
    items: menuItems.filter(item => item.category === 'kurze'),
  },
  {
    id: 'glaeser',
    name: 'Gläser',
    emoji: '🥃',
    items: menuItems.filter(item => item.category === 'glaeser'),
  },
];

// Get popular items for quick access
export const popularItems = menuItems.filter(item => item.isPopular);

// Get premium items (bottles, crates) for "For the Table" section
export const premiumItems = menuItems.filter(item => item.isPremium);

// Get item by ID
export const getItemById = (id: string): MenuItem | undefined => {
  return menuItems.find(item => item.id === id);
};

// Format price in German format
export const formatPrice = (price: number): string => {
  return price.toFixed(2).replace('.', ',') + ' €';
};
