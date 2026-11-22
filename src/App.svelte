<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Composer from './lib/components/Composer.svelte';
  import ErrorScreen from './lib/components/ErrorScreen.svelte';
  import Receiver from './lib/components/Receiver.svelte';
  import Setup from './lib/components/Setup.svelte';
  import ShareDialog from './lib/components/ShareDialog.svelte';
  import Toast from './lib/components/Toast.svelte';
  import { currentShareUrl, decodeHash, type DecodeFailure } from './lib/codec';
  import { kissCountLabel } from './lib/format';
  import { canNativeShare, copyText, isHandheld, nativeShare } from './lib/share';
  import { smooch } from './lib/sound';
  import type { Kiss, Note } from './lib/types';

  type Screen = 'setup' | 'compose' | 'receive' | 'error';

  const boot = typeof window === 'undefined' ? null : decodeHash(window.location.hash);

  let screen = $state<Screen>(boot === null ? 'setup' : boot.ok ? 'receive' : 'error');
  let activeNote = $state<Note | null>(boot !== null && boot.ok ? boot.note : null);
  let errorReason = $state<DecodeFailure | null>(boot !== null && !boot.ok ? boot.reason : null);
  let receiverKey = $state(0);

  let shareOpen = $state(false);
  let shareUrl = $state('');
  let shareCopied = $state(false);
  let shareKissCount = $state(0);
  let shareNoteInfo = $state<{ from: string; to: string } | null>(null);
  let pendingCopyToast = $state(false);

  let soundOn = $state(smooch.hydrate());

  let toastMessage = $state('');
  let toastTone = $state<'default' | 'warm'>('default');
  let toastId = $state(0);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function clearHash() {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  function startNote(note: Note) {
    activeNote = note;
    screen = 'compose';
    errorReason = null;
    shareOpen = false;
    clearHash();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  async function handleSend(kisses: Kiss[]) {
    if (!activeNote) return;
    const full: Note = { ...activeNote, kisses };
    const url = currentShareUrl(full);
    const noteInfo = { from: activeNote.from, to: activeNote.to };

    shareUrl = url;
    shareCopied = false;
    shareKissCount = kisses.length;
    shareNoteInfo = noteInfo;

    // Call the native share sheet inside the original click gesture where
    // possible; the copy/fallback sheet is waiting underneath.
    if (canNativeShare() && isHandheld()) {
      void nativeShare({
        title: `${kissCountLabel(kisses.length)} from ${noteInfo.from}`,
        text: `${kissCountLabel(kisses.length)} from ${noteInfo.from} to ${noteInfo.to} 💋`,
        url,
      });
    }

    const copied = await copyText(url);
    shareCopied = copied;
    shareOpen = true;
    pendingCopyToast = copied;
    history.replaceState(null, '', url);
  }

  function closeShare() {
    shareOpen = false;
    if (pendingCopyToast) {
      pendingCopyToast = false;
      showToast('Copied — go make someone blush.', 'warm');
    }
  }

  function newNote() {
    activeNote = null;
    screen = 'setup';
    errorReason = null;
    shareOpen = false;
    pendingCopyToast = false;
    clearHash();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function sendBack() {
    if (!activeNote) return;
    const swapped: Note = {
      from: activeNote.to,
      to: activeNote.from,
      fromLook: activeNote.toLook,
      toLook: activeNote.fromLook,
      kisses: [],
    };
    activeNote = swapped;
    screen = 'compose';
    shareOpen = false;
    clearHash();
    window.scrollTo({ top: 0, behavior: 'auto' });
    showToast(`Now it's your turn, ${swapped.from}.`, 'warm');
  }

  async function toggleSound() {
    soundOn = !soundOn;
    await smooch.setEnabled(soundOn);
  }

  function showToast(message: string, tone: 'default' | 'warm' = 'default') {
    toastMessage = message;
    toastTone = tone;
    toastId += 1;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage = '';
    }, 3000);
  }

  function handleHashChange() {
    const result = decodeHash(window.location.hash);
    shareOpen = false;
    if (result === null) {
      activeNote = null;
      screen = 'setup';
      return;
    }
    if (result.ok) {
      activeNote = result.note;
      errorReason = null;
      receiverKey += 1;
      screen = 'receive';
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      activeNote = null;
      errorReason = result.reason;
      screen = 'error';
    }
  }

  onMount(() => {
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      if (toastTimer) clearTimeout(toastTimer);
    };
  });

  $effect(() => {
    if (screen === 'receive' && activeNote) {
      document.title = `${activeNote.to}, you have ${kissCountLabel(activeNote.kisses.length)} — Mr. Kiss`;
    } else if (screen === 'compose' && activeNote) {
      document.title = `A kiss for ${activeNote.to} — Mr. Kiss`;
    } else if (screen === 'error') {
      document.title = 'This kiss got lost — Mr. Kiss';
    } else {
      document.title = 'Mr. Kiss — a little love, sealed with a kiss';
    }

    // Shared notes live in the URL hash and are meant to stay private.
    // The landing page stays indexable; a note view opts itself out.
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) {
      const isPrivateView = screen === 'receive' || screen === 'error';
      robots.setAttribute(
        'content',
        isPrivateView
          ? 'noindex, nofollow'
          : 'index, follow, max-image-preview:large, max-snippet:-1'
      );
    }
  });
</script>

<div class="app-bg" aria-hidden="true">
  <div class="blob blob-rose"></div>
  <div class="blob blob-peach"></div>
  <div class="blob blob-butter"></div>
  <div class="blob blob-lav"></div>
  <div class="grain"></div>
</div>

<div class="app-content">
  {#if screen === 'setup'}
    <div in:fade={{ duration: 350 }}><Setup onStart={startNote} /></div>
  {:else if screen === 'compose' && activeNote}
    <div in:fade={{ duration: 380 }}><Composer
      note={activeNote}
      {soundOn}
      onToggleSound={toggleSound}
      onSend={handleSend}
      onNewNote={newNote}
    /></div>
  {:else if screen === 'receive' && activeNote}
    {#key receiverKey}
      <div in:fade={{ duration: 420 }}>
        <Receiver
          note={activeNote}
          {soundOn}
          onToggleSound={toggleSound}
          onSendBack={sendBack}
          onNewNote={newNote}
        />
      </div>
    {/key}
  {:else if screen === 'error'}
    <div in:fade={{ duration: 350 }}><ErrorScreen reason={errorReason} onStart={newNote} /></div>
  {/if}
</div>

<ShareDialog
  open={shareOpen}
  url={shareUrl}
  from={shareNoteInfo?.from ?? activeNote?.from ?? ''}
  to={shareNoteInfo?.to ?? activeNote?.to ?? ''}
  kissCount={shareKissCount}
  autoCopied={shareCopied}
  onClose={closeShare}
/>

{#if toastMessage}
  {#key toastId}
    <Toast message={toastMessage} tone={toastTone} />
  {/key}
{/if}

<style>
  :global(body) {
    background-color: var(--cream);
  }

  .app-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255, 252, 246, 0.9), transparent 70%),
      linear-gradient(180deg, #fdf5ec 0%, #fbeede 55%, #f8e9dd 100%);
  }

  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(72px);
    opacity: 0.55;
    will-change: transform;
  }

  .blob-rose {
    width: 46vw;
    height: 46vw;
    min-width: 360px;
    min-height: 360px;
    top: -16%;
    left: -12%;
    background: #f4c4c7;
    animation: drift-a 26s ease-in-out infinite;
  }

  .blob-peach {
    width: 38vw;
    height: 38vw;
    min-width: 300px;
    min-height: 300px;
    right: -10%;
    top: 8%;
    background: #f6d2b4;
    opacity: 0.5;
    animation: drift-b 32s ease-in-out infinite;
  }

  .blob-butter {
    width: 34vw;
    height: 34vw;
    min-width: 280px;
    min-height: 280px;
    left: 12%;
    bottom: -22%;
    background: #f3dfb6;
    opacity: 0.38;
    animation: drift-c 30s ease-in-out infinite;
  }

  .blob-lav {
    width: 24vw;
    height: 24vw;
    min-width: 200px;
    min-height: 200px;
    right: 18%;
    bottom: -12%;
    background: #dcc9e4;
    opacity: 0.28;
    animation: drift-a 36s ease-in-out infinite reverse;
  }

  .app-bg :global(.grain) {
    opacity: 0.28;
  }

  .app-content {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    min-height: 100dvh;
  }

  @keyframes drift-a {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(4%, 3%, 0) scale(1.06);
    }
  }

  @keyframes drift-b {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(-5%, 4%, 0) scale(1.05);
    }
  }

  @keyframes drift-c {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(3%, -3%, 0) scale(1.08);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .blob {
      animation: none !important;
    }
  }
</style>
