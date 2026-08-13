const DURATION = 600;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initPageTransition() {
  const overlay = document.getElementById('transition-overlay');
  if (!overlay) return;

  if (reducedMotion) {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('revealed');
    });
  });
}

export function navigateTo(url) {
  const overlay = document.getElementById('transition-overlay');

  if (!overlay || reducedMotion) {
    window.location.href = url;
    return;
  }

  overlay.classList.remove('revealed');
  overlay.classList.add('covering');

  setTimeout(() => {
    window.location.href = url;
  }, DURATION);
}
