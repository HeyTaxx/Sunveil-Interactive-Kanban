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

  // --- Footer Brand & Install Modal Controls ---
  const installModal = document.getElementById('modal-install-sunveil');
  const btnFooterBrand = document.getElementById('btn-footer-brand-install');
  const btnCloseInstall = document.getElementById('btn-close-install-modal');
  const btnCloseInstallFooter = document.getElementById('btn-close-install-footer');

  const openInstallModal = () => {
    if (installModal) installModal.style.display = 'flex';
  };
  const closeInstallModal = () => {
    if (installModal) installModal.style.display = 'none';
  };

  if (btnFooterBrand) btnFooterBrand.addEventListener('click', openInstallModal);
  if (btnCloseInstall) btnCloseInstall.addEventListener('click', closeInstallModal);
  if (btnCloseInstallFooter) btnCloseInstallFooter.addEventListener('click', closeInstallModal);
  if (installModal) {
    installModal.addEventListener('click', (e) => {
      if (e.target === installModal) closeInstallModal();
    });
  }

  // PWA beforeinstallprompt handler
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  const btnInstallPwa = document.getElementById('btn-install-pwa');
  if (btnInstallPwa) {
    btnInstallPwa.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          showGlobalToast(window.i18n ? window.i18n.t('toast_app_installed') : 'Sunveil App erfolgreich installiert!');
        }
        deferredInstallPrompt = null;
      } else {
        const msg = window.i18n ? window.i18n.t('install_browser_instructions') :
          '🚀 App-Installation im Browser:\n\n' +
          '• Chrome & Edge (Desktop): Klicke oben rechts in der Adressleiste auf das App-Symbol (oder Menü ⋮ > "App installieren").\n' +
          '• Safari / iPad / iPhone: Tippe unten auf das Teilen-Symbol und wähle "Zum Home-Bildschirm".\n' +
          '• Android: Tippe im Browser-Menü auf "Zum Startbildschirm hinzufügen" oder "App installieren".';
        alert(msg);
      }
    });
  }

  // Copy Git Clone Command
  const btnCopyGitCmd = document.getElementById('btn-copy-git-cmd');
  if (btnCopyGitCmd) {
    btnCopyGitCmd.addEventListener('click', () => {
      const cmd = 'git clone https://github.com/your-username/sunveil-kanban.git && cd sunveil-kanban && npm start';
      navigator.clipboard.writeText(cmd).then(() => {
        showGlobalToast('Git-Befehl kopiert! 📋');
        btnCopyGitCmd.textContent = '✅ Kopiert!';
        setTimeout(() => {
          btnCopyGitCmd.textContent = window.i18n ? window.i18n.t('btn_copy_cmd') : '📋 Befehl kopieren';
        }, 2000);
      });
    });
  }

  // Show Portable Info
  const btnShowPortable = document.getElementById('btn-show-portable-info');
  if (btnShowPortable) {
    btnShowPortable.addEventListener('click', () => {
      alert(
        '🚀 Portable Desktop Version:\n\n' +
        'Keine Installation nötig! Starte einfach die Datei "Start-Kanban.cmd" oder "Sunveil.exe" direkt im Ordner.\n\n' +
        'Vorteile:\n' +
        '• 100% lokal & privat\n' +
        '• Unterstützt Offline-Betrieb & Festplatten-Speicherung\n' +
        '• Integrierter Model Context Protocol (MCP) Server für KI-Assistenten'
      );
    });
  }

  // Open Live Share QR from Install Modal
  const btnOpenLiveFromInstall = document.getElementById('btn-open-liveshare-from-install');
  if (btnOpenLiveFromInstall) {
    btnOpenLiveFromInstall.addEventListener('click', () => {
      closeInstallModal();
      if (window.liveShare) {
        window.liveShare.openModal();
      }
    });
  }

  // --------------------------------------------------------------------------
  // Workspace / Multi-Board Switcher UI Controller
  // --------------------------------------------------------------------------
  const btnWorkspaceSelect = document.getElementById('btn-workspace-selector');
  const workspaceMenu = document.getElementById('workspace-menu');
  const activeBoardLabel = document.getElementById('active-board-name');
  const workspaceItemsList = document.getElementById('workspace-items-list');
  const btnShowCreateBoard = document.getElementById('btn-show-create-board');
  const modalCreateBoard = document.getElementById('modal-create-board');
  const btnCloseCreateBoard = document.getElementById('btn-close-create-board');
  const btnCancelCreateBoard = document.getElementById('btn-cancel-create-board');
  const btnConfirmCreateBoard = document.getElementById('btn-confirm-create-board');
  const inputNewBoardTitle = document.getElementById('new-board-title');
  const selectNewBoardTemplate = document.getElementById('new-board-template');
  const newBoardColorPalette = document.getElementById('new-board-color-palette');

  let selectedBoardColor = '#6366f1';

  async function updateWorkspaceUI() {
    if (!workspaceItemsList) return;
    const boards = await window.store.fetchBoardsList();
    const currentId = window.store.activeBoardId || 'main';
    const activeBoard = boards.find(b => b.id === currentId) || boards[0] || { title: 'Project Workspace' };

    if (activeBoardLabel) {
      activeBoardLabel.textContent = activeBoard.title;
    }

    workspaceItemsList.innerHTML = '';
    boards.forEach(b => {
      const itemEl = document.createElement('div');
      itemEl.className = `workspace-item ${b.id === currentId ? 'active' : ''}`;
      itemEl.innerHTML = `
        <div class="workspace-item-title-group">
          <span class="workspace-dot" style="background:${b.color || '#6366f1'};"></span>
          <span class="workspace-item-name">${escapeHtml(b.title)}</span>
        </div>
        <div class="workspace-item-meta">
          <span class="workspace-card-count">${b.cardCount !== undefined ? b.cardCount : 0}</span>
          ${b.id !== 'main' ? `<button class="btn-delete-board-item" data-id="${b.id}" title="Board löschen">&times;</button>` : ''}
        </div>
      `;

      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-board-item')) {
          e.stopPropagation();
          const confirmText = window.i18n ? window.i18n.t('workspace_confirm_delete', { title: b.title }) : `Board "${b.title}" wirklich löschen?`;
          if (confirm(confirmText)) {
            window.store.deleteBoard(b.id).then(() => {
              updateWorkspaceUI();
            });
          }
          return;
        }
        window.store.switchBoard(b.id);
        workspaceMenu.classList.remove('open');
        updateWorkspaceUI();
      });

      workspaceItemsList.appendChild(itemEl);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  if (btnWorkspaceSelect && workspaceMenu) {
    btnWorkspaceSelect.addEventListener('click', (e) => {
      e.stopPropagation();
      workspaceMenu.classList.toggle('open');
      if (workspaceMenu.classList.contains('open')) {
        updateWorkspaceUI();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.workspace-selector-dropdown')) {
        workspaceMenu.classList.remove('open');
      }
    });
  }

  // Create Board Modal Handlers
  if (btnShowCreateBoard && modalCreateBoard) {
    btnShowCreateBoard.addEventListener('click', (e) => {
      e.stopPropagation();
      workspaceMenu.classList.remove('open');
      modalCreateBoard.style.display = 'flex';
      if (inputNewBoardTitle) {
        inputNewBoardTitle.value = '';
        setTimeout(() => inputNewBoardTitle.focus(), 50);
      }
    });

    const closeCreateBoard = () => {
      modalCreateBoard.style.display = 'none';
    };

    if (btnCloseCreateBoard) btnCloseCreateBoard.onclick = closeCreateBoard;
    if (btnCancelCreateBoard) btnCancelCreateBoard.onclick = closeCreateBoard;

    modalCreateBoard.addEventListener('click', (e) => {
      if (e.target === modalCreateBoard) closeCreateBoard();
    });

    if (newBoardColorPalette) {
      newBoardColorPalette.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          newBoardColorPalette.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          selectedBoardColor = dot.dataset.color || '#6366f1';
        });
      });
    }

    if (btnConfirmCreateBoard) {
      btnConfirmCreateBoard.addEventListener('click', async () => {
        const title = (inputNewBoardTitle ? inputNewBoardTitle.value : '').trim();
        if (!title) {
          inputNewBoardTitle.focus();
          return;
        }
        const template = selectNewBoardTemplate ? selectNewBoardTemplate.value : 'standard';
        const newBoard = await window.store.createBoard(title, selectedBoardColor, template);
        if (newBoard) {
          closeCreateBoard();
          updateWorkspaceUI();
          showGlobalToast(window.i18n ? window.i18n.t('workspace_switch_success', { title }) : `Board "${title}" erstellt!`);
        }
      });
    }
  }

  // Initial load of workspace data
  updateWorkspaceUI();
  window.store.subscribe(() => {
    updateWorkspaceUI();
  });

  // --------------------------------------------------------------------------
  // Server Security, Authentication & Session Controller
  // --------------------------------------------------------------------------
  const modalServerLogin = document.getElementById('modal-server-login');
  const serverLoginTitle = document.getElementById('server-login-title');
  const serverLoginDesc = document.getElementById('server-login-desc');
  const serverLoginError = document.getElementById('server-login-error');
  const serverPwdInput = document.getElementById('server-password-input');
  const serverPwdConfirm = document.getElementById('server-password-confirm');
  const groupServerSetup = document.getElementById('group-server-setup-confirm');
  const btnSubmitServerAuth = document.getElementById('btn-submit-server-auth');
  const btnTogglePwdVis = document.getElementById('btn-toggle-pwd-vis');
  const serverAuthPill = document.getElementById('server-auth-pill');
  const serverStatusLabel = document.getElementById('server-status-label');
  const btnServerAuthAction = document.getElementById('btn-server-auth-action');

  let serverAuthMode = 'login'; // 'login' | 'setup'

  async function checkServerAuthStatus() {
    try {
      const res = await fetch('/api/auth/status', { cache: 'no-store' });
      if (!res.ok) return;
      const status = await res.json();

      if (status.isServerMode || status.authRequired) {
        if (serverAuthPill) {
          serverAuthPill.style.display = 'flex';
          if (serverStatusLabel) {
            serverStatusLabel.textContent = status.isServerMode ? 
              (window.i18n ? window.i18n.t('server_mode_badge') : 'Server-Modus') : 'Auth-Modus';
          }
        }
      }

      if (status.authRequired) {
        if (!status.authenticated) {
          // Show Login or Setup Modal
          if (modalServerLogin) modalServerLogin.style.display = 'flex';

          if (!status.isSetup) {
            // First time setup mode
            serverAuthMode = 'setup';
            if (serverLoginTitle) serverLoginTitle.textContent = window.i18n ? window.i18n.t('server_setup_title') : '🛡️ Server-Sicherheit einrichten';
            if (serverLoginDesc) serverLoginDesc.textContent = window.i18n ? window.i18n.t('server_setup_desc') : 'Willkommen! Bitte lege ein sicheres Admin-Passwort für diesen Server fest.';
            if (groupServerSetup) groupServerSetup.style.display = 'block';
            if (btnSubmitServerAuth) btnSubmitServerAuth.textContent = window.i18n ? window.i18n.t('server_btn_setup') : 'Passwort speichern & Server starten';
          } else {
            // Standard login mode
            serverAuthMode = 'login';
            if (serverLoginTitle) serverLoginTitle.textContent = window.i18n ? window.i18n.t('server_login_title') : '🔐 Server-Anmeldung';
            if (serverLoginDesc) serverLoginDesc.textContent = window.i18n ? window.i18n.t('server_login_desc') : 'Dieser Sunveil-Server ist geschützt. Bitte gib das Passwort ein.';
            if (groupServerSetup) groupServerSetup.style.display = 'none';
            if (btnSubmitServerAuth) btnSubmitServerAuth.textContent = window.i18n ? window.i18n.t('server_btn_login') : 'Anmelden';
          }
          if (serverPwdInput) serverPwdInput.focus();
        } else {
          // Already authenticated!
          if (modalServerLogin) modalServerLogin.style.display = 'none';
          if (btnServerAuthAction) btnServerAuthAction.style.display = 'flex';
        }
      } else {
        if (modalServerLogin) modalServerLogin.style.display = 'none';
      }
    } catch (e) {
      console.log('Standalone / offline client mode.');
    }
  }

  // Toggle Password Visibility
  if (btnTogglePwdVis && serverPwdInput) {
    btnTogglePwdVis.addEventListener('click', () => {
      const isPwd = serverPwdInput.type === 'password';
      serverPwdInput.type = isPwd ? 'text' : 'password';
      btnTogglePwdVis.textContent = isPwd ? '🔒' : '👁️';
    });
  }

  // Submit Server Authentication
  if (btnSubmitServerAuth) {
    btnSubmitServerAuth.addEventListener('click', async () => {
      const pwd = (serverPwdInput ? serverPwdInput.value : '').trim();
      if (!pwd) {
        if (serverPwdInput) serverPwdInput.focus();
        return;
      }

      if (serverLoginError) serverLoginError.style.display = 'none';

      if (serverAuthMode === 'setup') {
        const confirmPwd = (serverPwdConfirm ? serverPwdConfirm.value : '').trim();
        if (pwd.length < 4) {
          if (serverLoginError) {
            serverLoginError.textContent = 'Das Passwort muss mindestens 4 Zeichen lang sein.';
            serverLoginError.style.display = 'block';
          }
          return;
        }
        if (pwd !== confirmPwd) {
          if (serverLoginError) {
            serverLoginError.textContent = window.i18n ? window.i18n.t('server_password_mismatch') : 'Die Passwörter stimmen nicht überein.';
            serverLoginError.style.display = 'block';
          }
          return;
        }

        try {
          const res = await fetch('/api/auth/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            if (modalServerLogin) modalServerLogin.style.display = 'none';
            if (btnServerAuthAction) btnServerAuthAction.style.display = 'flex';
            showGlobalToast('Admin-Passwort erfolgreich festgelegt! 🛡️');
            await window.store.syncFromDisk(false);
            if (window.liveShare) window.liveShare.connect();
          } else {
            if (serverLoginError) {
              serverLoginError.textContent = data.message || data.error || 'Fehler beim Speichern.';
              serverLoginError.style.display = 'block';
            }
          }
        } catch (err) {
          if (serverLoginError) {
            serverLoginError.textContent = 'Verbindungsfehler zum Server.';
            serverLoginError.style.display = 'block';
          }
        }
      } else {
        // Login mode
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            if (modalServerLogin) modalServerLogin.style.display = 'none';
            if (btnServerAuthAction) btnServerAuthAction.style.display = 'flex';
            showGlobalToast('Erfolgreich angemeldet! 🔓');
            await window.store.syncFromDisk(false);
            await updateWorkspaceUI();
            if (window.liveShare) window.liveShare.connect();
          } else {
            if (serverLoginError) {
              serverLoginError.textContent = data.message || (window.i18n ? window.i18n.t('server_wrong_password') : 'Ungültiges Passwort.');
              serverLoginError.style.display = 'block';
            }
          }
        } catch (err) {
          if (serverLoginError) {
            serverLoginError.textContent = 'Verbindungsfehler zum Server.';
            serverLoginError.style.display = 'block';
          }
        }
      }
    });

    if (serverPwdInput) {
      serverPwdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnSubmitServerAuth.click();
        }
      });
    }
    if (serverPwdConfirm) {
      serverPwdConfirm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnSubmitServerAuth.click();
        }
      });
    }
  }

  // Server Logout Action
  if (btnServerAuthAction) {
    btnServerAuthAction.addEventListener('click', async () => {
      const confirmMsg = window.i18n ? window.i18n.t('server_btn_logout') + '?' : 'Vom Server abmelden?';
      if (confirm(confirmMsg)) {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {}
        window.location.reload();
      }
    });
  }

  // Check auth immediately
  checkServerAuthStatus();

  console.log('✨ Sunveil Interactive Kanban & Mindmap ready.');
});
