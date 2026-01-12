import { CONFIG } from './config';
import type { StageConfig } from './config';
import type { Platform, Moon, Star, Water, PlatformType, Eel } from './types';

// シード付き乱数生成器（Mulberry32アルゴリズム）
// 同じシードからは常に同じ乱数列が生成される
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return function() {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 現在のステージ用乱数生成器
let currentRandom: () => number = Math.random;

// シードを設定（ステージ番号を使用）
export function setRandomSeed(stageNumber: number): void {
  const seed = stageNumber * 12345 + 98765;
  currentRandom = createSeededRandom(seed);
}

// 乱数生成（整数）
function randomInt(min: number, max: number): number {
  return Math.floor(currentRandom() * (max - min + 1)) + min;
}

// 乱数生成（小数）
function randomInRange(min: number, max: number): number {
  return currentRandom() * (max - min) + min;
}

// 床のタイプを決定
function determinePlatformType(stageConfig: StageConfig): PlatformType {
  const rand = currentRandom();
  const normalRatio = stageConfig.normalRatio || 0;
  const iceRatio = stageConfig.iceRatio || 0;
  const caterpillarRatio = stageConfig.caterpillarRatio || 0;

  if (rand < normalRatio) {
    return 'normal';
  } else if (rand < normalRatio + iceRatio) {
    return 'ice';
  } else if (rand < normalRatio + iceRatio + caterpillarRatio) {
    return 'caterpillar';
  }
  return 'normal'; // デフォルト
}

// 床を生成
export function generatePlatforms(stageConfig: StageConfig): Platform[] {
  const platforms: Platform[] = [];
  const blockSize = CONFIG.PLATFORM.BLOCK_SIZE;

  // 地面（一番下のフラットな床、画面幅全体）
  const groundY = CONFIG.CANVAS_HEIGHT - 50;
  const groundBlockCount = Math.ceil(CONFIG.CANVAS_WIDTH / blockSize);
  platforms.push({
    x: 0,
    y: groundY,
    width: CONFIG.CANVAS_WIDTH,
    type: 'normal',
    blockCount: groundBlockCount,
  });

  // 最初の足場の位置（地面からfirstPlatformGap分上）
  const firstGap = stageConfig.firstPlatformGap || 200;
  let currentY = groundY - firstGap;
  let lastX = CONFIG.CANVAS_WIDTH / 2;

  for (let i = 0; i < stageConfig.platformCount; i++) {
    // 2番目以降の足場はgapMin〜gapMaxの間隔
    if (i > 0) {
      const gap = randomInRange(stageConfig.gapMin, stageConfig.gapMax);
      currentY -= gap;
    }

    // ブロック数を整数でランダム生成
    const blockCount = randomInt(stageConfig.blockCountMin, stageConfig.blockCountMax);
    const width = blockCount * blockSize;

    // 床のタイプを決定
    const type = determinePlatformType(stageConfig);

    // 位置を計算（到達可能な範囲内）
    const maxHorizontalJump = CONFIG.CANVAS_WIDTH * 0.5;
    const minX = Math.max(10, lastX - maxHorizontalJump);
    const maxX = Math.min(CONFIG.CANVAS_WIDTH - width - 10, lastX + maxHorizontalJump);

    // x座標をブロックサイズの倍数に揃える
    const xRaw = randomInRange(minX, maxX);
    const x = Math.round(xRaw / blockSize) * blockSize;

    const platform: Platform = { x, y: currentY, width, type, blockCount };

    // キャタピラ床の場合、追加プロパティを設定
    if (type === 'caterpillar') {
      platform.caterpillarOffset = 0;
      platform.caterpillarDirection = currentRandom() < 0.5 ? 1 : -1;
    }

    platforms.push(platform);
    lastX = x + width / 2;
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

// うなぎを生成
export function generateEels(stageConfig: StageConfig, platforms: Platform[]): Eel[] {
  const eels: Eel[] = [];
  const eelCount = stageConfig.eelCount || 0;

  if (eelCount === 0) return eels;

  // 地面と最上部の床を除外した床から配置位置を決定
  const floatingPlatforms = platforms.slice(1); // 地面を除外
  if (floatingPlatforms.length < 2) return eels;

  // 高さ方向に均等に分散させる
  const lowestY = floatingPlatforms[0].y;
  const highestY = floatingPlatforms[floatingPlatforms.length - 1].y;
  const heightRange = lowestY - highestY;

  for (let i = 0; i < eelCount; i++) {
    // 高さを均等に分散（上から順に配置）
    const sectionHeight = heightRange / (eelCount + 1);
    const targetY = highestY + sectionHeight * (i + 1);

    // その高さ付近の床を探す
    let nearestPlatform = floatingPlatforms[0];
    let minDistance = Math.abs(floatingPlatforms[0].y - targetY);

    for (const platform of floatingPlatforms) {
      const distance = Math.abs(platform.y - targetY);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPlatform = platform;
      }
    }

    // 床の上、少し横にずらした位置に配置
    const eelX = randomInRange(
      Math.max(20, nearestPlatform.x - 50),
      Math.min(CONFIG.CANVAS_WIDTH - CONFIG.EEL.SIZE - 20, nearestPlatform.x + nearestPlatform.width + 50)
    );
    const eelY = nearestPlatform.y - randomInRange(100, 200);

    eels.push({
      x: eelX,
      y: eelY,
      size: CONFIG.EEL.SIZE,
      isCollected: false,
      rotation: currentRandom() * Math.PI * 2,
    });
  }

  return eels;
}

// 水を初期化（画面外から開始）
export function initWater(stageConfig: StageConfig): Water {
  const groundY = CONFIG.CANVAS_HEIGHT - 50;
  return {
    y: groundY + 300, // 画面外から開始（見えない位置）
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
    const type = types[Math.floor(currentRandom() * types.length)];

    stars.push({
      x: currentRandom() * CONFIG.CANVAS_WIDTH,
      y: -totalHeight + currentRandom() * (totalHeight + CONFIG.CANVAS_HEIGHT),
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
