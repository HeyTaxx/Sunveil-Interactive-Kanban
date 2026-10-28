/**
 * Sunveil Store - Dual Persistence: Local Disk File (via Native Host API) & LocalStorage
 */

const STORAGE_KEY = 'sunveil_kanban_mindmap_v1';

class DataStore {
  constructor() {
    this.data = this.loadFromStorage() || this.createDefaultDataset();
    this.listeners = [];
    this.saveDebounceTimer = null;
    this.isSaving = false;

    this.lastLoadedVersion = 0;
    this.isSyncing = false;

    // Load from disk API if running via native executable/server
    this.syncFromDisk();

    // Start background sync for external/MCP changes
    this.startLiveSync();

    // Ensure save on window close
    window.addEventListener('beforeunload', () => {
      this.saveImmediate();
    });
  }

  async syncFromDisk(isExternalUpdate = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok) {
        const diskData = await res.json();
        if (diskData && Array.isArray(diskData.columns) && Array.isArray(diskData.cards)) {
          this.data = diskData;
          this.saveToStorage();
          this.notifyListeners();

          // Get latest version timestamp
          try {
            const vRes = await fetch('/api/version', { cache: 'no-store' });
            if (vRes.ok) {
              const vData = await vRes.json();
              if (vData && vData.version) {
                this.lastLoadedVersion = vData.version;
              }
            }
          } catch (e) {}

          if (window.kanbanApp) {
            window.kanbanApp.render();
          }
          if (window.tabsManager && window.tabsManager.activeTabId !== 'kanban-main' && window.mindmapApp) {
            const activeCardId = window.tabsManager.activeTabId.replace('card-tab-', '');
            const card = this.getCard(activeCardId);
            if (card) {
              window.mindmapApp.openCardMindmap(card);
            }
          }

          if (isExternalUpdate) {
            this.updateStatusIndicator('MCP / Disk synchronisiert');
            const toast = document.getElementById('toast-notification');
            const msgEl = document.getElementById('toast-message');
            if (toast && msgEl) {
              msgEl.textContent = '🤖 Board via MCP / Festplatte aktualisiert!';
              toast.classList.add('visible');
              setTimeout(() => toast.classList.remove('visible'), 2000);
            }
          }
          console.log('✅ Daten erfolgreich von lokaler Festplatte geladen.');
        } else {
          // File does not exist on disk yet: save current default data to create it!
          this.saveImmediate();
        }
      }
    } catch (e) {
      // Running standalone in browser without desktop host
      console.log('ℹ️ Verwende LocalStorage Modus.');
    } finally {
      this.isSyncing = false;
    }
  }

  startLiveSync() {
    window.addEventListener('focus', () => this.checkDiskVersion());
    setInterval(() => {
      this.checkDiskVersion();
    }, 2500);
  }

  async checkDiskVersion() {
    // Skip if actively typing or saving
    if (this.isSaving || this.saveDebounceTimer || this.isSyncing) return;
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (res.ok) {
        const { version } = await res.json();
        if (version && this.lastLoadedVersion && version > this.lastLoadedVersion) {
          console.log('🔄 Externe Änderung (MCP/Datei) erkannt. Lade Board neu...');
          await this.syncFromDisk(true);
        } else if (version && !this.lastLoadedVersion) {
          this.lastLoadedVersion = version;
        }
      }
    } catch (e) {}
  }

  createDefaultDataset() {
    const colBacklogId = 'col-1';
    const colProgressId = 'col-2';
    const colReviewId = 'col-3';
    const colDoneId = 'col-4';

    const cardDemoId = 'card-demo-1';
    const card2Id = 'card-demo-2';
    const card3Id = 'card-demo-3';

    return {
      title: '🚀 Project Workspace',
      columns: [
        { id: colBacklogId, title: '💡 Ideas & Concepts', color: '#6366f1' },
        { id: colProgressId, title: '⚡ In Progress', color: '#38bdf8' },
        { id: colReviewId, title: '🔍 Review & Testing', color: '#f59e0b' },
        { id: colDoneId, title: '✅ Done', color: '#10b981' }
      ],
      cards: [
        {
          id: cardDemoId,
          columnId: colProgressId,
          title: 'Visual Mindmap & Canvas Demo',
          order: 0,
          tags: [{ name: 'UI / UX', color: '#6366f1' }, { name: 'Interactive', color: '#38bdf8' }],
          mindmap: {
            nodes: [
              {
                id: 'center-root',
                isCenter: true,
                type: 'bubble',
                title: 'Visual Mindmap & Canvas Demo',
                content: 'Central mindmap for this task. All notes, links, and sketches are collected here.',
                x: 4800,
                y: 4800,
                color: '#6366f1'
              },
              {
                id: 'node-sub-1',
                type: 'bubble',
                title: '🎨 Color Palette & Themes',
                content: 'Sleek dark mode with accents in Indigo, Sky Blue, and Emerald.',
                x: 4400,
                y: 4680,
                color: '#38bdf8'
              },
              {
                id: 'node-sub-2',
                type: 'bubble',
                title: '✏️ Freehand Sketching',
                content: 'Use the pen tool to handwrite notes, sketch arrows, and draw diagrams freely!',
                x: 5200,
                y: 4680,
                color: '#10b981'
              },
              {
                id: 'node-sub-3',
                type: 'link',
                title: 'Web Documentation & Docs',
                url: 'https://developer.mozilla.org',
                content: 'Embedded links and web resources inside mindmap bubbles.',
                x: 4800,
                y: 5120,
                color: '#f59e0b'
              }
            ],
            connections: [
              { id: 'conn-1', fromId: 'center-root', toId: 'node-sub-1', color: '#38bdf8' },
              { id: 'conn-2', fromId: 'center-root', toId: 'node-sub-2', color: '#10b981' },
              { id: 'conn-3', fromId: 'center-root', toId: 'node-sub-3', color: '#f59e0b' }
            ],
            drawings: [
              {
                tool: 'arrow',
                color: '#38bdf8',
                size: 3,
                startX: 4580,
                startY: 4720,
                endX: 4760,
                endY: 4800
              },
              {
                tool: 'pen',
                color: '#10b981',
                size: 3,
                points: [
                  { x: 5080, y: 4720 },
                  { x: 5090, y: 4725 },
                  { x: 5110, y: 4740 },
                  { x: 5140, y: 4755 },
                  { x: 5170, y: 4760 }
                ]
              }
            ]
          }
        },
        {
          id: card2Id,
          columnId: colBacklogId,
          title: 'Local Architecture & Performance',
          order: 0,
          tags: [{ name: 'Core', color: '#f59e0b' }],
          mindmap: {
            nodes: [
              {
                id: 'center-root',
                isCenter: true,
                type: 'bubble',
                title: 'Local Architecture & Performance',
                content: 'Saves instantly in local browser storage and synchronizes to local disk files with zero dependencies.',
                x: 4800,
                y: 4800,
                color: '#f59e0b'
              }
            ],
            connections: [],
            drawings: []
          }
        },
        {
          id: card3Id,
          columnId: colDoneId,
          title: 'Edge Tab Integration',
          order: 0,
          tags: [{ name: 'Done', color: '#10b981' }],
          mindmap: {
            nodes: [
              {
                id: 'center-root',
                isCenter: true,
                type: 'bubble',
                title: 'Edge Tab Integration',
                content: 'Quickly switch between the master Kanban board and multiple open card mindmaps.',
                x: 4800,
                y: 4800,
                color: '#10b981'
              }
            ],
            connections: [],
            drawings: []
          }
        }
      ]
    };
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('LocalStorage nicht verfügbar:', e);
      return null;
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) { }
  }

  // Auto-Save: Debounced so typing doesn't stutter, saves immediately to disk & localStorage
  save() {
    const text = window.i18n ? window.i18n.t('status_saving') : 'Saving...';
    this.updateStatusIndicator(text);
    clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(() => {
      this.saveImmediate();
    }, 250);
  }

  saveImmediate() {
    this.saveToStorage();
    this.saveToDisk();
    this.notifyListeners();
  }

  async saveToDisk() {
    try {
      const jsonString = JSON.stringify(this.data, null, 2);
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonString,
        keepalive: true
      });
      if (res.ok) {
        const resJson = await res.json();
        if (resJson && resJson.version) {
          this.lastLoadedVersion = resJson.version;
        }
      }
      this.updateStatusIndicator(window.i18n ? window.i18n.t('status_saved') : 'Saved');
    } catch (e) {
      // In standalone browser mode
      this.updateStatusIndicator(window.i18n ? window.i18n.t('status_saved_local') : 'Saved (Local)');
    }
  }

  updateStatusIndicator(text) {
    const statusText = document.querySelector('#save-status .status-text');
    const statusDot = document.querySelector('#save-status .status-dot');
    if (statusText && statusDot) {
      statusText.textContent = text;
      if (text.toLowerCase().includes('sav') || text.toLowerCase().includes('speicher')) {
        statusDot.style.background = '#f59e0b';
        statusDot.style.boxShadow = '0 0 6px #f59e0b';
      } else {
        statusDot.style.background = '#10b981';
        statusDot.style.boxShadow = '0 0 6px #10b981';
      }
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb(this.data);
      } catch (e) { }
    }
  }

  // --- Board Title ---
  setBoardTitle(title) {
    this.data.title = title || 'Neues Kanban Board';
    this.save();
  }

  // --- Columns ---
  addColumn(title, color = '#6366f1') {
    const newCol = {
      id: 'col-' + Date.now(),
      title: title || 'Neue Spalte',
      color: color
    };
    this.data.columns.push(newCol);
    this.save();
    return newCol;
  }

  updateColumnTitle(colId, newTitle) {
    const col = this.data.columns.find(c => c.id === colId);
    if (col) {
      col.title = newTitle;
      this.save();
    }
  }

  deleteColumn(colId) {
    this.data.cards = this.data.cards.filter(c => c.columnId !== colId);
    this.data.columns = this.data.columns.filter(c => c.id !== colId);
    this.save();
  }

  moveColumn(colId, targetIndex) {
    const fromIndex = this.data.columns.findIndex(c => c.id === colId);
    if (fromIndex === -1) return;
    const [col] = this.data.columns.splice(fromIndex, 1);
    
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex > this.data.columns.length) targetIndex = this.data.columns.length;

    this.data.columns.splice(targetIndex, 0, col);
    this.save();
  }

  // --- Cards ---
  addCard(columnId, title) {
    const cardId = 'card-' + Date.now();
    const cardTitle = title || 'Neue Karte';
    const newCard = {
      id: cardId,
      columnId: columnId,
      title: cardTitle,
      order: this.getCardsInColumn(columnId).length,
      tags: [],
      mindmap: {
        nodes: [
          {
            id: 'center-root',
            isCenter: true,
            type: 'bubble',
            title: cardTitle,
            content: 'Doppelklicke hier oder nutze die Werkzeuge links, um Gedanken, Skizzen und Links zu verknüpfen.',
            x: 4800,
            y: 4800,
            color: '#6366f1'
          }
        ],
        connections: [],
        drawings: []
      }
    };
    this.data.cards.push(newCard);
    this.save();
    return newCard;
  }

  getCard(cardId) {
    return this.data.cards.find(c => c.id === cardId);
  }

  getCardsInColumn(columnId) {
    return this.data.cards
      .filter(c => c.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  }

  updateCardTitle(cardId, newTitle) {
    const card = this.getCard(cardId);
    if (card) {
      card.title = newTitle;
      if (card.mindmap && card.mindmap.nodes) {
        const center = card.mindmap.nodes.find(n => n.id === 'center-root' || n.isCenter);
        if (center) {
          center.title = newTitle;
        }
      }
      this.save();
    }
  }

  moveCard(cardId, targetColumnId, newIndex) {
    const card = this.getCard(cardId);
    if (!card) return;

    const oldColumnId = card.columnId;
    card.columnId = targetColumnId;

    const cardsInDest = this.getCardsInColumn(targetColumnId).filter(c => c.id !== cardId);
    if (newIndex < 0) newIndex = 0;
    if (newIndex > cardsInDest.length) newIndex = cardsInDest.length;

    cardsInDest.splice(newIndex, 0, card);
    cardsInDest.forEach((c, idx) => {
      c.order = idx;
    });

    if (oldColumnId !== targetColumnId) {
      const cardsInOld = this.getCardsInColumn(oldColumnId);
      cardsInOld.forEach((c, idx) => {
        c.order = idx;
      });
    }

    this.save();
  }

  deleteCard(cardId) {
    this.data.cards = this.data.cards.filter(c => c.id !== cardId);
    this.save();
  }

  // --- Mindmap Operations ---
  updateCardMindmap(cardId, mindmapData) {
    const card = this.getCard(cardId);
    if (card) {
      card.mindmap = mindmapData;
      this.save();
    }
  }

  // --- Export / Import ---
  exportJSON() {
    const str = JSON.stringify(this.data, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sunveil_Kanban_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.cards)) {
        this.data = parsed;
        this.saveImmediate();
        return true;
      }
    } catch (e) {
      console.error('Ungültige JSON-Datei:', e);
    }
    return false;
  }
}

window.store = new DataStore();
