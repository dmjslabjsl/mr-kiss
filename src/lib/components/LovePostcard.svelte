<script lang="ts">
  import Icon from './Icon.svelte';
</script>

<div class="postcard-scene" aria-hidden="true">
  <div class="orbit orbit-a"></div>
  <div class="orbit orbit-b"></div>

  <div class="postcard">
    <div class="topline">
      <span class="stamp">
        <Icon name="heart" size={13} />
        <b>MK</b>
        <i>love mail</i>
      </span>
      <span class="postmark">
        <svg viewBox="0 0 70 70" width="54" height="54">
          <circle cx="35" cy="35" r="28" fill="none" stroke="#8d6f65" stroke-width="1.2" stroke-dasharray="2 3" opacity=".55" />
          <circle cx="35" cy="35" r="21" fill="none" stroke="#8d6f65" stroke-width="1" opacity=".4" />
          <path d="M18 38c7-4 12-4 17-1 5-5 12-3 17 1-5 6-12 8-17 8s-12-2-17-8Z" fill="#c4546b" opacity=".65" />
        </svg>
      </span>
    </div>

    <div class="kiss">
      <svg viewBox="0 0 120 78" width="108" height="70">
        <path d="M8 38c0-12 20-23 52-23s52 11 52 23c0 3-3 4-6 2-13-8-29-12-46-12S27 32 14 40c-3 2-6 1-6-2Z" fill="#bb4e66" />
        <path d="M12 44c11-11 30-17 48-17s37 6 48 17c-9 15-29 24-48 24S21 59 12 44Z" fill="#d66b81" />
        <path d="M44 50c7-6 26-6 33 0-6 8-13 11-17 11s-11-3-16-11Z" fill="#f9e2da" opacity=".55" />
      </svg>
      <span class="miles">1,284 miles closer</span>
    </div>

    <div class="address">
      <span class="to">to the one I miss</span>
      <span class="rule"></span>
      <span class="rule short"></span>
      <span class="from">from me, with a kiss</span>
    </div>

    <span class="tape"></span>
  </div>

  <span class="float-heart h1"><Icon name="heart" size={22} /></span>
  <span class="float-heart h2"><Icon name="heart" size={13} /></span>
  <span class="float-heart h3"><Icon name="heart" size={31} /></span>
  <span class="float-heart h4"><Icon name="heart" size={16} /></span>
</div>

<style>
  .postcard-scene {
    position: relative;
    width: min(420px, 100%);
    aspect-ratio: 1.25;
    margin: 2.2rem auto 0;
  }

  .orbit {
    position: absolute;
    border: 1.5px dashed rgba(164, 92, 92, 0.24);
    border-radius: 50%;
    pointer-events: none;
  }

  .orbit-a {
    inset: 3% 5% 12% 4%;
    transform: rotate(-9deg);
  }

  .orbit-b {
    inset: 12% 1% 2% 12%;
    transform: rotate(7deg);
    opacity: 0.7;
  }

  .postcard {
    position: absolute;
    inset: 10% 7% 9%;
    border-radius: 18px;
    background:
      linear-gradient(140deg, rgba(255, 255, 255, 0.65), transparent 45%),
      #fff8ef;
    border: 1px solid rgba(136, 82, 72, 0.18);
    box-shadow:
      0 40px 70px -38px rgba(118, 62, 58, 0.65),
      0 2px 0 rgba(255, 255, 255, 0.7) inset;
    transform: rotate(-4.5deg);
    padding: 1.2rem 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    overflow: hidden;
  }

  .postcard::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(130, 80, 70, 0.11) 0.7px, transparent 0.7px);
    background-size: 10px 10px;
    opacity: 0.35;
    pointer-events: none;
  }

  .topline {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .stamp {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    width: 62px;
    height: 72px;
    border-radius: 6px;
    color: var(--rose-deep);
    border: 1px dashed rgba(168, 62, 86, 0.55);
    background: rgba(244, 201, 201, 0.28);
    transform: rotate(4deg);
  }

  .stamp b {
    font-family: var(--font-display);
    font-size: 1rem;
    letter-spacing: 0.06em;
    line-height: 1;
  }

  .stamp i {
    font-style: normal;
    font-size: 0.48rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  .postmark {
    opacity: 0.8;
    margin-top: -0.2rem;
  }

  .kiss {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    transform: rotate(-1deg);
  }

  .kiss svg {
    filter: drop-shadow(0 6px 8px rgba(168, 62, 86, 0.14));
    transform: rotate(4deg);
  }

  .miles {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.95rem;
    color: #9b6d62;
    transform: rotate(-3deg);
  }

  .address {
    display: flex;
    flex-direction: column;
    gap: 0.38rem;
    padding-left: 32%;
    font-family: var(--font-display);
    color: #8d6f65;
  }

  .address .to {
    font-size: 0.74rem;
    font-style: italic;
    opacity: 0.9;
  }

  .rule {
    height: 1px;
    background: rgba(141, 111, 101, 0.26);
  }

  .rule.short {
    width: 62%;
  }

  .address .from {
    font-size: 0.64rem;
    letter-spacing: 0.03em;
    opacity: 0.7;
    margin-top: 0.1rem;
  }

  .tape {
    position: absolute;
    top: -8px;
    left: 50%;
    width: 92px;
    height: 26px;
    transform: translateX(-54%) rotate(2deg);
    background: rgba(242, 212, 155, 0.55);
    border-left: 1px dashed rgba(151, 112, 70, 0.2);
    border-right: 1px dashed rgba(151, 112, 70, 0.2);
    backdrop-filter: blur(1px);
  }

  .float-heart {
    position: absolute;
    color: var(--rose-bright);
    opacity: 0.7;
    filter: drop-shadow(0 6px 10px rgba(168, 62, 86, 0.18));
    animation: bob 7s ease-in-out infinite;
  }

  .h1 {
    top: 3%;
    right: -1%;
    animation-delay: -1s;
    transform: rotate(12deg);
  }

  .h2 {
    bottom: 8%;
    left: 1%;
    color: var(--peach);
    animation-delay: -3s;
  }

  .h3 {
    bottom: -4%;
    right: 5%;
    color: #d8899a;
    animation-delay: -5s;
    opacity: 0.5;
  }

  .h4 {
    top: 18%;
    left: -2%;
    color: var(--butter);
    animation-delay: -2s;
  }

  @keyframes bob {
    0%,
    100% {
      translate: 0 0;
      rotate: -3deg;
    }
    50% {
      translate: 0 -9px;
      rotate: 5deg;
    }
  }

  @media (max-width: 1100px) {
    .postcard-scene {
      width: min(340px, 100%);
    }
  }
</style>
