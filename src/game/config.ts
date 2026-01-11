// ゲーム設定
export const CONFIG = {
  // 画面
  CANVAS_WIDTH: 390,
  CANVAS_HEIGHT: 844,

  // タコ
  TAKO: {
    WIDTH: 48,
    HEIGHT: 56,
    GRAVITY: 0.5,
    MAX_FALL_SPEED: 15,
    AIR_CONTROL: 0.3,
  },

  // ジャンプ
  JUMP: {
    MAX_CHARGE_TIME: 1500, // ミリ秒
    MAX_VELOCITY: 18,
    MIN_VELOCITY: 6,
    MIN_ANGLE: Math.PI * 0.25, // 45度
    MAX_ANGLE: Math.PI * 0.75, // 135度
  },

  // 床
  PLATFORM: {
    HEIGHT: 16,
    TILE_SIZE: 16,
  },

  // 月（ゴール）
  MOON: {
    SIZE: 80,
  },

  // 水
  WATER: {
    WAVE_HEIGHT: 12,
    WAVE_SPEED: 0.05,
  },

  // カラーパレット
  COLORS: {
    BACKGROUND: '#2D2A5A',
    PLATFORM: '#E8A87C',
    PLATFORM_LIGHT: '#F0C8A8',
    WATER: '#CC00FF',
    MOON: '#FFD93D',
    STAR: '#9B8AC4',
    STAR_BRIGHT: '#C9B8E0',
    CRESCENT: '#7B68A6',
    UI_BG: 'rgba(0, 0, 0, 0.8)',
    UI_BORDER: '#FFFFFF',
  },

  // ステージ設定
  STAGES: [
    {
      id: 1,
      name: 'Tutorial',
      totalHeight: 3,
      platformCount: 8,
      platformWidthMin: 160,
      platformWidthMax: 200,
      gapMin: 120,
      gapMax: 160,
      waterSpeed: 0.3,
      waterDelay: 8000,
      baseTime: 30,
    },
    {
      id: 2,
      name: 'Basic',
      totalHeight: 3.5,
      platformCount: 7,
      platformWidthMin: 120,
      platformWidthMax: 160,
      gapMin: 140,
      gapMax: 180,
      waterSpeed: 0.4,
      waterDelay: 6000,
      baseTime: 35,
    },
    {
      id: 3,
      name: 'Zigzag',
      totalHeight: 4,
      platformCount: 8,
      platformWidthMin: 100,
      platformWidthMax: 140,
      gapMin: 160,
      gapMax: 200,
      waterSpeed: 0.5,
      waterDelay: 5000,
      baseTime: 40,
    },
    {
      id: 4,
      name: 'Precision',
      totalHeight: 4,
      platformCount: 9,
      platformWidthMin: 80,
      platformWidthMax: 100,
      gapMin: 160,
      gapMax: 180,
      waterSpeed: 0.55,
      waterDelay: 5000,
      baseTime: 45,
    },
    {
      id: 5,
      name: 'Speed',
      totalHeight: 4.5,
      platformCount: 10,
      platformWidthMin: 100,
      platformWidthMax: 120,
      gapMin: 160,
      gapMax: 200,
      waterSpeed: 0.7,
      waterDelay: 3000,
      baseTime: 50,
    },
  ],

  // ゲームシステム
  LIVES: 3,
  BASE_SCORE: 1000,
  TIME_BONUS_MULTIPLIER: 10,
} as const;

export type StageConfig = typeof CONFIG.STAGES[number];
