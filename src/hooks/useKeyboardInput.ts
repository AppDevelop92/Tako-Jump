import { useState, useCallback, useEffect } from 'react';

export interface KeyboardInputState {
  isSpacePressed: boolean;
  arrowDirection: { x: number; y: number };
  spaceJustReleased: boolean;
}

export function useKeyboardInput() {
  const [state, setState] = useState<KeyboardInputState>({
    isSpacePressed: false,
    arrowDirection: { x: 0, y: -1 }, // デフォルトは真上
    spaceJustReleased: false,
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        isSpacePressed: true,
        spaceJustReleased: false,
      }));
    }

    // 矢印キーで方向を設定
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        arrowDirection: { x: -1, y: prev.arrowDirection.y },
      }));
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        arrowDirection: { x: 1, y: prev.arrowDirection.y },
      }));
    }
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        arrowDirection: { x: prev.arrowDirection.x, y: -1 },
      }));
    }
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        arrowDirection: { x: prev.arrowDirection.x, y: 1 },
      }));
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        isSpacePressed: false,
        spaceJustReleased: true,
      }));
    }

    // 矢印キーを離したらその方向をリセット
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      setState(prev => ({
        ...prev,
        arrowDirection: { x: 0, y: prev.arrowDirection.y },
      }));
    }
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      setState(prev => ({
        ...prev,
        arrowDirection: { x: prev.arrowDirection.x, y: 0 },
      }));
    }
  }, []);

  // spaceJustReleasedをリセット
  const clearSpaceReleased = useCallback(() => {
    setState(prev => ({ ...prev, spaceJustReleased: false }));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return { ...state, clearSpaceReleased };
}
