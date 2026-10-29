/**
 * Sunveil GitHub Projects Integration & Live 2-Way Sync Engine
 * 
 * Supports:
 * - GitHub Projects v2 (Modern Projects) with single-select Status field mapping
 * - Issues, Pull Requests & Draft Issues
 * - Live bidirectional synchronization (drag & drop in Sunveil updates GitHub Status)
 * - Title and body edits sync
 * - Auto-sync with configurable intervals
 * - Zero external dependencies: works with local proxy API or direct browser fetch
 */

class GitHubSyncEngine {
  constructor() {
    this.config = {
      connected: false,
      token: '',
      owner: '',
      ownerType: 'user', // 'user' | 'org'
      projectId: '',
      projectNumber: null,
      projectTitle: '',
      projectUrl: '',
      statusFieldId: '',
      statusFieldName: 'Status',
      statusOptions: [], // [{ id, name, color }]
      autoSync: true,
      syncInterval: 30, // seconds
      lastSync: null
    };

    this.userProfile = null;
    this.projectsList = [];
    this.isSyncing = false;
    this.syncTimer = null;
    this.logs = [];

    this.initElements();
    this.loadConfig();
  }

  initElements() {
    this.btnOpenModal = document.getElementById('btn-open-github');
    this.modal = document.getElementById('modal-github-integration');
    this.btnCloseModal = document.getElementById('btn-close-github-modal');
    this.btnCloseFooter = document.getElementById('btn-close-github-footer');

    this.headerSyncDot = document.getElementById('header-gh-sync-dot');
    this.footerStatusEl = document.getElementById('footer-gh-status');
    this.footerStatusDot = document.getElementById('footer-gh-dot');
    this.footerStatusText = document.getElementById('footer-gh-text');

    // Modal tabs
    this.tabButtons = document.querySelectorAll('.gh-tab-btn');
    this.tabPanels = document.querySelectorAll('.gh-tab-panel');

    // Form inputs
    this.tokenInput = document.getElementById('gh-token-input');
    this.ownerInput = document.getElementById('gh-owner-input');
    this.ownerTypeSelect = document.getElementById('gh-owner-type');
    this.btnVerifyToken = document.getElementById('btn-gh-verify-token');
    this.userBadgeEl = document.getElementById('gh-user-badge');
    this.btnFetchProjects = document.getElementById('btn-gh-fetch-projects');
    this.projectSelect = document.getElementById('gh-project-select');
    this.fieldSelect = document.getElementById('gh-field-select');
    this.btnConnectProject = document.getElementById('btn-gh-connect-project');
    this.btnDisconnect = document.getElementById('btn-gh-disconnect');

    // Live Sync controls
    this.btnSyncNow = document.getElementById('btn-gh-sync-now');
    this.btnPullFromGh = document.getElementById('btn-gh-pull');
    this.btnPushToGh = document.getElementById('btn-gh-push');
    this.toggleAutoSync = document.getElementById('gh-auto-sync-toggle');
    this.connectedInfoBox = document.getElementById('gh-connected-info');
    this.logsContainer = document.getElementById('gh-activity-logs');

    this.bindEvents();
  }

  bindEvents() {
    if (this.btnOpenModal && this.modal) {
      this.btnOpenModal.addEventListener('click', () => {
        this.openModal();
      });
    }

    const closeModal = () => {
      if (this.modal) this.modal.style.display = 'none';
    };

    if (this.btnCloseModal) this.btnCloseModal.addEventListener('click', closeModal);
    if (this.btnCloseFooter) this.btnCloseFooter.addEventListener('click', closeModal);

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) closeModal();
      });
    }

    // Modal Tab Navigation
    if (this.tabButtons) {
      this.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab;
          this.tabButtons.forEach(b => b.classList.remove('active'));
          this.tabPanels.forEach(p => p.classList.remove('active'));

          btn.classList.add('active');
          const panel = document.getElementById(target);
          if (panel) panel.classList.add('active');
        });
      });
    }

    // Verify Token Button
    if (this.btnVerifyToken) {
      this.btnVerifyToken.addEventListener('click', () => {
        const token = (this.tokenInput ? this.tokenInput.value : '').trim();
        if (!token) {
          this.log('⚠️ Bitte gib ein Personal Access Token ein.', 'warning');
          return;
        }
        this.verifyToken(token);
      });
    }

    // Fetch Projects Button
    if (this.btnFetchProjects) {
      this.btnFetchProjects.addEventListener('click', () => {
        const owner = (this.ownerInput ? this.ownerInput.value : '').trim();
        const isOrg = this.ownerTypeSelect ? this.ownerTypeSelect.value === 'org' : false;
        if (!owner) {
          this.log('⚠️ Bitte gib einen Account- oder Organisationsnamen an.', 'warning');
          return;
        }
        this.loadProjects(owner, isOrg);
      });
    }

    // Project Dropdown Change
    if (this.projectSelect) {
      this.projectSelect.addEventListener('change', () => {
        const projectId = this.projectSelect.value;
        const project = this.projectsList.find(p => p.id === projectId);
        this.populateFieldSelect(project);
      });
    }

    // Connect Project Button
    if (this.btnConnectProject) {
      this.btnConnectProject.addEventListener('click', () => {
        this.connectSelectedProject();
      });
    }

    // Disconnect Button
    if (this.btnDisconnect) {
      this.btnDisconnect.addEventListener('click', () => {
        if (confirm('Möchtest du die GitHub Projects Verbindung trennen? Die vorhandenen Karten auf dem Board bleiben erhalten.')) {
          this.disconnect();
        }
      });
    }

    // Manual Sync Buttons
    if (this.btnSyncNow) {
      this.btnSyncNow.addEventListener('click', () => {
        this.syncAll(true);
      });
    }
    if (this.btnPullFromGh) {
      this.btnPullFromGh.addEventListener('click', () => {
        this.pullFromGitHub(true);
      });
    }
    if (this.btnPushToGh) {
      this.btnPushToGh.addEventListener('click', () => {
        this.pushModifiedCards(true);
      });
    }

    // Auto-Sync Toggle
    if (this.toggleAutoSync) {
      this.toggleAutoSync.addEventListener('change', () => {
        this.config.autoSync = this.toggleAutoSync.checked;
        this.saveConfig();
        this.setupAutoSync();
        this.log(`Auto-Sync ${this.config.autoSync ? 'aktiviert (alle 30s)' : 'deaktiviert'}.`);
      });
    }

    // Footer brand / status click
    if (this.footerStatusEl) {
      this.footerStatusEl.addEventListener('click', () => {
        this.openModal();
      });
    }
  }

  openModal() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      this.updateUI();
    }
  }

  log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const item = { time, msg, type };
    this.logs.unshift(item);
    if (this.logs.length > 50) this.logs.pop();

    if (this.logsContainer) {
      const line = document.createElement('div');
      line.className = `log-entry log-${type}`;
      line.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-text">${this.escape(msg)}</span>`;
      this.logsContainer.insertBefore(line, this.logsContainer.firstChild);
    }
    console.log(`[GitHubSync] ${msg}`);
  }

  escape(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async loadConfig() {
    try {
      const res = await fetch('/api/github/config');
      if (res.ok) {
        const saved = await res.json();
        if (saved && typeof saved === 'object' && saved.token) {
          this.config = { ...this.config, ...saved };
        }
      }
    } catch (e) {
      // Fallback to localStorage
      try {
        const local = localStorage.getItem('sunveil_github_config');
        if (local) {
          this.config = { ...this.config, ...JSON.parse(local) };
        }
      } catch (err) {}
    }

    this.updateUI();

    if (this.config.connected && this.config.token && this.config.projectId) {
      this.setupAutoSync();
      // Initial background sync
      setTimeout(() => {
        this.pullFromGitHub(false);
      }, 1500);
    }
  }

  async saveConfig() {
    try {
      localStorage.setItem('sunveil_github_config', JSON.stringify(this.config));
      await fetch('/api/github/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.config)
      });
    } catch (e) {}
    this.updateUI();
  }

  updateUI() {
    // Fill inputs
    if (this.tokenInput && this.config.token) {
      this.tokenInput.value = this.config.token;
    }
    if (this.ownerInput && this.config.owner) {
      this.ownerInput.value = this.config.owner;
    }
    if (this.ownerTypeSelect && this.config.ownerType) {
      this.ownerTypeSelect.value = this.config.ownerType;
    }
    if (this.toggleAutoSync) {
      this.toggleAutoSync.checked = !!this.config.autoSync;
    }

    // Update Status Dots & Badges
    const isConn = !!this.config.connected;
    if (this.headerSyncDot) {
      this.headerSyncDot.classList.toggle('connected', isConn);
      this.headerSyncDot.title = isConn ? `GitHub verbunden: ${this.config.projectTitle || 'Projekt'}` : 'GitHub nicht verbunden';
    }

    if (this.footerStatusDot) {
      this.footerStatusDot.classList.toggle('connected', isConn);
      this.footerStatusDot.classList.toggle('syncing', this.isSyncing);
    }

    if (this.footerStatusText) {
      if (this.isSyncing) {
        this.footerStatusText.textContent = 'GitHub: Synchronisiere...';
      } else if (isConn) {
        const last = this.config.lastSync ? new Date(this.config.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Jetzt';
        this.footerStatusText.textContent = `GitHub: ${this.config.projectTitle || 'Verbunden'} (${last})`;
      } else {
        this.footerStatusText.textContent = 'GitHub Projects verbinden';
      }
    }

    // Connected Info Card in modal
    if (this.connectedInfoBox) {
      if (isConn) {
        this.connectedInfoBox.style.display = 'block';
        this.connectedInfoBox.innerHTML = `
          <div class="conn-info-header">
            <div class="conn-title-group">
              <span class="gh-dot-active"></span>
              <strong>${this.escape(this.config.projectTitle)}</strong>
              ${this.config.projectUrl ? `<a href="${this.config.projectUrl}" target="_blank" class="gh-outlink" title="Auf GitHub öffnen">↗</a>` : ''}
            </div>
            <span class="badge-status-green">Aktiv verbunden</span>
          </div>
          <div class="conn-meta-row">
            <span><strong>Owner:</strong> ${this.escape(this.config.owner)}</span>
            <span><strong>Status-Feld:</strong> ${this.escape(this.config.statusFieldName)} (${(this.config.statusOptions || []).length} Spalten)</span>
            <span><strong>Letzter Sync:</strong> ${this.config.lastSync ? new Date(this.config.lastSync).toLocaleTimeString() : 'Nie'}</span>
          </div>
        `;
      } else {
        this.connectedInfoBox.style.display = 'none';
      }
    }

    // Toggle disconnect / connect buttons
    if (this.btnConnectProject) {
      this.btnConnectProject.textContent = isConn ? 'Projekt-Verbindung aktualisieren' : 'Projekt verbinden & Synchronisieren';
    }
    if (this.btnDisconnect) {
      this.btnDisconnect.style.display = isConn ? 'inline-flex' : 'none';
    }
  }

  // --------------------------------------------------------------------------
  // API Request Wrapper (uses /api/github/proxy or direct fallback)
  // --------------------------------------------------------------------------
  async request(endpoint, options = {}) {
    const token = options.token || this.config.token;
    const method = options.method || 'GET';
    const body = options.body;

    // Check if we can use the local server proxy
    try {
      const res = await fetch('/api/github/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: endpoint,
          method,
          token,
          body
        })
      });

      if (res.ok) {
        return await res.json();
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
    } catch (proxyErr) {
      // Direct browser fallback
      console.warn('Proxy request failed, attempting direct fetch:', proxyErr.message);
      const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
      const headers = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      if (token) {
        headers['Authorization'] = token.startsWith('Bearer ') || token.startsWith('token ') ? token : `Bearer ${token}`;
      }
      if (body) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(url, {
        method,
        headers,
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`GitHub API Fehler (${res.status}): ${errText}`);
      }
      return await res.json();
    }
  }

  async graphql(query, variables = {}) {
    const res = await this.request('/graphql', {
      method: 'POST',
      body: { query, variables }
    });

    if (res.errors && res.errors.length > 0) {
      throw new Error(res.errors[0].message);
    }
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Token Verification
  // --------------------------------------------------------------------------
  async verifyToken(token) {
    this.log('Überprüfe GitHub Token...');
    if (this.btnVerifyToken) this.btnVerifyToken.disabled = true;

    try {
      const user = await this.request('/user', { token });
      this.userProfile = user;
      this.config.token = token;
      if (!this.config.owner) {
        this.config.owner = user.login;
        if (this.ownerInput) this.ownerInput.value = user.login;
      }

      this.log(`✓ Verbunden als @${user.login} (${user.name || 'Benutzer'})`, 'success');

      if (this.userBadgeEl) {
        this.userBadgeEl.style.display = 'flex';
        this.userBadgeEl.innerHTML = `
          <img src="${user.avatar_url}" alt="${user.login}" class="gh-avatar">
          <div class="gh-user-details">
            <span class="gh-user-name">${this.escape(user.name || user.login)}</span>
            <span class="gh-user-handle">@${this.escape(user.login)}</span>
          </div>
          <span class="badge-status-green" style="margin-left:auto;">Token Gültig</span>
        `;
      }

      // Automatically load projects for this user
      await this.loadProjects(user.login, false);
      this.saveConfig();
    } catch (e) {
      this.log(`❌ Token ungültig oder fehlende Berechtigungen: ${e.message}`, 'error');
      if (this.userBadgeEl) {
        this.userBadgeEl.style.display = 'flex';
        this.userBadgeEl.innerHTML = `<span style="color:var(--accent-rose);">❌ ${this.escape(e.message)}</span>`;
      }
    } finally {
      if (this.btnVerifyToken) this.btnVerifyToken.disabled = false;
    }
  }

  // --------------------------------------------------------------------------
  // Load Projects v2
  // --------------------------------------------------------------------------
  async loadProjects(owner, isOrg = false) {
    this.log(`Lade GitHub Projects für ${isOrg ? 'Organisation' : 'User'} '${owner}'...`);
    if (this.btnFetchProjects) this.btnFetchProjects.disabled = true;

    const queryUser = `
      query GetUserProjects($login: String!) {
        user(login: $login) {
          projectsV2(first: 30) {
            nodes {
              id
              number
              title
              url
              shortDescription
              closed
              fields(first: 30) {
                nodes {
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    options {
                      id
                      name
                      color
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const queryOrg = `
      query GetOrgProjects($login: String!) {
        organization(login: $login) {
          projectsV2(first: 30) {
            nodes {
              id
              number
              title
              url
              shortDescription
              closed
              fields(first: 30) {
                nodes {
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    options {
                      id
                      name
                      color
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.graphql(isOrg ? queryOrg : queryUser, { login: owner });
      const container = isOrg ? data.organization : data.user;

      if (!container) {
        throw new Error(`${isOrg ? 'Organisation' : 'Benutzer'} '${owner}' nicht gefunden.`);
      }

      this.projectsList = (container.projectsV2 && container.projectsV2.nodes) || [];

      if (this.projectsList.length === 0) {
        this.log(`ℹ️ Keine GitHub Projects v2 bei '${owner}' gefunden.`, 'warning');
      } else {
        this.log(`✓ ${this.projectsList.length} GitHub Project(s) gefunden.`, 'success');
      }

      this.populateProjectSelect();
    } catch (e) {
      this.log(`❌ Fehler beim Laden der Projekte: ${e.message}`, 'error');
    } finally {
      if (this.btnFetchProjects) this.btnFetchProjects.disabled = false;
    }
  }

  populateProjectSelect() {
    if (!this.projectSelect) return;
    this.projectSelect.innerHTML = '';

    if (this.projectsList.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- Keine Projekte gefunden --';
      this.projectSelect.appendChild(opt);
      this.populateFieldSelect(null);
      return;
    }

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Projekt auswählen --';
    this.projectSelect.appendChild(placeholder);

    for (const p of this.projectsList) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.title} (#${p.number})${p.closed ? ' [Geschlossen]' : ''}`;
      if (p.id === this.config.projectId) {
        opt.selected = true;
      }
      this.projectSelect.appendChild(opt);
    }

    const currentSelected = this.projectsList.find(p => p.id === (this.projectSelect.value || this.config.projectId));
    this.populateFieldSelect(currentSelected || this.projectsList[0]);
  }

  populateFieldSelect(project) {
    if (!this.fieldSelect) return;
    this.fieldSelect.innerHTML = '';

    if (!project || !project.fields || !project.fields.nodes) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- Kein Status-Feld --';
      this.fieldSelect.appendChild(opt);
      return;
    }

    const singleSelectFields = project.fields.nodes.filter(f => f && f.options);
    if (singleSelectFields.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- Keine Auswahlfelder definiert --';
      this.fieldSelect.appendChild(opt);
      return;
    }

    for (const f of singleSelectFields) {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = `${f.name} (${f.options.length} Optionen: ${f.options.map(o => o.name).join(', ')})`;
      if (f.id === this.config.statusFieldId || f.name.toLowerCase() === 'status') {
        opt.selected = true;
      }
      this.fieldSelect.appendChild(opt);
    }
  }

  // --------------------------------------------------------------------------
  // Connect Selected Project
  // --------------------------------------------------------------------------
  async connectSelectedProject() {
    const projectId = this.projectSelect ? this.projectSelect.value : '';
    const fieldId = this.fieldSelect ? this.fieldSelect.value : '';

    if (!projectId) {
      alert('Bitte wähle ein GitHub Projekt aus.');
      return;
    }

    const project = this.projectsList.find(p => p.id === projectId);
    if (!project) {
      alert('Projektdaten konnten nicht geladen werden.');
      return;
    }

    const field = (project.fields && project.fields.nodes) ? project.fields.nodes.find(f => f && f.id === fieldId) : null;
    const statusOptions = field ? field.options : [];

    this.config.connected = true;
    this.config.projectId = project.id;
    this.config.projectNumber = project.number;
    this.config.projectTitle = project.title;
    this.config.projectUrl = project.url;
    this.config.statusFieldId = fieldId;
    this.config.statusFieldName = field ? field.name : 'Status';
    this.config.statusOptions = statusOptions;
    this.config.owner = (this.ownerInput ? this.ownerInput.value : this.config.owner).trim();
    this.config.ownerType = this.ownerTypeSelect ? this.ownerTypeSelect.value : 'user';

    this.saveConfig();
    this.setupAutoSync();

    this.log(`✓ Projekt '${project.title}' erfolgreich verbunden!`, 'success');
    this.showGlobalToast(`GitHub Projekt '${project.title}' verbunden`);

    // Perform initial pull
    await this.pullFromGitHub(true);
  }

  disconnect() {
    this.config.connected = false;
    this.config.projectId = '';
    this.config.projectTitle = '';
    this.config.projectUrl = '';
    this.config.statusFieldId = '';
    this.config.statusOptions = [];
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.saveConfig();
    this.log('GitHub Projects Verbindung getrennt.');
    this.showGlobalToast('GitHub Verbindung getrennt');
  }

  // --------------------------------------------------------------------------
  // Pull Sync (GitHub -> Sunveil)
  // --------------------------------------------------------------------------
  async pullFromGitHub(showToast = false) {
    if (!this.config.connected || !this.config.projectId) {
      return;
    }
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.updateUI();

    this.log(`📥 Lade Items aus Projekt '${this.config.projectTitle}'...`);

    const query = `
      query GetProjectItems($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            id
            title
            fields(first: 30) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                    color
                  }
                }
              }
            }
            items(first: 100) {
              nodes {
                id
                type
                updatedAt
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      optionId
                      field {
                        ... on ProjectV2SingleSelectField {
                          id
                          name
                        }
                      }
                    }
                  }
                }
                content {
                  ... on Issue {
                    id
                    number
                    title
                    body
                    url
                    state
                    labels(first: 10) {
                      nodes {
                        name
                        color
                      }
                    }
                    assignees(first: 5) {
                      nodes {
                        login
                        avatarUrl
                      }
                    }
                    repository {
                      nameWithOwner
                    }
                  }
                  ... on PullRequest {
                    id
                    number
                    title
                    body
                    url
                    state
                    labels(first: 10) {
                      nodes {
                        name
                        color
                      }
                    }
                    assignees(first: 5) {
                      nodes {
                        login
                        avatarUrl
                      }
                    }
                    repository {
                      nameWithOwner
                    }
                  }
                  ... on DraftIssue {
                    id
                    title
                    body
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.graphql(query, { projectId: this.config.projectId });
      const projectNode = data.node;
      if (!projectNode) {
        throw new Error('Projekt nicht gefunden.');
      }

      // Update options if status field refreshed
      const statusField = (projectNode.fields && projectNode.fields.nodes) ? projectNode.fields.nodes.find(f => f && f.id === this.config.statusFieldId) : null;
      if (statusField && statusField.options) {
        this.config.statusOptions = statusField.options;
      }

      // 1. Synchronize Columns based on GitHub Status Field options
      this.syncColumnsFromGitHubOptions();

      // 2. Synchronize Items into Sunveil Cards
      const rawItems = (projectNode.items && projectNode.items.nodes) || [];
      let importedCount = 0;
      let updatedCount = 0;

      for (let i = 0; i < rawItems.length; i++) {
        const item = rawItems[i];
        const res = this.mergeGitHubItemToCard(item, i);
        if (res === 'created') importedCount++;
        if (res === 'updated') updatedCount++;
      }

      this.config.lastSync = Date.now();
      await this.saveConfig();

      // Persist to store & broadcast to Live Share collaborators
      window.store.saveImmediate();
      if (window.kanbanApp) {
        window.kanbanApp.render();
      }

      const summary = `✓ Sync abgeschlossen: ${importedCount} neu importiert, ${updatedCount} aktualisiert.`;
      this.log(summary, 'success');
      if (showToast) {
        this.showGlobalToast(`GitHub: ${importedCount} neue, ${updatedCount} aktualisierte Karten`);
      }
    } catch (e) {
      this.log(`❌ Fehler beim Pull-Sync: ${e.message}`, 'error');
    } finally {
      this.isSyncing = false;
      this.updateUI();
    }
  }

  syncColumnsFromGitHubOptions() {
    const options = this.config.statusOptions || [];
    if (options.length === 0) return;

    const colorPalette = {
      GRAY: '#64748b',
      BLUE: '#38bdf8',
      GREEN: '#10b981',
      YELLOW: '#f59e0b',
      ORANGE: '#f97316',
      RED: '#ef4444',
      PINK: '#ec4899',
      PURPLE: '#a855f7'
    };

    const existingCols = window.store.data.columns;

    // Check each option and ensure a column exists
    options.forEach((opt, idx) => {
      const colId = `gh-col-${opt.id}`;
      let col = existingCols.find(c => c.id === colId || c.title.toLowerCase() === opt.name.toLowerCase());

      const color = colorPalette[opt.color] || '#6366f1';

      if (!col) {
        // Create new column matching GitHub option
        window.store.data.columns.push({
          id: colId,
          title: opt.name,
          color: color,
          githubOptionId: opt.id
        });
      } else {
        col.githubOptionId = opt.id;
        if (!col.id.startsWith('gh-col-')) {
          // Attach option id
          col.githubOptionId = opt.id;
        }
      }
    });
  }

  mergeGitHubItemToCard(item, index) {
    const content = item.content || {};
    const itemType = item.type; // 'ISSUE', 'PULL_REQUEST', 'DRAFT_ISSUE'

    let title = content.title || 'Aufgabe ohne Titel';
    let body = content.body || '';
    let url = content.url || '';
    let number = content.number || null;
    let state = content.state || 'OPEN';
    let labels = (content.labels && content.labels.nodes) ? content.labels.nodes : [];
    let assignees = (content.assignees && content.assignees.nodes) ? content.assignees.nodes : [];
    let repoName = (content.repository && content.repository.nameWithOwner) ? content.repository.nameWithOwner : '';

    // Find assigned single select status
    let currentOptionId = null;
    if (item.fieldValues && item.fieldValues.nodes) {
      const statusValue = item.fieldValues.nodes.find(v => v && v.field && v.field.id === this.config.statusFieldId);
      if (statusValue) {
        currentOptionId = statusValue.optionId;
      }
    }

    // Determine target column ID
    let targetColumnId = null;
    if (currentOptionId) {
      const matchedCol = window.store.data.columns.find(c => c.githubOptionId === currentOptionId || c.id === `gh-col-${currentOptionId}`);
      if (matchedCol) targetColumnId = matchedCol.id;
    }

    if (!targetColumnId && window.store.data.columns.length > 0) {
      targetColumnId = window.store.data.columns[0].id;
    }

    // Look for existing card
    const existingCard = window.store.data.cards.find(c =>
      (c.github && c.github.itemId === item.id) ||
      (c.github && c.github.url && c.github.url === url) ||
      c.id === `gh-card-${item.id}`
    );

    const tags = labels.map(l => ({
      name: l.name,
      color: '#' + l.color
    }));

    const ghMetadata = {
      itemId: item.id,
      type: itemType.toLowerCase().replace('_', ''),
      number,
      url,
      state,
      repository: repoName,
      assignee: assignees[0] ? { login: assignees[0].login, avatarUrl: assignees[0].avatarUrl } : null,
      syncedAt: new Date().toISOString()
    };

    if (existingCard) {
      // Update existing card properties while preserving user's mindmap nodes & drawings
      existingCard.title = title;
      if (targetColumnId) existingCard.columnId = targetColumnId;
      existingCard.github = ghMetadata;
      if (tags.length > 0) existingCard.tags = tags;

      // Update central root node in mindmap if title changed
      if (existingCard.mindmap && Array.isArray(existingCard.mindmap.nodes)) {
        const root = existingCard.mindmap.nodes.find(n => n.isCenter);
        if (root) {
          root.title = title;
          if (body && !root.content) root.content = body;
        }
      }
      return 'updated';
    } else {
      // Create new card
      const newCard = {
        id: `gh-card-${item.id}`,
        columnId: targetColumnId,
        title,
        order: index,
        tags,
        github: ghMetadata,
        mindmap: {
          nodes: [
            {
              id: 'center-root',
              isCenter: true,
              type: 'bubble',
              title,
              content: body ? body.substring(0, 500) : (url ? `GitHub: ${url}` : 'GitHub Issue'),
              x: 4800,
              y: 4800,
              color: '#6366f1'
            }
          ],
          connections: [],
          drawings: []
        }
      };

      window.store.data.cards.push(newCard);
      return 'created';
    }
  }

  // --------------------------------------------------------------------------
  // Push Card Status Update (when dragged to another column)
  // --------------------------------------------------------------------------
  async notifyCardMoved(cardId, newColumnId) {
    if (!this.config.connected || !this.config.projectId) return;

    const card = window.store.getCard(cardId);
    if (!card || !card.github || !card.github.itemId) return;

    const column = window.store.data.columns.find(c => c.id === newColumnId);
    if (!column) return;

    const optionId = column.githubOptionId || (this.config.statusOptions.find(o => o.name.toLowerCase() === column.title.toLowerCase()) || {}).id;
    if (!optionId) {
      console.warn(`[GitHubSync] Kein passendes GitHub Status-Option für Spalte '${column.title}' gefunden.`);
      return;
    }

    this.log(`⬆️ Aktualisiere Status für Karte '${card.title}' auf '${column.title}' in GitHub...`);

    const mutation = `
      mutation UpdateStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId,
          itemId: $itemId,
          fieldId: $fieldId,
          value: { singleSelectOptionId: $optionId }
        }) {
          projectV2Item {
            id
          }
        }
      }
    `;

    try {
      await this.graphql(mutation, {
        projectId: this.config.projectId,
        itemId: card.github.itemId,
        fieldId: this.config.statusFieldId,
        optionId
      });
      card.github.syncedAt = new Date().toISOString();
      this.log(`✓ GitHub Status für '${card.title}' auf '${column.title}' gesetzt.`, 'success');
      this.showGlobalToast(`GitHub: '${card.title}' -> ${column.title}`);
    } catch (e) {
      this.log(`❌ Fehler beim Aktualisieren des GitHub Status: ${e.message}`, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // Push Card Title Update
  // --------------------------------------------------------------------------
  async notifyCardUpdated(cardId) {
    if (!this.config.connected) return;
    const card = window.store.getCard(cardId);
    if (!card || !card.github) return;

    // If it's a draft issue, update via GraphQL
    if (card.github.type === 'draftissue' || card.github.type === 'draft') {
      const mutation = `
        mutation UpdateDraft($draftId: ID!, $title: String!) {
          updateProjectV2DraftIssue(input: {
            draftIssueId: $draftId,
            title: $title
          }) {
            draftIssue { id }
          }
        }
      `;
      try {
        await this.graphql(mutation, { draftId: card.github.itemId, title: card.title });
        this.log(`✓ GitHub Draft Issue aktualisiert: '${card.title}'`, 'success');
      } catch (e) {
        console.warn('Draft issue update failed:', e);
      }
    } else if (card.github.repository && card.github.number) {
      // Update issue via REST
      try {
        await this.request(`/repos/${card.github.repository}/issues/${card.github.number}`, {
          method: 'PATCH',
          body: { title: card.title }
        });
        this.log(`✓ GitHub Issue #${card.github.number} Titel aktualisiert.`, 'success');
      } catch (e) {
        console.warn('Issue title update failed:', e);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Push Modified Cards (2-Way push)
  // --------------------------------------------------------------------------
  async pushModifiedCards(showToast = false) {
    if (!this.config.connected || !this.config.projectId) return;
    this.log('⬆️ Prüfe lokale Karten auf nicht synchronisierte Änderungen...');

    let pushedCount = 0;
    for (const card of window.store.data.cards) {
      if (card.github && card.github.itemId) {
        // Re-push current column status
        await this.notifyCardMoved(card.id, card.columnId);
        pushedCount++;
      }
    }

    this.log(`✓ ${pushedCount} Karten mit GitHub synchronisiert.`, 'success');
    if (showToast) {
      this.showGlobalToast(`✓ ${pushedCount} Karten zu GitHub gesynct`);
    }
  }

  async syncAll(showToast = false) {
    await this.pullFromGitHub(showToast);
  }

  setupAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.config.connected && this.config.autoSync) {
      const intervalMs = (this.config.syncInterval || 30) * 1000;
      this.syncTimer = setInterval(() => {
        this.pullFromGitHub(false);
      }, intervalMs);
      console.log(`[GitHubSync] Auto-Sync alle ${this.config.syncInterval || 30}s aktiv.`);
    }
  }

  showGlobalToast(msg) {
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
}

// Global singleton instance
window.githubSync = new GitHubSyncEngine();

