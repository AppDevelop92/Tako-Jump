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
  threshold: number = 10
): { x: number; y: number; rawX: number; rawY: number; isValid: boolean } {
  const dx = touchX - centerX;
  const dy = touchY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 生の方向ベクトル（ドラッグ表示用、半円形の範囲内に制限）
  const maxDistance = 35;
  const clampedDistance = Math.min(distance, maxDistance);

  // 角度を計算
  let angle = Math.atan2(dy, dx);

  // 30度〜150度の範囲（上方向: -150度〜-30度）に制限
  const minAngle = (-150 * Math.PI) / 180;
  const maxAngle = (-30 * Math.PI) / 180;

  let isValid = false;
  let normalizedDx = 0;
  let normalizedDy = 0;

  // 角度が有効範囲内かチェック
  if (dy < 0 && angle >= minAngle && angle <= maxAngle) {
    isValid = distance >= threshold;
    normalizedDx = Math.cos(angle) * clampedDistance;
    normalizedDy = Math.sin(angle) * clampedDistance;
  } else if (dy < 0) {
    // 範囲外だが上方向の場合、最も近い有効角度にスナップ
    if (angle < minAngle) {
      angle = minAngle;
    } else if (angle > maxAngle) {
      angle = maxAngle;
    }
    normalizedDx = Math.cos(angle) * clampedDistance;
    normalizedDy = Math.sin(angle) * clampedDistance;
    isValid = distance >= threshold;
  } else {
    // 下方向の場合は無効
    return { x: 0, y: 0, rawX: 0, rawY: 0, isValid: false };
  }

  if (!isValid) {
    return { x: 0, y: 0, rawX: normalizedDx, rawY: normalizedDy, isValid: false };
  }

  // 3方向に正規化（左上、真上、右上）
  const leftBound = (-120 * Math.PI) / 180;
  const rightBound = (-60 * Math.PI) / 180;

  if (angle < leftBound) {
    return { x: -1, y: -1, rawX: normalizedDx, rawY: normalizedDy, isValid: true };
  } else if (angle > rightBound) {
    return { x: 1, y: -1, rawX: normalizedDx, rawY: normalizedDy, isValid: true };
  } else {
    return { x: 0, y: -1, rawX: normalizedDx, rawY: normalizedDy, isValid: true };
  }
}

export function MobileControls({
  onDirectionChange,
  onJumpStart,
  onJumpEnd,
  isCharging,
}: MobileControlsProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [padTouchId, setPadTouchId] = useState<number | null>(null);
  const [jumpTouchId, setJumpTouchId] = useState<number | null>(null);
  const [isJumpPressed, setIsJumpPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ドラッグパッドのタッチハンドラー
  const handlePadTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.changedTouches[0];
    if (!padRef.current) return;

    const rect = padRef.current.getBoundingClientRect();
    // 中心点は半円の底部中央
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height; // 底部
    const result = calculateDirection(touch.clientX, touch.clientY, centerX, centerY);

    setPadTouchId(touch.identifier);
    setIsDragging(true);
    setDirection({ x: result.x, y: result.y });
    setDragPosition({ x: result.rawX, y: result.rawY });
    onDirectionChange({ x: result.x, y: result.y });
  }, [onDirectionChange]);

  const handlePadTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (padTouchId === null) return;

    const touch = Array.from(e.touches).find(t => t.identifier === padTouchId);
    if (!touch || !padRef.current) return;

    const rect = padRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height;
    const result = calculateDirection(touch.clientX, touch.clientY, centerX, centerY);

    setDirection({ x: result.x, y: result.y });
    setDragPosition({ x: result.rawX, y: result.rawY });
    onDirectionChange({ x: result.x, y: result.y });
  }, [padTouchId, onDirectionChange]);

  const handlePadTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === padTouchId);
    if (touch) {
      setPadTouchId(null);
      setIsDragging(false);
      setDirection({ x: 0, y: 0 });
      setDragPosition({ x: 0, y: 0 });
      onDirectionChange({ x: 0, y: 0 });
    }
  }, [padTouchId, onDirectionChange]);

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

  // 方向のラベルを取得
  const getDirectionLabel = () => {
    if (direction.x === -1) return '↖';
    if (direction.x === 1) return '↗';
    if (direction.y === -1) return '↑';
    return '';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-between items-end p-4 pb-6 pointer-events-none z-50">
      {/* 左側: 半円形ドラッグパッド */}
      <div
        ref={padRef}
        className="relative w-28 h-14 touch-none select-none pointer-events-auto"
        onTouchStart={handlePadTouchStart}
        onTouchMove={handlePadTouchMove}
        onTouchEnd={handlePadTouchEnd}
        onTouchCancel={handlePadTouchEnd}
        style={{ marginBottom: '10px' }}
      >
        {/* 半円形の背景 */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 112 56"
          preserveAspectRatio="none"
        >
          {/* 外側の半円（背景） */}
          <path
            d="M 6 56 A 50 50 0 0 1 106 56"
            fill={isDragging ? 'rgba(139, 123, 163, 0.9)' : 'rgba(139, 123, 163, 0.7)'}
          />
          {/* 3つのゾーンを示す区切り線 */}
          {/* 左上方向 (150-120度) */}
          <path
            d="M 56 56 L 26 26"
            stroke={direction.x === -1 ? '#E8A87C' : '#6B5B7A'}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          {/* 右上方向 (60-30度) */}
          <path
            d="M 56 56 L 86 26"
            stroke={direction.x === 1 ? '#E8A87C' : '#6B5B7A'}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          {/* 真上の目印 */}
          <path
            d="M 56 56 L 56 10"
            stroke={direction.x === 0 && direction.y === -1 ? '#E8A87C' : '#6B5B7A'}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* ゾーンラベル（方向を示す矢印） */}
          {/* 左上 */}
          <text x="28" y="38" fill={direction.x === -1 ? '#E8A87C' : '#9B8AB3'} fontSize="14" textAnchor="middle">↖</text>
          {/* 真上 */}
          <text x="56" y="28" fill={direction.x === 0 && direction.y === -1 ? '#E8A87C' : '#9B8AB3'} fontSize="14" textAnchor="middle">↑</text>
          {/* 右上 */}
          <text x="84" y="38" fill={direction.x === 1 ? '#E8A87C' : '#9B8AB3'} fontSize="14" textAnchor="middle">↗</text>

          {/* 外周のハイライト（有効範囲を示す） */}
          <path
            d="M 6 56 A 50 50 0 0 1 106 56"
            fill="none"
            stroke={isDragging && direction.y === -1 ? '#E8A87C' : '#6B5B7A'}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* 中心点（スタート位置） */}
          <circle cx="56" cy="56" r="6" fill="#6B5B7A" />
        </svg>

        {/* ドラッグインジケーター（指の位置を追従） */}
        {isDragging && (
          <div
            className="absolute w-8 h-8 rounded-full pointer-events-none"
            style={{
              left: '50%',
              bottom: '0',
              transform: `translate(calc(-50% + ${dragPosition.x}px), ${dragPosition.y}px)`,
              backgroundColor: direction.y === -1 ? '#E8A87C' : '#9B8AB3',
              boxShadow: direction.y === -1 ? '0 0 15px rgba(232, 168, 124, 0.6)' : 'none',
              transition: 'background-color 0.1s',
            }}
          >
            {/* 現在の方向を示す */}
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
              {getDirectionLabel()}
            </span>
          </div>
        )}
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
