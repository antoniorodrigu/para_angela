import { initPageTransition, navigateTo } from './transitions.js';
import { markDiscovered } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();
  markDiscovered('carta');

  const paragraphs = document.querySelectorAll('.fade-in-text');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  paragraphs.forEach((p, index) => {
    if (prefersReducedMotion) {
      p.classList.add('visible');
    } else {
      setTimeout(() => {
        p.classList.add('visible');
      }, 500 + (index * 450));
    }
  });

  const btnVolver = document.getElementById('btn-volver');
  if (btnVolver) {
    btnVolver.addEventListener('click', () => {
      navigateTo('./habitacion.html');
    });
  }
});
