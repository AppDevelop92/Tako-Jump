import { CONFIG } from './config';
import type { GameState, Star, Platform } from './types';

// 画像キャッシュ
const imageCache: Map<string, HTMLImageElement> = new Map();

// 画像をロード
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src)!);
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// 背景を描画
export function drawBackground(ctx: CanvasRenderingContext2D, _cameraY: number) {
  ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
}

// 星を描画
export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], cameraY: number) {
  stars.forEach(star => {
    const screenY = star.y - cameraY;

    // 画面外はスキップ
    if (screenY < -20 || screenY > CONFIG.CANVAS_HEIGHT + 20) return;

    ctx.fillStyle = star.type === 'sparkle' ? CONFIG.COLORS.STAR_BRIGHT : CONFIG.COLORS.STAR;

    switch (star.type) {
      case 'dot':
        ctx.fillRect(star.x, screenY, star.size, star.size);
        break;

      case 'cross':
        const halfSize = star.size / 2;
        ctx.fillRect(star.x - halfSize, screenY - 1, star.size, 2);
        ctx.fillRect(star.x - 1, screenY - halfSize, 2, star.size);
        break;

      case 'crescent':
        ctx.fillStyle = CONFIG.COLORS.CRESCENT;
        ctx.beginPath();
        ctx.arc(star.x, screenY, star.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        ctx.beginPath();
        ctx.arc(star.x + 3, screenY - 2, star.size / 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'sparkle':
        const s = star.size;
        ctx.beginPath();
        ctx.moveTo(star.x, screenY - s / 2);
        ctx.lineTo(star.x + s / 4, screenY);
        ctx.lineTo(star.x, screenY + s / 2);
        ctx.lineTo(star.x - s / 4, screenY);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(star.x - s / 2, screenY);
        ctx.lineTo(star.x, screenY + s / 4);
        ctx.lineTo(star.x + s / 2, screenY);
        ctx.lineTo(star.x, screenY - s / 4);
        ctx.closePath();
        ctx.fill();
        break;
    }
  });
}

// 床を描画
export function drawPlatforms(ctx: CanvasRenderingContext2D, platforms: Platform[], cameraY: number) {
  platforms.forEach(platform => {
    const screenY = platform.y - cameraY;

    // 画面外はスキップ
    if (screenY < -CONFIG.PLATFORM.HEIGHT || screenY > CONFIG.CANVAS_HEIGHT) return;

    const tileCount = Math.ceil(platform.width / CONFIG.PLATFORM.TILE_SIZE);

    for (let i = 0; i < tileCount; i++) {
      const tileX = platform.x + i * CONFIG.PLATFORM.TILE_SIZE;
      const tileWidth = Math.min(CONFIG.PLATFORM.TILE_SIZE, platform.width - i * CONFIG.PLATFORM.TILE_SIZE);

      // タイル本体
      ctx.fillStyle = CONFIG.COLORS.PLATFORM;
      ctx.fillRect(tileX, screenY, tileWidth, CONFIG.PLATFORM.HEIGHT);

      // 上辺のハイライト
      ctx.fillStyle = CONFIG.COLORS.PLATFORM_LIGHT;
      ctx.fillRect(tileX, screenY, tileWidth, 3);

      // グリッド線
      ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
      ctx.fillRect(tileX + tileWidth - 1, screenY, 1, CONFIG.PLATFORM.HEIGHT);
    }
  });
}

// タコを描画
export function drawTako(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  images: { [key: string]: HTMLImageElement }
) {
  const { tako } = state;
  const screenY = tako.position.y - state.camera.y;

  // 画像を選択
  let imageName: string;
  if (tako.state === 'dead') {
    imageName = 'dead';
  } else if (tako.chargeRatio >= 1) {
    imageName = '100';
  } else if (tako.chargeRatio >= 0.66) {
    imageName = '66';
  } else if (tako.chargeRatio >= 0.33) {
    imageName = '33';
  } else {
    imageName = '0';
  }

  const img = images[imageName];
  if (!img) return;

  ctx.save();

  // 向きを反転
  if (!tako.facingRight) {
    ctx.translate(tako.position.x + CONFIG.TAKO.WIDTH, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, screenY, CONFIG.TAKO.WIDTH, CONFIG.TAKO.HEIGHT);
  } else {
    ctx.drawImage(img, tako.position.x, screenY, CONFIG.TAKO.WIDTH, CONFIG.TAKO.HEIGHT);
  }

  ctx.restore();
}

// 月を描画
export function drawMoon(ctx: CanvasRenderingContext2D, state: GameState) {
  const { moon } = state;
  const screenY = moon.y - state.camera.y;

  // 画面外はスキップ
  if (screenY < -moon.size || screenY > CONFIG.CANVAS_HEIGHT) return;

  ctx.fillStyle = CONFIG.COLORS.MOON;
  ctx.beginPath();
  ctx.arc(
    moon.x + moon.size / 2,
    screenY + moon.size / 2,
    moon.size / 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // 三日月の影
  ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
  ctx.beginPath();
  ctx.arc(
    moon.x + moon.size / 2 + moon.size * 0.25,
    screenY + moon.size / 2 - moon.size * 0.1,
    moon.size / 2.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// 水を描画
export function drawWater(ctx: CanvasRenderingContext2D, state: GameState) {
  const { water, camera } = state;
  const screenY = water.y - camera.y;

  // 画面外はスキップ
  if (screenY > CONFIG.CANVAS_HEIGHT) return;

  // 波形を描画
  ctx.fillStyle = CONFIG.COLORS.WATER;
  ctx.beginPath();
  ctx.moveTo(0, CONFIG.CANVAS_HEIGHT);

  for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += 10) {
    const waveY = screenY +
      Math.sin((x + water.waveOffset) * 0.05) * CONFIG.WATER.WAVE_HEIGHT;
    ctx.lineTo(x, waveY);
  }

  ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
  ctx.closePath();
  ctx.fill();

  // 波の白いエッジ
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += 10) {
    const waveY = screenY +
      Math.sin((x + water.waveOffset) * 0.05) * CONFIG.WATER.WAVE_HEIGHT;
    if (x === 0) {
      ctx.moveTo(x, waveY);
    } else {
      ctx.lineTo(x, waveY);
    }
  }
  ctx.stroke();
}

// HUDを描画
export function drawHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left';

  // ステージ
  ctx.fillText(`STAGE ${state.stage}`, 10, 30);

  // スコア
  ctx.textAlign = 'right';
  ctx.fillText(`${state.score}`, CONFIG.CANVAS_WIDTH - 10, 30);

  // ライフ（タコのミニアイコン）
  ctx.textAlign = 'left';
  for (let i = 0; i < CONFIG.LIVES; i++) {
    ctx.fillStyle = i < state.lives ? '#FFFFFF' : '#666666';
    ctx.fillRect(10 + i * 28, 45, 20, 24);
    ctx.fillStyle = i < state.lives ? '#000000' : '#444444';
    ctx.fillRect(13 + i * 28, 52, 5, 6);
    ctx.fillRect(22 + i * 28, 52, 5, 6);
  }

  // タイム
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'right';
  const minutes = Math.floor(state.elapsedTime / 60);
  const seconds = Math.floor(state.elapsedTime % 60);
  const ms = Math.floor((state.elapsedTime % 1) * 100);
  ctx.fillText(
    `${minutes}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`,
    CONFIG.CANVAS_WIDTH - 10,
    55
  );
}
