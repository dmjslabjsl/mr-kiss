<script lang="ts">
  interface Props {
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
    duration?: number;
  }

  let { x, y, color, rotation, scale, duration = 4200 }: Props = $props();
</script>

<div
  class="lip-mark"
  style="left:{(x / 63) * 100}%; top:{(y / 63) * 100}%; --rot:{rotation}deg; --scale:{scale}; --life:{duration}ms; --ink:{color}"
  aria-hidden="true"
>
  <svg viewBox="0 0 60 40" class="lips">
    <path
      d="M3 17.5C3 9.5 16 4 30 4s27 5.5 27 13.5c0 2.2-2 2.8-4 1.6-7-4.1-14.6-6.2-23-6.2s-16 2.1-23 6.2c-2 1.2-4 .6-4-1.6Z"
      fill="var(--ink)"
      opacity="0.9"
    />
    <path
      d="M4.5 20.5C10.8 16 20 13.8 30 13.8S49.2 16 55.5 20.5C50.5 28.8 40.6 34 30 34S9.5 28.8 4.5 20.5Z"
      fill="var(--ink)"
    />
    <path
      d="M20 21.5c4.3-2.4 15.7-2.4 20 0-3.4 4.3-7.3 6-10 6s-6.6-1.7-10-6Z"
      fill="#ffe8df"
      opacity="0.38"
    />
    <ellipse cx="20" cy="14.5" rx="7" ry="2.2" fill="#fff" opacity="0.18" transform="rotate(-9 20 14.5)" />
  </svg>
</div>

<style>
  .lip-mark {
    position: absolute;
    width: clamp(21px, 10.8%, 39px);
    aspect-ratio: 1.5;
    pointer-events: none;
    animation: mark-life var(--life) cubic-bezier(0.22, 0.7, 0.3, 1) forwards;
    will-change: opacity, transform;
    z-index: 2;
  }

  .lips {
    width: 100%;
    height: auto;
    overflow: visible;
    transform: rotate(var(--rot)) scale(var(--scale));
    filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.2)) drop-shadow(0 2px 4px rgba(126, 46, 66, 0.18));
    opacity: 0.88;
  }

  @keyframes mark-life {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.45);
    }
    12% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.08);
    }
    22% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    68% {
      opacity: 0.92;
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -54%) scale(0.97);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lip-mark {
      animation: mark-life-reduced var(--life) linear forwards;
    }

    @keyframes mark-life-reduced {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1);
      }
      10%,
      78% {
        opacity: 0.9;
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1);
      }
    }
  }
</style>
