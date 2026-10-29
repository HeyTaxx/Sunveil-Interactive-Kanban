/**
 * Sunveil Tabs Manager - Edge Browser Style Tabs
 */

class TabsManager {
  constructor() {
    this.tabsBar = document.getElementById('tabs-bar');
    this.openTabs = new Map(); // cardId -> { tabEl, cardId, title }
    this.activeTabId = 'kanban-main';
    this.init();
  }

  init() {
    const mainTab = document.getElementById('tab-kanban-main');
    if (mainTab) {
      mainTab.addEventListener('click', () => {
        this.switchToTab('kanban-main');
      });
    }
  }

  openCardTab(cardId) {
    const card = window.store.getCard(cardId);
    if (!card) return;

    if (this.openTabs.has(cardId)) {
      // Tab is already open, just switch to it
      this.switchToTab(cardId);
      return;
    }

    // Create new Edge-style Tab
    const tabEl = document.createElement('div');
    tabEl.className = 'tab-item';
    tabEl.dataset.tabId = cardId;
    tabEl.id = `tab-${cardId}`;

    const closeTitle = window.i18n ? window.i18n.t('tab_close') : 'Tab schließen';
    tabEl.innerHTML = `
      <div class="tab-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 8v8"/>
          <path d="M8 12h8"/>
        </svg>
      </div>
      <span class="tab-title">${this.escapeHTML(card.title)}</span>
      <span class="tab-close" title="${closeTitle}">&times;</span>
    `;

    // Tab click to activate
    tabEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close')) {
        e.stopPropagation();
        this.closeTab(cardId);
      } else {
        this.switchToTab(cardId);
      }
    });

    this.tabsBar.appendChild(tabEl);
    this.openTabs.set(cardId, { tabEl, cardId, title: card.title });

    this.switchToTab(cardId);
  }

  switchToTab(tabId) {
    this.activeTabId = tabId;

    // Update Tab UI active states
    const allTabEls = this.tabsBar.querySelectorAll('.tab-item');
    allTabEls.forEach(tab => {
      if (tab.dataset.tabId === tabId) {
        tab.classList.add('active');
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } else {
        tab.classList.remove('active');
      }
    });

    // Update Viewport Panels
    const kanbanView = document.getElementById('kanban-view');
    const mindmapView = document.getElementById('mindmap-view');

    if (tabId === 'kanban-main') {
      kanbanView.classList.add('active');
      mindmapView.classList.remove('active');
      // Re-render Kanban in case of changes
      if (window.kanbanApp) {
        window.kanbanApp.render();
      }
    } else {
      kanbanView.classList.remove('active');
      mindmapView.classList.add('active');
      // Load card into Mindmap canvas
      if (window.mindmapApp) {
        window.mindmapApp.loadCard(tabId);
      }
    }

    if (window.liveShare) {
      window.liveShare.notifyTabChange(tabId);
    }
  }

  closeTab(cardId) {
    const tabData = this.openTabs.get(cardId);
    if (!tabData) return;

    tabData.tabEl.remove();
    this.openTabs.delete(cardId);

    // If closing active tab, switch back to kanban or previous tab
    if (this.activeTabId === cardId) {
      this.switchToTab('kanban-main');
    }
  }

  updateTabTitle(cardId, newTitle) {
    const tabData = this.openTabs.get(cardId);
    if (tabData) {
      tabData.title = newTitle;
      const titleEl = tabData.tabEl.querySelector('.tab-title');
      if (titleEl) {
        titleEl.textContent = newTitle;
      }
    }
  }

  escapeHTML(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

window.tabsManager = new TabsManager();
