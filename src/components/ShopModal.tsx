import React, { useState } from 'react';
import { I18nStrings } from '../game/i18n';
import {
  BALL_SKIN_META,
  BallSkinId,
  ShopItem,
  TRAIL_EFFECT_META,
  TrailEffectId,
} from '../services/shopService';
import { soundFX } from '../game/audio';
import {
  RingIcon,
  ArcadeIconTile,
  GoldCoin3DIcon,
  TreasureChest3DIcon,
  TrophyCrest3DIcon,
  EmeraldGem3DIcon,
  RedBall3DIcon,
  BestValueRibbon3DBadge,
  MostPopularShield3DBadge,
  NoAds3DIcon,
  StarterPack3DIcon,
} from './ArcadeIcons';

interface ShopModalProps {
  t: I18nStrings;
  items: ShopItem[];
  playerCoins: number;
  equippedSkin: BallSkinId;
  equippedTrail: TrailEffectId;
  onBuyItem: (item: ShopItem) => void;
  onEquipSkin: (skinId: BallSkinId) => void;
  onEquipTrail: (trailId: TrailEffectId) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  items,
  playerCoins,
  equippedSkin,
  equippedTrail,
  onBuyItem,
  onEquipSkin,
  onEquipTrail,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'skins' | 'coins'>('skins');

  const activeSkinMeta =
    BALL_SKIN_META[equippedSkin] || BALL_SKIN_META.default_red;
  const activeTrailMeta =
    TRAIL_EFFECT_META[equippedTrail] || TRAIL_EFFECT_META.default_red;

  const renderItemIcon = (id: string) => {
    if (id === 'remove_ads') {
      return (
        <ArcadeIconTile glowColor="red" className="w-13 h-13 sm:w-15 sm:h-15 shrink-0">
          <NoAds3DIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        </ArcadeIconTile>
      );
    }
    if (id === 'coin_pack_500') {
      return (
        <ArcadeIconTile glowColor="amber" className="w-13 h-13 sm:w-15 sm:h-15 shrink-0">
          <GoldCoin3DIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        </ArcadeIconTile>
      );
    }
    if (id === 'coin_pack_2500') {
      return (
        <ArcadeIconTile glowColor="amber" className="w-13 h-13 sm:w-15 sm:h-15 shrink-0">
          <TreasureChest3DIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        </ArcadeIconTile>
      );
    }
    if (id === 'coin_pack_10000') {
      return (
        <ArcadeIconTile glowColor="cyan" className="w-13 h-13 sm:w-15 sm:h-15 shrink-0">
          <TrophyCrest3DIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        </ArcadeIconTile>
      );
    }
    if (id === 'starter_pack') {
      return (
        <ArcadeIconTile glowColor="emerald" className="w-13 h-13 sm:w-15 sm:h-15 shrink-0">
          <StarterPack3DIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        </ArcadeIconTile>
      );
    }
    if (id in BALL_SKIN_META) {
      const sMeta = BALL_SKIN_META[id as BallSkinId];
      return (
        <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-slate-950 border border-white/15 flex items-center justify-center shrink-0">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full shadow-lg border border-white/30"
            style={{ background: sMeta.cssGradient }}
          />
        </div>
      );
    }
    if (id === 'trail_gold') {
      return (
        <ArcadeIconTile glowColor="amber" className="w-13 h-13 sm:w-15 sm:h-15 shrink-0">
          <GoldCoin3DIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        </ArcadeIconTile>
      );
    }
    if (id === 'trail_rainbow') {
      return (
        <ArcadeIconTile glowColor="cyan" className="w-13 h-13 sm:w-15 sm:h-15 shrink-0">
          <EmeraldGem3DIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        </ArcadeIconTile>
      );
    }
    if (id === 'trail_emerald') {
      return (
        <ArcadeIconTile glowColor="emerald" className="w-13 h-13 sm:w-15 sm:h-15 shrink-0">
          <EmeraldGem3DIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        </ArcadeIconTile>
      );
    }
    return (
      <ArcadeIconTile glowColor="purple" className="w-13 h-13 sm:w-15 sm:h-15 shrink-0">
        <RedBall3DIcon className="w-8 h-8 sm:w-9 sm:h-9" />
      </ArcadeIconTile>
    );
  };

  const renderItemBadge = (id: string) => {
    if (id === 'coin_pack_2500') {
      return <BestValueRibbon3DBadge className="w-8 h-8 shrink-0 filter drop-shadow" />;
    }
    if (id === 'coin_pack_10000') {
      return <MostPopularShield3DBadge className="w-8 h-8 shrink-0 filter drop-shadow" />;
    }
    if (id === 'starter_pack') {
      return (
        <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shrink-0">
          SPECIAL OFFER
        </span>
      );
    }
    return null;
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'coins') return item.type === 'starter_pack' || item.type === 'remove_ads';
    if (filter === 'skins') return item.type === 'ball_skin' || item.type === 'trail_effect';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-3xl border-2 border-amber-400/50 bg-slate-950/95 p-4 sm:p-6 shadow-[0_0_35px_rgba(251,191,36,0.22)] flex flex-col max-h-[92vh] modal-juice-pop">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ArcadeIconTile glowColor="amber" className="w-11 h-11 sm:w-12 sm:h-12 shrink-0">
              <TreasureChest3DIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </ArcadeIconTile>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent uppercase">
                Toko & Kustomisasi Bola 3D
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold">
                Pilih & pasang Skin Bola 3D serta Efek Jejak lompatan favoritmu!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black tabular-nums flex items-center gap-1.5 shadow-sm">
              <RingIcon className="w-4 h-4" />
              <span>{playerCoins}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live 3D Ball & Trail Customization Showcase Bar */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-900/90 border border-amber-400/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center shrink-0">
              {/* Trail preview dots */}
              <span
                className="w-2.5 h-2.5 rounded-full opacity-55 -mr-1"
                style={{
                  backgroundColor:
                    equippedTrail === 'trail_gold'
                      ? '#facc15'
                      : equippedTrail === 'trail_rainbow'
                      ? '#38bdf8'
                      : equippedTrail === 'trail_emerald'
                      ? '#10b981'
                      : '#ef4444',
                }}
              />
              {/* Active 3D Glossy Sphere */}
              <div
                className="w-7 h-7 rounded-full border border-white/30 shadow-md animate-bounce"
                style={{ background: activeSkinMeta.cssGradient }}
              />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Kustomisasi Aktif Saat Ini
              </div>
              <div className="text-xs font-extrabold text-white">
                {activeSkinMeta.nameId} · {activeTrailMeta.nameId}
              </div>
            </div>
          </div>

          {(equippedSkin !== 'default_red' || equippedTrail !== 'default_red') && (
            <button
              type="button"
              onClick={() => {
                soundFX.playCheckpoint();
                onEquipSkin('default_red');
                onEquipTrail('default_red');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-[11px] font-bold text-slate-200 cursor-pointer transition whitespace-nowrap"
            >
              Reset ke Merah Klasik
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 mt-3 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setFilter('skins')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
              filter === 'skins'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎨 Skin & Jejak 3D
          </button>
          <button
            type="button"
            onClick={() => setFilter('coins')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
              filter === 'coins'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🪙 Paket Cincin
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Item
          </button>
        </div>

        {/* Shop Items List */}
        <div className="py-3.5 space-y-2.5 overflow-y-auto flex-1 pr-1">
          {filteredItems.map((item) => {
            const isBallSkin = item.type === 'ball_skin';
            const isTrail = item.type === 'trail_effect';
            const isCurrentlyEquipped =
              (isBallSkin && equippedSkin === item.id) ||
              (isTrail && equippedTrail === item.id);

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 relative transition shadow-sm ${
                  isCurrentlyEquipped
                    ? 'bg-amber-500/10 border-amber-400/60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-amber-400/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderItemIcon(item.id)}
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-white truncate">
                        {item.title}
                      </h4>
                      {renderItemBadge(item.id)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.isPurchased ? (
                  isBallSkin || isTrail ? (
                    isCurrentlyEquipped ? (
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playCheckpoint();
                          if (isBallSkin) onEquipSkin('default_red');
                          if (isTrail) onEquipTrail('default_red');
                        }}
                        className="px-4 py-3 rounded-2xl bg-emerald-500 font-black text-slate-950 shadow-[0_4px_0_rgb(5,150,105)] hover:scale-105 active:scale-95 transition text-xs whitespace-nowrap shrink-0 cursor-pointer"
                        title="Klik untuk melepas kembali ke standar"
                      >
                        ✓ Terpasang
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playRingCollect();
                          if (isBallSkin) onEquipSkin(item.id as BallSkinId);
                          if (isTrail) onEquipTrail(item.id as TrailEffectId);
                        }}
                        className="px-4 py-3 rounded-2xl bg-amber-500 font-black text-slate-950 shadow-[0_4px_0_rgb(180,83,9)] hover:scale-105 active:scale-95 transition text-xs whitespace-nowrap shrink-0 cursor-pointer uppercase"
                      >
                        Pasang
                      </button>
                    )
                  ) : (
                    <span className="px-4 py-3 rounded-2xl bg-emerald-500 font-black text-slate-950 shadow-[0_4px_0_rgb(5,150,105)] text-xs whitespace-nowrap shrink-0">
                      ✓ Aktif
                    </span>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playRingCollect();
                      onBuyItem(item);
                    }}
                    className="px-4 py-3 rounded-2xl bg-sky-500 font-black text-white shadow-[0_4px_0_rgb(2,132,199)] hover:scale-105 active:scale-95 transition text-xs tracking-wider cursor-pointer whitespace-nowrap uppercase shrink-0"
                  >
                    {item.priceFormatted}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

