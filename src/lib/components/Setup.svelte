<script lang="ts">
  import { slide } from 'svelte/transition';
  import {
    DEFAULT_FROM_LOOK,
    DEFAULT_TO_LOOK,
    randomPair,
  } from '../looks';
  import {
    MAX_NAME_CHARS,
    byteLength,
    charCount,
    nameProblem,
    sanitizeName,
  } from '../codec';
  import type { Look, Note } from '../types';
  import Avatar from './Avatar.svelte';
  import Brand from './Brand.svelte';
  import Icon from './Icon.svelte';
  import LookControls from './LookControls.svelte';
  import LovePostcard from './LovePostcard.svelte';

  interface Props {
    onStart: (note: Note) => void;
  }

  let { onStart }: Props = $props();

  let from = $state('');
  let to = $state('');
  let fromLook = $state<Look>({ ...DEFAULT_FROM_LOOK });
  let toLook = $state<Look>({ ...DEFAULT_TO_LOOK });
  let editing = $state<'from' | 'to' | null>(null);
  let touched = $state({ from: false, to: false });
  let fromInput: HTMLInputElement | undefined = $state();
  let toInput: HTMLInputElement | undefined = $state();

  let fromProblem = $derived(nameProblem(from));
  let toProblem = $derived(nameProblem(to));
  let canStart = $derived(fromProblem === null && toProblem === null);
  let fromCount = $derived(charCount(sanitizeName(from)));
  let toCount = $derived(charCount(sanitizeName(to)));
  let fromBytes = $derived(byteLength(sanitizeName(from)));
  let toBytes = $derived(byteLength(sanitizeName(to)));

  function swap() {
    [from, to] = [to, from];
    [fromLook, toLook] = [toLook, fromLook];
    [touched.from, touched.to] = [touched.to, touched.from];
    editing = null;
  }

  function surprise() {
    const pair = randomPair();
    fromLook = pair.from;
    toLook = pair.to;
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    touched = { from: true, to: true };
    if (fromProblem) {
      fromInput?.focus();
      return;
    }
    if (toProblem) {
      toInput?.focus();
      return;
    }
    onStart({
      from: sanitizeName(from),
      to: sanitizeName(to),
      fromLook: { ...fromLook },
      toLook: { ...toLook },
      kisses: [],
    });
  }

  let helper = $derived.by(() => {
    if (fromProblem || toProblem) {
      return sanitizeName(from) || sanitizeName(to)
        ? 'A tiny name fix above and you are set.'
        : 'Add both names to begin.';
    }
    return `Next, tap kisses right onto ${sanitizeName(to)}'s face.`;
  });
</script>

<div class="setup">
  <header class="topbar">
    <div class="container topbar-inner">
      <Brand />
      <span class="privacy-chip" title="No servers. Just love.">
        <Icon name="lock" size={13} />
        <span class="privacy-full">No servers. Just love.</span>
        <span class="privacy-short">Private</span>
      </span>
    </div>
  </header>

  <main class="container hero">
    <section class="intro" aria-labelledby="hero-title">
      <span class="eyebrow intro-eyebrow">For the ones far away</span>
      <h1 id="hero-title">A little kiss,<br /><em>across the miles.</em></h1>
      <p class="lede">
        Make two tiny avatars, kiss their face as many times as you like, then send a private
        link. It's a whole love note, folded into a URL.
      </p>

      <ul class="features">
        <li><span class="feature-dot rose"><Icon name="heart" size={11} /></span> No sign-up</li>
        <li><span class="feature-dot peach"><Icon name="sparkle" size={11} /></span> Nothing stored</li>
        <li><span class="feature-dot butter"><Icon name="lock" size={12} /></span> Private by design</li>
      </ul>

      <LovePostcard />

      <p class="aside-note">
        <Icon name="heart" size={13} />
        Works on phones, tablets, laptops, and any long, quiet night.
      </p>
    </section>

    <section class="card" aria-labelledby="setup-title">
      <span class="card-grain grain"></span>
      <div class="card-head">
        <div>
          <span class="eyebrow">Step one, softly</span>
          <h2 id="setup-title">Start a love note</h2>
          <p class="card-sub">Two faces, a link, and a little bit of longing.</p>
        </div>
        <button type="button" class="surprise" onclick={surprise} title="Surprise us" aria-label="Surprise us with two random looks">
          <Icon name="sparkle" size={15} />
          <span>Surprise us</span>
        </button>
      </div>

      <form onsubmit={submit} novalidate>
        <div class="people">
          <div class="person">
            <div class="portrait-wrap">
              <div class="portrait portrait-from">
                <Avatar look={fromLook} blush={0.32} class="portrait-avatar" />
              </div>
              <span class="role-tag from-tag">From</span>
            </div>

            <label class="field-label" for="from-name">
              From
              <span>that's you</span>
            </label>
            <div class="input-wrap">
              <input
                id="from-name"
                bind:this={fromInput}
                bind:value={from}
                type="text"
                dir="auto"
                placeholder="Your name"
                autocomplete="off"
                autocapitalize="words"
                enterkeyhint="next"
                spellcheck="false"
                maxlength="40"
                class:invalid={touched.from && fromProblem !== null}
                aria-invalid={touched.from && fromProblem !== null}
                aria-describedby="from-help"
                onblur={() => (touched.from = true)}
              />
            </div>
            <div class="meter-row" id="from-help">
              {#if touched.from && fromProblem}
                <span class="problem">{fromProblem}</span>
              {:else if fromBytes > 16}
                <span class="problem">A little too fancy for a link.</span>
              {:else}
                <span class="soft-hint">{from.length ? 'A lovely name.' : 'Up to 12 letters.'}</span>
              {/if}
              <span class="counter" class:over={fromCount > MAX_NAME_CHARS || fromBytes > 16}>
                {fromCount}/{MAX_NAME_CHARS}
              </span>
            </div>

            <button
              type="button"
              class="style-toggle"
              class:active={editing === 'from'}
              aria-expanded={editing === 'from'}
              onclick={() => (editing = editing === 'from' ? null : 'from')}
            >
              <Icon name="sparkle" size={13} />
              {editing === 'from' ? 'Done styling' : 'Style this face'}
              <Icon name="chevron-down" size={13} class="chev" />
            </button>

          </div>

          <div class="link" aria-hidden="true">
            <span class="link-line"></span>
            <button
              type="button"
              class="swap"
              onclick={swap}
              aria-label="Swap the From and To avatars"
              title="Swap them"
              tabindex="-1"
            >
              <Icon name="swap" size={16} />
            </button>
            <span class="link-line"></span>
          </div>

          <div class="person">
            <div class="portrait-wrap">
              <div class="portrait portrait-to">
                <Avatar look={toLook} blush={0.32} class="portrait-avatar" />
              </div>
              <span class="role-tag to-tag">To</span>
            </div>

            <label class="field-label" for="to-name">
              To
              <span>the one you miss</span>
            </label>
            <div class="input-wrap">
              <input
                id="to-name"
                bind:this={toInput}
                bind:value={to}
                type="text"
                dir="auto"
                placeholder="Their name"
                autocomplete="off"
                autocapitalize="words"
                enterkeyhint="go"
                spellcheck="false"
                maxlength="40"
                class:invalid={touched.to && toProblem !== null}
                aria-invalid={touched.to && toProblem !== null}
                aria-describedby="to-help"
                onblur={() => (touched.to = true)}
              />
            </div>
            <div class="meter-row" id="to-help">
              {#if touched.to && toProblem}
                <span class="problem">{toProblem}</span>
              {:else if toBytes > 16}
                <span class="problem">A little too fancy for a link.</span>
              {:else}
                <span class="soft-hint">{to.length ? 'They are going to blush.' : 'Up to 12 letters.'}</span>
              {/if}
              <span class="counter" class:over={toCount > MAX_NAME_CHARS || toBytes > 16}>
                {toCount}/{MAX_NAME_CHARS}
              </span>
            </div>

            <button
              type="button"
              class="style-toggle"
              class:active={editing === 'to'}
              aria-expanded={editing === 'to'}
              onclick={() => (editing = editing === 'to' ? null : 'to')}
            >
              <Icon name="sparkle" size={13} />
              {editing === 'to' ? 'Done styling' : 'Style this face'}
              <Icon name="chevron-down" size={13} class="chev" />
            </button>

          </div>
        </div>

        {#if editing}
          <div class="look-panel" transition:slide={{ duration: 260 }}>
            <LookControls
              look={editing === 'from' ? fromLook : toLook}
              name={sanitizeName(editing === 'from' ? from : to)}
              role={editing}
              onchange={(next) => {
                if (editing === 'from') fromLook = next;
                else toLook = next;
              }}
            />
          </div>
        {/if}

        <div class="cta">
          <button type="submit" class="btn-primary start-btn">
            Save &amp; start kissing
            <Icon name="arrow-right" size={18} />
          </button>
          <p class="helper" aria-live="polite">{helper}</p>
        </div>
      </form>

      <p class="card-privacy">
        <Icon name="lock" size={12} />
        Your note lives entirely inside its link. Nothing is uploaded, ever.
      </p>
    </section>
  </main>

  <footer class="footer container">
    <span>Mr. Kiss — made for the in-between.</span>
    <span class="footer-dot">·</span>
    <span>Sealed with a kiss, not a cookie.</span>
  </footer>
</div>

<style>
  .setup {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .container {
    width: min(1160px, calc(100% - 3rem));
    margin-inline: auto;
  }

  .topbar {
    padding: max(1.35rem, env(safe-area-inset-top)) 0 0.5rem;
    position: relative;
    z-index: 2;
  }

  .topbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .privacy-short {
    display: none;
  }

  .privacy-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.85rem;
    border-radius: 999px;
    background: rgba(255, 250, 244, 0.55);
    border: 1px solid var(--line-soft);
    backdrop-filter: blur(8px);
    color: var(--ink-soft);
    font-size: 0.74rem;
    font-weight: 650;
    letter-spacing: 0.01em;
  }

  .hero {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
    align-items: center;
    gap: clamp(2rem, 5vw, 5.5rem);
    padding: clamp(1.5rem, 4vh, 3rem) 0 2rem;
    position: relative;
    z-index: 1;
  }

  .intro {
    padding-bottom: 1rem;
  }

  .intro-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .intro-eyebrow::before {
    content: '';
    width: 26px;
    height: 1px;
    background: var(--rose);
    opacity: 0.5;
  }

  h1 {
    margin-top: 1.1rem;
    font-size: clamp(2.8rem, 4.5vw, 4.35rem);
    line-height: 0.99;
    letter-spacing: -0.045em;
    font-weight: 520;
  }

  h1 em {
    font-style: italic;
    font-weight: 430;
    color: var(--rose-deep);
    position: relative;
  }

  h1 em::after {
    content: '';
    position: absolute;
    left: 4%;
    right: 0;
    bottom: -0.08em;
    height: 0.22em;
    border-radius: 999px;
    background: radial-gradient(ellipse at center, rgba(201, 86, 109, 0.18), transparent 70%);
    z-index: -1;
  }

  .lede {
    max-width: 30rem;
    margin-top: 1.3rem;
    font-size: clamp(0.98rem, 1.25vw, 1.07rem);
    line-height: 1.65;
    color: var(--ink-soft);
    font-weight: 500;
  }

  .features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin: 1.4rem 0 0;
    padding: 0;
    list-style: none;
  }

  .features li {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.74rem;
    font-weight: 650;
    color: var(--ink-soft);
    background: rgba(255, 250, 244, 0.55);
    border: 1px solid var(--line-soft);
    border-radius: 999px;
    padding: 0.4rem 0.7rem 0.4rem 0.45rem;
    backdrop-filter: blur(6px);
  }

  .feature-dot {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: #fff9f2;
  }

  .feature-dot.rose {
    background: #cf6478;
  }
  .feature-dot.peach {
    background: #e8a27f;
  }
  .feature-dot.butter {
    background: #c79c53;
  }

  .aside-note {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-top: 1.2rem;
    color: var(--ink-faint);
    font-size: 0.76rem;
    font-style: italic;
    font-family: var(--font-display);
  }

  .aside-note :global(svg) {
    color: var(--rose);
    flex-shrink: 0;
  }

  .card {
    position: relative;
    border-radius: 32px;
    padding: clamp(1.3rem, 2.2vw, 2rem);
    background:
      radial-gradient(circle at 15% 0%, rgba(255, 255, 255, 0.9), transparent 45%),
      linear-gradient(165deg, #fffbf6, #fff6ec 60%, #fdf0e4);
    border: 1px solid rgba(136, 82, 72, 0.16);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }

  .card-grain {
    opacity: 0.22;
  }

  .card-head {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.2rem;
  }

  .card-head h2 {
    margin-top: 0.35rem;
    font-size: clamp(1.6rem, 2.4vw, 2.05rem);
    font-weight: 560;
    letter-spacing: -0.035em;
  }

  .card-sub {
    margin-top: 0.28rem;
    font-size: 0.84rem;
    color: var(--ink-soft);
  }

  .surprise {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.48rem 0.7rem;
    border-radius: 999px;
    border: 1px dashed rgba(168, 62, 86, 0.32);
    color: var(--rose-deep);
    background: rgba(255, 250, 244, 0.55);
    font-size: 0.7rem;
    font-weight: 700;
    transition: transform 0.22s var(--ease-spring), background 0.2s ease;
  }

  .surprise:hover {
    transform: rotate(-2deg) scale(1.04);
    background: #fffaf4;
  }

  .people {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 2.1rem minmax(0, 1fr);
    gap: 0.7rem;
    align-items: start;
  }

  .person {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .portrait-wrap {
    position: relative;
    align-self: center;
    margin-bottom: 0.85rem;
  }

  .portrait {
    width: clamp(104px, 10vw, 126px);
    aspect-ratio: 0.94;
    border-radius: 999px 999px 26px 26px;
    background:
      radial-gradient(circle at 50% 25%, #fffaf3, transparent 70%),
      linear-gradient(170deg, #f9e9db, #f3d6c9);
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow:
      0 0 0 1px rgba(136, 82, 72, 0.1),
      0 20px 34px -22px rgba(118, 62, 58, 0.55),
      inset 0 1px 0 #fff;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .portrait-to {
    background:
      radial-gradient(circle at 50% 25%, #fffaf3, transparent 70%),
      linear-gradient(170deg, #f6e5ee, #f1d5d7);
  }

  .portrait :global(.portrait-avatar) {
    width: 124%;
    margin-bottom: -6%;
  }

  .role-tag {
    position: absolute;
    bottom: 0.15rem;
    left: 50%;
    transform: translate(-50%, 50%) rotate(-2deg);
    padding: 0.22rem 0.6rem;
    border-radius: 999px;
    font-size: 0.55rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #fffaf4;
    box-shadow: 0 4px 12px -4px rgba(80, 40, 40, 0.45);
    white-space: nowrap;
  }

  .from-tag {
    background: #b24a60;
  }

  .to-tag {
    background: #7f5b7f;
    transform: translate(-50%, 50%) rotate(2deg);
  }

  .field-label {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: var(--ink-soft);
    margin-bottom: 0.35rem;
  }

  .field-label span {
    font-size: 0.62rem;
    font-weight: 550;
    letter-spacing: 0.01em;
    text-transform: none;
    color: var(--ink-faint);
    font-style: italic;
    font-family: var(--font-display);
  }

  .input-wrap {
    position: relative;
  }

  input {
    width: 100%;
    min-height: 48px;
    padding: 0.6rem 0.9rem;
    border-radius: 14px;
    border: 1.5px solid rgba(136, 82, 72, 0.17);
    background: rgba(255, 253, 249, 0.85);
    font-family: var(--font-display);
    font-size: 1.12rem;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--ink);
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  input::placeholder {
    color: #bda49a;
    font-style: italic;
    font-weight: 430;
  }

  input:hover {
    border-color: rgba(136, 82, 72, 0.3);
  }

  input:focus {
    border-color: var(--rose);
    background: #fffdf9;
    box-shadow: 0 0 0 4px rgba(201, 86, 109, 0.12);
  }

  input.invalid {
    border-color: #c05757;
    background: #fff9f6;
  }

  .meter-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 1.6rem;
    padding: 0.2rem 0.15rem 0;
  }

  .soft-hint {
    font-size: 0.66rem;
    color: var(--ink-faint);
    font-style: italic;
    font-family: var(--font-display);
    line-height: 1.3;
  }

  .problem {
    font-size: 0.65rem;
    color: #a84444;
    font-weight: 600;
    line-height: 1.3;
  }

  .counter {
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--ink-faint);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    padding-top: 0.05rem;
  }

  .counter.over {
    color: #a84444;
  }

  .style-toggle {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.1rem;
    min-height: 34px;
    padding: 0.25rem 0.5rem 0.25rem 0.35rem;
    border-radius: 999px;
    color: var(--ink-soft);
    font-size: 0.68rem;
    font-weight: 650;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .style-toggle:hover {
    background: rgba(136, 82, 72, 0.07);
    color: var(--ink);
  }

  .style-toggle.active {
    color: var(--rose-deep);
    background: rgba(201, 86, 109, 0.08);
  }

  .style-toggle :global(.chev) {
    transition: transform 0.25s ease;
    opacity: 0.7;
  }

  .style-toggle.active :global(.chev) {
    transform: rotate(180deg);
  }

  .look-panel {
    margin-top: 0.9rem;
  }

  .link {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: clamp(2rem, 5vw, 3rem);
    gap: 0.5rem;
  }

  .link-line {
    width: 1px;
    flex: 1;
    min-height: 14px;
    background-image: linear-gradient(to bottom, rgba(136, 82, 72, 0.28) 40%, transparent 40%);
    background-size: 1px 7px;
  }

  .swap {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--paper);
    border: 1px solid var(--line);
    color: var(--rose-deep);
    box-shadow: 0 4px 10px -5px rgba(80, 40, 40, 0.35);
    transition: transform 0.25s var(--ease-spring), background 0.2s ease;
    pointer-events: auto;
    cursor: pointer;
  }

  .swap:hover {
    transform: rotate(180deg);
    background: #fff;
  }

  .cta {
    margin-top: 1.3rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .start-btn {
    width: 100%;
  }

  .helper {
    text-align: center;
    font-size: 0.7rem;
    color: var(--ink-faint);
    font-style: italic;
    font-family: var(--font-display);
    min-height: 1.1rem;
  }

  .card-privacy {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    margin-top: 1rem;
    padding-top: 0.9rem;
    border-top: 1px dashed rgba(136, 82, 72, 0.16);
    color: var(--ink-faint);
    font-size: 0.62rem;
    text-align: center;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    padding: 0.75rem 0 max(1.35rem, env(safe-area-inset-bottom));
    color: var(--ink-faint);
    font-size: 0.67rem;
    position: relative;
    z-index: 1;
  }

  .footer-dot {
    opacity: 0.6;
  }

  @media (max-width: 1050px) {
    .container {
      width: min(680px, calc(100% - 2.5rem));
    }

    .topbar {
      padding-top: max(1rem, env(safe-area-inset-top));
    }

    .hero {
      grid-template-columns: 1fr;
      gap: 1.4rem;
      padding-top: 1.4rem;
      max-width: 680px;
    }

    .intro {
      text-align: center;
      padding-bottom: 0;
    }

    .intro h1 {
      font-size: clamp(2.55rem, 7vw, 3.5rem);
    }

    .lede {
      margin-inline: auto;
      font-size: 0.98rem;
      max-width: 34rem;
    }

    .features {
      justify-content: center;
    }

    .aside-note {
      display: none;
    }

    .intro :global(.postcard-scene) {
      display: none;
    }

    .footer {
      padding-bottom: 1.5rem;
    }
  }

  @media (max-width: 760px) {
    .container {
      width: calc(100% - 1.9rem);
    }

    .privacy-chip {
      font-size: 0.66rem;
      gap: 0.3rem;
      padding: 0.45rem 0.65rem;
    }

    .privacy-full {
      display: none;
    }

    .privacy-short {
      display: inline;
    }

    .privacy-chip :global(svg) {
      width: 14px;
      height: 14px;
    }

    .hero {
      gap: 1.1rem;
      padding-top: 1rem;
    }

    .intro h1 {
      font-size: clamp(2.25rem, 10.4vw, 3rem);
      margin-top: 0.7rem;
    }

    .lede {
      font-size: 0.9rem;
      line-height: 1.55;
      margin-top: 0.8rem;
    }

    .features {
      display: none;
    }

    .intro :global(.postcard-scene) {
      display: none;
    }

    .card {
      padding: 1.15rem;
      border-radius: 26px;
    }

    .card-head {
      margin-bottom: 1rem;
    }

    .card-head h2 {
      font-size: 1.5rem;
    }

    .card-sub {
      font-size: 0.78rem;
      max-width: 17rem;
    }

    .surprise {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.28rem;
      min-height: 38px;
      padding: 0.4rem 0.6rem;
      font-size: 0.62rem;
    }

    .surprise :global(svg) {
      width: 14px;
      height: 14px;
    }

    .people {
      grid-template-columns: 1fr;
      gap: 0.4rem;
    }

    .person {
      display: grid;
      grid-template-columns: 94px minmax(0, 1fr);
      grid-template-rows: auto auto auto auto;
      column-gap: 0.85rem;
      align-items: center;
    }

    .portrait-wrap {
      grid-row: 1 / span 4;
      margin: 0;
      align-self: start;
      padding-top: 0.1rem;
    }

    .portrait {
      width: 94px;
      aspect-ratio: 0.9;
      border-radius: 999px 999px 22px 22px;
    }

    .portrait :global(.portrait-avatar) {
      width: 128%;
      margin-bottom: -6%;
    }

    .field-label {
      grid-column: 2;
      margin-bottom: 0.25rem;
    }

    .input-wrap {
      grid-column: 2;
    }

    input {
      min-height: 44px;
      font-size: 1.05rem;
    }

    .meter-row {
      grid-column: 2;
      min-height: 1.4rem;
    }

    .style-toggle {
      grid-column: 2;
      justify-self: start;
      min-height: 40px;
      padding: 0.3rem 0.6rem 0.3rem 0.4rem;
      font-size: 0.7rem;
    }

    .look-panel {
      margin-top: 0.8rem;
    }

    .link {
      flex-direction: row;
      padding: 0.1rem 0;
      gap: 0.6rem;
      height: 30px;
    }

    .link-line {
      width: auto;
      height: 1px;
      min-height: 0;
      flex: 1;
      background-image: linear-gradient(to right, rgba(136, 82, 72, 0.28) 40%, transparent 40%);
      background-size: 7px 1px;
    }

    .swap {
      width: 36px;
      height: 36px;
    }

    .cta {
      margin-top: 0.9rem;
    }

    .start-btn {
      min-height: 52px;
      font-size: 0.98rem;
    }

    .card-privacy {
      margin-top: 0.8rem;
      padding-top: 0.75rem;
      font-size: 0.58rem;
      line-height: 1.45;
    }

    .footer {
      flex-wrap: wrap;
      gap: 0.35rem;
      font-size: 0.6rem;
      padding-bottom: 1.2rem;
    }

    .topbar {
      padding-top: max(0.9rem, env(safe-area-inset-top));
    }
  }

  @media (max-width: 380px) {
    .surprise {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      padding: 0;
      font-size: 0;
      gap: 0;
    }

    .surprise :global(svg) {
      width: 16px;
      height: 16px;
    }
  }

  @media (max-width: 390px) {
    .container {
      width: calc(100% - 1.4rem);
    }

    .person {
      grid-template-columns: 82px minmax(0, 1fr);
      column-gap: 0.7rem;
    }

    .portrait {
      width: 82px;
    }

    .card {
      padding: 1rem;
    }
  }
</style>
