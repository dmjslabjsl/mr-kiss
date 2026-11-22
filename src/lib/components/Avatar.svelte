<script lang="ts">
  import { BLUSH_TONES, HAIR_COLORS, SKINS } from '../looks';
  import type { Look } from '../types';

  interface Props {
    look: Look;
    /** Optional base blush (0–1). Scenes usually drive --blush from a wrapper. */
    blush?: number;
    pout?: boolean;
    eyesClosed?: boolean;
    animate?: boolean;
    class?: string;
  }

  let { look, blush, pout = false, eyesClosed = false, animate = true, class: className = '' }: Props =
    $props();

  let uid = $state('');
  // A stable, collision-free prefix for SVG gradient ids.
  let idCounter = 0;
  {
    uid = `av${++idCounter}-${Math.random().toString(36).slice(2, 7)}`;
  }

  let skin = $derived(SKINS[look.skin] ?? SKINS[0]!);
  let hair = $derived(HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[0]!);
  let tone = $derived(BLUSH_TONES[look.blush] ?? BLUSH_TONES[0]!);

  let blinking = $state(false);

  $effect(() => {
    if (!animate) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const blink = () => {
      if (stopped) return;
      blinking = true;
      closeTimer = setTimeout(() => {
        blinking = false;
        openTimer = setTimeout(blink, 2800 + Math.random() * 3600);
      }, 120 + Math.random() * 70);
    };

    openTimer = setTimeout(blink, 1400 + Math.random() * 2600);

    return () => {
      stopped = true;
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  });

  let blushStyle = $derived(blush == null ? '' : `--blush:${blush}`);
</script>

<div
  class="avatar-shell {className}"
  class:pout
  class:animate
  style={blushStyle}
  aria-hidden="true"
>
  <svg viewBox="0 0 240 260" class="avatar-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skin-{uid}" x1="0.25" y1="0" x2="0.7" y2="1">
        <stop offset="0" stop-color={skin.highlight} />
        <stop offset="0.45" stop-color={skin.base} />
        <stop offset="1" stop-color={skin.shade} />
      </linearGradient>
      <linearGradient id="neck-{uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color={skin.shade} />
        <stop offset="1" stop-color={skin.base} />
      </linearGradient>
      <linearGradient id="hair-{uid}" x1="0.25" y1="0" x2="0.7" y2="1">
        <stop offset="0" stop-color={hair.base} />
        <stop offset="0.55" stop-color={hair.base} />
        <stop offset="1" stop-color={hair.dark} />
      </linearGradient>
      <linearGradient id="hairback-{uid}" x1="0" y1="0" x2="0.5" y2="1">
        <stop offset="0" stop-color={hair.base} />
        <stop offset="1" stop-color={hair.dark} />
      </linearGradient>
      <linearGradient id="sweater-{uid}" x1="0.2" y1="0" x2="0.75" y2="1">
        <stop offset="0" stop-color={tone.sweater} />
        <stop offset="1" stop-color={tone.trim} />
      </linearGradient>
      <radialGradient id="cheek-{uid}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color={tone.cheek} stop-opacity="0.9" />
        <stop offset="0.55" stop-color={tone.cheek} stop-opacity="0.44" />
        <stop offset="1" stop-color={tone.cheek} stop-opacity="0" />
      </radialGradient>
      <radialGradient id="iris-{uid}" cx="0.42" cy="0.36" r="0.7">
        <stop offset="0" stop-color="#684741" />
        <stop offset="0.55" stop-color="#44302d" />
        <stop offset="1" stop-color="#2a1c1b" />
      </radialGradient>
    </defs>

    <ellipse cx="120" cy="252" rx="78" ry="11" fill="#7d4a45" opacity="0.11" />

    <g class="breathe">
      <!-- Shoulders & sweater -->
      <g class="body">
        <path
          d="M120 208 C104 208 93 216 82 226 C68 238 58 250 54 262 L186 262 C182 250 172 238 158 226 C147 216 136 208 120 208 Z"
          fill="url(#sweater-{uid})"
        />
        <path
          d="M97 216 C103 228 137 228 143 216"
          fill="none"
          stroke={tone.trim}
          stroke-width="5"
          stroke-linecap="round"
        />
        <path d="M96 223 C109 240 131 240 144 223" fill="none" stroke="#fff8f0" stroke-width="1.5" opacity="0.35" />
        <g opacity="0.75">
          <path
            d="M120 249 C114 243 108 247 109 253 C110 259 120 262 120 262 C120 262 130 259 131 253 C132 247 126 243 120 249 Z"
            fill={tone.trim}
          />
        </g>
        <path d="M66 250 C70 256 68 260 64 262" stroke={tone.trim} stroke-width="1.5" fill="none" opacity="0.5" />
        <path d="M174 250 C170 256 172 260 176 262" stroke={tone.trim} stroke-width="1.5" fill="none" opacity="0.5" />
      </g>

      <g class="head-sway">
        <!-- Hair, behind -->
        <g class="hair-back">
          {#if look.hair === 0}
            <path
              d="M44 122 C36 74 60 34 104 27 C150 20 192 43 198 88 C201 105 198 121 192 132 C190 111 182 94 170 84 C157 92 143 92 133 82 C119 94 99 96 85 84 C70 92 58 104 54 124 C52 135 46 134 44 122 Z"
              fill="url(#hairback-{uid})"
            />
          {:else if look.hair === 1}
            <path
              d="M46 112 C39 67 63 33 106 27 C153 20 197 43 202 88 C207 117 203 157 196 186 C194 197 183 199 178 190 C184 164 186 142 180 120 C174 100 164 86 150 78 C130 98 103 104 79 92 C65 86 56 96 52 118 C48 144 52 168 58 189 C61 199 50 201 47 191 C40 167 38 140 46 112 Z"
              fill="url(#hairback-{uid})"
            />
          {:else if look.hair === 2}
            <path
              d="M50 108 C41 63 67 29 112 25 C159 21 198 45 202 92 C205 113 199 133 204 157 C209 183 203 207 207 229 C209 243 200 253 191 258 L168 258 C176 233 172 213 168 193 C163 171 168 149 163 129 C159 107 150 94 141 86 C121 102 95 106 73 93 C63 103 55 121 55 147 C55 177 62 205 58 227 C56 242 62 252 71 258 L43 258 C33 252 29 242 32 228 C36 203 33 179 38 155 C42 131 46 120 50 108 Z"
              fill="url(#hairback-{uid})"
            />
          {:else if look.hair === 3}
            <circle cx="120" cy="22" r="25" fill="url(#hairback-{uid})" />
            <path d="M100 26 C108 14 132 14 140 26" stroke={hair.light} stroke-width="3" fill="none" stroke-linecap="round" opacity="0.5" />
            <path d="M102 38 C112 31 128 31 138 38" stroke={hair.dark} stroke-width="4" fill="none" stroke-linecap="round" opacity="0.65" />
            <path
              d="M49 112 C43 71 64 35 104 29 C151 23 195 44 198 89 C201 103 197 117 191 127 C189 106 181 92 169 82 C152 92 136 92 124 83 C107 94 87 94 73 82 C61 92 54 106 52 124 C50 133 46 127 49 112 Z"
              fill="url(#hairback-{uid})"
            />
          {:else if look.hair === 4}
            <g fill="url(#hairback-{uid})">
              <circle cx="58" cy="86" r="27" />
              <circle cx="82" cy="50" r="26" />
              <circle cx="121" cy="33" r="27" />
              <circle cx="161" cy="48" r="26" />
              <circle cx="191" cy="83" r="26" />
              <circle cx="55" cy="124" r="23" />
              <circle cx="193" cy="123" r="23" />
              <circle cx="64" cy="154" r="19" />
              <circle cx="185" cy="152" r="18" />
            </g>
            <g fill="none" stroke={hair.light} stroke-width="2.5" stroke-linecap="round" opacity="0.32">
              <path d="M47 78 C55 68 65 66 73 70" />
              <path d="M79 36 C89 28 102 27 111 32" />
              <path d="M153 35 C165 32 176 38 181 48" />
              <path d="M184 110 C190 118 191 128 187 136" />
            </g>
          {:else}
            <path
              d="M48 110 C41 67 68 33 110 27 C157 21 197 46 200 92 C202 112 195 128 200 146 C206 170 194 186 200 206 C206 226 192 243 200 258 L175 258 C184 238 174 220 180 198 C186 178 178 160 184 140 C190 118 180 94 162 82 C139 100 112 106 84 93 C67 103 58 123 58 147 C58 173 66 192 60 211 C56 227 64 244 56 258 L34 258 C24 238 34 216 30 194 C26 168 36 142 40 122 C42 116 44 112 48 110 Z"
              fill="url(#hairback-{uid})"
            />
            <path d="M54 158 C62 148 58 136 64 126" stroke={hair.light} stroke-width="3" fill="none" opacity="0.3" stroke-linecap="round" />
            <path d="M190 158 C184 146 190 134 186 122" stroke={hair.light} stroke-width="3" fill="none" opacity="0.3" stroke-linecap="round" />
          {/if}
        </g>

        <!-- Ears -->
        <g>
          <ellipse cx="46" cy="132" rx="11" ry="17" fill={skin.base} transform="rotate(-8 46 132)" />
          <path d="M44 126 C48 128 48 136 44 140" stroke={skin.shade} stroke-width="2.2" fill="none" stroke-linecap="round" />
          <ellipse cx="194" cy="132" rx="11" ry="17" fill={skin.base} transform="rotate(8 194 132)" />
          <path d="M196 126 C192 128 192 136 196 140" stroke={skin.shade} stroke-width="2.2" fill="none" stroke-linecap="round" />
        </g>

        <!-- Head -->
        <g class="head">
          <path d="M106 186 L106 212 C106 221 112 226 120 226 C128 226 134 221 134 212 L134 186 Z" fill="url(#neck-{uid})" />
          <path
            d="M120 30 C165 30 193 60 196 108 C198 142 188 176 168 195 C153 209 138 214 120 214 C102 214 87 209 72 195 C52 176 42 142 44 108 C47 60 75 30 120 30 Z"
            fill="url(#skin-{uid})"
          />
          <path
            d="M120 37 C154 37 180 57 188 91 C176 72 154 61 120 61 C86 61 64 72 52 91 C60 57 86 37 120 37 Z"
            fill="#fff8ee"
            opacity="0.13"
          />

          <!-- Brows -->
          <g class="brows" stroke={hair.dark} stroke-width="4.4" stroke-linecap="round" fill="none">
            <path class="brow brow-l" d="M75 104 Q88 96 102 101" />
            <path class="brow brow-r" d="M138 101 Q152 96 165 104" />
          </g>

          <!-- Eyes -->
          <g class="eye eye-l" class:closed={blinking || eyesClosed}>
            <ellipse cx="90" cy="126" rx="11.5" ry="13" fill="#fff8f0" />
            <circle cx="90" cy="127" r="8.4" fill="url(#iris-{uid})" />
            <circle cx="90" cy="130" r="3.1" fill="#7a544b" opacity="0.75" />
            <circle cx="86.7" cy="122.4" r="2.7" fill="#fffdf8" opacity="0.95" />
            <circle cx="93.4" cy="131.2" r="1.25" fill="#fffdf8" opacity="0.65" />
            <path d="M79 125 Q90 112.8 101 125" stroke="#3e2b29" stroke-width="2.8" fill="none" stroke-linecap="round" />
            <path d="M77.6 121.5 L74.8 118.8" stroke="#3e2b29" stroke-width="2.2" stroke-linecap="round" />
            <path d="M80.7 117.8 L78.6 114.6" stroke="#3e2b29" stroke-width="1.9" stroke-linecap="round" />
          </g>
          <g class="eye eye-r" class:closed={blinking || eyesClosed}>
            <ellipse cx="150" cy="126" rx="11.5" ry="13" fill="#fff8f0" />
            <circle cx="150" cy="127" r="8.4" fill="url(#iris-{uid})" />
            <circle cx="150" cy="130" r="3.1" fill="#7a544b" opacity="0.75" />
            <circle cx="146.7" cy="122.4" r="2.7" fill="#fffdf8" opacity="0.95" />
            <circle cx="153.4" cy="131.2" r="1.25" fill="#fffdf8" opacity="0.65" />
            <path d="M139 125 Q150 112.8 161 125" stroke="#3e2b29" stroke-width="2.8" fill="none" stroke-linecap="round" />
            <path d="M162.4 121.5 L165.2 118.8" stroke="#3e2b29" stroke-width="2.2" stroke-linecap="round" />
            <path d="M159.3 117.8 L161.4 114.6" stroke="#3e2b29" stroke-width="1.9" stroke-linecap="round" />
          </g>

          <!-- Nose -->
          <path d="M116 143 Q120 148 124 143" stroke={skin.deep} stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.7" />

          <!-- Blush -->
          <g class="blush">
            <ellipse cx="76" cy="153" rx="25" ry="14.5" fill="url(#cheek-{uid})" />
            <ellipse cx="164" cy="153" rx="25" ry="14.5" fill="url(#cheek-{uid})" />
          </g>
          <g class="blush-lines" fill="none" stroke={tone.cheek} stroke-width="1.7" stroke-linecap="round">
            <path d="M62 148 L66 154" />
            <path d="M69 146 L73 153" />
            <path d="M76 147 L79 153" />
            <path d="M178 148 L174 154" />
            <path d="M171 146 L167 153" />
            <path d="M164 147 L161 153" />
          </g>
          <g class="freckles" fill={skin.deep}>
            <circle cx="66" cy="160" r="1.1" />
            <circle cx="73" cy="164" r="0.9" />
            <circle cx="61" cy="166" r="0.8" />
            <circle cx="174" cy="160" r="1.1" />
            <circle cx="167" cy="164" r="0.9" />
            <circle cx="179" cy="166" r="0.8" />
          </g>

          <!-- Mouth -->
          <g class="mouth-neutral">
            <path d="M107 168 Q113 174 120 171 Q127 174 133 168" fill="none" stroke={tone.lip} stroke-width="3.1" stroke-linecap="round" />
            <path d="M108 170 Q120 181 132 170 Q120 175 108 170 Z" fill={tone.lip} opacity="0.16" />
          </g>
          <g class="mouth-pout">
            <path
              d="M106 163 C109 155 116 155 120 159 C124 155 131 155 134 163 C135 168 129 171 120 171 C111 171 105 168 106 163 Z"
              fill={tone.lip}
            />
            <path
              d="M109 168 C113 165 127 165 131 168 C131 174 127 180 120 180 C113 180 109 174 109 168 Z"
              fill={tone.lip}
            />
            <path d="M110 167 Q120 171 130 167" stroke="#7c3142" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.35" />
            <path d="M112 174 Q118 177 123 175" stroke="#fff7f1" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.35" />
            <ellipse cx="114" cy="161" rx="2.2" ry="1" fill="#fff" opacity="0.25" transform="rotate(-12 114 161)" />
          </g>

          <!-- Hair, in front. A full cap first, then the style's fringe. -->
          <g class="hair-front">
            <path
              d="M50 108 C42 64 70 28 120 26 C170 28 198 64 190 108 C186 93 180 86 172 82 C160 76 146 78 136 84 C124 76 108 76 96 84 C84 78 70 80 62 88 C58 92 54 100 50 108 Z"
              fill="url(#hair-{uid})"
            />

            {#if look.hair === 0}
              <path d="M48 105 C43 117 45 129 53 137 C55 126 58 116 63 109 Z" fill="url(#hair-{uid})" />
              <path d="M192 105 C197 117 195 129 187 137 C185 126 182 116 177 109 Z" fill="url(#hair-{uid})" />
              <path d="M99 29 C93 19 101 11 111 17 C104 22 104 29 109 33 Z" fill="url(#hair-{uid})" />
              <path d="M67 55 C81 40 102 31 124 30" stroke={hair.light} stroke-width="4.5" fill="none" stroke-linecap="round" opacity="0.42" />
              <path d="M64 88 C82 96 104 98 122 92" stroke={hair.dark} stroke-width="2" fill="none" stroke-linecap="round" opacity="0.3" />
            {:else if look.hair === 1}
              <path
                d="M48 103 C43 125 45 151 54 175 C58 185 70 183 66 173 C60 151 60 128 65 107 Z"
                fill="url(#hair-{uid})"
              />
              <path
                d="M192 103 C197 125 195 151 186 175 C182 185 170 183 174 173 C180 151 180 128 175 107 Z"
                fill="url(#hair-{uid})"
              />
              <path
                d="M58 90 C78 79 100 78 120 83 C142 77 164 81 181 91 L178 98 C154 90 136 93 120 90 C99 86 80 91 62 98 Z"
                fill="url(#hair-{uid})"
              />
              <path d="M70 54 C85 39 107 31 130 33" stroke={hair.light} stroke-width="4.5" fill="none" stroke-linecap="round" opacity="0.42" />
              <path d="M108 76 C126 83 146 78 158 64" stroke={hair.dark} stroke-width="2" fill="none" stroke-linecap="round" opacity="0.28" />
            {:else if look.hair === 2}
              <path
                d="M50 92 C44 118 44 148 40 178 C38 196 44 210 50 222 C56 205 54 184 56 162 C58 136 60 112 64 96 Z"
                fill="url(#hair-{uid})"
              />
              <path
                d="M190 92 C196 118 196 148 200 178 C202 196 196 210 190 222 C184 205 186 184 184 162 C182 136 180 112 176 96 Z"
                fill="url(#hair-{uid})"
              />
              <path
                d="M54 100 C50 66 78 33 122 28 C116 46 118 60 128 68 C144 80 164 70 178 53 C184 71 187 87 186 100 C160 94 132 103 106 110 C86 105 68 103 54 100 Z"
                fill="url(#hair-{uid})"
              />
              <path d="M101 33 C113 47 123 57 137 62" stroke={hair.dark} stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.3" />
              <path d="M74 58 C89 41 112 32 136 34" stroke={hair.light} stroke-width="4.5" fill="none" stroke-linecap="round" opacity="0.42" />
            {:else if look.hair === 3}
              <path
                d="M120 28 C108 39 102 52 105 66 C112 72 118 74 120 74 C122 74 128 72 135 66 C138 52 132 39 120 28 Z"
                fill="url(#hair-{uid})"
                opacity="0.9"
              />
              <path d="M120 28 C112 40 109 52 112 66" stroke={hair.dark} stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0.45" />
              <path d="M120 28 C128 40 131 52 128 66" stroke={hair.dark} stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0.45" />
              <path d="M52 99 C47 120 51 140 62 154" stroke={hair.base} stroke-width="7" fill="none" stroke-linecap="round" />
              <path d="M188 99 C193 120 189 140 178 154" stroke={hair.base} stroke-width="7" fill="none" stroke-linecap="round" />
              <path d="M72 54 C87 40 108 31 128 31" stroke={hair.light} stroke-width="3.8" fill="none" stroke-linecap="round" opacity="0.42" />
              <path d="M164 55 C153 43 138 35 127 33" stroke={hair.light} stroke-width="3.2" fill="none" stroke-linecap="round" opacity="0.3" />
            {:else if look.hair === 4}
              <g fill="url(#hair-{uid})">
                <circle cx="66" cy="90" r="18" />
                <circle cx="92" cy="79" r="19" />
                <circle cx="120" cy="76" r="20" />
                <circle cx="148" cy="80" r="19" />
                <circle cx="174" cy="91" r="18" />
                <circle cx="52" cy="116" r="12" />
                <circle cx="54" cy="138" r="10" />
                <circle cx="188" cy="116" r="12" />
                <circle cx="186" cy="138" r="10" />
              </g>
              <g fill="none" stroke={hair.light} stroke-width="2.2" stroke-linecap="round" opacity="0.34">
                <path d="M57 86 C63 78 71 76 79 80" />
                <path d="M84 72 C92 65 102 64 110 68" />
                <path d="M140 66 C149 63 158 68 162 76" />
                <path d="M166 84 C172 89 174 96 173 102" />
                <path d="M48 118 C46 124 48 130 52 134" />
                <path d="M192 118 C194 124 192 130 188 134" />
              </g>
            {:else}
              <path
                d="M52 102 C48 68 74 34 118 28 C116 44 118 58 126 68 C140 82 160 76 172 60 C180 75 184 89 184 100 C164 93 146 100 126 105 C108 111 90 107 74 102 C64 100 58 100 52 102 Z"
                fill="url(#hair-{uid})"
              />
              <path
                d="M50 96 C44 120 52 132 46 154 C42 172 50 188 44 210 C50 218 60 216 58 204 C54 186 60 170 58 150 C56 130 58 112 62 98 Z"
                fill="url(#hair-{uid})"
              />
              <path
                d="M190 96 C196 120 188 132 194 154 C198 172 190 188 196 210 C190 218 180 216 182 204 C186 186 180 170 182 150 C184 130 182 112 178 98 Z"
                fill="url(#hair-{uid})"
              />
              <path d="M72 56 C86 41 109 31 133 33" stroke={hair.light} stroke-width="4.5" fill="none" stroke-linecap="round" opacity="0.42" />
              <path d="M103 70 C122 78 143 72 154 57" stroke={hair.dark} stroke-width="2" fill="none" stroke-linecap="round" opacity="0.3" />
              <path d="M52 80 C48 96 49 112 54 126" stroke={hair.light} stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.28" />
            {/if}
          </g>

          <!-- A tiny bit of treasure -->
          {#if look.hair === 1}
            <g transform="translate(163 67) rotate(14)" fill="#e9bb6c">
              <path d="M0 -7 L2 -2 L7.4 -1.4 L3.3 2.1 L4.5 7.4 L0 4.4 L-4.5 7.4 L-3.3 2.1 L-7.4 -1.4 L-2 -2 Z" />
              <circle cx="0" cy="0" r="1.3" fill="#fff4d6" />
            </g>
          {:else if look.hair === 3}
            <g fill="#f3d59e" opacity="0.95">
              <circle cx="100" cy="21" r="2.8" />
              <circle cx="141" cy="18" r="2.4" />
              <circle cx="130" cy="7" r="1.8" />
            </g>
          {:else if look.hair === 4}
            <g transform="translate(173 57) rotate(-12)" fill="#e9bb6c">
              <path d="M0 -6 L1.7 -1.8 L6.2 -1.2 L2.8 1.8 L3.8 6.2 L0 3.7 L-3.8 6.2 L-2.8 1.8 L-6.2 -1.2 L-1.7 -1.8 Z" />
            </g>
          {:else if look.hair === 5}
            <g transform="translate(56 77) rotate(-14)" fill="#e9bb6c">
              <path d="M0 3.6 C-4.6 -0.7 -3.1 -5.5 0 -4.2 C3.1 -5.5 4.6 -0.7 0 3.6 Z" />
            </g>
          {/if}
        </g>
      </g>
    </g>
  </svg>
</div>

<style>
  .avatar-shell {
    position: relative;
    width: 100%;
    display: block;
    line-height: 0;
  }

  .avatar-svg {
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .breathe {
    transform-box: view-box;
    transform-origin: 120px 258px;
  }

  .animate .breathe {
    animation: breathe 6.4s ease-in-out infinite;
  }

  .head-sway {
    transform-box: view-box;
    transform-origin: 120px 198px;
  }

  .animate .head-sway {
    animation: sway 10.5s ease-in-out infinite;
  }

  .eye {
    transform-box: fill-box;
    transform-origin: center;
    transition: transform 0.16s ease;
  }

  .eye.closed {
    transform: scaleY(0.06);
  }

  .brow {
    transform-box: fill-box;
    transform-origin: center;
    transition: transform 0.32s cubic-bezier(0.22, 0.9, 0.3, 1);
  }

  .pout .brow-l {
    transform: translateY(-1.5px) rotate(4deg);
  }

  .pout .brow-r {
    transform: translateY(-1.5px) rotate(-4deg);
  }

  .blush {
    opacity: calc(0.18 + var(--blush, 0.35) * 0.82);
    transition: opacity 0.4s ease;
  }

  .blush-lines {
    opacity: calc(var(--blush, 0.35) * 0.55);
    transition: opacity 0.4s ease;
  }

  .freckles {
    opacity: calc(0.22 + var(--blush, 0.35) * 0.14);
  }

  .mouth-neutral,
  .mouth-pout {
    transform-box: fill-box;
    transform-origin: center;
    transition: opacity 0.28s ease, transform 0.38s cubic-bezier(0.22, 1.4, 0.36, 1);
  }

  .mouth-pout {
    opacity: 0;
    transform: scale(0.66);
  }

  .pout .mouth-neutral {
    opacity: 0;
    transform: scale(1.06);
  }

  .pout .mouth-pout {
    opacity: 1;
    transform: scale(1);
  }

  @keyframes breathe {
    0%,
    100% {
      transform: scale(1, 1);
    }
    50% {
      transform: scale(1.008, 1.016);
    }
  }

  @keyframes sway {
    0%,
    100% {
      transform: rotate(-1.1deg) translateY(0);
    }
    50% {
      transform: rotate(1.1deg) translateY(-1px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .animate .breathe,
    .animate .head-sway {
      animation: none !important;
    }
  }
</style>
