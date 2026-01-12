// ゲーム設定
export const CONFIG = {
  // 画面
  CANVAS_WIDTH: 390,
  CANVAS_HEIGHT: 844,

  // タコ
  TAKO: {
    WIDTH: 29, // 28 * 1.05
    HEIGHT: 35, // 33 * 1.05
    GRAVITY: 0.36, // 重力加速度
    MAX_FALL_SPEED: 10.5,
    AIR_CONTROL: 2.5, // 空中での横移動強度（チャージ中以外）
    AIR_CONTROL_CHARGING: 0.05, // チャージ中の空中横移動強度
  },

  // ジャンプ
  JUMP: {
    MAX_CHARGE_TIME: 1000,
    MAX_VELOCITY: 15.8, // 重力0.36で最大高さ345px維持
    MIN_VELOCITY: 5.3, // MIN_VELOCITY / MAX比率維持
    MIN_ANGLE: Math.PI * (50 / 180), // 50°
    MAX_ANGLE: Math.PI * (130 / 180), // 130°
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
    // 摩擦0: 着地時の水平速度がそのまま滑り速度になる（入射角に比例）
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
      totalHeight: 5.3,
      platformCount: 12,
      firstPlatformGap: 180, // 地面→最初の足場（MAXジャンプ328px以下）
      blockCountMin: 10, // 広い足場（1つ飛ばしOK）
      blockCountMax: 14,
      gapMin: 150, // 簡単（1つ飛ばし可能）
      gapMax: 200,
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
      totalHeight: 5.3,
      platformCount: 12,
      firstPlatformGap: 200,
      blockCountMin: 4, // 狭い足場（1つずつ必須）
      blockCountMax: 8,
      gapMin: 220, // 難しい（1つずつ）
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
      totalHeight: 5.3,
      platformCount: 12,
      firstPlatformGap: 180,
      blockCountMin: 8, // 広め（1つ飛ばしOK）
      blockCountMax: 12,
      gapMin: 150,
      gapMax: 200,
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
      totalHeight: 5.3,
      platformCount: 12,
      firstPlatformGap: 220,
      blockCountMin: 4, // 狭い
      blockCountMax: 8,
      gapMin: 220,
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
      totalHeight: 5.3,
      platformCount: 12,
      firstPlatformGap: 250,
      blockCountMin: 4, // 狭い
      blockCountMax: 7,
      gapMin: 250, // 難しい（ギリギリ）
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
      totalHeight: 7.1,
      platformCount: 16,
      firstPlatformGap: 180,
      blockCountMin: 8, // 広め
      blockCountMax: 12,
      gapMin: 150,
      gapMax: 220,
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
      totalHeight: 8.0,
      platformCount: 18,
      firstPlatformGap: 200,
      blockCountMin: 4, // 狭い
      blockCountMax: 8,
      gapMin: 200,
      gapMax: 260,
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
      totalHeight: 6.2,
      platformCount: 14,
      firstPlatformGap: 200,
      blockCountMin: 6,
      blockCountMax: 10,
      gapMin: 180,
      gapMax: 250,
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
      totalHeight: 7.1,
      platformCount: 16,
      firstPlatformGap: 220,
      blockCountMin: 4, // 狭い
      blockCountMax: 8,
      gapMin: 220,
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
      totalHeight: 7.1,
      platformCount: 16,
      firstPlatformGap: 250,
      blockCountMin: 4, // 狭い
      blockCountMax: 7,
      gapMin: 250, // 難しい
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
