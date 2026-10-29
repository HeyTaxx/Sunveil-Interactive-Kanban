/**
 * Sunveil Live Share - Real-Time Multi-User Collaboration Engine
 * Enables simultaneous editing of Kanban boards, Mindmaps and Whiteboards across LAN/Wi-Fi
 */

class LiveShareEngine {
  constructor() {
    this.clientId = this.getOrCreateClientId();
    this.userName = localStorage.getItem('sunveil_user_name') || this.generateDefaultName();
    this.userColor = localStorage.getItem('sunveil_user_color') || this.generateDefaultColor();
    this.isHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    this.activeBoardId = (window.store && window.store.activeBoardId) ? window.store.activeBoardId : 'main';

    this.eventSource = null;
    this.connected = false;
    this.collaborators = [];
    this.shareUrl = window.location.href;
    this.liveEnabled = true;

    this.activeTabId = 'kanban-main';
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;

    this.initElements();
    this.initEvents();
    this.fetchLiveInfo();
    this.connect();
  }

  getOrCreateClientId() {
    let id = localStorage.getItem('sunveil_client_id');
    if (!id) {
      id = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
      localStorage.setItem('sunveil_client_id', id);
    }
    return id;
  }

  generateDefaultName() {
    const animals = ['Fuchs', 'Adler', 'Wolf', 'Bär', 'Falke', 'Löwe', 'Panda', 'Tiger'];
    const chosen = animals[Math.floor(Math.random() * animals.length)];
    const num = Math.floor(10 + Math.random() * 89);
    return `${chosen} ${num}`;
  }

  generateDefaultColor() {
    const palette = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  initElements() {
    this.btnOpenModal = document.getElementById('btn-open-liveshare');
    this.modal = document.getElementById('modal-liveshare');
    this.btnCloseModal = document.getElementById('btn-close-liveshare-modal');
    this.btnCloseFooter = document.getElementById('btn-close-liveshare-footer');
    this.btnCopyLink = document.getElementById('btn-copy-liveshare-link');
    this.btnOpenBrowser = document.getElementById('btn-open-liveshare-browser');
    this.copyBtnText = document.getElementById('copy-btn-text');
    this.urlInput = document.getElementById('liveshare-url-input');
    this.nameInput = document.getElementById('liveshare-user-name');
    this.toggleActive = document.getElementById('toggle-liveshare-active');
    this.statusIndicator = document.getElementById('liveshare-status-indicator');
    this.statusLabel = document.getElementById('liveshare-status-label');
    this.usersBadge = document.getElementById('liveshare-users-badge');
    this.collaboratorsListEl = document.getElementById('liveshare-collaborators-list');
    this.headerAvatarsEl = document.getElementById('collaborator-avatars');
    this.headerCountEl = document.getElementById('live-users-count');
    this.qrContainer = document.getElementById('liveshare-qr-container');
    this.colorPalette = document.getElementById('liveshare-color-palette');

    if (this.nameInput) {
      this.nameInput.value = this.userName;
    }

    if (this.colorPalette) {
      this.colorPalette.querySelectorAll('.color-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.color === this.userColor);
      });
    }
  }

  initEvents() {
    // Open / Close Modal
    if (this.btnOpenModal) {
      this.btnOpenModal.addEventListener('click', () => {
        this.openModal();
      });
    }

    const closeModal = () => {
      if (this.modal) this.modal.style.display = 'none';
    };

    if (this.btnCloseModal) this.btnCloseModal.onclick = closeModal;
    if (this.btnCloseFooter) this.btnCloseFooter.onclick = closeModal;

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) closeModal();
      });
    }

    // Copy Link Button
    if (this.btnCopyLink && this.urlInput) {
      this.btnCopyLink.addEventListener('click', () => {
        const textToCopy = this.urlInput.value || this.shareUrl;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            this.showCopyFeedback();
          }).catch(() => {
            this.fallbackCopy(textToCopy);
          });
        } else {
          this.fallbackCopy(textToCopy);
        }
      });
    }

    // Name input editing
    if (this.nameInput) {
      const saveName = () => {
        const val = this.nameInput.value.trim();
        if (val && val !== this.userName) {
          this.userName = val;
          localStorage.setItem('sunveil_user_name', val);
          this.updateProfile();
        }
      };
      this.nameInput.addEventListener('change', saveName);
      this.nameInput.addEventListener('blur', saveName);
      this.nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.nameInput.blur();
        }
      });
    }

    // Color picker
    if (this.colorPalette) {
      this.colorPalette.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          this.colorPalette.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          this.userColor = dot.dataset.color;
          localStorage.setItem('sunveil_user_color', this.userColor);
          this.updateProfile();
        });
      });
    }

    // Live Share Toggle Switch
    if (this.toggleActive) {
      this.toggleActive.addEventListener('change', async () => {
        const enabled = this.toggleActive.checked;
        try {
          await fetch('/api/live/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
          });
          this.liveEnabled = enabled;
          this.updateStatusUI();
          if (enabled) {
            this.connect();
          } else {
            if (this.eventSource) this.eventSource.close();
            this.connected = false;
            this.collaborators = [];
            this.renderCollaborators();
          }
        } catch (e) {}
      });
    }
  }

  showCopyFeedback() {
    if (!this.copyBtnText) return;
    const oldText = this.copyBtnText.textContent;
    this.copyBtnText.textContent = window.i18n ? window.i18n.t('copied') : 'Kopiert! ✓';
    this.btnCopyLink.style.background = '#10b981';
    setTimeout(() => {
      this.copyBtnText.textContent = oldText;
      this.btnCopyLink.style.background = '';
    }, 2000);
  }

  fallbackCopy(text) {
    this.urlInput.select();
    this.urlInput.setSelectionRange(0, 99999);
    try {
      document.execCommand('copy');
      this.showCopyFeedback();
    } catch (e) {
      prompt('Link manuell kopieren:', text);
    }
  }

  async fetchLiveInfo() {
    try {
      const res = await fetch('/api/live/info', { cache: 'no-store' });
      if (res.ok) {
        const info = await res.json();
        this.liveEnabled = info.enabled !== false;
        if (info.shareUrl) {
          this.shareUrl = info.shareUrl;
          if (this.urlInput) this.urlInput.value = info.shareUrl;
          if (this.btnOpenBrowser) this.btnOpenBrowser.href = info.shareUrl;
          this.renderQRCode(info.shareUrl);
        }
        if (Array.isArray(info.clients)) {
          this.collaborators = info.clients;
          this.renderCollaborators();
        }
        this.updateStatusUI();
      }
    } catch (e) {
      // Fallback if running offline or standalone browser
      if (this.urlInput) this.urlInput.value = window.location.href;
      this.renderQRCode(window.location.href);
    }
  }

  connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const currentBoard = (window.store && window.store.activeBoardId) ? window.store.activeBoardId : (this.activeBoardId || 'main');
    this.activeBoardId = currentBoard;
    const streamUrl = `/api/live/stream?clientId=${encodeURIComponent(this.clientId)}&name=${encodeURIComponent(this.userName)}&color=${encodeURIComponent(this.userColor)}&boardId=${encodeURIComponent(this.activeBoardId)}`;
    
    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.updateStatusUI();
        console.log(`🌐 Live Share: Verbunden mit Board-Raum "${this.activeBoardId}".`);
      };

      this.eventSource.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          this.handleLiveMessage(msg);
        } catch (err) {}
      };

      this.eventSource.onerror = () => {
        this.connected = false;
        this.updateStatusUI();
        if (this.eventSource) this.eventSource.close();

        // Exponential backoff reconnect
        const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
        this.reconnectAttempts++;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          if (this.liveEnabled) this.connect();
        }, delay);
      };
    } catch (e) {
      this.connected = false;
      this.updateStatusUI();
    }
  }

  switchBoard(newBoardId) {
    if (!newBoardId || newBoardId === this.activeBoardId) return;
    this.activeBoardId = newBoardId;
    this.collaborators = [];
    this.renderCollaborators();
    this.connect();
  }

  handleLiveMessage(msg) {
    if (!msg || !msg.type) return;

    // Isolate by board room: ignore events from other boards
    if (msg.boardId && msg.boardId !== this.activeBoardId) {
      return;
    }

    if (msg.type === 'init') {
      if (Array.isArray(msg.clients)) {
        this.collaborators = msg.clients;
        this.renderCollaborators();
      }
      // If client joined an existing board from another device without local data:
      if (msg.board && Array.isArray(msg.board.columns) && (!window.store.data || !window.store.data.columns || window.store.data.columns.length === 0)) {
        window.store.data = msg.board;
        if (window.kanbanApp) window.kanbanApp.render();
      }
      return;
    }

    if (msg.type === 'presence') {
      if (Array.isArray(msg.clients)) {
        this.collaborators = msg.clients;
        this.renderCollaborators();
      }
      return;
    }

    if (msg.type === 'board_update') {
      const incomingBoard = msg.data;
      if (incomingBoard && Array.isArray(incomingBoard.columns) && Array.isArray(incomingBoard.cards)) {
        // Update store memory without triggering redundant broadcast
        window.store.data = incomingBoard;
        window.store.saveToStorage();

        // Refresh views seamlessly
        if (window.tabsManager && window.tabsManager.activeTabId === 'kanban-main') {
          if (window.kanbanApp) window.kanbanApp.render();
        } else if (window.tabsManager && window.mindmapApp) {
          const currentCardId = window.tabsManager.activeTabId;
          const card = window.store.getCard(currentCardId);
          if (card) {
            window.mindmapApp.nodes = card.mindmap ? card.mindmap.nodes : [];
            window.mindmapApp.connections = card.mindmap ? card.mindmap.connections : [];
            window.mindmapApp.renderNodes();
            window.mindmapApp.renderConnections();
            if (window.whiteboard && card.mindmap && card.mindmap.drawings) {
              window.whiteboard.setCard(currentCardId, card.mindmap.drawings);
            }
          }
        }

        // Show subtle notification toast
        const sender = this.collaborators.find(c => c.id === msg.senderId);
        const name = sender ? sender.name : (window.i18n ? window.i18n.t('collaborator_generic') : 'Ein Teammitglied');
        const updateMsg = window.i18n ? window.i18n.t('toast_board_updated_by', { name }) : `🔄 ${name} hat das Board aktualisiert`;
        this.showToast(updateMsg);
      }
      return;
    }

    if (msg.type === 'whiteboard_stroke') {
      const { cardId, stroke } = msg.data || {};
      if (window.tabsManager && window.tabsManager.activeTabId === cardId && window.whiteboard) {
        window.whiteboard.strokes.push(stroke);
        window.whiteboard.render();
      }
      return;
    }
  }

  // Broadcasts full board update to all other connected peers in the active board room
  broadcastBoard(boardData) {
    if (!this.connected) return;
    fetch('/api/live/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        'x-board-id': this.activeBoardId
      },
      body: JSON.stringify({
        senderId: this.clientId,
        boardId: this.activeBoardId,
        type: 'board_update',
        data: boardData
      })
    }).catch(() => {});
  }

  // Broadcasts a drawn stroke in real-time
  broadcastStroke(cardId, stroke) {
    if (!this.connected) return;
    fetch('/api/live/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        'x-board-id': this.activeBoardId
      },
      body: JSON.stringify({
        senderId: this.clientId,
        boardId: this.activeBoardId,
        type: 'whiteboard_stroke',
        data: { cardId, stroke }
      })
    }).catch(() => {});
  }

  // Notifies other peers which tab / card this user is currently viewing
  notifyTabChange(tabId) {
    this.activeTabId = tabId;
    if (!this.connected) return;
    fetch('/api/live/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-board-id': this.activeBoardId
      },
      body: JSON.stringify({
        senderId: this.clientId,
        boardId: this.activeBoardId,
        type: 'tab_change',
        data: { tabId }
      })
    }).catch(() => {});
  }

  // Updates current user's name & color
  updateProfile() {
    this.renderCollaborators();
    if (!this.connected) return;
    fetch('/api/live/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: this.clientId,
        type: 'profile_update',
        data: { name: this.userName, color: this.userColor }
      })
    }).catch(() => {});
  }

  updateStatusUI() {
    if (this.statusIndicator && this.statusLabel) {
      if (this.liveEnabled && this.connected) {
        this.statusIndicator.className = 'status-indicator-badge live';
        this.statusLabel.textContent = window.i18n ? window.i18n.t('liveshare_status_active') : 'Live Share Aktiv (Im Netzwerk verfügbar)';
      } else if (this.liveEnabled && !this.connected) {
        this.statusIndicator.className = 'status-indicator-badge connecting';
        this.statusLabel.textContent = window.i18n ? window.i18n.t('liveshare_status_connecting') : 'Verbinde mit Live Share...';
      } else {
        this.statusIndicator.className = 'status-indicator-badge offline';
        this.statusLabel.textContent = window.i18n ? window.i18n.t('liveshare_status_disabled') : 'Live Share Deaktiviert';
      }
    }
  }

  renderCollaborators() {
    const list = this.collaborators || [];
    const count = Math.max(list.length, 1);

    // 1. Header Count
    if (this.headerCountEl) {
      this.headerCountEl.textContent = count.toString();
    }

    // 2. Header Avatars Stack
    if (this.headerAvatarsEl) {
      this.headerAvatarsEl.innerHTML = '';
      const displayUsers = list.length > 0 ? list : [{ id: this.clientId, name: this.userName, color: this.userColor, isMe: true }];

      displayUsers.slice(0, 4).forEach(user => {
        const isMe = user.id === this.clientId;
        const name = isMe ? `${this.userName} (Du)` : (user.name || 'Gast');
        const color = isMe ? this.userColor : (user.color || '#6366f1');
        const initials = this.getInitials(name);

        const pill = document.createElement('div');
        pill.className = `collaborator-avatar-pill ${isMe ? 'is-me' : ''}`;
        pill.style.borderColor = color;
        pill.style.background = color + '28';
        pill.style.color = '#ffffff';
        pill.title = `${name}${user.activeTab && user.activeTab !== 'kanban-main' ? ' — In Mindmap' : ' — Auf Kanban Board'}`;
        pill.innerHTML = `<span class="collab-initials">${initials}</span><span class="collab-dot" style="background:${color};"></span>`;
        
        pill.addEventListener('click', () => this.openModal());
        this.headerAvatarsEl.appendChild(pill);
      });

      if (displayUsers.length > 4) {
        const morePill = document.createElement('div');
        morePill.className = 'collaborator-avatar-pill more-pill';
        morePill.textContent = `+${displayUsers.length - 4}`;
        morePill.title = `${displayUsers.length} Personen verbunden`;
        morePill.onclick = () => this.openModal();
        this.headerAvatarsEl.appendChild(morePill);
      }
    }

    // 3. Modal List
    if (this.usersBadge) {
      const onlineText = window.i18n ? window.i18n.t('liveshare_online_count', { count }) : `${count} online`;
      this.usersBadge.textContent = onlineText;
    }

    if (this.collaboratorsListEl) {
      this.collaboratorsListEl.innerHTML = '';
      const displayUsers = list.length > 0 ? list : [{ id: this.clientId, name: this.userName, color: this.userColor, isHost: true }];

      displayUsers.forEach(user => {
        const isMe = user.id === this.clientId;
        const name = isMe ? `${this.userName} (Du)` : (user.name || 'Gast');
        const color = isMe ? this.userColor : (user.color || '#6366f1');
        const initials = this.getInitials(name);

        let locationText = window.i18n ? window.i18n.t('location_kanban') : 'Auf dem Kanban Board';
        if (user.activeTab && user.activeTab !== 'kanban-main') {
          const card = window.store.getCard(user.activeTab);
          const cardTitle = card ? card.title : 'Aufgabe';
          locationText = window.i18n ? window.i18n.t('location_mindmap', { title: cardTitle }) : `In Mindmap: "${cardTitle}"`;
        }

        const item = document.createElement('div');
        item.className = 'collaborator-list-item';
        item.innerHTML = `
          <div class="collab-avatar-circle" style="background:${color};">
            ${initials}
          </div>
          <div class="collab-info">
            <div class="collab-name-row">
              <span class="collab-name">${this.escape(name)}</span>
              ${user.isHost ? `<span class="collab-tag host">${window.i18n ? window.i18n.t('role_host') : 'Host'}</span>` : `<span class="collab-tag guest">${window.i18n ? window.i18n.t('role_guest') : 'Gast'}</span>`}
              ${isMe ? `<span class="collab-tag me">${window.i18n ? window.i18n.t('role_me') : 'Du'}</span>` : ''}
            </div>
            <div class="collab-status-text">
              <span class="collab-live-pulse" style="background:${color};"></span>
              ${this.escape(locationText)}
            </div>
          </div>
        `;
        this.collaboratorsListEl.appendChild(item);
      });
    }

    // 4. Update Kanban Card collaborator presence indicators
    this.updateCardPresenceIndicators();
  }

  updateCardPresenceIndicators() {
    document.querySelectorAll('.kanban-card').forEach(cardEl => {
      const cardId = cardEl.dataset.cardId;
      const viewers = (this.collaborators || []).filter(c => c.id !== this.clientId && c.activeTab === cardId);
      
      let indicatorEl = cardEl.querySelector('.card-collaborator-indicator');
      if (viewers.length > 0) {
        if (!indicatorEl) {
          indicatorEl = document.createElement('div');
          indicatorEl.className = 'card-collaborator-indicator';
          cardEl.appendChild(indicatorEl);
        }
        indicatorEl.innerHTML = viewers.map(v => `
          <span class="card-viewer-chip" style="background:${v.color || '#6366f1'};" title="${this.escape(v.name)} bearbeitet diese Mindmap">
            ${this.getInitials(v.name)}
          </span>
        `).join('');
        cardEl.style.boxShadow = `0 0 0 1.5px ${viewers[0].color || '#6366f1'}88`;
      } else {
        if (indicatorEl) indicatorEl.remove();
        cardEl.style.boxShadow = '';
      }
    });
  }

  openModal() {
    this.fetchLiveInfo();
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.renderCollaborators();
    }
  }

  getInitials(str) {
    if (!str) return '??';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  }

  showToast(msg) {
    const toast = document.getElementById('toast-notification');
    const msgEl = document.getElementById('toast-message');
    if (toast && msgEl) {
      msgEl.textContent = msg;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2800);
    }
  }

  escape(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // --------------------------------------------------------------------------
  // Pure JavaScript Standalone QR Code SVG Generator (No External Dependencies)
  // --------------------------------------------------------------------------
  renderQRCode(text) {
    if (!this.qrContainer) return;
    try {
      const svgString = this.generateQRCodeSVG(text);
      this.qrContainer.innerHTML = svgString;
    } catch (e) {
      this.qrContainer.innerHTML = `<div style="font-size:11px;color:#94a3b8;padding:20px;">QR: ${this.escape(text)}</div>`;
    }
  }

  generateQRCodeSVG(text) {
    // Generate QR matrix using compact Reed-Solomon Byte Mode generator
    const matrix = this.createQRMatrix(text);
    const size = matrix.length;
    const cellSize = 6;
    const margin = 4;
    const totalSize = (size + margin * 2) * cellSize;

    let rects = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          const x = (c + margin) * cellSize;
          const y = (r + margin) * cellSize;
          rects += `<rect x="${x}" y="${y}" width="${cellSize - 0.2}" height="${cellSize - 0.2}" rx="1.5" fill="#f8fafc"/>`;
        }
      }
    }

    return `
      <svg width="170" height="170" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg" style="border-radius:12px; background:#0f172a; box-shadow:0 4px 16px rgba(0,0,0,0.5);">
        <rect width="${totalSize}" height="${totalSize}" fill="#0f172a" rx="16"/>
        ${rects}
      </svg>
    `;
  }

  createQRMatrix(text) {
    // Encode text to UTF-8 bytes
    const utf8 = unescape(encodeURIComponent(text));
    const dataBytes = [];
    for (let i = 0; i < utf8.length; i++) {
      dataBytes.push(utf8.charCodeAt(i));
    }

    // Determine version (Version 3: 29x29 for <= 44 bytes, Version 4: 33x33 for <= 64 bytes, Version 5: 37x37)
    let version = 3;
    let totalCodewords = 70;
    let ecCodewords = 26;
    let dataCapacity = 44;

    if (dataBytes.length > 44) {
      version = 4;
      totalCodewords = 100;
      ecCodewords = 36;
      dataCapacity = 64;
    }
    if (dataBytes.length > 64) {
      version = 5;
      totalCodewords = 134;
      ecCodewords = 48;
      dataCapacity = 86;
    }

    // Byte Mode header: 0100 (4 bits) + Character Count (8 bits for v1-9)
    const bits = [];
    function pushBits(val, len) {
      for (let i = len - 1; i >= 0; i--) {
        bits.push((val >> i) & 1);
      }
    }

    pushBits(4, 4); // Byte mode indicator
    pushBits(dataBytes.length, 8); // Character count indicator

    for (const byte of dataBytes) {
      pushBits(byte, 8);
    }

    // Terminator (up to 4 zeros)
    const maxDataBits = dataCapacity * 8;
    for (let i = 0; i < 4 && bits.length < maxDataBits; i++) {
      bits.push(0);
    }

    // Pad to byte boundary
    while (bits.length % 8 !== 0) {
      bits.push(0);
    }

    // Pad bytes 236 and 17 alternating
    const padBytes = [0xec, 0x11];
    let padIndex = 0;
    while (bits.length < maxDataBits) {
      pushBits(padBytes[padIndex % 2], 8);
      padIndex++;
    }

    // Convert bits to data codewords
    const dataCodewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) {
        b = (b << 1) | bits[i + j];
      }
      dataCodewords.push(b);
    }

    // Compute Reed-Solomon Error Correction Codewords
    const ecBytes = this.computeReedSolomon(dataCodewords, ecCodewords);
    const finalCodewords = dataCodewords.concat(ecBytes);

    // Build QR Matrix
    const size = version * 4 + 17;
    const matrix = Array.from({ length: size }, () => Array(size).fill(null));
    const isReserved = Array.from({ length: size }, () => Array(size).fill(false));

    // Place Finder Patterns
    const placeFinder = (r0, c0) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBlack = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          matrix[r0 + r][c0 + c] = isBlack ? 1 : 0;
          isReserved[r0 + r][c0 + c] = true;
        }
      }
      // Separator border
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const row = r0 + r;
          const col = c0 + c;
          if (row >= 0 && row < size && col >= 0 && col < size) {
            if (!isReserved[row][col]) {
              matrix[row][col] = 0;
              isReserved[row][col] = true;
            }
          }
        }
      }
    };

    placeFinder(0, 0);
    placeFinder(0, size - 7);
    placeFinder(size - 7, 0);

    // Place Alignment Pattern for Version >= 2
    if (version >= 2) {
      const alignCenter = size - 7;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const isBlack = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
          matrix[alignCenter + r][alignCenter + c] = isBlack ? 1 : 0;
          isReserved[alignCenter + r][alignCenter + c] = true;
        }
      }
    }

    // Place Timing Patterns
    for (let i = 8; i < size - 8; i++) {
      if (!isReserved[6][i]) {
        matrix[6][i] = (i % 2 === 0) ? 1 : 0;
        isReserved[6][i] = true;
      }
      if (!isReserved[i][6]) {
        matrix[i][6] = (i % 2 === 0) ? 1 : 0;
        isReserved[i][6] = true;
      }
    }

    // Reserve Format Info areas
    for (let i = 0; i < 9; i++) {
      if (i < size) { isReserved[8][i] = true; isReserved[i][8] = true; }
      if (size - 1 - i >= 0) { isReserved[8][size - 1 - i] = true; isReserved[size - 1 - i][8] = true; }
    }
    isReserved[size - 8][8] = true; // Dark module

    // Place Data Bits in zig-zag upward/downward pattern
    const dataBits = [];
    for (const byte of finalCodewords) {
      for (let i = 7; i >= 0; i--) {
        dataBits.push((byte >> i) & 1);
      }
    }

    let bitIdx = 0;
    let goingUp = true;
    for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
      if (rightCol === 6) rightCol--; // Skip vertical timing column
      const rows = goingUp 
        ? Array.from({ length: size }, (_, i) => size - 1 - i)
        : Array.from({ length: size }, (_, i) => i);

      for (const r of rows) {
        for (const c of [rightCol, rightCol - 1]) {
          if (!isReserved[r][c]) {
            const bit = bitIdx < dataBits.length ? dataBits[bitIdx++] : 0;
            // Mask pattern 0: (row + col) % 2 === 0
            const mask = ((r + c) % 2 === 0);
            matrix[r][c] = (bit ^ (mask ? 1 : 0)) ? 1 : 0;
          }
        }
      }
      goingUp = !goingUp;
    }

    // Write Format Information (Error Correction Level M = 00, Mask 000 -> 101010000010010)
    const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
    const coords1 = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    for (let i = 0; i < 15; i++) {
      const [r, c] = coords1[i];
      matrix[r][c] = formatBits[i];
    }
    const coords2 = [
      [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8],
      [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
    ];
    for (let i = 0; i < 15; i++) {
      const [r, c] = coords2[i];
      matrix[r][c] = formatBits[i];
    }

    return matrix;
  }

  computeReedSolomon(data, nEC) {
    const EXP = new Uint8Array(512);
    const LOG = new Uint8Array(256);
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x = (x << 1) ^ ((x & 0x80) ? 0x11d : 0);
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

    function gmult(a, b) {
      if (a === 0 || b === 0) return 0;
      return EXP[LOG[a] + LOG[b]];
    }

    // Generate generator polynomial
    let gen = [1];
    for (let i = 0; i < nEC; i++) {
      const next = [];
      const root = EXP[i];
      for (let j = 0; j < gen.length; j++) {
        next[j] = (next[j] || 0) ^ gmult(gen[j], root);
        next[j + 1] = (next[j + 1] || 0) ^ gen[j];
      }
      gen = next;
    }

    const res = new Uint8Array(data.length + nEC);
    res.set(data);
    for (let i = 0; i < data.length; i++) {
      const coef = res[i];
      if (coef !== 0) {
        for (let j = 0; j < gen.length; j++) {
          res[i + j] ^= gmult(gen[j], coef);
        }
      }
    }
    return Array.from(res.slice(data.length));
  }
}

// Instantiate Live Share Engine globally
window.liveShare = new LiveShareEngine();
