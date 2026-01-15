import { useRef, useCallback, useState } from 'react';

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
  threshold: number = 15
): { x: number; y: number } {
  const dx = touchX - centerX;
  const dy = touchY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < threshold) {
    return { x: 0, y: 0 };
  }

  // 角度を計算（ラジアン）
  const angle = Math.atan2(dy, dx);

  // 30度〜150度の範囲のみ対応（上方向: -150度〜-30度）
  const minAngle = (-150 * Math.PI) / 180;
  const maxAngle = (-30 * Math.PI) / 180;

  // 範囲外の場合は入力なし
  if (angle > 0 || angle < minAngle || angle > maxAngle) {
    return { x: 0, y: 0 };
  }

  // 3方向に正規化（左上、真上、右上）
  const leftBound = (-120 * Math.PI) / 180;
  const rightBound = (-60 * Math.PI) / 180;

  if (angle < leftBound) {
    return { x: -1, y: -1 };
  } else if (angle > rightBound) {
    return { x: 1, y: -1 };
  } else {
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
  const [direction, setDirection] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dpadTouchId, setDpadTouchId] = useState<number | null>(null);
  const [jumpTouchId, setJumpTouchId] = useState<number | null>(null);
  const [isJumpPressed, setIsJumpPressed] = useState(false);

  // D-padのタッチハンドラー
  const handleDpadTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    e.stopPropagation();
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
    e.stopPropagation();
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
    e.stopPropagation();
    const touch = e.changedTouches[0];
    setJumpTouchId(touch.identifier);
    setIsJumpPressed(true);
    onJumpStart();
  }, [onJumpStart]);

  const handleJumpTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === jumpTouchId);
    if (touch) {
      setJumpTouchId(null);
      setIsJumpPressed(false);
      onJumpEnd();
    }
  }, [jumpTouchId, onJumpEnd]);

  // D-padの矢印の色を取得
  const getArrowColor = (arrowDir: 'left' | 'up' | 'right') => {
    const activeColor = '#E8A87C'; // サーモンピンク（アクティブ）
    const inactiveColor = '#6B5B7A'; // 紫がかったグレー（非アクティブ）

    if (arrowDir === 'left' && direction.x === -1) return activeColor;
    if (arrowDir === 'up' && direction.y === -1 && direction.x === 0) return activeColor;
    if (arrowDir === 'right' && direction.x === 1) return activeColor;
    return inactiveColor;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-between items-end p-4 pb-6 pointer-events-none z-50">
      {/* 左側: D-pad（方向パッド） */}
      <div
        ref={dpadRef}
        className="relative w-24 h-24 touch-none select-none pointer-events-auto"
        onTouchStart={handleDpadTouchStart}
        onTouchMove={handleDpadTouchMove}
        onTouchEnd={handleDpadTouchEnd}
        onTouchCancel={handleDpadTouchEnd}
      >
        {/* 外側の円（背景） */}
        <div className="absolute inset-0 rounded-full bg-[#8B7BA3] opacity-80" />

        {/* 内側の円 */}
        <div className="absolute inset-3 rounded-full bg-[#9B8AB3] opacity-90" />

        {/* 矢印 - 左 */}
        <svg
          className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4"
          viewBox="0 0 24 24"
          fill={getArrowColor('left')}
        >
          <path d="M15 19l-7-7 7-7" stroke={getArrowColor('left')} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* 矢印 - 上 */}
        <svg
          className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4"
          viewBox="0 0 24 24"
          fill={getArrowColor('up')}
        >
          <path d="M5 15l7-7 7 7" stroke={getArrowColor('up')} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* 矢印 - 右 */}
        <svg
          className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4"
          viewBox="0 0 24 24"
          fill={getArrowColor('right')}
        >
          <path d="M9 5l7 7-7 7" stroke={getArrowColor('right')} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* 矢印 - 下（非アクティブ表示のみ） */}
        <svg
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-4"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" stroke="#6B5B7A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* 右側: ジャンプボタン */}
      <div
        className="relative w-20 h-20 touch-none select-none pointer-events-auto"
        onTouchStart={handleJumpTouchStart}
        onTouchEnd={handleJumpTouchEnd}
        onTouchCancel={handleJumpTouchEnd}
      >
        {/* 外側の円（背景） */}
        <div
          className="absolute inset-0 rounded-full transition-colors duration-100"
          style={{
            backgroundColor: isCharging ? '#E8A87C' : '#8B7BA3',
            opacity: 0.8,
          }}
        />

        {/* 内側の円 */}
        <div
          className="absolute inset-2 rounded-full transition-all duration-100"
          style={{
            backgroundColor: isCharging ? '#FFD93D' : '#9B8AB3',
            opacity: 0.9,
            transform: isJumpPressed ? 'scale(0.9)' : 'scale(1)',
          }}
        />

        {/* チャージインジケーター */}
        {isCharging && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3 h-3 rounded-full bg-white animate-pulse"
            />
          </div>
        )}
      </div>
    </div>
  );
}
