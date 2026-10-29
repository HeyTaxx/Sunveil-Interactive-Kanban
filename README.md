# Sunveil — Interactive Kanban & Visual Mindmap

> A local-first desktop workspace that brings together a Trello-like Kanban board, per-card visual mindmaps, a freehand drawing canvas, and a native Model Context Protocol (MCP) server for AI assistants.
> 
> 🤖 **Built with AI**: This entire project was created, designed, and coded collaboratively using AI agentic pair-programming (Google Antigravity).

---

## Screenshots

### 1. Kanban Board
*Interactive columns, drag & drop cards, live node/sketch indicators, and quick search.*
![Kanban Board](docs/screenshots/kanban-board.png)

### 2. Visual Mindmap & Whiteboard Canvas
*Double-click any card to dive into its dedicated canvas with thought bubbles, curved connectors, web links, and freehand drawing tools.*
![Mindmap Canvas](docs/screenshots/mindmap-view.png)

### 3. Model Context Protocol (MCP) & AI Integration
*Connect Claude Desktop, Antigravity, or Cursor to let AI assistants read, create, and organize your cards and mindmaps in real time.*
![MCP Tools](docs/screenshots/mcp-integration.png)

---

## Why Sunveil?

Most task managers are either simple checklists or heavy, bloated web apps. Sunveil gives you:
- **Instant local performance**: 0 npm dependencies, boots in milliseconds.
- **100% .EXE Free**: Runs through Node.js or PowerShell. No unsigned binary executables that trigger false-positive antivirus warnings or deletions.
- **Visual thinking per task**: Every task card has its own infinite canvas behind it. Double-click to brainstorm with bubbles, arrows, external links, and drawings.
- **AI-native**: Includes a full Model Context Protocol server (`mcp-server.js`) so AI tools can query your board or add ideas live on your screen.
- **Multi-language**: Built-in support for English (default), German, Spanish, and French.

---

## Quick Start

### Windows Desktop (One-Click)
- **`Sunveil.exe`**: Double-click the native launcher (or `Start-Kanban.cmd`). It starts the application in a clean, standalone desktop window without console flashes.

### Windows Server (24/7 Hosting Mode)
- **`Start-Server.cmd`**: Starts Sunveil in permanent 24/7 server mode on port `40293` with auto-shutdown disabled and production security enabled.

### Linux & macOS Server Hosting
```bash
# 1. Background Daemon mode
chmod +x server.sh
./server.sh start

# 2. Check status or logs
./server.sh status
./server.sh logs

# 3. Stop
./server.sh stop
```

### Docker & Docker Compose (Production Ready)
```bash
# Start with Docker Compose (mounts ./data for persistent boards)
docker compose up -d

# Check logs
docker compose logs -f
```

---

## 🌐 Server Hosting & Multi-Session Collaboration

Sunveil can be deployed on a Linux VPS, Windows Server, Raspberry Pi, or local home server, allowing multiple team members to work concurrently on isolated boards.

### Key Capabilities:
- **Multi-Board Workspaces**: Switch between projects (e.g. Sprint 1, Marketing Roadmap, Personal Backlog) from the header dropdown without page reloads.
- **Room-Isolated Real-Time Collaboration**: Real-time SSE updates are isolated per board room, preventing cross-board interference.
- **24/7 Server Daemon**: Auto-shutdown watchdog is disabled in server mode (`SUNVEIL_SERVER=true` or `--server`).
- **Timing-Safe Authentication**: Scrypt password hashing with constant-time equality comparisons (`crypto.timingSafeEqual`).
- **Brute-Force Rate Limiting**: Exponential backoff and automatic IP lockout after 5 consecutive failed attempts.
- **Reverse Proxy Hardened**: Full support for Nginx, Caddy, Apache, or Cloudflare with `X-Forwarded-Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`.

### Environment Variables:
| Variable | Default | Description |
|----------|---------|-------------|
| `SUNVEIL_SERVER` | `false` | Set to `true` to enable permanent 24/7 daemon mode. |
| `PORT` | `40293` | Port for the HTTP server. |
| `SUNVEIL_PASSWORD` | *(None)* | Pre-configured admin password. If omitted, prompts for initial password on first browser setup. |
| `ALLOWED_HOSTS` | `*` | Comma-separated list of allowed host header domains/IPs, or `*` to allow all. |
| `NODE_ENV` | `development` | Set to `production` for server deployments. |

---

## Features

- **Kanban Board**: Drag-and-drop columns and cards, live card counts for notes & sketches, real-time search filter, and instant inline editing.
- **🏢 Multi-Board Workspaces**: Create, rename, switch, and delete multiple boards with independent workflows, colors, and templates (Standard Kanban, Scrum Sprint, Simple Tasks).
- **🐙 GitHub Projects v2 Integration (2-Way Live Sync)**: Connect directly to GitHub Projects v2 via Personal Access Token (PAT). Sync columns with GitHub Status fields, import Issues, PRs, and Draft Issues with live badges, assignees, and links. Moving or editing cards in Sunveil updates GitHub Status in real time!
- **Visual Mindmap**: Double-click any card to open its private canvas. Connect nodes with clean curved lines that anchor to bubble borders.
- **Freehand Whiteboard**: Pen, arrow, highlighter, and eraser tools with custom colors and stroke widths. Export any canvas as PNG.
- **Edge-Style Tabs**: Keep the main board and multiple task mindmaps open side by side without losing state.
- **🌐 Real-Time Live Share**: Collaborate simultaneously across your local network, internet, or Wi-Fi. Teammates can join instantly on laptops, iPads, or smartphones via QR code or direct link with real-time card, mindmap, and whiteboard synchronization.
- **🔐 Hardened Authentication**: Optional for local desktop; strictly enforced in server mode with secure HTTP-only session cookies and Bearer tokens.
- **🚀 1-Click App Install & Brand Footer**: "Made with Sunveil Interactive Kanban" footer with one-click PWA browser installation, portable desktop launcher, and quick clone commands.
- **Auto-Sync & Local Storage**: Changes save instantly to `data/boards/<boardId>.json` and `localStorage`.

---

## 🔒 Security & Server Architecture

The server runs natively with built-in defense-in-depth protection:
- **Zero Dependencies**: Pure Node.js standard library with 0 third-party npm dependencies.
- **Cryptographic Authentication**: Timing-safe Scrypt password hashing with constant-time equality checks.
- **Anti-Brute Force Protection**: IP rate-limiter locks out attackers after 5 failed attempts for 15 minutes.
- **Reverse Proxy & DNS Rebinding Hardening**: Strict Host header validation with `ALLOWED_HOSTS` support.
- **Path Traversal Shield**: Canonical path resolution blocks `../` directory traversal and denies access to `.git`, `.env`, and session data.
- **Room Isolation**: SSE events and board updates are strictly routed only to clients connected to the same board room.
- **Payload Limits**: 30 MB payload limit prevents memory exhaustion attacks.

---

## 🤖 MCP Setup (Claude Desktop & IDEs)

To let Claude Desktop or your IDE interact with your board, add the MCP server:

### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "sunveil-kanban": {
      "command": "node",
      "args": ["<FULL_PATH_TO_PROJECT>/mcp-server.js"]
    }
  }
}
```

### Antigravity / Cursor (`mcp_config.json`)
```json
{
  "mcpServers": {
    "sunveil-kanban": {
      "command": "node",
      "args": ["<FULL_PATH_TO_PROJECT>/mcp-server.js"]
    }
  }
}
```

### Available MCP Tools:
| Tool | Description |
|------|-------------|
| `kanban_get_board` | Retrieve the complete board state (columns, cards, counters, tags). |
| `kanban_create_card` | Create a new task in any column. |
| `kanban_move_card` | Move a card between columns or reorder it. |
| `kanban_add_mindmap_node` | Add a thought bubble, link, or note to a card's mindmap. |
| `kanban_get_card` | Inspect detailed card info with all its bubbles and drawings. |
| `kanban_list_cards` | Search and filter cards by column or query. |
| `kanban_update_card` | Update title, notes, or tags. |
| `kanban_delete_card` | Delete a card by ID. |
| `kanban_list_columns` | List all columns with IDs, names, and colors. |
| `kanban_create_column` | Add a new phase column to the board. |

---

## Keyboard Shortcuts

- `Ctrl + S`: Quick save to disk & local storage
- `Escape`: Return to the main Kanban board
- `V`: Select & Move tool
- `H` or `Space`: Pan / Hand tool
- `P`: Pen drawing tool
- `A`: Arrow connector
- `E`: Eraser
- `B`: Add new thought bubble
- `Ctrl + Z`: Undo drawing stroke

---

## License

MIT License — see [LICENSE](LICENSE) for details. Free for personal and commercial use.
