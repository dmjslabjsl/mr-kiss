<script lang="ts">
  export type IconName =
    | 'heart'
    | 'lips'
    | 'send'
    | 'undo'
    | 'sound-on'
    | 'sound-off'
    | 'swap'
    | 'close'
    | 'copy'
    | 'share'
    | 'lock'
    | 'play'
    | 'sparkle'
    | 'arrow-right'
    | 'check'
    | 'skip'
    | 'refresh'
    | 'chevron-down';

  interface Props {
    name: IconName;
    size?: number;
    class?: string;
  }

  let { name, size = 20, class: className = '' }: Props = $props();
</script>

<svg
  class={className}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#if name === 'heart'}
    <path
      d="M12 20.2S3.9 15.4 2.6 10.8C1.5 6.9 4.3 4 7.3 4c1.9 0 3.4 1 4.2 2.3.2.3.8.3 1 0C13.3 5 14.8 4 16.7 4c3 0 5.8 2.9 4.7 6.8-1.3 4.6-9.4 9.4-9.4 9.4Z"
      fill="currentColor"
      stroke="none"
    />
  {:else if name === 'lips'}
    <path
      d="M2.4 10.2C4.9 7.4 8.3 5.9 12 5.9s7.1 1.5 9.6 4.3c-3 1.6-6.3 2.4-9.6 2.4S5.4 11.8 2.4 10.2Z"
      fill="currentColor"
      stroke="none"
    />
    <path
      d="M3.1 11.5C5.8 10 8.8 9.2 12 9.2s6.2.8 8.9 2.3c-2.1 3-5.2 4.6-8.9 4.6s-6.8-1.6-8.9-4.6Z"
      fill="currentColor"
      stroke="none"
    />
    <path
      d="M3.5 11.2c2.4-1 5.2-1.6 8.5-1.6s6.1.6 8.5 1.6"
      stroke="rgba(62, 21, 30, 0.38)"
      stroke-width="1.15"
      stroke-linecap="round"
      fill="none"
    />
    <path
      d="M8.4 8.6c1.1-.6 2.3-1 3.6-1s2.5.4 3.6 1"
      stroke="rgba(255, 255, 255, 0.42)"
      stroke-width="1.1"
      stroke-linecap="round"
      fill="none"
    />
    <path
      d="M9.2 13.9c.9.8 1.8 1.2 2.8 1.2s1.9-.4 2.8-1.2"
      stroke="rgba(255, 255, 255, 0.28)"
      stroke-width="1"
      stroke-linecap="round"
      fill="none"
    />
  {:else if name === 'send'}
    <path d="M21.2 3.2 10.4 13.9" />
    <path d="M21.2 3.2 14.5 21l-4.1-7.1L3.2 9.7 21.2 3.2Z" />
  {:else if name === 'undo'}
    <path d="M8.5 5.5 4 10l4.5 4.5" />
    <path d="M4 10h9.2a5.8 5.8 0 0 1 0 11.6H11" />
  {:else if name === 'sound-on'}
    <path d="M11 5 6.5 8.5H3.2v7h3.3L11 19V5Z" />
    <path d="M15.2 8.7a4.6 4.6 0 0 1 0 6.6" />
    <path d="M18 6.2a8.2 8.2 0 0 1 0 11.6" />
  {:else if name === 'sound-off'}
    <path d="M11 5 6.5 8.5H3.2v7h3.3L11 19V5Z" />
    <path d="m15.5 9.5 4.5 5" />
    <path d="m20 9.5-4.5 5" />
  {:else if name === 'swap'}
    <path d="M4 8h15" />
    <path d="m15.5 4.5 3.8 3.5-3.8 3.5" />
    <path d="M20 16H5" />
    <path d="M8.5 12.5 4.7 16l3.8 3.5" />
  {:else if name === 'close'}
    <path d="m6 6 12 12" />
    <path d="M18 6 6 18" />
  {:else if name === 'copy'}
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M5.5 15.5h-1A1.5 1.5 0 0 1 3 14V4.5A1.5 1.5 0 0 1 4.5 3H14a1.5 1.5 0 0 1 1.5 1.5v1" />
  {:else if name === 'share'}
    <circle cx="17.5" cy="5.5" r="2.8" />
    <circle cx="5.5" cy="12" r="2.8" />
    <circle cx="17.5" cy="18.5" r="2.8" />
    <path d="m8 10.6 7-3.8" />
    <path d="m8 13.4 7 3.8" />
  {:else if name === 'lock'}
    <rect x="4.5" y="10" width="15" height="10.5" rx="3" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    <path d="M12 14.2v2.4" />
  {:else if name === 'play'}
    <path d="M8 5.6v12.8c0 .8.9 1.3 1.6.9l9.7-6.4c.7-.4.7-1.4 0-1.8L9.6 4.7c-.7-.4-1.6.1-1.6.9Z" fill="currentColor" stroke="none" />
  {:else if name === 'sparkle'}
    <path d="M12 2.8c.7 5.4 3.3 8 8.7 8.7-5.4.7-8 3.3-8.7 8.7-.7-5.4-3.3-8-8.7-8.7 5.4-.7 8-3.3 8.7-8.7Z" fill="currentColor" stroke="none" />
  {:else if name === 'arrow-right'}
    <path d="M4 12h15" />
    <path d="m13.5 6.5 5.5 5.5-5.5 5.5" />
  {:else if name === 'check'}
    <path d="m5 12.5 4.5 4.5L19.5 6.5" />
  {:else if name === 'skip'}
    <path d="M5 6v12l8-6-8-6Z" fill="currentColor" stroke="none" />
    <path d="M18 6v12" />
  {:else if name === 'refresh'}
    <path d="M20 11.2a8 8 0 1 0-1.4 6.3" />
    <path d="M20 4.5v6.7h-6.7" />
  {:else if name === 'chevron-down'}
    <path d="m6 9 6 6 6-6" />
  {/if}
</svg>
