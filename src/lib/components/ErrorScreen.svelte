<script lang="ts">
  import type { DecodeFailure } from '../codec';
  import Brand from './Brand.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    reason: DecodeFailure | null;
    onStart: () => void;
  }

  let { reason, onStart }: Props = $props();

  let newer = $derived(reason === 'unsupported-version');
  let title = $derived(newer ? 'This note is from the future.' : 'This kiss got lost in the mail.');
  let body = $derived(
    newer
      ? 'It was sealed with a newer version of Mr. Kiss. A quick refresh should catch you up.'
      : 'The link looks smudged, cut short, or otherwise incomplete. Ask for a fresh note — a new one is only a few kisses away.',
  );
</script>

<div class="error-screen">
  <header class="error-topbar">
    <Brand />
  </header>

  <main class="error-main">
    <div class="error-card">
      <div class="error-art" aria-hidden="true">
        <span class="error-ring"></span>
        <div class="error-lips"><Icon name="lips" size={44} /></div>
        <span class="error-heart"><Icon name="heart" size={15} /></span>
        <span class="error-dash"></span>
        <span class="error-dot d1"></span>
        <span class="error-dot d2"></span>
      </div>

      <span class="eyebrow">A small hiccup</span>
      <h1>{title}</h1>
      <p>{body}</p>

      <div class="error-actions">
        {#if newer}
          <button type="button" class="btn-primary" onclick={() => location.reload()}>
            <Icon name="refresh" size={17} />
            Refresh the page
          </button>
          <button type="button" class="btn-ghost" onclick={onStart}>Start a new note instead</button>
        {:else}
          <button type="button" class="btn-primary" onclick={onStart}>
            <Icon name="sparkle" size={17} />
            Start a fresh note
          </button>
          <button type="button" class="btn-ghost" onclick={() => location.reload()}>
            Try the link again
          </button>
        {/if}
      </div>

      <p class="error-privacy">
        <Icon name="lock" size={12} />
        Nothing was stored, so there is nothing to recover — only love to resend.
      </p>
    </div>
  </main>
</div>

<style>
  .error-screen {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .error-topbar {
    padding: max(1.35rem, env(safe-area-inset-top)) clamp(1rem, 3.5vw, 2.4rem) 0;
    width: min(1100px, 100%);
    margin-inline: auto;
  }

  .error-main {
    flex: 1;
    display: grid;
    place-items: center;
    padding: 1.5rem 1rem 3rem;
  }

  .error-card {
    width: min(470px, 100%);
    text-align: center;
    padding: 2.2rem 1.8rem 1.5rem;
    border-radius: 30px;
    background:
      radial-gradient(circle at 30% 0%, rgba(255, 255, 255, 0.9), transparent 45%),
      linear-gradient(165deg, #fffbf6, #fff5ea 65%, #fceee2);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow:
      0 40px 90px -44px rgba(111, 56, 52, 0.55),
      0 0 0 1px rgba(136, 82, 72, 0.1);
    animation: error-in 0.6s cubic-bezier(0.22, 1.1, 0.36, 1);
  }

  .error-art {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 1.2rem;
    display: grid;
    place-items: center;
  }

  .error-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px dashed rgba(168, 62, 86, 0.28);
    transform: rotate(-10deg);
  }

  .error-lips {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    color: #fff8f0;
    background: linear-gradient(150deg, #d96e82, var(--rose-deep));
    box-shadow:
      0 14px 24px -14px rgba(168, 62, 86, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
    transform: rotate(10deg);
    opacity: 0.9;
  }

  .error-heart {
    position: absolute;
    top: 4px;
    right: 8px;
    color: var(--peach);
    transform: rotate(16deg);
  }

  .error-dash {
    position: absolute;
    width: 45px;
    height: 30px;
    border-top: 1.5px dashed rgba(168, 62, 86, 0.3);
    border-radius: 50%;
    top: 24px;
    left: -8px;
    transform: rotate(-22deg);
  }

  .error-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--butter);
    opacity: 0.8;
  }

  .d1 {
    bottom: 8px;
    left: 2px;
  }

  .d2 {
    bottom: 20px;
    right: 0;
    background: var(--lavender);
  }

  h1 {
    margin-top: 0.5rem;
    font-size: clamp(1.85rem, 5vw, 2.35rem);
    line-height: 1.08;
    letter-spacing: -0.035em;
    font-weight: 540;
  }

  .error-card > p {
    margin-top: 0.75rem;
    font-size: 0.86rem;
    line-height: 1.6;
    color: var(--ink-soft);
  }

  .error-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1.3rem;
  }

  .error-actions :global(.btn-primary) {
    width: 100%;
    min-height: 50px;
  }

  .error-actions :global(.btn-ghost) {
    width: 100%;
    min-height: 44px;
  }

  .error-privacy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    margin-top: 1.2rem !important;
    padding-top: 0.9rem;
    border-top: 1px dashed var(--line);
    font-size: 0.62rem !important;
    color: var(--ink-faint) !important;
    width: 100%;
  }

  @keyframes error-in {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (max-width: 520px) {
    .error-card {
      padding: 1.7rem 1.2rem 1.2rem;
      border-radius: 24px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .error-card {
      animation: none;
    }
  }
</style>
