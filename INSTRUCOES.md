# 🚀 Instruções Rápidas - AnimeStream Pro

## Instalação

```bash
# 1. Navegue até a pasta
cd /mnt/okcomputer/output

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm start

# 4. Acesse no navegador
http://localhost:3000
```

## Credenciais Padrão
- **Usuário:** `admin`
- **Senha:** `admin`

> ⚠️ **Altere a senha após o primeiro login!**

## Funcionalidades Principais

### 🎬 Players Suportados
- YouTube, Google Drive, Blogger
- Anivideo (HLS/M3U8)
- MP4Upload, StreamSB, DoodStream
- Filemoon, StreamTape, VK, OK.ru
- MP4 direto, iFrame

### 🔞 Conteúdo +18
- Acesse `/adult` (requer verificação de idade)
- Tags adultas: Hentai, Yaoi +18, Yuri +18, Ecchi Hard

### 🏷️ Tags/Gêneros
22 gêneros pré-cadastrados: Ação, Aventura, Comédia, Drama, Ecchi, Escolar, Esporte, Fantasia, Harem, Isekai, Magia, Mecha, Mistério, Romance, Sci-Fi, Shoujo, Shounen, Sobrenatural, Suspense, Terror, Yaoi, Yuri

### 👤 Área do Usuário
- Histórico de visualização
- Favoritos
- Watchlist
- Perfil personalizado

### ⚙️ Painel Admin (`/admin`)
- Gerenciar animes e episódios
- Gerenciar tags
- Gerenciar usuários
- Configurar banners
- Configurar anúncios
- Configurações do site

## Estrutura de Pastas

```
├── data/              # Banco de dados JSON
├── public/            # Arquivos estáticos
│   ├── css/
│   ├── js/
│   └── images/
├── views/             # Templates EJS
│   ├── admin/
│   └── partials/
├── server.js          # Servidor principal
└── package.json
```

## Comandos

```bash
npm start      # Iniciar servidor
npm run dev    # Modo desenvolvimento (nodemon)
```

## URLs Importantes

| URL | Descrição |
|-----|-----------|
| `/` | Página inicial |
| `/admin` | Painel administrativo |
| `/login` | Login |
| `/register` | Cadastro |
| `/search` | Busca |
| `/genres` | Lista de gêneros |
| `/schedule` | Calendário de lançamentos |
| `/adult` | Conteúdo +18 |
| `/api/animes` | API - Lista animes |

## Suporte

Para mais detalhes, consulte o arquivo `README.md` completo.
