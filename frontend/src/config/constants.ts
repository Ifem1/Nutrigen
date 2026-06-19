export const APP_NAME = 'Nutrigen';
export const APP_DESCRIPTION = 'Feed Optimization & Growth Projection';

export const LIVESTOCK_TYPES = [
  { value: 'cattle_beef', label: 'Beef Cattle' },
  { value: 'cattle_dairy', label: 'Dairy Cattle' },
  { value: 'poultry_broiler', label: 'Poultry (Broiler)' },
  { value: 'poultry_layer', label: 'Poultry (Layer)' },
  { value: 'swine', label: 'Swine' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'goat', label: 'Goat' },
  { value: 'fish_tilapia', label: 'Fish (Tilapia)' },
  { value: 'fish_catfish', label: 'Fish (Catfish)' },
  { value: 'other', label: 'Other' },
] as const;

export const GROWTH_STAGES = [
  { value: 'starter', label: 'Starter' },
  { value: 'grower', label: 'Grower' },
  { value: 'finisher', label: 'Finisher' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'lactation', label: 'Lactation' },
  { value: 'gestation', label: 'Gestation' },
] as const;

export const SEASONS = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
  { value: 'dry', label: 'Dry Season' },
  { value: 'wet', label: 'Wet/Rainy Season' },
] as const;

export const RISK_LEVELS = {
  low: { label: 'Low', color: '#22c55e', max: 30 },
  medium: { label: 'Medium', color: '#f97316', max: 60 },
  high: { label: 'High', color: '#ef4444', max: 80 },
  critical: { label: 'Critical', color: '#7f1d1d', max: 100 },
} as const;

export const RISK_WEIGHTS = {
  nutritional: 0.30,
  cost: 0.25,
  welfare: 0.20,
  consensus: 0.15,
  market: 0.10,
} as const;

export const POLICY_RULE_CATEGORIES = [
  { value: 'nutritional', label: 'Nutritional' },
  { value: 'cost', label: 'Cost' },
  { value: 'welfare', label: 'Animal Welfare' },
  { value: 'growth', label: 'Growth' },
  { value: 'environmental', label: 'Environmental' },
] as const;

export const COMMON_FEED_INGREDIENTS = [
  'Corn', 'Soybean Meal', 'Wheat Bran', 'Rice Bran', 'Fish Meal',
  'Bone Meal', 'Cottonseed Meal', 'Sunflower Meal', 'Palm Kernel Cake',
  'Cassava Peel', 'Brewers Grain', 'Molasses', 'Mineral Premix',
  'Vitamin Premix', 'Salt', 'Limestone', 'Dicalcium Phosphate',
  'Methionine', 'Lysine', 'Forage/Hay', 'Silage', 'Fresh Grass',
] as const;

export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { value: 'NGN', label: 'Nigerian Naira (₦)', symbol: '₦' },
  { value: 'KES', label: 'Kenyan Shilling (KSh)', symbol: 'KSh' },
  { value: 'BRL', label: 'Brazilian Real (R$)', symbol: 'R$' },
  { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
  { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
] as const;

export const GENLAYER_NETWORK = process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'studionet';
export const GENLAYER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || '';
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
