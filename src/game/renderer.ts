import { CONFIG } from './config';
import type { GameState, Star, Platform, Eel } from './types';

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
  const blockSize = CONFIG.PLATFORM.BLOCK_SIZE;

  platforms.forEach((platform, index) => {
    const screenY = platform.y - cameraY;

    // 地面（index 0）の場合は特別な描画
    if (index === 0) {
      // 画面外の場合はスキップ
      if (screenY > CONFIG.CANVAS_HEIGHT) return;

      // 地面は画面下まで続く紺色のブロック
      const groundHeight = CONFIG.CANVAS_HEIGHT - screenY;
      if (groundHeight <= 0) return;

      // 地面本体（紺色）
      ctx.fillStyle = CONFIG.COLORS.GROUND;
      ctx.fillRect(0, screenY, CONFIG.CANVAS_WIDTH, groundHeight);

      // ドット絵風のグリッドパターン
      ctx.fillStyle = CONFIG.COLORS.GROUND_LINE;
      for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += blockSize) {
        ctx.fillRect(x, screenY, 1, groundHeight);
      }
      for (let y = screenY; y < CONFIG.CANVAS_HEIGHT; y += blockSize) {
        ctx.fillRect(0, y, CONFIG.CANVAS_WIDTH, 1);
      }

      return;
    }

    // 浮遊床の描画
    // 画面外はスキップ
    if (screenY < -CONFIG.PLATFORM.HEIGHT || screenY > CONFIG.CANVAS_HEIGHT) return;

    // 床のタイプによって色を変える
    const isIce = platform.type === 'ice';
    const isCaterpillar = platform.type === 'caterpillar';
    let mainColor = CONFIG.COLORS.PLATFORM;
    let lightColor = CONFIG.COLORS.PLATFORM_LIGHT;

    if (isIce) {
      mainColor = CONFIG.ICE.COLOR;
      lightColor = CONFIG.ICE.COLOR_LIGHT;
    } else if (isCaterpillar) {
      mainColor = CONFIG.CATERPILLAR.COLOR_DARK;
      lightColor = CONFIG.CATERPILLAR.COLOR_LIGHT;
    }

    // ブロック単位で描画
    for (let i = 0; i < platform.blockCount; i++) {
      const blockX = platform.x + i * blockSize;

      // ブロック本体
      ctx.fillStyle = mainColor;
      ctx.fillRect(blockX, screenY, blockSize, CONFIG.PLATFORM.HEIGHT);

      // 上辺のハイライト
      ctx.fillStyle = lightColor;
      ctx.fillRect(blockX, screenY, blockSize, 2);

      // グリッド線（ブロック間の区切り）
      ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
      ctx.fillRect(blockX + blockSize - 1, screenY, 1, CONFIG.PLATFORM.HEIGHT);
    }

    // キャタピラの場合は上部にベルトを描画
    if (isCaterpillar) {
      const segmentWidth = CONFIG.CATERPILLAR.SEGMENT_WIDTH;
      const offset = (platform.caterpillarOffset || 0) % (segmentWidth * 2);
      const direction = platform.caterpillarDirection || 1;

      for (let x = platform.x - segmentWidth; x < platform.x + platform.width + segmentWidth; x += segmentWidth) {
        const adjustedX = x + (direction > 0 ? offset : -offset);
        if (adjustedX < platform.x || adjustedX + segmentWidth > platform.x + platform.width) continue;

        const segmentIndex = Math.floor((adjustedX - platform.x) / segmentWidth);
        ctx.fillStyle = segmentIndex % 2 === 0 ? CONFIG.CATERPILLAR.COLOR_LIGHT : CONFIG.CATERPILLAR.COLOR_DARK;
        ctx.fillRect(adjustedX, screenY, segmentWidth - 1, 3);
      }

      // 方向を示す矢印
      ctx.fillStyle = '#FFFFFF';
      const arrowX = platform.x + platform.width / 2;
      const arrowY = screenY + 7;
      if (direction > 0) {
        ctx.fillRect(arrowX + 2, arrowY, 4, 2);
        ctx.fillRect(arrowX + 4, arrowY - 1, 2, 1);
        ctx.fillRect(arrowX + 4, arrowY + 2, 2, 1);
      } else {
        ctx.fillRect(arrowX - 6, arrowY, 4, 2);
        ctx.fillRect(arrowX - 6, arrowY - 1, 2, 1);
        ctx.fillRect(arrowX - 6, arrowY + 2, 2, 1);
      }
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

  // 画像を選択（1秒チャージに合わせて閾値調整）
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

  // チャージ量に応じて縮むエフェクト（バネのように）
  // 最大30%縮む
  const shrinkRatio = 1 - tako.chargeRatio * 0.3;
  const drawHeight = CONFIG.TAKO.HEIGHT * shrinkRatio;
  // 縮んだ分だけ下にずらして床に接地したまま
  const yOffset = CONFIG.TAKO.HEIGHT - drawHeight;
  const adjustedScreenY = screenY + yOffset;

  // 向きを反転
  if (!tako.facingRight) {
    ctx.translate(tako.position.x + CONFIG.TAKO.WIDTH, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, adjustedScreenY, CONFIG.TAKO.WIDTH, drawHeight);
  } else {
    ctx.drawImage(img, tako.position.x, adjustedScreenY, CONFIG.TAKO.WIDTH, drawHeight);
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

// 水を描画（ドット絵風）
export function drawWater(ctx: CanvasRenderingContext2D, state: GameState) {
  const { water, camera } = state;
  const screenY = water.y - camera.y;

  // 画面外はスキップ
  if (screenY > CONFIG.CANVAS_HEIGHT) return;

  const pixelSize = 8; // 水本体のドットサイズ
  const foamSize = CONFIG.WATER.FOAM_SIZE; // 飛沫のサイズ（1/4に縮小）
  const waveAmplitude = 8; // 波の振幅（ピクセル単位）

  // 水の本体をドット絵風に描画
  ctx.fillStyle = CONFIG.COLORS.WATER;

  for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += pixelSize) {
    const waveOffset = Math.sin((x + water.waveOffset) * 0.08) * waveAmplitude;
    const pixelY = Math.floor((screenY + waveOffset) / pixelSize) * pixelSize;

    const waterHeight = CONFIG.CANVAS_HEIGHT - pixelY;
    if (waterHeight > 0) {
      ctx.fillRect(x, pixelY, pixelSize, waterHeight);
    }
  }

  // 波の泡（白いドット）- サイズを1/4に縮小
  ctx.fillStyle = '#FFFFFF';
  for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += foamSize * 3) {
    const waveOffset = Math.sin((x + water.waveOffset) * 0.08) * waveAmplitude;
    const pixelY = Math.floor((screenY + waveOffset) / pixelSize) * pixelSize;

    if (pixelY < CONFIG.CANVAS_HEIGHT) {
      ctx.fillRect(x, pixelY, foamSize, foamSize);
    }
  }
}

// うなぎを描画（円形に曲がったうなぎ）
export function drawEels(ctx: CanvasRenderingContext2D, eels: Eel[], cameraY: number) {
  eels.forEach(eel => {
    if (eel.isCollected) return; // 取得済みはスキップ

    const screenY = eel.y - cameraY;

    // 画面外はスキップ
    if (screenY < -eel.size || screenY > CONFIG.CANVAS_HEIGHT + eel.size) return;

    const centerX = eel.x + eel.size / 2;
    const centerY = screenY + eel.size / 2;
    const radius = eel.size / 2 - 4;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(eel.rotation);

    // うなぎの体（円形に曲がった形）
    ctx.strokeStyle = CONFIG.EEL.COLOR;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 1.7);
    ctx.stroke();

    // うなぎの体のハイライト
    ctx.strokeStyle = CONFIG.EEL.COLOR_LIGHT;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0.2, Math.PI * 1.5);
    ctx.stroke();

    // うなぎの頭（開始点）
    const headAngle = 0;
    const headX = Math.cos(headAngle) * radius;
    const headY = Math.sin(headAngle) * radius;
    ctx.fillStyle = CONFIG.EEL.COLOR;
    ctx.beginPath();
    ctx.arc(headX, headY, 6, 0, Math.PI * 2);
    ctx.fill();

    // 目（白）
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(headX + 2, headY - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // 瞳
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(headX + 2.5, headY - 1.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // 尻尾（終了点）
    const tailAngle = Math.PI * 1.7;
    const tailX = Math.cos(tailAngle) * radius;
    const tailY = Math.sin(tailAngle) * radius;
    ctx.fillStyle = CONFIG.EEL.COLOR;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tailX - 8, tailY + 4);
    ctx.lineTo(tailX - 8, tailY - 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // キラキラエフェクト（浮遊感）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const sparkleOffset = Math.sin(Date.now() * 0.01 + eel.x) * 3;
    ctx.fillRect(eel.x + 4, screenY + 4 + sparkleOffset, 2, 2);
    ctx.fillRect(eel.x + eel.size - 6, screenY + eel.size - 8 - sparkleOffset, 2, 2);
  });
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
