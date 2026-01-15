import { useCallback, useState } from 'react';

interface MobileControlsProps {
  onDirectionChange: (direction: { x: number; y: number }) => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  isCharging: boolean;
}

export function MobileControls({
  onDirectionChange,
  onJumpStart,
  onJumpEnd,
  isCharging,
}: MobileControlsProps) {
  const [leftTouchId, setLeftTouchId] = useState<number | null>(null);
  const [rightTouchId, setRightTouchId] = useState<number | null>(null);
  const [jumpTouchId, setJumpTouchId] = useState<number | null>(null);
  const [isJumpPressed, setIsJumpPressed] = useState(false);
  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);

  // 方向を更新
  const updateDirection = useCallback((left: boolean, right: boolean) => {
    let x = 0;
    if (left && !right) x = -1;
    else if (right && !left) x = 1;
    // 両方押された場合は0（キャンセル）
    onDirectionChange({ x, y: x !== 0 ? -1 : 0 });
  }, [onDirectionChange]);

  // 左ボタンのタッチハンドラー
  const handleLeftTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.changedTouches[0];
    setLeftTouchId(touch.identifier);
    setIsLeftPressed(true);
    updateDirection(true, isRightPressed);
  }, [isRightPressed, updateDirection]);

  const handleLeftTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === leftTouchId);
    if (touch) {
      setLeftTouchId(null);
      setIsLeftPressed(false);
      updateDirection(false, isRightPressed);
    }
  }, [leftTouchId, isRightPressed, updateDirection]);

  // 右ボタンのタッチハンドラー
  const handleRightTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.changedTouches[0];
    setRightTouchId(touch.identifier);
    setIsRightPressed(true);
    updateDirection(isLeftPressed, true);
  }, [isLeftPressed, updateDirection]);

  const handleRightTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === rightTouchId);
    if (touch) {
      setRightTouchId(null);
      setIsRightPressed(false);
      updateDirection(isLeftPressed, false);
    }
  }, [rightTouchId, isLeftPressed, updateDirection]);

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

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-between items-end px-8 pb-12 pointer-events-none z-50">
      {/* 左側: 方向ボタン（左・右） - 親指が自然に届く位置 */}
      <div className="flex gap-5 pointer-events-auto">
        {/* 左ボタン */}
        <div
          className="relative touch-none select-none"
          style={{ width: '80px', height: '80px' }}
          onTouchStart={handleLeftTouchStart}
          onTouchEnd={handleLeftTouchEnd}
          onTouchCancel={handleLeftTouchEnd}
        >
          {/* 外側の円 */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-100"
            style={{
              backgroundColor: isLeftPressed ? '#E8A87C' : '#8B7BA3',
              opacity: 0.85,
              transform: isLeftPressed ? 'scale(0.93)' : 'scale(1)',
            }}
          />
          {/* 矢印アイコン */}
          <svg
            className="absolute inset-0 w-full h-full p-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M15 19l-7-7 7-7"
              stroke={isLeftPressed ? '#FFFFFF' : '#E8E8E8'}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* 右ボタン */}
        <div
          className="relative touch-none select-none"
          style={{ width: '80px', height: '80px' }}
          onTouchStart={handleRightTouchStart}
          onTouchEnd={handleRightTouchEnd}
          onTouchCancel={handleRightTouchEnd}
        >
          {/* 外側の円 */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-100"
            style={{
              backgroundColor: isRightPressed ? '#E8A87C' : '#8B7BA3',
              opacity: 0.85,
              transform: isRightPressed ? 'scale(0.93)' : 'scale(1)',
            }}
          />
          {/* 矢印アイコン */}
          <svg
            className="absolute inset-0 w-full h-full p-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 5l7 7-7 7"
              stroke={isRightPressed ? '#FFFFFF' : '#E8E8E8'}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 右側: ジャンプボタン - 親指が自然に届く位置 */}
      <div
        className="relative touch-none select-none pointer-events-auto"
        style={{ width: '96px', height: '96px' }}
        onTouchStart={handleJumpTouchStart}
        onTouchEnd={handleJumpTouchEnd}
        onTouchCancel={handleJumpTouchEnd}
      >
        {/* 外側の円（背景） */}
        <div
          className="absolute inset-0 rounded-full transition-colors duration-100"
          style={{
            backgroundColor: isCharging ? '#E8A87C' : '#8B7BA3',
            opacity: 0.85,
          }}
        />

        {/* 内側の円 */}
        <div
          className="absolute rounded-full transition-all duration-100"
          style={{
            top: '8px',
            left: '8px',
            right: '8px',
            bottom: '8px',
            backgroundColor: isCharging ? '#FFD93D' : '#9B8AB3',
            opacity: 0.9,
            transform: isJumpPressed ? 'scale(0.88)' : 'scale(1)',
          }}
        />

        {/* チャージインジケーター */}
        {isCharging && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-4 h-4 rounded-full bg-white animate-pulse"
            />
          </div>
        )}
      </div>
    </div>
  );
}
