<script lang="ts">
  import { onDestroy } from 'svelte';
  import { BLUSH_TONES } from '../looks';
  import { smooch } from '../sound';
  import type { Look } from '../types';
  import Avatar from './Avatar.svelte';
  import Icon from './Icon.svelte';
  import LipMark from './LipMark.svelte';

  interface Props {
    to: string;
    from: string;
    toLook: Look;
    fromLook: Look;
    interactive?: boolean;
    disabled?: boolean;
    onKiss?: (x: number, y: number) => void;
    onLimit?: () => void;
    class?: string;
  }

  let {
    to,
    from,
    toLook,
    fromLook,
    interactive = false,
    disabled = false,
    onKiss,
    onLimit,
    class: className = '',
  }: Props = $props();

  interface Mark {
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    duration: number;
  }

  interface Burst {
    id: number;
    x: number;
    y: number;
    dx: number;
    drift: number;
    rotation: number;
    size: number;
    delay: number;
  }

  let stageEl = $state<HTMLDivElement>();
  let artEl = $state<HTMLDivElement>();
  let faceEl = $state<HTMLButtonElement>();
  let miniEl = $state<HTMLDivElement>();

  let marks = $state<Mark[]>([]);
  let bursts = $state<Burst[]>([]);
  let eyesShut = $state(false);
  let fromPout = $state(false);
  let bubbleText = $state('');

  let nextId = 1;
  let kissTally = 0;
  let keyboardSpot = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let eyesTimer: ReturnType<typeof setTimeout> | undefined;
  let poutTimer: ReturnType<typeof setTimeout> | undefined;
  let bubbleTimer: ReturnType<typeof setTimeout> | undefined;
  let squishAnimation: Animation | null = null;
  let miniAnimation: Animation | null = null;
  let combo = 0;
  let lastKissAt = 0;
  let lastFrame = 0;
  let blushRaf: number | null = null;

  const lipColor = $derived((BLUSH_TONES[toLook.blush] ?? BLUSH_TONES[0]!).lip);
  const bubbleLines = ['mwah!', 'again?', 'for you', 'mmwah', 'one more', 'smooch', 'miss you'];
  const keyboardPoints = [
    [32, 46],
    [22, 39],
    [42, 39],
    [32, 27],
    [25, 49],
    [39, 49],
    [32, 35],
    [18, 46],
    [46, 46],
  ];

  const stageHeartStyles = [
    { left: '8%', top: '22%', size: 14, delay: '-2s', opacity: 0.36, color: '#d98a98' },
    { left: '92%', top: '31%', size: 9, delay: '-5s', opacity: 0.3, color: '#e4a96f' },
    { left: '15%', top: '61%', size: 8, delay: '-1s', opacity: 0.24, color: '#cfa3bd' },
    { left: '86%', top: '70%', size: 12, delay: '-4s', opacity: 0.3, color: '#d98a98' },
    { left: '78%', top: '12%', size: 8, delay: '-3s', opacity: 0.28, color: '#e4a96f' },
    { left: '4%', top: '40%', size: 6, delay: '-6s', opacity: 0.24, color: '#e4a96f' },
  ];

  function addTimer(fn: () => void, ms: number) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      fn();
    }, ms);
    timers.add(timer);
    return timer;
  }

  function reduceMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function paintBlush() {
    if (!stageEl) return;
    const value = 0.2 + combo * 0.74;
    stageEl.style.setProperty('--blush', value.toFixed(3));
  }

  function decay(now: number) {
    if (now - lastKissAt < 260) {
      blushRaf = requestAnimationFrame(decay);
      return;
    }
    const delta = Math.min(64, now - lastFrame);
    lastFrame = now;
    combo *= Math.exp(-delta / 2100);
    if (combo < 0.008) {
      combo = 0;
      paintBlush();
      blushRaf = null;
      return;
    }
    paintBlush();
    blushRaf = requestAnimationFrame(decay);
  }

  function bumpBlush() {
    combo = Math.min(1, combo + (kissTally < 4 ? 0.2 : 0.135));
    lastKissAt = performance.now();
    paintBlush();
    if (blushRaf === null) {
      lastFrame = performance.now();
      blushRaf = requestAnimationFrame(decay);
    }
  }

  function squish(x: number, y: number) {
    if (!artEl || reduceMotion()) return;
    squishAnimation?.cancel();
    const dx = ((x / 63) - 0.5) * 23;
    const dy = ((y / 63) - 0.5) * 16;
    const tilt = ((x / 63) - 0.5) * 2.1;
    squishAnimation = artEl.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg) scale(1, 1)' },
        {
          transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${tilt.toFixed(2)}deg) scale(1.02, 0.978)`,
          offset: 0.24,
        },
        {
          transform: `translate(${(dx * -0.34).toFixed(1)}px, ${(dy * -0.34).toFixed(1)}px) rotate(${(tilt * -0.4).toFixed(2)}deg) scale(0.992, 1.012)`,
          offset: 0.58,
        },
        { transform: 'translate(0, 0) rotate(0deg) scale(1, 1)' },
      ],
      { duration: 660, easing: 'cubic-bezier(0.22, 0.9, 0.3, 1)' },
    );
  }

  function bounceMini() {
    if (!miniEl || reduceMotion()) return;
    miniAnimation?.cancel();
    miniAnimation = miniEl.animate(
      [
        { transform: 'translateY(0) rotate(0deg) scale(1)' },
        { transform: 'translateY(-7px) rotate(-2.4deg) scale(1.055)', offset: 0.3 },
        { transform: 'translateY(0) rotate(1deg) scale(0.99)', offset: 0.62 },
        { transform: 'translateY(0) rotate(0deg) scale(1)' },
      ],
      { duration: 620, easing: 'cubic-bezier(0.22, 1.2, 0.36, 1)' },
    );
  }

  function spawnBursts(x: number, y: number) {
    if (reduceMotion() || bursts.length > 22) return;
    const count = Math.random() > 0.55 ? 2 : 1;
    for (let i = 0; i < count; i += 1) {
      const id = nextId++;
      bursts.push({
        id,
        x,
        y,
        dx: (Math.random() - 0.5) * 44,
        drift: 34 + Math.random() * 30,
        rotation: (Math.random() - 0.5) * 46,
        size: 9 + Math.random() * 7,
        delay: i * 90,
      });
      addTimer(() => {
        bursts = bursts.filter((burst) => burst.id !== id);
      }, 1500 + i * 90);
    }
    if (bursts.length > 18) {
      bursts = bursts.slice(bursts.length - 18);
    }
  }

  /** Adds a kiss mark and plays every little reaction that goes with it. */
  export function land(x: number, y: number, options: { sound?: boolean } = {}) {
    const safeX = Math.max(0, Math.min(63, x));
    const safeY = Math.max(0, Math.min(63, y));
    kissTally += 1;

    const id = nextId++;
    marks.push({
      id,
      x: safeX,
      y: safeY,
      rotation: (Math.random() - 0.5) * 44,
      scale: 0.88 + Math.random() * 0.26,
      duration: 4000 + Math.random() * 500,
    });
    if (marks.length > 28) {
      marks = marks.slice(marks.length - 28);
    }
    addTimer(() => {
      marks = marks.filter((mark) => mark.id !== id);
    }, 4700);

    spawnBursts(safeX, safeY);
    bumpBlush();
    squish(safeX, safeY);
    bounceMini();

    eyesShut = true;
    if (eyesTimer) clearTimeout(eyesTimer);
    eyesTimer = setTimeout(() => {
      eyesShut = false;
    }, 300);

    fromPout = true;
    if (poutTimer) clearTimeout(poutTimer);
    poutTimer = setTimeout(() => {
      fromPout = false;
    }, 820);

    bubbleText = bubbleLines[Math.floor(Math.random() * bubbleLines.length)]!;
    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      bubbleText = '';
    }, 1250);

    if (options.sound !== false) {
      smooch.play(0.75 + Math.random() * 0.35);
    }
  }

  /** Wipes visual state — used between replays. */
  export function reset() {
    marks = [];
    bursts = [];
    eyesShut = false;
    fromPout = false;
    bubbleText = '';
    kissTally = 0;
    combo = 0;
    paintBlush();
    squishAnimation?.cancel();
    miniAnimation?.cancel();
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    if (eyesTimer) clearTimeout(eyesTimer);
    if (poutTimer) clearTimeout(poutTimer);
    if (bubbleTimer) clearTimeout(bubbleTimer);
    if (blushRaf !== null) {
      cancelAnimationFrame(blushRaf);
      blushRaf = null;
    }
  }

  function pointFromEvent(event: PointerEvent): { x: number; y: number } | null {
    if (!faceEl) return null;
    const rect = faceEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 63);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 63);
    return {
      x: Math.max(0, Math.min(63, x)),
      y: Math.max(0, Math.min(63, y)),
    };
  }

  function tryKiss(x: number, y: number) {
    if (disabled) {
      onLimit?.();
      return;
    }
    onKiss?.(x, y);
    land(x, y);
  }

  function handlePointer(event: PointerEvent) {
    if (!interactive) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    if (!point) return;
    tryKiss(point.x, point.y);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (event.repeat) return;
    const point = keyboardPoints[keyboardSpot % keyboardPoints.length]!;
    keyboardSpot += 1;
    tryKiss(point[0]!, point[1]!);
  }

  onDestroy(() => {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    if (eyesTimer) clearTimeout(eyesTimer);
    if (poutTimer) clearTimeout(poutTimer);
    if (bubbleTimer) clearTimeout(bubbleTimer);
    if (blushRaf !== null) cancelAnimationFrame(blushRaf);
    squishAnimation?.cancel();
    miniAnimation?.cancel();
  });
</script>

<div
  class="avatar-stage {className}"
  bind:this={stageEl}
  style="--blush: 0.2"
  class:interactive
>
  <div class="stage-glow" aria-hidden="true"></div>

  <div class="halo" aria-hidden="true">
    <span class="halo-ring"></span>
    <span class="halo-ring ring-two"></span>
  </div>

  <div class="stage-hearts" aria-hidden="true">
    {#each stageHeartStyles as heart}
      <span
        class="stage-heart"
        style="left:{heart.left}; top:{heart.top}; opacity:{heart.opacity}; color:{heart.color}; --delay:{heart.delay}"
      >
        <Icon name="heart" size={heart.size} />
      </span>
    {/each}
    <span class="sparkle sparkle-a">✦</span>
    <span class="sparkle sparkle-b">✦</span>
  </div>

  <div class="portrait-actor">
    <div class="art" bind:this={artEl}>
      <Avatar look={toLook} eyesClosed={eyesShut} class="main-avatar" />
    </div>

    <div class="face-zone">
      {#if interactive}
        <button
          type="button"
          class="face-hit"
          bind:this={faceEl}
          onpointerdown={handlePointer}
          onkeydown={handleKeydown}
          aria-label={disabled ? `All kisses used. Send your note to ${to}.` : `Kiss ${to}'s face`}
          aria-disabled={disabled}
        ></button>
      {/if}

      <div class="marks" aria-hidden="true">
        {#each marks as mark (mark.id)}
          <LipMark
            x={mark.x}
            y={mark.y}
            color={lipColor}
            rotation={mark.rotation}
            scale={mark.scale}
            duration={mark.duration}
          />
        {/each}
        {#each bursts as burst (burst.id)}
          <span
            class="kiss-burst"
            style="left:{(burst.x / 63) * 100}%; top:{(burst.y / 63) * 100}%; --dx:{burst.dx}px; --drift:{burst.drift}px; --rot:{burst.rotation}deg; --delay:{burst.delay}ms; color:{lipColor}"
          >
            <Icon name="heart" size={burst.size} />
          </span>
        {/each}
      </div>
    </div>
  </div>

  <div class="mini" bind:this={miniEl} style="--blush: 0.44">
    <div class="speech" class:show={bubbleText !== ''}>
      <span>{bubbleText}</span>
    </div>
    <div class="mini-frame">
      <div class="mini-arch">
        <Avatar look={fromLook} pout={fromPout} class="mini-avatar" />
      </div>
      <span class="mini-spark" aria-hidden="true"><Icon name="heart" size={9} /></span>
    </div>
    <span class="mini-name" dir="auto">{from}</span>
  </div>
</div>

<style>
  .avatar-stage {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    display: grid;
    place-items: center;
    isolation: isolate;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
  }

  .stage-glow {
    position: absolute;
    inset: 4% 2% 2%;
    background: radial-gradient(ellipse 48% 48% at 50% 43%, rgba(255, 250, 243, 0.9), transparent 72%);
    pointer-events: none;
    z-index: 0;
  }

  .halo {
    position: absolute;
    width: min(78vw, 48dvh, 425px);
    aspect-ratio: 0.92;
    top: 47%;
    left: 50%;
    translate: -50% -52%;
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 38%, rgba(255, 252, 247, 0.96), rgba(248, 225, 214, 0.6) 58%, rgba(247, 220, 208, 0.12) 72%),
      linear-gradient(170deg, rgba(255, 255, 255, 0.65), transparent);
    border: 1px solid rgba(255, 255, 255, 0.75);
    box-shadow:
      0 0 0 1px rgba(168, 112, 101, 0.09),
      0 34px 80px -44px rgba(133, 72, 66, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.85);
    pointer-events: none;
    z-index: 0;
  }

  .halo-ring {
    position: absolute;
    inset: -5.5%;
    border-radius: 50%;
    border: 1.4px dashed rgba(179, 114, 110, 0.26);
    transform: rotate(-8deg);
  }

  .halo-ring.ring-two {
    inset: 5%;
    border-color: rgba(255, 255, 255, 0.55);
    border-style: solid;
    transform: none;
  }

  .stage-hearts {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }

  .stage-heart {
    position: absolute;
    animation: heart-drift 9s ease-in-out infinite;
    animation-delay: var(--delay);
    filter: drop-shadow(0 4px 8px rgba(160, 88, 84, 0.14));
  }

  .sparkle {
    position: absolute;
    color: #c49a59;
    font-size: 0.8rem;
    opacity: 0.5;
    animation: twinkle 5s ease-in-out infinite;
  }

  .sparkle-a {
    top: 18%;
    right: 16%;
    animation-delay: -2s;
  }

  .sparkle-b {
    bottom: 26%;
    left: 12%;
    font-size: 0.55rem;
    animation-delay: -4s;
  }

  .portrait-actor {
    position: relative;
    width: min(78vw, 46dvh, 425px);
    aspect-ratio: 240 / 260;
    z-index: 2;
    overflow: hidden;
    border-radius: 50%;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.85),
      0 0 0 9px rgba(255, 250, 244, 0.32),
      0 0 0 10px rgba(168, 112, 101, 0.08),
      0 40px 80px -46px rgba(118, 62, 58, 0.6);
  }

  .portrait-actor::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: inset 0 0 46px rgba(130, 70, 64, 0.07);
    pointer-events: none;
    z-index: 3;
  }

  .art {
    width: 100%;
    height: 100%;
    will-change: transform;
  }

  .art :global(.main-avatar) {
    width: 100%;
  }

  .face-zone {
    position: absolute;
    left: 17.5%;
    top: 10%;
    width: 65%;
    height: 73.1%;
    border-radius: 48%;
    -webkit-tap-highlight-color: transparent;
    z-index: 4;
  }

  .face-hit {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: inherit;
    background: transparent;
    cursor:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 32 32'%3E%3Cpath d='M16 27.5S3.5 19.6 3.5 11.4C3.5 6.8 7 3.7 10.7 3.7c2.2 0 4.1 1.2 5.3 2.9 1.2-1.7 3.1-2.9 5.3-2.9 3.7 0 7.2 3.1 7.2 7.7 0 8.2-12.5 16.1-12.5 16.1Z' fill='%23d7677c' stroke='%23fffaf4' stroke-width='2.2'/%3E%3C/svg%3E")
        15 15,
      pointer;
    outline: none;
    touch-action: manipulation;
    transition: background 0.25s ease;
  }

  @media (hover: hover) {
    .face-hit:hover {
      background: radial-gradient(circle at 50% 48%, rgba(255, 214, 214, 0.14), transparent 66%);
    }
  }

  .face-hit:focus-visible {
    outline: 2.5px dashed rgba(201, 86, 109, 0.85);
    outline-offset: 8px;
    background: rgba(255, 255, 255, 0.06);
  }

  .face-hit[aria-disabled='true'] {
    cursor: not-allowed;
  }

  .marks {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }

  .kiss-burst {
    position: absolute;
    animation: burst-float 1.25s ease-out var(--delay) forwards;
    opacity: 0;
    filter: drop-shadow(0 4px 5px rgba(140, 54, 70, 0.18));
    will-change: transform, opacity;
  }

  .mini {
    position: absolute;
    left: max(1rem, calc((100% - 1100px) / 2 + 1.1rem));
    bottom: clamp(0px, 2vh, 20px);
    z-index: 4;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    width: clamp(74px, 8.5vw, 94px);
  }

  .mini-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 0.92;
  }

  .mini-arch {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 999px 999px 22px 22px;
    border: 2px solid rgba(255, 250, 244, 0.95);
    background:
      radial-gradient(circle at 50% 28%, #fffaf4, transparent 70%),
      linear-gradient(170deg, #f6dfd5, #efc9c7);
    box-shadow:
      0 0 0 1px rgba(136, 82, 72, 0.12),
      0 16px 30px -16px rgba(118, 62, 58, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .mini-arch :global(.mini-avatar) {
    width: 128%;
    margin-bottom: -6%;
  }

  .mini-spark {
    position: absolute;
    right: -4px;
    bottom: 4px;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #fffaf4;
    background: var(--rose);
    border: 1.5px solid #fffaf4;
    box-shadow: 0 4px 8px -4px rgba(100, 40, 50, 0.5);
  }

  .mini-name {
    max-width: 104px;
    overflow: visible;
    white-space: nowrap;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-soft);
    background: rgba(255, 250, 244, 0.7);
    border: 1px solid rgba(136, 82, 72, 0.1);
    padding: 0.14rem 0.45rem;
    border-radius: 999px;
    backdrop-filter: blur(4px);
  }

  .speech {
    position: absolute;
    left: 62%;
    bottom: calc(100% + 7px);
    translate: -50% 4px;
    padding: 0.32rem 0.62rem;
    border-radius: 14px 14px 14px 4px;
    background: #fffaf3;
    border: 1px solid rgba(136, 82, 72, 0.13);
    box-shadow: 0 8px 20px -10px rgba(110, 60, 55, 0.4);
    color: var(--rose-deep);
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.8rem;
    white-space: nowrap;
    opacity: 0;
    scale: 0.8;
    transform-origin: 20% 100%;
    transition: opacity 0.18s ease, scale 0.28s var(--ease-spring), translate 0.28s var(--ease-spring);
    pointer-events: none;
    z-index: 3;
  }

  .speech.show {
    opacity: 1;
    translate: -50% 0;
    scale: 1;
  }

  .speech::after {
    content: '';
    position: absolute;
    left: 10px;
    bottom: -5px;
    width: 9px;
    height: 9px;
    background: #fffaf3;
    border-right: 1px solid rgba(136, 82, 72, 0.13);
    border-bottom: 1px solid rgba(136, 82, 72, 0.13);
    transform: rotate(45deg);
  }

  @keyframes heart-drift {
    0%,
    100% {
      transform: translate3d(0, 0, 0) rotate(-3deg);
    }
    50% {
      transform: translate3d(3px, -11px, 0) rotate(4deg);
    }
  }

  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.15;
      transform: scale(0.8) rotate(0deg);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1) rotate(20deg);
    }
  }

  @keyframes burst-float {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.4) rotate(0deg);
    }
    18% {
      opacity: 0.95;
      transform: translate(-50%, calc(-50% - 12px)) scale(1) rotate(0deg);
    }
    100% {
      opacity: 0;
      transform: translate(calc(-50% + var(--dx)), calc(-50% - var(--drift))) scale(0.8) rotate(var(--rot));
    }
  }

  @media (max-width: 760px) {
    .mini {
      left: 0.35rem;
      bottom: 2px;
      width: 68px;
    }

    .mini-name {
      max-width: 96px;
      font-size: 0.55rem;
      letter-spacing: 0.1em;
    }

    .speech {
      left: 7%;
      translate: 0 4px;
      font-size: 0.72rem;
      transform-origin: 12% 100%;
    }

    .speech.show {
      translate: 0 0;
    }

    .stage-heart:nth-child(5),
    .stage-heart:nth-child(6) {
      display: none;
    }
  }

  @media (max-height: 720px) and (min-width: 761px) {
    .portrait-actor,
    .halo {
      width: min(44vw, 48dvh, 370px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .stage-heart,
    .sparkle,
    .kiss-burst {
      animation: none !important;
    }

    .kiss-burst {
      display: none;
    }

    .speech {
      transition: opacity 0.15s ease;
    }
  }
</style>
