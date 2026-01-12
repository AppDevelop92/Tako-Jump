import { useRef, useState, useEffect, useCallback } from 'react';
import {
  CONFIG,
  applyGravity,
  updatePosition,
  checkPlatformCollision,
  wrapScreen,
  checkMoonCollision,
  checkWaterCollision,
  generatePlatforms,
  generateMoon,
  generateStars,
  generateEels,
  setRandomSeed,
  initWater,
  calculateScore,
  drawBackground,
  drawStars,
  drawPlatforms,
  drawTako,
  drawMoon,
  drawWater,
  drawEels,
  drawHUD,
  loadHighScore,
  saveHighScore,
  applyIceFriction,
  applyCaterpillarMovement,
  checkEelCollision,
} from '../game';
import type { Platform, GameState } from '../game';
import { useGameLoop, useKeyboardInput } from '../hooks';

import tako0 from '../assets/tako-0.png';
import tako33 from '../assets/tako-33.png';
import tako66 from '../assets/tako-66.png';
import tako100 from '../assets/tako-100.png';
import takoDead from '../assets/tako-dead.png';

const createInitialState = (stage: number = 1, score: number = 0, lives: number = CONFIG.LIVES): GameState => {
  const stageConfig = CONFIG.STAGES[stage - 1];
  setRandomSeed(stage); // ステージ番号でシード固定
  const platforms = generatePlatforms(stageConfig);
  const moon = generateMoon(platforms);
  const eels = generateEels(stageConfig, platforms);
  const totalHeight = stageConfig.totalHeight * CONFIG.CANVAS_HEIGHT;

  return {
    screen: 'title',
    stage,
    score,
    highScore: loadHighScore(),
    lives,
    stageStartTime: 0,
    elapsedTime: 0,
    tako: {
      position: { x: platforms[0].x + 50, y: platforms[0].y - CONFIG.TAKO.HEIGHT },
      velocity: { x: 0, y: 0 },
      state: 'idle',
      chargeStartTime: null,
      chargeRatio: 0,
      isGrounded: true,
      facingRight: true,
      airChargeLockedVelocityX: null,
    },
    platforms,
    eels,
    moon,
    water: initWater(stageConfig),
    camera: {
      y: platforms[0].y - CONFIG.CANVAS_HEIGHT + 200,
      targetY: platforms[0].y - CONFIG.CANVAS_HEIGHT + 200,
    },
    stars: generateStars(totalHeight),
    isHighScoreUpdated: false,
  };
};

// キーボード用のジャンプ計算（slidingVelocity: 氷の上で滑っている時の速度）
function calculateKeyboardJump(
  chargeRatio: number,
  direction: { x: number; y: number },
  slidingVelocity: number = 0
): { vx: number; vy: number; facingRight: boolean } {
  let angle = Math.PI / 2;

  if (direction.x !== 0) {
    if (direction.x < 0) {
      angle = Math.PI * 0.58;
    } else {
      angle = Math.PI * 0.42;
    }
  }

  const power = CONFIG.JUMP.MIN_VELOCITY +
    (CONFIG.JUMP.MAX_VELOCITY - CONFIG.JUMP.MIN_VELOCITY) * chargeRatio;

  // 横移動を0.7倍に + 滑り中の慣性を加算
  const baseVx = power * Math.cos(angle) * CONFIG.HORIZONTAL_FACTOR;
  const vx = baseVx + slidingVelocity;

  return {
    vx,
    vy: -power * Math.sin(angle),
    facingRight: slidingVelocity !== 0 ? slidingVelocity > 0 : direction.x >= 0,
  };
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<GameState>(createInitialState);
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // パフォーマンス最適化: キーボード入力はRefベース
  const { stateRef: keyboardRef, clearSpaceReleased: _clearSpaceReleased } = useKeyboardInput();
  const jumpDirectionRef = useRef({ x: 0, y: -1 });
  const waterDelayTimerRef = useRef<number | null>(null);
  const currentPlatformRef = useRef<Platform | null>(null);

  // 画像をロード
  useEffect(() => {
    const loadImages = async () => {
      const imageMap: { [key: string]: string } = {
        '0': tako0,
        '33': tako33,
        '66': tako66,
        '100': tako100,
        'dead': takoDead,
      };

      const loaded: { [key: string]: HTMLImageElement } = {};

      await Promise.all(
        Object.entries(imageMap).map(([key, src]) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              loaded[key] = img;
              resolve();
            };
            img.onerror = () => resolve();
            img.src = src;
          })
        )
      );

      setImages(loaded);
      setImagesLoaded(true);
    };

    loadImages();
  }, []);

  // ゲームを開始
  const startGame = useCallback(() => {
    const newState = createInitialState();
    newState.screen = 'playing';
    newState.stageStartTime = performance.now();

    const stageConfig = CONFIG.STAGES[0];
    waterDelayTimerRef.current = window.setTimeout(() => {
      setState(prev => ({
        ...prev,
        water: { ...prev.water, isRising: true },
      }));
    }, stageConfig.waterDelay);

    setState(newState);
  }, []);

  // 次のステージへ
  const nextStage = useCallback(() => {
    setState(prev => {
      const nextStageNum = prev.stage + 1;
      if (nextStageNum > CONFIG.STAGES.length) {
        // ステージ10クリア後はタイトルに戻る（ALL CLEAR処理はcleared画面で行う）
        return createInitialState(1, 0, CONFIG.LIVES);
      }

      const stageConfig = CONFIG.STAGES[nextStageNum - 1];
      setRandomSeed(nextStageNum); // ステージ番号でシード固定
      const platforms = generatePlatforms(stageConfig);
      const moon = generateMoon(platforms);
      const eels = generateEels(stageConfig, platforms);
      const totalHeight = stageConfig.totalHeight * CONFIG.CANVAS_HEIGHT;

      if (waterDelayTimerRef.current) {
        clearTimeout(waterDelayTimerRef.current);
      }
      waterDelayTimerRef.current = window.setTimeout(() => {
        setState(p => ({
          ...p,
          water: { ...p.water, isRising: true },
        }));
      }, stageConfig.waterDelay);

      return {
        ...prev,
        screen: 'playing',
        stage: nextStageNum,
        stageStartTime: performance.now(),
        elapsedTime: 0,
        tako: {
          position: { x: platforms[0].x + 50, y: platforms[0].y - CONFIG.TAKO.HEIGHT },
          velocity: { x: 0, y: 0 },
          state: 'idle',
          chargeStartTime: null,
          chargeRatio: 0,
          isGrounded: true,
          facingRight: true,
          airChargeLockedVelocityX: null,
        },
        platforms,
        eels,
        moon,
        water: initWater(stageConfig),
        camera: {
          y: platforms[0].y - CONFIG.CANVAS_HEIGHT + 200,
          targetY: platforms[0].y - CONFIG.CANVAS_HEIGHT + 200,
        },
        stars: generateStars(totalHeight),
      };
    });
  }, []);

  // タイトルに戻る
  const returnToTitle = useCallback(() => {
    if (waterDelayTimerRef.current) {
      clearTimeout(waterDelayTimerRef.current);
    }
    setState(createInitialState());
  }, []);

  // ゲームループ（依存関係なし - 安定したコールバック）
  const updateGame = useCallback((deltaTime: number) => {
    // キーボード入力をRefから直接読み取る
    const keyboard = keyboardRef.current;

    setState(prev => {
      if (prev.screen !== 'playing') return prev;

      let newState = { ...prev };
      let tako = { ...newState.tako };

      newState.elapsedTime = (performance.now() - newState.stageStartTime) / 1000;

      // 氷の上にいるかチェック
      const onIcePlatform = currentPlatformRef.current?.type === 'ice' && tako.isGrounded;

      // チャージ処理
      if (keyboard.isSpacePressed && tako.state !== 'dead') {
        if (tako.chargeStartTime === null) {
          tako.chargeStartTime = performance.now();
          tako.state = 'charging';
          if (!tako.isGrounded) {
            tako.airChargeLockedVelocityX = tako.velocity.x;
          }
        }
        tako.chargeRatio = Math.min(
          (performance.now() - tako.chargeStartTime) / CONFIG.JUMP.MAX_CHARGE_TIME,
          1
        );
        // 氷の上では方向入力を無効化（滑りをコントロールできない）
        if (tako.isGrounded && !onIcePlatform && (keyboard.arrowDirection.x !== 0 || keyboard.arrowDirection.y !== 0)) {
          jumpDirectionRef.current = { x: keyboard.arrowDirection.x, y: keyboard.arrowDirection.y };
        }
        if (tako.airChargeLockedVelocityX !== null) {
          tako.velocity.x = tako.airChargeLockedVelocityX;
        }
      }

      // ジャンプ発動
      const wasCharging = tako.chargeStartTime !== null;
      const wasAirCharge = tako.airChargeLockedVelocityX !== null;
      const isOnIce = currentPlatformRef.current?.type === 'ice';
      if (keyboard.spaceJustReleased && wasCharging && tako.state !== 'dead') {
        if (wasAirCharge) {
          tako.state = 'jumping';
          tako.chargeStartTime = null;
          tako.chargeRatio = 0;
          tako.airChargeLockedVelocityX = null;
        } else {
          // 氷の上で滑っている場合は慣性を適用
          const slidingVelocity = isOnIce ? tako.velocity.x : 0;
          const { vx, vy, facingRight } = calculateKeyboardJump(
            tako.chargeRatio,
            jumpDirectionRef.current,
            slidingVelocity
          );
          tako.velocity = { x: vx, y: vy };
          tako.state = 'jumping';
          tako.isGrounded = false;
          tako.facingRight = facingRight;
          tako.chargeStartTime = null;
          tako.chargeRatio = 0;
        }
        jumpDirectionRef.current = { x: 0, y: -1 };
        keyboard.spaceJustReleased = false;
      }

      // 空中微調整（横移動係数を適用）
      if (!tako.isGrounded && tako.state !== 'dead' && tako.airChargeLockedVelocityX === null) {
        if (keyboard.arrowDirection.x !== 0) {
          tako.velocity.x += keyboard.arrowDirection.x * CONFIG.TAKO.AIR_CONTROL * CONFIG.HORIZONTAL_FACTOR * deltaTime * 60;
        }
      }

      // 物理演算
      if (tako.state !== 'dead') {
        tako = applyGravity(tako);
        tako = updatePosition(tako);

        const collision = checkPlatformCollision(tako, newState.platforms, newState.camera.y);
        tako = collision.tako;

        if (collision.landed && collision.landedPlatform) {
          currentPlatformRef.current = collision.landedPlatform;
        }
        if (!tako.isGrounded) {
          currentPlatformRef.current = null;
        }

        tako = applyIceFriction(tako, currentPlatformRef.current);

        // キャタピラ床上での移動
        tako = applyCaterpillarMovement(tako, currentPlatformRef.current);

        tako = wrapScreen(tako);

        // うなぎとの衝突判定
        const eelResult = checkEelCollision(tako, newState.eels);
        tako = eelResult.tako;
        newState.eels = eelResult.eels;
      }

      newState.tako = tako;

      // うなぎの回転アニメーション
      newState.eels = newState.eels.map(eel => ({
        ...eel,
        rotation: eel.rotation + CONFIG.EEL.ROTATION_SPEED,
      }));

      // キャタピラのアニメーション
      newState.platforms = newState.platforms.map(platform => {
        if (platform.type === 'caterpillar') {
          return {
            ...platform,
            caterpillarOffset: ((platform.caterpillarOffset || 0) + 0.5) % (CONFIG.CATERPILLAR.SEGMENT_WIDTH * 2),
          };
        }
        return platform;
      });

      // 月との衝突（クリア）
      if (checkMoonCollision(tako, newState.moon) && tako.state !== 'dead') {
        const clearTime = newState.elapsedTime;
        const stageConfig = CONFIG.STAGES[newState.stage - 1];
        const stageScore = calculateScore(newState.stage, clearTime, stageConfig.baseTime);
        const newScore = newState.score + stageScore;

        let isHighScoreUpdated = false;
        if (newScore > newState.highScore) {
          saveHighScore(newScore);
          isHighScoreUpdated = true;
        }

        if (waterDelayTimerRef.current) {
          clearTimeout(waterDelayTimerRef.current);
        }

        return {
          ...newState,
          screen: 'cleared',
          score: newScore,
          highScore: Math.max(newScore, newState.highScore),
          isHighScoreUpdated,
        };
      }

      // 水との衝突
      if (checkWaterCollision(tako, newState.water) && tako.state !== 'dead') {
        tako.state = 'dead';
        tako.velocity = { x: 0, y: 0 };
        newState.tako = tako;
        newState.lives--;

        if (newState.lives <= 0) {
          if (waterDelayTimerRef.current) {
            clearTimeout(waterDelayTimerRef.current);
          }

          let isHighScoreUpdated = false;
          if (newState.score > newState.highScore) {
            saveHighScore(newState.score);
            isHighScoreUpdated = true;
          }

          setTimeout(() => {
            setState(p => ({
              ...p,
              screen: 'gameover',
              highScore: Math.max(p.score, p.highScore),
              isHighScoreUpdated,
            }));
          }, 1000);
        } else {
          const stageConfig = CONFIG.STAGES[newState.stage - 1];

          if (waterDelayTimerRef.current) {
            clearTimeout(waterDelayTimerRef.current);
          }

          setTimeout(() => {
            setState(p => {
              const startPlatform = p.platforms[0];
              // うなぎをリセット（再度取得可能に）
              const resetEels = p.eels.map(eel => ({ ...eel, isCollected: false }));
              return {
                ...p,
                tako: {
                  position: { x: startPlatform.x + 50, y: startPlatform.y - CONFIG.TAKO.HEIGHT },
                  velocity: { x: 0, y: 0 },
                  state: 'idle',
                  chargeStartTime: null,
                  chargeRatio: 0,
                  isGrounded: true,
                  facingRight: true,
                  airChargeLockedVelocityX: null,
                },
                eels: resetEels,
                camera: {
                  y: startPlatform.y - CONFIG.CANVAS_HEIGHT + 200,
                  targetY: startPlatform.y - CONFIG.CANVAS_HEIGHT + 200,
                },
                water: initWater(stageConfig),
              };
            });

            waterDelayTimerRef.current = window.setTimeout(() => {
              setState(p => ({
                ...p,
                water: { ...p.water, isRising: true },
              }));
            }, stageConfig.waterDelay);
          }, 1000);
        }
      }

      // 水の上昇
      if (newState.water.isRising) {
        newState.water = {
          ...newState.water,
          y: newState.water.y - newState.water.speed,
          waveOffset: newState.water.waveOffset + CONFIG.WATER.WAVE_SPEED * 60,
        };
      }

      // カメラ追従
      const targetCameraY = tako.position.y - CONFIG.CANVAS_HEIGHT * 0.6;
      newState.camera = {
        ...newState.camera,
        targetY: targetCameraY,
        y: newState.camera.y + (targetCameraY - newState.camera.y) * 0.1,
      };

      return newState;
    });
  }, []); // 依存関係なし - keyboardRefは安定したref

  useGameLoop(updateGame, state.screen === 'playing');

  // 描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx, state.camera.y);
    drawStars(ctx, state.stars, state.camera.y);
    drawMoon(ctx, state);
    drawPlatforms(ctx, state.platforms, state.camera.y);
    drawEels(ctx, state.eels, state.camera.y);
    drawWater(ctx, state);
    drawTako(ctx, state, images);

    if (state.screen === 'playing') {
      drawHUD(ctx, state);

      if (state.tako.state === 'charging' && state.tako.chargeRatio > 0) {
        const barWidth = 60;
        const barHeight = 8;
        const barX = state.tako.position.x + CONFIG.TAKO.WIDTH / 2 - barWidth / 2;
        const barY = state.tako.position.y - state.camera.y - 20;

        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const fillColor = state.tako.chargeRatio >= 1 ? '#FF4444' :
          state.tako.chargeRatio >= 0.66 ? '#FF69B4' :
          state.tako.chargeRatio >= 0.33 ? '#FFB6C1' : '#FFFFFF';
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barWidth * state.tako.chargeRatio, barHeight);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        const arrowX = state.tako.position.x + CONFIG.TAKO.WIDTH / 2;
        const arrowY = state.tako.position.y - state.camera.y - 35;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        if (jumpDirectionRef.current.x < 0) {
          ctx.fillText('←', arrowX, arrowY);
        } else if (jumpDirectionRef.current.x > 0) {
          ctx.fillText('→', arrowX, arrowY);
        } else {
          ctx.fillText('↑', arrowX, arrowY);
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SPACE:CHARGE  ARROWS:DIR', 10, CONFIG.CANVAS_HEIGHT - 10);
    }

    // タイトル画面
    if (state.screen === 'title') {
      ctx.fillStyle = CONFIG.COLORS.UI_BG;
      ctx.fillRect(40, 250, CONFIG.CANVAS_WIDTH - 80, 350);
      ctx.strokeStyle = CONFIG.COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 250, CONFIG.CANVAS_WIDTH - 80, 350);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TAKO', CONFIG.CANVAS_WIDTH / 2, 320);
      ctx.fillText('JUMP', CONFIG.CANVAS_WIDTH / 2, 360);

      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('HIGH SCORE', CONFIG.CANVAS_WIDTH / 2, 420);
      ctx.fillText(`${state.highScore}`, CONFIG.CANVAS_WIDTH / 2, 450);

      ctx.fillText('PRESS SPACE', CONFIG.CANVAS_WIDTH / 2, 540);
    }

    // クリア画面
    if (state.screen === 'cleared') {
      const isAllClear = state.stage >= CONFIG.STAGES.length;

      ctx.fillStyle = CONFIG.COLORS.UI_BG;
      ctx.fillRect(40, 200, CONFIG.CANVAS_WIDTH - 80, 400);
      ctx.strokeStyle = CONFIG.COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 200, CONFIG.CANVAS_WIDTH - 80, 400);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';

      // ALL CLEAR!! または STAGE CLEAR!
      if (isAllClear) {
        ctx.fillStyle = Math.floor(Date.now() / 200) % 2 === 0 ? '#FFD700' : '#FFFFFF';
        ctx.fillText('ALL CLEAR!!', CONFIG.CANVAS_WIDTH / 2, 260);
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.fillText('STAGE CLEAR!', CONFIG.CANVAS_WIDTH / 2, 260);
      }

      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('HIGH SCORE', CONFIG.CANVAS_WIDTH / 2, 320);
      ctx.fillText(`${state.highScore}`, CONFIG.CANVAS_WIDTH / 2, 350);

      ctx.fillText('SCORE', CONFIG.CANVAS_WIDTH / 2, 400);
      ctx.fillText(`${state.score}`, CONFIG.CANVAS_WIDTH / 2, 430);

      if (state.isHighScoreUpdated) {
        ctx.fillStyle = Math.floor(Date.now() / 200) % 2 === 0 ? '#FFD700' : '#FFFFFF';
        ctx.fillText('HIGH SCORE', CONFIG.CANVAS_WIDTH / 2, 480);
        ctx.fillText('UPDATED!!', CONFIG.CANVAS_WIDTH / 2, 510);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('PRESS SPACE', CONFIG.CANVAS_WIDTH / 2, 560);
    }

    // ゲームオーバー画面
    if (state.screen === 'gameover') {
      ctx.fillStyle = CONFIG.COLORS.UI_BG;
      ctx.fillRect(40, 200, CONFIG.CANVAS_WIDTH - 80, 400);
      ctx.strokeStyle = CONFIG.COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 200, CONFIG.CANVAS_WIDTH - 80, 400);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, 260);

      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('HIGH SCORE', CONFIG.CANVAS_WIDTH / 2, 320);
      ctx.fillText(`${state.highScore}`, CONFIG.CANVAS_WIDTH / 2, 350);

      ctx.fillText('SCORE', CONFIG.CANVAS_WIDTH / 2, 400);
      ctx.fillText(`${state.score}`, CONFIG.CANVAS_WIDTH / 2, 430);

      if (state.isHighScoreUpdated) {
        ctx.fillStyle = Math.floor(Date.now() / 200) % 2 === 0 ? '#FFD700' : '#FFFFFF';
        ctx.fillText('HIGH SCORE', CONFIG.CANVAS_WIDTH / 2, 480);
        ctx.fillText('UPDATED!!', CONFIG.CANVAS_WIDTH / 2, 510);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('PRESS SPACE', CONFIG.CANVAS_WIDTH / 2, 560);
    }
  }, [state, images, imagesLoaded]);

  // スペースキーでの画面遷移（プレイ中以外）- ポーリングでチェック
  useEffect(() => {
    if (state.screen === 'playing') return;

    const checkSpaceKey = () => {
      const keyboard = keyboardRef.current;
      if (keyboard.spaceJustReleased) {
        keyboard.spaceJustReleased = false;
        if (state.screen === 'title') {
          startGame();
        } else if (state.screen === 'cleared') {
          nextStage();
        } else if (state.screen === 'gameover') {
          returnToTitle();
        }
      }
    };

    const intervalId = setInterval(checkSpaceKey, 16);
    return () => clearInterval(intervalId);
  }, [state.screen, startGame, nextStage, returnToTitle]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#2D2A5A]">
      <canvas
        ref={canvasRef}
        width={CONFIG.CANVAS_WIDTH}
        height={CONFIG.CANVAS_HEIGHT}
        className="max-w-full max-h-full"
        style={{ imageRendering: 'pixelated' }}
        tabIndex={0}
      />
    </div>
  );
}
