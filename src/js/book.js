import { initPageTransition, navigateTo } from './transitions.js';
import { markDiscovered } from './state.js';

const pages = [
  { title: 'Tu forma de hablar', text: 'Hay conversaciones que se olvidan nada más terminan.\nY hay otras que uno termina recordando horas después.' },
  { title: 'Tu confianza', text: 'Gracias por contarme cosas de ti que no tendrías por qué contarle a cualquiera.' },
  { title: 'Lo que todavía no conozco', text: 'Probablemente esta sea mi parte favorita.\nPorque significa que todavía quedan páginas.' },
];

let currentPage = -1; // -1 is cover

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();
  markDiscovered('libro');

  const bookEl = document.getElementById('book');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const pageIndicator = document.getElementById('page-indicator');
  const btnVolver = document.getElementById('btn-volver');

  if (btnVolver) {
    btnVolver.addEventListener('click', () => {
      navigateTo('./habitacion.html');
    });
  }

  const totalPages = pages.length;

  for (let i = totalPages - 1; i >= 0; i--) {
    const pageData = pages[i];
    const pageEl = document.createElement('div');
    pageEl.className = 'page content-page';
    pageEl.dataset.pageIndex = i;
    pageEl.style.zIndex = totalPages - i;

    const titleEl = document.createElement('h2');
    titleEl.className = 'page-title';
    titleEl.textContent = pageData.title;

    const textEl = document.createElement('p');
    textEl.className = 'page-text';
    textEl.textContent = pageData.text;

    pageEl.appendChild(titleEl);
    pageEl.appendChild(textEl);
    bookEl.appendChild(pageEl);
  }

  const coverEl = document.createElement('div');
  coverEl.className = 'page cover';
  coverEl.dataset.pageIndex = -1;
  coverEl.style.zIndex = totalPages + 1;
  
  const coverTitle = document.createElement('h1');
  coverTitle.className = 'cover-title';
  coverTitle.textContent = 'Pequeñas cosas que he ido descubriendo';
  
  coverEl.appendChild(coverTitle);
  bookEl.appendChild(coverEl);

  const updateUI = () => {
    btnPrev.disabled = currentPage === -1;
    btnNext.disabled = currentPage === totalPages - 1;
    
    if (currentPage === -1) {
      pageIndicator.textContent = 'Portada';
    } else {
      pageIndicator.textContent = `${currentPage + 1} / ${totalPages}`;
    }

    const allPages = document.querySelectorAll('.page');
    allPages.forEach(p => {
      const idx = parseInt(p.dataset.pageIndex, 10);
      if (idx < currentPage) {
        p.classList.add('flipped');
      } else {
        p.classList.remove('flipped');
      }
    });
  };

  btnNext.addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
      currentPage++;
      updateUI();
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentPage > -1) {
      currentPage--;
      updateUI();
    }
  });

  updateUI();
});
