#!/usr/bin/env node
/**
 * Sunveil Kanban - Model Context Protocol (MCP) Server
 * 
 * Provides an MCP stdio interface for AI assistants (Claude Desktop, Antigravity, Cursor, etc.)
 * to view, create, update, and manage Kanban cards, columns, and visual mindmaps.
 * 
 * Usage:
 *   node mcp-server.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BASE_DIR = __dirname;
const DATA_FILE = path.join(BASE_DIR, 'data', 'kanban_data.json');

// Ensure data folder and file exist
function getBoardData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const defaultData = {
        title: "🚀 Projekt Arbeitsbereich",
        columns: [
          { id: "col-1", title: "💡 Ideen & Konzepte", color: "#6366f1" },
          { id: "col-2", title: "⚡ In Arbeit", color: "#38bdf8" },
          { id: "col-3", title: "🔍 Review & Test", color: "#f59e0b" },
          { id: "col-4", title: "✅ Erledigt", color: "#10b981" }
        ],
        cards: []
      };
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      title: "🚀 Projekt Arbeitsbereich",
      columns: [],
      cards: [],
      error: err.message
    };
  }
}

function saveBoardData(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    // Write atomically
    const tempFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DATA_FILE);
    return true;
  } catch (err) {
    console.error("Fehler beim Speichern der Board-Daten:", err);
    return false;
  }
}

// MCP Tools Definition
const TOOLS = [
  {
    name: "kanban_get_board",
    description: "Get the full Kanban board state, including board title, all columns, all cards, tags, and summary statistics.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "kanban_list_columns",
    description: "List all columns on the Kanban board with IDs, titles, and card counts.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "kanban_list_cards",
    description: "List cards on the Kanban board. Can optionally filter by column ID or query substring.",
    inputSchema: {
      type: "object",
      properties: {
        columnId: { type: "string", description: "Optional: filter cards in a specific column (e.g., 'col-1', 'col-2')" },
        query: { type: "string", description: "Optional: search text in card title or tags" }
      },
      required: []
    }
  },
  {
    name: "kanban_get_card",
    description: "Get comprehensive details of a specific card by its ID, including all its visual mindmap nodes, connections, notes, and whiteboard drawings.",
    inputSchema: {
      type: "object",
      properties: {
        cardId: { type: "string", description: "The ID of the card (e.g., 'card-demo-1')" }
      },
      required: ["cardId"]
    }
  },
  {
    name: "kanban_create_card",
    description: "Create a new card in a specified column on the Kanban board. Automatically initializes its mindmap workspace.",
    inputSchema: {
      type: "object",
      properties: {
        columnId: { type: "string", description: "The ID or name of the column where the card should be placed" },
        title: { type: "string", description: "The title of the card" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of tag names (e.g. ['Feature', 'Bug', 'High Priority'])"
        },
        description: { type: "string", description: "Optional initial note/description to place in the card's mindmap" }
      },
      required: ["columnId", "title"]
    }
  },
  {
    name: "kanban_move_card",
    description: "Move an existing card to a different column (e.g. move to 'col-4' / Done) and optionally update its position.",
    inputSchema: {
      type: "object",
      properties: {
        cardId: { type: "string", description: "The ID of the card to move" },
        targetColumnId: { type: "string", description: "The target column ID or title" },
        order: { type: "number", description: "Optional position index in the target column" }
      },
      required: ["cardId", "targetColumnId"]
    }
  },
  {
    name: "kanban_update_card",
    description: "Update a card's title or tags.",
    inputSchema: {
      type: "object",
      properties: {
        cardId: { type: "string", description: "The ID of the card" },
        title: { type: "string", description: "New title for the card" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Updated list of tag names"
        }
      },
      required: ["cardId"]
    }
  },
  {
    name: "kanban_delete_card",
    description: "Delete a card by ID from the Kanban board.",
    inputSchema: {
      type: "object",
      properties: {
        cardId: { type: "string", description: "The ID of the card to delete" }
      },
      required: ["cardId"]
    }
  },
  {
    name: "kanban_add_mindmap_node",
    description: "Add a thought bubble, subtask, or web-link to a card's visual mindmap canvas.",
    inputSchema: {
      type: "object",
      properties: {
        cardId: { type: "string", description: "The ID of the card whose mindmap to update" },
        title: { type: "string", description: "Title or short label of the mindmap node" },
        content: { type: "string", description: "Detailed content or notes for this node" },
        type: { type: "string", enum: ["bubble", "link"], description: "Type of node ('bubble' for thought bubble/note, 'link' for clickable web link)" },
        url: { type: "string", description: "Web URL if type is 'link'" },
        color: { type: "string", description: "Optional hex color (e.g. '#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899')" }
      },
      required: ["cardId", "title"]
    }
  },
  {
    name: "kanban_create_column",
    description: "Create a new column on the Kanban board.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The title of the column" },
        color: { type: "string", description: "Optional hex color accent for the column (e.g. '#6366f1')" }
      },
      required: ["title"]
    }
  }
];

// MCP Prompts Definition
const PROMPTS = [
  {
    name: "summarize_board",
    description: "Summarizes the current state of the Kanban board, highlighting active tasks, bottlenecks, and completed items.",
    arguments: []
  },
  {
    name: "plan_card",
    description: "Analyzes a Kanban card and proposes a step-by-step breakdown as mindmap nodes.",
    arguments: [
      { name: "cardId", description: "The ID of the card to plan", required: true }
    ]
  }
];

// MCP Resources Definition
const RESOURCES = [
  {
    uri: "kanban://board",
    name: "Sunveil Kanban Board State",
    description: "Full JSON state of the Sunveil Kanban board and all mindmaps",
    mimeType: "application/json"
  }
];

// Execute MCP Tool
function callTool(name, args) {
  const data = getBoardData();
  const colors = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  switch (name) {
    case "kanban_get_board": {
      const summary = {
        title: data.title || "Sunveil Board",
        columnsCount: data.columns.length,
        totalCards: data.cards.length,
        columns: data.columns.map(col => {
          const cardsInCol = data.cards.filter(c => c.columnId === col.id);
          return {
            id: col.id,
            title: col.title,
            color: col.color,
            cardCount: cardsInCol.length,
            cards: cardsInCol.map(c => ({
              id: c.id,
              title: c.title,
              tags: (c.tags || []).map(t => typeof t === 'string' ? t : t.name),
              mindmapNodesCount: (c.mindmap && c.mindmap.nodes) ? c.mindmap.nodes.length : 0
            }))
          };
        })
      };
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }]
      };
    }

    case "kanban_list_columns": {
      const cols = data.columns.map(c => ({
        id: c.id,
        title: c.title,
        color: c.color,
        cardCount: data.cards.filter(card => card.columnId === c.id).length
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(cols, null, 2) }]
      };
    }

    case "kanban_list_cards": {
      let filtered = data.cards;
      if (args.columnId) {
        // Allow matching by ID or title
        const colMatch = data.columns.find(c => c.id === args.columnId || c.title.toLowerCase() === args.columnId.toLowerCase());
        const matchId = colMatch ? colMatch.id : args.columnId;
        filtered = filtered.filter(c => c.columnId === matchId);
      }
      if (args.query) {
        const q = args.query.toLowerCase();
        filtered = filtered.filter(c => {
          const matchTitle = (c.title || '').toLowerCase().includes(q);
          const matchTags = (c.tags || []).some(t => {
            const name = typeof t === 'string' ? t : t.name;
            return (name || '').toLowerCase().includes(q);
          });
          return matchTitle || matchTags;
        });
      }
      const list = filtered.map(c => {
        const col = data.columns.find(col => col.id === c.columnId);
        return {
          id: c.id,
          title: c.title,
          column: col ? col.title : c.columnId,
          columnId: c.columnId,
          order: c.order,
          tags: (c.tags || []).map(t => typeof t === 'string' ? t : t.name),
          mindmapNodes: (c.mindmap && c.mindmap.nodes) ? c.mindmap.nodes.length : 0
        };
      });
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }]
      };
    }

    case "kanban_get_card": {
      const card = data.cards.find(c => c.id === args.cardId);
      if (!card) {
        return {
          isError: true,
          content: [{ type: "text", text: `Karte mit ID '${args.cardId}' wurde nicht gefunden.` }]
        };
      }
      const col = data.columns.find(col => col.id === card.columnId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            ...card,
            columnName: col ? col.title : card.columnId
          }, null, 2)
        }]
      };
    }

    case "kanban_create_card": {
      // Find target column
      let targetCol = data.columns.find(c => c.id === args.columnId || c.title.toLowerCase() === args.columnId.toLowerCase());
      if (!targetCol) {
        targetCol = data.columns[0];
      }
      if (!targetCol) {
        return {
          isError: true,
          content: [{ type: "text", text: "Keine Spalte auf dem Board vorhanden. Bitte zuerst eine Spalte anlegen." }]
        };
      }

      const cardId = 'card-' + Date.now();
      const tagsArray = (args.tags || []).map(t => {
        if (typeof t === 'string') {
          return { name: t, color: colors[Math.floor(Math.random() * colors.length)] };
        }
        return t;
      });

      const cardsInCol = data.cards.filter(c => c.columnId === targetCol.id);
      const mindmapNodes = [
        {
          id: 'center-root',
          isCenter: true,
          type: 'bubble',
          title: args.title,
          content: 'Zentrale Mindmap für diese Aufgabe.',
          x: 4800,
          y: 4800,
          color: targetCol.color || '#6366f1'
        }
      ];

      if (args.description) {
        mindmapNodes.push({
          id: 'node-' + Date.now(),
          type: 'bubble',
          title: 'Notiz / Details',
          content: args.description,
          x: 4420,
          y: 4720,
          color: '#38bdf8'
        });
      }

      const newCard = {
        id: cardId,
        columnId: targetCol.id,
        title: args.title,
        order: cardsInCol.length,
        tags: tagsArray,
        mindmap: {
          nodes: mindmapNodes,
          connections: args.description ? [
            { id: 'conn-' + Date.now(), fromId: 'center-root', toId: mindmapNodes[1].id, color: '#38bdf8' }
          ] : [],
          drawings: []
        }
      };

      data.cards.push(newCard);
      saveBoardData(data);

      return {
        content: [{
          type: "text",
          text: `✅ Karte '${args.title}' erfolgreich in Spalte '${targetCol.title}' erstellt (ID: ${cardId}).`
        }]
      };
    }

    case "kanban_move_card": {
      const card = data.cards.find(c => c.id === args.cardId);
      if (!card) {
        return {
          isError: true,
          content: [{ type: "text", text: `Karte mit ID '${args.cardId}' nicht gefunden.` }]
        };
      }

      const targetCol = data.columns.find(c => c.id === args.targetColumnId || c.title.toLowerCase() === args.targetColumnId.toLowerCase());
      if (!targetCol) {
        return {
          isError: true,
          content: [{ type: "text", text: `Zielspalte '${args.targetColumnId}' nicht gefunden.` }]
        };
      }

      const oldColId = card.columnId;
      card.columnId = targetCol.id;
      if (typeof args.order === 'number') {
        card.order = args.order;
      } else {
        const destCount = data.cards.filter(c => c.columnId === targetCol.id && c.id !== card.id).length;
        card.order = destCount;
      }

      saveBoardData(data);

      const oldCol = data.columns.find(c => c.id === oldColId);
      return {
        content: [{
          type: "text",
          text: `✅ Karte '${card.title}' wurde von '${oldCol ? oldCol.title : oldColId}' nach '${targetCol.title}' verschoben.`
        }]
      };
    }

    case "kanban_update_card": {
      const card = data.cards.find(c => c.id === args.cardId);
      if (!card) {
        return {
          isError: true,
          content: [{ type: "text", text: `Karte '${args.cardId}' nicht gefunden.` }]
        };
      }

      if (args.title) {
        card.title = args.title;
        // Update root node title as well
        if (card.mindmap && card.mindmap.nodes) {
          const rootNode = card.mindmap.nodes.find(n => n.id === 'center-root' || n.isCenter);
          if (rootNode) rootNode.title = args.title;
        }
      }

      if (Array.isArray(args.tags)) {
        card.tags = args.tags.map(t => {
          if (typeof t === 'string') {
            return { name: t, color: colors[Math.floor(Math.random() * colors.length)] };
          }
          return t;
        });
      }

      saveBoardData(data);
      return {
        content: [{ type: "text", text: `✅ Karte '${card.title}' erfolgreich aktualisiert.` }]
      };
    }

    case "kanban_delete_card": {
      const idx = data.cards.findIndex(c => c.id === args.cardId);
      if (idx === -1) {
        return {
          isError: true,
          content: [{ type: "text", text: `Karte '${args.cardId}' nicht gefunden.` }]
        };
      }
      const title = data.cards[idx].title;
      data.cards.splice(idx, 1);
      saveBoardData(data);
      return {
        content: [{ type: "text", text: `✅ Karte '${title}' (ID: ${args.cardId}) wurde gelöscht.` }]
      };
    }

    case "kanban_add_mindmap_node": {
      const card = data.cards.find(c => c.id === args.cardId);
      if (!card) {
        return {
          isError: true,
          content: [{ type: "text", text: `Karte '${args.cardId}' nicht gefunden.` }]
        };
      }
      if (!card.mindmap) {
        card.mindmap = { nodes: [], connections: [], drawings: [] };
      }
      if (!card.mindmap.nodes) card.mindmap.nodes = [];
      if (!card.mindmap.connections) card.mindmap.connections = [];

      const count = card.mindmap.nodes.length;
      // Position around center in a circular or staggered layout
      const angle = (count * 60) * (Math.PI / 180);
      const radius = 320 + (Math.floor(count / 6) * 120);
      const x = Math.round(4800 + Math.cos(angle) * radius);
      const y = Math.round(4800 + Math.sin(angle) * radius);

      const nodeId = 'node-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const nodeColor = args.color || colors[count % colors.length];

      const newNode = {
        id: nodeId,
        type: args.type || 'bubble',
        title: args.title,
        content: args.content || '',
        url: args.url || '',
        x: x,
        y: y,
        color: nodeColor
      };

      card.mindmap.nodes.push(newNode);

      // Connect to root node if exists
      const rootNode = card.mindmap.nodes.find(n => n.id === 'center-root' || n.isCenter);
      if (rootNode) {
        card.mindmap.connections.push({
          id: 'conn-' + Date.now(),
          fromId: rootNode.id,
          toId: nodeId,
          color: nodeColor
        });
      }

      saveBoardData(data);

      return {
        content: [{
          type: "text",
          text: `✅ Mindmap-Knoten '${args.title}' zu Karte '${card.title}' hinzugefügt.`
        }]
      };
    }

    case "kanban_create_column": {
      const colId = 'col-' + Date.now();
      const colColor = args.color || colors[data.columns.length % colors.length];
      const newCol = {
        id: colId,
        title: args.title,
        color: colColor
      };
      data.columns.push(newCol);
      saveBoardData(data);
      return {
        content: [{
          type: "text",
          text: `✅ Neue Spalte '${args.title}' angelegt (ID: ${colId}).`
        }]
      };
    }

    default:
      return {
        isError: true,
        content: [{ type: "text", text: `Unbekanntes Werkzeug: '${name}'` }]
      };
  }
}

// JSON-RPC Request Handler
function handleMessage(message) {
  const { id, method, params } = message;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: "sunveil-kanban",
            version: "1.0.0"
          }
        }
      };

    case "notifications/initialized":
      return null; // No response for notifications

    case "ping":
      return { jsonrpc: "2.0", id, result: {} };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS
        }
      };

    case "tools/call": {
      const { name, arguments: args } = params || {};
      const res = callTool(name, args || {});
      return {
        jsonrpc: "2.0",
        id,
        result: res
      };
    }

    case "resources/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          resources: RESOURCES
        }
      };

    case "resources/read": {
      const uri = params ? params.uri : '';
      if (uri === "kanban://board") {
        const board = getBoardData();
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [
              {
                uri: "kanban://board",
                mimeType: "application/json",
                text: JSON.stringify(board, null, 2)
              }
            ]
          }
        };
      }
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: `Resource nicht gefunden: ${uri}` }
      };
    }

    case "prompts/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          prompts: PROMPTS
        }
      };

    case "prompts/get": {
      const pName = params ? params.name : '';
      const data = getBoardData();

      if (pName === "summarize_board") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            description: "Analysiere das Sunveil Kanban Board",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Bitte analysiere den aktuellen Status meines Kanban Boards "${data.title}".\nHier sind die Daten:\n${JSON.stringify(data, null, 2)}\n\nFasse zusammen: Was ist fertig, was ist in Arbeit, wo gibt es Engpässe und welche nächsten 3 Schritte empfiehlst du?`
                }
              }
            ]
          }
        };
      }

      if (pName === "plan_card") {
        const cardId = params && params.arguments ? params.arguments.cardId : '';
        const card = data.cards.find(c => c.id === cardId);
        return {
          jsonrpc: "2.0",
          id,
          result: {
            description: "Plane Aufgabenstruktur für eine Karte",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Bitte hilf mir, die folgende Kanban-Aufgabe im Detail zu planen und in 4-6 sinnvolle Mindmap-Knoten aufzuteilen:\n\nAufgabe: ${card ? JSON.stringify(card, null, 2) : 'Karte nicht gefunden'}`
                }
              }
            ]
          }
        };
      }

      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Prompt '${pName}' existiert nicht.` }
      };
    }

    default:
      if (id !== undefined) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        };
      }
      return null;
  }
}

// Stdio JSON-RPC Stream
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const msg = JSON.parse(trimmed);
    const resp = handleMessage(msg);
    if (resp) {
      process.stdout.write(JSON.stringify(resp) + '\n');
    }
  } catch (err) {
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error: " + err.message }
    }) + '\n');
  }
});

// Also export helper for internal server use
module.exports = {
  callTool,
  getBoardData,
  saveBoardData,
  TOOLS,
  PROMPTS
};
