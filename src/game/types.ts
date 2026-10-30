export type GameState =
  | 'START'
  | 'PLAYING'
  | 'PAUSED'
  | 'WIN'
  | 'GAMEOVER'
  | 'ZONE_COMPLETE';

/**
 * Authentic Arcade Bounce Classic 2-Size Ball System:
 * - 'NORMAL': Default agile small ball (radius 0.42), fits in 1-block narrow passages, sinks to bottom of water pools.
 * - 'BIG': Inflated large ball (radius 0.76), floats on water pools, bounces higher, cannot enter narrow passages.
 */
export type BallType = 'NORMAL' | 'BIG';

export type PumpType = 'INFLATE' | 'DEFLATE';

export type GraphicsMode = 'HIGH' | 'PERFORMANCE';

export type BiomeTheme = 'CLASSIC' | 'JUNGLE' | 'ICE';

export interface BlockDef {
  /** Left-most X coordinate */
  x: number;
  /** Bottom-most Y coordinate */
  y: number;
  /** Center Z coordinate (default 0) */
  z?: number;
  /** Width along X */
  w: number;
  /** Height along Y */
  h: number;
  /** Depth along Z (default 3.4) */
  d?: number;
  /** If true, this is a Blue Rubber Bouncy block that launches the ball high */
  isBouncy?: boolean;
  /** If true, this is a slippery Ice block with low friction */
  isIce?: boolean;
  /** If true, this ice block is a fragile bridge trap that cracks and shatters when stood on */
  isFragileIce?: boolean;
  /** Optional moving platform parameters */
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  movePhase?: number;
}

export interface SlopeDef {
  /** Left-most X coordinate */
  x: number;
  /** Bottom-most Y coordinate */
  y: number;
  /** Center Z coordinate (default 0) */
  z?: number;
  /** Width along X */
  w: number;
  /** Height along Y */
  h: number;
  /** Depth along Z (default 3.4) */
  d?: number;
  /** 'up-right' rises from left to right; 'up-left' rises from right to left */
  dir: 'up-right' | 'up-left';
}

export interface JackDef {
  x: number;
  y: number;
  z?: number;
  moveAxis: 'x' | 'y';
  moveRange: number;
  moveSpeed: number;
  movePhase?: number;
}

export interface SnowballDef {
  x: number;
  y: number;
  z?: number;
  /** Summit spawn X coordinate (defaults to x) */
  spawnX?: number;
  /** Summit spawn Y coordinate (defaults to y + 2.5) */
  spawnY?: number;
  /** Snowball radius in world units (default 0.72, giant boss snowballs up to 1.05) */
  radius?: number;
  moveRange: number;
  moveSpeed: number;
  movePhase?: number;
  /** Unidirectional rolling direction: 'left' (default, rolls downhill towards incoming player) or 'right' */
  direction?: 'left' | 'right';
}

export interface LifeOrbDef {
  x: number;
  y: number;
  z?: number;
}

export interface RingDef {
  x: number;
  y: number;
  z?: number;
  /** 'vertical' (default) faces left-right path; 'horizontal' faces top-bottom jump path */
  orientation?: 'vertical' | 'horizontal';
}

export interface SpikeDef {
  x: number;
  y: number;
  z?: number;
  count?: number;
  /** If true, spikes hang upside-down from ceiling at y */
  inverted?: boolean;
  /** Optional moving needle/spike parameters */
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  movePhase?: number;
}

export interface PumpDef {
  x: number;
  y: number;
  z?: number;
  type: PumpType;
}

export interface WaterPoolDef {
  /** Left-most X coordinate */
  x: number;
  /** Bottom-most Y coordinate */
  y: number;
  z?: number;
  width: number;
  height: number;
  depth?: number;
}

export interface CheckpointFlagDef {
  x: number;
  y: number;
  z?: number;
}

export interface CrateDef {
  x: number;
  y: number;
  z?: number;
}

export interface PolarBearDef {
  x: number;
  y: number;
  z?: number;
}

export interface LevelBlueprint {
  levelNumber: number;
  biome: BiomeTheme;
  title: string;
  subtitle: string;
  difficultyTag: string;
  lengthUnits: number;
  description: string;
  hint?: string;
  spawnPos: [number, number, number];
  blocks: BlockDef[];
  slopes?: SlopeDef[];
  jacks?: JackDef[];
  snowballs?: SnowballDef[];
  lifeOrbs?: LifeOrbDef[];
  crates?: CrateDef[];
  polarBears?: PolarBearDef[];
  rings: RingDef[];
  spikes: SpikeDef[];
  pumps: PumpDef[];
  waterPools: WaterPoolDef[];
  checkpoints: CheckpointFlagDef[];
  exitDoorX: number;
  exitDoorY: number;
  exitRingX: number;
  exitRingY: number;
}

export interface StageIntro {
  levelNumber: number;
  title: string;
  subtitle: string;
  objective: string;
  visible: boolean;
}

export interface HudSnapshot {
  levelNumber: number;
  biome: BiomeTheme;
  levelTitle: string;
  difficultyTag: string;
  lives: number;
  score: number;
  highScore: number;
  collectedRings: number;
  totalRings: number;
  ballType: BallType;
  exitUnlocked: boolean;
  progressPercent: number;
  toastMessage: string | null;
  canRevive: boolean;
  graphicsMode: GraphicsMode;
  hintEnabled: boolean;
  activeHint: string;
  stageIntro: StageIntro | null;
  elapsedTimeSec: number;
  bestTimeSec: number | null;
  isNewRecord: boolean;
  hasShield?: boolean;
  hasSpeedBoost?: boolean;
  hasMagnet?: boolean;
  bossTimeLeftSec?: number | null;
  starInvincibleTimeLeftSec?: number;
}

export interface LevelRecord {
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
}
