/**
 * Sunveil Master App - Initialization, Shortcuts, Export/Import & Global Events
 */

document.addEventListener('DOMContentLoaded', () => {
  // Subscribe to store saves to update the status indicator
  const saveStatusText = document.querySelector('#save-status .status-text');
  const saveStatusDot = document.querySelector('#save-status .status-dot');

  let statusTimeout;
  window.store.subscribe(() => {
    if (saveStatusText && saveStatusDot) {
      saveStatusText.textContent = window.i18n ? window.i18n.t('status_saving') : 'Speichere...';
      saveStatusDot.style.background = '#f59e0b';
      saveStatusDot.style.boxShadow = '0 0 6px #f59e0b';

      clearTimeout(statusTimeout);
      statusTimeout = setTimeout(() => {
        saveStatusText.textContent = window.i18n ? window.i18n.t('status_saved') : 'Gespeichert';
        saveStatusDot.style.background = '#10b981';
        saveStatusDot.style.boxShadow = '0 0 6px #10b981';
      }, 400);
    }
  });

  // Language selector events
  const langBtn = document.getElementById('btn-lang-selector');
  const langMenu = document.getElementById('lang-menu');
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.classList.toggle('open');
    });

    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = opt.getAttribute('data-lang');
        if (lang && window.i18n) {
          window.i18n.setLanguage(lang);
        }
        langMenu.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.lang-selector-dropdown')) {
        langMenu.classList.remove('open');
      }
    });
  }

  // Hook into i18n changes to re-render views & update statuses
  if (window.i18n) {
    window.i18n.onChange(() => {
      if (window.kanbanApp) window.kanbanApp.render();
      if (window.mindmapApp && window.tabsManager && window.tabsManager.activeTabId !== 'kanban-main') {
        window.mindmapApp.renderNodes();
        window.mindmapApp.renderConnections();
      }
      if (saveStatusText) {
        saveStatusText.textContent = window.i18n.t('status_saved');
      }
    });
  }

  // Export Data Button
  const exportBtn = document.getElementById('btn-export-data');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      window.store.exportJSON();
      showGlobalToast(window.i18n ? window.i18n.t('toast_backup_downloaded') : 'Projekt-Backup heruntergeladen');
    });
  }

  // Import Data Button
  const importBtn = document.getElementById('btn-import-data');
  const fileInput = document.getElementById('import-file-input');
  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const success = window.store.importJSON(event.target.result);
          if (success) {
            window.kanbanApp.render();
            showGlobalToast(window.i18n ? window.i18n.t('toast_board_restored') : 'Board erfolgreich wiederhergestellt!');
          } else {
            alert(window.i18n ? window.i18n.t('toast_import_error') : 'Fehler beim Importieren: Datei enthält ungültige JSON-Struktur.');
          }
          fileInput.value = '';
        };
        reader.readAsText(file);
      }
    });
  }

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ignore shortcuts when user is typing in an input or contenteditable
    if (e.target.tagName === 'INPUT' || e.target.isContentEditable) {
      return;
    }

    // Ctrl + S: Save trigger
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      window.store.save();
      showGlobalToast(window.i18n ? window.i18n.t('toast_changes_saved') : 'Änderungen gespeichert');
      return;
    }

    // Escape: Back to Kanban
    if (e.key === 'Escape') {
      window.tabsManager.switchToTab('kanban-main');
      return;
    }

    // Tool switching shortcuts when in Mindmap view
    if (window.tabsManager.activeTabId !== 'kanban-main') {
      const key = e.key.toLowerCase();
      if (key === 'v') {
        window.mindmapApp.setActiveTool('select');
      } else if (key === 'h' || key === ' ') {
        window.mindmapApp.setActiveTool('pan');
      } else if (key === 'p') {
        window.mindmapApp.setActiveTool('draw-pen');
      } else if (key === 'a') {
        window.mindmapApp.setActiveTool('draw-arrow');
      } else if (key === 'e') {
        window.mindmapApp.setActiveTool('eraser');
      } else if (key === 'b') {
        window.mindmapApp.setActiveTool('add-bubble');
      }

      // Ctrl + Z for Drawing Undo
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        window.whiteboard.undo();
      }
    }
  });

  function showGlobalToast(msg) {
    const toast = document.getElementById('toast-notification');
    const msgEl = document.getElementById('toast-message');
    if (toast && msgEl) {
      msgEl.textContent = msg;
      toast.classList.add('visible');
      setTimeout(() => {
        toast.classList.remove('visible');
      }, 2500);
    }
  }

  // Heartbeat to keep native host alive while desktop window is open
  setInterval(() => {
    fetch('/api/ping').catch(() => {});
  }, 3000);

  window.addEventListener('beforeunload', () => {
    try {
      window.store.saveImmediate();
      navigator.sendBeacon('/api/shutdown');
    } catch (e) { }
  });

  // --- MCP (Model Context Protocol) Modal & Controls ---
  const mcpModal = document.getElementById('modal-mcp-integration');
  const btnOpenMcp = document.getElementById('btn-open-mcp');
  const btnCloseMcp = document.getElementById('btn-close-mcp-modal');
  const btnCloseMcpFooter = document.getElementById('btn-close-mcp-modal-footer');

  if (btnOpenMcp && mcpModal) {
    btnOpenMcp.addEventListener('click', () => {
      mcpModal.style.display = 'flex';
    });
  }

  const closeMcp = () => {
    if (mcpModal) mcpModal.style.display = 'none';
  };
  if (btnCloseMcp) btnCloseMcp.addEventListener('click', closeMcp);
  if (btnCloseMcpFooter) btnCloseMcpFooter.addEventListener('click', closeMcp);

  // MCP Tab Navigation
  const mcpTabButtons = document.querySelectorAll('.mcp-tab-nav button');
  const mcpTabPanels = document.querySelectorAll('.mcp-tab-panel');

  mcpTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-mcp-tab');
      mcpTabButtons.forEach(b => b.classList.remove('active'));
      mcpTabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(targetTab);
      if (panel) panel.classList.add('active');
    });
  });

  // Copy Claude Config
  const btnCopyClaude = document.getElementById('btn-copy-claude-config');
  if (btnCopyClaude) {
    btnCopyClaude.addEventListener('click', () => {
      const code = document.getElementById('code-claude-config').textContent;
      navigator.clipboard.writeText(code).then(() => {
        btnCopyClaude.textContent = window.i18n ? window.i18n.t('btn_copied') : '✅ Kopiert!';
        showGlobalToast(window.i18n ? window.i18n.t('btn_copied') : 'Claude MCP-Konfiguration kopiert');
        setTimeout(() => { btnCopyClaude.textContent = window.i18n ? window.i18n.t('btn_copy') : '📋 Kopieren'; }, 2000);
      });
    });
  }

  // Copy IDE Config
  const btnCopyIde = document.getElementById('btn-copy-ide-config');
  if (btnCopyIde) {
    btnCopyIde.addEventListener('click', () => {
      const code = document.getElementById('code-ide-config').textContent;
      navigator.clipboard.writeText(code).then(() => {
        btnCopyIde.textContent = window.i18n ? window.i18n.t('btn_copied') : '✅ Kopiert!';
        showGlobalToast(window.i18n ? window.i18n.t('btn_copied') : 'IDE MCP-Konfiguration kopiert');
        setTimeout(() => { btnCopyIde.textContent = window.i18n ? window.i18n.t('btn_copy') : '📋 Kopieren'; }, 2000);
      });
    });
  }

  // MCP Live Test Runner
  const testOutput = document.getElementById('mcp-test-output');
  const runMcpTest = async (tool, args = {}) => {
    if (!testOutput) return;
    testOutput.textContent = `⏳ Führe '${tool}' aus...`;
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, arguments: args })
      });
      if (res.ok) {
        const json = await res.json();
        testOutput.textContent = JSON.stringify(json, null, 2);
        showGlobalToast(`Tool '${tool}' erfolgreich ausgeführt!`);
        // Refresh store
        window.store.syncFromDisk(true);
      } else {
        const err = await res.text();
        testOutput.textContent = `Fehler (${res.status}): ${err}`;
      }
    } catch (e) {
      testOutput.textContent = `Verbindungsfehler: ${e.message}\nHinweis: Wenn du im reinen Browser ohne lokalen Server bist, starte die App bitte über Start-Kanban.cmd oder führe 'node server.js' aus.`;
    }
  };

  const btnTestGetBoard = document.getElementById('btn-test-get-board');
  if (btnTestGetBoard) {
    btnTestGetBoard.addEventListener('click', () => runMcpTest('kanban_get_board'));
  }

  const btnTestListCols = document.getElementById('btn-test-list-columns');
  if (btnTestListCols) {
    btnTestListCols.addEventListener('click', () => runMcpTest('kanban_list_columns'));
  }

  const btnTestCreateCard = document.getElementById('btn-test-create-card');
  if (btnTestCreateCard) {
    btnTestCreateCard.addEventListener('click', () => {
      const firstCol = (window.store.data.columns[0] || {}).id || 'col-1';
      runMcpTest('kanban_create_card', {
        columnId: firstCol,
        title: '🤖 KI-Aufgabe via MCP (' + new Date().toLocaleTimeString() + ')',
        tags: ['MCP-Test', 'KI'],
        description: 'Diese Karte wurde live über die Model Context Protocol (MCP) Schnittstelle erstellt!'
      });
    });
  }

  const btnTestAddNode = document.getElementById('btn-test-add-node');
  if (btnTestAddNode) {
    btnTestAddNode.addEventListener('click', () => {
      const firstCard = (window.store.data.cards[0] || {}).id;
      if (!firstCard) {
        alert('Bitte lege zuerst eine Karte an.');
        return;
      }
      runMcpTest('kanban_add_mindmap_node', {
        cardId: firstCard,
        title: '🧠 Neuer Gedanke via MCP',
        content: 'Automatisch von der MCP-Schnittstelle in der visuellen Mindmap platziert.',
        color: '#38bdf8'
      });
    });
  }

  console.log('✨ Sunveil Interactive Kanban & Mindmap ready.');
});
