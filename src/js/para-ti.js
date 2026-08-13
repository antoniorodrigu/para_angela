import { initPageTransition, navigateTo } from './transitions.js';

const STORAGE_KEY_LIST = 'angela_para_ti';
const STORAGE_KEY_RAW = 'palabrasAngela';
const PHONE_NUMBER = '51930899109';

let editingNoteId = null;

function getNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIST);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveNote(text) {
  const notes = getNotes();
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const dateStr = new Date().toLocaleDateString('es-ES', options);

  if (editingNoteId) {
    const idx = notes.findIndex(n => n.id === editingNoteId);
    if (idx !== -1) {
      notes[idx].text = text.trim();
      notes[idx].createdAt = dateStr;
    } else {
      notes.unshift({ id: Date.now().toString(), text: text.trim(), createdAt: dateStr });
    }
    editingNoteId = null;
  } else {
    notes.unshift({ id: Date.now().toString(), text: text.trim(), createdAt: dateStr });
  }

  try {
    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(notes));
    localStorage.setItem(STORAGE_KEY_RAW, text.trim());
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();

  const viewList = document.getElementById('view-list');
  const viewForm = document.getElementById('view-form');
  const viewSuccess = document.getElementById('view-success');

  const notesListEl = document.getElementById('saved-notes-list');
  const inputEl = document.getElementById('para-ti-input');
  const errorMsgEl = document.getElementById('input-error-msg');

  const btnSave = document.getElementById('btn-save-para-ti');
  const btnAddMore = document.getElementById('btn-add-more-notes');
  const btnViewNotes = document.getElementById('btn-view-notes');

  const btnBackList = document.getElementById('btn-back-from-list');
  const btnBackForm = document.getElementById('btn-back-from-form');
  const btnBackSuccess = document.getElementById('btn-back-from-success');

  function renderSavedNotes() {
    const notes = getNotes();
    if (!notesListEl) return;
    notesListEl.innerHTML = '';

    notes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'single-saved-card';

      const header = document.createElement('div');
      header.className = 'saved-card-header';

      const dateEl = document.createElement('span');
      dateEl.className = 'single-saved-date';
      dateEl.textContent = note.createdAt;

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit-note';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => {
        editingNoteId = note.id;
        if (inputEl) inputEl.value = note.text;
        showView(viewForm);
        inputEl?.focus();
      });

      header.appendChild(dateEl);
      header.appendChild(editBtn);

      const textEl = document.createElement('p');
      textEl.className = 'single-saved-text';
      textEl.textContent = note.text;

      card.appendChild(header);
      card.appendChild(textEl);
      notesListEl.appendChild(card);
    });
  }

  function showView(target) {
    [viewList, viewForm, viewSuccess].forEach(v => {
      if (v) v.classList.add('hidden');
    });
    if (target) target.classList.remove('hidden');
  }

  // Pre-fill from localStorage if previously written
  try {
    const rawSaved = localStorage.getItem(STORAGE_KEY_RAW);
    if (rawSaved && inputEl && !inputEl.value) {
      inputEl.value = rawSaved;
    }
  } catch (e) {}

  // Initial View Selection
  const initialNotes = getNotes();
  if (initialNotes.length > 0) {
    renderSavedNotes();
    showView(viewList);
  } else {
    showView(viewForm);
  }

  // Save & Open WhatsApp Action
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const val = inputEl?.value ? inputEl.value.trim() : '';

      if (!val) {
        if (errorMsgEl) errorMsgEl.classList.remove('hidden');
        inputEl?.focus();
        return;
      }

      if (errorMsgEl) errorMsgEl.classList.add('hidden');

      // Local persistence before opening WhatsApp
      saveNote(val);

      // WhatsApp URL Construction
      const mensaje = `Esto siento de ti:\n\n${val}`;
      const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(mensaje)}`;

      // Immediate navigation
      window.location.href = whatsappUrl;
    });
  }

  // Input listener to hide error on typing
  if (inputEl) {
    inputEl.addEventListener('input', () => {
      if (inputEl.value.trim() && errorMsgEl) {
        errorMsgEl.classList.add('hidden');
      }
    });
  }

  // Add / View Actions
  if (btnAddMore) {
    btnAddMore.addEventListener('click', () => {
      editingNoteId = null;
      if (inputEl) {
        const rawSaved = localStorage.getItem(STORAGE_KEY_RAW) || '';
        inputEl.value = rawSaved;
      }
      showView(viewForm);
      inputEl?.focus();
    });
  }

  if (btnViewNotes) {
    btnViewNotes.addEventListener('click', () => {
      renderSavedNotes();
      showView(viewList);
    });
  }

  // Return to Room Actions
  [btnBackList, btnBackForm, btnBackSuccess].forEach(btn => {
    btn?.addEventListener('click', () => {
      navigateTo('./habitacion.html');
    });
  });
});
