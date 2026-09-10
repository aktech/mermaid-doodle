export type ThemeName = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Resolve the page's current theme. Attribute first (both target sites set
 * data-theme on <html>), then a "dark" class, then the OS preference.
 */
export function currentTheme(doc: Document = document): ThemeName {
  const root = doc.documentElement;
  const attr = root.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  if (root.classList.contains('dark')) return 'dark';
  const view = doc.defaultView;
  if (view?.matchMedia(DARK_QUERY).matches) return 'dark';
  return 'light';
}

/**
 * Call onChange whenever the resolved theme actually changes. Watches the
 * root element's attributes and the OS preference, so programmatic and
 * system level changes are both caught, not just clicks on a toggle button.
 * Returns an unsubscribe function.
 */
export function watchTheme(
  onChange: (theme: ThemeName) => void,
  doc: Document = document,
): () => void {
  let last = currentTheme(doc);

  const check = () => {
    const next = currentTheme(doc);
    if (next === last) return;
    last = next;
    onChange(next);
  };

  const observer = new MutationObserver(check);
  observer.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class'],
  });

  const media = doc.defaultView?.matchMedia(DARK_QUERY);
  media?.addEventListener('change', check);

  return () => {
    observer.disconnect();
    media?.removeEventListener('change', check);
  };
}
