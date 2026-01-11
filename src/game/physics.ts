import { CONFIG } from './config';
import type { Tako, Platform, Moon, Water, Position } from './types';

// 重力を適用
export function applyGravity(tako: Tako): Tako {
  if (tako.state === 'dead') return tako;

  const newVelocityY = Math.min(
    tako.velocity.y + CONFIG.TAKO.GRAVITY,
    CONFIG.TAKO.MAX_FALL_SPEED
  );

  return {
    ...tako,
    velocity: { ...tako.velocity, y: newVelocityY },
  };
}

// 位置を更新
export function updatePosition(tako: Tako): Tako {
  return {
    ...tako,
    position: {
      x: tako.position.x + tako.velocity.x,
      y: tako.position.y + tako.velocity.y,
    },
  };
}

// 床との衝突判定
export function checkPlatformCollision(
  tako: Tako,
  platforms: Platform[],
  _cameraY: number
): { tako: Tako; landed: boolean } {
  const takoBottom = tako.position.y + CONFIG.TAKO.HEIGHT;
  const takoLeft = tako.position.x;
  const takoRight = tako.position.x + CONFIG.TAKO.WIDTH;

  // 落下中のみ判定
  if (tako.velocity.y <= 0) {
    return { tako, landed: false };
  }

  for (const platform of platforms) {
    const platTop = platform.y;
    const platLeft = platform.x;
    const platRight = platform.x + platform.width;

    // 横方向の重なり
    const horizontalOverlap = takoRight > platLeft && takoLeft < platRight;

    // 上から着地
    if (horizontalOverlap) {
      const prevBottom = takoBottom - tako.velocity.y;
      if (prevBottom <= platTop && takoBottom >= platTop) {
        return {
          tako: {
            ...tako,
            position: { ...tako.position, y: platTop - CONFIG.TAKO.HEIGHT },
            velocity: { x: 0, y: 0 },
            state: 'idle',
            isGrounded: true,
          },
          landed: true,
        };
      }
    }
  }

  return { tako, landed: false };
}

// 画面端のループ（右端→左端、左端→右端）
export function wrapScreen(tako: Tako): Tako {
  let newX = tako.position.x;

  // 右端を超えたら左端から出てくる
  if (newX > CONFIG.CANVAS_WIDTH) {
    newX = -CONFIG.TAKO.WIDTH;
  }
  // 左端を超えたら右端から出てくる
  else if (newX < -CONFIG.TAKO.WIDTH) {
    newX = CONFIG.CANVAS_WIDTH;
  }

  // 速度はそのまま維持（角度を保持）
  return {
    ...tako,
    position: { ...tako.position, x: newX },
  };
}

// 月との衝突判定
export function checkMoonCollision(tako: Tako, moon: Moon): boolean {
  const takoCenterX = tako.position.x + CONFIG.TAKO.WIDTH / 2;
  const takoCenterY = tako.position.y + CONFIG.TAKO.HEIGHT / 2;
  const moonCenterX = moon.x + moon.size / 2;
  const moonCenterY = moon.y + moon.size / 2;

  const dx = takoCenterX - moonCenterX;
  const dy = takoCenterY - moonCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < (CONFIG.TAKO.WIDTH / 2 + moon.size / 2) * 0.7;
}

// 水との衝突判定
export function checkWaterCollision(tako: Tako, water: Water): boolean {
  const takoBottom = tako.position.y + CONFIG.TAKO.HEIGHT;
  return takoBottom > water.y;
}

// ジャンプ計算
export function calculateJump(
  chargeRatio: number,
  startPos: Position,
  endPos: Position
): { vx: number; vy: number; facingRight: boolean } {
  // 方向ベクトル
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;

  // 角度を計算（上方向を基準）
  let angle = Math.atan2(-dy, dx);

  // 角度を制限（45度〜135度）
  if (angle < CONFIG.JUMP.MIN_ANGLE) {
    angle = CONFIG.JUMP.MIN_ANGLE;
  } else if (angle > CONFIG.JUMP.MAX_ANGLE) {
    angle = CONFIG.JUMP.MAX_ANGLE;
  }

  // ドラッグ距離が短い場合は真上にジャンプ
  const dragDistance = Math.sqrt(dx * dx + dy * dy);
  if (dragDistance < 20) {
    angle = Math.PI / 2; // 真上
  }

  // ジャンプ力
  const power = CONFIG.JUMP.MIN_VELOCITY +
    (CONFIG.JUMP.MAX_VELOCITY - CONFIG.JUMP.MIN_VELOCITY) * chargeRatio;

  return {
    vx: power * Math.cos(angle),
    vy: -power * Math.sin(angle),
    facingRight: dx >= 0,
  };
}
