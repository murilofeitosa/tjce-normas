#!/usr/bin/env python3
"""Parser do Código de Normas Judiciais (TJCE) -> public/data.json
Regra: o texto normativo NUNCA é reescrito; só limpeza de ruído de conversão
(números de página soltos, marcas <mark>, quebras de página no meio de frase)."""
import re, json, sys, unicodedata
SRC, OUT = sys.argv[1], sys.argv[2]
raw = open(SRC, encoding='utf-8').read().split('\n')

# ---------- localizar blocos ----------
start = next(i for i,l in enumerate(raw) if re.match(r'^#+\s*\*\*CAPÍTULO I\*\*', l))
anex_start = next(i for i,l in enumerate(raw) if re.match(r'^#+\s*\*\*ANEXOS', l))
body = raw[start:anex_start]
annex = raw[anex_start:]

def clean_line(l):
    l = re.sub(r'</?mark>', '', l)
    l = re.sub(r'<!--.*?-->', '', l)
    return l.rstrip()

stats = {'pageno':0,'merged':0}
def paragraphs(lines):
    """agrupa em parágrafos (separados por linha em branco); tabelas ficam inteiras"""
    out, cur, intable = [], [], False
    def flush():
        nonlocal cur
        if cur:
            out.append(('table' if cur[0].lstrip().startswith('|') else 'p', cur)); cur=[]
    for l in lines:
        l = clean_line(l)
        if not l.strip():
            flush(); continue
        if re.fullmatch(r'\s*\d{1,3}\s*', l):      # nº de página solto
            stats['pageno']+=1; flush(); continue
        t = l.lstrip().startswith('|')
        if cur and (cur[0].lstrip().startswith('|')) != t: flush()
        cur.append(l)
    flush()
    res=[]
    for kind, ls in out:
        if kind=='table': res.append(['table','\n'.join(ls)])
        else: res.append(['p', re.sub(r'\s+',' ',' '.join(ls)).strip()])
    return res

def norm_hdr(s):
    s = re.sub(r'^#+\s*','',s).strip()
    s = s.replace('**','').replace('_','').strip()
    return re.sub(r'\s+',' ',s)

ART = re.compile(r'^(?:#+\s*)?\*\*\s*Art\.\s*(\d+)\s*[º°o]?\s*(?:-\s*([A-Z]))?\s*(\.)?\s*\*{0,2}\s*\.?\s*(.*)$', re.S)
ART_INLINE = re.compile(r'Art\.\s*(\d+)\s*[º°]?\s*(?:-\s*([A-Z]))?\.\s*(\(\s*Revogad[^)]*\))')
CH = re.compile(r'^(?:#+\s*)?\*{0,2}CAPÍTULO ([IVXL]+)\*{0,2}\s*$')
SEC = re.compile(r'^(?:#+\s*)?\*{0,2}(Seção|Subseção) ([IVXL]+(?:-[A-Z])?)\*{0,2}\s*$')
RANGE = re.compile(r'^\*\*\(Arts?\. (\d+) ao (\d+)\s*-\s*Revogad[^)]*\)\*\*$')

raw_paras = paragraphs(body)

# ---------- fusão de quebras de página no meio da frase ----------
def is_struct(t):
    return bool(ART.match(t) or CH.match(t) or SEC.match(t) or t.startswith('#') or RANGE.match(t)
                or re.match(r'^\*{0,2}(§|Parágrafo único|[IVXLC]+\s*[-–—.)]|[a-z]\)|\d+\.|\(Revogad|\(Arts)', t))
merged=[]
for kind,t in raw_paras:
    if (merged and kind=='p' and merged[-1][0]=='p' and not is_struct(t) and t[:1].islower()
        and not re.search(r'[.:;!?»”)\]]\*{0,2}$', merged[-1][1].rstrip()) and not merged[-1][1].startswith('#')):
        merged[-1][1] += ' ' + t; stats['merged']+=1
    else: merged.append([kind,t])

# ---------- percorrer ----------
chapters=[]; cur_ch=None; cur_sec=None; cur_sub=None
articles=[]; cur=None; pending_title=None; notes=[]; ranges=[]
def new_nodes_title():
    pass
i=0
def split_multi(t):
    """linha única com vários 'Art. N. (Revogado ...)' (ex.: Arts. 70-76)"""
    ms=list(ART_INLINE.finditer(t))
    return ms if len(ms)>1 else None

for kind,t in merged:
    if kind=='table':
        if cur is None: continue
        cur['blocks'].append({'t':'table','x':t}); continue
    m = CH.match(t)
    if m:
        cur_ch={'num':m.group(1),'title':None,'sections':[],'id':'cap-'+m.group(1)}
        chapters.append(cur_ch); cur_sec=cur_sub=None; cur=None; pending_title=('ch',cur_ch); continue
    m = SEC.match(t)
    if m:
        node={'kind':m.group(1),'num':m.group(2),'title':None,'chapter':cur_ch['num']}
        if m.group(1)=='Seção':
            cur_sec=node; cur_sub=None; cur_ch['sections'].append(node)
        else:
            cur_sub=node; (cur_sec['subs'] if cur_sec and 'subs' in cur_sec else None)
            if cur_sec is None:
                cur_sec={'kind':'Seção','num':'—','title':None,'chapter':cur_ch['num']}; cur_ch['sections'].append(cur_sec)
            cur_sec.setdefault('subs',[]).append(node)
        cur=None; pending_title=('s',node); continue
    m = RANGE.match(t)
    if m:
        ranges.append({'from':int(m.group(1)),'to':int(m.group(2)),'text':t.replace('**',''),
                       'chapter':cur_ch['num'],'section':cur_sec['num'] if cur_sec else None})
        cur=None; pending_title=None; continue
    if pending_title and not ART.match(t) and (t.startswith('#') or t.startswith('**')) :
        txt=norm_hdr(t); 
        if txt and not txt.startswith('Art.') and not txt.startswith('(Revog'):
            pending_title[1]['title']=txt; pending_title=None; continue
    if pending_title and not ART.match(t) and not is_struct(t):
        pending_title[1]['title']=norm_hdr(t); pending_title=None; continue
    # artigos
    ms = split_multi(t)
    if ms:
        for mm in ms:
            num=mm.group(1)+('-'+mm.group(2) if mm.group(2) else '')
            articles.append({'id':'art-'+num,'num':num,'n':int(mm.group(1)),'suf':mm.group(2) or '',
                'chapter':cur_ch['num'],'section':cur_sec['num'] if cur_sec else None,
                'sub':cur_sub['num'] if cur_sub else None,'blocks':[{'t':'p','x':mm.group(3)}],'revoked':True})
        cur=None; pending_title=None; continue
    m = ART.match(t)
    if m:
        pending_title=None
        num=m.group(1)+('-'+m.group(2) if m.group(2) else '')
        rest=m.group(4).strip()
        cur={'id':'art-'+num,'num':num,'n':int(m.group(1)),'suf':m.group(2) or '',
             'chapter':cur_ch['num'],'section':cur_sec['num'] if cur_sec else None,
             'sub':cur_sub['num'] if cur_sub else None,'blocks':[],'revoked':False}
        if rest: cur['blocks'].append({'t':'p','x':rest})
        articles.append(cur); continue
    pending_title=None
    if cur is not None:
        cur['blocks'].append({'t':'p','x':t})
    else:
        tgt = cur_sub or cur_sec or cur_ch
        if tgt is not None and re.match(r'^(?:#+\s*)?\*{0,2}\(', t):
            tgt.setdefault('note',[]).append(norm_hdr(t))
        else:
            notes.append({'chapter':cur_ch['num'] if cur_ch else None,'text':t})

# revogado: caput inteiro é "(Revogado ...)"
for a in articles:
    first=' '.join(b['x'] for b in a['blocks'][:1] if b['t']=='p').replace('*','').strip()
    if re.match(r'^\(?\s*Revogad[oa]', first): a['revoked']=True

# ---------- anexos ----------
ann_paras = paragraphs(annex)
annexes=[]; ca=None
AN = re.compile(r'^(?:#+\s*)?\*{0,2}\s*ANEXO\s+([IVXL]+)\s*[–-]\s*(.*?)\*{0,2}$')
for kind,t in ann_paras:
    m=AN.match(t)
    if m and not t.startswith('|'):
        ca={'num':m.group(1),'title':re.sub(r'\*','',m.group(2)).strip(),'id':'anexo-'+m.group(1),'blocks':[],'revoked':False}
        annexes.append(ca); continue
    if ca is None: continue
    ca['blocks'].append({'t':kind if kind=='table' else 'p','x':t})
for a in annexes:
    if any('Revogado' in b['x'] for b in a['blocks'][:2]): a['revoked']=True

data={'chapters':chapters,'articles':articles,'ranges':ranges,'annexes':annexes,'notes':notes,
      'meta':{'stats':stats}}
json.dump(data,open(OUT,'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('capítulos',len(chapters),'artigos',len(articles),'ranges',len(ranges),'anexos',len(annexes),'notas órfãs',len(notes),stats)
