import { initPageTransition, navigateTo } from './transitions.js';
import { allDiscovered } from './state.js';

const phrases = [
  { text: "Gracias por llegar hasta aquí.", delay: 2000 },
  { text: "No hice esto para impresionarte.", delay: 5000 },
  { text: "Solo quería hacer algo que no pudiera resumirse en un mensaje de cinco líneas.", delay: 8500 },
  { text: "Gracias por dejarme conocerte un poco más.", delay: 12000 },
  { text: "No sé qué vendrá después.", delay: 15500 },
  { text: "Pero me está gustando cómo está empezando.", delay: 19000 }
];

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();

  if (!allDiscovered()) {
    navigateTo('./habitacion.html');
    return;
  }

  const container = document.getElementById('final-content');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    phrases.forEach((phrase, index) => {
      setTimeout(() => {
        const p = document.createElement('p');
        p.className = 'final-text visible';
        p.textContent = phrase.text;
        container.appendChild(p);
      }, index * 500);
    });

    setTimeout(() => {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'final-title-container visible';
      
      const title = document.createElement('h1');
      title.className = 'final-title';
      title.textContent = 'Ángela';
      
      const subtitle = document.createElement('p');
      subtitle.className = 'final-subtitle';
      subtitle.textContent = 'Fin, por ahora.';
      
      titleContainer.appendChild(title);
      titleContainer.appendChild(subtitle);
      container.appendChild(titleContainer);
    }, phrases.length * 500 + 500);

  } else {
    let currentElement = null;

    phrases.forEach((phrase, index) => {
      setTimeout(() => {
        if (currentElement) {
          currentElement.classList.remove('visible');
          currentElement.classList.add('fade-out');
          setTimeout(() => {
            if (currentElement && currentElement.parentNode) {
              currentElement.parentNode.removeChild(currentElement);
            }
          }, 2000);
        }

        const p = document.createElement('p');
        p.className = 'final-text';
        p.textContent = phrase.text;
        container.appendChild(p);
        
        void p.offsetWidth;
        
        p.classList.add('visible');
        currentElement = p;

      }, phrase.delay);
    });

    setTimeout(() => {
      if (currentElement) {
        currentElement.classList.remove('visible');
        currentElement.classList.add('fade-out');
      }

      const titleContainer = document.createElement('div');
      titleContainer.className = 'final-title-container';
      
      const title = document.createElement('h1');
      title.className = 'final-title';
      title.textContent = 'Ángela';
      
      const subtitle = document.createElement('p');
      subtitle.className = 'final-subtitle';
      subtitle.textContent = 'Fin, por ahora.';
      
      titleContainer.appendChild(title);
      titleContainer.appendChild(subtitle);
      container.appendChild(titleContainer);

      void titleContainer.offsetWidth;
      
      titleContainer.classList.add('visible');

    }, 23000);
  }
});
