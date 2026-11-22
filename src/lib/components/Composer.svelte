<script lang="ts">
  import { MAX_GAP_MS, MAX_KISSES } from '../codec';
  import type { Kiss, Note } from '../types';
  import AvatarStage from './AvatarStage.svelte';
  import Brand from './Brand.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    note: Note;
    soundOn: boolean;
    onToggleSound: () => void;
    onSend: (kisses: Kiss[]) => void;
    onNewNote: () => void;
  }

  let { note, soundOn, onToggleSound, onSend, onNewNote }: Props = $props();

  interface RecordedKiss {
    x: number;
    y: number;
    at: number;
  }

  let kisses = $state<RecordedKiss[]>([]);
  let stage: AvatarStage | undefined = $state();
  let limitMessage = $state('');
  let confirmNew = $state(false);
  let limitTimer: ReturnType<typeof setTimeout> | undefined;
  let confirmTimer: ReturnType<typeof setTimeout> | undefined;

  let remaining = $derived(Math.max(0, MAX_KISSES - kisses.length));
  let full = $derived(remaining === 0);
  let isOne = $derived(kisses.length === 1);
  let sendLabel = $derived(
    kisses.length === 0 ? 'Send love' : `Send ${kisses.length} kiss${isOne ? '' : 'es'}`,
  );

  let hint = $derived.by(() => {
    if (limitMessage) return limitMessage;
    if (kisses.length === 0) return `Tap anywhere on ${note.to}'s face to land a kiss.`;
    if (kisses.length < 3) return 'One more? They are already smiling.';
    if (kisses.length < 10) return 'Look at that blush. Keep going.';
    if (kisses.length < 35) return 'Stack them up — each one lands right where you tapped.';
    if (kisses.length < 90) return 'This is becoming a very loved face.';
    if (kisses.length < MAX_KISSES) return 'Nearly out of kisses. Make them count.';
    return 'All 100 kisses landed. Send them before you miss them.';
  });

  function recordKiss(x: number, y: number) {
    if (kisses.length >= MAX_KISSES) return;
    kisses.push({ x, y, at: performance.now() });
    limitMessage = '';
  }

  function hitLimit() {
    limitMessage = 'All 100 kisses used. Send this one before you burst.';
    if (limitTimer) clearTimeout(limitTimer);
    limitTimer = setTimeout(() => {
      limitMessage = '';
    }, 2800);
  }

  function undo() {
    if (!kisses.length) return;
    kisses.pop();
    limitMessage = '';
  }

  function clear() {
    if (!kisses.length) return;
    kisses = [];
    stage?.reset();
    limitMessage = '';
  }

  function send() {
    if (!kisses.length) return;
    const encoded: Kiss[] = kisses.map((kiss, index) => {
      const previous = kisses[index - 1];
      const gap = previous ? Math.min(MAX_GAP_MS, Math.max(0, kiss.at - previous.at)) : 0;
      return { x: kiss.x, y: kiss.y, gap };
    });
    onSend(encoded);
  }

  function requestNew() {
    if (kisses.length === 0) {
      onNewNote();
      return;
    }
    if (confirmNew) {
      onNewNote();
      return;
    }
    confirmNew = true;
    if (confirmTimer) clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => {
      confirmNew = false;
    }, 3200);
  }
</script>

<div class="composer">
  <header class="topbar">
    <div class="topbar-inner">
      <Brand size="small" />
      <div class="actions">
        <button
          type="button"
          class="sound-toggle"
          class:on={soundOn}
          onclick={onToggleSound}
          aria-pressed={soundOn}
          title={soundOn ? 'Mute smooch sounds' : 'Unmute smooch sounds'}
        >
          <Icon name={soundOn ? 'sound-on' : 'sound-off'} size={16} />
          <span>{soundOn ? 'Sound on' : 'Sound off'}</span>
        </button>
        <button
          type="button"
          class="new-note"
          class:confirming={confirmNew}
          onclick={requestNew}
          title={confirmNew ? 'Confirm starting over' : 'Start over'}
        >
          <Icon name="refresh" size={15} />
          <span>{confirmNew ? 'Sure? Start over' : 'Start over'}</span>
        </button>
      </div>
    </div>
  </header>

  <main class="stage-main">
    <div class="stage-copy">
      <span class="eyebrow">A little something for</span>
      <h1 dir="auto" title={note.to}>{note.to}</h1>
      <span class="from-line">
        <span class="tiny-heart"><Icon name="heart" size={9} /></span>
        from {note.from}
      </span>
    </div>

    <div class="stage-area">
      <AvatarStage
        bind:this={stage}
        to={note.to}
        from={note.from}
        toLook={note.toLook}
        fromLook={note.fromLook}
        interactive
        disabled={full}
        onKiss={recordKiss}
        onLimit={hitLimit}
      />
    </div>

    <p class="hint" class:limit={limitMessage !== ''} aria-live="polite">{hint}</p>
  </main>

  <footer class="dock">
    <div class="dock-inner">
      <div class="counter-wrap">
        <div class="counter-pill" class:full>
          <span class="counter-heart"><Icon name="heart" size={12} /></span>
          <span class="counter-main"><b>{remaining}</b> kisses left</span>
        </div>
        <div class="mini-meter" aria-hidden="true">
          <span style="width:{(kisses.length / MAX_KISSES) * 100}%"></span>
        </div>
      </div>

      <div class="edit-actions">
        <button type="button" class="tool" onclick={undo} disabled={kisses.length === 0}>
          <Icon name="undo" size={16} />
          <span>Undo</span>
        </button>
        <button type="button" class="tool" onclick={clear} disabled={kisses.length === 0}>
          <Icon name="close" size={15} />
          <span>Clear</span>
        </button>
      </div>

      <button type="button" class="send-btn" onclick={send} disabled={kisses.length === 0}>
        <span>{sendLabel}</span>
        <Icon name="send" size={17} />
      </button>
    </div>
    <p class="dock-note">
      <Icon name="lock" size={11} />
      Everything rides inside the link. Nothing is saved.
    </p>
  </footer>
</div>

<style>
  .composer {
    height: 100vh;
    height: 100dvh;
    min-height: 560px;
    overscroll-behavior: none;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .topbar {
    flex: 0 0 auto;
    padding: max(0.65rem, env(safe-area-inset-top)) clamp(1rem, 3.5vw, 2.4rem) 0;
  }

  .topbar-inner {
    width: min(1100px, 100%);
    margin-inline: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .sound-toggle,
  .new-note {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 40px;
    padding: 0.42rem 0.75rem;
    border-radius: 999px;
    border: 1px solid var(--line-soft);
    background: rgba(255, 250, 244, 0.5);
    color: var(--ink-soft);
    font-size: 0.7rem;
    font-weight: 650;
    backdrop-filter: blur(8px);
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  .sound-toggle:hover,
  .new-note:hover {
    background: var(--paper);
    color: var(--ink);
    border-color: var(--line);
  }

  .sound-toggle.on {
    color: var(--rose-deep);
    border-color: rgba(168, 62, 86, 0.2);
    background: rgba(255, 250, 244, 0.82);
  }

  .new-note.confirming {
    color: #9d4141;
    border-color: rgba(157, 65, 65, 0.3);
    background: rgba(255, 246, 242, 0.9);
  }

  .stage-main {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.3rem 0 0;
  }

  .stage-copy {
    flex: 0 0 auto;
    text-align: center;
    padding: 0 1rem;
    position: relative;
    z-index: 3;
  }

  .stage-copy h1 {
    margin: 0.15rem 0 0.15rem;
    font-size: clamp(2.2rem, 4.4vh + 1.2vw, 3.4rem);
    line-height: 1;
    letter-spacing: -0.04em;
    font-weight: 520;
    max-width: min(92vw, 30ch);
    overflow-wrap: anywhere;
    color: var(--ink);
  }

  .from-line {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-display);
    font-style: italic;
    font-size: clamp(0.82rem, 1.6vh, 0.98rem);
    color: var(--ink-faint);
  }

  .tiny-heart {
    color: var(--rose);
    display: inline-flex;
    translate: 0 1px;
  }

  .stage-area {
    flex: 1 1 auto;
    width: 100%;
    min-height: 0;
    position: relative;
    margin-top: -0.4rem;
  }

  .hint {
    flex: 0 0 auto;
    text-align: center;
    font-family: var(--font-display);
    font-style: italic;
    font-size: clamp(0.76rem, 1.7vh, 0.9rem);
    color: var(--ink-faint);
    padding: 0 1.2rem;
    min-height: 1.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
    z-index: 3;
    position: relative;
  }

  .hint.limit {
    color: #a04444;
    font-style: normal;
    font-family: var(--font-ui);
    font-weight: 600;
  }

  .dock {
    flex: 0 0 auto;
    padding: 0.4rem clamp(1rem, 3.5vw, 2.4rem) max(0.7rem, env(safe-area-inset-bottom));
    position: relative;
    z-index: 5;
  }

  .dock-inner {
    width: min(920px, 100%);
    margin-inline: auto;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 0.7rem;
    border-radius: 22px;
    background: rgba(255, 250, 244, 0.68);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 24px 50px -30px rgba(118, 62, 58, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(18px) saturate(1.1);
  }

  .counter-wrap {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .counter-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    color: var(--ink-soft);
    font-weight: 600;
    white-space: nowrap;
  }

  .counter-pill b {
    font-variant-numeric: tabular-nums;
    color: var(--ink);
    font-weight: 800;
  }

  .counter-pill.full {
    color: #9c4343;
  }

  .counter-heart {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: #fffaf3;
    background: var(--rose);
    box-shadow: 0 3px 8px -3px rgba(168, 62, 86, 0.6);
    flex-shrink: 0;
  }

  .mini-meter {
    height: 3px;
    width: min(180px, 100%);
    margin-left: 2rem;
    border-radius: 999px;
    background: rgba(136, 82, 72, 0.1);
    overflow: hidden;
  }

  .mini-meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--rose-soft), var(--rose));
    transition: width 0.3s var(--ease-soft);
  }

  .edit-actions {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    flex-shrink: 0;
  }

  .tool {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    min-height: 42px;
    padding: 0.35rem 0.6rem;
    border-radius: 12px;
    color: var(--ink-soft);
    font-size: 0.72rem;
    font-weight: 650;
    transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
  }

  .tool:hover:not(:disabled) {
    background: rgba(136, 82, 72, 0.08);
    color: var(--ink);
  }

  .tool:disabled {
    opacity: 0.32;
    cursor: default;
  }

  .send-btn {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 48px;
    padding: 0.55rem 1.15rem;
    border-radius: 16px;
    background: linear-gradient(160deg, #b64a61, var(--rose-deep) 48%, #8f2e47);
    color: #fff9f3;
    font-size: 0.88rem;
    font-weight: 750;
    letter-spacing: 0.01em;
    box-shadow:
      0 12px 24px -12px rgba(168, 62, 86, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: transform 0.2s var(--ease-spring), box-shadow 0.2s ease, opacity 0.2s ease;
    white-space: nowrap;
  }

  .send-btn:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.012);
    box-shadow:
      0 16px 28px -12px rgba(168, 62, 86, 0.85),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .send-btn:active:not(:disabled) {
    transform: scale(0.985);
  }

  .send-btn:disabled {
    opacity: 0.38;
    cursor: default;
  }

  .dock-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    margin-top: 0.45rem;
    font-size: 0.6rem;
    color: var(--ink-faint);
    text-align: center;
  }

  @media (max-width: 380px) {
    .sound-toggle span,
    .new-note span {
      display: none;
    }

    .sound-toggle,
    .new-note {
      width: 42px;
      height: 42px;
      padding: 0;
      justify-content: center;
      flex-shrink: 0;
    }

    .topbar-inner {
      gap: 0.4rem;
    }
  }

  @media (max-height: 620px) {
    .composer {
      min-height: 0;
    }

    .topbar {
      padding-top: max(0.35rem, env(safe-area-inset-top));
    }

    .stage-copy .eyebrow,
    .stage-copy .from-line {
      display: none;
    }

    .stage-copy h1 {
      font-size: clamp(1.55rem, 4.2vh, 2.2rem);
      margin: 0.1rem 0;
    }

    .stage-main {
      padding: 0;
    }

    .stage-area {
      margin-top: 0;
    }

    .hint {
      display: none;
    }

    .dock {
      padding-top: 0.15rem;
      padding-bottom: max(0.35rem, env(safe-area-inset-bottom));
    }

    .dock-inner {
      padding: 0.35rem 0.5rem;
    }

    .mini-meter {
      display: none;
    }

    .dock-note {
      display: none;
    }

    .send-btn {
      min-height: 44px;
      font-size: 0.8rem;
    }

    .tool {
      min-height: 36px;
    }

    .counter-pill {
      font-size: 0.72rem;
    }
  }

  @media (max-width: 760px) {
    .composer {
      min-height: 520px;
    }

    .topbar {
      padding-top: max(0.55rem, env(safe-area-inset-top));
    }

    .actions {
      gap: 0.3rem;
    }

    .sound-toggle,
    .new-note {
      min-height: 38px;
      padding: 0.4rem 0.62rem;
      font-size: 0.65rem;
    }

    .stage-copy h1 {
      font-size: clamp(2rem, 8.5vw, 2.7rem);
    }

    .stage-area {
      margin-top: -0.2rem;
    }

    .dock {
      padding: 0.2rem 0.7rem max(0.55rem, env(safe-area-inset-bottom));
    }

    .dock-inner {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-areas:
        'count actions'
        'send send';
      gap: 0.35rem 0.6rem;
      padding: 0.55rem 0.6rem 0.6rem;
      border-radius: 20px;
    }

    .counter-wrap {
      grid-area: count;
    }

    .counter-pill {
      font-size: 0.74rem;
    }

    .mini-meter {
      width: 100%;
      margin-left: 1.85rem;
    }

    .edit-actions {
      grid-area: actions;
    }

    .tool span {
      display: none;
    }

    .tool {
      min-width: 40px;
      min-height: 38px;
      justify-content: center;
      padding: 0.3rem;
    }

    .send-btn {
      grid-area: send;
      width: 100%;
      min-height: 50px;
      border-radius: 14px;
      font-size: 0.94rem;
    }

    .dock-note {
      display: none;
    }

    .hint {
      font-size: 0.75rem;
      min-height: 1.6rem;
    }
  }

  @media (max-height: 620px) {
    .composer {
      min-height: 0;
    }
  }

  @media (max-height: 700px) and (max-width: 760px) {
    .from-line {
      display: none;
    }

    .stage-copy h1 {
      font-size: 1.8rem;
    }

    .hint {
      min-height: 1.3rem;
      font-size: 0.7rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .mini-meter span {
      transition: none;
    }
  }
</style>
