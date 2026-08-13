import { initPageTransition, navigateTo } from './transitions.js';

const STORAGE_KEY = 'angela_para_ti';
let editingNoteId = null;

function getNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();

  const viewList = document.getElementById('view-list');
  const viewForm = document.getElementById('view-form');
  const viewSuccess = document.getElementById('view-success');

  const notesListEl = document.getElementById('saved-notes-list');
  const inputEl = document.getElementById('para-ti-input');

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

  // Initial State Check
  const initialNotes = getNotes();
  if (initialNotes.length > 0) {
    renderSavedNotes();
    showView(viewList);
  } else {
    showView(viewForm);
  }

  // Save Note Action
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const val = inputEl?.value || '';
      if (!val.trim()) {
        inputEl?.focus();
        return;
      }
      saveNote(val);
      showView(viewSuccess);
    });
  }

  // Add / View Actions
  if (btnAddMore) {
    btnAddMore.addEventListener('click', () => {
      editingNoteId = null;
      if (inputEl) inputEl.value = '';
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
