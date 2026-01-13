import { useRef, useEffect, useCallback, useState } from 'react';

// コントロール画像のインポート
import dpadDefaultSrc from '../assets/dpad_default.png';
import dpadActiveSrc from '../assets/dpad_active.png';
import jumpDefaultSrc from '../assets/jump_button_default.png';
import jumpChargingSrc from '../assets/jump_button_charging.png';

interface MobileControlsProps {
  onDirectionChange: (direction: { x: number; y: number }) => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  isCharging: boolean;
}

// 方向を計算（タッチ位置から）
// 30度〜150度の範囲のみ対応（上半分のみ）
function calculateDirection(
  touchX: number,
  touchY: number,
  centerX: number,
  centerY: number,
  threshold: number = 20
): { x: number; y: number } {
  const dx = touchX - centerX;
  const dy = touchY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < threshold) {
    return { x: 0, y: 0 };
  }

  // 角度を計算（ラジアン）
  // atan2は右が0度、上が-90度、下が90度
  let angle = Math.atan2(dy, dx);

  // 30度〜150度の範囲のみ対応（上方向: -150度〜-30度）
  // 下方向（正のy）は無視
  const minAngle = (-150 * Math.PI) / 180; // -150度（左上）
  const maxAngle = (-30 * Math.PI) / 180; // -30度（右上）

  // 範囲外の場合は入力なし
  if (angle > 0 || angle < minAngle || angle > maxAngle) {
    return { x: 0, y: 0 };
  }

  // 3方向に正規化（左上、真上、右上）
  const upperLeft = (-150 * Math.PI) / 180;
  const upperRight = (-30 * Math.PI) / 180;
  const up = (-90 * Math.PI) / 180;

  // 境界角度
  const leftBound = (upperLeft + up) / 2; // -120度
  const rightBound = (up + upperRight) / 2; // -60度

  if (angle < leftBound) {
    // 左上
    return { x: -1, y: -1 };
  } else if (angle > rightBound) {
    // 右上
    return { x: 1, y: -1 };
  } else {
    // 真上
    return { x: 0, y: -1 };
  }
}

export function MobileControls({
  onDirectionChange,
  onJumpStart,
  onJumpEnd,
  isCharging,
}: MobileControlsProps) {
  const dpadRef = useRef<HTMLDivElement>(null);
  const jumpRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dpadTouchId, setDpadTouchId] = useState<number | null>(null);
  const [jumpTouchId, setJumpTouchId] = useState<number | null>(null);

  // D-padのタッチハンドラー
  const handleDpadTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (!dpadRef.current) return;

    const rect = dpadRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dir = calculateDirection(touch.clientX, touch.clientY, centerX, centerY);

    setDpadTouchId(touch.identifier);
    setDirection(dir);
    onDirectionChange(dir);
  }, [onDirectionChange]);

  const handleDpadTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (dpadTouchId === null) return;

    const touch = Array.from(e.touches).find(t => t.identifier === dpadTouchId);
    if (!touch || !dpadRef.current) return;

    const rect = dpadRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dir = calculateDirection(touch.clientX, touch.clientY, centerX, centerY);

    setDirection(dir);
    onDirectionChange(dir);
  }, [dpadTouchId, onDirectionChange]);

  const handleDpadTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === dpadTouchId);
    if (touch) {
      setDpadTouchId(null);
      setDirection({ x: 0, y: 0 });
      onDirectionChange({ x: 0, y: 0 });
    }
  }, [dpadTouchId, onDirectionChange]);

  // ジャンプボタンのタッチハンドラー
  const handleJumpTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    setJumpTouchId(touch.identifier);
    onJumpStart();
  }, [onJumpStart]);

  const handleJumpTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === jumpTouchId);
    if (touch) {
      setJumpTouchId(null);
      onJumpEnd();
    }
  }, [jumpTouchId, onJumpEnd]);

  // 方向に応じた回転角度を計算
  const getRotation = () => {
    if (direction.x === 0 && direction.y === 0) return 0;
    const angle = Math.atan2(direction.y, direction.x) * (180 / Math.PI);
    return angle - 45; // 画像の初期角度を調整
  };

  return (
    <>
      {/* 左側: ジャンプボタン */}
      <div
        ref={jumpRef}
        className="absolute left-8 top-1/2 -translate-y-1/2 w-28 h-28 touch-none select-none"
        onTouchStart={handleJumpTouchStart}
        onTouchEnd={handleJumpTouchEnd}
        onTouchCancel={handleJumpTouchEnd}
      >
        <img
          src={isCharging ? jumpChargingSrc : jumpDefaultSrc}
          alt="Jump"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* 右側: D-pad（方向パッド） */}
      <div
        ref={dpadRef}
        className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 touch-none select-none"
        onTouchStart={handleDpadTouchStart}
        onTouchMove={handleDpadTouchMove}
        onTouchEnd={handleDpadTouchEnd}
        onTouchCancel={handleDpadTouchEnd}
      >
        <img
          src={direction.x !== 0 || direction.y !== 0 ? dpadActiveSrc : dpadDefaultSrc}
          alt="D-pad"
          className="w-full h-full object-contain"
          style={{
            transform: direction.x !== 0 || direction.y !== 0 ? `rotate(${getRotation()}deg)` : 'none',
          }}
          draggable={false}
        />
      </div>
    </>
  );
}
