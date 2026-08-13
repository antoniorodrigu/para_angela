import { initPageTransition, navigateTo } from './transitions.js';

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();

  const btnVolver = document.getElementById('btn-volver');
  if (btnVolver) {
    btnVolver.addEventListener('click', () => {
      navigateTo('./habitacion.html');
    });
  }
});
