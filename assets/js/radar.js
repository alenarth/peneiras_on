/* ============================================================
   PENEIRAS ON — Radar tático (SVG vanilla)
   ============================================================ */

/**
 * Gera o markup SVG de um radar de atributos.
 * @param {Object} attrs  { Velocidade: 18, ... }
 * @param {Object} opts   { size, fill, compareProfile, showLabels }
 * @returns {string} SVG
 */
function buildRadarSVG(attrs, opts = {}) {
  const size = opts.size || 320;
  const maxValue = 20;
  const showLabels = opts.showLabels !== false;
  const fill = opts.fill || 'var(--accent)';
  const stroke = 'var(--ink)';
  const rings = 4;
  const keys = Object.keys(attrs);
  const N = keys.length;
  const cx = size/2, cy = size/2;
  const pad = showLabels ? 60 : 16;
  const R = size/2 - pad;

  const polar = (i, val) => {
    const a = (Math.PI*2*i)/N - Math.PI/2;
    const r = (val/maxValue) * R;
    return [cx + Math.cos(a)*r, cy + Math.sin(a)*r];
  };
  const poly = (vals) => vals.map((v,i) => polar(i,v).join(',')).join(' ');

  const values = keys.map(k => attrs[k]);
  const cmp = opts.compareProfile ? keys.map(k => opts.compareProfile[k] || 0) : null;

  let s = `<svg class="radar-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

  // anéis
  for (let r=0; r<rings; r++) {
    const rr = ((r+1)/rings) * R;
    const pts = Array.from({length:N}, (_,i) => {
      const a = (Math.PI*2*i)/N - Math.PI/2;
      return `${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rr}`;
    }).join(' ');
    s += `<polygon points="${pts}" fill="none" stroke="var(--line-soft)" stroke-width="1"/>`;
  }
  // eixos
  keys.forEach((_, i) => {
    const [x,y] = polar(i, maxValue);
    s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line-soft)" stroke-width="1"/>`;
  });
  // comparação (perfil base)
  if (cmp) s += `<polygon points="${poly(cmp)}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.55"/>`;
  // dados
  s += `<polygon points="${poly(values)}" fill="${fill}" fill-opacity="0.65" stroke="${stroke}" stroke-width="2"/>`;
  // vértices
  values.forEach((v,i) => { const [x,y]=polar(i,v); s += `<circle cx="${x}" cy="${y}" r="3" fill="${stroke}"/>`; });
  // rótulos
  if (showLabels) {
    keys.forEach((k,i) => {
      const [x,y] = polar(i, maxValue + 2.5);
      const a = (Math.PI*2*i)/N - Math.PI/2;
      const isTop = Math.abs(a + Math.PI/2) < 0.01;
      const isBot = Math.abs(a - Math.PI/2) < 0.01;
      const anchor = (isTop||isBot) ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
      s += `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" class="radar-axis-label">${k}</text>`;
      s += `<text x="${x}" y="${y+12}" text-anchor="${anchor}" dominant-baseline="middle" class="radar-axis-value">${attrs[k]}</text>`;
    });
  }
  s += `</svg>`;
  return s;
}

/**
 * Bloco completo: radar + veredito de posição (ranking).
 * @returns {string} HTML
 */
function buildPositionRadar(attrs, opts = {}) {
  const size = opts.size || 340;
  const ranked = MOCK.classifyPosition(attrs);
  const top = ranked[0];
  const color = MOCK.POS_COLORS[top.pos];
  const cmp = MOCK.POSITION_PROFILES[top.pos];

  const radar = buildRadarSVG(attrs, { size, fill: color, compareProfile: cmp });

  let verdict = '';
  if (opts.showVerdict !== false) {
    const runners = ranked.slice(1,4).map(r => `
      <div class="g g-row-bar" style="gap:8px;align-items:center">
        <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);text-transform:uppercase">${r.pos}</span>
        <div style="height:4px;background:var(--bg-alt);position:relative">
          <div style="position:absolute;inset:0;width:${(r.score*100).toFixed(0)}%;background:${MOCK.POS_COLORS[r.pos]}"></div>
        </div>
        <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);text-align:right">${(r.score*100).toFixed(0)}%</span>
      </div>`).join('');

    verdict = `
      <div style="border-top:1px solid var(--line);padding-top:14px;margin-top:16px">
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
          <span class="kicker">perfil tático sugerido</span>
          <span class="kicker" style="margin-left:auto">cosine match</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:12px">
          <span style="width:12px;height:12px;background:${color};border:1px solid var(--ink)"></span>
          <span class="display" style="font-size:32px">${top.pos}</span>
          <span style="margin-left:auto;font-family:var(--font-display);font-weight:800;font-size:22px">${(top.score*100).toFixed(0)}%</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">${runners}</div>
      </div>`;
  }

  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div style="display:flex;justify-content:center">${radar}</div>
    ${verdict}
  </div>`;
}
