
export const MULTI_BONUS_5_PRICE = 30000;
export const MULTI_BONUS_8_PRICE = 60000;
export const MULTI_BONUS_16_PRICE = 100000;
export const MULTI_BONUS_26_PRICE = 150000;
export const MULTI_BONUS_PRICE = 30000;
export const MAX_MULTI_BONUS_SLOTS = 26;
export const POWER_UP_DURATION_SECONDS = 300; // 5 minutos por bónus
export const POWER_UP_DURATION_MS = 300 * 1000; // 300 000 ms

export const DIFFICULTIES = {
  EASY: {
    id: 'EASY' as const,
    label: 'FÁCIL',
    speedMultiplier: 0.75,
    spawnRateMs: 1300,
    damage: 24,
    scoreMultiplier: 0.8,
    creditsMultiplier: 0.8,
    color: '#4ade80', // Green 400
    borderColor: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Velocidade reduzida e menor frequência de detritos. Ideal para iniciantes.',
  },
  MEDIUM: {
    id: 'MEDIUM' as const,
    label: 'MÉDIO',
    speedMultiplier: 1.0,
    spawnRateMs: 1000,
    damage: 34,
    scoreMultiplier: 1.0,
    creditsMultiplier: 1.0,
    color: '#38bdf8', // Sky 400
    borderColor: 'border-sky-500/40',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    description: 'Experiência equilibrada e desafiante. Modo padrão do Núcleo.',
  },
  HARD: {
    id: 'HARD' as const,
    label: 'DIFÍCIL',
    speedMultiplier: 1.35,
    spawnRateMs: 750,
    damage: 48,
    scoreMultiplier: 1.5,
    creditsMultiplier: 1.5,
    color: '#f87171', // Red 400
    borderColor: 'border-red-500/40',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    description: 'Velocidade implacável e impacto elevado. Recompensas +50% de Pontos e Créditos!',
  }
};

export const GAME_CONSTANTS = {
  CORE_RADIUS: 20,
  SHIELD_RADIUS: 60,
  SHIELD_ARC: Math.PI / 3, // 60 degrees
  SHIELD_THICKNESS: 10,
  OBSTACLE_BASE_SPEED: 1.5,
  OBSTACLE_SPAWN_RATE_MS: 1000, // Starting spawn rate
  PARTICLE_COUNT: 12,
  COLORS: {
    // Default Fallbacks
    CORE: '#38bdf8', // Sky 400
    CORE_GLOW: '#0ea5e9',
    SHIELD: '#f472b6', // Pink 400
    SHIELD_GLOW: '#db2777',
    OBSTACLE: '#fb923c', // Orange 400
    BACKGROUND: '#020617',
  }
};

export const THEMES = {
  DEFAULT: {
    label: 'PADRÃO',
    price: 0,
    CORE: '#38bdf8', // Sky
    CORE_GLOW: '#0ea5e9',
    SHIELD: '#f472b6', // Pink
    SHIELD_GLOW: '#db2777',
  },
  TOXIC: {
    label: 'TÓXICO',
    price: 500,
    CORE: '#4ade80', // Green
    CORE_GLOW: '#22c55e',
    SHIELD: '#a855f7', // Purple
    SHIELD_GLOW: '#9333ea',
  },
  SOLAR: {
    label: 'SOLAR',
    price: 1000,
    CORE: '#facc15', // Yellow
    CORE_GLOW: '#eab308',
    SHIELD: '#f97316', // Orange
    SHIELD_GLOW: '#ea580c',
  },
  CRIMSON: {
    label: 'CARMESIM',
    price: 2500,
    CORE: '#f87171', // Red 400
    CORE_GLOW: '#ef4444',
    SHIELD: '#cbd5e1', // Slate 300
    SHIELD_GLOW: '#94a3b8',
  },
  NEON: {
    label: 'NEON',
    price: 5000,
    CORE: '#22d3ee', // Cyan
    CORE_GLOW: '#06b6d4',
    SHIELD: '#d946ef', // Fuchsia
    SHIELD_GLOW: '#c026d3',
  },
  VOID: {
    label: 'VOID',
    price: 8000,
    CORE: '#ffffff', // White
    CORE_GLOW: '#e2e8f0',
    SHIELD: '#000000', // Black (with white stroke usually handled in canvas)
    SHIELD_GLOW: '#94a3b8',
  },
  SPIDERMAN: {
    label: 'HOMEM-ARANHA',
    price: 3500,
    CORE: '#ef4444', // Iconic Spidey Red
    CORE_GLOW: '#b91c1c',
    SHIELD: '#3b82f6', // Spidey Royal Blue
    SHIELD_GLOW: '#1d4ed8',
  },
  BATMAN: {
    label: 'CAVALEIRO DAS TREVAS',
    price: 4500,
    CORE: '#0f172a', // Midnight Bat Black
    CORE_GLOW: '#eab308', // Gotham Signal Gold
    SHIELD: '#eab308', // Bat Gold
    SHIELD_GLOW: '#ca8a04',
  },
  FROST: {
    label: 'GELO ETERNO',
    price: 5500,
    CORE: '#e0f2fe', // Glacial Ice White
    CORE_GLOW: '#38bdf8', // Frost Cyan
    SHIELD: '#38bdf8', // Ice Cyan
    SHIELD_GLOW: '#0284c7',
  },
  CYBERPUNK: {
    label: 'CYBERPUNK 2077',
    price: 6500,
    CORE: '#facc15', // Neon Cyber Yellow
    CORE_GLOW: '#eab308',
    SHIELD: '#06b6d4', // Cyan Laser
    SHIELD_GLOW: '#ec4899', // Hot Pink
  },
  SUPERNOVA: {
    label: 'SUPERNOVA SOLAR',
    price: 8500,
    CORE: '#ff5722', // Burning Plasma
    CORE_GLOW: '#ff9800',
    SHIELD: '#ffb703', // Blazing Corona
    SHIELD_GLOW: '#fb8500',
  },
  RAINBOW: {
    label: 'PRISMA CÓSMICO',
    price: 12000,
    CORE: '#a855f7', // Shifting Chroma
    CORE_GLOW: '#ec4899',
    SHIELD: '#3b82f6', // Rainbow spectrum
    SHIELD_GLOW: '#10b981',
  },
  CUSTOM: {
    label: 'PERSONALIZADA',
    price: 10000,
    CORE: '#a855f7', // Purple default
    CORE_GLOW: '#9333ea',
    SHIELD: '#06b6d4', // Cyan default
    SHIELD_GLOW: '#0891b2',
  }
};

export const DEFAULT_CUSTOM_SKIN = {
  coreColor: '#a855f7',
  shieldColor: '#06b6d4',
  pattern: 'ENERGY_MATRIX' as const,
};

export const UPGRADES = {
  HULL: {
    id: 'hull',
    label: 'BLINDAGEM DE TITÂNIO',
    description: '+10% Vida Máxima por nível',
    basePrice: 500,
    priceMultiplier: 1.5,
    maxLevel: 5,
    bonusPerLevel: 10, // +10 health
  },
  MINING: {
    id: 'mining',
    label: 'ALGORITMO DE MINERAÇÃO',
    description: '+30% Créditos ganhos por nível',
    basePrice: 800,
    priceMultiplier: 1.6,
    maxLevel: 5,
    bonusPerLevel: 0.3, // +30% multiplier
  },
  REGEN: {
    id: 'regen',
    label: 'NANOBOTS REPARADORES',
    description: 'Regenera vida lentamente',
    basePrice: 1500,
    priceMultiplier: 1.8,
    maxLevel: 5,
    bonusPerLevel: 0.02, // Health per frame approx
  },
  LUCK: {
    id: 'luck',
    label: 'SORTE QUÂNTICA',
    description: 'Chance de Pontos Críticos (x3)',
    basePrice: 2000,
    priceMultiplier: 2.0,
    maxLevel: 5,
    bonusPerLevel: 0.05, // 5% chance per level
  }
};

export const BOSS_CONFIGS = [
  {
    level: 5,
    name: 'NAVE-MÃE KRALL',
    title: 'Cruzador Alienígena de Vanguarda',
    health: 400,
    color: '#ef4444',
    secondaryColor: '#f97316',
    creditReward: 5000,
  },
  {
    level: 10,
    name: 'ANOMALIA QUÂNTICA',
    title: 'Singularidade Dimensional Instável',
    health: 800,
    color: '#a855f7',
    secondaryColor: '#38bdf8',
    creditReward: 12000,
  },
  {
    level: 15,
    name: 'DEVORADOR ESTELAR',
    title: 'Entidade de Matéria Escura',
    health: 1400,
    color: '#ec4899',
    secondaryColor: '#fbbf24',
    creditReward: 25000,
  },
  {
    level: 20,
    name: 'TITÃ DO VÁCUO',
    title: 'Guardião do Centro Galáctico',
    health: 2200,
    color: '#10b981',
    secondaryColor: '#06b6d4',
    creditReward: 50000,
  }
];

export const INITIAL_ACHIEVEMENTS = [
  {
    id: 'first_blood',
    title: 'Primeiro Impacto',
    description: 'Defende o teu primeiro projétil estelar com o escudo.',
    icon: 'Shield',
    category: 'COMBAT' as const,
    target: 1,
    rewardCredits: 500,
    unlocked: false,
    progress: 0
  },
  {
    id: 'deflect_100',
    title: 'Muralha Orbital',
    description: 'Bloqueia com sucesso 100 projéteis acumulados.',
    icon: 'Layers',
    category: 'COMBAT' as const,
    target: 100,
    rewardCredits: 2500,
    unlocked: false,
    progress: 0
  },
  {
    id: 'emp_master',
    title: 'Pulso Eletromagnético',
    description: 'Ativa a Super Habilidade EMP 5 vezes em combate.',
    icon: 'Zap',
    category: 'MASTERY' as const,
    target: 5,
    rewardCredits: 3000,
    unlocked: false,
    progress: 0
  },
  {
    id: 'boss_slayer',
    title: 'Exterminador Cósmico',
    description: 'Derrota o teu primeiro Chefe Cósmico (Nível 5+).',
    icon: 'Award',
    category: 'PROGRESSION' as const,
    target: 1,
    rewardCredits: 5000,
    unlocked: false,
    progress: 0
  },
  {
    id: 'reach_lvl_10',
    title: 'Piloto Veterano',
    description: 'Sobrevive até ao Nível 10 numa partida.',
    icon: 'Star',
    category: 'PROGRESSION' as const,
    target: 10,
    rewardCredits: 8000,
    unlocked: false,
    progress: 0
  },
  {
    id: 'credits_collector',
    title: 'Magnata Galáctico',
    description: 'Acumula 50 000 créditos totais.',
    icon: 'Coins',
    category: 'ECONOMY' as const,
    target: 50000,
    rewardCredits: 10000,
    unlocked: false,
    progress: 0
  }
];

export const INITIAL_QUESTS = [
  {
    id: 'daily_defend_50',
    title: 'Defesa Planetária',
    description: 'Defende 50 projéteis com o escudo em jogo.',
    icon: 'Shield',
    target: 50,
    current: 0,
    rewardCredits: 2000,
    rewardSpins: 1,
    completed: false,
    claimed: false
  },
  {
    id: 'daily_use_emp',
    title: 'Sobrecarga de Energia',
    description: 'Usa a Onda de Choque EMP 3 vezes.',
    icon: 'Zap',
    target: 3,
    current: 0,
    rewardCredits: 2500,
    rewardSpins: 1,
    completed: false,
    claimed: false
  },
  {
    id: 'daily_boss_damage',
    title: 'Dano a Chefes Cósmicos',
    description: 'Derrota ou causa 300 de dano a um Chefe.',
    icon: 'Award',
    target: 300,
    current: 0,
    rewardCredits: 4000,
    rewardSpins: 2,
    completed: false,
    claimed: false
  }
];

export const PILOT_RANKS = [
  { level: 1, title: 'Recruta Estelar', minScore: 0, color: 'text-slate-400' },
  { level: 2, title: 'Guardião do Vácuo', minScore: 1000, color: 'text-cyan-400' },
  { level: 3, title: 'Comandante Orbital', minScore: 3500, color: 'text-emerald-400' },
  { level: 4, title: 'Ás Intergaláctico', minScore: 8000, color: 'text-amber-400' },
  { level: 5, title: 'Lenda do Núcleo', minScore: 20000, color: 'text-purple-400' }
];

export const GAME_MODES = {
  CLASSIC: {
    id: 'CLASSIC' as const,
    name: 'CLÁSSICO',
    tag: 'Campanha com Chefes',
    description: 'Progressão equilibrada com batalhas contra Chefes Cósmicos a cada 5 níveis.',
    color: 'from-cyan-500 to-blue-600',
    border: 'border-cyan-500/50'
  },
  SURVIVAL: {
    id: 'SURVIVAL' as const,
    name: 'SOBREVIVÊNCIA',
    tag: 'Avalanche Contínua',
    description: 'Ondas intensas e sem pausas de meteoros e projéteis teleguiados. +30% Pontos!',
    color: 'from-amber-500 to-rose-600',
    border: 'border-amber-500/50'
  },
  BOSS_RUSH: {
    id: 'BOSS_RUSH' as const,
    name: 'BATALHA DE CHEFES',
    tag: 'Duelo Cósmico',
    description: 'Enfrenta os Chefes Galácticos diretamente em combate de alta voltagem!',
    color: 'from-purple-600 to-pink-600',
    border: 'border-purple-500/50'
  }
};

