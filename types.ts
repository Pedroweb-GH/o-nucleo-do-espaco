
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export type GameMode = 'CLASSIC' | 'SURVIVAL' | 'BOSS_RUSH';

export type EnemyType = 'STANDARD' | 'HOMING' | 'FRAGMENTATION' | 'LASER_BEAM' | 'BOSS_ORB';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2D;
  velocity: Vector2D;
  radius: number;
  color: string;
  active: boolean;
  enemyType?: EnemyType;
  homingStrength?: number;
  spawnTime?: number;
  laserChargeMs?: number;
  laserAngle?: number;
  isFragment?: boolean;
}

export interface BossState {
  id: string;
  name: string;
  title: string;
  health: number;
  maxHealth: number;
  level: number;
  pos: Vector2D;
  angle: number;
  color: string;
  active: boolean;
  attackTimer: number;
  specialAttackTimer: number;
  phase: number;
}

export interface Particle extends Entity {
  life: number; // 0 to 1
  maxLife: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // 1.0 to 0
  velocity: number;
}

export interface ShieldState {
  angle: number; // Radians
  distance: number;
  arcLength: number; // Radians width of shield
  thickness: number;
}

export interface GameReport {
  message: string;
  rank: string;
}

export type PowerUpType = 
  | 'NONE' 
  | 'WIDE_SHIELD' 
  | 'DOUBLE_SCORE' 
  | 'SLOW_TIME' 
  | 'MAGNET_SHIELD' 
  | 'NANO_REPAIR' 
  | 'INSTANT_CREDITS' 
  | 'EXPLOSIVE_DEFENSE' 
  | 'TRIPLE_SCORE'
  | 'HYPER_EMP'
  | 'TIME_FREEZE'
  | 'DOUBLE_SHIELD'
  | 'JACKPOT_CREDITS'
  | 'EXTRA_SPINS_REWARD'
  | 'PLASMA_OVERCHARGE'
  | 'INVULNERABILITY_BOOST'
  | 'CREDIT_FRENZY'
  | 'ORBITAL_LASER'
  | 'GRAVITY_PULL'
  | 'SUPER_MEGA_CREDITS'
  | 'TRIPLE_SHIELD'
  | 'BOSS_SLAYER_BOOST'
  | 'SUPER_SPINS_PACK'
  | 'CHAIN_LIGHTNING'
  | 'CORE_REPULSOR'
  | 'SCORE_FRENZY_5X'
  | 'GIGA_JACKPOT';

export interface PowerUpConfig {
  type: PowerUpType;
  label: string;
  color: string;
  description: string;
}

export type DifficultyType = 'EASY' | 'MEDIUM' | 'HARD';

export interface DifficultyConfig {
  id: DifficultyType;
  label: string;
  speedMultiplier: number;
  spawnRateMs: number;
  damage: number;
  scoreMultiplier: number;
  creditsMultiplier: number;
  color: string;
  borderColor: string;
  badgeBg: string;
  description: string;
}

export type ThemeType = 
  | 'DEFAULT' 
  | 'TOXIC' 
  | 'SOLAR' 
  | 'CRIMSON' 
  | 'NEON' 
  | 'VOID' 
  | 'SPIDERMAN' 
  | 'BATMAN'
  | 'FROST'
  | 'CYBERPUNK'
  | 'SUPERNOVA'
  | 'RAINBOW'
  | 'CUSTOM';

export interface CustomSkinConfig {
  coreColor: string;
  shieldColor: string;
  pattern: 'NONE' | 'WEB' | 'NEON_RINGS' | 'ENERGY_MATRIX' | 'GOLD_STARS';
}

export interface GameSettings {
  theme: ThemeType;
  difficulty: DifficultyType;
  highPerformance: boolean; 
  colorBlindMode: boolean;
  sfxMuted?: boolean;
  musicMuted?: boolean;
  customSkin?: CustomSkinConfig;
}

export interface UpgradesState {
  hull: number; // Level 0-5
  mining: number; // Level 0-5
  regen: number; // Level 0-5
  luck: number; // Level 0-5
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'COMBAT' | 'PROGRESSION' | 'ECONOMY' | 'MASTERY';
  target: number;
  rewardCredits: number;
  unlocked: boolean;
  progress: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  rewardCredits: number;
  rewardSpins: number;
  completed: boolean;
  claimed: boolean;
}

