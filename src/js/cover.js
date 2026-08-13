import { initPageTransition, navigateTo } from './transitions.js';

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();

  const title = document.getElementById('cover-title');
  const titleLines = document.querySelectorAll('.title-line');
  const centerHeart = document.getElementById('center-heart');
  const phrase1 = document.getElementById('phrase-1');
  const phrase2 = document.getElementById('phrase-2');
  const phrase3 = document.getElementById('phrase-3');
  const coverCta = document.getElementById('cover-cta');
  const enterBtn = document.getElementById('enter-button');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    if (title) title.classList.add('visible');
    titleLines.forEach(l => l.classList.add('visible'));
    if (centerHeart) centerHeart.classList.add('visible');
    if (phrase1) phrase1.classList.add('visible');
    if (phrase2) phrase2.classList.add('visible');
    if (phrase3) phrase3.classList.add('visible');
    if (coverCta) coverCta.classList.add('visible');
  } else {
    // Sequential Entrance Timeline
    setTimeout(() => {
      if (title) title.classList.add('visible');
      titleLines.forEach(l => l.classList.add('visible'));
    }, 150);

    setTimeout(() => {
      if (centerHeart) centerHeart.classList.add('visible');
    }, 700);

    setTimeout(() => {
      if (phrase1) phrase1.classList.add('visible');
    }, 1400);

    setTimeout(() => {
      if (phrase2) phrase2.classList.add('visible');
    }, 2800);

    setTimeout(() => {
      if (phrase3) phrase3.classList.add('visible');
    }, 4300);

    setTimeout(() => {
      if (coverCta) coverCta.classList.add('visible');
    }, 5800);
  }

  // Smooth Outro Transition on Click
  if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (phrase1) phrase1.style.opacity = '0';
      if (phrase2) phrase2.style.opacity = '0';
      if (phrase3) phrase3.style.opacity = '0';
      if (coverCta) coverCta.style.opacity = '0';
      if (centerHeart) centerHeart.style.opacity = '0';
      titleLines.forEach(l => l.style.opacity = '0');

      setTimeout(() => {
        navigateTo('./introduccion.html');
      }, 400);
    });
  }

  // Very subtle desktop parallax (2-4px max)
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (!prefersReducedMotion && !isCoarsePointer && title) {
    const titleWrap = document.querySelector('.title-wrap');
    document.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const offsetX = (clientX / innerWidth - 0.5) * 4; // max ±2px
      const offsetY = (clientY / innerHeight - 0.5) * 4;
      
      if (titleWrap) {
        titleWrap.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      }
    });
  }
});
