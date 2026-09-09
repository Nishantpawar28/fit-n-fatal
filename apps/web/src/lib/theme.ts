export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'fnf-theme';

export function applyTheme(pref: ThemePreference) {
  if (typeof document === 'undefined') return;
  if (pref === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', pref);
  }
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // ignore (private browsing, etc.)
  }
}

export function getStoredTheme(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // ignore
  }
  return 'dark';
}

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'dark';if(t!=='system'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
