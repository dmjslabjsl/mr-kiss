/** Clipboard + native share helpers with graceful, old-browser fallbacks. */

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the tiny textarea trick */
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.left = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    const selected = document.activeElement as HTMLElement | null;
    area.select();
    area.setSelectionRange(0, text.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    selected?.focus?.();
    return copied;
  } catch {
    return false;
  }
}

export function canNativeShare(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  );
}

export function isHandheld(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1000
  );
}

export type ShareOutcome = 'shared' | 'cancelled' | 'unavailable' | 'failed';

export async function nativeShare(data: {
  title: string;
  text: string;
  url: string;
}): Promise<ShareOutcome> {
  if (!canNativeShare()) return 'unavailable';
  try {
    await navigator.share(data);
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      return 'cancelled';
    return 'failed';
  }
}

export function selectAll(input: HTMLInputElement | null): void {
  if (!input) return;
  input.focus();
  input.select();
  input.setSelectionRange(0, input.value.length);
}
