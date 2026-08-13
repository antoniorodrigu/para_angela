import { initPageTransition, navigateTo } from './transitions.js';

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();

  const continueBtn = document.getElementById('continue-button');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animatedElements = document.querySelectorAll('[data-delay]');

  if (prefersReducedMotion) {
    animatedElements.forEach(el => el.classList.add('visible'));
  } else {
    animatedElements.forEach(el => {
      const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      setTimeout(() => {
        el.classList.add('visible');
      }, delay);
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', (e) => {
      e.preventDefault();

      animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-8px)';
        el.style.transition = 'opacity 500ms ease, transform 500ms ease';
      });

      setTimeout(() => {
        navigateTo('./habitacion.html');
      }, 500);
    });
  }
});
