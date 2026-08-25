import React, { useRef, useEffect } from 'react';
import { GameState, Entity, Particle, PowerUpType, Star, FloatingText, ThemeType, UpgradesState, DifficultyType, CustomSkinConfig, BossState, GameMode, EnemyType } from '../types';
import { GAME_CONSTANTS, THEMES, DIFFICULTIES, DEFAULT_CUSTOM_SKIN, BOSS_CONFIGS } from '../constants';
import { soundEngine } from '../soundEngine';

interface GameCanvasProps {
  gameState: GameState;
  gameMode?: GameMode;
  activePowerUp?: PowerUpType;
  activePowerUps?: PowerUpType[];
  powerUpTimers?: Partial<Record<PowerUpType, number>>;
  currentTheme: ThemeType;
  customSkin?: CustomSkinConfig;
  difficulty: DifficultyType;
  highPerformance: boolean;
  maxHealth: number;
  upgrades: UpgradesState;
  empEnergy: number;
  onEmpEnergyUpdate: (energy: number) => void;
  onEmpTriggered?: () => void;
  onScoreUpdate: (score: number) => void;
  onHealthUpdate: (health: number) => void;
  onLevelUpdate: (level: number) => void;
  onGameOver: (finalScore?: number) => void;
  onDeflectObstacle?: () => void;
  onBossStateChange?: (boss: BossState | null) => void;
  onBossStateUpdate?: (boss: BossState | null) => void;
  onBossDefeated?: (bossName: string, rewardCredits: number) => void;
  onTimeUpdate?: (seconds: number) => void;
  onComboUpdate?: (combo: number) => void;
  onDamageFlash?: () => void;
  onTotalDeflects?: (count: number) => void;
  setShieldAngleRef: (ref: React.MutableRefObject<number>) => void;
  colorBlindMode: boolean;
  registerEmpTrigger?: (triggerFn: () => void) => void;
}

interface ShieldTrailPoint {
  angle: number;
  time: number;
  alpha: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, gameMode = 'CLASSIC', activePowerUp = 'NONE', activePowerUps = [], powerUpTimers = {}, currentTheme, customSkin = DEFAULT_CUSTOM_SKIN, difficulty, highPerformance, maxHealth, upgrades,
  empEnergy, onEmpEnergyUpdate, onEmpTriggered,
  onScoreUpdate, onHealthUpdate, onLevelUpdate, onGameOver, onDeflectObstacle, onBossStateChange, onBossStateUpdate, onBossDefeated, onTimeUpdate,
  onComboUpdate, onDamageFlash, onTotalDeflects,
  setShieldAngleRef, colorBlindMode, registerEmpTrigger
}) => {
  const notifyBossState = (boss: BossState | null) => {
    onBossStateChange?.(boss);
    onBossStateUpdate?.(boss);
  };
  const hasPowerUp = (type: PowerUpType) => {
    if (activePowerUps && activePowerUps.length > 0) {
      return activePowerUps.includes(type);
    }
    return activePowerUp === type;
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const healthRef = useRef(100); 
  const levelRef = useRef(1);
  const obstaclesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const shieldAngleRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);
  const corePulseRef = useRef(0);
  const shakeIntensityRef = useRef(0);
  const invulnerabilityTimerRef = useRef(0);
  const gameOverFiredRef = useRef(false);
  const prevActivePowerUpsRef = useRef<PowerUpType[]>([]);
  
  // EMP shockwave animation state
  const empShockwaveRef = useRef<{ radius: number; maxRadius: number; active: boolean; opacity: number }>({
    radius: 0,
    maxRadius: 0,
    active: false,
    opacity: 1
  });

  // Shield plasma motion trail
  const shieldTrailsRef = useRef<ShieldTrailPoint[]>([]);
  const lastShieldAngleRef = useRef(0);

  // Orbital Laser & Lightning VFX refs
  const lastLaserTimeRef = useRef(0);
  const laserBeamsRef = useRef<{ x1: number; y1: number; x2: number; y2: number; life: number; color: string }[]>([]);
  const lightningArcsRef = useRef<{ x1: number; y1: number; x2: number; y2: number; life: number }[]>([]);

  // Boss state ref
  const bossRef = useRef<BossState | null>(null);
  const lastBossSpawnLevelRef = useRef(0);
  const timeAttackRemainingRef = useRef(90);
  const lastFrameTimeRef = useRef(0);
  const timeAttackDuration = 90;

  // Deflect combo tracker for dynamic audio
  const deflectComboRef = useRef(0);
  const lastDeflectTimeRef = useRef(0);
  const totalDeflectsRef = useRef(0);
  const damageFlashRef = useRef(0);

  // Keyboard controls state (Left/Right arrow or A/D keys for desktop play)
  const keysDownRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  // Touch controls: track target angle from finger position
  const touchTargetAngleRef = useRef<number | null>(null);

  // Register external trigger for EMP (from UI button)
  const triggerEmpShockwave = () => {
    if (gameState !== GameState.PLAYING) return;
    if (empEnergy < 100 && empShockwaveRef.current.active) return;

    soundEngine.playEMP();
    triggerShake(22);
    empShockwaveRef.current = {
      radius: GAME_CONSTANTS.CORE_RADIUS,
      maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.85,
      active: true,
      opacity: 1
    };

    onEmpEnergyUpdate(0);
    onEmpTriggered?.();

    // Destroy obstacles within EMP blast radius (not all)
    const empRadius = Math.min(window.innerWidth, window.innerHeight) * 0.38;
    let destroyedCount = 0;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    obstaclesRef.current.forEach(obs => {
      const dist = Math.hypot(obs.pos.x - cx, obs.pos.y - cy);
      if (dist < empRadius) {
        obs.active = false;
        const empColor = currentTheme === 'SPIDERMAN' ? '#ffffff' : currentTheme === 'THOR' ? '#87CEFA' : currentTheme === 'HULK' ? '#22c55e' : currentTheme === 'IRONMAN' ? '#eab308' : '#38bdf8';
        createExplosion(obs.pos.x, obs.pos.y, empColor, 10);
        destroyedCount++;
      } else {
        const pushAngle = Math.atan2(obs.pos.y - cy, obs.pos.x - cx);
        const pushForce = Math.max(0, 1 - dist / (empRadius * 2)) * 3;
        obs.velocity.x += Math.cos(pushAngle) * pushForce;
        obs.velocity.y += Math.sin(pushAngle) * pushForce;
      }
    });

    // Damage Boss if present
    if (bossRef.current && bossRef.current.active) {
      bossRef.current.health -= 160;
      notifyBossState({ ...bossRef.current });
      addFloatingText(bossRef.current.pos.x, bossRef.current.pos.y - 30, "-160 DANO EMP", "#38bdf8", 1.5);
      createExplosion(bossRef.current.pos.x, bossRef.current.pos.y, "#38bdf8", 25);
    }

    const earnedBonus = destroyedCount * 150;
    if (earnedBonus > 0) {
      scoreRef.current += earnedBonus;
      onScoreUpdate(scoreRef.current);
      addFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 70, `EMP ONDA DE CHOQUE! +${earnedBonus}`, '#38bdf8', 1.8);
    } else {
      addFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 70, `EMP ONDA DE CHOQUE!`, '#38bdf8', 1.8);
    }
  };

  useEffect(() => {
    if (registerEmpTrigger) {
      registerEmpTrigger(triggerEmpShockwave);
    }
  }, [registerEmpTrigger, empEnergy, gameState]);

  // Desktop Keyboard Controls & Right Click for EMP
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysDownRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysDownRef.current.right = true;
      }
      if (e.code === 'Space' && gameState === GameState.PLAYING && empEnergy >= 100) {
        e.preventDefault();
        triggerEmpShockwave();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysDownRef.current.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysDownRef.current.right = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (gameState === GameState.PLAYING) {
        e.preventDefault();
        if (empEnergy >= 100) {
          triggerEmpShockwave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gameState, empEnergy]);

  // Mobile touch controls: drag finger to aim shield
  useEffect(() => {
    const updateTouchAngle = (e: TouchEvent) => {
      if (gameState !== GameState.PLAYING) return;
      const touch = e.touches[0];
      if (!touch) { touchTargetAngleRef.current = null; return; }
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      touchTargetAngleRef.current = Math.atan2(touch.clientY - cy, touch.clientX - cx);
    };
    const clearTouch = () => { touchTargetAngleRef.current = null; };

    window.addEventListener('touchstart', updateTouchAngle, { passive: true });
    window.addEventListener('touchmove', updateTouchAngle, { passive: true });
    window.addEventListener('touchend', clearTouch, { passive: true });
    window.addEventListener('touchcancel', clearTouch, { passive: true });
    return () => {
      window.removeEventListener('touchstart', updateTouchAngle);
      window.removeEventListener('touchmove', updateTouchAngle);
      window.removeEventListener('touchend', clearTouch);
      window.removeEventListener('touchcancel', clearTouch);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      const prev = prevActivePowerUpsRef.current;
      prev.forEach(p => {
        if (!activePowerUps.includes(p) && p !== 'NONE') {
          addFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 50, `BÓNUS TERMINOU (5 MIN)`, '#f59e0b', 1.2);
          createExplosion(window.innerWidth / 2, window.innerHeight / 2, '#f59e0b', 16);
        }
      });
      prevActivePowerUpsRef.current = [...activePowerUps];
    } else {
      prevActivePowerUpsRef.current = [...activePowerUps];
    }
  }, [activePowerUps, gameState]);

  useEffect(() => { setShieldAngleRef(shieldAngleRef); }, [setShieldAngleRef]);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const stars: Star[] = [];
    const starCount = highPerformance ? 35 : 110;
    for (let i = 0; i < starCount; i++) {
      stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2.2, speed: Math.random() * 0.5 + 0.1, opacity: Math.random() });
    }
    starsRef.current = stars;
  }, [highPerformance]);

  const prevGameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    const prevState = prevGameStateRef.current;
    prevGameStateRef.current = gameState;

    if (gameState === GameState.PLAYING) {
      // Only reset game state when starting fresh (from MENU), not when resuming from PAUSED
      if (prevState !== GameState.PAUSED) {
        gameOverFiredRef.current = false;
        scoreRef.current = 0;
        healthRef.current = maxHealth;
        levelRef.current = 1;
        obstaclesRef.current = [];
        particlesRef.current = [];
        floatingTextsRef.current = [];
        lastSpawnTimeRef.current = performance.now();
        shakeIntensityRef.current = 0;
        invulnerabilityTimerRef.current = 0;
        damageFlashRef.current = 0;
        deflectComboRef.current = 0;
        totalDeflectsRef.current = 0;
        bossRef.current = null;
        lastBossSpawnLevelRef.current = 0;
        onScoreUpdate(0);
        onHealthUpdate(maxHealth);
        onLevelUpdate(1);
        onBossStateChange?.(null);

        if (gameMode === 'TIME_ATTACK') {
          timeAttackRemainingRef.current = timeAttackDuration;
          lastFrameTimeRef.current = performance.now();
          onTimeUpdate?.(timeAttackDuration);
        }

        if (gameMode === 'BOSS_RUSH') {
          spawnBoss(1, window.innerWidth, window.innerHeight);
        }
      }
      if (gameMode === 'TIME_ATTACK') {
        lastFrameTimeRef.current = performance.now();
      }
      soundEngine.startMusic();
    } else if (gameState === GameState.PAUSED) {
      soundEngine.stopMusic();
    } else {
      soundEngine.stopMusic();
    }
  }, [gameState, maxHealth, gameMode]);

  const diffConfig = DIFFICULTIES[difficulty] || DIFFICULTIES.MEDIUM;

  const spawnBoss = (levelNum: number, width: number, height: number) => {
    const configIndex = Math.min(Math.floor((levelNum - 1) / 5), BOSS_CONFIGS.length - 1);
    const cfg = BOSS_CONFIGS[configIndex] || BOSS_CONFIGS[0];

    const boss: BossState = {
      id: Math.random().toString(),
      name: cfg.name,
      title: cfg.title,
      health: cfg.health + (levelNum > 5 ? (levelNum - 5) * 60 : 0),
      maxHealth: cfg.health + (levelNum > 5 ? (levelNum - 5) * 60 : 0),
      level: levelNum,
      pos: { x: width / 2, y: height / 2 - 200 },
      angle: -Math.PI / 2,
      color: cfg.color,
      active: true,
      attackTimer: 0,
      specialAttackTimer: 0,
      phase: 1
    };

    bossRef.current = boss;
    lastBossSpawnLevelRef.current = levelNum;
    notifyBossState(boss);

    soundEngine.playBossAlarm();
    triggerShake(18);
    addFloatingText(width / 2, height / 2 - 120, `ALERTA: ${cfg.name}!`, cfg.color, 2.2);
    createExplosion(width / 2, height / 2 - 200, cfg.color, 35);
  };

  const spawnObstacle = (width: number, height: number, difficultyMultiplier: number, forcedType?: EnemyType) => {
    const angle = Math.random() * Math.PI * 2;
    const spawnRadius = Math.max(width, height) / 1.5; 
    const startX = width / 2 + Math.cos(angle) * spawnRadius;
    const startY = height / 2 + Math.sin(angle) * spawnRadius;
    const dirX = (width / 2) - startX;
    const dirY = (height / 2) - startY;
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    
    let finalSpeed = GAME_CONSTANTS.OBSTACLE_BASE_SPEED * difficultyMultiplier * diffConfig.speedMultiplier;
    if (gameMode === 'SURVIVAL') finalSpeed *= 1.15;
    if (hasPowerUp('SLOW_TIME')) finalSpeed *= 0.7;

    // Determine enemy type based on game level & random roll
    let enemyType: EnemyType = forcedType || 'STANDARD';
    if (!forcedType) {
      const rand = Math.random();
      if (levelRef.current >= 4 && rand < 0.25) {
        enemyType = 'HOMING';
      } else if (levelRef.current >= 3 && rand < 0.45) {
        enemyType = 'FRAGMENTATION';
      } else if (levelRef.current >= 6 && rand < 0.60) {
        enemyType = 'LASER_BEAM';
      } else if (levelRef.current >= 5 && rand < 0.15) {
        enemyType = 'SHIELDED';
      } else if (levelRef.current >= 7 && rand < 0.20) {
        enemyType = 'TRI_SPLIT';
      } else if (levelRef.current >= 2 && rand < 0.12) {
        enemyType = 'SPINNING_ASTEROID';
      }
    }

    let obstacleColor = colorBlindMode ? '#fb923c' : GAME_CONSTANTS.COLORS.OBSTACLE;
    let radius = 10 + Math.random() * 8;

    if (enemyType === 'HOMING') {
      obstacleColor = '#c084fc';
      radius = 11;
      finalSpeed *= 0.85;
    } else if (enemyType === 'FRAGMENTATION') {
      obstacleColor = '#2dd4bf';
      radius = 14;
    } else if (enemyType === 'LASER_BEAM') {
      obstacleColor = '#f43f5e';
      radius = 8;
      finalSpeed *= 1.4;
    } else if (enemyType === 'SHIELDED') {
      obstacleColor = '#60a5fa';
      radius = 13;
      finalSpeed *= 0.75;
    } else if (enemyType === 'TRI_SPLIT') {
      obstacleColor = '#f59e0b';
      radius = 12;
    } else if (enemyType === 'SPINNING_ASTEROID') {
      obstacleColor = '#a1a1aa';
      radius = 16 + Math.random() * 6;
      finalSpeed *= 0.65;
    }

    const velocity = { x: (dirX / length) * finalSpeed, y: (dirY / length) * finalSpeed };

    obstaclesRef.current.push({
      id: Math.random().toString(36).substr(2, 9),
      pos: { x: startX, y: startY },
      velocity,
      radius,
      color: obstacleColor,
      active: true,
      enemyType,
      homingStrength: enemyType === 'HOMING' ? 0.04 : 0,
      spawnTime: performance.now(),
      laserChargeMs: enemyType === 'LASER_BEAM' ? 1200 : 0,
      laserAngle: angle,
      shieldHp: enemyType === 'SHIELDED' ? 2 : undefined,
      spinAngle: enemyType === 'SPINNING_ASTEROID' ? Math.random() * Math.PI * 2 : undefined,
    });
  };

  const createExplosion = (x: number, y: number, color: string, count: number = GAME_CONSTANTS.PARTICLE_COUNT) => {
    const finalCount = highPerformance ? Math.floor(count / 2) : count;
    for (let i = 0; i < finalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { x, y },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        radius: Math.random() * 3 + 1,
        color: color,
        life: 1.0, maxLife: 1.0, active: true
      });
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string, sizeMultiplier: number = 1) => {
    floatingTextsRef.current.push({ id: Math.random().toString(), x, y, text, color, life: 1.0, velocity: 1.5 / sizeMultiplier });
  };

  const triggerShake = (amount: number) => { shakeIntensityRef.current = amount; };

  const update = (time: number, width: number, height: number) => {
    const themeColors = THEMES[currentTheme] || THEMES.DEFAULT;
    starsRef.current.forEach(star => {
      star.y += star.speed;
      if (star.y > height) { star.y = 0; star.x = Math.random() * width; }
    });

    const pulseSpeed = healthRef.current < 40 ? 400 : 200;
    corePulseRef.current = (Math.sin(time / pulseSpeed) + 1) * 0.5;
    if (shakeIntensityRef.current > 0) {
      shakeIntensityRef.current *= 0.9;
      if (shakeIntensityRef.current < 0.5) shakeIntensityRef.current = 0;
    }
    if (invulnerabilityTimerRef.current > 0) invulnerabilityTimerRef.current -= 16.6;

    // Shield Rotation: keyboard (desktop) + touch (mobile)
    if (gameState === GameState.PLAYING) {
      if (keysDownRef.current.left) {
        shieldAngleRef.current -= 0.055;
      }
      if (keysDownRef.current.right) {
        shieldAngleRef.current += 0.055;
      }
      if (touchTargetAngleRef.current !== null) {
        let diff = touchTargetAngleRef.current - shieldAngleRef.current;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        shieldAngleRef.current += diff * 0.18;
      }
    }

    // Update Shield Trail + sparkle particles
    const currentAngle = shieldAngleRef.current;
    const angleDelta = Math.abs(currentAngle - lastShieldAngleRef.current);
    if (angleDelta > 0.02) {
      shieldTrailsRef.current.push({
        angle: currentAngle,
        time,
        alpha: 0.6
      });
      if (!highPerformance && angleDelta > 0.04 && gameState === GameState.PLAYING) {
        const themeColors = THEMES[currentTheme] || THEMES.DEFAULT;
        const sColor = currentTheme === 'CUSTOM' ? customSkin.shieldColor : themeColors.SHIELD;
        const shieldR = hasPowerUp('MAGNET_SHIELD') ? GAME_CONSTANTS.SHIELD_RADIUS + 18 : GAME_CONSTANTS.SHIELD_RADIUS;
        const sparkX = width / 2 + Math.cos(currentAngle) * shieldR;
        const sparkY = height / 2 + Math.sin(currentAngle) * shieldR;
        particlesRef.current.push({
          id: Math.random().toString(),
          pos: { x: sparkX, y: sparkY },
          velocity: { x: (Math.random() - 0.5) * 1.5, y: (Math.random() - 0.5) * 1.5 },
          radius: Math.random() * 2 + 0.5,
          color: sColor,
          life: 0.6, maxLife: 0.6, active: true
        });
      }
      lastShieldAngleRef.current = currentAngle;
    }
    shieldTrailsRef.current.forEach(t => { t.alpha -= 0.04; });
    shieldTrailsRef.current = shieldTrailsRef.current.filter(t => t.alpha > 0);

    // Update EMP Shockwave
    if (empShockwaveRef.current.active) {
      empShockwaveRef.current.radius += 24;
      empShockwaveRef.current.opacity -= 0.025;
      if (empShockwaveRef.current.radius >= empShockwaveRef.current.maxRadius || empShockwaveRef.current.opacity <= 0) {
        empShockwaveRef.current.active = false;
      }
    }

    if (gameState !== GameState.PLAYING) return;

    const baseRegen = upgrades.regen * 0.02;
    const powerUpRegen = hasPowerUp('NANO_REPAIR') ? 0.05 : 0;
    const totalRegen = baseRegen + powerUpRegen;
    if (totalRegen > 0 && healthRef.current < maxHealth && healthRef.current > 0) {
      healthRef.current = Math.min(maxHealth, healthRef.current + totalRegen);
      if (Math.floor(time) % 30 === 0) onHealthUpdate(healthRef.current);
    }

    // TIME_ATTACK countdown (delta-time based, pause-safe)
    if (gameMode === 'TIME_ATTACK') {
      const now = performance.now();
      const dt = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;
      timeAttackRemainingRef.current = Math.max(0, timeAttackRemainingRef.current - dt);
      const remaining = Math.ceil(timeAttackRemainingRef.current);
      onTimeUpdate?.(remaining);
      if (timeAttackRemainingRef.current <= 0 && !gameOverFiredRef.current) {
        gameOverFiredRef.current = true;
        onGameOver(scoreRef.current);
        return;
      }
    }

    // Level progression
    const currentLevel = Math.floor(scoreRef.current / 500) + 1;
    if (currentLevel > levelRef.current) {
      levelRef.current = currentLevel;
      onLevelUpdate(currentLevel);
      const healAmount = 20;
      if (healthRef.current < maxHealth) {
        healthRef.current = Math.min(maxHealth, healthRef.current + healAmount);
        onHealthUpdate(healthRef.current);
        addFloatingText(width/2, height/2 + 40, "REPARAÇÃO +20%", colorBlindMode ? "#3b82f6" : "#22c55e");
      }
      triggerShake(15);
      createExplosion(width/2, height/2, "#FFF", 40);
      addFloatingText(width/2, height/2 - 80, `NÍVEL ${currentLevel}`, "#fbbf24", 2);
      soundEngine.playLevelUp();

      // Check Boss Spawn trigger (every 5 levels in Classic mode)
      if (gameMode === 'CLASSIC' && currentLevel % 5 === 0 && lastBossSpawnLevelRef.current !== currentLevel) {
        spawnBoss(currentLevel, width, height);
      }
    }

    // Boss Loop & Attacks
    if (bossRef.current && bossRef.current.active) {
      const b = bossRef.current;
      b.angle += 0.015;
      const orbitRadius = Math.min(width, height) * 0.36;
      b.pos.x = width / 2 + Math.cos(b.angle) * orbitRadius;
      b.pos.y = height / 2 + Math.sin(b.angle) * orbitRadius;

      b.attackTimer += 16.6;
      b.specialAttackTimer += 16.6;

      // Boss Attack 1: Rapid Projectile Burst towards Core
      if (b.attackTimer > 1800) {
        b.attackTimer = 0;
        const dirX = (width / 2) - b.pos.x;
        const dirY = (height / 2) - b.pos.y;
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        const speed = 2.2 * diffConfig.speedMultiplier;
        obstaclesRef.current.push({
          id: Math.random().toString(),
          pos: { x: b.pos.x, y: b.pos.y },
          velocity: { x: (dirX / len) * speed, y: (dirY / len) * speed },
          radius: 12,
          color: b.color,
          active: true,
          enemyType: 'BOSS_ORB'
        });
        createExplosion(b.pos.x, b.pos.y, b.color, 8);
      }

      // Boss Attack 2: Homing or Split missiles
      if (b.specialAttackTimer > 4200) {
        b.specialAttackTimer = 0;
        spawnObstacle(width, height, 1.2, 'HOMING');
        spawnObstacle(width, height, 1.2, 'FRAGMENTATION');
        addFloatingText(b.pos.x, b.pos.y - 25, "ATAQUE ESPECIAL!", b.color, 1.2);
      }

      // Check Boss Defeat
      if (b.health <= 0) {
        b.active = false;
        bossRef.current = null;
        notifyBossState(null);

        const configIdx = Math.min(Math.floor((b.level - 1) / 5), BOSS_CONFIGS.length - 1);
        const rewardCredits = BOSS_CONFIGS[configIdx]?.creditReward || 5000;
        
        triggerShake(30);
        createExplosion(b.pos.x, b.pos.y, b.color, 60);
        createExplosion(width / 2, height / 2, '#facc15', 40);
        addFloatingText(width / 2, height / 2 - 100, `CHEFE DERROTADO! +${rewardCredits} CR`, '#facc15', 2.2);
        soundEngine.playLevelUp();

        onBossDefeated?.(b.name, rewardCredits);

        if (gameMode === 'BOSS_RUSH') {
          setTimeout(() => {
            if (gameState === GameState.PLAYING) spawnBoss(b.level + 5, width, height);
          }, 3000);
        }
      }
    }

    const timeRamp = Math.min(0.5, (scoreRef.current / 5000));
    let difficultyMultiplier = 1 + ((levelRef.current - 1) * 0.15) + timeRamp;
    if (gameMode === 'ZEN') difficultyMultiplier *= 0.6;
    if (gameMode === 'TIME_ATTACK') difficultyMultiplier *= 1.3;
    const spawnRate = Math.max(180, (diffConfig.spawnRateMs) / difficultyMultiplier);
    if (time - lastSpawnTimeRef.current > spawnRate) {
      spawnObstacle(width, height, difficultyMultiplier);
      lastSpawnTimeRef.current = time;
    }

    let currentShieldArc = GAME_CONSTANTS.SHIELD_ARC;
    if (hasPowerUp('WIDE_SHIELD')) currentShieldArc = Math.PI / 1.5;
    const currentShieldRadius = hasPowerUp('MAGNET_SHIELD') ? GAME_CONSTANTS.SHIELD_RADIUS + 18 : GAME_CONSTANTS.SHIELD_RADIUS;

    obstaclesRef.current.forEach(obs => {
      // Homing missile logic
      if (obs.enemyType === 'HOMING' && obs.homingStrength) {
        const toCoreX = (width / 2) - obs.pos.x;
        const toCoreY = (height / 2) - obs.pos.y;
        const len = Math.sqrt(toCoreX * toCoreX + toCoreY * toCoreY);
        if (len > 0) {
          const desiredVx = (toCoreX / len) * GAME_CONSTANTS.OBSTACLE_BASE_SPEED * 1.2;
          const desiredVy = (toCoreY / len) * GAME_CONSTANTS.OBSTACLE_BASE_SPEED * 1.2;
          obs.velocity.x += (desiredVx - obs.velocity.x) * obs.homingStrength;
          obs.velocity.y += (desiredVy - obs.velocity.y) * obs.homingStrength;
        }
      }

      // GRAVITY_PULL Power-up: Attracts obstacles towards the shield line
      if (hasPowerUp('GRAVITY_PULL')) {
        const targetX = width / 2 + Math.cos(shieldAngleRef.current) * currentShieldRadius;
        const targetY = height / 2 + Math.sin(shieldAngleRef.current) * currentShieldRadius;
        const toShieldX = targetX - obs.pos.x;
        const toShieldY = targetY - obs.pos.y;
        const distShield = Math.sqrt(toShieldX * toShieldX + toShieldY * toShieldY);
        if (distShield > 0 && distShield < 220) {
          obs.velocity.x += (toShieldX / distShield) * 0.08;
          obs.velocity.y += (toShieldY / distShield) * 0.08;
        }
      }

      // CORE_REPULSOR Power-up: Repels projectiles from approaching core too closely
      if (hasPowerUp('CORE_REPULSOR')) {
        const toCoreX = obs.pos.x - width / 2;
        const toCoreY = obs.pos.y - height / 2;
        const distCore = Math.sqrt(toCoreX * toCoreX + toCoreY * toCoreY);
        if (distCore > 0 && distCore < 110) {
          obs.velocity.x += (toCoreX / distCore) * 0.18;
          obs.velocity.y += (toCoreY / distCore) * 0.18;
        }
      }

      let speedFactor = 1.0;
      if (hasPowerUp('TIME_FREEZE')) speedFactor *= 0.35;
      if (hasPowerUp('SLOW_TIME')) speedFactor *= 0.65;

      obs.pos.x += obs.velocity.x * speedFactor;
      obs.pos.y += obs.velocity.y * speedFactor;
      if (obs.enemyType === 'SPINNING_ASTEROID' && obs.spinAngle !== undefined) {
        obs.spinAngle += 0.06 * speedFactor;
      }
      const distToCenter = Math.sqrt(Math.pow(obs.pos.x - width/2, 2) + Math.pow(obs.pos.y - height/2, 2));

      // Core collision
      if (distToCenter < GAME_CONSTANTS.CORE_RADIUS + obs.radius) {
        obs.active = false;
        if (gameMode === 'ZEN') {
          createExplosion(width/2, height/2, themeColors.CORE, 8);
          return;
        }
        if (invulnerabilityTimerRef.current <= 0) {
          if (hasPowerUp('INVULNERABILITY_BOOST')) {
            invulnerabilityTimerRef.current = 4000;
            triggerShake(12);
            createExplosion(width/2, height/2, '#6366f1', 25);
            soundEngine.playShieldBlock(3);
            addFloatingText(width/2, height/2 - 50, "CAMPO DE FORÇA ABSORVIDO!", '#818cf8', 1.6);
            return;
          }

          healthRef.current -= diffConfig.damage;
          triggerShake(20);
          damageFlashRef.current = 1.0;
          createExplosion(width/2, height/2, themeColors.CORE, 20);
          soundEngine.playCoreHit();
          deflectComboRef.current = 0;
          onComboUpdate?.(0);
          onDamageFlash?.();
          onHealthUpdate(Math.max(0, healthRef.current));
          if (healthRef.current <= 0) {
            healthRef.current = 0;
            if (!gameOverFiredRef.current) {
              gameOverFiredRef.current = true;
              onGameOver(scoreRef.current);
            }
          }
          else {
            invulnerabilityTimerRef.current = 3000;
            addFloatingText(width/2, height/2 - 50, "ESCUDO DE EMERGÊNCIA!", themeColors.CORE);
          }
        } else {
            createExplosion(obs.pos.x, obs.pos.y, themeColors.CORE, 8);
            addFloatingText(obs.pos.x, obs.pos.y, "BLOQUEADO", themeColors.CORE);
        }
        return;
      }

      // Shield collision (Primary, Double Shield, and Triple Shield support)
      const shieldInner = currentShieldRadius - GAME_CONSTANTS.SHIELD_THICKNESS/2;
      const shieldOuter = currentShieldRadius + GAME_CONSTANTS.SHIELD_THICKNESS/2;
      if (distToCenter >= shieldInner - obs.radius && distToCenter <= shieldOuter + obs.radius) {
        let obsAngle = Math.atan2(obs.pos.y - height/2, obs.pos.x - width/2);
        let angleDiff = obsAngle - shieldAngleRef.current;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        let isDeflected = Math.abs(angleDiff) < currentShieldArc / 2;

        if (!isDeflected && hasPowerUp('DOUBLE_SHIELD')) {
          let oppAngleDiff = obsAngle - (shieldAngleRef.current + Math.PI);
          while (oppAngleDiff > Math.PI) oppAngleDiff -= 2 * Math.PI;
          while (oppAngleDiff < -Math.PI) oppAngleDiff += 2 * Math.PI;
          if (Math.abs(oppAngleDiff) < currentShieldArc / 2) {
            isDeflected = true;
          }
        }

        if (!isDeflected && hasPowerUp('TRIPLE_SHIELD')) {
          const angleOffset1 = (2 * Math.PI) / 3;
          const angleOffset2 = (4 * Math.PI) / 3;
          let diff1 = obsAngle - (shieldAngleRef.current + angleOffset1);
          while (diff1 > Math.PI) diff1 -= 2 * Math.PI;
          while (diff1 < -Math.PI) diff1 += 2 * Math.PI;

          let diff2 = obsAngle - (shieldAngleRef.current + angleOffset2);
          while (diff2 > Math.PI) diff2 -= 2 * Math.PI;
          while (diff2 < -Math.PI) diff2 += 2 * Math.PI;

          if (Math.abs(diff1) < currentShieldArc / 2 || Math.abs(diff2) < currentShieldArc / 2) {
            isDeflected = true;
          }
        }

        if (isDeflected) {
          // SHIELDED enemies require multiple hits to destroy
          if (obs.enemyType === 'SHIELDED' && obs.shieldHp !== undefined && obs.shieldHp > 1) {
            obs.shieldHp -= 1;
            obs.color = '#93c5fd';
            const bounceAngle = obsAngle + Math.PI + (Math.random() - 0.5) * 0.6;
            const bounceSpeed = GAME_CONSTANTS.OBSTACLE_BASE_SPEED * 0.6;
            obs.velocity = { x: Math.cos(bounceAngle) * bounceSpeed, y: Math.sin(bounceAngle) * bounceSpeed };
            createExplosion(obs.pos.x, obs.pos.y, '#60a5fa', 6);
            addFloatingText(obs.pos.x, obs.pos.y, 'ESCUDO!', '#60a5fa');
            soundEngine.playShieldBlock(1);
            onDeflectObstacle?.();
            const empGain = hasPowerUp('HYPER_EMP') ? 18 : 8;
            onEmpEnergyUpdate(Math.min(100, empEnergy + empGain));
            return;
          }

          // TRI_SPLIT enemies split into 3 smaller projectiles
          if (obs.enemyType === 'TRI_SPLIT' && !obs.isFragment) {
            for (let f = 0; f < 3; f++) {
              const fragAngle = obsAngle + Math.PI + ((f - 1) * 0.7);
              const fragSpeed = GAME_CONSTANTS.OBSTACLE_BASE_SPEED * 1.1;
              obstaclesRef.current.push({
                id: Math.random().toString(),
                pos: { x: obs.pos.x, y: obs.pos.y },
                velocity: { x: Math.cos(fragAngle) * fragSpeed, y: Math.sin(fragAngle) * fragSpeed },
                radius: 6,
                color: '#fbbf24',
                active: true,
                isFragment: true,
                enemyType: 'STANDARD'
              });
            }
          }

          obs.active = false;
          createExplosion(obs.pos.x, obs.pos.y, themeColors.SHIELD);
          triggerShake(5);

          // Audio combo feedback
          const now = performance.now();
          if (now - lastDeflectTimeRef.current < 1200) {
            deflectComboRef.current += 1;
          } else {
            deflectComboRef.current = 1;
          }
          lastDeflectTimeRef.current = now;
          soundEngine.playShieldBlock(deflectComboRef.current);
          totalDeflectsRef.current += 1;
          onComboUpdate?.(deflectComboRef.current);
          onTotalDeflects?.(totalDeflectsRef.current);

          // Notify parent for Quest/Achievement progress
          onDeflectObstacle?.();

          // Charge EMP Energy (+8% standard or +18% with HYPER_EMP)
          const empGain = hasPowerUp('HYPER_EMP') ? 18 : 8;
          const newEmp = Math.min(100, empEnergy + empGain);
          onEmpEnergyUpdate(newEmp);
          if (newEmp === 100 && empEnergy < 100) {
            addFloatingText(width / 2, height / 2 + 50, "EMP PRONTO! (ESPAÇO)", "#38bdf8", 1.4);
          }

          // Damage Boss if PLASMA_OVERCHARGE or BOSS_SLAYER_BOOST active
          if (bossRef.current && bossRef.current.active) {
            let bossDamage = 0;
            if (hasPowerUp('PLASMA_OVERCHARGE')) bossDamage += 25;
            if (hasPowerUp('BOSS_SLAYER_BOOST')) bossDamage += 50;

            if (bossDamage > 0) {
              bossRef.current.health -= bossDamage;
              notifyBossState({ ...bossRef.current });
              addFloatingText(bossRef.current.pos.x, bossRef.current.pos.y - 20, `-${bossDamage} DANO`, "#dc2626", 1.3);
            }
          }

          // CHAIN_LIGHTNING Power-up: shock arcs to nearest active obstacles
          if (hasPowerUp('CHAIN_LIGHTNING')) {
            let chained = 0;
            obstaclesRef.current.forEach(otherObs => {
              if (otherObs.id !== obs.id && otherObs.active && chained < 2) {
                const distArc = Math.hypot(otherObs.pos.x - obs.pos.x, otherObs.pos.y - obs.pos.y);
                if (distArc < 150) {
                  otherObs.active = false;
                  chained++;
                  lightningArcsRef.current.push({
                    x1: obs.pos.x, y1: obs.pos.y,
                    x2: otherObs.pos.x, y2: otherObs.pos.y,
                    life: 1.0
                  });
                  createExplosion(otherObs.pos.x, otherObs.pos.y, '#0ea5e9', 12);
                  scoreRef.current += 75;
                  onScoreUpdate(scoreRef.current);
                }
              }
            });
            if (chained > 0) {
              addFloatingText(obs.pos.x, obs.pos.y - 15, `RELÂMPAGO x${chained}`, '#0ea5e9', 1.2);
            }
          }

          // Fragmentation comet splitting
          if (obs.enemyType === 'FRAGMENTATION' && !obs.isFragment) {
            for (let f = 0; f < 2; f++) {
              const fragAngle = obsAngle + (f === 0 ? 0.6 : -0.6);
              const fragSpeed = GAME_CONSTANTS.OBSTACLE_BASE_SPEED * 1.3;
              obstaclesRef.current.push({
                id: Math.random().toString(),
                pos: { x: obs.pos.x, y: obs.pos.y },
                velocity: { x: Math.cos(fragAngle) * fragSpeed, y: Math.sin(fragAngle) * fragSpeed },
                radius: 7,
                color: '#2dd4bf',
                active: true,
                isFragment: true
              });
            }
          }
          
          // Pontuação baseada em bónus da roleta (com suporte para stacking)
          let scoreMultiplier = 1;
          if (hasPowerUp('SCORE_FRENZY_5X')) scoreMultiplier *= 5;
          if (hasPowerUp('TRIPLE_SCORE')) scoreMultiplier *= 3;
          if (hasPowerUp('DOUBLE_SCORE')) scoreMultiplier *= 2;
          if (gameMode === 'SURVIVAL') scoreMultiplier *= 1.3;

          let basePoints = 100 * scoreMultiplier;
          if (hasPowerUp('PLASMA_OVERCHARGE')) basePoints += 250;
          let points = Math.round(basePoints * diffConfig.scoreMultiplier);
          if (upgrades.luck > 0 && Math.random() < (upgrades.luck * 0.05)) points *= 3;
          scoreRef.current += points;
          onScoreUpdate(scoreRef.current);
          
          let scoreTextColor = '#fff';
          if (hasPowerUp('SCORE_FRENZY_5X')) scoreTextColor = '#fb923c';
          else if (hasPowerUp('PLASMA_OVERCHARGE')) scoreTextColor = '#d946ef';
          else if (hasPowerUp('TRIPLE_SCORE') && hasPowerUp('DOUBLE_SCORE')) scoreTextColor = '#f43f5e';
          else if (hasPowerUp('TRIPLE_SCORE')) scoreTextColor = '#38bdf8';
          else if (hasPowerUp('DOUBLE_SCORE')) scoreTextColor = '#fbbf24';
          
          addFloatingText(obs.pos.x, obs.pos.y, `+${points}`, scoreTextColor);

          // Efeito Explosivo de Onda de Choque
          if (hasPowerUp('EXPLOSIVE_DEFENSE')) {
            triggerShake(8);
            createExplosion(obs.pos.x, obs.pos.y, '#ef4444', 20);
            addFloatingText(obs.pos.x, obs.pos.y, "ONDA DE CHOQUE!", '#ef4444', 1.2);
            obstaclesRef.current.forEach(otherObs => {
              if (otherObs.id !== obs.id && otherObs.active) {
                const dx = otherObs.pos.x - obs.pos.x;
                const dy = otherObs.pos.y - obs.pos.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 85) {
                  otherObs.active = false;
                  createExplosion(otherObs.pos.x, otherObs.pos.y, '#f97316', 10);
                  const bonusPts = Math.round(50 * diffConfig.scoreMultiplier * scoreMultiplier);
                  scoreRef.current += bonusPts;
                  onScoreUpdate(scoreRef.current);
                }
              }
            });
          }
        }
      }
    });

    // ORBITAL_LASER Periodic Fire
    if (hasPowerUp('ORBITAL_LASER') && time - lastLaserTimeRef.current > 2200) {
      lastLaserTimeRef.current = time;
      // Target boss first or closest obstacle
      let targetPos: { x: number; y: number } | null = null;
      if (bossRef.current && bossRef.current.active) {
        targetPos = { x: bossRef.current.pos.x, y: bossRef.current.pos.y };
        bossRef.current.health -= 60;
        notifyBossState({ ...bossRef.current });
        addFloatingText(targetPos.x, targetPos.y - 30, "-60 LASER", "#f43f5e", 1.4);
      } else {
        const activeObs = obstaclesRef.current.filter(o => o.active);
        if (activeObs.length > 0) {
          activeObs.sort((a, b) => {
            const dA = Math.hypot(a.pos.x - width / 2, a.pos.y - height / 2);
            const dB = Math.hypot(b.pos.x - width / 2, b.pos.y - height / 2);
            return dA - dB;
          });
          const target = activeObs[0];
          target.active = false;
          targetPos = { x: target.pos.x, y: target.pos.y };
          createExplosion(target.pos.x, target.pos.y, '#f43f5e', 18);
          scoreRef.current += 120;
          onScoreUpdate(scoreRef.current);
        }
      }
      if (targetPos) {
        laserBeamsRef.current.push({
          x1: width / 2,
          y1: height / 2,
          x2: targetPos.x,
          y2: targetPos.y,
          life: 1.0,
          color: '#f43f5e'
        });
        soundEngine.playLaserDeflect();
      }
    }

    // Update Laser & Lightning VFX
    laserBeamsRef.current.forEach(b => { b.life -= 0.08; });
    laserBeamsRef.current = laserBeamsRef.current.filter(b => b.life > 0);
    lightningArcsRef.current.forEach(l => { l.life -= 0.1; });
    lightningArcsRef.current = lightningArcsRef.current.filter(l => l.life > 0);

    obstaclesRef.current = obstaclesRef.current.filter(o => o.active);
    particlesRef.current.forEach(p => { p.pos.x += p.velocity.x; p.pos.y += p.velocity.y; p.life -= 0.02; });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    floatingTextsRef.current.forEach(ft => { ft.y -= ft.velocity; ft.life -= 0.02; });
    floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    const themeColors = THEMES[currentTheme] || THEMES.DEFAULT;
    const cx = width / 2;
    const cy = height / 2;
    let shakeX = 0, shakeY = 0;
    if (shakeIntensityRef.current > 0) {
      shakeX = (Math.random() - 0.5) * shakeIntensityRef.current;
      shakeY = (Math.random() - 0.5) * shakeIntensityRef.current;
    }
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Stars background
    starsRef.current.forEach(star => {
      ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`; ctx.fill();
    });

    // EMP Shockwave — themed per hero skin
    if (empShockwaveRef.current.active) {
      const r = empShockwaveRef.current.radius;
      const op = empShockwaveRef.current.opacity;
      ctx.save();
      if (currentTheme === 'SPIDERMAN') {
        const webCount = 12;
        for (let i = 0; i < webCount; i++) {
          const angle = (i / webCount) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
          ctx.strokeStyle = `rgba(255, 255, 255, ${op * 0.7})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        for (let ring = 1; ring <= 4; ring++) {
          const ringR = r * (ring / 4);
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${op * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      } else if (currentTheme === 'THOR') {
        const boltCount = 8;
        for (let i = 0; i < boltCount; i++) {
          const angle = (i / boltCount) * Math.PI * 2 + performance.now() / 200;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          let px = cx, py = cy;
          const segs = 6;
          for (let s = 1; s <= segs; s++) {
            const dist = (r * s) / segs;
            const jitter = (Math.random() - 0.5) * 30;
            const nx = cx + Math.cos(angle + jitter * 0.01) * dist + jitter;
            const ny = cy + Math.sin(angle + jitter * 0.01) * dist + jitter;
            ctx.lineTo(nx, ny);
            px = nx; py = ny;
          }
          ctx.strokeStyle = `rgba(135, 206, 250, ${op})`;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#87CEFA';
          ctx.stroke();
        }
      } else if (currentTheme === 'HULK') {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 197, 94, ${op})`;
        ctx.lineWidth = 12;
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#22c55e';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 197, 94, ${op * 0.5})`;
        ctx.lineWidth = 8;
        ctx.stroke();
      } else if (currentTheme === 'IRONMAN') {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${op})`;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ef4444';
        ctx.stroke();
        const beamCount = 6;
        for (let i = 0; i < beamCount; i++) {
          const angle = (i / beamCount) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * GAME_CONSTANTS.CORE_RADIUS, cy + Math.sin(angle) * GAME_CONSTANTS.CORE_RADIUS);
          ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
          ctx.strokeStyle = `rgba(234, 179, 8, ${op * 0.8})`;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#eab308';
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${op})`;
        ctx.lineWidth = 6;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#38bdf8';
        ctx.stroke();
      }
      ctx.restore();
    }

    let coreColor = currentTheme === 'CUSTOM' ? customSkin.coreColor : themeColors.CORE;
    let coreGlow = currentTheme === 'CUSTOM' ? customSkin.coreColor : themeColors.CORE_GLOW;
    if (healthRef.current < 40) {
      coreColor = colorBlindMode ? '#f97316' : '#ef4444'; 
      coreGlow = colorBlindMode ? '#ea580c' : '#b91c1c';
    } 

    if (invulnerabilityTimerRef.current > 0) {
      const percent = invulnerabilityTimerRef.current / 3000;
      ctx.save(); ctx.translate(cx, cy);
      const pulse = Math.sin(performance.now() / 100) * 3;
      ctx.beginPath(); ctx.arc(0, 0, GAME_CONSTANTS.CORE_RADIUS + 15 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = coreColor + "33"; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = coreColor; ctx.shadowBlur = 15; ctx.shadowColor = coreGlow; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, GAME_CONSTANTS.CORE_RADIUS + 20, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * percent));
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"; ctx.lineWidth = 2; ctx.shadowBlur = 0; ctx.stroke();
      ctx.restore();
    }

    const pulseScale = 1 + corePulseRef.current * (healthRef.current < 40 ? 0.3 : 0.1);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pulseScale, pulseScale);
    ctx.beginPath(); ctx.arc(0, 0, GAME_CONSTANTS.CORE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = coreColor; ctx.shadowBlur = 20 + (corePulseRef.current * 10); ctx.shadowColor = coreGlow; ctx.fill();

    // Custom Skin Patterns on Core
    if (currentTheme === 'CUSTOM' && healthRef.current >= 40) {
      ctx.save();
      if (customSkin.pattern === 'WEB') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * GAME_CONSTANTS.CORE_RADIUS, Math.sin(a) * GAME_CONSTANTS.CORE_RADIUS); ctx.stroke();
        }
        for (let r = 6; r <= GAME_CONSTANTS.CORE_RADIUS; r += 6) {
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (customSkin.pattern === 'NEON_RINGS') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; ctx.lineWidth = 1.5;
        const t = performance.now() / 500;
        ctx.beginPath(); ctx.arc(0, 0, 8 + Math.sin(t) * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 14 + Math.cos(t) * 3, 0, Math.PI * 2); ctx.stroke();
      } else if (customSkin.pattern === 'ENERGY_MATRIX') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const hx = Math.cos(a) * 11; const hy = Math.sin(a) * 11;
          if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
        }
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
      } else if (customSkin.pattern === 'GOLD_STARS') {
        ctx.fillStyle = '#fef08a';
        [-1, 1].forEach(dx => {
          [-1, 1].forEach(dy => {
            ctx.beginPath(); ctx.arc(dx * 8, dy * 8, 2, 0, Math.PI * 2); ctx.fill();
          });
        });
        ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.restore();
    }

    if (healthRef.current < maxHealth) {
       ctx.beginPath();
       const healthPct = Math.max(0, healthRef.current / maxHealth);
       ctx.arc(0, 0, GAME_CONSTANTS.CORE_RADIUS + 5, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * healthPct));
       ctx.strokeStyle = coreColor; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();

    let currentShieldArc = GAME_CONSTANTS.SHIELD_ARC;
    const currentShieldRadius = hasPowerUp('MAGNET_SHIELD') ? GAME_CONSTANTS.SHIELD_RADIUS + 18 : GAME_CONSTANTS.SHIELD_RADIUS;
    let shieldColor = currentTheme === 'CUSTOM' ? customSkin.shieldColor : themeColors.SHIELD;
    let shieldGlow = currentTheme === 'CUSTOM' ? customSkin.shieldColor : themeColors.SHIELD_GLOW;
    if (hasPowerUp('WIDE_SHIELD')) currentShieldArc = Math.PI / 1.5;

    // Draw Plasma Motion Trails for Shield
    if (!highPerformance && shieldTrailsRef.current.length > 0) {
      shieldTrailsRef.current.forEach(tPoint => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tPoint.angle);
        ctx.beginPath();
        ctx.arc(0, 0, currentShieldRadius, -currentShieldArc / 2, currentShieldArc / 2);
        ctx.strokeStyle = shieldColor;
        ctx.globalAlpha = tPoint.alpha * 0.35;
        ctx.lineWidth = GAME_CONSTANTS.SHIELD_THICKNESS * 0.8;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      });
    }

    // Magnetic force field aura if MAGNET_SHIELD active
    if (hasPowerUp('MAGNET_SHIELD')) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      ctx.arc(0, 0, currentShieldRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();
    }

    // Directional aim trajectory beam (guides mouse on desktop & touch on mobile)
    if (gameState === GameState.PLAYING) {
      ctx.save();
      ctx.translate(cx, cy);
      // Subtle orbital guide ring
      ctx.beginPath();
      ctx.arc(0, 0, currentShieldRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Directional dashed aiming ray
      ctx.rotate(shieldAngleRef.current);
      ctx.beginPath();
      ctx.moveTo(GAME_CONSTANTS.CORE_RADIUS + 6, 0);
      ctx.lineTo(currentShieldRadius - 8, 0);
      ctx.strokeStyle = (currentTheme === 'VOID' ? '#94a3b8' : shieldColor) + '55';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    // Active Shield (Primary)
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(shieldAngleRef.current);
    ctx.beginPath(); ctx.arc(0, 0, currentShieldRadius, -currentShieldArc/2, currentShieldArc/2);
    ctx.strokeStyle = currentTheme === 'VOID' ? '#FFFFFF' : shieldColor;
    ctx.lineWidth = GAME_CONSTANTS.SHIELD_THICKNESS; ctx.lineCap = 'round'; ctx.shadowBlur = 15; ctx.shadowColor = shieldGlow; ctx.stroke();
    ctx.restore();

    // Active Double Shield (180 degrees mirrored shield)
    if (hasPowerUp('DOUBLE_SHIELD')) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(shieldAngleRef.current + Math.PI);
      ctx.beginPath(); ctx.arc(0, 0, currentShieldRadius, -currentShieldArc/2, currentShieldArc/2);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = GAME_CONSTANTS.SHIELD_THICKNESS; ctx.lineCap = 'round'; ctx.shadowBlur = 16; ctx.shadowColor = '#059669'; ctx.stroke();
      ctx.restore();
    }

    // Active Triple Shield (3 shields spaced at 120 degrees)
    if (hasPowerUp('TRIPLE_SHIELD')) {
      const angleOffset1 = (2 * Math.PI) / 3;
      const angleOffset2 = (4 * Math.PI) / 3;

      ctx.save(); ctx.translate(cx, cy); ctx.rotate(shieldAngleRef.current + angleOffset1);
      ctx.beginPath(); ctx.arc(0, 0, currentShieldRadius, -currentShieldArc/2, currentShieldArc/2);
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = GAME_CONSTANTS.SHIELD_THICKNESS; ctx.lineCap = 'round'; ctx.shadowBlur = 16; ctx.shadowColor = '#0d9488'; ctx.stroke();
      ctx.restore();

      ctx.save(); ctx.translate(cx, cy); ctx.rotate(shieldAngleRef.current + angleOffset2);
      ctx.beginPath(); ctx.arc(0, 0, currentShieldRadius, -currentShieldArc/2, currentShieldArc/2);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = GAME_CONSTANTS.SHIELD_THICKNESS; ctx.lineCap = 'round'; ctx.shadowBlur = 16; ctx.shadowColor = '#0891b2'; ctx.stroke();
      ctx.restore();
    }

    // Gravity Pull Vortex Aura
    if (hasPowerUp('GRAVITY_PULL')) {
      ctx.save(); ctx.translate(cx, cy);
      const rot = performance.now() / 600;
      ctx.rotate(rot);
      ctx.beginPath(); ctx.arc(0, 0, currentShieldRadius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      ctx.stroke();
      ctx.restore();
    }

    // Core Repulsor Kinetic Ring
    if (hasPowerUp('CORE_REPULSOR')) {
      ctx.save(); ctx.translate(cx, cy);
      const pulseRep = (performance.now() / 250) % Math.PI;
      const rRep = GAME_CONSTANTS.CORE_RADIUS + 15 + Math.sin(pulseRep) * 25;
      ctx.beginPath(); ctx.arc(0, 0, rRep, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(162, 28, 175, ${0.6 - Math.sin(pulseRep) * 0.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Invulnerability Protective Shield Ring
    if (hasPowerUp('INVULNERABILITY_BOOST')) {
      ctx.save(); ctx.translate(cx, cy);
      const pulseT = (performance.now() / 400);
      ctx.beginPath(); ctx.arc(0, 0, GAME_CONSTANTS.CORE_RADIUS + 12 + Math.sin(pulseT) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#6366f1';
      ctx.stroke();
      ctx.restore();
    }

    // Draw Boss if active
    if (bossRef.current && bossRef.current.active) {
      const b = bossRef.current;
      ctx.save();
      ctx.translate(b.pos.x, b.pos.y);

      // Boss glowing aura
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fillStyle = b.color + '22';
      ctx.fill();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = b.color;
      ctx.stroke();

      // Boss Body (Octagon Hull)
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + (performance.now() / 600);
        const r = 22;
        const bx = Math.cos(a) * r;
        const by = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Boss Pulsing Core Eye
      ctx.beginPath();
      ctx.arc(0, 0, 8 + Math.sin(performance.now() / 200) * 2, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = b.color;
      ctx.fill();

      // Boss Overhead Health Bar in World
      const barW = 60;
      const barH = 6;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-barW / 2, -38, barW, barH);
      const hpPct = Math.max(0, b.health / b.maxHealth);
      ctx.fillStyle = b.color;
      ctx.fillRect(-barW / 2, -38, barW * hpPct, barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2, -38, barW, barH);

      ctx.restore();
    }

    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.save();
      ctx.beginPath(); ctx.arc(obs.pos.x, obs.pos.y, obs.radius, 0, Math.PI * 2);
      ctx.fillStyle = obs.color; ctx.shadowBlur = 12; ctx.shadowColor = obs.color; ctx.fill();

      // Projectile specialized details
      if (obs.enemyType === 'HOMING') {
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (obs.enemyType === 'FRAGMENTATION') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(obs.pos.x, obs.pos.y, obs.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.enemyType === 'LASER_BEAM') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obs.pos.x - obs.velocity.x * 3, obs.pos.y - obs.velocity.y * 3);
        ctx.lineTo(obs.pos.x, obs.pos.y);
        ctx.stroke();
      } else if (obs.enemyType === 'SHIELDED') {
        ctx.strokeStyle = obs.shieldHp && obs.shieldHp > 1 ? '#3b82f6' : '#93c5fd';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(obs.pos.x, obs.pos.y, obs.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
        if (obs.shieldHp && obs.shieldHp > 1) {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(obs.pos.x, obs.pos.y, obs.radius + 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (obs.enemyType === 'TRI_SPLIT') {
        ctx.fillStyle = '#fde047';
        const triR = obs.radius * 0.35;
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + performance.now() * 0.003;
          ctx.beginPath();
          ctx.arc(obs.pos.x + Math.cos(a) * obs.radius * 0.5, obs.pos.y + Math.sin(a) * obs.radius * 0.5, triR, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (obs.enemyType === 'SPINNING_ASTEROID') {
        ctx.save();
        ctx.translate(obs.pos.x, obs.pos.y);
        ctx.rotate(obs.spinAngle || 0);
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        const sides = 7;
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2;
          const r = obs.radius * (0.75 + Math.sin(i * 2.3) * 0.25);
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    });

    // Draw Orbital Laser Beams
    laserBeamsRef.current.forEach(b => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = b.life;
      ctx.lineWidth = 4 * b.life;
      ctx.shadowBlur = 20;
      ctx.shadowColor = b.color;
      ctx.stroke();

      // Laser core white beam
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * b.life;
      ctx.stroke();
      ctx.restore();
    });

    // Draw Lightning Arcs
    lightningArcsRef.current.forEach(l => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      // Midpoint jagged offset
      const midX = (l.x1 + l.x2) / 2 + (Math.random() - 0.5) * 20;
      const midY = (l.y1 + l.y2) / 2 + (Math.random() - 0.5) * 20;
      ctx.lineTo(midX, midY);
      ctx.lineTo(l.x2, l.y2);
      ctx.strokeStyle = '#38bdf8';
      ctx.globalAlpha = l.life;
      ctx.lineWidth = 2.5 * l.life;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#0ea5e9';
      ctx.stroke();
      ctx.restore();
    });

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fill();
    });

    // Draw Floating Texts
    floatingTextsRef.current.forEach(ft => {
      ctx.save();
      const isLevelText = ft.text.includes("NÍVEL") || ft.text.includes("ALERTA") || ft.text.includes("CHEFE");
      ctx.font = isLevelText ? "bold 28px monospace" : "bold 15px monospace";
      ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life;
      ctx.fillText(ft.text, ft.x - (ctx.measureText(ft.text).width / 2), ft.y);
      ctx.restore();
    });

    // Damage flash overlay
    if (damageFlashRef.current > 0) {
      ctx.save();
      ctx.fillStyle = colorBlindMode ? `rgba(249, 115, 22, ${damageFlashRef.current * 0.35})` : `rgba(239, 68, 68, ${damageFlashRef.current * 0.35})`;
      ctx.fillRect(-shakeX, -shakeY, width, height);
      damageFlashRef.current -= 0.04;
      if (damageFlashRef.current < 0) damageFlashRef.current = 0;
      ctx.restore();
    }

    // Combo display on canvas
    if (deflectComboRef.current >= 3 && performance.now() - lastDeflectTimeRef.current < 1500) {
      ctx.save();
      const comboAlpha = Math.min(1, 1 - (performance.now() - lastDeflectTimeRef.current - 800) / 700);
      if (comboAlpha > 0) {
        ctx.globalAlpha = comboAlpha;
        ctx.font = `bold ${Math.min(48, 24 + deflectComboRef.current * 3)}px system-ui, sans-serif`;
        ctx.fillStyle = '#facc15';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText(`COMBO x${deflectComboRef.current}`, cx, cy + 90);
      }
      ctx.restore();
    }

    ctx.restore();
  };

  const loop = (time: number) => {
    const canvas = canvasRef.current;
    if (canvas) {
      update(time, canvas.width, canvas.height);
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx, canvas.width, canvas.height);
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, gameMode, activePowerUp, activePowerUps, currentTheme, difficulty, highPerformance, upgrades, colorBlindMode, empEnergy]); 

  useEffect(() => {
    const handleResize = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } };
    window.addEventListener('resize', handleResize); handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 block cursor-crosshair" />;
};

export default GameCanvas;
