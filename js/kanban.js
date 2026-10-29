/**
 * Sunveil Kanban - Column & Card Drag and Drop, Filtering & Double-Click Mindmap Launcher
 */

class KanbanEngine {
  constructor() {
    this.columnsContainer = document.getElementById('kanban-columns');
    this.boardTitleEl = document.getElementById('board-title-editable');
    this.searchInput = document.getElementById('card-search-input');
    this.filterQuery = '';

    this.draggedCardId = null;
    this.draggedColumnId = null;

    this.init();
  }

  init() {
    // Board Title editing
    if (this.boardTitleEl) {
      this.boardTitleEl.textContent = window.store.data.title || '🚀 Projekt Arbeitsbereich';
      this.boardTitleEl.addEventListener('input', () => {
        window.store.setBoardTitle(this.boardTitleEl.textContent.trim());
      });
      this.boardTitleEl.addEventListener('blur', () => {
        window.store.setBoardTitle(this.boardTitleEl.textContent.trim());
      });
      this.boardTitleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.boardTitleEl.blur();
        }
      });
    }

    // Search filter
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.filterQuery = this.searchInput.value.toLowerCase().trim();
        this.render();
      });
    }

    // Add Column Button
    const addColBtn = document.getElementById('btn-add-column');
    if (addColBtn) {
      addColBtn.addEventListener('click', () => {
        const colTitle = prompt(window.i18n.t('prompt_new_column'), window.i18n.t('default_new_column'));
        if (colTitle) {
          window.store.addColumn(colTitle);
          this.render();
        }
      });
    }

    // Quick New Card in Top Header
    const quickCardBtn = document.getElementById('btn-quick-new-card');
    if (quickCardBtn) {
      quickCardBtn.addEventListener('click', () => {
        const firstCol = window.store.data.columns[0];
        if (firstCol) {
          const title = prompt(window.i18n.t('prompt_quick_card'), window.i18n.t('default_new_card'));
          if (title) {
            const newCard = window.store.addCard(firstCol.id, title);
            this.render();
            window.tabsManager.openCardTab(newCard.id);
          }
        }
      });
    }

    // Subscribe to language changes
    if (window.i18n) {
      window.i18n.onChange(() => {
        this.render();
      });
    }

    this.render();
  }

  render() {
    if (this.boardTitleEl && document.activeElement !== this.boardTitleEl) {
      this.boardTitleEl.textContent = window.store.data.title || '🚀 Project Workspace';
    }
    this.columnsContainer.innerHTML = '';

    for (const column of window.store.data.columns) {
      const colEl = this.createColumnElement(column);
      this.columnsContainer.appendChild(colEl);
    }
  }

  createColumnElement(column) {
    const colEl = document.createElement('div');
    colEl.className = 'kanban-column';
    colEl.dataset.columnId = column.id;
    colEl.draggable = true;

    // Filter cards
    let cards = window.store.getCardsInColumn(column.id);
    if (this.filterQuery) {
      cards = cards.filter(c => 
        c.title.toLowerCase().includes(this.filterQuery) ||
        (c.tags && c.tags.some(t => t.name.toLowerCase().includes(this.filterQuery)))
      );
    }

    colEl.innerHTML = `
      <div class="column-header">
        <div class="column-title-group">
          <span class="column-drag-handle" title="${window.i18n.t('drag_column_title')}">⋮⋮</span>
          <span class="column-dot" style="background:${column.color || '#6366f1'}"></span>
          <span class="column-title" contenteditable="true" spellcheck="false">${this.escape(column.title)}</span>
          <span class="column-count">${cards.length}</span>
        </div>
        <button class="column-menu-btn" title="${window.i18n.t('delete_column_title')}">&times;</button>
      </div>

      <div class="cards-list" data-column-id="${column.id}">
        <!-- Cards inserted here -->
      </div>

      <div class="column-footer">
        <button class="btn-add-card-inline">${window.i18n.t('btn_add_card_inline')}</button>
      </div>
    `;

    // Column Drag & Drop (Tauschen der Spalten/Tabellen)
    colEl.addEventListener('dragstart', (e) => {
      // Don't drag column if a card is being dragged or text is edited
      if (this.draggedCardId || e.target.closest('.kanban-card') || e.target.isContentEditable) {
        return;
      }
      this.draggedColumnId = column.id;
      colEl.classList.add('column-dragging');
      e.dataTransfer.setData('text/plain', column.id);
      e.stopPropagation();
    });

    colEl.addEventListener('dragend', () => {
      colEl.classList.remove('column-dragging');
      this.draggedColumnId = null;
      document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('column-drop-before', 'column-drop-after'));
    });

    colEl.addEventListener('dragover', (e) => {
      if (!this.draggedColumnId || this.draggedColumnId === column.id) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';

      const rect = colEl.getBoundingClientRect();
      const isBefore = e.clientX < rect.left + rect.width / 2;
      colEl.classList.toggle('column-drop-before', isBefore);
      colEl.classList.toggle('column-drop-after', !isBefore);
    });

    colEl.addEventListener('dragleave', () => {
      colEl.classList.remove('column-drop-before', 'column-drop-after');
    });

    colEl.addEventListener('drop', (e) => {
      if (!this.draggedColumnId || this.draggedColumnId === column.id) return;
      e.preventDefault();
      e.stopPropagation();
      colEl.classList.remove('column-drop-before', 'column-drop-after');

      const rect = colEl.getBoundingClientRect();
      const isBefore = e.clientX < rect.left + rect.width / 2;

      const allCols = window.store.data.columns;
      const targetIndex = allCols.findIndex(c => c.id === column.id);
      if (targetIndex !== -1) {
        let newIdx = isBefore ? targetIndex : targetIndex + 1;
        const oldIdx = allCols.findIndex(c => c.id === this.draggedColumnId);
        if (oldIdx < newIdx) newIdx--;
        window.store.moveColumn(this.draggedColumnId, newIdx);
        this.draggedColumnId = null;
        this.render();
      }
    });

    // Column Title change (saves on input AND blur)
    const titleEl = colEl.querySelector('.column-title');
    titleEl.addEventListener('input', () => {
      window.store.updateColumnTitle(column.id, titleEl.textContent.trim() || 'Spalte');
    });
    titleEl.addEventListener('blur', () => {
      window.store.updateColumnTitle(column.id, titleEl.textContent.trim() || 'Spalte');
    });
    titleEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        titleEl.blur();
      }
    });

    // Delete column button
    const delColBtn = colEl.querySelector('.column-menu-btn');
    delColBtn.addEventListener('click', () => {
      const msg = window.i18n ? window.i18n.t('confirm_delete_column', { name: column.title }) : `Spalte "${column.title}" und alle darin enthaltenen Karten löschen?`;
      if (confirm(msg)) {
        window.store.deleteColumn(column.id);
        this.render();
      }
    });

    // Add card inline
    const addCardBtn = colEl.querySelector('.btn-add-card-inline');
    addCardBtn.addEventListener('click', () => {
      const promptMsg = window.i18n ? window.i18n.t('prompt_card_title') : 'Kartentitel eingeben:';
      const defaultTitle = window.i18n ? window.i18n.t('default_new_card') : 'Neue Aufgabe';
      const title = prompt(promptMsg, defaultTitle);
      if (title) {
        window.store.addCard(column.id, title);
        this.render();
      }
    });

    // Cards Container & Drag Targets
    const cardsList = colEl.querySelector('.cards-list');
    for (const card of cards) {
      const cardEl = this.createCardElement(card, column.id);
      cardsList.appendChild(cardEl);
    }

    cardsList.addEventListener('dragover', (e) => {
      if (this.draggedColumnId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      cardsList.classList.add('drag-over');
    });

    cardsList.addEventListener('dragleave', () => {
      cardsList.classList.remove('drag-over');
    });

    cardsList.addEventListener('drop', (e) => {
      if (this.draggedColumnId || !this.draggedCardId) return;
      e.preventDefault();
      cardsList.classList.remove('drag-over');
      
      // Dropping in the empty space of cards list -> place at end
      window.store.moveCard(this.draggedCardId, column.id, cards.length);
      if (window.githubSync) {
        window.githubSync.notifyCardMoved(this.draggedCardId, column.id);
      }
      this.draggedCardId = null;
      this.render();
    });

    return colEl;
  }

  createCardElement(card, columnId) {
    const cardEl = document.createElement('div');
    cardEl.className = 'kanban-card';
    cardEl.dataset.cardId = card.id;
    cardEl.draggable = true;

    const nodeCount = (card.mindmap && card.mindmap.nodes) ? card.mindmap.nodes.length : 1;
    const drawingCount = (card.mindmap && card.mindmap.drawings) ? card.mindmap.drawings.length : 0;
    const hasDrawings = drawingCount > 0;

    let tagsHtml = '';
    if (card.tags && card.tags.length > 0) {
      tagsHtml = '<div class="card-tags">' + 
        card.tags.map(t => `<span class="card-tag" style="background:${t.color}20; color:${t.color}; border:1px solid ${t.color}40;">${this.escape(t.name)}</span>`).join('') +
        '</div>';
    }

    let githubBadgeHtml = '';
    if (card.github) {
      const gh = card.github;
      const isPr = gh.type === 'pullrequest' || gh.type === 'pr';
      const isDraft = gh.type === 'draftissue' || gh.type === 'draft';
      const statusColor = (gh.state === 'CLOSED' || gh.state === 'MERGED') ? '#a855f7' : (gh.state === 'OPEN' ? '#10b981' : '#64748b');
      const badgeText = isDraft ? 'Draft' : (gh.number ? '#' + gh.number : 'GH');

      githubBadgeHtml = `
        <div class="card-github-badge">
          <a ${gh.url ? `href="${this.escape(gh.url)}" target="_blank"` : ''} class="gh-link" title="${this.escape(gh.repository || 'GitHub Project')}" onclick="event.stopPropagation();">
            <svg class="gh-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span class="gh-number">${this.escape(badgeText)}</span>
            ${gh.repository ? `<span class="gh-repo">${this.escape(gh.repository.split('/')[1] || gh.repository)}</span>` : ''}
          </a>
          ${gh.assignee ? `<span class="gh-assignee" title="Zugewiesen an @${this.escape(gh.assignee.login)}"><img src="${this.escape(gh.assignee.avatarUrl)}" alt="${this.escape(gh.assignee.login)}"></span>` : ''}
          <span class="gh-dot" style="background:${statusColor};" title="Status: ${this.escape(gh.state || 'Aktiv')}"></span>
        </div>
      `;
    }

    cardEl.innerHTML = `
      <div class="card-top-badges">
        ${githubBadgeHtml}
        ${tagsHtml}
      </div>
      <div class="card-title-text" contenteditable="true" spellcheck="false" title="${window.i18n ? window.i18n.t('card_title_hint') : 'Klicken zum Bearbeiten des Titels'}">${this.escape(card.title)}</div>
      <div class="card-footer">
        <div class="card-indicators">
          <span class="indicator-item" title="${window.i18n ? window.i18n.t('indicator_nodes', { count: nodeCount }) : nodeCount + ' Mindmap-Knoten'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 8v8"/>
            </svg>
            ${nodeCount}
          </span>
          ${hasDrawings ? `
            <span class="indicator-item" title="${window.i18n ? window.i18n.t('indicator_drawings', { count: drawingCount }) : drawingCount + ' Skizzen/Zeichnungen'}" style="color:var(--accent-emerald);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              </svg>
              ${drawingCount}
            </span>
          ` : ''}
        </div>
        <div class="card-mindmap-hint" title="${window.i18n ? window.i18n.t('mindmap_hint') : 'Doppelklick = Mindmap öffnen'}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          ${window.i18n ? window.i18n.t('mindmap_badge') : 'Mindmap'}
        </div>
      </div>
    `;

    // Direct inline title editing with auto-save
    const cardTitleEl = cardEl.querySelector('.card-title-text');
    cardTitleEl.addEventListener('input', () => {
      const defaultNew = window.i18n ? window.i18n.t('default_new_card') : 'Neue Karte';
      const newTitle = cardTitleEl.textContent.trim() || defaultNew;
      card.title = newTitle;
      window.store.updateCardTitle(card.id, newTitle);
      window.tabsManager.updateTabTitle(card.id, newTitle);
    });

    cardTitleEl.addEventListener('blur', () => {
      const defaultNew = window.i18n ? window.i18n.t('default_new_card') : 'Neue Karte';
      const newTitle = cardTitleEl.textContent.trim() || defaultNew;
      window.store.updateCardTitle(card.id, newTitle);
      window.tabsManager.updateTabTitle(card.id, newTitle);
      if (window.githubSync) {
        window.githubSync.notifyCardUpdated(card.id);
      }
    });

    cardTitleEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        cardTitleEl.blur();
      }
    });

    // Prevent drag when editing text inside card
    cardTitleEl.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    // Double-click on card -> open Mindmap
    cardEl.addEventListener('dblclick', (e) => {
      if (e.target === cardTitleEl) return;
      e.stopPropagation();
      window.tabsManager.openCardTab(card.id);
    });

    // Mindmap hint button click
    const hintBtn = cardEl.querySelector('.card-mindmap-hint');
    hintBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.tabsManager.openCardTab(card.id);
    });

    // Card Drag and Drop
    cardEl.addEventListener('dragstart', (e) => {
      if (document.activeElement === cardTitleEl) {
        e.preventDefault();
        return;
      }
      this.draggedCardId = card.id;
      cardEl.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.id);
      e.stopPropagation();
    });

    cardEl.addEventListener('dragend', () => {
      cardEl.classList.remove('dragging');
      this.draggedCardId = null;
      document.querySelectorAll('.kanban-card').forEach(c => c.classList.remove('drop-target-above', 'drop-target-below'));
    });

    // Card reordering / swapping when dragged over another card
    cardEl.addEventListener('dragover', (e) => {
      if (this.draggedColumnId || !this.draggedCardId || this.draggedCardId === card.id) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';

      const rect = cardEl.getBoundingClientRect();
      const isAbove = e.clientY < (rect.top + rect.height / 2);
      cardEl.classList.toggle('drop-target-above', isAbove);
      cardEl.classList.toggle('drop-target-below', !isAbove);
    });

    cardEl.addEventListener('dragleave', () => {
      cardEl.classList.remove('drop-target-above', 'drop-target-below');
    });

    cardEl.addEventListener('drop', (e) => {
      if (this.draggedColumnId || !this.draggedCardId) return;
      e.preventDefault();
      e.stopPropagation();
      cardEl.classList.remove('drop-target-above', 'drop-target-below');

      if (this.draggedCardId === card.id) return;

      const rect = cardEl.getBoundingClientRect();
      const isAbove = e.clientY < (rect.top + rect.height / 2);

      const colCards = window.store.getCardsInColumn(columnId).filter(c => c.id !== this.draggedCardId);
      let targetIdx = colCards.findIndex(c => c.id === card.id);
      if (targetIdx === -1) targetIdx = colCards.length;
      if (!isAbove) targetIdx++;

      window.store.moveCard(this.draggedCardId, columnId, targetIdx);
      if (window.githubSync) {
        window.githubSync.notifyCardMoved(this.draggedCardId, columnId);
      }
      this.draggedCardId = null;
      this.render();
    });

    return cardEl;
  }

  escape(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

window.kanbanApp = new KanbanEngine();
