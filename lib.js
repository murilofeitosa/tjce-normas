import Fuse from 'fuse.js'
export const norm = (s='') => s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()

export const VERSAO = 'Provimento nº 02/2021/CGJCE — versão consolidada com alterações até o Prov. nº 09/2026/CGJCE (DJeA 22/05/2026)'
export const AVISO_VARA = 'Organização por uso prático. Consulte a estrutura oficial para leitura integral.'

// Classificação por tipo de vara: SOMENTE capítulos cujo objeto é inequívoco.
// Capítulos de aplicação geral ou ambígua NÃO são classificados (ficam só na Estrutura oficial).
export const VARAS = [
  { id:'criminal', nome:'Varas Criminais', cor:'#9B1C1C', caps:['X','XIII','XIV','XVI','XVII','XVIII','XIX','XX'],
    why:'Capítulos que tratam exclusivamente de matéria penal/processual penal (dados criminais, suspensão condicional, presos, TCO, ANPP, organizações criminosas, proteção a vítimas e testemunhas, júri).' },
  { id:'execucao', nome:'Execução Penal', cor:'#7A3E00', caps:['XV'],
    why:'Capítulo dedicado ao SEEU — Sistema Eletrônico de Execução Unificada.' },
  { id:'infancia', nome:'Infância e Juventude', cor:'#0F5C4D', caps:['XXI','XXII'],
    why:'Capítulos sobre atos infracionais e agentes de proteção da infância e juventude.' },
]

// Filtros temáticos: busca por palavras-chave no texto (NÃO é classificação normativa).
export const TEMAS = [
  { id:'atos', nome:'Atos ordinatórios', kw:['ato ordinatorio','atos ordinatorios','sem despacho','ato de mero expediente'] },
  { id:'audiencias', nome:'Audiências', kw:['audiencia'] },
  { id:'prazos', nome:'Prazos', kw:['prazo'] },
  { id:'mandados', nome:'Mandados', kw:['mandado'] },
  { id:'citacao', nome:'Citação e intimação', kw:['citacao','citar','intimacao','intimar'] },
  { id:'secretaria', nome:'Secretaria judicial', kw:['secretaria','supervisor','unidade judicial','cartorio'] },
  { id:'presos', nome:'Presos e escolta', kw:['preso','presos','escolta','recambiamento','prisional'] },
  { id:'custas', nome:'Custas e despesas', kw:['custas','despesas processuais','gecof','divida ativa'] },
  { id:'sistemas', nome:'PJe, SEEU e sistemas', kw:['pjecor','seeu','sistema eletronico','sistema'] },
  { id:'oficiais', nome:'Oficiais de justiça', kw:['oficial de justica','oficiais de justica'] },
]

export const ATALHOS = [
  { t:'Audiências', q:'audiência' }, { t:'Prazos', q:'prazo' }, { t:'Mandados', q:'mandado' },
  { t:'Presos', q:'preso' }, { t:'Alvará', q:'alvará' }, { t:'Carta precatória', q:'precatória' },
  { t:'Oficial de justiça', q:'oficial de justiça' }, { t:'Certidão', q:'certidão' },
]

export function plain(a){
  return a.blocks.map(b => b.t==='table' ? tableToText(b.x) : strip(b.x)).join('\n')
}
export const strip = s => s.replace(/\*\*/g,'').replace(/\s+/g,' ').trim()

export function tableRows(md){
  return md.split('\n').map(l=>l.trim()).filter(l=>l.startsWith('|'))
    .map(l=>l.replace(/^\||\|$/g,'').split('|').map(c=>c.trim()))
    .filter(r=>!r.every(c=>/^:?-{2,}:?$/.test(c)||c===''))
}
function tableToText(md){ return tableRows(md).map(r=>r.map(c=>c.replace(/<br>/g,' ').replace(/\*\*/g,'')).join(' | ')).join('\n') }

export function kindOf(x){
  const s = x.replace(/^\*+/,'')
  if (/^(§\s*\d+|Parágrafo único)/i.test(s)) return 'par'
  if (/^[IVXLC]+\s*[-–—.]/.test(s) || /^[IVXLC]+\s*\)/.test(s)) return 'inc'
  if (/^[a-z]\)/.test(s)) return 'ali'
  return 'txt'
}
const HIST = /(Redação|Incluíd|Inserid|Revogad|Renomead|Acrescentad|Alterad|Vide|Prov\.|Provimento|Resolução|Dada nova|Nova redação)/i
// divide o texto em partes: normal / negrito / histórico
export function inline(x){
  const parts=[]; let last=0
  const re=/\*\*(.+?)\*\*/g; let m
  while((m=re.exec(x))){
    if(m.index>last) parts.push({k:'n',v:x.slice(last,m.index)})
    parts.push({k: HIST.test(m[1]) && /\(/.test(m[1]) ? 'h':'b', v:m[1]})
    last=m.index+m[0].length
  }
  if(last<x.length) parts.push({k:'n',v:x.slice(last)})
  return parts.map(p=>({...p,v:p.v.replace(/\*\*/g,'')}))
}
export function historyOf(a){
  const out=[]
  for(const b of a.blocks){ if(b.t!=='p') continue
    const re=/\(\s*((?:Redação|Incluíd|Inserid|Revogad|Renomead|Acrescentad)[^)]*)\)/gi; let m
    while((m=re.exec(b.x.replace(/\*\*/g,'')))) out.push(m[1].trim())
  }
  return out
}
export const citacao = a => `Art. ${a.num.replace('-','-')}, Código de Normas Judiciais do TJCE (Provimento nº 02/2021/CGJCE)`
export const labelArt = n => /^\d+$/.test(n) && +n<10 ? `${n}º` : n
export const artLabel = a => `Art. ${/^\d+$/.test(a.num) && +a.num<10 ? a.num+'º' : a.num}`

export function esc(s){ return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])) }
function blockHtml(b){
  if(b.t==='table'){
    const rows=tableRows(b.x)
    return '<table>'+rows.map((r,i)=>'<tr>'+r.map(c=>`<${i?'td':'th'}>${esc(c.replace(/\*\*/g,'')).replace(/&lt;br&gt;/g,'<br>')}</${i?'td':'th'}>`).join('')+'</tr>').join('')+'</table>'
  }
  const k=kindOf(b.x)
  const h=inline(b.x).map(p=>p.k==='h'?`<em>${esc(p.v)}</em>`:p.k==='b'?`<strong>${esc(p.v)}</strong>`:esc(p.v)).join('')
  return `<p class="${k}">${h}</p>`
}
export function printArticles(list, titulo='Código de Normas Judiciais — TJCE'){
  const w=window.open('','_blank'); if(!w){ alert('Permita pop-ups para imprimir.'); return }
  const body=list.map(a=>`<section><h2>${esc(artLabel(a))}${a.revoked?' <small>(revogado)</small>':''}</h2>${a.blocks.map(blockHtml).join('')}<div class="fonte">${esc(citacao(a))}</div></section>`).join('')
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>
  body{font:12pt/1.6 Georgia,'Times New Roman',serif;color:#111;margin:2.2cm}
  header{border-bottom:2px solid #1A2E5A;margin-bottom:18px;padding-bottom:8px}
  header b{color:#1A2E5A;font-size:13pt} header div{font:9pt sans-serif;color:#555}
  section{margin:0 0 20px;page-break-inside:avoid} h2{font-size:13pt;color:#1A2E5A;margin:0 0 6px} h2 small{color:#999;font-weight:400}
  p{margin:5px 0;text-align:justify} p.par,p.inc{margin-left:1.2cm} p.ali{margin-left:2.2cm} em{font-size:9.5pt;color:#555}
  table{border-collapse:collapse;width:100%;font:9.5pt sans-serif;margin:8px 0} td,th{border:1px solid #999;padding:4px 6px;text-align:left;vertical-align:top} th{background:#eee}
  .fonte{font:8.5pt sans-serif;color:#777;margin-top:6px}
  footer{margin-top:24px;border-top:1px solid #ccc;padding-top:6px;font:8pt sans-serif;color:#777}
  </style></head><body><header><b>Código de Normas Judiciais — TJCE</b><div>${esc(VERSAO)}</div></header>${body}<footer>Texto reproduzido do Código de Normas Judiciais. Confira sempre a versão oficial publicada pela Corregedoria-Geral da Justiça.</footer><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`)
  w.document.close()
}

// ---- índice de busca ----
export function buildIndex(d){
  const capByNum = Object.fromEntries(d.chapters.map(c=>[c.num,c]))
  const arts = d.articles.map(a=>{
    const text = plain(a)
    return { ...a, text, nt: norm(text), cap: capByNum[a.chapter] }
  })
  const byId = Object.fromEntries(arts.map(a=>[a.id,a]))
  return { arts, byId, capByNum }
}

export function search(idx, q, limit=200){
  const raw=q.trim(); if(!raw) return []
  const nq=norm(raw)
  const m=nq.match(/^(?:art(?:igo)?s?\.?\s*)?(\d{1,3})\s*[ºo°]?\s*-?\s*([a-z])?$/)
  if(m){
    const n=+m[1], suf=(m[2]||'').toUpperCase()
    const hit=idx.arts.filter(a=>a.n===n && (!suf || a.suf===suf))
    // artigo exato primeiro, depois os com sufixo (ex.: 311-A…)
    if(hit.length) return hit.sort((a,b)=>(a.suf?1:0)-(b.suf?1:0)||a.suf.localeCompare(b.suf))
  }
  const terms=nq.split(/\s+/).filter(t=>t.length>1)
  if(!terms.length) return []
  const exact=_exact(idx,nq,terms)
  if(exact.length) return exact.slice(0,limit)
  // sem resultado exato: busca aproximada (tolera erros de digitação)
  if(!idx._fuse) idx._fuse=new Fuse(idx.arts,{keys:['nt'],threshold:0.25,ignoreLocation:true,minMatchCharLength:3})
  return idx._fuse.search(nq,{limit}).map(r=>r.item)
}
function _exact(idx,nq,terms){
  const scored=[]
  for(const a of idx.arts){
    let s=0, ok=true
    for(const t of terms){
      const c=a.nt.split(t).length-1
      if(!c){ ok=false; break }
      s+=Math.min(c,5)
    }
    if(!ok) continue
    if(a.nt.includes(nq)) s+=12
    if(a.revoked) s-=6
    scored.push([s,a])
  }
  scored.sort((x,y)=>y[0]-x[0]||x[1].n-y[1].n)
  return scored.map(x=>x[1])
}
export function snippet(a,q,len=170){
  const nq=norm(q).split(/\s+/).filter(t=>t.length>1)
  const pos=nq.map(t=>a.nt.indexOf(t)).filter(p=>p>=0).sort((x,y)=>x-y)[0] ?? 0
  const s=Math.max(0,pos-50)
  // a.nt tem o mesmo comprimento do texto original (NFD removido por caractere) na maioria dos casos
  return (s>0?'…':'')+a.text.slice(s,s+len).replace(/\n/g,' ')+(a.text.length>s+len?'…':'')
}
export function inTema(a,t){ return t.kw.some(k=>a.nt.includes(k)) }
