import { useSyncExternalStore } from 'react';

export type DocumentTheme = 'light' | 'dark';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class'],
  });
  return () => observer.disconnect();
}

function getSnapshot(): DocumentTheme {
  const root = document.documentElement;
  const isDark =
    root.dataset.theme === 'dark' || root.classList.contains('dark');
  return isDark ? 'dark' : 'light';
}

export function useDocumentTheme(): DocumentTheme {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'light');
}
