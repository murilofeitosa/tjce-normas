# Código de Normas Judiciais — TJCE (consulta)

Site de consulta ao **Código de Normas Judiciais da CGJCE (Provimento nº 02/2021/CGJCE)**,
versão consolidada com alterações até o Prov. nº 09/2026/CGJCE (DJeA 22/05/2026).

## O que tem
Busca com sugestões (palavra, nº do artigo, ex.: `311-A`), estrutura oficial (28 capítulos, seções e subseções),
445 artigos + os com letras, 20 anexos, artigos revogados esmaecidos, histórico de alterações de cada artigo,
copiar com citação, imprimir/PDF, favoritos, recentes, "mais consultados por você", filtros temáticos,
alterações 2025–2026, modo escuro, **Modo Servidor** e uso no celular.

**Regra de fidelidade:** o texto não é reescrito. A aba "Por tipo de vara" agrupa somente capítulos de matéria
inequívoca (penal, execução penal, infância e juventude) e sempre exibe o aviso:
"Organização por uso prático. Consulte a estrutura oficial para leitura integral."

## Rodar no computador (opcional)
    npm install
    npm run dev        # abre em http://localhost:5173
    npm run build      # gera a pasta dist/

## Atualizar o texto do Código no futuro
1. Substitua `fonte/codigo-de-normas.md` pelo novo arquivo Markdown.
2. Rode `npm run dados` (precisa de Python 3). Isso regenera `public/data.json` e mostra as contagens.

## Publicar SEM instalar nada
### 1) GitHub (pelo navegador)
1. Entre em github.com e faça login. Clique em **+** (canto superior direito) → **New repository**.
2. Nome: `codigo-de-normas-tjce`. Marque **Public** (ou Private). Clique **Create repository**.
3. Na página do repositório, clique em **uploading an existing file**.
4. Descompacte o .zip no seu computador, abra a pasta e **arraste o CONTEÚDO** (não a pasta em si) para a janela do GitHub:
   `src`, `public`, `scripts`, `fonte`, `index.html`, `package.json`, `vite.config.js`, `README.md`.
5. Clique **Commit changes**.
### 2) Vercel
1. Entre em vercel.com → **Sign Up** → **Continue with GitHub**.
2. **Add New… → Project** → escolha o repositório `codigo-de-normas-tjce` → **Import**.
3. Não mude nada (o Vercel reconhece Vite sozinho). Clique **Deploy**.
4. Em ~1 minuto você recebe um link `https://….vercel.app` — funciona no PC e no celular.
(Netlify: **Add new site → Import from GitHub**, build `npm run build`, publish `dist`.)

## Aviso
Ferramenta de consulta. Confira sempre a versão oficial publicada pela Corregedoria-Geral da Justiça.
