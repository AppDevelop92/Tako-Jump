// ゲーム設定
export const CONFIG = {
  // 画面
  CANVAS_WIDTH: 390,
  CANVAS_HEIGHT: 844,

  // タコ（画面幅の1/14）
  TAKO: {
    WIDTH: 28,
    HEIGHT: 33,
    GRAVITY: 0.4, // 重力加速度
    MAX_FALL_SPEED: 10.5,
    AIR_CONTROL: 0.3,
  },

  // ジャンプ
  JUMP: {
    MAX_CHARGE_TIME: 1000,
    MAX_VELOCITY: 16.2, // 18 * 0.9 = 16.2（ジャンプ速度を0.9倍に）
    MIN_VELOCITY: 5.4, // 6 * 0.9 = 5.4
    MIN_ANGLE: Math.PI * 0.25,
    MAX_ANGLE: Math.PI * 0.75,
  },

  // 床（ブロックはタコ幅の半分の正方形）
  PLATFORM: {
    BLOCK_SIZE: 14,
    HEIGHT: 14,
  },

  // 月（ゴール）
  MOON: {
    SIZE: 80,
  },

  // 水
  WATER: {
    WAVE_HEIGHT: 12,
    WAVE_SPEED: 0.05,
    FOAM_SIZE: 4, // 飛沫のサイズ（1/4に縮小: 8px * 0.5 = 4px、面積1/4）
  },

  // カラーパレット
  COLORS: {
    BACKGROUND: '#2D2A5A',
    PLATFORM: '#E8A87C',
    PLATFORM_LIGHT: '#F0C8A8',
    GROUND: '#1E1B3A',
    GROUND_LINE: '#3D3A6A',
    WATER: '#660099',
    MOON: '#FFD93D',
    STAR: '#9B8AC4',
    STAR_BRIGHT: '#C9B8E0',
    CRESCENT: '#7B68A6',
    UI_BG: 'rgba(0, 0, 0, 0.8)',
    UI_BORDER: '#FFFFFF',
  },

  // 氷の足場設定
  ICE: {
    FRICTION: 0.98, // 毎フレームの減衰率
    LANDING_SPEED_FACTOR: 0.7, // 着地時の滑り速度係数（0.7倍に）
    COLOR: '#87CEEB',
    COLOR_LIGHT: '#B0E0E6',
  },

  // キャタピラ床設定
  CATERPILLAR: {
    SPEED: 1.5, // キャタピラの移動速度
    COLOR_LIGHT: '#A0A0A0',
    COLOR_DARK: '#606060',
    SEGMENT_WIDTH: 7, // セグメントの幅
  },

  // うなぎ設定
  EEL: {
    SIZE: 32, // うなぎのサイズ
    SUPER_JUMP_VELOCITY: 24, // スーパージャンプ速度
    COLOR: '#FF6B6B', // 薄い赤色
    COLOR_LIGHT: '#FF8E8E',
    ROTATION_SPEED: 0.02, // 回転速度
  },

  // ジャンプの横移動係数
  HORIZONTAL_FACTOR: 0.7, // 横移動距離を0.7倍に

  // ステージ設定
  // 高さ単位: 10 = MAXジャンプ1回分 (約375px)
  // totalHeight = stageHeight / 22.5 (画面数に変換)
  // platformCount = stageHeight / 10 (床数)
  STAGES: [
    {
      id: 1,
      name: 'Stage 1',
      totalHeight: 5.3, // 高さ120 = 12床分
      platformCount: 12,
      blockCountMin: 10, // 簡単
      blockCountMax: 14,
      gapMin: 180, // 簡単
      gapMax: 240,
      normalRatio: 1.0,
      iceRatio: 0,
      caterpillarRatio: 0,
      eelCount: 0,
      waterSpeed: 0.6,
      waterDelay: 8000,
      baseTime: 45,
    },
    {
      id: 2,
      name: 'Stage 2',
      totalHeight: 5.3, // 高さ120
      platformCount: 12,
      blockCountMin: 4, // 難しい
      blockCountMax: 8,
      gapMin: 200, // 難しい（足場幅が狭いので間隔は抑える）
      gapMax: 280,
      normalRatio: 1.0,
      iceRatio: 0,
      caterpillarRatio: 0,
      eelCount: 0,
      waterSpeed: 0.8,
      waterDelay: 6000,
      baseTime: 50,
    },
    {
      id: 3,
      name: 'Stage 3',
      totalHeight: 5.3, // 高さ120
      platformCount: 12,
      blockCountMin: 6, // 普通
      blockCountMax: 10,
      gapMin: 180, // 簡単
      gapMax: 240,
      normalRatio: 0.5,
      iceRatio: 0.5,
      caterpillarRatio: 0,
      eelCount: 0,
      waterSpeed: 1.0,
      waterDelay: 5000,
      baseTime: 55,
    },
    {
      id: 4,
      name: 'Stage 4',
      totalHeight: 5.3, // 高さ120
      platformCount: 12,
      blockCountMin: 4, // 難しい
      blockCountMax: 8,
      gapMin: 200, // 普通
      gapMax: 280,
      normalRatio: 0.3,
      iceRatio: 0.7,
      caterpillarRatio: 0,
      eelCount: 0,
      waterSpeed: 1.1,
      waterDelay: 5000,
      baseTime: 60,
    },
    {
      id: 5,
      name: 'Stage 5',
      totalHeight: 5.3, // 高さ120
      platformCount: 12,
      blockCountMin: 4, // 難しい
      blockCountMax: 8,
      gapMin: 220, // 難しい
      gapMax: 300,
      normalRatio: 0,
      iceRatio: 1.0,
      caterpillarRatio: 0,
      eelCount: 0,
      waterSpeed: 1.4,
      waterDelay: 3000,
      baseTime: 65,
    },
    {
      id: 6,
      name: 'Stage 6',
      totalHeight: 7.1, // 高さ160
      platformCount: 16,
      blockCountMin: 6, // 普通
      blockCountMax: 10,
      gapMin: 200, // 普通
      gapMax: 280,
      normalRatio: 0.8,
      iceRatio: 0.2,
      caterpillarRatio: 0,
      eelCount: 3,
      waterSpeed: 1.0,
      waterDelay: 6000,
      baseTime: 70,
    },
    {
      id: 7,
      name: 'Stage 7',
      totalHeight: 8.0, // 高さ180
      platformCount: 18,
      blockCountMin: 4, // 難しい
      blockCountMax: 8,
      gapMin: 200, // 普通
      gapMax: 280,
      normalRatio: 0.6,
      iceRatio: 0.4,
      caterpillarRatio: 0,
      eelCount: 5,
      waterSpeed: 1.2,
      waterDelay: 5000,
      baseTime: 80,
    },
    {
      id: 8,
      name: 'Stage 8',
      totalHeight: 6.2, // 高さ140
      platformCount: 14,
      blockCountMin: 6, // 普通
      blockCountMax: 10,
      gapMin: 200, // 普通
      gapMax: 280,
      normalRatio: 0.4,
      iceRatio: 0.4,
      caterpillarRatio: 0.2,
      eelCount: 2,
      waterSpeed: 1.3,
      waterDelay: 5000,
      baseTime: 65,
    },
    {
      id: 9,
      name: 'Stage 9',
      totalHeight: 7.1, // 高さ160
      platformCount: 16,
      blockCountMin: 4, // 難しい
      blockCountMax: 8,
      gapMin: 200, // 普通
      gapMax: 280,
      normalRatio: 0.2,
      iceRatio: 0.4,
      caterpillarRatio: 0.4,
      eelCount: 2,
      waterSpeed: 1.4,
      waterDelay: 4000,
      baseTime: 75,
    },
    {
      id: 10,
      name: 'Stage 10',
      totalHeight: 7.1, // 高さ160
      platformCount: 16,
      blockCountMin: 4, // 難しい
      blockCountMax: 8,
      gapMin: 220, // 難しい
      gapMax: 300,
      normalRatio: 0,
      iceRatio: 0.4,
      caterpillarRatio: 0.6,
      eelCount: 2,
      waterSpeed: 1.6,
      waterDelay: 3000,
      baseTime: 80,
    },
  ],

  // ゲームシステム
  LIVES: 3,
  BASE_SCORE: 1000,
  TIME_BONUS_MULTIPLIER: 10,
} as const;

export type StageConfig = typeof CONFIG.STAGES[number];
