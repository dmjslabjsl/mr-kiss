<script lang="ts">
  import { tick } from 'svelte';
  import { kissCountLabel } from '../format';
  import { canNativeShare, copyText, nativeShare, selectAll } from '../share';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    url: string;
    from: string;
    to: string;
    kissCount: number;
    autoCopied?: boolean;
    onClose: () => void;
  }

  let { open, url, from, to, kissCount, autoCopied = false, onClose }: Props = $props();

  let dialog: HTMLDialogElement | undefined = $state();
  let copyButton: HTMLButtonElement | undefined = $state();
  let copied = $state(false);
  let status = $state('');
  let input: HTMLInputElement | undefined = $state();

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      copied = autoCopied;
      status = autoCopied
        ? 'Copied to your clipboard. Send it somewhere soft.'
        : 'Copy the link to send a little love.';
      void tick().then(() => copyButton?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  async function doCopy() {
    const ok = await copyText(url);
    copied = ok;
    status = ok ? 'Copied! Go make someone blush.' : 'Press Ctrl/Cmd + C to copy.';
    if (!ok) selectAll(input ?? null);
  }

  async function doShare() {
    const outcome = await nativeShare({
      title: 'A little something from Mr. Kiss',
      text: `${kissCountLabel(kissCount)} from ${from} to ${to} 💋`,
      url,
    });
    if (outcome === 'unavailable' || outcome === 'failed') {
      status = 'Sharing is not available here. Copy the link instead.';
      await doCopy();
    } else if (outcome === 'shared') {
      status = 'Off it goes.';
    }
  }

  function close() {
    onClose();
  }
</script>

<dialog
  bind:this={dialog}
  onclose={onClose}
  oncancel={(event) => {
    event.preventDefault();
    close();
  }}
  aria-labelledby="share-title"
  aria-describedby="share-sub"
>
  <div class="sheet">
    <div class="sheet-grain grain"></div>
    <button type="button" class="close" onclick={close} aria-label="Close share sheet">
      <Icon name="close" size={17} />
    </button>

    <div class="seal" aria-hidden="true">
      <span class="seal-ring"></span>
      <span class="seal-inner"><Icon name="lips" size={30} /></span>
      <span class="seal-heart s1"><Icon name="heart" size={12} /></span>
      <span class="seal-heart s2"><Icon name="heart" size={8} /></span>
    </div>

    <span class="eyebrow">Sealed, with a kiss</span>
    <h2 id="share-title">Your note is ready.</h2>
    <p id="share-sub">
      {kissCountLabel(kissCount)} for <strong>{to}</strong>, from <strong>{from}</strong>. It will
      travel across phones exactly as you left it.
    </p>

    <div class="link-box" class:copied>
      <input
        bind:this={input}
        readonly
        value={url}
        aria-label="Shareable note link"
        onfocus={(event) => event.currentTarget.select()}
      />
      <button
        type="button"
        class="copy-button"
        bind:this={copyButton}
        onclick={doCopy}
        aria-label={copied ? 'Copy link again' : 'Copy link'}
      >
        <Icon name={copied ? 'check' : 'copy'} size={16} />
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
    <p class="status" aria-live="polite">{status}</p>

    <div class="actions">
      {#if canNativeShare()}
        <button type="button" class="share-button" onclick={doShare}>
          <Icon name="share" size={17} />
          Share the link
        </button>
      {/if}
      <button type="button" class="done-button" onclick={close}>
        Done
        <Icon name="check" size={16} />
      </button>
    </div>

    <div class="foot">
      <p class="privacy">
        <Icon name="lock" size={12} />
        The whole note lives in this link. Nothing is stored on a server.
      </p>
      <a class="preview" href={url} target="_blank" rel="noopener noreferrer">
        Preview it yourself
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  </div>
</dialog>

<style>
  dialog {
    border: none;
    background: transparent;
    padding: 0;
    margin: auto;
    width: min(500px, calc(100vw - 2rem));
    max-width: 100%;
    color: var(--ink);
    overflow: visible;
  }

  dialog::backdrop {
    background: rgba(75, 44, 39, 0.38);
    backdrop-filter: blur(7px) saturate(0.9);
  }

  .sheet {
    position: relative;
    border-radius: 30px;
    padding: 2rem 1.8rem 1.2rem;
    background:
      radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.85), transparent 42%),
      linear-gradient(165deg, #fffbf6, #fff4e9 60%, #fceddf);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 40px 100px -30px rgba(70, 35, 32, 0.5),
      0 0 0 1px rgba(136, 82, 72, 0.12),
      inset 0 1px 0 #fff;
    overflow: hidden;
    animation: sheet-in 0.4s cubic-bezier(0.22, 1.2, 0.36, 1);
    max-height: calc(100dvh - 2rem);
    overflow-y: auto;
  }

  .sheet-grain {
    opacity: 0.18;
  }

  .close {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--ink-soft);
    background: rgba(255, 250, 244, 0.6);
    border: 1px solid var(--line-soft);
    transition: background 0.2s ease, transform 0.2s var(--ease-spring);
    z-index: 3;
  }

  .close:hover {
    background: #fff;
    transform: rotate(8deg);
  }

  .seal {
    position: absolute;
    top: -12px;
    left: 2rem;
    width: 78px;
    height: 78px;
    display: grid;
    place-items: center;
    rotate: -8deg;
  }

  .seal-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px dashed rgba(168, 62, 86, 0.35);
  }

  .seal-inner {
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #fff7ef;
    background:
      radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.32), transparent 55%),
      linear-gradient(150deg, #d96e82, var(--rose-deep));
    box-shadow:
      0 10px 18px -10px rgba(168, 62, 86, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }

  .seal-heart {
    position: absolute;
    color: var(--rose-bright);
  }

  .s1 {
    top: 2px;
    right: -2px;
    rotate: 14deg;
  }

  .s2 {
    bottom: 8px;
    left: -6px;
    color: var(--peach);
  }

  .eyebrow {
    display: block;
    margin-left: 5.2rem;
    font-size: 0.6rem;
    padding-top: 0.15rem;
  }

  h2 {
    margin-left: 5.2rem;
    margin-top: 0.1rem;
    font-size: clamp(1.75rem, 5vw, 2.25rem);
    letter-spacing: -0.035em;
  }

  #share-sub {
    margin-top: 1.1rem;
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--ink-soft);
  }

  #share-sub strong {
    color: var(--ink);
    font-weight: 700;
  }

  .link-box {
    margin-top: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.35rem 0.35rem 0.8rem;
    border-radius: 14px;
    background: rgba(255, 253, 249, 0.9);
    border: 1.5px solid rgba(136, 82, 72, 0.16);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .link-box:focus-within {
    border-color: var(--rose);
    box-shadow: 0 0 0 3px rgba(201, 86, 109, 0.1);
  }

  .link-box.copied {
    border-color: rgba(98, 144, 108, 0.4);
  }

  .link-box input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    outline: none;
    font-family: var(--font-ui);
    font-size: 0.74rem;
    color: var(--ink-soft);
    text-overflow: ellipsis;
    padding: 0.35rem 0;
  }

  .copy-button {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    min-height: 40px;
    padding: 0.4rem 0.7rem;
    border-radius: 10px;
    background: var(--rose-deep);
    color: #fff9f3;
    font-size: 0.72rem;
    font-weight: 700;
    transition: background 0.2s ease, transform 0.2s var(--ease-spring);
  }

  .copy-button:hover {
    background: #8f2e47;
    transform: translateY(-1px);
  }

  .status {
    min-height: 1.2rem;
    margin-top: 0.4rem;
    font-size: 0.68rem;
    font-style: italic;
    font-family: var(--font-display);
    color: var(--ink-faint);
    padding-left: 0.2rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.7rem;
  }

  .share-button,
  .done-button {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 48px;
    border-radius: 14px;
    font-size: 0.84rem;
    font-weight: 700;
    transition: transform 0.2s var(--ease-spring), background 0.2s ease, box-shadow 0.2s ease;
  }

  .share-button {
    background: var(--ink);
    color: #fff8f0;
    box-shadow: 0 10px 20px -12px rgba(62, 42, 41, 0.8);
  }

  .share-button:hover {
    transform: translateY(-1px);
    background: #523a37;
  }

  .done-button {
    background: rgba(255, 250, 244, 0.85);
    color: var(--ink-soft);
    border: 1px solid var(--line);
  }

  .done-button:hover {
    background: #fff;
    color: var(--ink);
    transform: translateY(-1px);
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: 1.1rem;
    padding-top: 0.85rem;
    border-top: 1px dashed var(--line);
  }

  .privacy {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.62rem;
    color: var(--ink-faint);
    line-height: 1.4;
  }

  .preview {
    font-size: 0.64rem;
    font-weight: 650;
    color: var(--rose-deep);
    text-decoration: none;
    border-bottom: 1px solid rgba(168, 62, 86, 0.25);
    padding-bottom: 1px;
    white-space: nowrap;
  }

  .preview:hover {
    border-color: var(--rose-deep);
  }

  @keyframes sheet-in {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (max-width: 640px) {
    dialog {
      width: 100%;
      max-width: 100%;
      margin: 0;
      position: fixed;
      inset: auto 0 0 0;
      max-height: 94dvh;
    }

    .sheet {
      border-radius: 26px 26px 0 0;
      padding: 1.7rem 1.2rem max(1rem, env(safe-area-inset-bottom));
      max-height: 94dvh;
      animation: sheet-up 0.42s cubic-bezier(0.22, 1.1, 0.36, 1);
    }

    .seal {
      left: 1.4rem;
      width: 68px;
      height: 68px;
    }

    .seal-inner {
      width: 52px;
      height: 52px;
    }

    .eyebrow {
      margin-left: 4.7rem;
      font-size: 0.55rem;
    }

    h2 {
      margin-left: 4.7rem;
      font-size: 1.6rem;
    }

    .actions {
      flex-direction: column-reverse;
    }

    .foot {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.55rem;
    }

    .link-box input {
      font-size: 1rem;
    }

    @keyframes sheet-up {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sheet {
      animation: none;
    }
  }
</style>
