// ゲームの状態
export type GameScreen = 'title' | 'playing' | 'paused' | 'cleared' | 'gameover';

// 位置
export interface Position {
  x: number;
  y: number;
}

// 速度
export interface Velocity {
  x: number;
  y: number;
}

// タコの状態
export type TakoState = 'idle' | 'charging' | 'jumping' | 'dead';

// タコ
export interface Tako {
  position: Position;
  velocity: Velocity;
  state: TakoState;
  chargeStartTime: number | null;
  chargeRatio: number;
  isGrounded: boolean;
  facingRight: boolean;
  airChargeLockedVelocityX: number | null; // 空中チャージ開始時のx速度（慣性保持用）
}

// 床のタイプ
export type PlatformType = 'normal' | 'ice' | 'caterpillar';

// 床
export interface Platform {
  x: number;
  y: number;
  width: number;
  type: PlatformType;
  blockCount: number; // ブロック数（整数）
  caterpillarOffset?: number; // キャタピラのアニメーションオフセット
  caterpillarDirection?: 1 | -1; // キャタピラの移動方向
}

// うなぎ（スーパージャンプアイテム）
export interface Eel {
  x: number;
  y: number;
  size: number;
  isCollected: boolean; // 取得済みかどうか
  rotation: number; // 回転アニメーション用
}

// 月（ゴール）
export interface Moon {
  x: number;
  y: number;
  size: number;
}

// 水
export interface Water {
  y: number;
  speed: number;
  isRising: boolean;
  waveOffset: number;
}

// 星（背景装飾）
export interface Star {
  x: number;
  y: number;
  size: number;
  type: 'dot' | 'cross' | 'crescent' | 'sparkle';
}

// カメラ
export interface Camera {
  y: number;
  targetY: number;
}

// ゲーム状態
export interface GameState {
  screen: GameScreen;
  stage: number;
  score: number;
  highScore: number;
  lives: number;
  stageStartTime: number;
  elapsedTime: number;
  tako: Tako;
  platforms: Platform[];
  eels: Eel[];
  moon: Moon;
  water: Water;
  camera: Camera;
  stars: Star[];
  isHighScoreUpdated: boolean;
}

// 入力状態
export interface InputState {
  isPressed: boolean;
  startPosition: Position | null;
  currentPosition: Position | null;
  touchId: number | null;
}
