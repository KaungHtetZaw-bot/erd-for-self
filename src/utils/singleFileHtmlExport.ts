import { INITIAL_MODELS, INITIAL_EDGES, INITIAL_ENUMS, RAW_PRISMA_SCHEMA } from '../data/schemaData';
import { SAMPLE_ECOMMERCE_SQL, SAMPLE_SAAS_BILLING_SQL, SAMPLE_SOCIAL_PRISMA } from './schemaParsers';

export function generateSingleFileHtml(): string {
  const modelsJson = JSON.stringify(INITIAL_MODELS);
  const edgesJson = JSON.stringify(INITIAL_EDGES);
  const enumsJson = JSON.stringify(INITIAL_ENUMS);
  const salonPrismaEscaped = JSON.stringify(RAW_PRISMA_SCHEMA);
  const ecommerceSqlEscaped = JSON.stringify(SAMPLE_ECOMMERCE_SQL);
  const saasSqlEscaped = JSON.stringify(SAMPLE_SAAS_BILLING_SQL);
  const socialPrismaEscaped = JSON.stringify(SAMPLE_SOCIAL_PRISMA);

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prisma & SQL ERD Studio - Interactive Visualizer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      user-select: none;
    }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    
    /* Responsive Header */
    header {
      height: 54px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      gap: 12px;
      z-index: 50;
      position: relative;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      font-size: 14.5px;
      color: #fff;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .brand-icon {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: linear-gradient(135deg, #e2b616, #b45309);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0f172a;
      font-weight: 900;
      font-size: 13px;
    }
    .format-badge {
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .format-badge.prisma {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .header-center {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      max-width: 480px;
      justify-content: center;
    }
    .search-box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 6px 10px;
      color: #fff;
      font-size: 12px;
      width: 100%;
      max-width: 220px;
      outline: none;
      transition: max-width 0.2s ease, border-color 0.2s;
    }
    .search-box:focus { border-color: #e2b616; max-width: 280px; }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    @media (max-width: 640px) {
      .brand span.full-title { display: none; }
      .brand span.short-title { display: inline; }
      .header-actions .btn-desktop { display: none !important; }
      .search-box { max-width: 120px; font-size: 11px; padding: 5px 8px; }
      .search-box:focus { max-width: 150px; }
    }
    @media (min-width: 641px) {
      .brand span.short-title { display: none; }
    }

    /* Canvas */
    #canvas-container {
      width: 100%;
      height: calc(100vh - 54px);
      position: relative;
      overflow: hidden;
      background-color: #0f172a;
      background-image: radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px);
      background-size: 24px 24px;
      cursor: grab;
    }
    #canvas-container.panning { cursor: grabbing; }

    #viewport {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
      will-change: transform;
    }

    svg#connections {
      position: absolute;
      top: 0;
      left: 0;
      width: 6000px;
      height: 6000px;
      pointer-events: none;
      z-index: 10;
      overflow: visible;
    }

    /* Model Cards */
    .model-card {
      position: absolute;
      width: 310px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid #334155;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      z-index: 20;
      cursor: grab;
      transition: box-shadow 0.08s ease, border-color 0.08s ease;
    }
    .model-card:hover {
      border-color: #475569;
    }
    .model-card.dragging {
      cursor: grabbing !important;
      border-color: #e2b616 !important;
      box-shadow: 0 0 0 2px #e2b616, 0 16px 36px rgba(226, 182, 22, 0.35) !important;
      z-index: 40 !important;
      transform: scale(1.01);
    }
    .model-card.selected {
      border-color: #e2b616;
      box-shadow: 0 0 0 2px #e2b616, 0 12px 28px rgba(226, 182, 22, 0.2);
      z-index: 30;
    }

    .card-header {
      padding: 10px 14px;
      background: rgba(10, 15, 29, 0.85);
      border-bottom: 1px solid #1e293b;
      border-radius: 12px 12px 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-title {
      font-weight: 700;
      font-size: 13.5px;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .domain-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }

    .fields-list {
      max-height: 320px;
      overflow-y: auto;
      font-size: 11.5px;
    }
    .field-row {
      padding: 6px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(51, 65, 85, 0.3);
    }
    .field-row:last-child { border-bottom: none; }
    .field-row:hover { background: rgba(30, 41, 59, 0.4); }
    .field-row.pk { background: rgba(226, 182, 22, 0.08); color: #fef08a; font-weight: 600; }
    .field-row.fk { background: rgba(56, 189, 248, 0.08); color: #7dd3fc; font-weight: 500; }

    .badge-pk {
      color: #e2b616;
      font-weight: 700;
      font-size: 9.5px;
      margin-right: 6px;
    }
    .badge-fk {
      color: #38bdf8;
      font-weight: 700;
      font-size: 9.5px;
      margin-right: 6px;
    }

    .card-footer {
      padding: 6px 12px;
      background: rgba(10, 15, 29, 0.6);
      border-top: 1px solid #1e293b;
      border-radius: 0 0 12px 12px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Floating Toolbar */
    .toolbar {
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 50;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .tool-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 11.5px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.15s, border-color 0.15s;
    }
    .tool-btn:hover { background: #334155; color: #fff; }
    .btn-accent {
      background: #e2b616;
      color: #0f172a;
      border-color: #ca8a04;
    }
    .btn-accent:hover { background: #facc15; }
    .btn-import {
      background: rgba(226, 182, 22, 0.15);
      color: #fef08a;
      border-color: rgba(226, 182, 22, 0.4);
    }
    .btn-import:hover {
      background: rgba(226, 182, 22, 0.25);
    }

    /* Detail Drawer */
    #drawer {
      position: fixed;
      top: 54px;
      right: -460px;
      width: 440px;
      height: calc(100vh - 54px);
      background: rgba(10, 15, 29, 0.96);
      backdrop-filter: blur(16px);
      border-left: 1px solid #334155;
      z-index: 60;
      transition: right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-shadow: -10px 0 30px rgba(0,0,0,0.5);
    }
    #drawer.open { right: 0; }
    .drawer-header {
      padding: 16px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .drawer-content {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    .code-block {
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 12px;
      font-size: 11px;
      color: #38bdf8;
      overflow-x: auto;
      line-height: 1.6;
    }

    /* Import Schema Modal */
    #modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }
    #modal-overlay.open { display: flex; }
    .modal-box {
      width: 800px;
      max-width: 100%;
      max-height: 90vh;
      background: #0b1120;
      border: 1px solid #334155;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);
    }
    .modal-header {
      padding: 16px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-body {
      padding: 16px;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .modal-footer {
      padding: 14px 16px;
      border-top: 1px solid #1e293b;
      background: #080d1a;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    textarea#schema-input {
      width: 100%;
      height: 320px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 12px;
      color: #f8fafc;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      outline: none;
      resize: vertical;
    }
    textarea#schema-input:focus { border-color: #e2b616; }
  </style>
</head>
<body>

  <!-- Top Bar -->
  <header>
    <div class="brand">
      <div class="brand-icon">P</div>
      <span class="full-title">Prisma & SQL ERD Studio</span>
      <span class="short-title">ERD Studio</span>
      <span id="active-format-badge" class="format-badge prisma">PRISMA</span>
    </div>

    <div class="header-center">
      <input type="text" id="search" class="search-box" placeholder="Search tables & columns..." />
    </div>

    <div class="header-actions">
      <button class="tool-btn btn-import" id="btn-import-modal">Import / Paste</button>
      <button class="tool-btn btn-desktop" id="btn-grid">Auto Grid</button>
      <button class="tool-btn btn-accent" id="btn-reset">Reset</button>
    </div>
  </header>

  <!-- Interactive Canvas Container -->
  <div id="canvas-container">
    <div id="viewport">
      <!-- SVG dynamic bezier relationships -->
      <svg id="connections">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#e2b616" />
          </marker>
        </defs>
        <g id="lines-group"></g>
      </svg>

      <!-- Model Cards container -->
      <div id="cards-container"></div>
    </div>
  </div>

  <!-- Floating Canvas Controls -->
  <div class="toolbar">
    <button class="tool-btn" id="zoom-in">+</button>
    <span id="zoom-level" class="font-mono" style="font-size:12px; min-width:40px; text-align:center;">75%</span>
    <button class="tool-btn" id="zoom-out">-</button>
    <button class="tool-btn" id="btn-fit">Fit Screen</button>
  </div>

  <!-- Detail Drawer -->
  <div id="drawer">
    <div class="drawer-header">
      <div>
        <h3 id="drawer-title" style="font-size:16px; font-weight:700;">Model</h3>
        <p id="drawer-domain" style="font-size:11px; color:#94a3b8; margin-top:2px;"></p>
      </div>
      <button class="tool-btn" id="close-drawer">&times;</button>
    </div>
    <div class="drawer-content">
      <div id="drawer-description" style="font-size:12px; color:#cbd5e1; margin-bottom:14px; line-height:1.5;"></div>
      <h4 style="font-size:12px; font-weight:700; color:#e2e8f0; margin-bottom:8px;">RELATIONSHIPS</h4>
      <div id="drawer-relations" style="font-size:12px; margin-bottom:16px;"></div>
      <h4 style="font-size:12px; font-weight:700; color:#e2e8f0; margin-bottom:8px;">COLUMNS BREAKDOWN</h4>
      <div id="drawer-columns" style="font-size:11.5px; margin-bottom:16px;"></div>
      <h4 style="font-size:12px; font-weight:700; color:#e2e8f0; margin-bottom:8px;">DEFINITION</h4>
      <pre class="code-block font-mono" id="drawer-code"></pre>
    </div>
  </div>

  <!-- Import / Paste Schema Modal -->
  <div id="modal-overlay">
    <div class="modal-box">
      <div class="modal-header">
        <div>
          <h3 style="font-size:15px; font-weight:700;">Import / Paste Database Schema</h3>
          <p style="font-size:11.5px; color:#94a3b8;">Supports Prisma (.prisma) and SQL DDL (.sql / MySQL / PostgreSQL / SQLite)</p>
        </div>
        <button class="tool-btn" id="close-modal">&times;</button>
      </div>

      <div class="modal-body">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <span style="color:#94a3b8;">Preset:</span>
            <select id="preset-selector" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:6px; padding:4px 8px; font-size:11.5px; outline:none;">
              <option value="salon">Salon & Spa (Prisma - 22 Models)</option>
              <option value="ecommerce">E-Commerce & Orders (SQL DDL - 9 Tables)</option>
              <option value="saas">SaaS & Subscriptions (SQL DDL - 7 Tables)</option>
              <option value="social">Social Media (Prisma - 7 Models)</option>
              <option value="custom">Paste / Custom...</option>
            </select>
          </div>

          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <span style="color:#94a3b8;">Format:</span>
            <select id="format-selector" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:6px; padding:4px 8px; font-size:11.5px; outline:none;">
              <option value="auto">Auto-Detect</option>
              <option value="prisma">Prisma (.prisma)</option>
              <option value="sql">SQL DDL (.sql)</option>
            </select>
          </div>
        </div>

        <textarea id="schema-input" placeholder="Paste CREATE TABLE ... or model ... { } here..."></textarea>
        <div id="modal-error" style="display:none; color:#f87171; font-size:12px; padding:8px; background:rgba(239, 68, 68, 0.1); border-radius:6px; border:1px solid rgba(239,68,68,0.3);"></div>
      </div>

      <div class="modal-footer">
        <span style="font-size:11px; color:#94a3b8;" id="modal-char-count">0 characters</span>
        <div style="display:flex; gap:8px;">
          <button class="tool-btn" id="cancel-modal">Cancel</button>
          <button class="tool-btn btn-accent" id="btn-parse-schema">Parse & Visualize</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const presets = {
      salon: ${salonPrismaEscaped},
      ecommerce: ${ecommerceSqlEscaped},
      saas: ${saasSqlEscaped},
      social: ${socialPrismaEscaped}
    };

    let models = ${modelsJson};
    let edges = ${edgesJson};
    let currentFormat = 'prisma';

    let panX = 80;
    let panY = 40;
    let zoom = 0.75;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;
    let startMouseX = 0, startMouseY = 0;

    let draggingModel = null;
    let dragOffsetX = 0, dragOffsetY = 0;
    let selectedModel = null;
    let hoveredEdgeId = null;

    const container = document.getElementById('canvas-container');
    const viewport = document.getElementById('viewport');
    const cardsContainer = document.getElementById('cards-container');
    const linesGroup = document.getElementById('lines-group');
    const zoomLevelEl = document.getElementById('zoom-level');
    const drawer = document.getElementById('drawer');
    const modal = document.getElementById('modal-overlay');
    const schemaInput = document.getElementById('schema-input');
    const formatBadge = document.getElementById('active-format-badge');

    // Dual Parser in Vanilla JS
    function parsePrisma(code) {
      const parsedModels = [];
      const parsedEdges = [];
      const modelRegex = /model\\s+([A-Za-z0-9_]+)\\s*\\{([^}]+)\\}/g;
      let m;
      let idx = 0;

      while ((m = modelRegex.exec(code)) !== null) {
        const name = m[1];
        const body = m[2];
        const fields = [];
        const lines = body.split('\\n');

        lines.forEach(raw => {
          const line = raw.trim();
          if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('@@')) return;
          const parts = line.split(/\\s+/);
          if (parts.length < 2) return;
          const fieldName = parts[0];
          const rawType = parts[1];
          const isPk = line.includes('@id');
          const isFk = line.includes('@relation');

          fields.push({
            name: fieldName,
            type: rawType,
            isId: isPk,
            isOptional: rawType.endsWith('?'),
            isRelation: isFk
          });

          // Extract relation
          if (isFk) {
            const fMatch = line.match(/fields:\\s*\\[([^\\]]+)\\]/);
            const rMatch = line.match(/references:\\s*\\[([^\\]]+)\\]/);
            if (fMatch && rMatch) {
              const fromCol = fMatch[1].trim();
              const toCol = rMatch[1].trim();
              parsedEdges.push({
                id: name + '-' + rawType.replace(/[?\\[\\]]/g, '') + '-' + fromCol,
                sourceModel: name,
                sourceField: fromCol,
                targetModel: rawType.replace(/[?\\[\\]]/g, ''),
                targetField: toCol,
                cardinality: line.includes('@unique') ? '1:1' : '1:N'
              });
            }
          }
        });

        parsedModels.push({
          name: name,
          domain: 'Entities',
          domainColor: '#38bdf8',
          description: 'Model ' + name,
          fields: fields,
          x: 80 + (idx % 4) * 350,
          y: 80 + Math.floor(idx / 4) * 400
        });
        idx++;
      }
      return { models: parsedModels, edges: parsedEdges };
    }

    function parseSql(code) {
      const parsedModels = [];
      const parsedEdges = [];
      const cleanSql = code.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '').replace(/--.*$/gm, '');
      const createTableRegex = /CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:[\`"\[]?([A-Za-z0-9_]+)[\`"\]]?\\.)?[\`"\[]?([A-Za-z0-9_]+)[\`"\]]?\\s*\\(([\\s\\S]*?)\\)(?:;|\\s*$)/gi;
      let m;
      let idx = 0;

      while ((m = createTableRegex.exec(cleanSql)) !== null) {
        const rawName = m[2];
        const body = m[3];
        const modelName = rawName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        const fields = [];
        const tablePks = [];

        // Detect table-level PK & FK
        const statements = body.split(',');
        statements.forEach(stmt => {
          const s = stmt.trim();
          const pkM = s.match(/PRIMARY\\s+KEY\\s*\\(([^)]+)\\)/i);
          if (pkM) {
            tablePks.push(...pkM[1].split(',').map(c => c.replace(/[\`"\[\]\\s]/g, '')));
          }
          const fkM = s.match(/FOREIGN\\s+KEY\\s*\\(([^)]+)\\)\\s+REFERENCES\\s+[\`"\[]?([A-Za-z0-9_]+)[\`"\]]?\\s*\\(([^)]+)\\)/i);
          if (fkM) {
            const fromCol = fkM[1].replace(/[\`"\[\]\\s]/g, '');
            const targetRaw = fkM[2].replace(/[\`"\[\]\\s]/g, '');
            const toCol = fkM[3].replace(/[\`"\[\]\\s]/g, '');
            const targetModel = targetRaw.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
            parsedEdges.push({
              id: 'fk-' + modelName + '-' + targetModel + '-' + fromCol,
              sourceModel: modelName,
              sourceField: fromCol,
              targetModel: targetModel,
              targetField: toCol,
              cardinality: '1:N'
            });
          }
        });

        // Column definitions
        statements.forEach(stmt => {
          const s = stmt.trim();
          if (/^(?:CONSTRAINT|PRIMARY\\s+KEY|FOREIGN\\s+KEY|KEY|INDEX|UNIQUE\\s+KEY)/i.test(s)) return;
          const colM = s.match(/^[\`"\[]?([A-Za-z0-9_]+)[\`"\]]?\\s+([A-Za-z0-9_]+(?:\\([^)]+\\))?)(.*)$/i);
          if (!colM) return;
          const colName = colM[1];
          const rawType = colM[2].toUpperCase();
          const rest = colM[3] || '';
          const isPk = /PRIMARY\\s+KEY/i.test(rest) || tablePks.includes(colName);
          const isFk = /REFERENCES/i.test(rest);

          fields.push({
            name: colName,
            type: rawType,
            isId: isPk,
            isOptional: !/NOT\\s+NULL/i.test(rest) && !isPk,
            isRelation: isFk
          });

          if (isFk) {
            const inlineFk = rest.match(/REFERENCES\\s+[\`"\[]?([A-Za-z0-9_]+)[\`"\]]?\\s*(?:\\(([^)]+)\\))?/i);
            if (inlineFk) {
              const targetRaw = inlineFk[1];
              const toCol = inlineFk[2] ? inlineFk[2].replace(/[\`"\[\]\\s]/g, '') : 'id';
              const targetModel = targetRaw.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
              parsedEdges.push({
                id: 'inline-fk-' + modelName + '-' + targetModel + '-' + colName,
                sourceModel: modelName,
                sourceField: colName,
                targetModel: targetModel,
                targetField: toCol,
                cardinality: '1:N'
              });
            }
          }
        });

        parsedModels.push({
          name: modelName,
          domain: 'Tables',
          domainColor: '#38bdf8',
          description: 'SQL Table ' + rawName,
          fields: fields,
          x: 80 + (idx % 4) * 350,
          y: 80 + Math.floor(idx / 4) * 400
        });
        idx++;
      }
      return { models: parsedModels, edges: parsedEdges };
    }

    function updateTransform() {
      viewport.style.transform = 'translate3d(' + panX + 'px, ' + panY + 'px, 0) scale(' + zoom + ')';
      zoomLevelEl.textContent = Math.round(zoom * 100) + '%';
    }

    function renderCards() {
      cardsContainer.innerHTML = '';
      models.forEach(m => {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.id = 'card-' + m.name;
        card.style.transform = 'translate3d(' + m.x + 'px, ' + m.y + 'px, 0)';

        let fieldsHtml = '';
        m.fields.forEach(f => {
          const isPk = f.isId;
          const isFk = f.isRelation || edges.some(e => e.sourceModel === m.name && e.sourceField === f.name);
          const cls = isPk ? 'field-row pk font-mono' : isFk ? 'field-row fk font-mono' : 'field-row font-mono';
          const badge = isPk ? '<span class="badge-pk">PK</span>' : isFk ? '<span class="badge-fk">FK</span>' : '<span style="color:#64748b; margin-right:6px;">•</span>';
          fieldsHtml += '<div class="' + cls + '"><div>' + badge + f.name + (f.isOptional ? '?' : '') + '</div><div style="color:#94a3b8;">' + f.type + '</div></div>';
        });

        card.innerHTML = 
          '<div class="card-header">' +
            '<div class="card-title"><div class="domain-dot" style="background:' + (m.domainColor || '#38bdf8') + '"></div>' + m.name + '</div>' +
            '<span class="font-mono" style="font-size:11px; color:#94a3b8;">' + m.fields.length + '</span>' +
          '</div>' +
          '<div class="fields-list">' + fieldsHtml + '</div>' +
          '<div class="card-footer">' +
            '<span>' + (m.domain || 'Entities') + '</span>' +
            '<span style="cursor:pointer; color:#38bdf8;" class="inspect-btn">Inspect</span>' +
          '</div>';

        card.addEventListener('mousedown', (e) => {
          if (e.target.classList.contains('inspect-btn')) {
            openDrawer(m);
            return;
          }
          if (e.button !== 0) return;
          e.stopPropagation();

          draggingModel = m;
          card.classList.add('dragging');

          // EXACT zoom-compensated pointer math
          const pointerCanvasX = (e.clientX - panX) / zoom;
          const pointerCanvasY = (e.clientY - panY) / zoom;
          dragOffsetX = pointerCanvasX - m.x;
          dragOffsetY = pointerCanvasY - m.y;
        });

        card.addEventListener('click', () => {
          selectModel(m);
        });

        cardsContainer.appendChild(card);
      });
    }

    function renderLines() {
      const modelMap = {};
      models.forEach(m => modelMap[m.name] = m);

      let svgHtml = '';
      edges.forEach(e => {
        const s = modelMap[e.sourceModel];
        const t = modelMap[e.targetModel];
        if (!s || !t) return;

        const sCard = document.getElementById('card-' + s.name);
        const tCard = document.getElementById('card-' + t.name);
        const sH = sCard ? sCard.offsetHeight : 240;
        const tH = tCard ? tCard.offsetHeight : 240;
        const w = 310;

        let sx, sy, tx, ty, c1x, c1y, c2x, c2y;
        const sCenter = s.x + w / 2;
        const tCenter = t.x + w / 2;

        if (t.x >= s.x + w - 30) {
          sx = s.x + w; sy = s.y + 60;
          tx = t.x; ty = t.y + 45;
          const curvature = Math.max(50, Math.min(220, Math.abs(tx - sx) * 0.55));
          c1x = sx + curvature; c1y = sy;
          c2x = tx - curvature; c2y = ty;
        } else if (s.x >= t.x + w - 30) {
          sx = s.x; sy = s.y + 60;
          tx = t.x + w; ty = t.y + 45;
          const curvature = Math.max(50, Math.min(220, Math.abs(tx - sx) * 0.55));
          c1x = sx - curvature; c1y = sy;
          c2x = tx + curvature; c2y = ty;
        } else {
          sx = s.x + (sCenter <= tCenter ? 0 : w); sy = s.y + 60;
          tx = t.x + (sCenter <= tCenter ? w : 0); ty = t.y + 45;
          const offset = 70;
          c1x = sx + (sCenter <= tCenter ? -offset : offset); c1y = sy;
          c2x = tx + (sCenter <= tCenter ? offset : -offset); c2y = ty;
        }

        const pathD = 'M ' + sx + ' ' + sy + ' C ' + c1x + ' ' + c1y + ', ' + c2x + ' ' + c2y + ', ' + tx + ' ' + ty;
        const isHovered = hoveredEdgeId === e.id;
        const isConnected = draggingModel && (draggingModel.name === s.name || draggingModel.name === t.name);
        const isSelected = selectedModel && (selectedModel.name === s.name || selectedModel.name === t.name);

        const strokeColor = isHovered || isConnected ? '#e2b616' : isSelected ? '#38bdf8' : '#334155';
        const strokeW = isHovered ? '3.5' : isConnected || isSelected ? '2.5' : '1.3';
        const marker = isHovered || isConnected ? 'url(#arrow-active)' : 'url(#arrow)';

        svgHtml += 
          '<g data-edge="' + e.id + '" style="cursor:pointer;" onmouseenter="setHoveredEdge(\\'' + e.id + '\\')" onmouseleave="setHoveredEdge(null)">' +
            '<path d="' + pathD + '" fill="none" stroke="transparent" stroke-width="22" />' +
            '<path d="' + pathD + '" fill="none" stroke="' + strokeColor + '" stroke-width="' + strokeW + '" marker-end="' + marker + '" />' +
            '<circle cx="' + sx + '" cy="' + sy + '" r="' + (isHovered ? 4.5 : 3) + '" fill="' + strokeColor + '" />' +
            '<circle cx="' + tx + '" cy="' + ty + '" r="' + (isHovered ? 4.5 : 3) + '" fill="' + strokeColor + '" />' +
          '</g>';
      });

      linesGroup.innerHTML = svgHtml;
    }

    window.setHoveredEdge = function(id) {
      hoveredEdgeId = id;
      renderLines();
    };

    function selectModel(m) {
      selectedModel = m;
      document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
      const card = document.getElementById('card-' + m.name);
      if (card) card.classList.add('selected');
      renderLines();
    }

    function openDrawer(m) {
      selectModel(m);
      document.getElementById('drawer-title').textContent = m.name;
      document.getElementById('drawer-domain').textContent = m.domain || 'Entities';
      document.getElementById('drawer-description').textContent = m.description || '';

      const rels = edges.filter(e => e.sourceModel === m.name || e.targetModel === m.name);
      let relsHtml = '';
      rels.forEach(r => {
        relsHtml += '<div style="padding:6px; background:#1e293b; border-radius:6px; margin-bottom:4px;">' + r.sourceModel + ' ➔ ' + r.targetModel + ' (' + (r.cardinality || '1:N') + ')</div>';
      });
      document.getElementById('drawer-relations').innerHTML = relsHtml || '<em>No relationships</em>';

      let colsHtml = '';
      m.fields.forEach(f => {
        colsHtml += '<div style="padding:4px 0; border-bottom:1px solid #1e293b; display:flex; justify-content:space-between;"><span>' + (f.isId ? '[PK] ' : '') + f.name + '</span><span style="color:#94a3b8;">' + f.type + '</span></div>';
      });
      document.getElementById('drawer-columns').innerHTML = colsHtml;

      let code = (currentFormat === 'sql' ? 'CREATE TABLE ' + (m.tableName || m.name) : 'model ' + m.name) + ' {\\n';
      m.fields.forEach(f => {
        code += '  ' + f.name + ' ' + f.type + (f.isId ? ' PRIMARY KEY' : '') + '\\n';
      });
      code += '}';
      document.getElementById('drawer-code').textContent = code;

      drawer.classList.add('open');
    }

    document.getElementById('close-drawer').addEventListener('click', () => {
      drawer.classList.remove('open');
    });

    // Background Canvas Panning
    container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.model-card') || e.target.closest('button')) return;
      isPanning = true;
      container.classList.add('panning');
      startPanX = panX;
      startPanY = panY;
      startMouseX = e.clientX;
      startMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (isPanning) {
        panX = startPanX + (e.clientX - startMouseX);
        panY = startPanY + (e.clientY - startMouseY);
        updateTransform();
      } else if (draggingModel) {
        const curCanvasX = (e.clientX - panX) / zoom;
        const curCanvasY = (e.clientY - panY) / zoom;
        draggingModel.x = Math.round(curCanvasX - dragOffsetX);
        draggingModel.y = Math.round(curCanvasY - dragOffsetY);

        const card = document.getElementById('card-' + draggingModel.name);
        if (card) {
          card.style.transform = 'translate3d(' + draggingModel.x + 'px, ' + draggingModel.y + 'px, 0)';
        }
        renderLines();
      }
    });

    window.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        container.classList.remove('panning');
      }
      if (draggingModel) {
        const card = document.getElementById('card-' + draggingModel.name);
        if (card) card.classList.remove('dragging');
        draggingModel = null;
        renderLines();
      }
    });

    // Zoom on wheel
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      const newZoom = Math.min(2.5, Math.max(0.25, zoom * zoomFactor));

      panX = mouseX - (mouseX - panX) * (newZoom / zoom);
      panY = mouseY - (mouseY - panY) * (newZoom / zoom);
      zoom = newZoom;
      updateTransform();
    });

    // Controls
    document.getElementById('zoom-in').addEventListener('click', () => {
      zoom = Math.min(2.5, zoom * 1.15);
      updateTransform();
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
      zoom = Math.max(0.25, zoom * 0.85);
      updateTransform();
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      panX = 80;
      panY = 40;
      zoom = 0.75;
      updateTransform();
    });
    document.getElementById('btn-fit').addEventListener('click', () => {
      panX = 120;
      panY = 60;
      zoom = 0.55;
      updateTransform();
    });
    document.getElementById('btn-grid').addEventListener('click', () => {
      models.forEach((m, i) => {
        m.x = 80 + (i % 4) * 350;
        m.y = 80 + Math.floor(i / 4) * 400;
        const card = document.getElementById('card-' + m.name);
        if (card) card.style.transform = 'translate3d(' + m.x + 'px, ' + m.y + 'px, 0)';
      });
      renderLines();
    });

    // Search filter
    document.getElementById('search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      models.forEach(m => {
        const card = document.getElementById('card-' + m.name);
        if (!card) return;
        const match = !q || m.name.toLowerCase().includes(q) || m.fields.some(f => f.name.toLowerCase().includes(q));
        card.style.opacity = match ? '1' : '0.2';
      });
    });

    // Import Modal triggers
    document.getElementById('btn-import-modal').addEventListener('click', () => {
      schemaInput.value = presets.salon;
      document.getElementById('modal-char-count').textContent = schemaInput.value.length + ' characters';
      modal.classList.add('open');
    });
    document.getElementById('close-modal').addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('cancel-modal').addEventListener('click', () => modal.classList.remove('open'));

    document.getElementById('preset-selector').addEventListener('change', (e) => {
      const val = e.target.value;
      if (presets[val]) {
        schemaInput.value = presets[val];
        document.getElementById('format-selector').value = (val === 'ecommerce' || val === 'saas') ? 'sql' : 'prisma';
      }
      document.getElementById('modal-char-count').textContent = schemaInput.value.length + ' characters';
    });

    schemaInput.addEventListener('input', () => {
      document.getElementById('modal-char-count').textContent = schemaInput.value.length + ' characters';
    });

    document.getElementById('btn-parse-schema').addEventListener('click', () => {
      const code = schemaInput.value.trim();
      const errorEl = document.getElementById('modal-error');
      errorEl.style.display = 'none';

      let fmt = document.getElementById('format-selector').value;
      if (fmt === 'auto') {
        fmt = (code.includes('CREATE TABLE') || code.includes('ALTER TABLE')) ? 'sql' : 'prisma';
      }

      let parsed;
      try {
        parsed = fmt === 'sql' ? parseSql(code) : parsePrisma(code);
      } catch (err) {
        errorEl.textContent = 'Failed to parse: ' + err.message;
        errorEl.style.display = 'block';
        return;
      }

      if (!parsed.models || parsed.models.length === 0) {
        errorEl.textContent = 'No tables/models detected in ' + fmt.toUpperCase() + ' input.';
        errorEl.style.display = 'block';
        return;
      }

      models = parsed.models;
      edges = parsed.edges;
      currentFormat = fmt;
      formatBadge.textContent = fmt.toUpperCase();
      formatBadge.className = 'format-badge ' + fmt;

      modal.classList.remove('open');
      renderCards();
      setTimeout(renderLines, 80);
      panX = 80; panY = 40; zoom = 0.75;
      updateTransform();
    });

    // Init
    updateTransform();
    renderCards();
    setTimeout(renderLines, 100);
  </script>
</body>
</html>`;
}
