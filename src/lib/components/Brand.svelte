<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    size?: 'normal' | 'small';
  }

  let { size = 'normal' }: Props = $props();
</script>

<span class="brand {size}" aria-label="Mr. Kiss">
  <span class="seal"><Icon name="lips" size={size === 'small' ? 19 : 23} /></span>
  <span class="wordmark">Mr. <em>Kiss</em></span>
</span>

<style>
  .brand {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.6rem;
    color: var(--ink);
    user-select: none;
  }

  .seal {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 14px;
    color: #fffaf4;
    background:
      radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.35), transparent 55%),
      linear-gradient(150deg, #d96e82, var(--rose-deep));
    box-shadow: 0 8px 16px -8px rgba(168, 62, 86, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.32);
    transform: rotate(-6deg);
  }

  .wordmark {
    white-space: nowrap;
    font-family: var(--font-display);
    font-size: 1.45rem;
    font-weight: 560;
    letter-spacing: -0.035em;
    line-height: 1;
  }

  .wordmark em {
    font-style: italic;
    font-weight: 460;
    color: var(--rose-deep);
  }

  .small .seal {
    width: 33px;
    height: 33px;
    border-radius: 11px;
  }

  .small .wordmark {
    font-size: 1.18rem;
  }
</style>
