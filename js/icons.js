const paths = {
  diamond: '<path d="m12 2 9 8-9 12L3 10Z"/><path d="M3 10h18M12 2l-4 8 4 12 4-12Z"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  book: '<path d="M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3ZM12 6v15"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>',
  sword: '<path d="m19 2 3 3-11 12-4-4Z"/><path d="m4 12 8 8M8 16l-6 6"/>',
  lock: '<rect x="5" y="10" width="14" height="12" rx="1"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
  sound: '<path d="M3 9h4l5-5v16l-5-5H3ZM16 8q5 4 0 8m3-11q8 7 0 14"/>',
  muted: '<path d="M3 9h4l5-5v16l-5-5H3ZM17 9l5 6m0-6-5 6"/>',
  motion: '<path d="M4 6h16M4 12h12M4 18h8"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
};
export const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.diamond}</svg>`;
