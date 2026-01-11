import { CONFIG } from './config';
import type { StageConfig } from './config';
import type { Platform, Moon, Star, Water } from './types';

// 乱数生成
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// 床を生成
export function generatePlatforms(stageConfig: StageConfig): Platform[] {
  const platforms: Platform[] = [];
  const startY = CONFIG.CANVAS_HEIGHT - 100; // スタート地点

  // スタート床
  platforms.push({
    x: 50,
    y: startY,
    width: 150,
  });

  let currentY = startY;
  let lastX = 50;
  const zigzag = stageConfig.id >= 3; // Stage 3以降はジグザグ配置

  for (let i = 1; i < stageConfig.platformCount; i++) {
    const gap = randomInRange(stageConfig.gapMin, stageConfig.gapMax);
    currentY -= gap;

    const width = randomInRange(stageConfig.platformWidthMin, stageConfig.platformWidthMax);

    let x: number;
    if (zigzag) {
      // ジグザグ配置
      if (i % 2 === 1) {
        x = randomInRange(CONFIG.CANVAS_WIDTH * 0.5, CONFIG.CANVAS_WIDTH - width - 20);
      } else {
        x = randomInRange(20, CONFIG.CANVAS_WIDTH * 0.3);
      }
    } else {
      // ランダム配置（前の床から到達可能な範囲）
      const maxHorizontalJump = CONFIG.CANVAS_WIDTH * 0.6;
      const minX = Math.max(20, lastX - maxHorizontalJump);
      const maxX = Math.min(CONFIG.CANVAS_WIDTH - width - 20, lastX + maxHorizontalJump);
      x = randomInRange(minX, maxX);
    }

    platforms.push({ x, y: currentY, width });
    lastX = x;
  }

  return platforms;
}

// 月を生成
export function generateMoon(platforms: Platform[]): Moon {
  // 最も高い床の上に月を配置
  const highestPlatform = platforms.reduce((highest, p) =>
    p.y < highest.y ? p : highest
  );

  return {
    x: CONFIG.CANVAS_WIDTH / 2 - CONFIG.MOON.SIZE / 2,
    y: highestPlatform.y - 200,
    size: CONFIG.MOON.SIZE,
  };
}

// 水を初期化
export function initWater(stageConfig: StageConfig): Water {
  return {
    y: CONFIG.CANVAS_HEIGHT + 200, // 画面外から開始
    speed: stageConfig.waterSpeed,
    isRising: false,
    waveOffset: 0,
  };
}

// 星を生成
export function generateStars(totalHeight: number): Star[] {
  const stars: Star[] = [];
  const starCount = Math.floor(totalHeight / CONFIG.CANVAS_HEIGHT * 30);

  for (let i = 0; i < starCount; i++) {
    const types: Star['type'][] = ['dot', 'cross', 'crescent', 'sparkle'];
    const type = types[Math.floor(Math.random() * types.length)];

    stars.push({
      x: Math.random() * CONFIG.CANVAS_WIDTH,
      y: -totalHeight + Math.random() * (totalHeight + CONFIG.CANVAS_HEIGHT),
      size: type === 'crescent' ? 12 : type === 'sparkle' ? 8 : randomInRange(2, 4),
      type,
    });
  }

  return stars;
}

// スコア計算
export function calculateScore(
  stageNumber: number,
  clearTime: number,
  baseTime: number
): number {
  const baseScore = CONFIG.BASE_SCORE;
  const timeBonus = Math.max(0, (baseTime - clearTime) * CONFIG.TIME_BONUS_MULTIPLIER);
  const stageMultiplier = 1 + (stageNumber - 1) * 0.5;

  return Math.floor((baseScore + timeBonus) * stageMultiplier);
}
