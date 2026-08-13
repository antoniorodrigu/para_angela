import { initPageTransition, navigateTo } from './transitions.js';
import { allDiscovered } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();

  if (allDiscovered()) {
    navigateTo('./final.html');
    return;
  }

  const content = document.getElementById('door-content');
  const footer = document.getElementById('door-footer');
  const text1 = document.getElementById('door-text-1');
  const text2 = document.getElementById('door-text-2');
  const text3 = document.getElementById('door-text-3');
  const btnVolver = document.getElementById('btn-volver');

  content.classList.remove('hidden');
  footer.classList.remove('hidden');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    text1.classList.add('visible');
    text2.classList.add('visible');
    text3.classList.add('visible');
    footer.classList.add('visible');
  } else {
    setTimeout(() => text1.classList.add('visible'), 800);
    setTimeout(() => text2.classList.add('visible'), 2500);
    setTimeout(() => text3.classList.add('visible'), 4500);
    setTimeout(() => footer.classList.add('visible'), 6000);
  }

  if (btnVolver) {
    btnVolver.addEventListener('click', () => {
      navigateTo('./habitacion.html');
    });
  }
});
