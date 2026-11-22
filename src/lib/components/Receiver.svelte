<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { REPLAY_LEAD_IN_MS, REPLAY_MAX_GAP_MS, kissCountLabel, kissWord } from '../format';
  import { smooch } from '../sound';
  import type { Kiss, Note } from '../types';
  import Avatar from './Avatar.svelte';
  import AvatarStage from './AvatarStage.svelte';
  import Brand from './Brand.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    note: Note;
    soundOn: boolean;
    onToggleSound: () => void;
    onSendBack: () => void;
    onNewNote: () => void;
  }

  let { note, soundOn, onToggleSound, onSendBack, onNewNote }: Props = $props();

  interface TimelineKiss extends Kiss {
    at: number;
  }

  let timeline = $derived.by(() => {
    let at = REPLAY_LEAD_IN_MS;
    return note.kisses.map<TimelineKiss>((kiss, index) => {
      if (index > 0) {
        at += Math.min(REPLAY_MAX_GAP_MS, Math.max(0, kiss.gap));
      }
      return { ...kiss, at };
    });
  });
  let total = $derived(note.kisses.length);
  let countLabel = $derived(kissCountLabel(total));

  let stage: AvatarStage | undefined = $state();
  let phase = $state<'intro' | 'playing' | 'done'>('intro');
  let showIntro = $state(true);
  let introLeaving = $state(false);
  let played = $state(0);
  let isPlaying = $state(false);
  let reduce = $state(false);
  let introButton: HTMLButtonElement | undefined = $state();
  let headingEl: HTMLHeadingElement | undefined = $state();
  let endTitle: HTMLHeadingElement | undefined = $state();

  let raf = 0;
  let startAt = 0;
  let cursor = 0;
  let finishTimer: ReturnType<typeof setTimeout> | undefined;
  let introTimer: ReturnType<typeof setTimeout> | undefined;
  let hiddenAt = 0;

  let progress = $derived(total === 0 ? (phase === 'done' ? 1 : 0) : played / total);
  let hint = $derived.by(() => {
    if (phase === 'done') return 'Every kiss, right where it was left.';
    if (phase === 'playing') {
      if (played === 0) return 'Watch closely. The first one is coming.';
      if (played === total) return 'One last little moment…';
      return 'They land in exactly the same spot at exactly the same beat.';
    }
    return `A little note from ${note.from}.`;
  });

  function cancelScheduler() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (finishTimer) {
      clearTimeout(finishTimer);
      finishTimer = undefined;
    }
  }

  function startPlayback() {
    cancelScheduler();
    stage?.reset();
    played = 0;
    cursor = 0;
    phase = 'playing';
    isPlaying = true;
    startAt = performance.now();
    if (timeline.length === 0) {
      finishPlayback();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function frame(now: number) {
    raf = 0;
    if (!isPlaying) return;
    const elapsed = now - startAt;
    while (cursor < timeline.length && timeline[cursor]!.at <= elapsed) {
      const kiss = timeline[cursor]!;
      stage?.land(kiss.x, kiss.y);
      cursor += 1;
      played = cursor;
    }
    if (cursor >= timeline.length) {
      finishPlayback();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function finishPlayback() {
    isPlaying = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    finishTimer = setTimeout(
      () => {
        phase = 'done';
        played = total;
        void tick().then(() => endTitle?.focus());
      },
      total === 0 ? 250 : 1000,
    );
  }

  function begin() {
    if (introLeaving) return;
    smooch.unlock();
    introLeaving = true;
    introTimer = setTimeout(
      () => {
        showIntro = false;
        startPlayback();
        void tick().then(() => headingEl?.focus());
      },
      reduce ? 80 : 420,
    );
  }

  function skip() {
    cancelScheduler();
    isPlaying = false;
    played = total;
    phase = 'done';
    void tick().then(() => endTitle?.focus());
  }

  function replay() {
    cancelScheduler();
    phase = 'playing';
    startPlayback();
    void tick().then(() => headingEl?.focus());
  }

  function toggleSound() {
    onToggleSound();
    if (!soundOn) void smooch.unlock();
  }

  function onVisibility() {
    if (!isPlaying) return;
    if (document.visibilityState === 'hidden') {
      hiddenAt = performance.now();
    } else if (hiddenAt) {
      startAt += performance.now() - hiddenAt;
      hiddenAt = 0;
    }
  }

  onMount(() => {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.addEventListener('visibilitychange', onVisibility);
    void tick().then(() => introButton?.focus({ preventScroll: true }));
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });

  onDestroy(() => {
    cancelScheduler();
    if (introTimer) clearTimeout(introTimer);
  });
</script>

<div class="receiver" inert={showIntro}>
  <header class="topbar">
    <div class="topbar-inner">
      <Brand size="small" />
      <div class="actions">
        <button
          type="button"
          class="sound-toggle"
          class:on={soundOn}
          onclick={toggleSound}
          aria-pressed={soundOn}
          title={soundOn ? 'Mute smooch sounds' : 'Unmute smooch sounds'}
        >
          <Icon name={soundOn ? 'sound-on' : 'sound-off'} size={16} />
          <span>{soundOn ? 'Sound on' : 'Sound off'}</span>
        </button>
        <button type="button" class="new-note" onclick={onNewNote} title="Make a new note">
          <Icon name="sparkle" size={15} />
          <span>New note</span>
        </button>
      </div>
    </div>
  </header>

  <main class="stage-main">
    <div class="stage-copy">
      <span class="eyebrow">Kisses for</span>
      <h1 bind:this={headingEl} tabindex="-1" dir="auto" title={note.to}>{note.to}</h1>
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
      />
    </div>

    <p class="hint" aria-live="off">{hint}</p>
  </main>

  <footer class="play-dock" class:is-hidden={phase !== 'playing'}>
      <div class="play-dock-inner">
        <div class="progress-info">
          <span class="progress-label">
            <span class="progress-heart"><Icon name="heart" size={11} /></span>
            <b>{played}</b> / {total} {kissWord(total)}
          </span>
          <div
            class="progress-track"
            role="progressbar"
            aria-label="Kiss replay progress"
            aria-valuemin="0"
            aria-valuemax={total}
            aria-valuenow={played}
          >
            <span style="width:{progress * 100}%"></span>
          </div>
        </div>

        {#if total > 1}
          <button type="button" class="skip" onclick={skip}>
            <Icon name="skip" size={14} />
            <span>Skip to the end</span>
          </button>
        {/if}
      </div>
    </footer>
</div>

{#if showIntro}
  <div class="intro" class:leaving={introLeaving}>
    <div class="intro-bg" aria-hidden="true">
      <span class="blob blob-one"></span>
      <span class="blob blob-two"></span>
      <span class="float-heart f1"><Icon name="heart" size={20} /></span>
      <span class="float-heart f2"><Icon name="heart" size={12} /></span>
      <span class="float-heart f3"><Icon name="heart" size={28} /></span>
      <span class="float-heart f4"><Icon name="heart" size={14} /></span>
      <div class="grain"></div>
    </div>

    <header class="intro-topbar">
      <Brand size="small" />
      <button
        type="button"
        class="sound-toggle"
        class:on={soundOn}
        onclick={toggleSound}
        aria-pressed={soundOn}
        title={soundOn ? 'Mute smooch sounds' : 'Unmute smooch sounds'}
      >
        <Icon name={soundOn ? 'sound-on' : 'sound-off'} size={16} />
        <span>{soundOn ? 'Sound on' : 'Sound off'}</span>
      </button>
    </header>

    <main class="intro-main">
      <div class="intro-card-wrap">
        <div class="intro-card" class:leaving={introLeaving}>
          <div class="intro-grain grain"></div>
          <div class="stamp" aria-hidden="true">
            <span class="stamp-inner">MK</span>
            <span class="stamp-caption">love mail</span>
          </div>

          <div class="intro-faces" aria-hidden="true">
            <div class="intro-to-face">
              <Avatar look={note.toLook} blush={0.5} animate={!reduce} />
            </div>
            <div class="intro-from-face">
              <Avatar look={note.fromLook} blush={0.52} animate={!reduce} />
            </div>
            <span class="faces-heart"><Icon name="heart" size={15} /></span>
            <span class="faces-dash"></span>
          </div>

          <span class="intro-eyebrow">A sealed little note for</span>
          <h1 id="intro-title" dir="auto">{note.to}</h1>
          <p id="intro-desc" class="intro-sub">
            <strong>{note.from}</strong> sent you {countLabel}.
          </p>
          <p class="intro-copy">
            Tap to open it. Every kiss will land in the very spot it was left, in the very same
            order — all wrapped up in this one little link.
          </p>

          <div class="open-pill" aria-hidden="true">
            <span class="open-icon"><Icon name="play" size={15} /></span>
            Unwrap your kisses
            <Icon name="arrow-right" size={17} />
          </div>
          <p class="open-hint">
            {soundOn ? 'Sound is on — tiny smooches ahead.' : 'Sound is off. Turn it on up top if you’re feeling brave.'}
          </p>

          <button
            type="button"
            class="intro-hit"
            bind:this={introButton}
            onclick={begin}
            aria-label={`Open ${note.to}'s note from ${note.from} with ${countLabel}`}
          ></button>
        </div>

        <button type="button" class="make-own" onclick={onNewNote}>
          Make your own note
          <Icon name="arrow-right" size={14} />
        </button>
      </div>
    </main>

    <footer class="intro-foot">
      <span><Icon name="lock" size={11} /> Nothing was uploaded. This note exists only in its link.</span>
    </footer>
  </div>
{/if}

{#if phase === 'done'}
  <div class="end-overlay">
    <div class="end-scrim"></div>
    <section class="end-card" aria-labelledby="end-title">
      <span class="end-seal" aria-hidden="true"><Icon name="lips" size={19} /></span>
      <div class="end-copy">
        <span class="end-eyebrow">Sealed, delivered</span>
        <h2 id="end-title" bind:this={endTitle} tabindex="-1">
          {#if total === 1}That's the kiss.{:else}That's all {countLabel}.{/if}
        </h2>
        <p>From {note.from}, with more love than a link can hold.</p>
      </div>
      <div class="end-actions">
        <button type="button" class="btn-ghost end-replay" onclick={replay}>
          <Icon name="refresh" size={16} />
          Replay
        </button>
        <button type="button" class="btn-primary end-sendback" onclick={onSendBack}>
          <Icon name="send" size={17} />
          Send one back
        </button>
      </div>
    </section>
  </div>
{/if}

<style>
  .receiver {
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
    position: relative;
    z-index: 6;
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

  .stage-main {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.3rem 0 0;
    position: relative;
    z-index: 1;
  }

  .stage-copy {
    flex: 0 0 auto;
    text-align: center;
    padding: 0 1rem;
    position: relative;
    z-index: 3;
  }

  .stage-copy h1 {
    margin: 0.15rem 0;
    font-size: clamp(2.2rem, 4.4vh + 1.2vw, 3.4rem);
    line-height: 1;
    letter-spacing: -0.04em;
    font-weight: 520;
    max-width: min(92vw, 30ch);
    overflow-wrap: anywhere;
    color: var(--ink);
  }

  .stage-copy h1:focus {
    outline: none;
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
    z-index: 3;
    position: relative;
  }

  .play-dock {
    flex: 0 0 auto;
    padding: 0 0.8rem max(0.55rem, env(safe-area-inset-bottom));
    position: relative;
    z-index: 8;
  }

  .play-dock.is-hidden {
    visibility: hidden;
    pointer-events: none;
  }

  .play-dock-inner {
    width: min(680px, 100%);
    margin-inline: auto;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.55rem 0.7rem 0.55rem 1rem;
    border-radius: 18px;
    background: rgba(255, 250, 244, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.75);
    box-shadow:
      0 18px 36px -26px rgba(118, 62, 58, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(16px);
  }

  .progress-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }

  .progress-label {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    color: var(--ink-soft);
    font-weight: 600;
  }

  .progress-label b {
    color: var(--ink);
    font-variant-numeric: tabular-nums;
    font-weight: 800;
  }

  .progress-heart {
    display: grid;
    place-items: center;
    width: 19px;
    height: 19px;
    border-radius: 50%;
    color: #fffaf3;
    background: var(--rose);
    flex-shrink: 0;
  }

  .progress-track {
    height: 3px;
    border-radius: 999px;
    background: rgba(136, 82, 72, 0.1);
    overflow: hidden;
    width: 100%;
  }

  .progress-track span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--rose-soft), var(--rose));
    transition: width 0.18s linear;
  }

  .skip {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    min-height: 38px;
    padding: 0.35rem 0.65rem;
    border-radius: 10px;
    color: var(--ink-soft);
    font-size: 0.68rem;
    font-weight: 650;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .skip:hover {
    background: rgba(136, 82, 72, 0.08);
    color: var(--ink);
  }


  /* ---------- Intro ---------- */

  .intro {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    background:
      radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255, 252, 247, 0.95), transparent 70%),
      linear-gradient(175deg, #fdf4ea 0%, #fbeadd 55%, #f6e1d3 100%);
    opacity: 1;
    transition: opacity 0.5s ease;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .intro.leaving {
    opacity: 0;
    pointer-events: none;
  }

  .intro-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .intro-bg .grain {
    position: absolute;
    opacity: 0.26;
  }

  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
  }

  .blob-one {
    width: 46vw;
    height: 46vw;
    min-width: 320px;
    min-height: 320px;
    top: -18%;
    left: -12%;
    background: #f3c4c7;
    opacity: 0.55;
  }

  .blob-two {
    width: 38vw;
    height: 38vw;
    min-width: 280px;
    min-height: 280px;
    bottom: -16%;
    right: -10%;
    background: #f5d4b4;
    opacity: 0.45;
  }

  .float-heart {
    position: absolute;
    color: var(--rose-bright);
    opacity: 0.5;
    animation: intro-bob 8s ease-in-out infinite;
    filter: drop-shadow(0 6px 10px rgba(168, 62, 86, 0.16));
  }

  .f1 {
    top: 16%;
    left: 9%;
    animation-delay: -2s;
  }

  .f2 {
    top: 28%;
    right: 12%;
    color: var(--peach);
    animation-delay: -4s;
  }

  .f3 {
    bottom: 18%;
    left: 6%;
    color: #d98fa0;
    animation-delay: -6s;
    opacity: 0.36;
  }

  .f4 {
    bottom: 26%;
    right: 8%;
    color: var(--butter);
    animation-delay: -1s;
  }

  .intro-topbar {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: max(0.9rem, env(safe-area-inset-top)) clamp(1rem, 3.5vw, 2.4rem) 0;
    width: min(1100px, 100%);
    margin-inline: auto;
  }

  .intro-main {
    flex: 1;
    display: grid;
    place-items: center;
    padding: 1.2rem 1rem;
    position: relative;
    z-index: 2;
  }

  .intro-card-wrap {
    width: min(440px, 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
  }

  .intro-card {
    position: relative;
    width: 100%;
    border-radius: 28px;
    padding: 1.8rem 1.7rem 1.5rem;
    text-align: center;
    background:
      radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.8), transparent 42%),
      linear-gradient(165deg, #fffbf6, #fff6eb 65%, #fceee2);
    border: 1px solid rgba(255, 255, 255, 0.85);
    box-shadow:
      0 40px 90px -40px rgba(111, 56, 52, 0.6),
      0 0 0 1px rgba(136, 82, 72, 0.1),
      inset 0 1px 0 #fff;
    transform: rotate(-0.8deg);
    transition: transform 0.5s var(--ease-soft), opacity 0.45s ease;
    animation: card-in 0.75s cubic-bezier(0.22, 1.1, 0.36, 1);
    overflow: hidden;
  }

  .intro-card.leaving {
    transform: translateY(-14px) rotate(0.5deg) scale(0.97);
    opacity: 0;
  }

  .intro-grain {
    opacity: 0.2;
  }

  .stamp {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 54px;
    height: 62px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    border: 1px dashed rgba(168, 62, 86, 0.5);
    border-radius: 5px;
    color: var(--rose-deep);
    background: rgba(244, 201, 201, 0.2);
    transform: rotate(5deg);
  }

  .stamp-inner {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .stamp-caption {
    font-size: 0.42rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  .intro-faces {
    position: relative;
    height: 126px;
    width: 230px;
    margin: 0.2rem auto 0.4rem;
  }

  .intro-to-face {
    position: absolute;
    right: 38px;
    bottom: 0;
    width: 118px;
    height: 126px;
    border-radius: 999px 999px 26px 26px;
    overflow: hidden;
    background: linear-gradient(170deg, #f7e6ec, #f1d3d5);
    border: 2px solid #fffaf4;
    box-shadow:
      0 0 0 1px rgba(136, 82, 72, 0.12),
      0 18px 30px -18px rgba(118, 62, 58, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 2;
  }

  .intro-to-face :global(svg) {
    width: 122%;
    margin-bottom: -5%;
  }

  .intro-from-face {
    position: absolute;
    left: 10px;
    bottom: 2px;
    width: 68px;
    height: 74px;
    border-radius: 999px 999px 18px 18px;
    overflow: hidden;
    background: linear-gradient(170deg, #f8e4d8, #f1d3c5);
    border: 2px solid #fffaf4;
    box-shadow:
      0 0 0 1px rgba(136, 82, 72, 0.12),
      0 12px 20px -12px rgba(118, 62, 58, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 3;
    transform: rotate(-5deg);
  }

  .intro-from-face :global(svg) {
    width: 128%;
    margin-bottom: -6%;
  }

  .faces-heart {
    position: absolute;
    left: 63px;
    top: 54px;
    z-index: 4;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    color: #fff9f3;
    background: var(--rose);
    border: 2px solid #fffaf4;
    box-shadow: 0 6px 12px -6px rgba(168, 62, 86, 0.7);
  }

  .faces-dash {
    position: absolute;
    left: 72px;
    top: 62px;
    width: 72px;
    height: 30px;
    border-top: 1.5px dashed rgba(168, 62, 86, 0.35);
    border-radius: 50%;
    transform: rotate(-8deg);
  }

  .intro-eyebrow {
    display: block;
    font-size: 0.62rem;
    font-weight: 750;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-top: 0.4rem;
  }

  .intro-card h1 {
    margin: 0.3rem 0 0.25rem;
    font-size: clamp(2.5rem, 8vw, 3.1rem);
    line-height: 1;
    letter-spacing: -0.045em;
    font-weight: 520;
    color: var(--ink);
    overflow-wrap: anywhere;
  }

  .intro-sub {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1.02rem;
    color: var(--ink-soft);
  }

  .intro-sub strong {
    color: var(--rose-deep);
    font-weight: 600;
  }

  .intro-copy {
    margin: 0.75rem auto 0;
    max-width: 30ch;
    font-size: 0.8rem;
    line-height: 1.55;
    color: var(--ink-faint);
  }

  .open-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    margin-top: 1.1rem;
    min-height: 50px;
    padding: 0.55rem 1.1rem 0.55rem 0.55rem;
    border-radius: 999px;
    background: var(--ink);
    color: #fff9f2;
    font-size: 0.88rem;
    font-weight: 700;
    box-shadow: 0 16px 26px -16px rgba(62, 42, 41, 0.9);
    transition: transform 0.3s var(--ease-spring), background 0.2s ease;
  }

  .open-icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.14);
    color: #ffd9d2;
  }

  .intro-card:hover .open-pill {
    transform: translateY(-2px) scale(1.02);
    background: #523a37;
  }

  .open-hint {
    margin-top: 0.65rem;
    font-size: 0.63rem;
    color: var(--ink-faint);
    line-height: 1.4;
  }

  .intro-hit {
    position: absolute;
    inset: 0;
    z-index: 9;
    border: 0;
    background: transparent;
    border-radius: 28px;
    cursor: pointer;
  }

  .intro-hit:focus-visible {
    outline: 3px solid var(--rose);
    outline-offset: 5px;
  }

  .make-own {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 38px;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
    color: var(--ink-faint);
    font-size: 0.7rem;
    font-weight: 650;
    transition: color 0.2s ease, background 0.2s ease;
  }

  .make-own:hover {
    color: var(--rose-deep);
    background: rgba(255, 250, 244, 0.55);
  }

  .intro-foot {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    padding: 0 1rem max(0.9rem, env(safe-area-inset-bottom));
  }

  .intro-foot span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.6rem;
    color: var(--ink-faint);
    text-align: center;
  }

  .intro .sound-toggle {
    backdrop-filter: blur(10px);
  }

  /* ---------- End ---------- */

  .end-overlay {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: grid;
    align-items: end;
    justify-items: center;
    padding: 1rem 1rem max(1rem, env(safe-area-inset-bottom));
    pointer-events: none;
    animation: end-fade 0.4s ease both;
  }

  .end-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(253, 244, 234, 0.8), rgba(253, 244, 234, 0.1) 45%, transparent 70%);
    pointer-events: none;
  }

  .end-card {
    position: relative;
    width: min(700px, 100%);
    display: flex;
    align-items: center;
    gap: 1.4rem;
    padding: 1.05rem 1.15rem;
    border-radius: 22px;
    background:
      radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.85), transparent 45%),
      linear-gradient(165deg, #fffbf6, #fff5ea 65%, #fcefe3);
    border: 1px solid rgba(255, 255, 255, 0.85);
    box-shadow:
      0 34px 80px -34px rgba(111, 56, 52, 0.55),
      0 0 0 1px rgba(136, 82, 72, 0.1),
      inset 0 1px 0 #fff;
    pointer-events: auto;
    animation: end-rise 0.6s cubic-bezier(0.22, 1.1, 0.36, 1) both;
    text-align: left;
  }

  .end-seal {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: #fff8f0;
    background:
      radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.3), transparent 55%),
      linear-gradient(150deg, #d96e82, var(--rose-deep));
    box-shadow:
      0 8px 16px -10px rgba(168, 62, 86, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    rotate: -7deg;
  }

  .end-copy {
    flex: 1;
    min-width: 0;
  }

  .end-eyebrow {
    display: block;
    font-size: 0.55rem;
    font-weight: 750;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .end-card h2 {
    margin-top: 0.15rem;
    font-size: clamp(1.45rem, 4vw, 1.75rem);
    letter-spacing: -0.035em;
    font-weight: 540;
    line-height: 1.1;
  }

  .end-card h2:focus {
    outline: none;
  }

  .end-copy p {
    margin-top: 0.25rem;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.8rem;
    color: var(--ink-soft);
    line-height: 1.4;
  }

  .end-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .end-sendback,
  .end-replay {
    min-height: 46px;
    font-size: 0.8rem;
    border-radius: 13px;
    white-space: nowrap;
  }

  .end-sendback {
    padding-inline: 1.05rem;
  }

  .end-replay {
    padding-inline: 0.8rem;
  }

  @keyframes card-in {
    from {
      opacity: 0;
      transform: translateY(24px) rotate(1.5deg) scale(0.97);
    }
    to {
      opacity: 1;
      transform: rotate(-0.8deg) scale(1);
    }
  }

  @keyframes end-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes end-rise {
    from {
      opacity: 0;
      transform: translateY(28px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes intro-bob {
    0%,
    100% {
      transform: translateY(0) rotate(-4deg);
    }
    50% {
      transform: translateY(-12px) rotate(5deg);
    }
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

    .topbar-inner,
    .intro-topbar {
      gap: 0.4rem;
      padding-inline: 0.8rem;
    }
  }

  @media (max-height: 620px) {
    .receiver {
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

    .play-dock {
      padding-bottom: max(0.3rem, env(safe-area-inset-bottom));
    }

    .play-dock-inner {
      padding: 0.35rem 0.5rem;
    }

    .end-card {
      padding: 0.7rem 0.9rem;
      gap: 0.8rem;
    }

    .end-copy p {
      display: none;
    }

    .end-card h2 {
      font-size: 1.3rem;
    }

    .end-overlay {
      padding-bottom: max(0.4rem, env(safe-area-inset-bottom));
    }
  }

  @media (max-width: 760px) {
    .receiver {
      min-height: 520px;
    }

    .topbar,
    .intro-topbar {
      padding-top: max(0.55rem, env(safe-area-inset-top));
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

    .skip span {
      display: none;
    }

    .skip {
      min-width: 38px;
      justify-content: center;
    }

    .play-dock {
      padding-inline: 0.55rem;
    }

    .intro-main {
      padding: 0.7rem 0.9rem;
    }

    .intro-card {
      padding: 1.5rem 1.2rem 1.2rem;
      border-radius: 24px;
    }

    .intro-faces {
      height: 112px;
      width: 210px;
    }

    .intro-to-face {
      width: 104px;
      height: 112px;
      right: 34px;
    }

    .intro-from-face {
      width: 62px;
      height: 68px;
      left: 8px;
    }

    .faces-heart {
      left: 58px;
      top: 48px;
      width: 26px;
      height: 26px;
    }

    .faces-dash {
      left: 64px;
      top: 56px;
      width: 64px;
    }

    .intro-card h1 {
      font-size: 2.4rem;
    }

    .intro-copy {
      font-size: 0.76rem;
      max-width: 28ch;
    }

    .open-pill {
      min-height: 48px;
      font-size: 0.84rem;
    }

    .end-overlay {
      padding: 0.7rem 0.7rem max(0.7rem, env(safe-area-inset-bottom));
    }

    .end-card {
      border-radius: 22px;
      padding: 1rem 1rem 0.95rem;
      flex-direction: column;
      align-items: stretch;
      gap: 0.8rem;
      text-align: center;
    }

    .end-seal {
      display: none;
    }

    .end-actions {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5rem;
    }

    .end-replay {
      grid-column: 1;
    }

    .end-sendback {
      grid-column: 2;
    }

    .end-sendback,
    .end-replay {
      width: auto;
      min-height: 48px;
    }

    .end-card h2 {
      font-size: 1.7rem;
    }

    .play-dock-inner {
      padding: 0.5rem 0.55rem 0.5rem 0.8rem;
    }

        .intro-foot {
      padding-bottom: max(0.6rem, env(safe-area-inset-bottom));
    }
  }

  @media (max-height: 500px) {
    .intro-topbar {
      padding-top: max(0.3rem, env(safe-area-inset-top));
    }

    .intro-main {
      padding: 0.2rem 0.8rem;
    }

    .intro-card-wrap {
      gap: 0.35rem;
    }

    .intro-card {
      padding: 0.75rem 1rem 0.7rem;
      border-radius: 20px;
    }

    .intro-grain,
    .stamp {
      display: none;
    }

    .intro-faces {
      height: 72px;
      width: 170px;
      margin: 0 auto 0.1rem;
    }

    .intro-to-face {
      width: 66px;
      height: 72px;
      right: 28px;
      border-radius: 999px 999px 16px 16px;
    }

    .intro-from-face {
      width: 42px;
      height: 47px;
      left: 8px;
      border-radius: 999px 999px 12px 12px;
    }

    .faces-heart {
      left: 49px;
      top: 25px;
      width: 20px;
      height: 20px;
    }

    .faces-dash {
      display: none;
    }

    .intro-eyebrow {
      margin-top: 0.1rem;
      font-size: 0.52rem;
    }

    .intro-card h1 {
      margin: 0.1rem 0;
      font-size: 1.9rem;
    }

    .intro-sub {
      font-size: 0.88rem;
    }

    .intro-copy {
      display: none;
    }

    .open-pill {
      min-height: 44px;
      margin-top: 0.55rem;
      font-size: 0.8rem;
    }

    .open-icon {
      width: 28px;
      height: 28px;
    }

    .open-hint {
      display: none;
    }

    .make-own {
      display: none;
    }

    .intro-foot {
      display: none;
    }
  }

  @media (max-height: 760px) and (max-width: 760px) {
    .stamp {
      display: none;
    }

    .intro-faces {
      height: 90px;
      margin-bottom: 0.15rem;
    }

    .intro-to-face {
      width: 84px;
      height: 90px;
    }

    .intro-from-face {
      width: 52px;
      height: 56px;
    }

    .faces-heart {
      left: 74px;
      top: 30px;
    }

    .faces-dash {
      top: 44px;
    }

    .intro-card {
      padding-top: 1.2rem;
    }

    .intro-copy {
      display: none;
    }

    .intro-card h1 {
      font-size: 2.1rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .intro,
    .intro-card,
    .end-overlay,
    .end-card,
    .float-heart {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
