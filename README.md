# 🎌 AnimeStream Pro

Plataforma profissional de streaming de animes com design moderno, suporte a múltiplos players, sistema de tags completo, conteúdo +18 com verificação de idade e painel administrativo completo.

![AnimeStream Pro](https://img.shields.io/badge/AnimeStream-Pro-ff4757?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-14+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18+-000000?style=for-the-badge&logo=express&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Funcionalidades

### 🎬 Sistema de Vídeo
- **Múltiplos Players Suportados:**
  - ✅ YouTube
  - ✅ Google Drive
  - ✅ Blogger/Blogspot
  - ✅ Anivideo (HLS/M3U8)
  - ✅ MP4Upload
  - ✅ StreamSB
  - ✅ DoodStream
  - ✅ Filemoon
  - ✅ StreamTape
  - ✅ VK Video
  - ✅ OK.ru
  - ✅ Vídeo MP4 Direto
  - ✅ iFrame Genérico

### 🏷️ Sistema de Tags
- 22 gêneros pré-cadastrados (Ação, Aventura, Comédia, Drama, Ecchi, etc.)
- Tags personalizáveis no painel admin
- Filtragem por múltiplas tags
- Cores e ícones para cada tag

### 🔞 Conteúdo Adulto
- Seção exclusiva +18
- Verificação de idade obrigatória
- Tags adultas separadas (Hentai, Yaoi +18, Yuri +18, Ecchi Hard)
- Controle de acesso por usuário

### 👤 Sistema de Usuários
- Registro e login
- Histórico de visualização
- Lista de favoritos
- Watchlist (quero assistir)
- Peril personalizado
- Avatar customizável

### 💬 Interação
- Sistema de comentários em animes e episódios
- Curtir comentários
- Reportar problemas
- Compartilhar nas redes sociais

### 📅 Calendário
- Lançamentos por dia da semana
- Destaque para o dia atual
- Horários de lançamento

### 🔍 Busca Avançada
- Busca por título, sinônimos, estúdio
- Filtros por gênero, status, tipo, ano
- Ordenação por relevância, data, avaliação, views

### 📱 Design Responsivo
- Layout adaptável para desktop, tablet e mobile
- Menu mobile otimizado
- Touch gestures
- Lazy loading de imagens

### ⚡ Performance
- Carregamento otimizado
- Imagens com lazy loading
- Cache de dados
- Animações suaves

## 🚀 Instalação

### Requisitos
- Node.js 14+ 
- NPM ou Yarn

### Passo a Passo

1. **Clone ou baixe o projeto:**
```bash
cd animestream-pro
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Inicie o servidor:**
```bash
npm start
```

Ou para desenvolvimento com auto-reload:
```bash
npm run dev
```

4. **Acesse no navegador:**
```
http://localhost:3000
```

### Credenciais Padrão
- **Usuário:** `admin`
- **Senha:** `admin`

> ⚠️ **Importante:** Altere a senha do admin após o primeiro login!

## 📁 Estrutura de Pastas

```
animestream-pro/
├── data/                   # Arquivos JSON (banco de dados)
│   ├── animes.json
│   ├── episodes.json
│   ├── users.json
│   ├── tags.json
│   ├── comments.json
│   └── config.json
├── public/                 # Arquivos estáticos
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       └── (uploads de imagens)
├── views/                  # Templates EJS
│   ├── partials/
│   │   ├── head.ejs
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── admin/              # Páginas do painel admin
│   ├── index.ejs
│   ├── anime.ejs
│   ├── watch.ejs
│   ├── search.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── adult.ejs
│   └── ...
├── server.js               # Servidor principal
├── package.json
└── README.md
```

## 🎨 Personalização

### Configurações do Site
Acesse `/admin/settings` para configurar:
- Nome do site
- Descrição
- Cores principais
- SEO (título, descrição, keywords)
- Redes sociais
- Ativar/desativar registros
- Ativar/desativar comentários
- Ativar/desativar conteúdo +18

### Anúncios
Configure anúncios em `/admin/ads`:
- Header
- Sidebar
- Vídeo (pre-roll)
- Footer
- Popunder

### Tags/Gêneros
Gerencie tags em `/admin/tags`:
- Adicionar novos gêneros
- Definir cor e ícone
- Separar tags adultas

## 📖 Como Usar

### Adicionar um Anime

1. Faça login como admin
2. Acesse `/admin/animes`
3. Clique em "Adicionar Anime"
4. Preencha os dados:
   - Título
   - Descrição/Sinopse
   - Imagem de capa (upload ou URL)
   - Banner (opcional)
   - Gêneros/Tags
   - Ano, temporada, estúdio
   - Status (Em lançamento, Completo, Pausado)
   - Classificação indicativa
   - Marcar como +18 se necessário
5. Salvar

### Adicionar Episódios

1. Na lista de animes, clique em "Episódios"
2. Clique em "Adicionar Episódio"
3. Preencha:
   - Número do episódio
   - Título (opcional)
   - URL do vídeo
   - Tipo de vídeo (auto-detectado ou manual)
   - URL de download (opcional)
   - Thumbnail (opcional)
4. Salvar

### URLs de Vídeo Suportadas

**YouTube:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

**Google Drive:**
- `https://drive.google.com/file/d/FILE_ID/view`
- `https://drive.google.com/open?id=FILE_ID`

**Blogger:**
- `https://www.blogger.com/video.g?token=TOKEN`

**Anivideo/M3U8:**
- `https://api.anivideo.net/videohls.php?d=URL`
- Qualquer URL terminando em `.m3u8`

**MP4Upload:**
- `https://www.mp4upload.com/embed-XXXX.html`

**StreamSB:**
- `https://streamsb.net/embed-xxxxx.html`

**DoodStream:**
- `https://dood.to/e/xxxxx`

**Filemoon:**
- `https://filemoon.sx/e/xxxxx`

**StreamTape:**
- `https://streamtape.com/e/xxxxx`

**VK:**
- `https://vk.com/video-XXXX_YYYY`

**OK.ru:**
- `https://ok.ru/video/XXXX`

**MP4 Direto:**
- Qualquer URL terminando em `.mp4`

## 🔐 Segurança

- Senhas criptografadas com bcrypt
- Sessões seguras
- Proteção contra XSS (EJS escapa automaticamente)
- Validação de inputs
- Controle de acesso por permissões

## 🛠️ API Endpoints

### Públicos
- `GET /api/animes` - Lista todos os animes
- `GET /api/anime/:id` - Detalhes de um anime
- `GET /api/episodes/:animeId` - Episódios de um anime
- `GET /api/search?q=query` - Busca de animes
- `GET /api/tags` - Lista todas as tags

### Autenticados
- `POST /favorite/:animeId` - Adicionar/remover favorito
- `POST /watchlist/:animeId` - Adicionar/remover watchlist
- `POST /comment` - Adicionar comentário
- `POST /api/report` - Reportar problema

## 📝 To-Do / Futuras Implementações

- [ ] Sistema de notificações
- [ ] Player customizado com Plyr.js
- [ ] Sistema de download automático
- [ ] Integração com APIs externas (AniList, MyAnimeList)
- [ ] Sistema de recomendações
- [ ] App mobile (PWA completo)
- [ ] Sistema de doações
- [ ] Chat ao vivo
- [ ] Sistema de conquistas
- [ ] Modo noturno/claro

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests
- Melhorar a documentação

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## ⚠️ Aviso Legal

Este é um projeto educacional. O conteúdo disponibilizado é de responsabilidade dos usuários. Respeite as leis de direitos autorais do seu país.

---

<p align="center">
  Feito com ❤️ para fãs de anime
</p>
