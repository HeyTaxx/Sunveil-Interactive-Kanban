# 🚀 Sunveil Interactive Kanban & Visual Mindmap

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Standard%20Lib)-orange.svg)](#)
[![Security Hardened](https://img.shields.io/badge/Security-Loopback%20Isolated-success.svg)](#security--remote-access-protection)
[![MCP Ready](https://img.shields.io/badge/MCP-Claude%20%7C%20Antigravity%20%7C%20Cursor-purple.svg)](#model-context-protocol-mcp--ai-integration)

A privacy-first, lightning-fast, zero-dependency desktop productivity workstation. Seamlessly fuses **Trello-style Kanban boards**, **infinite visual mindmaps**, a **freehand whiteboard canvas**, and an official **Model Context Protocol (MCP) AI server**.

---

## ✨ Features

### 1. 📋 Interactive Kanban Board
- **Fluid Drag & Drop:** Move cards between phases or reorder cards and columns freely.
- **Dynamic Indicators:** Every card shows live counters for mindmap bubbles, linked resources, and freehand sketches.
- **Instant Search:** Filter cards and tags across all phases in real time.
- **Direct Inline Editing:** Rename columns and card titles with auto-saving.

### 2. 🧠 Visual Mindmap Canvas (Per Card)
- **Deep-Dive on Double-Click:** Double-clicking any card opens its private infinite visual mindmap canvas.
- **Center Theme Node:** Automatically centered on the task title.
- **Thought Bubbles & Links:** Create thought clusters, connect nodes with dynamic curved arrows, attach external URLs, and drop images.
- **Boundary-Anchored Connectors:** Connection lines anchor precisely to outer bubble perimeters without clipping through text boxes.

### 3. 🎨 Freehand Whiteboard & Drawing Engine
- **Pen & Arrow Tools:** Handwrite notes, sketch diagrams, and draw directional flowcharts.
- **Highlighter & Eraser:** Semi-transparent highlighter marker and stroke-based eraser.
- **Custom Palettes:** Carefully chosen modern dark-mode accent colors and variable stroke widths.
- **Export to Image:** Export your mindmaps and whiteboard sketches directly as high-resolution PNGs.

### 4. 🌍 Multi-Language Support (i18n)
- Switch instantly via the header dropdown between:
  - 🇩🇪 **Deutsch** (German)
  - 🇬🇧 **English** (English)
  - 🇪🇸 **Español** (Spanish)
  - 🇫🇷 **Français** (French)
- Automatically saves and restores your preferred language across sessions.

### 5. 📑 Edge-Style Tab Navigation
- Native tabbed experience at the top of the window.
- Switch seamlessly between the master Kanban board and multiple open card mindmaps without losing state.

---

## 🔒 Security & Remote Access Protection

Sunveil is designed with a defense-in-depth security model to ensure your local workstation and sensitive boards can **never be accessed or hijacked over the network or through internet ports**:

1. **Strict Loopback Binding (`127.0.0.1` Only):**
   - The server binds exclusively to `127.0.0.1` on an unprivileged, dynamically assigned port.
   - It **never binds to `0.0.0.0` or public network adapters**, rendering the port unreachable by other computers, phones, or devices on your local WiFi / LAN.

2. **DNS Rebinding & Host Validation:**
   - Validates the `Host` HTTP header against `127.0.0.1` and `localhost`. External domains or malicious DNS rebinding setups cannot reach or query the server.

3. **Anti-CSRF & Cross-Site Request Hardening:**
   - Cross-origin requests from external internet websites are blocked.
   - Inspects `Origin`, `Referer`, and `Sec-Fetch-Site: cross-site` headers to ensure arbitrary web pages visited in your everyday browser cannot read or tamper with your boards.

4. **Directory & Path Traversal Prevention:**
   - Canonicalized path resolution prevents `../` path traversal attacks.
   - Explicitly blocks access to internal directories (`/data/profile`, `/.git`, `node_modules`, `/.env`).

5. **Denial-of-Service (DoS) Payload Guard:**
   - Enforces a 25 MB payload limit on incoming requests to prevent memory exhaustion attacks.

6. **100% .EXE Free:**
   - Runs directly on standard Node.js or Windows PowerShell. No compiled `.exe` files that trigger false-positive antivirus quarantines or deletions.

---

## 🚀 Quick Start

### Windows (One-Click)
Simply double-click:
- **`Start-Kanban.cmd`** (Starts using Node.js or PowerShell and opens a native standalone app window)

### Node.js (Cross-Platform: Windows, macOS, Linux)
```bash
# Clone the repository
git clone https://github.com/your-username/sunveil-kanban.git
cd sunveil-kanban

# Start the application
npm start
```
*No `npm install` needed! Sunveil uses 100% Node.js standard libraries.*

---

## 🤖 Model Context Protocol (MCP) & AI Integration

Sunveil includes a complete **Model Context Protocol (MCP)** server (`mcp-server.js`) conforming to the official 2024-11-05 MCP specification. This lets AI agents (Claude Desktop, Google Antigravity, Cursor, Cline, Windsurf) view and manipulate your Kanban board and mindmaps autonomously.

### Claude Desktop Configuration
Add this to your `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):
```json
{
  "mcpServers": {
    "sunveil-kanban": {
      "command": "node",
      "args": ["<PATH_TO_PROJECT>/mcp-server.js"]
    }
  }
}
```

### Antigravity / Cursor / Cline Configuration
In your `mcp_config.json`:
```json
{
  "mcpServers": {
    "sunveil-kanban": {
      "command": "node",
      "args": ["<PATH_TO_PROJECT>/mcp-server.js"]
    }
  }
}
```

### Available MCP Tools:
| Tool | Description |
|------|-------------|
| `kanban_get_board` | Get complete board structure (columns, cards, stats, tags). |
| `kanban_list_columns` | List all columns with IDs, names, and card counts. |
| `kanban_list_cards` | Search or filter cards by phase or text query. |
| `kanban_get_card` | Retrieve detailed card data including mindmap bubbles and sketches. |
| `kanban_create_card` | Add a new task card and initialize its visual mindmap. |
| `kanban_update_card` | Update card title, notes, or tags. |
| `kanban_move_card` | Move a card between phases or reorder in a column. |
| `kanban_delete_card` | Remove a card by its ID. |
| `kanban_create_column` | Add a new phase column to the board. |
| `kanban_add_mindmap_node` | Add thought bubbles, links, or notes to a card's mindmap. |

⚡ **Live 2-Way Synchronization:** When an AI creates or modifies a card via MCP, the change appears on your screen **in real time**!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Force save board to local storage and disk |
| `Escape` | Switch back to the master Kanban board |
| `V` | Select & Move tool (Mindmap) |
| `H` / `Space` | Pan / Hand tool (Mindmap canvas) |
| `P` | Freehand drawing pen |
| `A` | Arrow connection tool |
| `E` | Eraser tool |
| `B` | Add new thought bubble |
| `Ctrl + Z` | Undo last drawing stroke |

---

## 📂 Project Structure

```
sunveil-kanban/
├── index.html            # Main application UI and templates
├── server.js             # Hardened loopback HTTP server (Node.js)
├── server.ps1            # Hardened fallback server (PowerShell)
├── mcp-server.js         # Model Context Protocol (MCP) stdio AI server
├── Start-Kanban.cmd      # One-click Windows starter
├── Start-App.bat         # Fallback starter script
├── css/
│   └── style.css         # Modern dark-mode UI design system
├── js/
│   ├── i18n.js           # Multi-language translation engine (DE, EN, ES, FR)
│   ├── store.js          # Reactive board data store & disk sync
│   ├── kanban.js         # Kanban column & card drag-and-drop engine
│   ├── mindmap.js        # Infinite zoomable visual mindmap engine
│   ├── whiteboard.js     # Freehand drawing & canvas sketch engine
│   ├── tabs.js           # Edge-style multi-tab manager
│   └── app.js            # App initialization, shortcuts & event wire-up
├── data/
│   └── kanban_data.json  # Local board database (JSON format)
├── LICENSE               # MIT Open Source License
├── package.json          # Project metadata & npm scripts
└── README.md             # Documentation
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details. You are completely free to use, modify, distribute, and integrate this software into your own personal or commercial projects.
