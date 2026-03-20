# 📜 Código de Normas Judiciais — TJCE
### Portal de Consulta para Servidores do Poder Judiciário do Ceará

> Provimento nº 02/2021/CGJCE · 28 Capítulos · 469 Artigos

---

## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js 18+ instalado ([baixar aqui](https://nodejs.org))

### Instalação e execução

```bash
# 1. Entre na pasta do projeto
cd tjce-normas

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

O site abrirá em: **http://localhost:5173**

### Build para produção

```bash
npm run build
# Arquivos gerados em: dist/
```

---

## 🌐 Hospedagem gratuita

### Vercel (recomendado)
1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "New Project" → "Import Git Repository"
3. Faça upload da pasta ou conecte ao GitHub
4. Framework Preset: **Vite**
5. Clique em "Deploy"

### Netlify
1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta `dist/` (após rodar `npm run build`) para o painel
3. Site publicado instantaneamente

---

## ⚙️ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 🔍 Busca por palavras-chave | Pesquisa em todos os 469 artigos |
| 📖 Estrutura Completa | Navegação fiel ao Código original (28 Cap.) |
| ⚖️ Por Tipo de Vara | Filtro prático: Criminal, Cível, Execução, etc. |
| 🎙️ Filtro Temático | Audiências, Prazos, Citações, Mandados, etc. |
| ⭐ Favoritos | Marque artigos para acesso rápido |
| 🕐 Recentes | Histórico dos últimos artigos acessados |
| 📋 Copiar Artigo | Copia o texto completo formatado |
| ⚡ Modo Servidor | Interface simplificada para uso em audiências |

---

## ⚡ Modo Servidor

Pensado para uso durante **audiências e atendimento ao público**:
- Interface escura, foco total na busca
- Resultados instantâneos
- Botão de cópia rápida em cada artigo
- Atalhos para termos mais usados

---

## 📁 Estrutura do Projeto

```
tjce-normas/
├── src/
│   ├── App.jsx          ← Aplicação completa (dados + interface)
│   ├── main.jsx         ← Ponto de entrada React
│   └── index.css        ← Reset CSS mínimo
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚖️ Nota Jurídica

Este portal não altera, interpreta nem complementa o texto do Código de Normas Judiciais. 
Todos os artigos são exibidos com **fidelidade absoluta** ao Provimento nº 02/2021/CGJCE.

A organização "Por Tipo de Vara" é uma classificação de uso prático e não substitui a 
estrutura oficial do Código. Em caso de dúvida, consulte sempre a **Estrutura Completa**.

**Fonte oficial:** Corregedoria-Geral da Justiça do Estado do Ceará (CGJCE)

---

## 🛠️ Tecnologias

- **React 18** — Interface de usuário
- **Vite** — Build tool e dev server
- **CSS inline** — Estilização sem dependências externas
- **localStorage** — Persistência de favoritos e histórico

