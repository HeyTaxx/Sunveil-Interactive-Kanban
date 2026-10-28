/**
 * Sunveil Internationalization (i18n) Engine
 * Supported Languages:
 *   - de: Deutsch (German)
 *   - en: English (English)
 *   - es: Español (Spanish)
 *   - fr: Français (French)
 */

const translations = {
  de: {
    // Top Tabs
    tab_kanban: "Kanban Board",
    tab_close: "Tab schließen",

    // Header actions
    btn_quick_card: "+ Schnellkarte",
    btn_quick_card_title: "Neue Karte hinzufügen",
    btn_mcp: "MCP / KI",
    btn_mcp_title: "Model Context Protocol (MCP) & KI-Integration",
    btn_export: "Export",
    btn_export_title: "Backup / JSON exportieren",
    btn_import: "Import",
    btn_import_title: "JSON importieren",
    status_saved: "Gespeichert",
    status_saving: "Speichere...",
    status_saved_local: "Gespeichert (Lokal)",
    status_synced_mcp: "MCP / Disk synchronisiert",

    // Kanban Board View
    board_default_title: "🚀 Projekt Arbeitsbereich",
    board_subtitle: "Doppelklicke auf eine Karte, um deren visuelle Mindmap & Zeichenfläche zu öffnen",
    search_placeholder: "Karten durchsuchen...",
    btn_add_column: "+ Neue Spalte",
    btn_add_card_inline: "+ Karte hinzufügen",
    prompt_new_column: "Name für die neue Spalte:",
    default_new_column: "Neue Phase",
    prompt_quick_card: "Titel für die neue Schnellkarte:",
    prompt_card_title: "Kartentitel eingeben:",
    default_new_card: "Neue Aufgabe",
    confirm_delete_column: "Spalte \"{name}\" und alle darin enthaltenen Karten löschen?",
    drag_column_title: "Spalte ziehen zum Verschieben",
    delete_column_title: "Spalte löschen",
    card_title_hint: "Klicken zum Bearbeiten des Titels",
    mindmap_hint: "Doppelklick = Mindmap öffnen",
    mindmap_badge: "Mindmap",
    indicator_nodes: "{count} Mindmap-Knoten",
    indicator_drawings: "{count} Skizzen/Zeichnungen",

    // Mindmap View
    btn_back_kanban: "Kanban Board",
    btn_back_kanban_title: "Zurück zum Kanban Board",
    mindmap_canvas_hint: "💡 Doppelklick auf die Fläche = Neue Notiz/Blase | Rechtsklick/Mausrad = Bewegen/Zoom",
    btn_zoom_out: "-",
    btn_zoom_out_title: "Herauszoomen",
    btn_zoom_in: "+",
    btn_zoom_in_title: "Heranzoomen",
    btn_zoom_reset: "1:1",
    btn_zoom_reset_title: "Zoom zurücksetzen",
    btn_export_mindmap: "📷 Bild",
    btn_export_mindmap_title: "Mindmap als PNG exportieren",

    // Mindmap Tools
    tool_select: "Auswählen & Bewegen (V)",
    tool_pan: "Fläche verschieben (Leertaste / Hand)",
    tool_bubble: "Blase / Knoten hinzufügen (B)",
    tool_text: "Freier Textblock",
    tool_link: "Web-Link Karte",
    tool_image: "Bild einfügen (Datei oder URL)",
    tool_pen: "Freihand Stift (Schreiben & Malen)",
    tool_arrow: "Verbindungspfeil zeichnen",
    tool_highlighter: "Textmarker",
    tool_eraser: "Radiergummi (Zeichnungen löschen)",
    tool_undo: "Zeichnen rückgängig (Strg+Z)",
    tool_clear: "Alle Zeichnungen auf dieser Karte löschen",
    color_indigo: "Indigo",
    color_sky: "Himmelblau",
    color_emerald: "Smaragdgrün",
    color_amber: "Bernstein",
    color_red: "Rot",
    color_rose: "Rosa",
    color_white: "Weiß",
    stroke_fine: "Fein",
    stroke_normal: "Normal",
    stroke_thick: "Dick",

    // Mindmap Elements
    theme_badge: "THEMA",
    node_delete: "Knoten löschen",
    node_connector_handle: "Ziehen, um Verbindungspfeil zu erstellen",
    prompt_new_bubble: "Gedankenblase eingeben:",
    default_new_bubble: "Neue Idee",
    prompt_new_text: "Text eingeben:",
    default_new_text: "Notiz...",
    cannot_delete_root: "Der Hauptknoten dieser Karte kann nicht gelöscht werden.",

    // Image Modal
    modal_image_title: "Bild zur Mindmap hinzufügen",
    modal_image_url_label: "Bild per URL einfügen:",
    modal_image_url_placeholder: "https://beispiel.de/bild.png",
    modal_image_or: "ODER",
    modal_image_local_label: "Lokale Bilddatei hochladen:",
    modal_image_drop_zone: "Klicke hier oder ziehe ein Bild hierher",
    btn_cancel: "Abbrechen",
    btn_insert: "Einfügen",

    // Link Modal
    modal_link_title: "Web-Link hinzufügen",
    modal_link_title_label: "Titel / Beschreibung:",
    modal_link_title_placeholder: "z.B. GitHub Repository oder Dokumentation",
    modal_link_url_label: "URL-Adresse:",
    modal_link_url_placeholder: "https://example.com",
    btn_insert_link: "Link einfügen",

    // MCP Modal
    mcp_modal_title: "Model Context Protocol (MCP) & KI-Integration",
    mcp_badge_active: "Server aktiv",
    mcp_badge_tools: "10 Werkzeuge",
    mcp_badge_sync: "Live 2-Wege Synchronisation",
    mcp_tab_claude: "Claude Desktop",
    mcp_tab_ide: "Antigravity / Cursor",
    mcp_tab_tools: "Werkzeuge (10 Tools)",
    mcp_tab_test: "Live-Test",
    mcp_claude_desc: "Kopiere diese Konfiguration in deine claude_desktop_config.json, damit Claude Desktop Karten lesen, anlegen, verschieben und Mindmaps direkt steuern kann.",
    mcp_config_path_label: "Konfigurationspfad:",
    mcp_claude_tip: "💡 Tipp: Starte Claude Desktop nach dem Speichern neu. Claude hat dann sofort Zugriff auf kanban_get_board, kanban_create_card, kanban_move_card und alle Mindmaps!",
    mcp_ide_desc: "In Google Antigravity, Cursor, Cline oder Windsurf kannst du den MCP-Server als lokalen stdio-Server einbinden.",
    mcp_ide_tip: "Der Server benötigt keine externen npm-Abhängigkeiten und startet in Millisekunden über die Node.js Standardbibliothek.",
    mcp_tools_desc: "Folgende 10 Werkzeuge stehen der KI zur Verfügung. Jede Änderung wird in Echtzeit live auf deinem Bildschirm aktualisiert!",
    mcp_test_desc: "Teste die MCP-Schnittstelle direkt hier im Browser:",
    btn_copy: "📋 Kopieren",
    btn_copied: "✅ Kopiert!",
    btn_close: "Schließen",

    // Toasts
    toast_backup_downloaded: "Projekt-Backup heruntergeladen",
    toast_board_restored: "Board erfolgreich wiederhergestellt!",
    toast_import_error: "Fehler beim Importieren: Datei enthält ungültige JSON-Struktur.",
    toast_changes_saved: "Änderungen gespeichert",
    toast_node_removed: "Knoten entfernt",
    toast_connection_created: "Verbindung erstellt",
    toast_export_downloaded: "Zeichnungs-Export heruntergeladen",
    toast_mcp_updated: "🤖 Board via MCP / Festplatte aktualisiert!"
  },

  en: {
    // Top Tabs
    tab_kanban: "Kanban Board",
    tab_close: "Close Tab",

    // Header actions
    btn_quick_card: "+ Quick Card",
    btn_quick_card_title: "Add new card",
    btn_mcp: "MCP / AI",
    btn_mcp_title: "Model Context Protocol (MCP) & AI Integration",
    btn_export: "Export",
    btn_export_title: "Export Backup / JSON",
    btn_import: "Import",
    btn_import_title: "Import JSON",
    status_saved: "Saved",
    status_saving: "Saving...",
    status_saved_local: "Saved (Local)",
    status_synced_mcp: "MCP / Disk Synced",

    // Kanban Board View
    board_default_title: "🚀 Project Workspace",
    board_subtitle: "Double-click a card to open its visual mindmap & drawing canvas",
    search_placeholder: "Search cards...",
    btn_add_column: "+ New Column",
    btn_add_card_inline: "+ Add Card",
    prompt_new_column: "Name for the new column:",
    default_new_column: "New Phase",
    prompt_quick_card: "Title for new quick card:",
    prompt_card_title: "Enter card title:",
    default_new_card: "New Task",
    confirm_delete_column: "Delete column \"{name}\" and all cards inside it?",
    drag_column_title: "Drag to reorder column",
    delete_column_title: "Delete column",
    card_title_hint: "Click to edit title",
    mindmap_hint: "Double-click = Open Mindmap",
    mindmap_badge: "Mindmap",
    indicator_nodes: "{count} Mindmap nodes",
    indicator_drawings: "{count} Sketches/Drawings",

    // Mindmap View
    btn_back_kanban: "Kanban Board",
    btn_back_kanban_title: "Back to Kanban Board",
    mindmap_canvas_hint: "💡 Double-click canvas = New note/bubble | Right-click/wheel = Pan/Zoom",
    btn_zoom_out: "-",
    btn_zoom_out_title: "Zoom Out",
    btn_zoom_in: "+",
    btn_zoom_in_title: "Zoom In",
    btn_zoom_reset: "1:1",
    btn_zoom_reset_title: "Reset Zoom",
    btn_export_mindmap: "📷 Image",
    btn_export_mindmap_title: "Export mindmap as PNG",

    // Mindmap Tools
    tool_select: "Select & Move (V)",
    tool_pan: "Pan Canvas (Space / Hand)",
    tool_bubble: "Add Bubble / Node (B)",
    tool_text: "Text Block",
    tool_link: "Web Link Card",
    tool_image: "Insert Image (File or URL)",
    tool_pen: "Freehand Pen (Draw & Sketch)",
    tool_arrow: "Draw Arrow",
    tool_highlighter: "Highlighter",
    tool_eraser: "Eraser (Delete drawings)",
    tool_undo: "Undo Drawing (Ctrl+Z)",
    tool_clear: "Clear all drawings on this card",
    color_indigo: "Indigo",
    color_sky: "Sky Blue",
    color_emerald: "Emerald",
    color_amber: "Amber",
    color_red: "Red",
    color_rose: "Rose",
    color_white: "White",
    stroke_fine: "Fine",
    stroke_normal: "Normal",
    stroke_thick: "Thick",

    // Mindmap Elements
    theme_badge: "TOPIC",
    node_delete: "Delete node",
    node_connector_handle: "Drag to create connection line",
    prompt_new_bubble: "Enter thought bubble:",
    default_new_bubble: "New Idea",
    prompt_new_text: "Enter text:",
    default_new_text: "Note...",
    cannot_delete_root: "The root node of this card cannot be deleted.",

    // Image Modal
    modal_image_title: "Add Image to Mindmap",
    modal_image_url_label: "Insert image by URL:",
    modal_image_url_placeholder: "https://example.com/image.png",
    modal_image_or: "OR",
    modal_image_local_label: "Upload local image file:",
    modal_image_drop_zone: "Click here or drag an image here",
    btn_cancel: "Cancel",
    btn_insert: "Insert",

    // Link Modal
    modal_link_title: "Add Web Link",
    modal_link_title_label: "Title / Description:",
    modal_link_title_placeholder: "e.g. GitHub Repository or Documentation",
    modal_link_url_label: "URL Address:",
    modal_link_url_placeholder: "https://example.com",
    btn_insert_link: "Insert Link",

    // MCP Modal
    mcp_modal_title: "Model Context Protocol (MCP) & AI Integration",
    mcp_badge_active: "Server Active",
    mcp_badge_tools: "10 Tools",
    mcp_badge_sync: "Live 2-Way Sync",
    mcp_tab_claude: "Claude Desktop",
    mcp_tab_ide: "Antigravity / Cursor",
    mcp_tab_tools: "Tools (10 Tools)",
    mcp_tab_test: "Live Test",
    mcp_claude_desc: "Copy this configuration into your claude_desktop_config.json so Claude Desktop can read, create, move cards and manage mindmaps directly.",
    mcp_config_path_label: "Configuration path:",
    mcp_claude_tip: "💡 Tip: Restart Claude Desktop after saving. Claude will immediately have access to kanban_get_board, kanban_create_card, kanban_move_card and all mindmaps!",
    mcp_ide_desc: "In Google Antigravity, Cursor, Cline or Windsurf, configure the MCP server as a local stdio server.",
    mcp_ide_tip: "The server requires zero external npm dependencies and starts in milliseconds using the Node.js standard library.",
    mcp_tools_desc: "The following 10 tools are available to the AI. Every change updates live on your screen in real time!",
    mcp_test_desc: "Test the MCP interface directly here in your browser:",
    btn_copy: "📋 Copy",
    btn_copied: "✅ Copied!",
    btn_close: "Close",

    // Toasts
    toast_backup_downloaded: "Project backup downloaded",
    toast_board_restored: "Board restored successfully!",
    toast_import_error: "Import error: File contains invalid JSON structure.",
    toast_changes_saved: "Changes saved",
    toast_node_removed: "Node removed",
    toast_connection_created: "Connection created",
    toast_export_downloaded: "Drawing export downloaded",
    toast_mcp_updated: "🤖 Board updated via MCP / Disk!"
  },

  es: {
    // Top Tabs
    tab_kanban: "Tablero Kanban",
    tab_close: "Cerrar pestaña",

    // Header actions
    btn_quick_card: "+ Tarjeta rápida",
    btn_quick_card_title: "Añadir nueva tarjeta",
    btn_mcp: "MCP / IA",
    btn_mcp_title: "Model Context Protocol (MCP) e integración IA",
    btn_export: "Exportar",
    btn_export_title: "Exportar copia de seguridad / JSON",
    btn_import: "Importar",
    btn_import_title: "Importar JSON",
    status_saved: "Guardado",
    status_saving: "Guardando...",
    status_saved_local: "Guardado (Local)",
    status_synced_mcp: "MCP / Disco sincronizado",

    // Kanban Board View
    board_default_title: "🚀 Área de trabajo del proyecto",
    board_subtitle: "Haz doble clic en una tarjeta para abrir su mapa mental y lienzo de dibujo",
    search_placeholder: "Buscar tarjetas...",
    btn_add_column: "+ Nueva columna",
    btn_add_card_inline: "+ Añadir tarjeta",
    prompt_new_column: "Nombre para la nueva columna:",
    default_new_column: "Nueva fase",
    prompt_quick_card: "Título para la tarjeta rápida:",
    prompt_card_title: "Introduce el título de la tarjeta:",
    default_new_card: "Nueva tarea",
    confirm_delete_column: "¿Eliminar la columna \"{name}\" y todas sus tarjetas?",
    drag_column_title: "Arrastrar para reordenar columna",
    delete_column_title: "Eliminar columna",
    card_title_hint: "Haz clic para editar el título",
    mindmap_hint: "Doble clic = Abrir mapa mental",
    mindmap_badge: "Mapa mental",
    indicator_nodes: "{count} nodos de mapa mental",
    indicator_drawings: "{count} bocetos/dibujos",

    // Mindmap View
    btn_back_kanban: "Tablero Kanban",
    btn_back_kanban_title: "Volver al tablero Kanban",
    mindmap_canvas_hint: "💡 Doble clic en el lienzo = Nueva nota/burbuja | Clic derecho/rueda = Mover/Zoom",
    btn_zoom_out: "-",
    btn_zoom_out_title: "Alejar",
    btn_zoom_in: "+",
    btn_zoom_in_title: "Acercar",
    btn_zoom_reset: "1:1",
    btn_zoom_reset_title: "Restablecer zoom",
    btn_export_mindmap: "📷 Imagen",
    btn_export_mindmap_title: "Exportar mapa mental como PNG",

    // Mindmap Tools
    tool_select: "Seleccionar y mover (V)",
    tool_pan: "Mover lienzo (Espacio / Mano)",
    tool_bubble: "Añadir burbuja / nodo (B)",
    tool_text: "Bloque de texto libre",
    tool_link: "Tarjeta de enlace web",
    tool_image: "Insertar imagen (Archivo o URL)",
    tool_pen: "Lápiz a mano alzada (Dibujar)",
    tool_arrow: "Dibujar flecha de conexión",
    tool_highlighter: "Resaltador",
    tool_eraser: "Borrador (Borrar dibujos)",
    tool_undo: "Deshacer dibujo (Ctrl+Z)",
    tool_clear: "Borrar todos los dibujos de esta tarjeta",
    color_indigo: "Índigo",
    color_sky: "Azul cielo",
    color_emerald: "Esmeralda",
    color_amber: "Ámbar",
    color_red: "Rojo",
    color_rose: "Rosa",
    color_white: "Blanco",
    stroke_fine: "Fino",
    stroke_normal: "Normal",
    stroke_thick: "Grueso",

    // Mindmap Elements
    theme_badge: "TEMA",
    node_delete: "Eliminar nodo",
    node_connector_handle: "Arrastra para crear línea de conexión",
    prompt_new_bubble: "Introduce burbuja de pensamiento:",
    default_new_bubble: "Nueva idea",
    prompt_new_text: "Introduce texto:",
    default_new_text: "Nota...",
    cannot_delete_root: "No se puede eliminar el nodo principal de esta tarjeta.",

    // Image Modal
    modal_image_title: "Añadir imagen al mapa mental",
    modal_image_url_label: "Insertar imagen por URL:",
    modal_image_url_placeholder: "https://ejemplo.com/imagen.png",
    modal_image_or: "O",
    modal_image_local_label: "Subir archivo de imagen local:",
    modal_image_drop_zone: "Haz clic aquí o arrastra una imagen aquí",
    btn_cancel: "Cancelar",
    btn_insert: "Insertar",

    // Link Modal
    modal_link_title: "Añadir enlace web",
    modal_link_title_label: "Título / Descripción:",
    modal_link_title_placeholder: "ej. Repositorio GitHub o Documentación",
    modal_link_url_label: "Dirección URL:",
    modal_link_url_placeholder: "https://example.com",
    btn_insert_link: "Insertar enlace",

    // MCP Modal
    mcp_modal_title: "Model Context Protocol (MCP) e integración IA",
    mcp_badge_active: "Servidor activo",
    mcp_badge_tools: "10 Herramientas",
    mcp_badge_sync: "Sincronización en vivo 2 vías",
    mcp_tab_claude: "Claude Desktop",
    mcp_tab_ide: "Antigravity / Cursor",
    mcp_tab_tools: "Herramientas (10)",
    mcp_tab_test: "Prueba en vivo",
    mcp_claude_desc: "Copia esta configuración en tu claude_desktop_config.json para que Claude Desktop pueda leer, crear, mover tarjetas y gestionar mapas mentales directamente.",
    mcp_config_path_label: "Ruta de configuración:",
    mcp_claude_tip: "💡 Consejo: Reinicia Claude Desktop tras guardar. ¡Claude tendrá acceso inmediato a kanban_get_board, kanban_create_card y todos los mapas mentales!",
    mcp_ide_desc: "En Google Antigravity, Cursor, Cline o Windsurf, integra el servidor MCP como servidor stdio local.",
    mcp_ide_tip: "El servidor no requiere dependencias npm externas y se inicia en milisegundos con la biblioteca estándar de Node.js.",
    mcp_tools_desc: "Las siguientes 10 herramientas están a disposición de la IA. ¡Cada cambio se actualiza en tiempo real en tu pantalla!",
    mcp_test_desc: "Prueba la interfaz MCP directamente aquí en tu navegador:",
    btn_copy: "📋 Copiar",
    btn_copied: "✅ ¡Copiado!",
    btn_close: "Cerrar",

    // Toasts
    toast_backup_downloaded: "Copia de seguridad del proyecto descargada",
    toast_board_restored: "¡Tablero restaurado con éxito!",
    toast_import_error: "Error de importación: El archivo contiene una estructura JSON no válida.",
    toast_changes_saved: "Cambios guardados",
    toast_node_removed: "Nodo eliminado",
    toast_connection_created: "Conexión creada",
    toast_export_downloaded: "Exportación de dibujo descargada",
    toast_mcp_updated: "🤖 ¡Tablero actualizado mediante MCP / Disco!"
  },

  fr: {
    // Top Tabs
    tab_kanban: "Tableau Kanban",
    tab_close: "Fermer l'onglet",

    // Header actions
    btn_quick_card: "+ Carte rapide",
    btn_quick_card_title: "Ajouter une nouvelle carte",
    btn_mcp: "MCP / IA",
    btn_mcp_title: "Model Context Protocol (MCP) & Intégration IA",
    btn_export: "Exporter",
    btn_export_title: "Exporter la sauvegarde / JSON",
    btn_import: "Importer",
    btn_import_title: "Importer JSON",
    status_saved: "Enregistré",
    status_saving: "Enregistrement...",
    status_saved_local: "Enregistré (Local)",
    status_synced_mcp: "MCP / Disque synchronisé",

    // Kanban Board View
    board_default_title: "🚀 Espace de travail du projet",
    board_subtitle: "Double-cliquez sur une carte pour ouvrir sa mindmap & zone de dessin",
    search_placeholder: "Rechercher des cartes...",
    btn_add_column: "+ Nouvelle colonne",
    btn_add_card_inline: "+ Ajouter une carte",
    prompt_new_column: "Nom de la nouvelle colonne :",
    default_new_column: "Nouvelle phase",
    prompt_quick_card: "Titre de la carte rapide :",
    prompt_card_title: "Entrez le titre de la carte :",
    default_new_card: "Nouvelle tâche",
    confirm_delete_column: "Supprimer la colonne \"{name}\" et toutes ses cartes ?",
    drag_column_title: "Glisser pour réorganiser la colonne",
    delete_column_title: "Supprimer la colonne",
    card_title_hint: "Cliquer pour modifier le titre",
    mindmap_hint: "Double-clic = Ouvrir la Mindmap",
    mindmap_badge: "Mindmap",
    indicator_nodes: "{count} nœuds mindmap",
    indicator_drawings: "{count} croquis/dessins",

    // Mindmap View
    btn_back_kanban: "Tableau Kanban",
    btn_back_kanban_title: "Retour au tableau Kanban",
    mindmap_canvas_hint: "💡 Double-clic sur le canvas = Nouvelle note/bulle | Clic droit/molette = Déplacer/Zoom",
    btn_zoom_out: "-",
    btn_zoom_out_title: "Zoom arrière",
    btn_zoom_in: "+",
    btn_zoom_in_title: "Zoom avant",
    btn_zoom_reset: "1:1",
    btn_zoom_reset_title: "Réinitialiser le zoom",
    btn_export_mindmap: "📷 Image",
    btn_export_mindmap_title: "Exporter la mindmap en PNG",

    // Mindmap Tools
    tool_select: "Sélectionner & Déplacer (V)",
    tool_pan: "Déplacer le canvas (Espace / Main)",
    tool_bubble: "Ajouter une bulle / nœud (B)",
    tool_text: "Bloc de texte libre",
    tool_link: "Carte de lien web",
    tool_image: "Insérer une image (Fichier ou URL)",
    tool_pen: "Stylo à main levée (Dessiner)",
    tool_arrow: "Dessiner une flèche de connexion",
    tool_highlighter: "Surligneur",
    tool_eraser: "Gomme (Effacer les dessins)",
    tool_undo: "Annuler le dessin (Ctrl+Z)",
    tool_clear: "Effacer tous les dessins sur cette carte",
    color_indigo: "Indigo",
    color_sky: "Bleu ciel",
    color_emerald: "Émeraude",
    color_amber: "Ambre",
    color_red: "Rouge",
    color_rose: "Rose",
    color_white: "Blanc",
    stroke_fine: "Fin",
    stroke_normal: "Normal",
    stroke_thick: "Épais",

    // Mindmap Elements
    theme_badge: "THÈME",
    node_delete: "Supprimer le nœud",
    node_connector_handle: "Glisser pour créer une ligne de connexion",
    prompt_new_bubble: "Entrez une bulle de pensée :",
    default_new_bubble: "Nouvelle idée",
    prompt_new_text: "Entrez du texte :",
    default_new_text: "Note...",
    cannot_delete_root: "Le nœud racine de cette carte ne peut pas être supprimé.",

    // Image Modal
    modal_image_title: "Ajouter une image à la Mindmap",
    modal_image_url_label: "Insérer une image par URL :",
    modal_image_url_placeholder: "https://exemple.fr/image.png",
    modal_image_or: "OU",
    modal_image_local_label: "Téléverser une image locale :",
    modal_image_drop_zone: "Cliquez ici ou glissez une image ici",
    btn_cancel: "Annuler",
    btn_insert: "Insérer",

    // Link Modal
    modal_link_title: "Ajouter un lien web",
    modal_link_title_label: "Titre / Description :",
    modal_link_title_placeholder: "ex. Dépôt GitHub ou Documentation",
    modal_link_url_label: "Adresse URL :",
    modal_link_url_placeholder: "https://example.com",
    btn_insert_link: "Insérer le lien",

    // MCP Modal
    mcp_modal_title: "Model Context Protocol (MCP) & Intégration IA",
    mcp_badge_active: "Serveur actif",
    mcp_badge_tools: "10 Outils",
    mcp_badge_sync: "Synchronisation directe 2 voies",
    mcp_tab_claude: "Claude Desktop",
    mcp_tab_ide: "Antigravity / Cursor",
    mcp_tab_tools: "Outils (10)",
    mcp_tab_test: "Test en direct",
    mcp_claude_desc: "Copiez cette configuration dans votre claude_desktop_config.json afin que Claude Desktop puisse lire, créer, déplacer des cartes et gérer vos mindmaps directement.",
    mcp_config_path_label: "Chemin de configuration :",
    mcp_claude_tip: "💡 Astuce : Redémarrez Claude Desktop après l'enregistrement. Claude aura immédiatement accès à kanban_get_board, kanban_create_card et toutes les mindmaps !",
    mcp_ide_desc: "Dans Google Antigravity, Cursor, Cline ou Windsurf, intégrez le serveur MCP comme serveur stdio local.",
    mcp_ide_tip: "Le serveur ne nécessite aucune dépendance npm externe et démarre en quelques millisecondes avec la bibliothèque standard de Node.js.",
    mcp_tools_desc: "Les 10 outils suivants sont à la disposition de l'IA. Chaque modification s'affiche en direct sur votre écran !",
    mcp_test_desc: "Testez l'interface MCP directement ici dans votre navigateur :",
    btn_copy: "📋 Copier",
    btn_copied: "✅ Copié !",
    btn_close: "Fermer",

    // Toasts
    toast_backup_downloaded: "Sauvegarde du projet téléchargée",
    toast_board_restored: "Tableau restauré avec succès !",
    toast_import_error: "Erreur d'importation : Le fichier contient une structure JSON non valide.",
    toast_changes_saved: "Modifications enregistrées",
    toast_node_removed: "Nœud supprimé",
    toast_connection_created: "Connexion créée",
    toast_export_downloaded: "Export du dessin téléchargé",
    toast_mcp_updated: "🤖 Tableau mis à jour via MCP / Disque !"
  }
};

const LANG_STORAGE_KEY = 'sunveil_selected_language';

class I18nManager {
  constructor() {
    this.currentLang = this.getInitialLanguage();
    this.listeners = [];
  }

  getInitialLanguage() {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && translations[saved]) {
      return saved;
    }
    // Auto-detect browser language
    const navLang = (navigator.language || 'de').slice(0, 2).toLowerCase();
    if (translations[navLang]) {
      return navLang;
    }
    return 'de';
  }

  t(key, params = {}) {
    const dict = translations[this.currentLang] || translations.de;
    let text = dict[key] || translations.de[key] || key;
    for (const [param, val] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), val);
    }
    return text;
  }

  setLanguage(lang) {
    if (!translations[lang]) return;
    this.currentLang = lang;
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang;

    // Apply translations to static DOM elements with data-i18n attributes
    this.updateDOM();

    // Notify any components that need to re-render
    for (const cb of this.listeners) {
      try {
        cb(this.currentLang);
      } catch (e) { }
    }
  }

  onChange(cb) {
    this.listeners.push(cb);
  }

  updateDOM() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // Titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.title = this.t(key);
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.placeholder = this.t(key);
      }
    });

    // Update active flag & code in dropdown
    const flagEl = document.querySelector('.lang-btn .lang-flag');
    const codeEl = document.querySelector('.lang-btn .lang-code');
    const flags = { de: '🇩🇪', en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷' };

    if (flagEl) flagEl.textContent = flags[this.currentLang] || '🌐';
    if (codeEl) codeEl.textContent = this.currentLang.toUpperCase();

    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-lang') === this.currentLang);
    });
  }
}

window.i18n = new I18nManager();
