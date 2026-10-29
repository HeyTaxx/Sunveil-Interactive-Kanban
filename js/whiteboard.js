/**
 * Sunveil Whiteboard - Freehand Drawing, Arrows, Handwritten Text & Canvas Overlay
 */

class WhiteboardEngine {
  constructor() {
    this.canvas = document.getElementById('whiteboard-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Canvas dimensions (world coordinates)
    this.canvas.width = 10000;
    this.canvas.height = 10000;

    this.currentTool = 'select'; // 'select' | 'pan' | 'draw-pen' | 'draw-arrow' | 'draw-highlighter' | 'eraser'
    this.strokeColor = '#6366f1';
    this.strokeSize = 4;

    this.isDrawing = false;
    this.currentStroke = null;
    this.strokes = []; // Array of drawn objects

    this.undoStack = [];
    this.redoStack = [];

    this.cardId = null;

    this.initEvents();
  }

  setCard(cardId, initialDrawings = []) {
    this.cardId = cardId;
    this.strokes = Array.isArray(initialDrawings) ? [...initialDrawings] : [];
    this.undoStack = [];
    this.redoStack = [];
    this.render();
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.strokeColor = color;
  }

  setStrokeSize(size) {
    this.strokeSize = parseInt(size, 10) || 4;
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Touch support for tablets / touch screens
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    window.addEventListener('touchend', (e) => this.onTouchEnd(e));
  }

  getWorldCoords(e) {
    if (!window.mindmapApp) return { x: 0, y: 0 };
    return window.mindmapApp.screenToWorld(e.clientX, e.clientY);
  }

  isDrawMode() {
    return ['draw-pen', 'draw-arrow', 'draw-highlighter', 'eraser'].includes(this.currentTool);
  }

  onMouseDown(e) {
    if (e.button !== 0) return; // Only left-click
    if (!this.isDrawMode()) return;

    this.isDrawing = true;
    const pt = this.getWorldCoords(e);

    if (this.currentTool === 'eraser') {
      this.eraseAt(pt.x, pt.y);
      return;
    }

    if (this.currentTool === 'draw-arrow') {
      this.currentStroke = {
        tool: 'arrow',
        color: this.strokeColor,
        size: this.strokeSize,
        startX: pt.x,
        startY: pt.y,
        endX: pt.x,
        endY: pt.y
      };
    } else {
      // Pen or Highlighter
      this.currentStroke = {
        tool: this.currentTool === 'draw-highlighter' ? 'highlighter' : 'pen',
        color: this.strokeColor,
        size: this.currentTool === 'draw-highlighter' ? this.strokeSize * 3 : this.strokeSize,
        points: [pt]
      };
    }
  }

  onMouseMove(e) {
    if (!this.isDrawing) return;
    const pt = this.getWorldCoords(e);

    if (this.currentTool === 'eraser') {
      this.eraseAt(pt.x, pt.y);
      return;
    }

    if (!this.currentStroke) return;

    if (this.currentStroke.tool === 'arrow') {
      this.currentStroke.endX = pt.x;
      this.currentStroke.endY = pt.y;
    } else {
      this.currentStroke.points.push(pt);
    }

    this.render();
    this.drawStroke(this.currentStroke, true);
  }

  onMouseUp(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.currentStroke) {
      const finishedStroke = this.currentStroke;
      this.strokes.push(finishedStroke);
      this.currentStroke = null;
      this.saveToCard();
      this.render();
      if (window.liveShare && this.cardId) {
        window.liveShare.broadcastStroke(this.cardId, finishedStroke);
      }
    }
  }

  onTouchStart(e) {
    if (!this.isDrawMode() || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.onMouseDown({ button: 0, clientX: touch.clientX, clientY: touch.clientY });
  }

  onTouchMove(e) {
    if (!this.isDrawing || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }

  onTouchEnd(e) {
    if (this.isDrawing) {
      this.onMouseUp(e);
    }
  }

  eraseAt(x, y, radius = 24) {
    const beforeCount = this.strokes.length;
    this.strokes = this.strokes.filter(s => {
      if (s.tool === 'arrow') {
        return !this.isPointNearLine(x, y, s.startX, s.startY, s.endX, s.endY, radius);
      }
      if (s.points) {
        return !s.points.some(p => Math.hypot(p.x - x, p.y - y) <= radius);
      }
      return true;
    });

    if (this.strokes.length !== beforeCount) {
      this.saveToCard();
      this.render();
    }
  }

  isPointNearLine(px, py, x1, y1, x2, y2, threshold) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1) <= threshold;
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(px - projX, py - projY) <= threshold;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const stroke of this.strokes) {
      this.drawStroke(stroke);
    }
  }

  drawStroke(stroke, isPreview = false) {
    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (stroke.tool === 'highlighter') {
      this.ctx.globalAlpha = 0.35;
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.size;
    } else if (stroke.tool === 'arrow') {
      this.ctx.strokeStyle = stroke.color;
      this.ctx.fillStyle = stroke.color;
      this.ctx.lineWidth = stroke.size;
      this.drawArrow(stroke.startX, stroke.startY, stroke.endX, stroke.endY, stroke.size);
      this.ctx.restore();
      return;
    } else {
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.size;
    }

    if (stroke.points && stroke.points.length > 0) {
      this.ctx.beginPath();
      if (stroke.points.length === 1) {
        this.ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = stroke.color;
        this.ctx.fill();
      } else {
        this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
          this.ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }
        const last = stroke.points[stroke.points.length - 1];
        this.ctx.lineTo(last.x, last.y);
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  drawArrow(fromX, fromY, toX, toY, width) {
    const headlen = Math.max(16, width * 4);
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Line
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();

    // Arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fill();
  }

  undo() {
    if (this.undoStack.length > 0) {
      this.redoStack.push([...this.strokes]);
      this.strokes = this.undoStack.pop();
      this.saveToCard();
      this.render();
    }
  }

  clear() {
    if (this.strokes.length === 0) return;
    this.undoStack.push([...this.strokes]);
    this.strokes = [];
    this.saveToCard();
    this.render();
  }

  saveToCard() {
    if (!this.cardId || !window.store) return;
    const card = window.store.getCard(this.cardId);
    if (card && card.mindmap) {
      card.mindmap.drawings = this.strokes;
      window.store.save();
    }
  }
}

window.whiteboard = new WhiteboardEngine();
