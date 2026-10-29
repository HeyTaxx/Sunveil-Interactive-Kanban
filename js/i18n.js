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
    btn_liveshare: "Live Share",
    btn_liveshare_title: "Live Share — Echtzeit-Zusammenarbeit im Netzwerk",
    status_saved: "Gespeichert",
    status_saving: "Speichere...",
    status_saved_local: "Gespeichert (Lokal)",
    status_synced_mcp: "MCP / Disk synchronisiert",

    // Live Share Modal & Collaboration
    liveshare_modal_title: "🌐 Live Share — Echtzeit-Zusammenarbeit",
    liveshare_status_active: "Live Share Aktiv (Im Netzwerk verfügbar)",
    liveshare_status_connecting: "Verbinde mit Live Share...",
    liveshare_status_disabled: "Live Share Deaktiviert",
    liveshare_desc: "Teile diesen Link mit deinem Team im gleichen WLAN/Netzwerk. Alle Änderungen an Kanban-Karten, Mindmaps und Zeichnungen werden in Echtzeit synchronisiert!",
    liveshare_link_label: "Netzwerk-Link für Teammitglieder:",
    btn_copy_link: "Kopieren",
    copied: "Kopiert! ✓",
    btn_open_browser: "In neuem Tab / Browser öffnen",
    liveshare_mobile_title: "📱 Mobil mitarbeiten",
    liveshare_mobile_desc: "Einfach Kamera auf den QR-Code richten – die Sunveil App öffnet sich sofort im mobilen Browser ohne Installation.",
    liveshare_your_name: "Dein Name / Anzeigename:",
    liveshare_your_color: "Deine Team-Farbe:",
    liveshare_connected_users: "Verbundene Teilnehmer",
    liveshare_online_count: "{count} online",
    location_kanban: "Auf dem Kanban Board",
    location_mindmap: "In Mindmap: \"{title}\"",
    role_host: "Host",
    role_guest: "Gast",
    role_me: "Du",
    collaborator_generic: "Ein Teammitglied",
    toast_board_updated_by: "🔄 {name} hat das Board aktualisiert",

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
    toast_mcp_updated: "🤖 Board via MCP / Festplatte aktualisiert!",

    // GitHub Projects & Footer
    btn_github: "GitHub Projects",
    btn_github_title: "GitHub Projects Integration & Synchronisation",
    footer_made_with: "Made with",
    footer_install_btn: "Selber installieren",
    footer_gh_connect: "GitHub Projects verbinden",
    github_modal_title: "🐙 GitHub Projects Integration & 2-Wege Sync",
    gh_tab_connect: "Verbindung",
    gh_tab_sync: "Live-Sync & Steuerung",
    gh_tab_guide: "Anleitung",
    gh_desc_connect: "Verbinde Sunveil mit GitHub Projects v2. Alle Aufgaben, Issues und Pull Requests werden als Kanban-Karten geladen und Änderungen synchronisiert.",
    gh_label_token: "GitHub Personal Access Token (PAT):",
    btn_gh_verify: "Token prüfen",
    gh_label_owner_type: "Typ:",
    gh_label_owner_name: "Account / Org Name:",
    btn_gh_fetch_projects: "Projekte laden",
    gh_label_select_project: "GitHub Project v2 auswählen:",
    gh_label_select_field: "Status-Feld (Kanban-Spalten Zuordnung):",
    btn_gh_connect: "Projekt verbinden & Synchronisieren",
    btn_gh_disconnect: "Trennen",
    btn_gh_sync_now: "Alles synchronisieren",
    btn_gh_pull: "Von GitHub laden",
    btn_gh_push: "Zu GitHub senden",
    gh_auto_sync_title: "Hintergrund Auto-Sync",
    gh_auto_sync_desc: "Synchronisiert alle 30 Sekunden im Hintergrund & sofort bei Kartenverschiebungen",
    gh_activity_logs_label: "Sync-Aktivitäten & Protokoll:",
    install_modal_title: "Sunveil Interactive Kanban installieren",
    install_modal_subtitle: "Nutze Sunveil auf jedem Gerät: als eigenständige Desktop-App, Web-App oder auf Tablets & Smartphones.",
    install_opt_pwa_title: "1-Klick App Installation",
    install_opt_pwa_desc: "Direkt im Browser als eigenständige fensterbasierte App ohne Adressleiste installieren.",
    btn_install_app: "Jetzt als App installieren",
    install_opt_desktop_title: "Windows Desktop (.exe / cmd)",
    install_opt_desktop_desc: "Portable Version mit WebView2-Engine. Startet in Millisekunden ohne Installation über Start-Kanban.cmd oder Sunveil.exe.",
    btn_show_desktop_info: "Startdatei & Info",
    install_opt_cli_title: "Entwickler & Git",
    install_opt_cli_desc: "Quelloffen und vollständig anpassbar. Ausführen mit Node.js.",
    btn_copy_cmd: "Befehl kopieren",
    install_opt_mobile_title: "Mobile & Tablet (Ohne Installation)",
    install_opt_mobile_desc: "Auf iPad, Android-Tablet oder Smartphone einfach den Live Share QR-Code scannen und sofort mitarbeiten!",
    btn_open_qr: "QR-Code anzeigen",
    toast_app_installed: "Sunveil App erfolgreich installiert!",

    // Multi-Board & Workspaces
    workspace_select_title: "Workspaces & Boards",
    workspace_new_board: "+ Neues Board erstellen",
    workspace_modal_title: "Neues Board erstellen",
    workspace_name_label: "Board-Name:",
    workspace_color_label: "Farbe / Akzent:",
    workspace_template_label: "Vorlage:",
    workspace_template_blank: "Standard Kanban (Ideen, In Progress, Review, Done)",
    workspace_template_scrum: "Scrum Sprint (Backlog, Sprint, Testing, Done)",
    workspace_template_simple: "Einfache Aufgabenliste (To Do, In Progress, Done)",
    workspace_confirm_delete: "Möchtest du das Board \"{title}\" wirklich löschen?",
    workspace_btn_create: "Board anlegen",
    workspace_switch_success: "Zu Board \"{title}\" gewechselt",

    // Server Hosting & Security
    server_mode_badge: "Server-Modus",
    server_login_title: "🔐 Server-Anmeldung",
    server_setup_title: "🛡️ Server-Sicherheit einrichten",
    server_login_desc: "Dieser Sunveil-Server ist geschützt. Bitte gib das Passwort ein, um auf deine Boards zuzugreifen.",
    server_setup_desc: "Willkommen auf deinem neuen Sunveil Server! Bitte lege ein sicheres Admin-Passwort fest, um unberechtigten Zugriff zu verhindern.",
    server_password_label: "Passwort:",
    server_password_repeat: "Passwort wiederholen:",
    server_btn_login: "Anmelden",
    server_btn_setup: "Passwort speichern & Server starten",
    server_btn_logout: "Abmelden",
    server_rate_limited: "Zu viele Fehlversuche. Bitte warte {minutes} Minuten.",
    server_wrong_password: "Ungültiges Passwort.",
    server_password_mismatch: "Die Passwörter stimmen nicht überein."
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
    btn_liveshare: "Live Share",
    btn_liveshare_title: "Live Share — Real-time Collaboration on Local Network",
    status_saved: "Saved",
    status_saving: "Saving...",
    status_saved_local: "Saved (Local)",
    status_synced_mcp: "MCP / Disk Synced",

    // Live Share Modal & Collaboration
    liveshare_modal_title: "🌐 Live Share — Real-Time Collaboration",
    liveshare_status_active: "Live Share Active (Available on Network)",
    liveshare_status_connecting: "Connecting to Live Share...",
    liveshare_status_disabled: "Live Share Disabled",
    liveshare_desc: "Share this link with your team on the same Wi-Fi/network. All edits to Kanban cards, mindmaps, and sketches sync in real time!",
    liveshare_link_label: "Network link for collaborators:",
    btn_copy_link: "Copy Link",
    copied: "Copied! ✓",
    btn_open_browser: "Open in new browser tab",
    liveshare_mobile_title: "📱 Join on Mobile & Tablet",
    liveshare_mobile_desc: "Point your camera at the QR code — the Sunveil workspace opens instantly without installing an app.",
    liveshare_your_name: "Your Name / Display Name:",
    liveshare_your_color: "Your Team Color:",
    liveshare_connected_users: "Connected Collaborators",
    liveshare_online_count: "{count} online",
    location_kanban: "On Kanban Board",
    location_mindmap: "In Mindmap: \"{title}\"",
    role_host: "Host",
    role_guest: "Guest",
    role_me: "You",
    collaborator_generic: "A teammate",
    toast_board_updated_by: "🔄 {name} updated the board",

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
    toast_mcp_updated: "🤖 Board updated via MCP / Disk!",

    // GitHub Projects & Footer
    btn_github: "GitHub Projects",
    btn_github_title: "GitHub Projects Integration & Synchronization",
    footer_made_with: "Made with",
    footer_install_btn: "Install Sunveil",
    footer_gh_connect: "Connect GitHub Projects",
    github_modal_title: "🐙 GitHub Projects Integration & 2-Way Sync",
    gh_tab_connect: "Connection",
    gh_tab_sync: "Live Sync & Controls",
    gh_tab_guide: "Guide",
    gh_desc_connect: "Connect Sunveil with GitHub Projects v2. All tasks, issues, and pull requests are loaded as Kanban cards and changes are synced.",
    gh_label_token: "GitHub Personal Access Token (PAT):",
    btn_gh_verify: "Verify Token",
    gh_label_owner_type: "Type:",
    gh_label_owner_name: "Account / Org Name:",
    btn_gh_fetch_projects: "Fetch Projects",
    gh_label_select_project: "Select GitHub Project v2:",
    gh_label_select_field: "Status Field (Kanban Column Mapping):",
    btn_gh_connect: "Connect Project & Sync",
    btn_gh_disconnect: "Disconnect",
    btn_gh_sync_now: "Sync Everything Now",
    btn_gh_pull: "Pull from GitHub",
    btn_gh_push: "Push to GitHub",
    gh_auto_sync_title: "Background Auto-Sync",
    gh_auto_sync_desc: "Syncs every 30 seconds in the background and instantly when moving cards",
    gh_activity_logs_label: "Sync Activity & Logs:",
    install_modal_title: "Install Sunveil Interactive Kanban",
    install_modal_subtitle: "Use Sunveil on any device: as a standalone desktop app, web app, or on tablets & phones.",
    install_opt_pwa_title: "1-Click App Install",
    install_opt_pwa_desc: "Install directly from browser as a standalone app window without browser bars.",
    btn_install_app: "Install as App Now",
    install_opt_desktop_title: "Windows Desktop (.exe / cmd)",
    install_opt_desktop_desc: "Portable WebView2 edition. Boots in milliseconds without installation using Start-Kanban.cmd or Sunveil.exe.",
    btn_show_desktop_info: "Launcher & Details",
    install_opt_cli_title: "Developers & Git",
    install_opt_cli_desc: "Open source and fully extensible. Run using Node.js.",
    btn_copy_cmd: "Copy Command",
    install_opt_mobile_title: "Mobile & Tablets (No Install)",
    install_opt_mobile_desc: "Simply scan the Live Share QR code on your iPad, tablet, or smartphone to collaborate instantly!",
    btn_open_qr: "Show QR Code",
    toast_app_installed: "Sunveil App installed successfully!",

    // Multi-Board & Workspaces
    workspace_select_title: "Workspaces & Boards",
    workspace_new_board: "+ Create New Board",
    workspace_modal_title: "Create New Board",
    workspace_name_label: "Board Name:",
    workspace_color_label: "Color / Accent:",
    workspace_template_label: "Template:",
    workspace_template_blank: "Standard Kanban (Ideas, In Progress, Review, Done)",
    workspace_template_scrum: "Scrum Sprint (Backlog, Sprint, Testing, Done)",
    workspace_template_simple: "Simple Task List (To Do, In Progress, Done)",
    workspace_confirm_delete: "Are you sure you want to delete board \"{title}\"?",
    workspace_btn_create: "Create Board",
    workspace_switch_success: "Switched to board \"{title}\"",

    // Server Hosting & Security
    server_mode_badge: "Server Mode",
    server_login_title: "🔐 Server Login",
    server_setup_title: "🛡️ Server Security Setup",
    server_login_desc: "This Sunveil server is protected. Please enter the password to access your workspaces.",
    server_setup_desc: "Welcome to your Sunveil Server! Please set a secure admin password to protect your workspaces from unauthorized access.",
    server_password_label: "Password:",
    server_password_repeat: "Confirm Password:",
    server_btn_login: "Login",
    server_btn_setup: "Save Password & Start Server",
    server_btn_logout: "Logout",
    server_rate_limited: "Too many failed attempts. Please wait {minutes} minutes.",
    server_wrong_password: "Invalid password.",
    server_password_mismatch: "Passwords do not match."
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
    btn_liveshare: "Live Share",
    btn_liveshare_title: "Live Share — Colaboración en tiempo real en la red local",
    status_saved: "Guardado",
    status_saving: "Guardando...",
    status_saved_local: "Guardado (Local)",
    status_synced_mcp: "MCP / Disco sincronizado",

    // Live Share Modal & Collaboration
    liveshare_modal_title: "🌐 Live Share — Colaboración en tiempo real",
    liveshare_status_active: "Live Share Activo (Disponible en red local)",
    liveshare_status_connecting: "Conectando a Live Share...",
    liveshare_status_disabled: "Live Share Desactivado",
    liveshare_desc: "Comparte este enlace con tu equipo en la misma red Wi-Fi. Todos los cambios en tarjetas, mapas mentales y dibujos se sincronizan al instante.",
    liveshare_link_label: "Enlace de red para el equipo:",
    btn_copy_link: "Copiar",
    copied: "¡Copiado! ✓",
    btn_open_browser: "Abrir en el navegador",
    liveshare_mobile_title: "📱 Unirse desde el móvil",
    liveshare_mobile_desc: "Apunta la cámara al código QR: Sunveil se abre al instante en el navegador móvil sin instalar ninguna app.",
    liveshare_your_name: "Tu nombre / alias:",
    liveshare_your_color: "Tu color de equipo:",
    liveshare_connected_users: "Participantes conectados",
    liveshare_online_count: "{count} en línea",
    location_kanban: "En el tablero Kanban",
    location_mindmap: "En mapa mental: \"{title}\"",
    role_host: "Anfitrión",
    role_guest: "Invitado",
    role_me: "Tú",
    collaborator_generic: "Un compañero",
    toast_board_updated_by: "🔄 {name} actualizó el tablero",

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
    toast_mcp_updated: "🤖 ¡Tablero actualizado mediante MCP / Disco!",

    // GitHub Projects & Footer
    btn_github: "GitHub Projects",
    btn_github_title: "Integración y sincronización de GitHub Projects",
    footer_made_with: "Made with",
    footer_install_btn: "Instalar Sunveil",
    footer_gh_connect: "Conectar GitHub Projects",
    github_modal_title: "🐙 Integración con GitHub Projects & Sincronización",
    gh_tab_connect: "Conexión",
    gh_tab_sync: "Sincronización en vivo",
    gh_tab_guide: "Guía",
    gh_desc_connect: "Conecta Sunveil con GitHub Projects v2. Todas las tareas, issues y PRs se cargan como tarjetas Kanban.",
    gh_label_token: "GitHub Personal Access Token (PAT):",
    btn_gh_verify: "Verificar token",
    gh_label_owner_type: "Tipo:",
    gh_label_owner_name: "Cuenta / Organización:",
    btn_gh_fetch_projects: "Cargar proyectos",
    gh_label_select_project: "Seleccionar GitHub Project v2:",
    gh_label_select_field: "Campo de estado (Mapeo de columnas):",
    btn_gh_connect: "Conectar proyecto y sincronizar",
    btn_gh_disconnect: "Desconectar",
    btn_gh_sync_now: "Sincronizar todo",
    btn_gh_pull: "Traer de GitHub",
    btn_gh_push: "Enviar a GitHub",
    gh_auto_sync_title: "Sincronización automática de fondo",
    gh_auto_sync_desc: "Sincroniza cada 30 segundos en segundo plano y al mover tarjetas",
    gh_activity_logs_label: "Actividad y registro:",
    install_modal_title: "Instalar Sunveil Interactive Kanban",
    install_modal_subtitle: "Usa Sunveil en cualquier dispositivo: escritorio, web o móvil.",
    install_opt_pwa_title: "Instalación en 1 clic",
    install_opt_pwa_desc: "Instala directamente desde el navegador como una app independiente.",
    btn_install_app: "Instalar como aplicación",
    install_opt_desktop_title: "Windows Desktop (.exe / cmd)",
    install_opt_desktop_desc: "Versión portable de inicio instantáneo sin instalación.",
    btn_show_desktop_info: "Archivo ejecutable e info",
    install_opt_cli_title: "Desarrolladores y Git",
    install_opt_cli_desc: "Código abierto con Node.js.",
    btn_copy_cmd: "Copiar comando",
    install_opt_mobile_title: "Móvil y Tablet (Sin instalación)",
    install_opt_mobile_desc: "Escanea el código QR de Live Share y colabora al instante.",
    btn_open_qr: "Mostrar código QR",
    toast_app_installed: "¡Sunveil instalado con éxito!",

    // Multi-Board & Workspaces
    workspace_select_title: "Espacios y Tableros",
    workspace_new_board: "+ Crear nuevo tablero",
    workspace_modal_title: "Crear nuevo tablero",
    workspace_name_label: "Nombre del tablero:",
    workspace_color_label: "Color / Acento:",
    workspace_template_label: "Plantilla:",
    workspace_template_blank: "Kanban estándar (Ideas, En progreso, Revisión, Hecho)",
    workspace_template_scrum: "Scrum Sprint (Backlog, Sprint, Pruebas, Hecho)",
    workspace_template_simple: "Lista simple (Por hacer, En progreso, Hecho)",
    workspace_confirm_delete: "¿Seguro que quieres eliminar el tablero \"{title}\"?",
    workspace_btn_create: "Crear tablero",
    workspace_switch_success: "Cambiado al tablero \"{title}\"",

    // Server Hosting & Security
    server_mode_badge: "Modo Servidor",
    server_login_title: "🔐 Inicio de sesión en servidor",
    server_setup_title: "🛡️ Configuración de seguridad",
    server_login_desc: "Este servidor Sunveil está protegido. Introduce la contraseña para acceder a tus tableros.",
    server_setup_desc: "¡Bienvenido a tu servidor Sunveil! Configura una contraseña de administrador segura.",
    server_password_label: "Contraseña:",
    server_password_repeat: "Confirmar contraseña:",
    server_btn_login: "Iniciar sesión",
    server_btn_setup: "Guardar contraseña e iniciar servidor",
    server_btn_logout: "Cerrar sesión",
    server_rate_limited: "Demasiados intentos fallidos. Espera {minutes} minutos.",
    server_wrong_password: "Contraseña incorrecta.",
    server_password_mismatch: "Las contraseñas no coinciden."
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
    btn_liveshare: "Live Share",
    btn_liveshare_title: "Live Share — Collaboration en temps réel sur le réseau",
    status_saved: "Enregistré",
    status_saving: "Enregistrement...",
    status_saved_local: "Enregistré (Local)",
    status_synced_mcp: "MCP / Disque synchronisé",

    // Live Share Modal & Collaboration
    liveshare_modal_title: "🌐 Live Share — Collaboration en temps réel",
    liveshare_status_active: "Live Share Actif (Disponible sur le réseau)",
    liveshare_status_connecting: "Connexion à Live Share...",
    liveshare_status_disabled: "Live Share Désactivé",
    liveshare_desc: "Partagez ce lien avec votre équipe sur le même réseau Wi-Fi. Toutes les modifications des cartes, mindmaps et dessins sont synchronisées en temps réel !",
    liveshare_link_label: "Lien réseau pour les collaborateurs :",
    btn_copy_link: "Copier",
    copied: "Copié ! ✓",
    btn_open_browser: "Ouvrir dans le navigateur",
    liveshare_mobile_title: "📱 Rejoindre sur mobile",
    liveshare_mobile_desc: "Pointez votre appareil photo sur le code QR — Sunveil s'ouvre instantanément dans le navigateur mobile sans installation.",
    liveshare_your_name: "Votre nom d'affichage :",
    liveshare_your_color: "Votre couleur d'équipe :",
    liveshare_connected_users: "Participants connectés",
    liveshare_online_count: "{count} en ligne",
    location_kanban: "Sur le tableau Kanban",
    location_mindmap: "Dans la mindmap : \"{title}\"",
    role_host: "Hôte",
    role_guest: "Invité",
    role_me: "Vous",
    collaborator_generic: "Un collaborateur",
    toast_board_updated_by: "🔄 {name} a mis à jour le tableau",

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
    toast_mcp_updated: "🤖 Tableau mis à jour via MCP / Disque !",

    // GitHub Projects & Footer
    btn_github: "GitHub Projects",
    btn_github_title: "Intégration & synchronisation GitHub Projects",
    footer_made_with: "Made with",
    footer_install_btn: "Installer Sunveil",
    footer_gh_connect: "Connecter GitHub Projects",
    github_modal_title: "🐙 Intégration GitHub Projects & Synchronisation",
    gh_tab_connect: "Connexion",
    gh_tab_sync: "Synchronisation & Contrôles",
    gh_tab_guide: "Guide",
    gh_desc_connect: "Connectez Sunveil à GitHub Projects v2. Vos tâches, issues et pull requests sont synchronisées.",
    gh_label_token: "GitHub Personal Access Token (PAT) :",
    btn_gh_verify: "Vérifier le token",
    gh_label_owner_type: "Type :",
    gh_label_owner_name: "Nom du compte / Organisation :",
    btn_gh_fetch_projects: "Charger les projets",
    gh_label_select_project: "Sélectionner GitHub Project v2 :",
    gh_label_select_field: "Champ de statut (Colonnes Kanban) :",
    btn_gh_connect: "Connecter et synchroniser",
    btn_gh_disconnect: "Déconnecter",
    btn_gh_sync_now: "Tout synchroniser",
    btn_gh_pull: "Importer de GitHub",
    btn_gh_push: "Envoyer vers GitHub",
    gh_auto_sync_title: "Synchronisation automatique",
    gh_auto_sync_desc: "Synchronise toutes les 30s en arrière-plan et lors du déplacement des cartes",
    gh_activity_logs_label: "Journal d'activité :",
    install_modal_title: "Installer Sunveil Interactive Kanban",
    install_modal_subtitle: "Utilisez Sunveil sur n'importe quel appareil : application de bureau, web ou tablette.",
    install_opt_pwa_title: "Installation en 1 clic",
    install_opt_pwa_desc: "Installez directement depuis le navigateur comme une application autonome.",
    btn_install_app: "Installer l'application",
    install_opt_desktop_title: "Windows Desktop (.exe / cmd)",
    install_opt_desktop_desc: "Version portable ultra-rapide sans installation requise.",
    btn_show_desktop_info: "Fichier de lancement & info",
    install_opt_cli_title: "Développeurs & Git",
    install_opt_cli_desc: "Open source et personnalisable avec Node.js.",
    btn_copy_cmd: "Copier la commande",
    install_opt_mobile_title: "Mobile & Tablette (Sans installation)",
    install_opt_mobile_desc: "Scannez le QR code Live Share sur votre iPad ou smartphone pour collaborer immédiatement !",
    btn_open_qr: "Afficher le QR code",
    toast_app_installed: "Application Sunveil installée avec succès !",

    // Multi-Board & Workspaces
    workspace_select_title: "Espaces et Tableaux",
    workspace_new_board: "+ Créer un tableau",
    workspace_modal_title: "Créer un nouveau tableau",
    workspace_name_label: "Nom du tableau :",
    workspace_color_label: "Couleur / Accent :",
    workspace_template_label: "Modèle :",
    workspace_template_blank: "Kanban standard (Idées, En cours, Révision, Terminé)",
    workspace_template_scrum: "Scrum Sprint (Backlog, Sprint, Tests, Terminé)",
    workspace_template_simple: "Liste simple (À faire, En cours, Terminé)",
    workspace_confirm_delete: "Voulez-vous vraiment supprimer le tableau \"{title}\" ?",
    workspace_btn_create: "Créer le tableau",
    workspace_switch_success: "Passé au tableau \"{title}\"",

    // Server Hosting & Security
    server_mode_badge: "Mode Serveur",
    server_login_title: "🔐 Connexion au serveur",
    server_setup_title: "🛡️ Sécurité du serveur",
    server_login_desc: "Ce serveur Sunveil est protégé. Veuillez saisir le mot de passe pour accéder à vos tableaux.",
    server_setup_desc: "Bienvenue sur votre serveur Sunveil ! Veuillez définir un mot de passe administrateur sécurisé.",
    server_password_label: "Mot de passe :",
    server_password_repeat: "Confirmer le mot de passe :",
    server_btn_login: "Se connecter",
    server_btn_setup: "Enregistrer le mot de passe & démarrer",
    server_btn_logout: "Se déconnecter",
    server_rate_limited: "Trop de tentatives infructueuses. Veuillez attendre {minutes} minutes.",
    server_wrong_password: "Mot de passe incorrect.",
    server_password_mismatch: "Les mots de passe ne correspondent pas."
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
    return 'en';
  }

  t(key, params = {}) {
    const dict = translations[this.currentLang] || translations.en;
    let text = dict[key] || translations.en[key] || key;
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
