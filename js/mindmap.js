/**
 * Sunveil Mindmap - Infinite Canvas, Interactive Nodes, SVG Connectors & Image/Link Bubbles
 */

class MindmapEngine {
  constructor() {
    this.viewport = document.getElementById('mindmap-viewport');
    this.world = document.getElementById('mindmap-world');
    this.nodesContainer = document.getElementById('mindmap-nodes-container');
    this.svgContainer = document.getElementById('mindmap-connections-svg');
    this.titleInput = document.getElementById('mindmap-active-title');
    this.parentColBadge = document.getElementById('mindmap-parent-col');
    this.zoomLevelText = document.getElementById('zoom-level-text');

    // Pan & Zoom state
    this.scale = 1.0;
    this.panX = -4500;
    this.panY = -4500;
    this.isPanning = false;
    this.startPanX = 0;
    this.startPanY = 0;

    // Node interaction state
    this.currentCardId = null;
    this.nodes = [];
    this.connections = [];
    this.draggedNode = null;
    this.dragOffset = { x: 0, y: 0 };

    // Connecting line state
    this.isConnecting = false;
    this.connectingFromNodeId = null;

    this.activeTool = 'select';
    this.initCanvasEvents();
    this.initToolbarEvents();
    this.initModalEvents();
  }

  loadCard(cardId) {
    this.currentCardId = cardId;
    const card = window.store.getCard(cardId);
    if (!card) return;

    const column = window.store.data.columns.find(c => c.id === card.columnId);
    this.parentColBadge.textContent = column ? column.title : 'Kanban';
    this.titleInput.value = card.title;

    // Initialize mindmap data if missing
    if (!card.mindmap) {
      card.mindmap = {
        nodes: [
          {
            id: 'center-root',
            isCenter: true,
            type: 'bubble',
            title: card.title,
            content: 'Zentrale Mindmap für diese Aufgabe.',
            x: 4800,
            y: 4800,
            color: '#6366f1'
          }
        ],
        connections: [],
        drawings: []
      };
      window.store.save();
    }

    this.nodes = card.mindmap.nodes || [];
    this.connections = card.mindmap.connections || [];

    // Ensure center root node exists and has card title
    let centerNode = this.nodes.find(n => n.id === 'center-root' || n.isCenter);
    if (!centerNode) {
      centerNode = {
        id: 'center-root',
        isCenter: true,
        type: 'bubble',
        title: card.title,
        content: '',
        x: 4800,
        y: 4800,
        color: '#6366f1'
      };
      this.nodes.unshift(centerNode);
    } else {
      centerNode.title = card.title;
    }

    // Set Whiteboard drawings for this card
    window.whiteboard.setCard(cardId, card.mindmap.drawings || []);

    // Render nodes & SVG lines
    this.renderNodes();
    this.renderConnections();

    // Center canvas view around the center node
    this.centerViewOn(centerNode.x, centerNode.y);
  }

  centerViewOn(worldX, worldY) {
    const rect = this.viewport.getBoundingClientRect();
    this.scale = 1.0;
    this.panX = -(worldX * this.scale) + (rect.width / 2);
    this.panY = -(worldY * this.scale) + (rect.height / 2);
    this.updateTransform();
  }

  updateTransform() {
    this.world.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    this.zoomLevelText.textContent = `${Math.round(this.scale * 100)}%`;
  }

  screenToWorld(clientX, clientY) {
    const rect = this.viewport.getBoundingClientRect();
    const vx = clientX - rect.left;
    const vy = clientY - rect.top;
    const wx = (vx - this.panX) / this.scale;
    const wy = (vy - this.panY) / this.scale;
    return { x: wx, y: wy };
  }

  worldToScreen(worldX, worldY) {
    const rect = this.viewport.getBoundingClientRect();
    return {
      x: (worldX * this.scale) + this.panX + rect.left,
      y: (worldY * this.scale) + this.panY + rect.top
    };
  }

  initCanvasEvents() {
    // Canvas Pan via middle click, right click, or when Pan tool active
    this.viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.mind-node') || e.target.closest('.floating-toolbar')) return;

      const isRightClick = e.button === 2;
      const isMiddleClick = e.button === 1;
      const isPanTool = this.activeTool === 'pan' || e.spaceKey;

      if (isRightClick || isMiddleClick || (isPanTool && e.button === 0)) {
        this.isPanning = true;
        this.startPanX = e.clientX - this.panX;
        this.startPanY = e.clientY - this.panY;
        this.viewport.classList.add('panning');
        e.preventDefault();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        this.panX = e.clientX - this.startPanX;
        this.panY = e.clientY - this.startPanY;
        this.updateTransform();
      }

      if (this.draggedNode) {
        const pt = this.screenToWorld(e.clientX, e.clientY);
        this.draggedNode.x = pt.x - this.dragOffset.x;
        this.draggedNode.y = pt.y - this.dragOffset.y;
        this.updateNodeElementPosition(this.draggedNode);
        this.renderConnections();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.viewport.classList.remove('panning');
      }

      if (this.draggedNode) {
        this.draggedNode = null;
        this.saveMindmap();
      }
    });

    // Disable default context menu on viewport for smooth navigation
    this.viewport.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Zoom via Mouse Wheel
    this.viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(Math.max(this.scale * zoomFactor, 0.25), 3.0);

      const rect = this.viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.panX = mouseX - (mouseX - this.panX) * (newScale / this.scale);
      this.panY = mouseY - (mouseY - this.panY) * (newScale / this.scale);
      this.scale = newScale;

      this.updateTransform();
    }, { passive: false });

    // Double-click on empty canvas to add a new Bubble!
    this.viewport.addEventListener('dblclick', (e) => {
      if (e.target.closest('.mind-node') || e.target.closest('.floating-toolbar')) return;
      const pt = this.screenToWorld(e.clientX, e.clientY);
      this.addBubbleAt(pt.x - 100, pt.y - 40);
    });

    // Sync card title on top breadcrumb input
    this.titleInput.addEventListener('input', () => {
      const newTitle = this.titleInput.value.trim() || 'Unbenannt';
      window.store.updateCardTitle(this.currentCardId, newTitle);
      window.tabsManager.updateTabTitle(this.currentCardId, newTitle);
      const centerNode = this.nodes.find(n => n.id === 'center-root' || n.isCenter);
      if (centerNode) {
        centerNode.title = newTitle;
        const centerEl = document.getElementById(`node-elem-${centerNode.id}`);
        if (centerEl) {
          const t = centerEl.querySelector('.node-title-editable');
          if (t) t.textContent = newTitle;
        }
      }
    });
  }

  initToolbarEvents() {
    const toolbar = document.getElementById('mindmap-toolbar');

    // Tool switcher
    toolbar.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        this.setActiveTool(tool);
      });
    });

    // Color Swatches
    toolbar.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        toolbar.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const color = dot.dataset.color;
        window.whiteboard.setColor(color);
      });
    });

    // Stroke Size buttons
    toolbar.querySelectorAll('.size-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        toolbar.querySelectorAll('.size-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const size = dot.dataset.size;
        window.whiteboard.setStrokeSize(size);
      });
    });

    // Drawing Undo & Clear
    document.getElementById('btn-draw-undo').addEventListener('click', () => {
      window.whiteboard.undo();
      this.showToast(window.i18n ? window.i18n.t('toast_changes_saved') : 'Zeichnen rückgängig gemacht');
    });

    document.getElementById('btn-draw-clear').addEventListener('click', () => {
      const clearConfirm = window.i18n ? window.i18n.t('tool_clear') : 'Möchtest du wirklich alle Zeichnungen dieser Karte leeren?';
      if (confirm(clearConfirm)) {
        window.whiteboard.clear();
        this.showToast(window.i18n ? window.i18n.t('toast_changes_saved') : 'Zeichnungen gelöscht');
      }
    });

    // Zoom Controls in Subbar
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      this.scale = Math.min(this.scale * 1.2, 3.0);
      this.updateTransform();
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      this.scale = Math.max(this.scale / 1.2, 0.25);
      this.updateTransform();
    });
    document.getElementById('btn-zoom-reset').addEventListener('click', () => {
      const center = this.nodes.find(n => n.id === 'center-root' || n.isCenter);
      if (center) {
        this.centerViewOn(center.x, center.y);
      } else {
        this.scale = 1.0;
        this.updateTransform();
      }
    });

    // Mindmap PNG Export
    document.getElementById('btn-export-mindmap-img').addEventListener('click', () => {
      this.exportMindmapAsImage();
    });

    // Back to Kanban button
    document.getElementById('btn-back-to-kanban').addEventListener('click', () => {
      window.tabsManager.switchToTab('kanban-main');
    });
  }

  initModalEvents() {
    // Image Modal
    const imgModal = document.getElementById('modal-image-prompt');
    const closeImg = () => { imgModal.style.display = 'none'; };
    document.getElementById('btn-close-image-modal').onclick = closeImg;
    document.getElementById('btn-cancel-image-modal').onclick = closeImg;

    document.getElementById('btn-confirm-image-modal').onclick = () => {
      const url = document.getElementById('img-url-input').value.trim();
      if (url) {
        this.createImageNode(url);
        closeImg();
        document.getElementById('img-url-input').value = '';
      }
    };

    const localInput = document.getElementById('local-img-input');
    localInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.createImageNode(event.target.result);
          closeImg();
          localInput.value = '';
        };
        reader.readAsDataURL(file);
      }
    });

    // Link Modal
    const linkModal = document.getElementById('modal-link-prompt');
    const closeLink = () => { linkModal.style.display = 'none'; };
    document.getElementById('btn-close-link-modal').onclick = closeLink;
    document.getElementById('btn-cancel-link-modal').onclick = closeLink;

    document.getElementById('btn-confirm-link-modal').onclick = () => {
      const title = document.getElementById('link-title-input').value.trim() || 'Web Link';
      let url = document.getElementById('link-url-input').value.trim();
      if (url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        this.createLinkNode(title, url);
        closeLink();
        document.getElementById('link-title-input').value = '';
        document.getElementById('link-url-input').value = '';
      }
    };
  }

  setActiveTool(tool) {
    this.activeTool = tool;
    const toolbar = document.getElementById('mindmap-toolbar');
    toolbar.querySelectorAll('.tool-btn').forEach(btn => {
      if (btn.dataset.tool === tool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update canvas viewport classes for cursor feedback
    this.viewport.classList.remove('panning', 'drawing', 'erasing');

    if (tool === 'pan') {
      this.viewport.classList.add('panning');
    } else if (['draw-pen', 'draw-arrow', 'draw-highlighter'].includes(tool)) {
      this.viewport.classList.add('drawing');
    } else if (tool === 'eraser') {
      this.viewport.classList.add('erasing');
    }

    // Pass tool to Whiteboard engine
    window.whiteboard.setTool(tool);

    // Direct actions on button trigger
    const center = this.screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    if (tool === 'add-bubble') {
      this.addBubbleAt(center.x, center.y);
      this.setActiveTool('select');
    } else if (tool === 'add-text') {
      this.addTextNodeAt(center.x, center.y);
      this.setActiveTool('select');
    } else if (tool === 'add-image') {
      document.getElementById('modal-image-prompt').style.display = 'flex';
      this.setActiveTool('select');
    } else if (tool === 'add-link') {
      document.getElementById('modal-link-prompt').style.display = 'flex';
      this.setActiveTool('select');
    }
  }

  // --------------------------------------------------------------------------
  // Node Creation Helpers
  // --------------------------------------------------------------------------
  addBubbleAt(x, y) {
    const defaultTitle = window.i18n ? window.i18n.t('default_new_bubble') : 'Neuer Gedanke';
    const newNode = {
      id: 'node-' + Date.now(),
      type: 'bubble',
      title: defaultTitle,
      content: '',
      x: x,
      y: y,
      color: '#38bdf8'
    };
    this.nodes.push(newNode);

    // Automatically connect to center root node
    const center = this.nodes.find(n => n.id === 'center-root' || n.isCenter);
    if (center) {
      this.connections.push({
        id: 'conn-' + Date.now(),
        fromId: center.id,
        toId: newNode.id,
        color: newNode.color
      });
    }

    this.renderNodes();
    this.renderConnections();
    this.saveMindmap();
    this.showToast(window.i18n ? window.i18n.t('toast_changes_saved') : 'Knoten hinzugefügt');
  }

  addTextNodeAt(x, y) {
    const defaultText = window.i18n ? window.i18n.t('default_new_text') : 'Notiz';
    const newNode = {
      id: 'node-' + Date.now(),
      type: 'text',
      title: defaultText,
      content: '',
      x: x,
      y: y,
      color: '#ffffff'
    };
    this.nodes.push(newNode);
    this.renderNodes();
    this.saveMindmap();
  }

  createImageNode(imgSrc) {
    const center = this.screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const newNode = {
      id: 'node-img-' + Date.now(),
      type: 'image',
      title: 'Bild Notiz',
      imgSrc: imgSrc,
      x: center.x - 140,
      y: center.y - 120,
      color: '#f43f5e'
    };
    this.nodes.push(newNode);

    // Auto connect to center root
    const root = this.nodes.find(n => n.id === 'center-root' || n.isCenter);
    if (root) {
      this.connections.push({
        id: 'conn-' + Date.now(),
        fromId: root.id,
        toId: newNode.id,
        color: '#f43f5e'
      });
    }

    this.renderNodes();
    this.renderConnections();
    this.saveMindmap();
    this.showToast(window.i18n ? window.i18n.t('toast_changes_saved') : 'Bild erfolgreich eingefügt');
  }

  createLinkNode(title, url) {
    const center = this.screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const newNode = {
      id: 'node-link-' + Date.now(),
      type: 'link',
      title: title,
      url: url,
      content: '',
      x: center.x - 120,
      y: center.y - 40,
      color: '#f59e0b'
    };
    this.nodes.push(newNode);

    const root = this.nodes.find(n => n.id === 'center-root' || n.isCenter);
    if (root) {
      this.connections.push({
        id: 'conn-' + Date.now(),
        fromId: root.id,
        toId: newNode.id,
        color: '#f59e0b'
      });
    }

    this.renderNodes();
    this.renderConnections();
    this.saveMindmap();
    this.showToast(window.i18n ? window.i18n.t('toast_changes_saved') : 'Link hinzugefügt');
  }

  deleteNode(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node && (node.isCenter || node.id === 'center-root')) {
      alert(window.i18n ? window.i18n.t('cannot_delete_root') : 'Der Hauptknoten dieser Karte kann nicht gelöscht werden.');
      return;
    }

    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.connections = this.connections.filter(c => c.fromId !== nodeId && c.toId !== nodeId);

    this.renderNodes();
    this.renderConnections();
    this.saveMindmap();
    this.showToast(window.i18n ? window.i18n.t('toast_node_removed') : 'Knoten entfernt');
  }

  // --------------------------------------------------------------------------
  // Rendering & DOM Management
  // --------------------------------------------------------------------------
  renderNodes() {
    this.nodesContainer.innerHTML = '';
    for (const node of this.nodes) {
      const nodeEl = this.createNodeElement(node);
      this.nodesContainer.appendChild(nodeEl);
      this.updateNodeElementPosition(node);
    }
  }

  createNodeElement(node) {
    const el = document.createElement('div');
    el.className = `mind-node ${node.isCenter ? 'center-root-node' : ''} ${node.type}-node`;
    el.id = `node-elem-${node.id}`;
    el.dataset.nodeId = node.id;

    if (node.color && !node.isCenter) {
      el.style.borderLeft = `4px solid ${node.color}`;
    }

    // Inner Content based on node type
    let bodyHtml = '';
    const tDel = window.i18n ? window.i18n.t('node_delete') : 'Löschen';
    const tTheme = window.i18n ? window.i18n.t('theme_badge') : 'THEMA';
    const tHandle = window.i18n ? window.i18n.t('node_connector_handle') : 'Ziehen, um Verbindungspfeil zu erstellen';

    if (node.type === 'image') {
      bodyHtml = `
        <div class="node-header">
          <span class="node-title-editable" contenteditable="true" spellcheck="false">${this.escape(node.title)}</span>
          <div class="node-actions">
            <button class="node-btn-sm btn-del" title="${tDel}">&times;</button>
          </div>
        </div>
        <div class="node-img-wrapper">
          <img src="${node.imgSrc}" alt="${this.escape(node.title)}">
        </div>
      `;
    } else if (node.type === 'link') {
      bodyHtml = `
        <div class="node-header">
          <span class="node-title-editable" contenteditable="true" spellcheck="false">${this.escape(node.title)}</span>
          <div class="node-actions">
            <button class="node-btn-sm btn-del" title="${tDel}">&times;</button>
          </div>
        </div>
        <a href="${node.url}" target="_blank" rel="noopener noreferrer" class="link-preview-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span class="link-url-text">${this.escape(node.url)}</span>
        </a>
      `;
    } else {
      // Standard Bubble / Note
      bodyHtml = `
        <div class="node-header">
          ${node.isCenter ? `<span class="center-badge">${tTheme}</span>` : ''}
          <span class="node-title-editable" contenteditable="true" spellcheck="false">${this.escape(node.title)}</span>
          ${!node.isCenter ? `
            <div class="node-actions">
              <button class="node-btn-sm btn-del" title="${tDel}">&times;</button>
            </div>
          ` : ''}
        </div>
        <div class="node-content-editable" contenteditable="true" spellcheck="false">${this.escape(node.content || '')}</div>
      `;
    }

    el.innerHTML = bodyHtml;

    // Connector handles for linking bubbles
    const handleRight = document.createElement('div');
    handleRight.className = 'node-connector-handle right';
    handleRight.title = tHandle;
    el.appendChild(handleRight);

    // Event Listeners for dragging node
    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.node-connector-handle')) {
        this.startConnecting(node.id, e);
        return;
      }
      if (e.target.isContentEditable || e.target.closest('.btn-del') || e.target.closest('a')) {
        return; // Don't drag when interacting with text or buttons
      }
      if (e.button === 0) {
        this.draggedNode = node;
        const pt = this.screenToWorld(e.clientX, e.clientY);
        this.dragOffset = {
          x: pt.x - node.x,
          y: pt.y - node.y
        };
        e.stopPropagation();
      }
    });

    // Content Editable changes
    const titleEl = el.querySelector('.node-title-editable');
    if (titleEl) {
      titleEl.addEventListener('input', () => {
        node.title = titleEl.textContent.trim();
        if (node.isCenter) {
          this.titleInput.value = node.title;
          window.store.updateCardTitle(this.currentCardId, node.title);
          window.tabsManager.updateTabTitle(this.currentCardId, node.title);
        }
        this.saveMindmap();
      });
      titleEl.addEventListener('blur', () => {
        this.saveMindmap();
      });
    }

    const contentEl = el.querySelector('.node-content-editable');
    if (contentEl) {
      contentEl.addEventListener('input', () => {
        node.content = contentEl.textContent;
        this.saveMindmap();
      });
      contentEl.addEventListener('blur', () => {
        this.saveMindmap();
      });
    }

    // Delete button
    const delBtn = el.querySelector('.btn-del');
    if (delBtn) {
      delBtn.onclick = (e) => {
        e.stopPropagation();
        this.deleteNode(node.id);
      };
    }

    return el;
  }

  updateNodeElementPosition(node) {
    const el = document.getElementById(`node-elem-${node.id}`);
    if (el) {
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
    }
  }

  getNodeBorderIntersection(rect, targetCenter) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const dx = targetCenter.x - cx;
    const dy = targetCenter.y - cy;

    if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
      return { x: cx, y: cy, side: 'center' };
    }

    const hw = rect.w / 2;
    const hh = rect.h / 2;

    // Check which edge the ray from (cx, cy) to targetCenter intersects
    if (Math.abs(dy * hw) <= Math.abs(dx * hh)) {
      // Intersects Left or Right vertical edge
      if (dx > 0) {
        return {
          x: cx + hw,
          y: cy + dy * (hw / Math.abs(dx)),
          side: 'right'
        };
      } else {
        return {
          x: cx - hw,
          y: cy + dy * (hw / Math.abs(dx)),
          side: 'left'
        };
      }
    } else {
      // Intersects Top or Bottom horizontal edge
      if (dy > 0) {
        return {
          x: cx + dx * (hh / Math.abs(dy)),
          y: cy + hh,
          side: 'bottom'
        };
      } else {
        return {
          x: cx + dx * (hh / Math.abs(dy)),
          y: cy - hh,
          side: 'top'
        };
      }
    }
  }

  // --------------------------------------------------------------------------
  // SVG Connection Lines
  // --------------------------------------------------------------------------
  renderConnections() {
    this.svgContainer.innerHTML = '';

    for (const conn of this.connections) {
      const fromNode = this.nodes.find(n => n.id === conn.fromId);
      const toNode = this.nodes.find(n => n.id === conn.toId);
      if (!fromNode || !toNode) continue;

      const fromEl = document.getElementById(`node-elem-${fromNode.id}`);
      const toEl = document.getElementById(`node-elem-${toNode.id}`);
      if (!fromEl || !toEl) continue;

      const fromW = fromEl.offsetWidth || 180;
      const fromH = fromEl.offsetHeight || 60;
      const toW = toEl.offsetWidth || 180;
      const toH = toEl.offsetHeight || 60;

      const fromRect = { x: fromNode.x, y: fromNode.y, w: fromW, h: fromH };
      const toRect = { x: toNode.x, y: toNode.y, w: toW, h: toH };

      const fromCenter = { x: fromRect.x + fromW / 2, y: fromRect.y + fromH / 2 };
      const toCenter = { x: toRect.x + toW / 2, y: toRect.y + toH / 2 };

      // Calculate intersection points precisely on the outer boundary of each box
      const p1 = this.getNodeBorderIntersection(fromRect, toCenter);
      const p2 = this.getNodeBorderIntersection(toRect, fromCenter);

      // Smooth curvature depending on which side the line leaves and enters
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const curvature = Math.min(Math.max(dist * 0.45, 35), 180);

      let cp1x = p1.x;
      let cp1y = p1.y;
      let cp2x = p2.x;
      let cp2y = p2.y;

      if (p1.side === 'right') cp1x += curvature;
      else if (p1.side === 'left') cp1x -= curvature;
      else if (p1.side === 'bottom') cp1y += curvature;
      else if (p1.side === 'top') cp1y -= curvature;

      if (p2.side === 'right') cp2x += curvature;
      else if (p2.side === 'left') cp2x -= curvature;
      else if (p2.side === 'bottom') cp2y += curvature;
      else if (p2.side === 'top') cp2y -= curvature;

      const pathData = `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', conn.color || 'rgba(99, 102, 241, 0.45)');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-linecap', 'round');
      path.style.transition = 'stroke 0.2s';

      this.svgContainer.appendChild(path);
    }
  }

  startConnecting(fromNodeId, e) {
    this.isConnecting = true;
    this.connectingFromNodeId = fromNodeId;
    e.stopPropagation();

    const onMove = (moveEvt) => {
      // Can show a temporary preview connector if desired
    };

    const onUp = (upEvt) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      this.isConnecting = false;

      const targetNodeEl = upEvt.target.closest('.mind-node');
      if (targetNodeEl) {
        const toNodeId = targetNodeEl.dataset.nodeId;
        if (toNodeId && toNodeId !== this.connectingFromNodeId) {
          // Check if already connected
          const exists = this.connections.some(c => 
            (c.fromId === this.connectingFromNodeId && c.toId === toNodeId) ||
            (c.fromId === toNodeId && c.toId === this.connectingFromNodeId)
          );
          if (!exists) {
            this.connections.push({
              id: 'conn-' + Date.now(),
              fromId: this.connectingFromNodeId,
              toId: toNodeId,
              color: '#6366f1'
            });
            this.renderConnections();
            this.saveMindmap();
            this.showToast(window.i18n ? window.i18n.t('toast_connection_created') : 'Verbindung erstellt');
          }
        }
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // --------------------------------------------------------------------------
  // Export & Utilities
  // --------------------------------------------------------------------------
  saveMindmap() {
    if (!this.currentCardId) return;
    const card = window.store.getCard(this.currentCardId);
    if (card) {
      card.mindmap.nodes = this.nodes;
      card.mindmap.connections = this.connections;
      window.store.save();
    }
  }

  exportMindmapAsImage() {
    // Renders drawing canvas + preview
    const canvas = window.whiteboard.canvas;
    const link = document.createElement('a');
    link.download = `Mindmap_${this.titleInput.value || 'Karte'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.showToast(window.i18n ? window.i18n.t('toast_export_downloaded') : 'Zeichnungs-Export heruntergeladen');
  }

  showToast(msg) {
    const toast = document.getElementById('toast-notification');
    const msgEl = document.getElementById('toast-message');
    if (toast && msgEl) {
      msgEl.textContent = msg;
      toast.classList.add('visible');
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.classList.remove('visible');
      }, 2400);
    }
  }

  escape(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

window.mindmapApp = new MindmapEngine();
