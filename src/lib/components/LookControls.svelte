<script lang="ts">
  import { BLUSH_TONES, HAIR_COLORS, HAIR_STYLES, SKINS, randomLook } from '../looks';
  import type { Look } from '../types';
  import Icon from './Icon.svelte';

  interface Props {
    look: Look;
    name: string;
    role: 'from' | 'to';
    onchange: (look: Look) => void;
  }

  let { look, name, role, onchange }: Props = $props();

  function set<K extends keyof Look>(key: K, value: Look[K]) {
    onchange({ ...look, [key]: value });
  }
</script>

<div class="looks">
  <div class="looks-head">
    <div>
      <span class="eyebrow">Tweak the {role} look</span>
      <p>{name ? `${name}'s little avatar` : 'A little face to kiss'}</p>
    </div>
    <button
      type="button"
      class="shuffle"
      onclick={() => onchange(randomLook(look))}
      aria-label="Surprise me with a random look"
    >
      <Icon name="sparkle" size={14} />
      Surprise
    </button>
  </div>

  <div class="group">
    <span class="label">Skin</span>
    <div class="swatches" role="group" aria-label="Skin tone">
      {#each SKINS as skin, i}
        <button
          type="button"
          class="swatch"
          class:selected={look.skin === i}
          style="--swatch: {skin.base}; --swatch-deep: {skin.deep}"
          aria-label={skin.name}
          aria-pressed={look.skin === i}
          onclick={() => set('skin', i)}
        ></button>
      {/each}
    </div>
  </div>

  <div class="group">
    <span class="label">Hair</span>
    <div class="styles" role="group" aria-label="Hair style">
      {#each HAIR_STYLES as style, i}
        <button
          type="button"
          class="style-pill"
          class:selected={look.hair === i}
          aria-pressed={look.hair === i}
          title={style.note}
          onclick={() => set('hair', i)}
        >
          {style.name}
        </button>
      {/each}
    </div>
  </div>

  <div class="group">
    <span class="label">Color</span>
    <div class="swatches" role="group" aria-label="Hair color">
      {#each HAIR_COLORS as color, i}
        <button
          type="button"
          class="swatch"
          class:selected={look.hairColor === i}
          style="--swatch: {color.base}; --swatch-deep: {color.dark}"
          aria-label={color.name}
          aria-pressed={look.hairColor === i}
          onclick={() => set('hairColor', i)}
        ></button>
      {/each}
    </div>
  </div>

  <div class="group">
    <span class="label">Blush</span>
    <div class="swatches" role="group" aria-label="Blush color">
      {#each BLUSH_TONES as blush, i}
        <button
          type="button"
          class="swatch"
          class:selected={look.blush === i}
          style="--swatch: {blush.cheek}; --swatch-deep: {blush.lip}"
          aria-label={blush.name}
          aria-pressed={look.blush === i}
          onclick={() => set('blush', i)}
        ></button>
      {/each}
    </div>
  </div>
</div>

<style>
  .looks {
    margin-top: 0.85rem;
    padding: 0.9rem;
    border-radius: 18px;
    background: rgba(248, 232, 217, 0.42);
    border: 1px solid var(--line-soft);
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .looks-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .looks-head p {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.92rem;
    color: var(--ink-soft);
    margin-top: 0.1rem;
  }

  .eyebrow {
    font-size: 0.56rem;
  }

  .shuffle {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.35rem 0.55rem;
    border-radius: 999px;
    color: var(--rose-deep);
    background: rgba(255, 250, 244, 0.75);
    border: 1px solid rgba(168, 62, 86, 0.18);
    font-size: 0.68rem;
    font-weight: 700;
    transition: background 0.2s ease, transform 0.2s var(--ease-spring);
    flex-shrink: 0;
  }

  .shuffle:hover {
    background: #fffaf4;
    transform: rotate(-2deg) scale(1.03);
  }

  .group {
    display: grid;
    grid-template-columns: 3.2rem 1fr;
    align-items: center;
    gap: 0.4rem;
  }

  .label {
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 0.38rem;
  }

  .swatch {
    width: 31px;
    height: 31px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.7), transparent 55%), var(--swatch);
    border: 1.5px solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 0 0 1px rgba(107, 70, 62, 0.12), 0 2px 4px rgba(107, 70, 62, 0.12);
    transition: transform 0.18s var(--ease-spring), box-shadow 0.18s ease;
    position: relative;
  }

  .swatch:hover {
    transform: scale(1.14);
  }

  .swatch.selected {
    box-shadow:
      0 0 0 2px var(--paper),
      0 0 0 4px var(--swatch-deep),
      0 2px 6px rgba(107, 70, 62, 0.2);
  }

  .styles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.32rem;
  }

  .style-pill {
    min-height: 32px;
    padding: 0.25rem 0.58rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 650;
    color: var(--ink-soft);
    background: rgba(255, 250, 244, 0.6);
    border: 1px solid var(--line-soft);
    transition: all 0.18s ease;
  }

  .style-pill:hover {
    color: var(--ink);
    background: var(--paper);
  }

  .style-pill.selected {
    background: var(--ink);
    border-color: var(--ink);
    color: #fff6ec;
  }

  @media (max-width: 760px) {
    .swatch {
      width: 35px;
      height: 35px;
    }

    .style-pill {
      min-height: 36px;
      padding: 0.3rem 0.65rem;
      font-size: 0.72rem;
    }

    .shuffle {
      min-height: 38px;
      padding-inline: 0.65rem;
    }
  }
</style>
