<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    message: string;
    tone?: 'default' | 'warm';
  }

  let { message, tone = 'default' }: Props = $props();
</script>

<div class="toast {tone}" role="status" aria-live="polite">
  <span class="toast-icon">
    <Icon name={tone === 'warm' ? 'heart' : 'lips'} size={14} />
  </span>
  <span>{message}</span>
</div>

<style>
  .toast {
    position: fixed;
    left: 50%;
    bottom: max(6.8rem, calc(env(safe-area-inset-bottom) + 5.5rem));
    translate: -50% 0;
    z-index: 60;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    max-width: calc(100vw - 2rem);
    padding: 0.6rem 1rem 0.6rem 0.6rem;
    border-radius: 999px;
    background: rgba(62, 42, 41, 0.94);
    color: #fff8f0;
    font-size: 0.78rem;
    font-weight: 600;
    box-shadow: 0 16px 34px -16px rgba(62, 42, 41, 0.8);
    backdrop-filter: blur(8px);
    animation: toast-in 0.36s cubic-bezier(0.22, 1.2, 0.36, 1);
    pointer-events: none;
  }

  .toast-icon {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.14);
    color: #ffd9d2;
    flex-shrink: 0;
  }

  .toast.warm .toast-icon {
    color: #ffc6c6;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      translate: -50% 12px;
      scale: 0.95;
    }
    to {
      opacity: 1;
      translate: -50% 0;
      scale: 1;
    }
  }

  @media (max-width: 760px) {
    .toast {
      bottom: max(9.5rem, calc(env(safe-area-inset-bottom) + 8rem));
      font-size: 0.74rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
</style>
