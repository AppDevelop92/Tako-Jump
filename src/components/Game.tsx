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
  initWater,
  calculateScore,
  drawBackground,
  drawStars,
  drawPlatforms,
  drawTako,
  drawMoon,
  drawWater,
  drawHUD,
  loadHighScore,
  saveHighScore,
} from '../game';
import type { GameState } from '../game';
import { useGameLoop, useKeyboardInput } from '../hooks';

import tako0 from '../assets/tako-0.png';
import tako33 from '../assets/tako-33.png';
import tako66 from '../assets/tako-66.png';
import tako100 from '../assets/tako-100.png';
import takoDead from '../assets/tako-dead.png';

const createInitialState = (stage: number = 1, score: number = 0, lives: number = CONFIG.LIVES): GameState => {
  const stageConfig = CONFIG.STAGES[stage - 1];
  const platforms = generatePlatforms(stageConfig);
  const moon = generateMoon(platforms);
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
    },
    platforms,
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

// キーボード用のジャンプ計算
function calculateKeyboardJump(
  chargeRatio: number,
  direction: { x: number; y: number }
): { vx: number; vy: number; facingRight: boolean } {
  // 方向が指定されていない場合は真上
  let angle = Math.PI / 2; // 真上

  if (direction.x !== 0 || direction.y !== 0) {
    // 矢印キーの方向からジャンプ角度を計算
    if (direction.x < 0) {
      angle = Math.PI * 0.75; // 左上 135度
    } else if (direction.x > 0) {
      angle = Math.PI * 0.25; // 右上 45度
    }
    // 上下の調整
    if (direction.y < 0 && direction.x === 0) {
      angle = Math.PI / 2; // 真上
    }
  }

  // ジャンプ力（チャージ量に応じて）
  const power = CONFIG.JUMP.MIN_VELOCITY +
    (CONFIG.JUMP.MAX_VELOCITY - CONFIG.JUMP.MIN_VELOCITY) * chargeRatio;

  return {
    vx: power * Math.cos(angle),
    vy: -power * Math.sin(angle),
    facingRight: direction.x >= 0,
  };
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<GameState>(createInitialState);
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const keyboard = useKeyboardInput();
  const jumpDirectionRef = useRef({ x: 0, y: -1 }); // チャージ中の方向を保存
  const waterDelayTimerRef = useRef<number | null>(null);

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

    // 水の上昇を遅延開始
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
        // 全ステージクリア
        return { ...prev, screen: 'cleared' };
      }

      const stageConfig = CONFIG.STAGES[nextStageNum - 1];
      const platforms = generatePlatforms(stageConfig);
      const moon = generateMoon(platforms);
      const totalHeight = stageConfig.totalHeight * CONFIG.CANVAS_HEIGHT;

      // 水の上昇を遅延開始
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
        },
        platforms,
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

  // ゲームループ
  const updateGame = useCallback((deltaTime: number) => {
    setState(prev => {
      if (prev.screen !== 'playing') return prev;

      let newState = { ...prev };
      let tako = { ...newState.tako };

      // 経過時間
      newState.elapsedTime = (performance.now() - newState.stageStartTime) / 1000;

      // チャージ処理（スペースキー長押し中）
      if (keyboard.isSpacePressed && tako.isGrounded && tako.state !== 'dead') {
        if (tako.chargeStartTime === null) {
          tako.chargeStartTime = performance.now();
          tako.state = 'charging';
        }
        tako.chargeRatio = Math.min(
          (performance.now() - tako.chargeStartTime) / CONFIG.JUMP.MAX_CHARGE_TIME,
          1
        );
        // チャージ中は矢印キーの方向を保存
        if (keyboard.arrowDirection.x !== 0 || keyboard.arrowDirection.y !== 0) {
          jumpDirectionRef.current = { ...keyboard.arrowDirection };
        }
      }

      // ジャンプ発動（スペースキーを離した瞬間）
      // chargeStartTimeがnullでない = チャージ中だった
      const wasCharging = tako.chargeStartTime !== null;
      if (keyboard.spaceJustReleased && wasCharging) {
        const { vx, vy, facingRight } = calculateKeyboardJump(
          tako.chargeRatio,
          jumpDirectionRef.current
        );
        tako.velocity = { x: vx, y: vy };
        tako.state = 'jumping';
        tako.isGrounded = false;
        tako.facingRight = facingRight;
        tako.chargeStartTime = null;
        tako.chargeRatio = 0;
        // 方向をリセット
        jumpDirectionRef.current = { x: 0, y: -1 };
      }

      // 空中での微調整（矢印キー）
      if (!tako.isGrounded && tako.state !== 'dead') {
        if (keyboard.arrowDirection.x !== 0) {
          tako.velocity.x += keyboard.arrowDirection.x * CONFIG.TAKO.AIR_CONTROL * deltaTime * 60;
        }
      }

      // 物理演算
      if (tako.state !== 'dead') {
        tako = applyGravity(tako);
        tako = updatePosition(tako);

        // 床との衝突
        const collision = checkPlatformCollision(tako, newState.platforms, newState.camera.y);
        tako = collision.tako;

        // 画面端のループ
        tako = wrapScreen(tako);
      }

      newState.tako = tako;

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
        newState.tako = tako;
        newState.lives--;

        if (newState.lives <= 0) {
          // ゲームオーバー
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
          // リスポーン（即座に実行、水もリセット）
          const startPlatform = newState.platforms[0];
          const stageConfig = CONFIG.STAGES[newState.stage - 1];

          // タコをリスポーン
          newState.tako = {
            position: { x: startPlatform.x + 50, y: startPlatform.y - CONFIG.TAKO.HEIGHT },
            velocity: { x: 0, y: 0 },
            state: 'idle',
            chargeStartTime: null,
            chargeRatio: 0,
            isGrounded: true,
            facingRight: true,
          };

          // カメラをリセット
          newState.camera = {
            y: startPlatform.y - CONFIG.CANVAS_HEIGHT + 200,
            targetY: startPlatform.y - CONFIG.CANVAS_HEIGHT + 200,
          };

          // 水をリセット
          newState.water = initWater(stageConfig);

          // 水の上昇を遅延開始
          if (waterDelayTimerRef.current) {
            clearTimeout(waterDelayTimerRef.current);
          }
          waterDelayTimerRef.current = window.setTimeout(() => {
            setState(p => ({
              ...p,
              water: { ...p.water, isRising: true },
            }));
          }, stageConfig.waterDelay);
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

    // spaceJustReleasedをクリア（ジャンプで消費した場合）
    if (keyboard.spaceJustReleased) {
      keyboard.clearSpaceReleased();
    }
  }, [keyboard]);

  useGameLoop(updateGame, state.screen === 'playing');

  // 描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景
    drawBackground(ctx, state.camera.y);

    // 星
    drawStars(ctx, state.stars, state.camera.y);

    // 月
    drawMoon(ctx, state);

    // 床
    drawPlatforms(ctx, state.platforms, state.camera.y);

    // 水
    drawWater(ctx, state);

    // タコ
    drawTako(ctx, state, images);

    // UI描画
    if (state.screen === 'playing') {
      drawHUD(ctx, state);

      // チャージインジケーター
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

        // ジャンプ方向インジケーター
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

      // 操作説明
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
      ctx.fillStyle = CONFIG.COLORS.UI_BG;
      ctx.fillRect(40, 200, CONFIG.CANVAS_WIDTH - 80, 400);
      ctx.strokeStyle = CONFIG.COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 200, CONFIG.CANVAS_WIDTH - 80, 400);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STAGE CLEAR!', CONFIG.CANVAS_WIDTH / 2, 260);

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

  // スペースキーでの画面遷移（プレイ中以外のみ）
  useEffect(() => {
    if (keyboard.spaceJustReleased && state.screen !== 'playing') {
      if (state.screen === 'title') {
        startGame();
      } else if (state.screen === 'cleared') {
        nextStage();
      } else if (state.screen === 'gameover') {
        returnToTitle();
      }
      keyboard.clearSpaceReleased();
    }
  }, [keyboard.spaceJustReleased, state.screen, startGame, nextStage, returnToTitle, keyboard]);

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
