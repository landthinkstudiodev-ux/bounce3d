export type BallSkinId =
  | 'default_red'
  | 'skin_gold'
  | 'skin_ruby'
  | 'skin_cyan'
  | 'skin_emerald'
  | 'skin_obsidian';

export type TrailEffectId =
  | 'default_red'
  | 'trail_gold'
  | 'trail_rainbow'
  | 'trail_emerald';

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  priceFormatted: string;
  coinPrice?: number;
  isPurchased: boolean;
  type: 'remove_ads' | 'starter_pack' | 'ball_skin' | 'trail_effect';
}

export interface SkinVisualMeta {
  id: BallSkinId;
  nameId: string;
  nameEn: string;
  colorHex: number;
  emissiveHex: number;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  cssGradient: string;
  badgeColorClass: string;
}

export interface TrailVisualMeta {
  id: TrailEffectId;
  nameId: string;
  nameEn: string;
  primaryHex: number;
  secondaryHex: number;
  cssBadge: string;
}

const STORAGE_SHOP_KEY = 'bounce_shop_data_v1';
const STORAGE_SPIN_KEY = 'bounce_last_spin_date_v1';
const STORAGE_CURRENCY_KEY = 'bounce_player_coins_v1';
const STORAGE_EQUIPPED_SKIN_KEY = 'bounce_equipped_skin_v1';
const STORAGE_EQUIPPED_TRAIL_KEY = 'bounce_equipped_trail_v1';

export const BALL_SKIN_META: Record<BallSkinId, SkinVisualMeta> = {
  default_red: {
    id: 'default_red',
    nameId: 'Bola Merah Klasik',
    nameEn: 'Classic Red Ball',
    colorHex: 0xef4444,
    emissiveHex: 0x450a0a,
    emissiveIntensity: 0.15,
    metalness: 0.08,
    roughness: 0.16,
    cssGradient: 'radial-gradient(circle at 32% 28%, #fca5a5 0%, #ef4444 48%, #991b1b 100%)',
    badgeColorClass: 'text-red-300 border-red-400/40 bg-red-500/15',
  },
  skin_gold: {
    id: 'skin_gold',
    nameId: 'Bola Emas Mewah',
    nameEn: 'Royal Gold Ball',
    colorHex: 0xfacc15,
    emissiveHex: 0x854d0e,
    emissiveIntensity: 0.28,
    metalness: 0.72,
    roughness: 0.14,
    cssGradient: 'radial-gradient(circle at 32% 28%, #fef08a 0%, #facc15 48%, #a16207 100%)',
    badgeColorClass: 'text-amber-300 border-amber-400/50 bg-amber-500/20',
  },
  skin_ruby: {
    id: 'skin_ruby',
    nameId: 'Bola Ruby Magma',
    nameEn: 'Magma Ruby Ball',
    colorHex: 0xe11d48,
    emissiveHex: 0x881337,
    emissiveIntensity: 0.35,
    metalness: 0.38,
    roughness: 0.1,
    cssGradient: 'radial-gradient(circle at 32% 28%, #fda4af 0%, #e11d48 48%, #4c0519 100%)',
    badgeColorClass: 'text-rose-300 border-rose-400/50 bg-rose-500/20',
  },
  skin_cyan: {
    id: 'skin_cyan',
    nameId: 'Bola Neon Cyan',
    nameEn: 'Neon Cyan Ball',
    colorHex: 0x06b6d4,
    emissiveHex: 0x0891b2,
    emissiveIntensity: 0.42,
    metalness: 0.32,
    roughness: 0.12,
    cssGradient: 'radial-gradient(circle at 32% 28%, #a5f3fc 0%, #06b6d4 48%, #164e63 100%)',
    badgeColorClass: 'text-cyan-300 border-cyan-400/50 bg-cyan-500/20',
  },
  skin_emerald: {
    id: 'skin_emerald',
    nameId: 'Bola Jungle Emerald',
    nameEn: 'Jungle Emerald Ball',
    colorHex: 0x10b981,
    emissiveHex: 0x065f46,
    emissiveIntensity: 0.3,
    metalness: 0.35,
    roughness: 0.14,
    cssGradient: 'radial-gradient(circle at 32% 28%, #6ee7b7 0%, #10b981 48%, #064e3b 100%)',
    badgeColorClass: 'text-emerald-300 border-emerald-400/50 bg-emerald-500/20',
  },
  skin_obsidian: {
    id: 'skin_obsidian',
    nameId: 'Bola Obsidian Void',
    nameEn: 'Obsidian Void Ball',
    colorHex: 0x312e81,
    emissiveHex: 0x4f46e5,
    emissiveIntensity: 0.38,
    metalness: 0.65,
    roughness: 0.1,
    cssGradient: 'radial-gradient(circle at 32% 28%, #818cf8 0%, #312e81 48%, #090d16 100%)',
    badgeColorClass: 'text-indigo-300 border-indigo-400/50 bg-indigo-500/20',
  },
};

export const TRAIL_EFFECT_META: Record<TrailEffectId, TrailVisualMeta> = {
  default_red: {
    id: 'default_red',
    nameId: 'Jejak Standar',
    nameEn: 'Standard Trail',
    primaryHex: 0xef4444,
    secondaryHex: 0xfca5a5,
    cssBadge: 'text-slate-300 border-white/20 bg-white/10',
  },
  trail_gold: {
    id: 'trail_gold',
    nameId: 'Jejak Gold Sparkles',
    nameEn: 'Gold Sparkles Trail',
    primaryHex: 0xfacc15,
    secondaryHex: 0xfef08a,
    cssBadge: 'text-amber-300 border-amber-400/40 bg-amber-500/15',
  },
  trail_rainbow: {
    id: 'trail_rainbow',
    nameId: 'Jejak Rainbow Comet',
    nameEn: 'Rainbow Comet Trail',
    primaryHex: 0x38bdf8,
    secondaryHex: 0xf472b6,
    cssBadge: 'text-sky-300 border-sky-400/40 bg-sky-500/15',
  },
  trail_emerald: {
    id: 'trail_emerald',
    nameId: 'Jejak Emerald Dust',
    nameEn: 'Emerald Dust Trail',
    primaryHex: 0x10b981,
    secondaryHex: 0x6ee7b7,
    cssBadge: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/15',
  },
};

export function getEquippedSkin(): BallSkinId {
  try {
    const saved = localStorage.getItem(STORAGE_EQUIPPED_SKIN_KEY) as BallSkinId | null;
    if (saved && saved in BALL_SKIN_META) {
      return saved;
    }
  } catch {}
  return 'default_red';
}

export function setEquippedSkin(skinId: BallSkinId): void {
  try {
    localStorage.setItem(STORAGE_EQUIPPED_SKIN_KEY, skinId);
  } catch {}
}

export function getEquippedTrail(): TrailEffectId {
  try {
    const saved = localStorage.getItem(STORAGE_EQUIPPED_TRAIL_KEY) as TrailEffectId | null;
    if (saved && saved in TRAIL_EFFECT_META) {
      return saved;
    }
  } catch {}
  return 'default_red';
}

export function setEquippedTrail(trailId: TrailEffectId): void {
  try {
    localStorage.setItem(STORAGE_EQUIPPED_TRAIL_KEY, trailId);
  } catch {}
}

export function getPlayerCoins(): number {
  try {
    const val = parseInt(localStorage.getItem(STORAGE_CURRENCY_KEY) || '250', 10);
    return Number.isFinite(val) ? val : 250;
  } catch {
    return 250;
  }
}

export function addPlayerCoins(amount: number): number {
  const current = getPlayerCoins();
  const next = Math.max(0, current + amount);
  try {
    localStorage.setItem(STORAGE_CURRENCY_KEY, String(next));
  } catch {}
  return next;
}

export function canSpinToday(): boolean {
  try {
    const last = localStorage.getItem(STORAGE_SPIN_KEY);
    const today = new Date().toDateString();
    return last !== today;
  } catch {
    return true;
  }
}

export function recordSpinToday(): void {
  try {
    localStorage.setItem(STORAGE_SPIN_KEY, new Date().toDateString());
  } catch {}
}

export function getShopItems(): ShopItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_SHOP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure new skin/trail items are included if not present in old localStorage
        const existingIds = new Set(parsed.map((i: ShopItem) => i.id));
        const defaultItems = getDefaultShopItems();
        let updated = [...parsed];
        defaultItems.forEach((d) => {
          if (!existingIds.has(d.id)) {
            updated.push(d);
          }
        });
        return updated;
      }
    }
  } catch {}

  return getDefaultShopItems();
}

function getDefaultShopItems(): ShopItem[] {
  return [
    {
      id: 'remove_ads',
      title: 'Hapus Iklan Permanen (Remove Ads)',
      description: 'Nikmati pengalaman bermain bebas iklan selamanya tanpa jeda.',
      priceFormatted: 'Rp 15.000',
      isPurchased: false,
      type: 'remove_ads',
    },
    {
      id: 'coin_pack_500',
      title: 'Kantong 500 Cincin Emas',
      description: 'Paket isi ulang koin cincin emas instan untuk beli skin & nyawa.',
      priceFormatted: 'Rp 10.000',
      isPurchased: false,
      type: 'starter_pack',
    },
    {
      id: 'coin_pack_2500',
      title: 'Peti 2.500 Cincin Emas Pro',
      description: 'Bonus +500 koin ekstra! Buka semua stage & skin dengan cepat.',
      priceFormatted: 'Rp 25.000',
      isPurchased: false,
      type: 'starter_pack',
    },
    {
      id: 'coin_pack_10000',
      title: 'Brankas 10.000 Cincin VIP',
      description: 'Paket koin raksasa terbesar untuk pemain setia!',
      priceFormatted: 'Rp 75.000',
      isPurchased: false,
      type: 'starter_pack',
    },
    {
      id: 'starter_pack',
      title: 'Paket Starter Emas + Skin',
      description: 'Bonus 500 Cincin Emas + Skin Eksklusif Bola Emas.',
      priceFormatted: 'Rp 12.000',
      isPurchased: false,
      type: 'starter_pack',
    },
    {
      id: 'skin_gold',
      title: 'Skin Bola Emas Mewah',
      description: 'Bola emas berkilau dengan efek pantulan cahaya spesial.',
      priceFormatted: '150 Cincin',
      isPurchased: false,
      type: 'ball_skin',
    },
    {
      id: 'skin_ruby',
      title: 'Skin Bola Ruby Merah',
      description: 'Bola kristal merah permata menyala terang bernuansa magma.',
      priceFormatted: '100 Cincin',
      isPurchased: false,
      type: 'ball_skin',
    },
    {
      id: 'skin_cyan',
      title: 'Skin Bola Neon Cyan',
      description: 'Bola energi futuristik bersinar biru laser berkecepatan tinggi.',
      priceFormatted: '200 Cincin',
      isPurchased: false,
      type: 'ball_skin',
    },
    {
      id: 'skin_emerald',
      title: 'Skin Bola Jungle Emerald',
      description: 'Bola zamrud mistis berbalut sulur hutan purba.',
      priceFormatted: '250 Cincin',
      isPurchased: false,
      type: 'ball_skin',
    },
    {
      id: 'skin_obsidian',
      title: 'Skin Bola Obsidian Void',
      description: 'Bola hitam pekat legendaris dengan galaksi kosmik di dalamnya.',
      priceFormatted: '400 Cincin',
      isPurchased: false,
      type: 'ball_skin',
    },
    {
      id: 'trail_gold',
      title: 'Efek Jejak Gold Sparkles',
      description: 'Taburan kilau koin emas murni mengikuti setiap lompatan.',
      priceFormatted: '120 Cincin',
      isPurchased: false,
      type: 'trail_effect',
    },
    {
      id: 'trail_rainbow',
      title: 'Efek Jejak Rainbow Comet',
      description: 'Ekor komet warna-warni pelangi yang memukau.',
      priceFormatted: '300 Cincin',
      isPurchased: false,
      type: 'trail_effect',
    },
    {
      id: 'trail_emerald',
      title: 'Efek Jejak Emerald Dust',
      description: 'Debu sihir zamrud berkilauan di jalur guliran bola.',
      priceFormatted: '200 Cincin',
      isPurchased: false,
      type: 'trail_effect',
    },
  ];
}

export function saveShopItems(items: ShopItem[]): void {
  try {
    localStorage.setItem(STORAGE_SHOP_KEY, JSON.stringify(items));
  } catch {}
}
