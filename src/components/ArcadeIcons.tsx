import React from 'react';

// Enhanced High-End 3D Arcade Tile Wrapper (Matching AAA Arcade Mobile Games)
export const ArcadeIconTile: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}> = ({ children, className = "w-16 h-16 sm:w-20 sm:h-20", glowColor = "emerald" }) => {
  return (
    <div
      className={`relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-800 via-slate-900 to-teal-950 p-2 sm:p-2.5 border-2 border-teal-400/60 shadow-[0_8px_24px_rgba(0,0,0,0.65),inset_0_2px_4px_rgba(255,255,255,0.3)] flex items-center justify-center overflow-hidden group hover:scale-108 transition-all duration-200 ${className}`}
    >
      {/* Background Radial Glow */}
      <div
        className={`absolute inset-0 bg-radial ${
          glowColor === 'amber'
            ? 'from-amber-400/35 via-amber-500/15'
            : glowColor === 'emerald'
            ? 'from-emerald-400/35 via-emerald-500/15'
            : glowColor === 'red'
            ? 'from-red-400/35 via-red-500/15'
            : 'from-cyan-400/35 via-cyan-500/15'
        } to-transparent pointer-events-none`}
      />
      {/* Top Glass Lens Reflection */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none rounded-t-2xl" />
      {/* Bottom Bevel Shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none rounded-b-2xl" />
      {/* Icon Content with 3D Relief Drop Shadow */}
      <div className="relative z-10 w-full h-full flex items-center justify-center filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)] transform group-hover:translate-y-[-2px] transition-transform">
        {children}
      </div>
    </div>
  );
};

// 1. Faceted 3D Gold Ring Hoop Icon (Cincin Emas)
export const GoldRing3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ringGold3D" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="25%" stopColor="#f59e0b" />
        <stop offset="65%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </radialGradient>
      <linearGradient id="ringInnerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="40" fill="none" stroke="url(#ringGold3D)" strokeWidth="18" />
    <circle cx="50" cy="50" r="30" fill="none" stroke="url(#ringInnerGlow)" strokeWidth="3" opacity="0.95" />
    <circle cx="50" cy="50" r="49" fill="none" stroke="#fef08a" strokeWidth="2.5" opacity="0.9" />
    <ellipse cx="32" cy="24" rx="6" ry="3.5" fill="#ffffff" opacity="0.95" transform="rotate(-30 32 24)" />
    <circle cx="24" cy="38" r="2.5" fill="#ffffff" opacity="0.85" />
    <circle cx="70" cy="72" r="2" fill="#fef08a" opacity="0.9" />
  </svg>
);

// 2. Isometric 3D Stage Map Icon (Game Stage)
export const StageMap3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M50 12 L92 33 L50 54 L8 33 Z" fill="#22c55e" stroke="#bbf7d0" strokeWidth="3.5" />
    <path d="M8 33 L50 54 L50 85 L8 64 Z" fill="#15803d" stroke="#166534" strokeWidth="2" />
    <path d="M50 54 L92 33 L92 64 L50 85 Z" fill="#166534" stroke="#14532d" strokeWidth="2" />
    <path d="M28 33 L45 42 L65 33" stroke="#fde047" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="36" y="20" width="12" height="14" rx="2.5" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
    <rect x="62" y="30" width="12" height="14" rx="2.5" fill="#f97316" stroke="#78350f" strokeWidth="2" />
  </svg>
);

// 3. 3D Stopwatch Timer Icon (Stopwatch)
export const Stopwatch3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="stopwatchRim" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#334155" />
      </radialGradient>
      <radialGradient id="stopwatchDial" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#f0fdf4" />
        <stop offset="100%" stopColor="#6ee7b7" />
      </radialGradient>
    </defs>
    <rect x="43" y="6" width="14" height="12" rx="3" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
    <rect x="39" y="2" width="22" height="6" rx="2" fill="#f8fafc" />
    <circle cx="50" cy="56" r="40" fill="url(#stopwatchRim)" stroke="#f8fafc" strokeWidth="3.5" />
    <circle cx="50" cy="56" r="31" fill="url(#stopwatchDial)" stroke="#059669" strokeWidth="3" />
    <line x1="50" y1="28" x2="50" y2="35" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="78" y1="56" x2="71" y2="56" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="50" y1="56" x2="50" y2="36" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
    <line x1="50" y1="56" x2="66" y2="44" stroke="#0f766e" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="50" cy="56" r="5" fill="#0f766e" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

// 4. Embossed 3D Gold Coin Stack Icon (Koin Emas)
export const GoldCoin3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="72" rx="40" ry="17" fill="#78350f" />
    <ellipse cx="50" cy="63" rx="40" ry="17" fill="url(#goldCoinGrad)" stroke="#fef08a" strokeWidth="2.5" />
    <ellipse cx="50" cy="49" rx="40" ry="17" fill="#78350f" />
    <ellipse cx="50" cy="40" rx="40" ry="17" fill="url(#goldCoinGrad)" stroke="#fef08a" strokeWidth="2.5" />
    <ellipse cx="50" cy="26" rx="40" ry="17" fill="url(#goldCoinGrad)" stroke="#fde047" strokeWidth="3.5" />
    <ellipse cx="50" cy="26" rx="30" ry="12" fill="none" stroke="#fef08a" strokeWidth="2" />
    <text x="50" y="33" textAnchor="middle" fill="#78350f" fontSize="20" fontWeight="900">C</text>
  </svg>
);

// 5. 3D Treasure Chest Icon (Peti Harta)
export const TreasureChest3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 44h76v42a6 6 0 01-6 6H18a6 6 0 01-6-6V44z" fill="#78350f" stroke="#eab308" strokeWidth="3.5" />
    <path d="M8 38a22 22 0 0122-22h40a22 22 0 0122 22v8H8v-8z" fill="#b45309" stroke="#fef08a" strokeWidth="3.5" />
    <rect x="24" y="16" width="12" height="70" fill="#eab308" stroke="#78350f" strokeWidth="1.5" />
    <rect x="64" y="16" width="12" height="70" fill="#eab308" stroke="#78350f" strokeWidth="1.5" />
    <rect x="40" y="40" width="20" height="24" rx="4" fill="#fde047" stroke="#78350f" strokeWidth="2.5" />
    <circle cx="50" cy="50" r="4" fill="#78350f" />
  </svg>
);

// 6. 3D Faceted Emerald Gem Icon (Gemstone)
export const EmeraldGem3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M28 12 L72 12 L94 38 L50 94 L6 38 Z" fill="#10b981" stroke="#a7f3d0" strokeWidth="3.5" />
    <path d="M28 12 L50 38 L72 12 M50 38 L50 94 M6 38 L50 38 L94 38" stroke="#d1fae5" strokeWidth="2.5" />
    <polygon points="50,12 28,12 6,38 50,38" fill="#34d399" opacity="0.6" />
  </svg>
);

// 7. 3D Metallic Trophy Crest Icon (Piala / TrophyCrest3DIcon)
export const TrophyCrest3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M28 16 h44 v32 a22 22 0 0 1 -44 0 Z" fill="#eab308" stroke="#fef08a" strokeWidth="3.5" />
    <path d="M50 48 v22 M32 70 h36 M20 82 h60" stroke="#fde047" strokeWidth="5" strokeLinecap="round" />
    <path d="M28 22 h-14 a9 9 0 0 0 -9 9 v10 a9 9 0 0 0 9 9 h14" stroke="#eab308" strokeWidth="4" fill="none" />
    <path d="M72 22 h14 a9 9 0 0 1 9 9 v10 a9 9 0 0 1 -9 9 h-14" stroke="#eab308" strokeWidth="4" fill="none" />
    <polygon points="50,22 53,29 60,30 55,35 56,42 50,38 44,42 45,35 40,30 47,29" fill="#ffffff" />
  </svg>
);

// 8. 3D Leaderboard Bar Chart Icon (Papanboard)
export const LeaderboardBar3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
      <linearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
      <linearGradient id="barGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>
    </defs>
    <rect x="15" y="46" width="20" height="42" rx="5" fill="url(#barGrad1)" stroke="#fef08a" strokeWidth="2.5" />
    <rect x="40" y="18" width="20" height="70" rx="5" fill="url(#barGrad2)" stroke="#bbf7d0" strokeWidth="2.5" />
    <rect x="65" y="32" width="20" height="56" rx="5" fill="url(#barGrad3)" stroke="#fecdd3" strokeWidth="2.5" />
  </svg>
);

// 9. 3D Golden Share Nodes Icon (Share)
export const ShareNodes3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <line x1="28" y1="50" x2="72" y2="26" stroke="#fde047" strokeWidth="10" strokeLinecap="round" />
    <line x1="28" y1="50" x2="72" y2="74" stroke="#fde047" strokeWidth="10" strokeLinecap="round" />
    <circle cx="28" cy="50" r="16" fill="#f59e0b" stroke="#fef08a" strokeWidth="4.5" />
    <circle cx="72" cy="26" r="16" fill="#f59e0b" stroke="#fef08a" strokeWidth="4.5" />
    <circle cx="72" cy="74" r="16" fill="#f59e0b" stroke="#fef08a" strokeWidth="4.5" />
  </svg>
);

// 10. 3D Golden Shopping Cart Icon (Toko)
export const ShoppingCart3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 18 H28 L38 62 H80 L90 28 H32" fill="none" stroke="#f59e0b" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="42" cy="78" r="8" fill="#fef08a" stroke="#78350f" strokeWidth="3.5" />
    <circle cx="74" cy="78" r="8" fill="#fef08a" stroke="#78350f" strokeWidth="3.5" />
  </svg>
);

// 11. 3D Wheel of Fortune Icon (Roda Spin)
export const FortuneWheel3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="44" fill="#78350f" stroke="#fef08a" strokeWidth="4.5" />
    <path d="M50 50 L50 6 A44 44 0 0 1 94 50 Z" fill="#ef4444" />
    <path d="M50 50 L94 50 A44 44 0 0 1 50 94 Z" fill="#22c55e" />
    <path d="M50 50 L50 94 A44 44 0 0 1 6 50 Z" fill="#3b82f6" />
    <path d="M50 50 L6 50 A44 44 0 0 1 50 6 Z" fill="#eab308" />
    <circle cx="50" cy="50" r="14" fill="#fde047" stroke="#78350f" strokeWidth="3.5" />
    <path d="M50 0 L58 12 L42 12 Z" fill="#ffffff" stroke="#78350f" strokeWidth="2" />
  </svg>
);

// 12. Parchment Scroll with Stars Icon (Daily Missions)
export const ScrollMissions3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="18" width="60" height="64" rx="8" fill="#fef3c7" stroke="#d97706" strokeWidth="3.5" />
    <ellipse cx="50" cy="18" rx="32" ry="8" fill="#fde047" stroke="#b45309" strokeWidth="3.5" />
    <ellipse cx="50" cy="82" rx="32" ry="8" fill="#fde047" stroke="#b45309" strokeWidth="3.5" />
    <polygon points="50,30 55,40 66,41 58,48 60,59 50,53 40,59 42,48 34,41 45,40" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
    <polygon points="38,62 40,67 46,68 41,72 43,78 38,75 33,78 35,72 30,68 36,67" fill="#eab308" />
    <polygon points="62,62 64,67 70,68 65,72 67,78 62,75 57,78 59,72 54,68 60,67" fill="#eab308" />
  </svg>
);

// 13. 3D Best Value Star Badge (Best Value)
export const BestValueRibbon3DBadge: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,6 64,22 84,16 84,36 98,50 84,64 84,84 64,78 50,94 36,78 16,84 16,64 2,50 16,36 16,16 36,22" fill="#f59e0b" stroke="#fef08a" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="26" fill="#b45309" stroke="#fef08a" strokeWidth="2.5" />
    <text x="50" y="46" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="900">BEST</text>
    <text x="50" y="58" textAnchor="middle" fill="#fde047" fontSize="10" fontWeight="900">VALUE</text>
  </svg>
);

// 14. 3D Most Popular Shield Ribbon Badge (Most Popular)
export const MostPopularShield3DBadge: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M50 8 L88 24 V56 C88 78 50 94 50 94 C50 94 12 78 12 56 V24 Z" fill="#dc2626" stroke="#fef08a" strokeWidth="4.5" />
    <rect x="10" y="40" width="80" height="24" rx="5" fill="#b91c1c" stroke="#fde047" strokeWidth="2.5" />
    <text x="50" y="51" textAnchor="middle" fill="#fef08a" fontSize="9" fontWeight="900">MOST</text>
    <text x="50" y="60" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="900">POPULAR</text>
  </svg>
);

// 15. Glossy 3D Crimson Red Ball Icon
export const RedBall3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="redSphere3D" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="20%" stopColor="#ef4444" />
        <stop offset="65%" stopColor="#b91c1c" />
        <stop offset="100%" stopColor="#450a0a" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#redSphere3D)" />
    <ellipse cx="36" cy="28" rx="18" ry="10" fill="#ffffff" opacity="0.8" transform="rotate(-25 36 28)" />
    <circle cx="28" cy="22" r="3.5" fill="#ffffff" opacity="0.95" />
  </svg>
);

// 16. 3D Golden Padlock Shield Icon
export const LockShield3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M50 8 L88 24 V52 C88 78 50 94 50 94 C50 94 12 78 12 52 V24 Z" fill="#1e3a8a" stroke="#eab308" strokeWidth="4.5" />
    <rect x="34" y="44" width="32" height="26" rx="5" fill="#fde047" stroke="#78350f" strokeWidth="2.5" />
    <path d="M40 44 V34 A10 10 0 0 1 60 34 V44" fill="none" stroke="#fef08a" strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="50" cy="55" r="3.5" fill="#78350f" />
  </svg>
);

// 17. 3D Metallic Golden Gear Icon (Pengaturan / Settings)
export const Settings3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15 L56 22 H66 L70 30 L80 32 L80 42 L88 48 L84 58 L88 68 L78 72 L72 80 L62 80 L56 88 H44 L38 80 H28 L24 72 L14 68 L18 58 L12 48 L20 42 L20 32 L30 30 L34 22 H44 Z" fill="#d97706" stroke="#fef08a" strokeWidth="4" strokeLinejoin="round" />
    <circle cx="50" cy="50" r="28" fill="#f59e0b" stroke="#fde047" strokeWidth="3" />
    <circle cx="50" cy="50" r="14" fill="#78350f" stroke="#fef08a" strokeWidth="2" />
  </svg>
);

// 18. 3D Starter Pack Bundle Icon (Paket Starter)
export const StarterPack3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Coins */}
    <circle cx="35" cy="40" r="20" fill="#f59e0b" stroke="#fef08a" strokeWidth="3" />
    <text x="35" y="47" textAnchor="middle" fill="#78350f" fontSize="16" fontWeight="900">C</text>
    {/* Emerald Gem */}
    <path d="M55 20 L75 20 L85 36 L65 65 L45 36 Z" fill="#10b981" stroke="#a7f3d0" strokeWidth="2.5" />
    {/* Red Sphere */}
    <circle cx="68" cy="62" r="18" fill="#ef4444" stroke="#fef08a" strokeWidth="2.5" />
    <circle cx="62" cy="54" r="3" fill="#ffffff" opacity="0.8" />
    {/* Starter Ribbon */}
    <rect x="15" y="72" width="70" height="20" rx="4" fill="#dc2626" stroke="#fde047" strokeWidth="2" />
    <text x="50" y="86" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="900">STARTER</text>
  </svg>
);

// 19. 3D No Ads Prohibited Icon (Hapus Iklan)
export const NoAds3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="26" width="68" height="48" rx="8" fill="#1e293b" stroke="#fef08a" strokeWidth="3" />
    <text x="50" y="56" textAnchor="middle" fill="#fde047" fontSize="18" fontWeight="900">PLAY</text>
    {/* Red Prohibited Slash Circle */}
    <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="10" />
    <line x1="24" y1="24" x2="76" y2="76" stroke="#ef4444" strokeWidth="10" />
  </svg>
);

// 20. 3D Podium Champion Stage Complete Icon (Rookie Champion)
export const PodiumChampion3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Podium Base */}
    <rect x="10" y="58" width="26" height="30" rx="3" fill="#64748b" stroke="#cbd5e1" strokeWidth="2" />
    <rect x="37" y="38" width="26" height="50" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
    <rect x="64" y="50" width="26" height="38" rx="3" fill="#0f766e" stroke="#2dd4bf" strokeWidth="2" />
    <text x="23" y="78" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">2</text>
    <text x="50" y="60" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900">1</text>
    <text x="77" y="74" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">3</text>
    {/* Red Ball on #1 */}
    <circle cx="50" cy="22" r="14" fill="#ef4444" stroke="#fef08a" strokeWidth="2.5" />
  </svg>
);

// 21. 3D Glossy Emerald Green Checkmark Badge
export const GreenCheckmark3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="80" height="80" rx="22" fill="#10b981" stroke="#a7f3d0" strokeWidth="5" />
    <path d="M28 50 L44 66 L74 32" fill="none" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 22. 3D Glowing Red Lock Icon for Locked Stages (Lock)
export const GlowingRedLock3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="44" fill="#7f1d1d" opacity="0.6" />
    <path d="M50 12 L85 28 V56 C85 78 50 92 50 92 C50 92 15 78 15 56 V28 Z" fill="#991b1b" stroke="#f87171" strokeWidth="4" />
    <rect x="36" y="46" width="28" height="24" rx="4" fill="#fde047" stroke="#78350f" strokeWidth="2" />
    <path d="M42 46 V36 A8 8 0 0 1 58 36 V46" fill="none" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
    <circle cx="50" cy="56" r="3" fill="#78350f" />
  </svg>
);

// 23. 3D Glossy Blue Play Arrow Icon (Play / Start)
export const PlayBlueArrow3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="playBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
    </defs>
    <path d="M25 15 L82 50 L25 85 Z" fill="url(#playBlueGrad)" stroke="#bae6fd" strokeWidth="5" strokeLinejoin="round" />
    <path d="M30 25 L70 50 L30 75 Z" fill="#0284c7" opacity="0.6" />
    <path d="M28 20 L55 38 L28 42 Z" fill="#ffffff" opacity="0.8" />
  </svg>
);

// 24. 3D Glossy Orange Double Bar Pause Icon (Pause)
export const PauseOrangeBar3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pauseOrangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="30%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#c2410c" />
      </linearGradient>
    </defs>
    <rect x="22" y="16" width="22" height="68" rx="7" fill="url(#pauseOrangeGrad)" stroke="#ffedd5" strokeWidth="4" />
    <rect x="56" y="16" width="22" height="68" rx="7" fill="url(#pauseOrangeGrad)" stroke="#ffedd5" strokeWidth="4" />
    <rect x="25" y="20" width="16" height="24" rx="3" fill="#ffffff" opacity="0.6" />
    <rect x="59" y="20" width="16" height="24" rx="3" fill="#ffffff" opacity="0.6" />
  </svg>
);

// 25. 3D Metallic Gear + Blue Wrench Icon (Settings)
export const SettingsGearWrench3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Silver Gear */}
    <path d="M50 12 L56 18 H66 L70 26 L80 28 L80 38 L88 44 L84 54 L88 64 L78 68 L72 76 L62 76 L56 84 H44 L38 76 H28 L24 68 L14 64 L18 54 L12 44 L20 38 L20 28 L30 26 L34 18 H44 Z" fill="#94a3b8" stroke="#f1f5f9" strokeWidth="3.5" strokeLinejoin="round" />
    <circle cx="50" cy="48" r="22" fill="#475569" stroke="#cbd5e1" strokeWidth="3" />
    <circle cx="50" cy="48" r="10" fill="#0f172a" />
    {/* Blue Wrench */}
    <path d="M20 78 L55 43 M48 36 C42 30 42 20 50 16 C56 14 62 18 64 24 M58 46 C64 52 74 52 78 44 C80 38 76 32 70 30" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" />
    <circle cx="20" cy="78" r="5" fill="#38bdf8" />
  </svg>
);

// 26. 3D Red Exit Door Icon (Quit)
export const QuitRedDoor3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="12" width="64" height="76" rx="8" fill="#7f1d1d" stroke="#f87171" strokeWidth="4" />
    <path d="M28 16 L74 24 V76 L28 84 Z" fill="#ef4444" stroke="#fca5a5" strokeWidth="3" />
    <circle cx="64" cy="52" r="4.5" fill="#fde047" stroke="#78350f" strokeWidth="2" />
  </svg>
);

// 27. 3D Orange Exit Door with Arrow Icon (Exit / Quit)
export const ExitOrangeDoor3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="28" y="14" width="56" height="72" rx="6" fill="#c2410c" stroke="#fed7aa" strokeWidth="3.5" />
    <path d="M38 18 L76 26 V74 L38 82 Z" fill="#f97316" stroke="#ffedd5" strokeWidth="2.5" />
    <circle cx="68" cy="50" r="4" fill="#fde047" />
    <path d="M12 50 H44 M32 38 L48 50 L32 62" stroke="#fde047" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 28. 3D Glossy Cyan Shield with Lightning Icon (Shield Power-Up)
export const ShieldBlue3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0c4a6e" />
      </linearGradient>
    </defs>
    <path d="M50 8 L88 24 V52 C88 76 50 92 50 92 C50 92 12 76 12 52 V24 Z" fill="url(#shieldCyanGrad)" stroke="#bae6fd" strokeWidth="4.5" />
    <path d="M50 16 L80 30 V50 C80 68 50 82 50 82 C50 82 20 68 20 50 V30 Z" fill="#0284c7" opacity="0.6" />
    {/* Lightning Bolt */}
    <polygon points="54,22 36,48 50,48 44,76 66,42 52,42" fill="#fde047" stroke="#78350f" strokeWidth="2" />
  </svg>
);

// 29. 3D Winged Gold Lightning Bolt Icon (Speed Boost Power-Up)
export const SpeedBoostLightning3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Wings */}
    <path d="M10 40 Q25 20 42 35 Q22 45 10 40 Z" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2" />
    <path d="M90 40 Q75 20 58 35 Q78 45 90 40 Z" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2" />
    {/* Lightning Bolt */}
    <polygon points="56,10 28,50 48,50 36,90 72,42 52,42" fill="#f59e0b" stroke="#fef08a" strokeWidth="3.5" />
    <polygon points="54,16 32,48 48,48 40,80 64,44 50,44" fill="#fde047" />
  </svg>
);

// 30. 3D Red/Blue Horseshoe Magnet Icon (Magnetic Power-Up)
export const MagnetRedBlue3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M22 20 V50 A28 28 0 0 0 78 50 V20 H58 V50 A8 8 0 0 1 42 50 V20 Z" fill="#ef4444" stroke="#fef08a" strokeWidth="3.5" />
    <rect x="20" y="14" width="20" height="16" fill="#0284c7" stroke="#bae6fd" strokeWidth="2" />
    <rect x="60" y="14" width="20" height="16" fill="#0284c7" stroke="#bae6fd" strokeWidth="2" />
  </svg>
);

// 31. 3D Metallic Spring Coil Icon (Jump Boost / Spring)
export const SpringCoilJump3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="18" rx="30" ry="8" fill="#eab308" stroke="#78350f" strokeWidth="3" />
    <ellipse cx="50" cy="82" rx="30" ry="8" fill="#eab308" stroke="#78350f" strokeWidth="3" />
    <path d="M22 28 C22 22 78 22 78 34 C78 46 22 40 22 52 C22 64 78 58 78 70 C78 80 22 76 22 82" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
    <path d="M22 28 C22 22 78 22 78 34 C78 46 22 40 22 52 C22 64 78 58 78 70 C78 80 22 76 22 82" fill="none" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 32. 3D Glossy Crimson Heart Icon (Extra Life)
export const ExtraLifeHeart3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="heartRed3D" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="30%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </radialGradient>
    </defs>
    <path d="M50 88 C20 65 8 48 8 32 A22 22 0 0 1 50 20 A22 22 0 0 1 92 32 C92 48 80 65 50 88 Z" fill="url(#heartRed3D)" stroke="#fecdd3" strokeWidth="4" />
    <ellipse cx="32" cy="28" rx="10" ry="5" fill="#ffffff" opacity="0.8" transform="rotate(-25 32 28)" />
  </svg>
);

// 33. 3D Classic Mode Group Icon (Classic Mode)
export const ClassicModeGroup3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* 3 Blue Avatar Figures */}
    <circle cx="50" cy="30" r="14" fill="#0284c7" stroke="#bae6fd" strokeWidth="2.5" />
    <path d="M28 72 C28 54 72 54 72 72 Z" fill="#0369a1" stroke="#bae6fd" strokeWidth="2.5" />
    <circle cx="28" cy="38" r="10" fill="#0f766e" stroke="#99f6e4" strokeWidth="2" />
    <path d="M12 76 C12 62 44 62 44 76 Z" fill="#115e59" />
    <circle cx="72" cy="38" r="10" fill="#0f766e" stroke="#99f6e4" strokeWidth="2" />
    <path d="M56 76 C56 62 88 62 88 76 Z" fill="#115e59" />
  </svg>
);

// 34. 3D Time Attack Clock Circle Icon (Time Attack)
export const TimeAttackClock3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="42" fill="#d97706" stroke="#fef08a" strokeWidth="4.5" />
    <circle cx="50" cy="50" r="30" fill="#78350f" stroke="#fde047" strokeWidth="3" />
    <line x1="50" y1="50" x2="50" y2="30" stroke="#fde047" strokeWidth="5" strokeLinecap="round" />
    <line x1="50" y1="50" x2="68" y2="50" stroke="#fde047" strokeWidth="5" strokeLinecap="round" />
    <circle cx="50" cy="50" r="5" fill="#fde047" />
  </svg>
);

// 35. 3D Endless Trophy Icon (Endless Mode)
export const EndlessTrophy3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M30 16 H70 V44 A20 20 0 0 1 30 44 Z" fill="#eab308" stroke="#fef08a" strokeWidth="3.5" />
    <path d="M50 44 V68 M34 68 H66 M24 82 H76" stroke="#fde047" strokeWidth="5" strokeLinecap="round" />
    <path d="M22 22 H12 A8 8 0 0 0 4 30 V38 A8 8 0 0 0 12 46 H22" stroke="#eab308" strokeWidth="4" fill="none" />
    <path d="M78 22 H88 A8 8 0 0 1 96 30 V38 A8 8 0 0 1 88 46 H78" stroke="#eab308" strokeWidth="4" fill="none" />
  </svg>
);

// 36. 3D Multiplayer Group Icon (Multiplayer)
export const MultiplayerGroup3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="34" cy="32" r="12" fill="#0284c7" stroke="#bae6fd" strokeWidth="2" />
    <path d="M14 74 C14 56 54 56 54 74 Z" fill="#0369a1" />
    <circle cx="66" cy="32" r="12" fill="#16a34a" stroke="#bbf7d0" strokeWidth="2" />
    <path d="M46 74 C46 56 86 56 86 74 Z" fill="#15803d" />
    <circle cx="50" cy="44" r="12" fill="#dc2626" stroke="#fecdd3" strokeWidth="2" />
    <path d="M30 84 C30 68 70 68 70 84 Z" fill="#b91c1c" />
  </svg>
);

// 37. 3D Next Level Golden Arrow Icon (Next Level)
export const NextLevelArrow3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 50 A30 30 0 1 1 74 62" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" />
    <polygon points="70,42 90,64 62,72" fill="#fde047" stroke="#78350f" strokeWidth="2" />
  </svg>
);

// 38. 3D Retry Blue Arrow Icon (Retry)
export const RetryBlueArrow3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M80 50 A30 30 0 1 1 26 38" fill="none" stroke="#0284c7" strokeWidth="12" strokeLinecap="round" />
    <polygon points="30,58 10,36 38,28" fill="#38bdf8" stroke="#0369a1" strokeWidth="2" />
  </svg>
);

// 39. 3D Quit Level Red Arrow Icon (Quit Level)
export const QuitLevelRedArrow3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M80 50 A30 30 0 1 1 26 38" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />
    <polygon points="30,58 10,36 38,28" fill="#fca5a5" stroke="#7f1d1d" strokeWidth="2" />
  </svg>
);

// 40. 3D Share Golden Curved Arrow Icon (Share)
export const ShareCurvedArrow3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M18 78 C24 45 42 32 70 32 V16 L92 42 L70 68 V52 C48 52 30 60 18 78 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="3.5" strokeLinejoin="round" />
  </svg>
);

// 41. 3D Help Question Mark Icon (Help)
export const HelpQuestion3DIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <text x="50" y="70" textAnchor="middle" fill="#f59e0b" fontSize="68" fontWeight="900" stroke="#fef08a" strokeWidth="3">?</text>
  </svg>
);

// Compatible Aliases
export const RingIcon = GoldRing3DIcon;
export const SpinIcon = FortuneWheel3DIcon;
export const ShopIcon = ShoppingCart3DIcon;
export const MissionIcon = ScrollMissions3DIcon;
export const TrophyIcon = TrophyCrest3DIcon;
export const MedalIcon = GoldCoin3DIcon;
export const LeaderboardIcon = LeaderboardBar3DIcon;
export const ShareIcon = ShareCurvedArrow3DIcon;

