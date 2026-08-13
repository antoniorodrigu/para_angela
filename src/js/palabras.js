import { initPageTransition, navigateTo } from './transitions.js';

const MESSAGES = [
  "Me gusta la tranquilidad con la que te estoy conociendo.",
  "Hay conversaciones contigo que se me quedan dando vueltas incluso después de despedirnos.",
  "No quiero correr contigo. Me gusta descubrirte poco a poco.",
  "No sé qué va a pasar entre nosotros, pero sí sé que me alegra haberte encontrado.",
  "Tu forma de ser ha conseguido despertar mi curiosidad de una manera muy bonita.",
  "A veces me sorprendo sonriendo al recordar alguna conversación contigo.",
  "No necesitaba una fecha especial para hacerte algo bonito. Solo necesitaba una buena razón, y apareciste tú.",
  "Hay personas que uno conoce y simplemente pasan. Y hay otras que, poco a poco, empiezan a quedarse en los pensamientos.",
  "Todavía me quedan muchas cosas por descubrir de ti. Y creo que esa es precisamente una de las partes que más me gustan.",
  "Quizá todavía no sé cómo llamar a esto que está empezando, pero sé que quiero seguir descubriéndolo contigo."
];

let currentIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();

  // Save room glow state
  try {
    localStorage.setItem('angela_palabras', JSON.stringify([{ text: 'visto', createdAt: 'hoy' }]));
  } catch (e) {}

  const paperSlip = document.getElementById('paper-slip');
  const slipText = document.getElementById('slip-text');
  const slipCounter = document.getElementById('slip-counter');
  const btnNext = document.getElementById('btn-next');
  const outroBlock = document.getElementById('outro-block');
  const btnBack = document.getElementById('btn-back');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function renderMessage(idx) {
    if (!slipText || !slipCounter || !paperSlip) return;

    slipText.textContent = MESSAGES[idx];
    slipCounter.textContent = `${idx + 1} / ${MESSAGES.length}`;

    if (idx === MESSAGES.length - 1) {
      paperSlip.classList.add('special-slip');
    } else {
      paperSlip.classList.remove('special-slip');
    }
  }

  // Render initial message
  renderMessage(0);

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (currentIndex < MESSAGES.length - 1) {
        currentIndex++;

        if (prefersReducedMotion) {
          renderMessage(currentIndex);
        } else {
          paperSlip.classList.add('slide-out');

          setTimeout(() => {
            renderMessage(currentIndex);
            paperSlip.classList.remove('slide-out');
            paperSlip.classList.add('slide-in');

            requestAnimationFrame(() => {
              setTimeout(() => {
                paperSlip.classList.remove('slide-in');
              }, 50);
            });
          }, 250);
        }

        if (currentIndex === MESSAGES.length - 1) {
          const btnSpan = btnNext.querySelector('span');
          if (btnSpan) btnSpan.textContent = 'Ver final';
        }
      } else {
        // Reached end of messages
        btnNext.style.opacity = '0';
        btnNext.style.pointerEvents = 'none';
        btnNext.style.display = 'none';
        if (slipCounter) slipCounter.style.display = 'none';

        if (outroBlock) outroBlock.classList.remove('hidden');
      }
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      navigateTo('./habitacion.html');
    });
  }
});
