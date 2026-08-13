import { initPageTransition, navigateTo } from './transitions.js';
import { markDiscovered } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();
  markDiscovered('ventana');

  const text1 = document.getElementById('text-1');
  const text2 = document.getElementById('text-2');
  const btnVolver = document.getElementById('btn-volver');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    text1.classList.add('visible');
    text2.classList.add('visible');
  } else {
    setTimeout(() => {
      text1.classList.add('visible');
    }, 1500);

    setTimeout(() => {
      text2.classList.add('visible');
    }, 4000);
  }

  if (btnVolver) {
    btnVolver.addEventListener('click', () => {
      navigateTo('./habitacion.html');
    });
  }
});
