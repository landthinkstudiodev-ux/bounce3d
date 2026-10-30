import React from 'react';
import {
  ArcadeIconTile,
  GoldRing3DIcon,
  StageMap3DIcon,
  Stopwatch3DIcon,
  GoldCoin3DIcon,
  TreasureChest3DIcon,
  EmeraldGem3DIcon,
  TrophyCrest3DIcon,
  LeaderboardBar3DIcon,
  ShareNodes3DIcon,
  ShoppingCart3DIcon,
  FortuneWheel3DIcon,
  ScrollMissions3DIcon,
  BestValueRibbon3DBadge,
  MostPopularShield3DBadge,
  RedBall3DIcon,
  LockShield3DIcon,
  Settings3DIcon,
  StarterPack3DIcon,
  NoAds3DIcon,
  PodiumChampion3DIcon,
  GreenCheckmark3DIcon,
  GlowingRedLock3DIcon,
  PlayBlueArrow3DIcon,
  PauseOrangeBar3DIcon,
  SettingsGearWrench3DIcon,
  QuitRedDoor3DIcon,
  ExitOrangeDoor3DIcon,
  ShieldBlue3DIcon,
  SpeedBoostLightning3DIcon,
  MagnetRedBlue3DIcon,
  SpringCoilJump3DIcon,
  ExtraLifeHeart3DIcon,
  ClassicModeGroup3DIcon,
  TimeAttackClock3DIcon,
  EndlessTrophy3DIcon,
  MultiplayerGroup3DIcon,
  NextLevelArrow3DIcon,
  RetryBlueArrow3DIcon,
  QuitLevelRedArrow3DIcon,
  ShareCurvedArrow3DIcon,
  HelpQuestion3DIcon,
} from './ArcadeIcons';

export type ArcadeIconKey =
  | 'trophy'
  | 'achievements'
  | 'ring'
  | 'cincin'
  | 'shop'
  | 'toko'
  | 'mission'
  | 'misi'
  | 'spin'
  | 'roda'
  | 'share'
  | 'bagikan'
  | 'leaderboard'
  | 'papanskor'
  | 'settings'
  | 'pengaturan'
  | 'stage'
  | 'babak'
  | 'stopwatch'
  | 'speedrun'
  | 'coin'
  | 'koin'
  | 'chest'
  | 'peti'
  | 'gem'
  | 'zamrud'
  | 'no_ads'
  | 'hapus_iklan'
  | 'starter_pack'
  | 'lock'
  | 'terkunci'
  | 'checkmark'
  | 'selesai'
  | 'ball'
  | 'skin_bola'
  | 'best_value'
  | 'most_popular'
  | 'podium'
  | 'champion'
  | 'play'
  | 'pause'
  | 'quit'
  | 'exit'
  | 'shield'
  | 'speed_boost'
  | 'magnet'
  | 'spring'
  | 'extra_life'
  | 'classic'
  | 'time_attack'
  | 'endless'
  | 'multiplayer'
  | 'next_level'
  | 'retry'
  | 'help';

export interface ArcadeAssetIconProps {
  iconKey: ArcadeIconKey;
  className?: string;
  withTile?: boolean;
  glowColor?: 'amber' | 'emerald' | 'red' | 'cyan';
  tileSize?: string;
}

export const ArcadeAssetIcon: React.FC<ArcadeAssetIconProps> = ({
  iconKey,
  className = 'w-6 h-6',
  withTile = false,
  glowColor = 'amber',
  tileSize = 'w-12 h-12 sm:w-14 sm:h-14',
}) => {
  const renderIcon = () => {
    switch (iconKey) {
      case 'trophy':
      case 'achievements':
        return <TrophyCrest3DIcon className={className} />;
      case 'ring':
      case 'cincin':
        return <GoldRing3DIcon className={className} />;
      case 'shop':
      case 'toko':
        return <ShoppingCart3DIcon className={className} />;
      case 'mission':
      case 'misi':
        return <ScrollMissions3DIcon className={className} />;
      case 'spin':
      case 'roda':
        return <FortuneWheel3DIcon className={className} />;
      case 'share':
      case 'bagikan':
        return <ShareCurvedArrow3DIcon className={className} />;
      case 'leaderboard':
      case 'papanskor':
        return <LeaderboardBar3DIcon className={className} />;
      case 'settings':
      case 'pengaturan':
        return <SettingsGearWrench3DIcon className={className} />;
      case 'stage':
      case 'babak':
        return <StageMap3DIcon className={className} />;
      case 'stopwatch':
      case 'speedrun':
        return <Stopwatch3DIcon className={className} />;
      case 'coin':
      case 'koin':
        return <GoldCoin3DIcon className={className} />;
      case 'chest':
      case 'peti':
        return <TreasureChest3DIcon className={className} />;
      case 'gem':
      case 'zamrud':
        return <EmeraldGem3DIcon className={className} />;
      case 'no_ads':
      case 'hapus_iklan':
        return <NoAds3DIcon className={className} />;
      case 'starter_pack':
        return <StarterPack3DIcon className={className} />;
      case 'lock':
      case 'terkunci':
        return <GlowingRedLock3DIcon className={className} />;
      case 'checkmark':
      case 'selesai':
        return <GreenCheckmark3DIcon className={className} />;
      case 'ball':
      case 'skin_bola':
        return <RedBall3DIcon className={className} />;
      case 'best_value':
        return <BestValueRibbon3DBadge className={className} />;
      case 'most_popular':
        return <MostPopularShield3DBadge className={className} />;
      case 'podium':
      case 'champion':
        return <PodiumChampion3DIcon className={className} />;
      case 'play':
        return <PlayBlueArrow3DIcon className={className} />;
      case 'pause':
        return <PauseOrangeBar3DIcon className={className} />;
      case 'quit':
        return <QuitRedDoor3DIcon className={className} />;
      case 'exit':
        return <ExitOrangeDoor3DIcon className={className} />;
      case 'shield':
        return <ShieldBlue3DIcon className={className} />;
      case 'speed_boost':
        return <SpeedBoostLightning3DIcon className={className} />;
      case 'magnet':
        return <MagnetRedBlue3DIcon className={className} />;
      case 'spring':
        return <SpringCoilJump3DIcon className={className} />;
      case 'extra_life':
        return <ExtraLifeHeart3DIcon className={className} />;
      case 'classic':
        return <ClassicModeGroup3DIcon className={className} />;
      case 'time_attack':
        return <TimeAttackClock3DIcon className={className} />;
      case 'endless':
        return <EndlessTrophy3DIcon className={className} />;
      case 'multiplayer':
        return <MultiplayerGroup3DIcon className={className} />;
      case 'next_level':
        return <NextLevelArrow3DIcon className={className} />;
      case 'retry':
        return <RetryBlueArrow3DIcon className={className} />;
      case 'help':
        return <HelpQuestion3DIcon className={className} />;
      default:
        return <EmeraldGem3DIcon className={className} />;
    }
  };

  if (withTile) {
    return (
      <ArcadeIconTile glowColor={glowColor} className={`shrink-0 ${tileSize}`}>
        {renderIcon()}
      </ArcadeIconTile>
    );
  }

  return renderIcon();
};

export interface ArcadeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconKey: ArcadeIconKey;
  label?: string;
  badgeCount?: number;
  badgePing?: boolean;
  variant?: 'amber' | 'green' | 'purple' | 'sky' | 'slate';
  iconClassName?: string;
}

export const ArcadeButton: React.FC<ArcadeButtonProps> = ({
  iconKey,
  label,
  badgeCount,
  badgePing = false,
  variant = 'amber',
  iconClassName = 'w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    amber: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-300',
    green: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/50 text-emerald-300',
    purple: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/50 text-purple-300',
    sky: 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-400/50 text-sky-300',
    slate: 'bg-slate-800 hover:bg-slate-700 border-amber-400/50 text-amber-300',
  }[variant];

  return (
    <button
      type="button"
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${variantStyles} ${className}`}
      {...props}
    >
      <ArcadeAssetIcon iconKey={iconKey} className={iconClassName} />
      {label && <span>{label}</span>}
      {badgeCount !== undefined && <span>{badgeCount}</span>}
      {badgePing && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
      )}
      {children}
    </button>
  );
};
