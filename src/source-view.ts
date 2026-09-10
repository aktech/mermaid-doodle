import { highlight } from './highlight.ts';

const COPY_ICON =
  '<svg class="doodle-copy__copy" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_ICON =
  '<svg class="doodle-copy__check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>';

const COPIED_MS = 1500;

/** Build the collapsible source panel shown alongside a diagram. */
export function buildSourceView(source: string, label = 'mermaid'): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'doodle-source';

  const head = document.createElement('div');
  head.className = 'doodle-source__head';

  const lang = document.createElement('span');
  lang.className = 'doodle-source__lang';
  lang.textContent = label;

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'doodle-copy';
  copy.setAttribute('aria-label', 'Copy diagram source');
  copy.innerHTML = COPY_ICON + CHECK_ICON;

  let timer: ReturnType<typeof setTimeout> | undefined;
  copy.addEventListener('click', () => {
    // navigator.clipboard is undefined in a non-secure context (plain HTTP
    // on a non-localhost host), so guard it before dereferencing writeText -
    // otherwise this throws synchronously and the button appears dead.
    const clipboard = navigator.clipboard;
    if (!clipboard || typeof clipboard.writeText !== 'function') return;

    void clipboard
      .writeText(source)
      .then(() => {
        copy.classList.add('is-copied');
        clearTimeout(timer);
        timer = setTimeout(() => copy.classList.remove('is-copied'), COPIED_MS);
      })
      .catch(() => {
        // Write refused (denied permission, document not focused, etc).
        // Stay quiet: no copied state, no error UI, nothing to surface.
      });
  });

  head.append(lang, copy);

  const pre = document.createElement('pre');
  pre.className = 'doodle-source__pre';
  const code = document.createElement('code');
  code.innerHTML = highlight(source);
  pre.append(code);

  panel.append(head, pre);
  return panel;
}
