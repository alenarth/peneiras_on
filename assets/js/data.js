/* ============================================================
   PENEIRAS ON — Dados mockados (compartilhado)
   ============================================================ */

const ATHLETES = [
  { id:'a-001', name:'Lucas Oliveira', age:15, city:'Duque de Caxias', state:'RJ', position:'Ponta', side:'Direita', foot:'Direito', height:172, weight:64, club:'Escolinha Vila Operária', yearsPlaying:3, score:87, completeness:92, status:'convocado', present:true, favorite:true, notes:'Pé direito letal, drible curto. Falta marcação.', attrs:{Velocidade:18,Finalização:14,Passe:12,Drible:17,Defesa:6,Cabeceio:9,Físico:13,Reflexo:4}, videos:3, region:'Baixada Fluminense', plan:'premium', registrations:['e-01','e-06'] },
  { id:'a-002', name:'Matheus Pereira', age:16, city:'Manaus', state:'AM', position:'Atacante', foot:'Direito', height:178, weight:71, club:'Liga Amazonas Sub-17', yearsPlaying:5, score:91, completeness:88, status:'convocado', present:true, favorite:true, notes:'Físico acima da média. Boa cabeçada.', attrs:{Velocidade:17,Finalização:18,Passe:11,Drible:13,Defesa:5,Cabeceio:16,Físico:17,Reflexo:3}, videos:2, region:'Norte', plan:'premium' },
  { id:'a-003', name:'Davi Sousa', age:14, city:'Recife', state:'PE', position:'Meia', foot:'Esquerdo', height:168, weight:58, club:'Sport Sub-15', yearsPlaying:4, score:82, completeness:95, status:'convocado', present:true, favorite:false, notes:'', attrs:{Velocidade:13,Finalização:12,Passe:18,Drible:16,Defesa:11,Cabeceio:8,Físico:11,Reflexo:4}, videos:4, region:'Nordeste', plan:'premium' },
  { id:'a-004', name:'Gabriel Lima', age:17, city:'Belo Horizonte', state:'MG', position:'Zagueiro', foot:'Direito', height:186, weight:78, club:'Atlético Sub-17', yearsPlaying:7, score:79, completeness:80, status:'inscrito', favorite:false, notes:'', attrs:{Velocidade:11,Finalização:6,Passe:13,Drible:8,Defesa:18,Cabeceio:17,Físico:16,Reflexo:5}, videos:1, region:'Sudeste', plan:'gratuito' },
  { id:'a-005', name:'Pedro Henrique', age:13, city:'Teresina', state:'PI', position:'Goleiro', foot:'Direito', height:175, weight:62, club:'Tiradentes-PI', yearsPlaying:2, score:74, completeness:68, status:'inscrito', favorite:false, notes:'', attrs:{Velocidade:9,Finalização:3,Passe:12,Drible:5,Defesa:14,Cabeceio:11,Físico:14,Reflexo:18}, videos:1, region:'Nordeste', plan:'gratuito' },
  { id:'a-006', name:'Ryan Almeida', age:15, city:'Salvador', state:'BA', position:'Lateral', foot:'Esquerdo', height:174, weight:66, club:'Bahia Sub-15', yearsPlaying:4, score:84, completeness:90, status:'convocado', present:true, favorite:true, notes:'Lateral canhoto raro. Ótima entrega.', attrs:{Velocidade:17,Finalização:9,Passe:15,Drible:13,Defesa:14,Cabeceio:11,Físico:14,Reflexo:5}, videos:2, region:'Nordeste', plan:'gratuito' },
  { id:'a-007', name:'João Vitor', age:16, city:'Porto Alegre', state:'RS', position:'Volante', foot:'Direito', height:180, weight:73, club:'Grêmio Sub-16', yearsPlaying:6, score:77, completeness:75, status:'inscrito', favorite:false, notes:'', attrs:{Velocidade:12,Finalização:9,Passe:16,Drible:11,Defesa:16,Cabeceio:13,Físico:15,Reflexo:5}, videos:0, region:'Sul', plan:'gratuito' },
  { id:'a-008', name:'Iago Santos', age:14, city:'Fortaleza', state:'CE', position:'Ponta', side:'Esquerda', foot:'Direito', height:170, weight:60, club:'Ceará Sub-15', yearsPlaying:3, score:80, completeness:85, status:'convocado', present:false, favorite:false, notes:'', attrs:{Velocidade:18,Finalização:13,Passe:12,Drible:17,Defesa:6,Cabeceio:8,Físico:12,Reflexo:4}, videos:2, region:'Nordeste', plan:'premium' },
  { id:'a-009', name:'Rafael Mendes', age:17, city:'Curitiba', state:'PR', position:'Atacante', foot:'Direito', height:182, weight:75, club:'Atlético-PR Sub-17', yearsPlaying:8, score:89, completeness:100, status:'convocado', present:true, favorite:true, notes:'Perfil completo. Vídeo de 12 gols.', attrs:{Velocidade:16,Finalização:18,Passe:13,Drible:14,Defesa:6,Cabeceio:14,Físico:16,Reflexo:3}, videos:5, region:'Sul', plan:'premium' },
  { id:'a-010', name:'Caio Ribeiro', age:12, city:'Goiânia', state:'GO', position:'Meia', foot:'Direito', height:158, weight:50, club:'Sem clube', yearsPlaying:1, score:62, completeness:55, status:'inscrito', favorite:false, notes:'', attrs:{Velocidade:11,Finalização:9,Passe:14,Drible:12,Defesa:9,Cabeceio:7,Físico:9,Reflexo:3}, videos:0, region:'Centro-Oeste', plan:'gratuito' },
  { id:'a-011', name:'Bruno Carvalho', age:16, city:'São Paulo', state:'SP', position:'Zagueiro', foot:'Direito', height:188, weight:80, club:'Corinthians Sub-16', yearsPlaying:7, score:85, completeness:95, status:'convocado', present:true, favorite:false, notes:'', attrs:{Velocidade:12,Finalização:7,Passe:14,Drible:9,Defesa:17,Cabeceio:18,Físico:17,Reflexo:4}, videos:3, region:'Sudeste', plan:'premium' },
  { id:'a-012', name:'Felipe Souza', age:15, city:'Brasília', state:'DF', position:'Goleiro', foot:'Direito', height:184, weight:74, club:'Brasiliense Sub-15', yearsPlaying:4, score:81, completeness:88, status:'convocado', present:true, favorite:false, notes:'', attrs:{Velocidade:10,Finalização:3,Passe:13,Drible:6,Defesa:16,Cabeceio:12,Físico:15,Reflexo:19}, videos:2, region:'Centro-Oeste', plan:'gratuito' },
];

const EVENTS = [
  { id:'e-01', name:'Peneira Rio · Caxias', city:'Duque de Caxias', state:'RJ', date:'2026-06-15', capacity:120, registered:487, called:120, present:102, approved:14, status:'aberta', age:'13-17' },
  { id:'e-02', name:'Peneira Nordeste · Recife', city:'Recife', state:'PE', date:'2026-06-22', capacity:150, registered:612, called:150, present:0, approved:0, status:'aberta', age:'13-17' },
  { id:'e-03', name:'Peneira Norte · Manaus', city:'Manaus', state:'AM', date:'2026-07-05', capacity:100, registered:218, called:0, present:0, approved:0, status:'inscrições', age:'13-17' },
  { id:'e-04', name:'Peneira SP · Capital', city:'São Paulo', state:'SP', date:'2026-05-08', capacity:180, registered:1124, called:180, present:165, approved:22, status:'encerrada', age:'13-17' },
  { id:'e-05', name:'Peneira Sul · Curitiba', city:'Curitiba', state:'PR', date:'2026-05-22', capacity:120, registered:543, called:120, present:108, approved:16, status:'encerrada', age:'13-17' },
  // 2º semestre: as cinco acima já passaram no calendário real; sem estas, o
  // mapa e a "próxima peneira" ficariam vazios. Datas e status alimentam
  // SEASON, o mapa (mapa.js), o calendário e a contagem regressiva.
  { id:'e-06', name:'Peneira Rio · Niterói', city:'Niterói', state:'RJ', date:'2026-10-10', capacity:120, registered:311, called:0, present:0, approved:0, status:'aberta', age:'13-17' },
  { id:'e-07', name:'Peneira Nordeste · Salvador', city:'Salvador', state:'BA', date:'2026-10-17', capacity:150, registered:428, called:0, present:0, approved:0, status:'aberta', age:'13-17' },
  { id:'e-08', name:'Peneira Minas · BH', city:'Belo Horizonte', state:'MG', date:'2026-10-24', capacity:120, registered:296, called:0, present:0, approved:0, status:'inscrições', age:'12-16' },
  { id:'e-09', name:'Peneira Nordeste · Fortaleza', city:'Fortaleza', state:'CE', date:'2026-11-07', capacity:120, registered:187, called:0, present:0, approved:0, status:'aberta', age:'13-17' },
  { id:'e-10', name:'Peneira Centro-Oeste · Brasília', city:'Brasília', state:'DF', date:'2026-11-21', capacity:100, registered:142, called:0, present:0, approved:0, status:'inscrições', age:'13-17' },
  { id:'e-11', name:'Peneira Sul · Porto Alegre', city:'Porto Alegre', state:'RS', date:'2026-12-05', capacity:120, registered:98, called:0, present:0, approved:0, status:'aberta', age:'13-17' },
];

const REGIONS = [
  { id:'sp', label:'SP / Capital', state:'SP', x:0.48, y:0.72, value:1124, demand:0.92 },
  { id:'rj', label:'Caxias / Baixada', state:'RJ', x:0.56, y:0.71, value:487, demand:0.78 },
  { id:'mg', label:'BH', state:'MG', x:0.53, y:0.66, value:312, demand:0.61 },
  { id:'rs', label:'Porto Alegre', state:'RS', x:0.40, y:0.86, value:198, demand:0.42 },
  { id:'pr', label:'Curitiba', state:'PR', x:0.43, y:0.78, value:543, demand:0.81 },
  { id:'ba', label:'Salvador', state:'BA', x:0.66, y:0.50, value:421, demand:0.74 },
  { id:'pe', label:'Recife', state:'PE', x:0.72, y:0.39, value:612, demand:0.95 },
  { id:'ce', label:'Fortaleza', state:'CE', x:0.66, y:0.32, value:389, demand:0.71 },
  { id:'am', label:'Manaus', state:'AM', x:0.26, y:0.30, value:218, demand:0.66 },
  { id:'pi', label:'Teresina', state:'PI', x:0.60, y:0.36, value:167, demand:0.58 },
  { id:'go', label:'Goiânia', state:'GO', x:0.46, y:0.56, value:142, demand:0.47 },
  { id:'df', label:'Brasília', state:'DF', x:0.49, y:0.55, value:188, demand:0.55 },
  { id:'pa', label:'Belém', state:'PA', x:0.46, y:0.28, value:96, demand:0.62 },
  { id:'ma', label:'São Luís', state:'MA', x:0.56, y:0.30, value:78, demand:0.51 },
  { id:'mt', label:'Cuiabá', state:'MT', x:0.37, y:0.51, value:54, demand:0.34 },
];

const POSITION_PROFILES = {
  Goleiro:  {Velocidade:8,Finalização:3,Passe:12,Drible:5,Defesa:15,Cabeceio:11,Físico:14,Reflexo:19},
  Zagueiro: {Velocidade:11,Finalização:6,Passe:13,Drible:8,Defesa:18,Cabeceio:17,Físico:17,Reflexo:5},
  Lateral:  {Velocidade:16,Finalização:9,Passe:15,Drible:13,Defesa:14,Cabeceio:10,Físico:14,Reflexo:5},
  Volante:  {Velocidade:12,Finalização:9,Passe:16,Drible:11,Defesa:16,Cabeceio:13,Físico:15,Reflexo:5},
  Meia:     {Velocidade:13,Finalização:13,Passe:18,Drible:16,Defesa:10,Cabeceio:8,Físico:11,Reflexo:4},
  Ponta:    {Velocidade:18,Finalização:14,Passe:12,Drible:17,Defesa:6,Cabeceio:9,Físico:13,Reflexo:4},
  Atacante: {Velocidade:16,Finalização:18,Passe:13,Drible:14,Defesa:6,Cabeceio:15,Físico:16,Reflexo:3},
};

const POS_COLORS = { Goleiro:'#F97316', Zagueiro:'#60A5FA', Lateral:'#22C55E', Volante:'#A78BFA', Meia:'#F472B6', Ponta:'#FBBF24', Atacante:'#F87171' };

function classifyPosition(attrs) {
  const keys = Object.keys(POSITION_PROFILES.Goleiro);
  function cos(a, b) {
    let dot=0, na=0, nb=0;
    for (const k of keys) { dot += a[k]*b[k]; na += a[k]*a[k]; nb += b[k]*b[k]; }
    return dot / (Math.sqrt(na)*Math.sqrt(nb) || 1);
  }
  return Object.entries(POSITION_PROFILES)
    .map(([pos, prof]) => ({ pos, score: cos(attrs, prof) }))
    .sort((a,b) => b.score - a.score);
}

const FUNNEL = [
  { stage:'Inscritos', value:18420, delta:'+412' },
  { stage:'Elegíveis', value:16812, delta:'91%' },
  { stage:'Convocados', value:1850, delta:'11%' },
  { stage:'Presentes', value:1473, delta:'80%' },
  { stage:'Aprovados', value:187, delta:'12,7%' },
];

const TIMELINE = [
  {d:'Seg',v:320},{d:'Ter',v:410},{d:'Qua',v:612},{d:'Qui',v:824},{d:'Sex',v:1102},
  {d:'Sáb',v:1480},{d:'Dom',v:1336},{d:'Seg',v:980},{d:'Ter',v:1240},{d:'Qua',v:1410},
  {d:'Qui',v:1602},{d:'Sex',v:1920},{d:'Sáb',v:2210},{d:'Dom',v:1885},
];

/* Rótulo de posição para exibição: junta a posição canônica ao lado, quando houver. */
function posLabel(athlete) {
  return athlete.side ? athlete.position + ' ' + athlete.side : athlete.position;
}

/* Números da temporada derivados de EVENTS — fonte única para landing,
   tela de peneiras e página institucional. */
const SEASON = {
  events: EVENTS.length,
  states: new Set(EVENTS.map(e => e.state)).size,
  statesGoal: 27,
  nextEvent: EVENTS.slice().sort((a, b) => a.date.localeCompare(b.date))
    .find(e => new Date(e.date + 'T00:00:00') >= new Date(new Date().toDateString())) || EVENTS[0],
};

const MOCK = { ATHLETES, EVENTS, REGIONS, POSITION_PROFILES, POS_COLORS, classifyPosition, posLabel, FUNNEL, TIMELINE, SEASON };
