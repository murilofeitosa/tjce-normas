import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  norm, VERSAO, AVISO_VARA, VARAS, TEMAS, ATALHOS, plain, kindOf, inline, tableRows,
  historyOf, citacao, artLabel, printArticles, buildIndex, search, snippet, inTema,
} from './lib.js'

/* ---------- armazenamento local ---------- */
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } },
}
function usePersist(key, init) {
  const [v, setV] = useState(() => ls.get(key, init))
  useEffect(() => ls.set(key, v), [key, v])
  return [v, setV]
}

/* ---------- roteamento por hash ---------- */
function useRoute() {
  const parse = () => (location.hash.replace(/^#\/?/, '') || '').split('/').map(decodeURIComponent)
  const [r, setR] = useState(parse)
  useEffect(() => {
    const f = () => { setR(parse()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f)
  }, [])
  return r
}
const go = (...p) => { location.hash = '/' + p.map(encodeURIComponent).join('/') }

/* ---------- ícones simples ---------- */
const I = {
  star: (on) => <svg width="18" height="18" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7 7 .6-5.3 4.7 1.7 7.2L12 17.8 5.6 21.5l1.7-7.2L2 9.6 9 9z" /></svg>,
  copy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg>,
  print: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6z" /></svg>,
  link: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" /></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>,
  moon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>,
  sun: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
}

/* ---------- blocos do texto ---------- */
function Inline({ x }) {
  return inline(x).map((p, i) => p.k === 'h' ? <em key={i} className="hist">{p.v}</em> : p.k === 'b' ? <strong key={i}>{p.v}</strong> : <span key={i}>{p.v}</span>)
}
function Block({ b }) {
  if (b.t === 'table') {
    const rows = tableRows(b.x)
    return (
      <div className="tbl"><table><tbody>
        {rows.map((r, i) => <tr key={i}>{r.map((c, j) => {
          const T = i === 0 ? 'th' : 'td'
          return <T key={j}>{c.replace(/\*\*/g, '').split(/<br\s*\/?>/).map((s, k, a) => <React.Fragment key={k}>{s}{k < a.length - 1 && <br />}</React.Fragment>)}</T>
        })}</tr>)}
      </tbody></table></div>
    )
  }
  return <p className={'b-' + kindOf(b.x)}><Inline x={b.x} /></p>
}

/* ---------- cartão de artigo ---------- */
function ArticleCard({ a, ctx, q, simple }) {
  const { favs, toggleFav, touch, toast } = ctx
  const isFav = favs.includes(a.id)
  const hist = useMemo(() => historyOf(a), [a])
  const copy = async () => {
    const txt = `${artLabel(a)}\n${plain(a)}\n\n(${citacao(a)})`
    try { await navigator.clipboard.writeText(txt) } catch {
      const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove()
    }
    toast('Artigo copiado com a citação'); touch(a.id)
  }
  const link = async () => {
    const u = location.href.split('#')[0] + '#/' + a.id
    try { await navigator.clipboard.writeText(u); toast('Link copiado') } catch { toast(u) }
  }
  return (
    <article className={'card' + (a.revoked ? ' revoked' : '') + (simple ? ' simple' : '')} id={a.id}>
      <header>
        <a className="anum" href={'#/' + a.id} onClick={() => touch(a.id)}>{artLabel(a)}</a>
        {a.revoked && <span className="chip chip-rev">Revogado</span>}
        {!simple && a.cap && <span className="loc">Cap. {a.chapter} · {a.cap.title}</span>}
        <div className="acts">
          <button title="Copiar com citação" onClick={copy}>{I.copy}</button>
          <button title="Imprimir / PDF" onClick={() => printArticles([a])}>{I.print}</button>
          <button title="Copiar link" onClick={link}>{I.link}</button>
          <button title={isFav ? 'Remover dos favoritos' : 'Favoritar'} className={isFav ? 'on' : ''} onClick={() => toggleFav(a.id)}>{I.star(isFav)}</button>
        </div>
      </header>
      <div className="body">{a.blocks.map((b, i) => <Block key={i} b={b} />)}</div>
      {!simple && hist.length > 0 && !a.revoked && (
        <details className="histbox"><summary>Histórico de alterações ({hist.length})</summary>
          <ul>{hist.map((h, i) => <li key={i}>{h}</li>)}</ul></details>
      )}
    </article>
  )
}

/* ---------- caixa de busca com sugestões ---------- */
function SearchBox({ idx, big, autoFocus, onPick, placeholder }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const sug = useMemo(() => (q.trim().length >= 1 ? search(idx, q, 60).slice(0, 7) : []), [q, idx])
  useEffect(() => {
    const f = e => { if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); ref.current?.focus() } }
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f)
  }, [])
  const submit = () => { if (!q.trim()) return; setOpen(false); onPick ? onPick(q) : go('busca', q) }
  return (
    <div className={'sbox' + (big ? ' big' : '')}>
      <span className="sico">{I.search}</span>
      <input ref={ref} autoFocus={autoFocus} value={q} placeholder={placeholder || 'Buscar: palavra, nº do artigo (ex.: 311-A), tema…'}
        onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }} />
      {q && <button className="clr" onClick={() => { setQ(''); ref.current?.focus() }} aria-label="Limpar">×</button>}
      {open && sug.length > 0 && (
        <ul className="sug">
          {sug.map(a => (
            <li key={a.id} onMouseDown={() => { setOpen(false); go(a.id) }}>
              <b>{artLabel(a)}</b>{a.revoked && <i> revogado</i>}
              <span>{snippet(a, q, 90)}</span>
            </li>
          ))}
          <li className="all" onMouseDown={submit}>Ver todos os resultados para “{q}”</li>
        </ul>
      )}
    </div>
  )
}

/* ---------- páginas ---------- */
function Home({ ctx }) {
  const { idx, d, favs, recents, counts } = ctx
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => idx.byId[id]).filter(Boolean)
  const rec = recents.map(id => idx.byId[id]).filter(Boolean).slice(0, 6)
  const fav = favs.map(id => idx.byId[id]).filter(Boolean).slice(0, 6)
  const Mini = ({ list, empty }) => list.length
    ? <ul className="mini">{list.map(a => <li key={a.id}><a href={'#/' + a.id}><b>{artLabel(a)}</b><span>{snippet(a, '', 80)}</span></a></li>)}</ul>
    : <p className="muted">{empty}</p>
  return (
    <div className="page">
      <section className="hero">
        <h1>Código de Normas Judiciais</h1>
        <p>Corregedoria-Geral da Justiça do Estado do Ceará · Provimento nº 02/2021/CGJCE</p>
        <SearchBox idx={idx} big autoFocus={false} />
        <div className="pills">{ATALHOS.map(s => <button key={s.t} className="pill" onClick={() => go('busca', s.q)}>{s.t}</button>)}</div>
        <p className="ver">{VERSAO}</p>
      </section>
      <div className="grid3">
        <div className="panel"><h3>Mais consultados por você</h3><Mini list={top} empty="Aparecerão aqui os artigos que você mais abrir ou copiar." /></div>
        <div className="panel"><h3>Recentes</h3><Mini list={rec} empty="Nenhum artigo visto ainda." /></div>
        <div className="panel"><h3>Favoritos</h3><Mini list={fav} empty="Marque artigos com a estrela para tê-los à mão." />{favs.length > 0 && <a className="more" href="#/favoritos">Ver todos</a>}</div>
      </div>
      <h2 className="sh">Como navegar</h2>
      <div className="grid3">
        <a className="tile" href="#/estrutura"><b>Estrutura oficial</b><span>{d.chapters.length} capítulos, seções e artigos na ordem do Código.</span></a>
        <a className="tile" href="#/vara"><b>Por tipo de vara</b><span>Atalhos apenas onde a matéria é inequívoca.</span></a>
        <a className="tile" href="#/temas"><b>Temas</b><span>Atos ordinatórios, audiências, prazos, mandados…</span></a>
        <a className="tile" href="#/anexos"><b>Anexos</b><span>{d.annexes.length} anexos: modelos, formulários e tabelas.</span></a>
        <a className="tile" href="#/alteracoes"><b>Alterações recentes</b><span>Artigos alterados ou revogados em 2025–2026.</span></a>
        <a className="tile servidor" href="#/servidor"><b>Modo Servidor</b><span>Tela simples e rápida para audiências e balcão.</span></a>
      </div>
    </div>
  )
}

function ArticleList({ list, ctx, q, simple, limit = 60 }) {
  const [n, setN] = useState(limit)
  useEffect(() => setN(limit), [list, limit])
  return (<>
    {list.slice(0, n).map(a => <ArticleCard key={a.id} a={a} ctx={ctx} q={q} simple={simple} />)}
    {list.length > n && <button className="btn more" onClick={() => setN(n + 60)}>Mostrar mais ({list.length - n} restantes)</button>}
  </>)
}
function Toolbar({ title, list, sub }) {
  return (
    <div className="toolbar">
      <div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>
      {list && list.length > 0 && <button className="btn" onClick={() => printArticles(list, title)}>{I.print} Imprimir / PDF ({list.length})</button>}
    </div>
  )
}

function Results({ q, ctx }) {
  const list = useMemo(() => search(ctx.idx, q, 400), [q, ctx.idx])
  return (
    <div className="page">
      <SearchBox idx={ctx.idx} placeholder="Nova busca…" />
      <Toolbar title={`Resultados para “${q}”`} list={list} sub={`${list.length} artigo(s) encontrado(s)${list.length >= 400 ? ' (exibindo os 400 mais relevantes)' : ''}`} />
      {list.length === 0 && <p className="empty">Nada encontrado. Tente outro termo ou o número do artigo.</p>}
      <ArticleList list={list} ctx={ctx} q={q} />
    </div>
  )
}

function Estrutura({ ctx, capNum }) {
  const { d, idx } = ctx
  const [openCaps, setOpenCaps] = useState({})
  if (capNum) return <Capitulo ctx={ctx} num={capNum} />
  return (
    <div className="page">
      <Toolbar title="Estrutura oficial" sub="Capítulos, seções e artigos exatamente na ordem do Código." />
      <ol className="toc">
        {d.chapters.map(c => {
          const arts = idx.arts.filter(a => a.chapter === c.num)
          const first = arts[0], last = arts[arts.length - 1]
          return (
            <li key={c.num}>
              <a href={'#/estrutura/' + c.num}><span className="cn">Capítulo {c.num}</span><span className="ct">{c.title}</span>
                <span className="cr">{first ? `Arts. ${first.num}${last && last !== first ? ' a ' + last.num : ''}` : ''}</span></a>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Capitulo({ ctx, num }) {
  const { d, idx } = ctx
  const c = d.chapters.find(x => x.num === num)
  const [secFilter, setSecFilter] = useState('')
  if (!c) return <div className="page"><p className="empty">Capítulo não encontrado.</p></div>
  const arts = idx.arts.filter(a => a.chapter === num)
  const ranges = d.ranges.filter(r => r.chapter === num)
  const noSec = arts.filter(a => !a.section)
  const bySec = sn => arts.filter(a => a.section === sn)
  const idxCap = d.chapters.findIndex(x => x.num === num)
  const prev = d.chapters[idxCap - 1], next = d.chapters[idxCap + 1]
  return (
    <div className="page">
      <p className="crumb"><a href="#/estrutura">Estrutura</a> › Capítulo {c.num}</p>
      <Toolbar title={`Capítulo ${c.num} — ${c.title}`} list={arts} sub={c.note?.join(' ')} />
      {ranges.filter(r => !r.section).map((r, i) => <p key={i} className="range">{r.text}</p>)}
      {noSec.length > 0 && <ArticleList list={noSec} ctx={ctx} limit={200} />}
      {c.sections.map((sec, si) => {
        const direct = bySec(sec.num).filter(a => !a.sub)
        return (
          <section key={si}>
            <h2 className="sec">Seção {sec.num}{sec.title ? ' — ' + sec.title : ''}</h2>
            {sec.note?.map((n, i) => <p key={i} className="range">{n}</p>)}
            {ranges.filter(r => r.section === sec.num).map((r, i) => <p key={i} className="range">{r.text}</p>)}
            <ArticleList list={direct} ctx={ctx} limit={200} />
            {sec.subs?.map((u, ui) => (
              <div key={ui}>
                <h3 className="subsec">Subseção {u.num}{u.title ? ' — ' + u.title : ''}</h3>
                {u.note?.map((n, i) => <p key={i} className="range">{n}</p>)}
                <ArticleList list={bySec(sec.num).filter(a => a.sub === u.num)} ctx={ctx} limit={200} />
              </div>
            ))}
          </section>
        )
      })}
      <nav className="pn">
        {prev ? <a href={'#/estrutura/' + prev.num}>← Cap. {prev.num}</a> : <span />}
        {next ? <a href={'#/estrutura/' + next.num}>Cap. {next.num} →</a> : <span />}
      </nav>
    </div>
  )
}

function Vara({ ctx, id }) {
  const { idx, d } = ctx
  if (!id) return (
    <div className="page">
      <Toolbar title="Por tipo de vara" />
      <div className="aviso"><b>Atenção:</b> {AVISO_VARA} Somente capítulos de matéria inequívoca foram agrupados. Os demais capítulos (de aplicação geral ou mista) constam apenas na <a href="#/estrutura">Estrutura oficial</a>.</div>
      <div className="grid3">
        {VARAS.map(v => {
          const n = idx.arts.filter(a => v.caps.includes(a.chapter)).length
          return <a key={v.id} className="tile" style={{ borderTopColor: v.cor }} href={'#/vara/' + v.id}><b>{v.nome}</b><span>{n} artigos · Caps. {v.caps.join(', ')}</span></a>
        })}
      </div>
    </div>
  )
  const v = VARAS.find(x => x.id === id)
  if (!v) return null
  const list = idx.arts.filter(a => v.caps.includes(a.chapter))
  return (
    <div className="page">
      <p className="crumb"><a href="#/vara">Por tipo de vara</a> › {v.nome}</p>
      <Toolbar title={v.nome} list={list} sub={v.why} />
      <div className="aviso">{AVISO_VARA}</div>
      <p className="muted">Capítulos incluídos: {v.caps.map(c => <a key={c} href={'#/estrutura/' + c}>{c} </a>)}</p>
      <ArticleList list={list} ctx={ctx} />
    </div>
  )
}

function Temas({ ctx, id }) {
  const { idx } = ctx
  const [sub, setSub] = useState(false)
  const t = TEMAS.find(x => x.id === id)
  const list = useMemo(() => t ? idx.arts.filter(a => inTema(a, t) && (!a.revoked)) : [], [t, idx])
  return (
    <div className="page">
      <Toolbar title={t ? `Tema: ${t.nome}` : 'Temas'} list={t ? list : null}
        sub={t ? 'Filtro automático por palavras-chave no texto (não é classificação oficial). Revogados omitidos.' : 'Filtros por palavra-chave para localizar rapidamente os artigos sobre o assunto.'} />
      <div className="pills">{TEMAS.map(x => <button key={x.id} className={'pill' + (x.id === id ? ' on' : '')} onClick={() => go('tema', x.id)}>{x.nome}</button>)}</div>
      {t && <ArticleList list={list} ctx={ctx} q={t.kw[0]} />}
    </div>
  )
}

function Anexos({ ctx, id }) {
  const { d } = ctx
  if (id) {
    const a = d.annexes.find(x => x.id === id); if (!a) return null
    return (
      <div className="page">
        <p className="crumb"><a href="#/anexos">Anexos</a> › Anexo {a.num}</p>
        <Toolbar title={`Anexo ${a.num} — ${a.title}`} sub={a.revoked ? 'Anexo revogado' : null} />
        <div className={'card' + (a.revoked ? ' revoked' : '')}><div className="body">{a.blocks.map((b, i) => <Block key={i} b={b} />)}</div></div>
      </div>
    )
  }
  return (
    <div className="page">
      <Toolbar title="Anexos" sub="Modelos, formulários e tabelas do Provimento nº 02/2021/CGJCE." />
      <ol className="toc">{d.annexes.map(a => <li key={a.id}><a href={'#/' + a.id}><span className="cn">Anexo {a.num}</span><span className="ct">{a.title}</span>{a.revoked && <span className="chip chip-rev">Revogado</span>}</a></li>)}</ol>
    </div>
  )
}

function Alteracoes({ ctx }) {
  const list = useMemo(() => ctx.idx.arts.filter(a => /\/(2025|2026)/.test(a.text) && /(Redação|Incluíd|Inserid|Revogad|Renomead)[^)]*\/(2025|2026)/i.test(a.text)), [ctx.idx])
  return (
    <div className="page">
      <Toolbar title="Alterações recentes (2025–2026)" list={list} sub="Artigos cujas marcações de histórico citam provimentos de 2025 ou 2026." />
      <ArticleList list={list} ctx={ctx} />
    </div>
  )
}

function Favoritos({ ctx }) {
  const list = ctx.favs.map(id => ctx.idx.byId[id]).filter(Boolean)
  return (
    <div className="page">
      <Toolbar title="Favoritos" list={list} sub="Salvos neste navegador." />
      {list.length === 0 && <p className="empty">Você ainda não marcou nenhum artigo. Use a estrela ☆ no cartão do artigo.</p>}
      <ArticleList list={list} ctx={ctx} />
    </div>
  )
}

function Artigo({ ctx, id }) {
  const a = ctx.idx.byId[id]
  useEffect(() => { if (a) ctx.touch(a.id, true) }, [id])
  if (!a) return <div className="page"><p className="empty">Artigo não encontrado.</p></div>
  const i = ctx.idx.arts.indexOf(a), p = ctx.idx.arts[i - 1], n = ctx.idx.arts[i + 1]
  return (
    <div className="page">
      <p className="crumb"><a href="#/estrutura">Estrutura</a> › <a href={'#/estrutura/' + a.chapter}>Capítulo {a.chapter}</a> › {artLabel(a)}</p>
      <ArticleCard a={a} ctx={ctx} />
      <nav className="pn">
        {p ? <a href={'#/' + p.id}>← {artLabel(p)}</a> : <span />}
        {n ? <a href={'#/' + n.id}>{artLabel(n)} →</a> : <span />}
      </nav>
    </div>
  )
}

/* ---------- Modo Servidor ---------- */
function Servidor({ ctx }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const res = useMemo(() => q.trim() ? search(ctx.idx, q, 30) : [], [q, ctx.idx])
  const first = sel ? ctx.idx.byId[sel] : null
  return (
    <div className="sv-wrap"><div className="servidor">
      <div className="sv-top">
        <a href="#/" className="sv-exit">← Sair do Modo Servidor</a>
        <input autoFocus value={q} onChange={e => { setQ(e.target.value); setSel(null) }} placeholder="Digite o nº do artigo ou um termo…" />
        <div className="pills">{ATALHOS.slice(0, 6).map(s => <button key={s.t} className="pill" onClick={() => { setQ(s.q); setSel(null) }}>{s.t}</button>)}</div>
      </div>
      {first ? (
        <div className="sv-art"><button className="btn" onClick={() => setSel(null)}>← Voltar aos resultados</button><ArticleCard a={first} ctx={ctx} simple /></div>
      ) : (
        <ul className="sv-list">
          {res.map(a => (
            <li key={a.id}><button onClick={() => { setSel(a.id); ctx.touch(a.id) }}><b>{artLabel(a)}{a.revoked ? ' (revogado)' : ''}</b><span>{snippet(a, q, 140)}</span></button></li>
          ))}
          {q && res.length === 0 && <li className="empty">Nada encontrado.</li>}
        </ul>
      )}
    </div></div>
  )
}

/* ---------- menu lateral ---------- */
function Sidebar({ d, route, open, close }) {
  const [exp, setExp] = useState({})
  const cur = route[0] === 'estrutura' ? route[1] : null
  return (
    <aside className={'side' + (open ? ' open' : '')}>
      <nav>
        <a href="#/" onClick={close}>Início</a>
        <a href="#/favoritos" onClick={close}>★ Favoritos</a>
        <a href="#/vara" onClick={close}>Por tipo de vara</a>
        <a href="#/temas" onClick={close}>Temas</a>
        <a href="#/alteracoes" onClick={close}>Alterações recentes</a>
        <a href="#/anexos" onClick={close}>Anexos</a>
        <a href="#/servidor" className="sv" onClick={close}>Modo Servidor</a>
        <h4>Estrutura oficial</h4>
        {d.chapters.map(c => (
          <div key={c.num} className="scap">
            <button className="tg" onClick={() => setExp(e => ({ ...e, [c.num]: !e[c.num] }))} aria-label="Expandir">{exp[c.num] || cur === c.num ? '▾' : '▸'}</button>
            <a className={cur === c.num ? 'act' : ''} href={'#/estrutura/' + c.num} onClick={close}>{c.num}. {c.title.toLowerCase().replace(/^./, m => m.toUpperCase())}</a>
            {(exp[c.num] || cur === c.num) && c.sections.length > 0 && (
              <ul>{c.sections.map((s, i) => <li key={i}><a href={'#/estrutura/' + c.num} onClick={close}>Seção {s.num}{s.title ? ' – ' + s.title : ''}</a></li>)}</ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

/* ---------- App ---------- */
export default function App() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState(null)
  const route = useRoute()
  const [dark, setDark] = usePersist('tjce_dark', window.matchMedia?.('(prefers-color-scheme: dark)').matches || false)
  const [favs, setFavs] = usePersist('tjce_favs', [])
  const [recents, setRecents] = usePersist('tjce_rec', [])
  const [counts, setCounts] = usePersist('tjce_cnt', {})
  const [menu, setMenu] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light' }, [dark])
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data.json').then(r => r.json()).then(setD).catch(e => setErr(String(e)))
  }, [])
  const idx = useMemo(() => d && buildIndex(d), [d])

  const toast = useCallback(m => { setMsg(m); setTimeout(() => setMsg(''), 1800) }, [])
  const touch = useCallback((id, view) => {
    setRecents(r => [id, ...r.filter(x => x !== id)].slice(0, 30))
    setCounts(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
  }, [])
  const toggleFav = id => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [id, ...f])

  if (err) return <div className="load">Não foi possível carregar os dados: {err}</div>
  if (!d) return <div className="load">Carregando Código de Normas…</div>
  const ctx = { d, idx, favs, toggleFav, recents, counts, touch, toast }

  const [r0, r1] = route
  let view
  if (r0 === 'servidor') return <><Servidor ctx={ctx} />{msg && <div className="toast">{msg}</div>}</>
  if (!r0) view = <Home ctx={ctx} />
  else if (r0 === 'busca') view = <Results q={r1 || ''} ctx={ctx} />
  else if (r0 === 'estrutura') view = <Estrutura ctx={ctx} capNum={r1} />
  else if (r0 === 'vara') view = <Vara ctx={ctx} id={r1} />
  else if (r0 === 'tema' || r0 === 'temas') view = <Temas ctx={ctx} id={r1} />
  else if (r0 === 'anexos') view = <Anexos ctx={ctx} />
  else if (r0.startsWith('anexo-')) view = <Anexos ctx={ctx} id={r0} />
  else if (r0 === 'alteracoes') view = <Alteracoes ctx={ctx} />
  else if (r0 === 'favoritos') view = <Favoritos ctx={ctx} />
  else if (r0.startsWith('art-')) view = <Artigo ctx={ctx} id={r0} />
  else view = <Home ctx={ctx} />

  return (
    <div className="app">
      <header className="top">
        <button className="ib menu" onClick={() => setMenu(!menu)} aria-label="Menu">{I.menu}</button>
        <a href="#/" className="brand"><span className="logo">§</span><span><b>Código de Normas</b><small>CGJCE · TJCE</small></span></a>
        <div className="top-search"><SearchBox idx={idx} /></div>
        <button className="ib" onClick={() => setDark(!dark)} title="Alternar tema" aria-label="Alternar tema">{dark ? I.sun : I.moon}</button>
      </header>
      <div className="shell">
        <Sidebar d={d} route={route} open={menu} close={() => setMenu(false)} />
        {menu && <div className="scrim" onClick={() => setMenu(false)} />}
        <main>{view}
          <footer className="foot">Ferramenta de consulta — o texto reproduz o Código de Normas Judiciais. Confira sempre a versão oficial publicada pela Corregedoria-Geral da Justiça. <br />{VERSAO}</footer>
        </main>
      </div>
      {msg && <div className="toast">{msg}</div>}
    </div>
  )
}
