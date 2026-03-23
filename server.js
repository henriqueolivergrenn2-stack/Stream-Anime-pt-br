const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'animestream-secret-key-2024-henshin',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 dias
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(expressLayouts);
app.set('layout', 'layout');

// ============================================
// DIRETÓRIOS
// ============================================
const DATA_DIR = './data';
const IMAGES_DIR = './public/images';
const BANNERS_DIR = './public/images/banners';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(BANNERS_DIR)) fs.mkdirSync(BANNERS_DIR, { recursive: true });

// ============================================
// HELPERS
// ============================================
function loadJSON(filename) {
    const filepath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filepath)) {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
    return {};
}

function saveJSON(filename, data) {
    const filepath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// Detectar tipo de vídeo pela URL
function detectVideoType(url) {
    if (!url) return 'mp4';
    
    const lowerUrl = url.toLowerCase();
    
    // Google Drive
    if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('googleusercontent.com')) {
        return 'gdrive';
    }
    
    // YouTube
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        return 'youtube';
    }
    
    // Blogger
    if (lowerUrl.includes('blogger.com') || lowerUrl.includes('blogspot.com') || lowerUrl.includes('video.g?token=')) {
        return 'blogger';
    }
    
    // Anivideo / M3U8
    if (lowerUrl.includes('anivideo.net') || lowerUrl.includes('.m3u8') || lowerUrl.includes('videohls')) {
        return 'hls';
    }
    
    // MP4Upload
    if (lowerUrl.includes('mp4upload.com') || lowerUrl.includes('mp4upload')) {
        return 'mp4upload';
    }
    
    // StreamSB / Sbembed
    if (lowerUrl.includes('streamsb.net') || lowerUrl.includes('sbembed.com') || lowerUrl.includes('sbbrisk.com')) {
        return 'streamsb';
    }
    
    // DoodStream
    if (lowerUrl.includes('dood.ws') || lowerUrl.includes('dood.to') || lowerUrl.includes('dood.so')) {
        return 'doodstream';
    }
    
    // Filemoon
    if (lowerUrl.includes('filemoon.sx') || lowerUrl.includes('filemoon')) {
        return 'filemoon';
    }
    
    // StreamTape
    if (lowerUrl.includes('streamtape.com') || lowerUrl.includes('streamtape')) {
        return 'streamtape';
    }
    
    // VK
    if (lowerUrl.includes('vk.com') || lowerUrl.includes('vkvideo.ru')) {
        return 'vk';
    }
    
    // Odnoklassniki (OK.ru)
    if (lowerUrl.includes('ok.ru')) {
        return 'okru';
    }
    
    // Direct MP4
    if (lowerUrl.endsWith('.mp4') || lowerUrl.includes('.mp4?')) {
        return 'mp4';
    }
    
    return 'iframe';
}

// Processar URL do vídeo para embed
function processVideoUrl(url, type) {
    if (!url) return '';
    
    switch (type) {
        case 'youtube':
            // Extrair ID do YouTube
            const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
            if (ytMatch) {
                return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
            }
            return url;
            
        case 'gdrive':
            // Converter Google Drive para embed
            const gdMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
            if (gdMatch) {
                return `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
            }
            return url;
            
        case 'blogger':
            // Blogger já é direto
            return url;
            
        case 'hls':
            // M3U8 - retornar URL original para player HLS
            return url;
            
        case 'mp4upload':
            const mp4Match = url.match(/embed-([^.]+)/);
            if (mp4Match) {
                return `https://www.mp4upload.com/embed-${mp4Match[1]}.html`;
            }
            return url.replace('view', 'embed');
            
        case 'streamsb':
            const sbMatch = url.match(/\/e\/(.+)$/);
            if (sbMatch) {
                return `https://streamsb.net/embed-${sbMatch[1]}.html`;
            }
            return url;
            
        case 'doodstream':
            const doodMatch = url.match(/\/e\/(.+)$/);
            if (doodMatch) {
                return `https://dood.to/e/${doodMatch[1]}`;
            }
            return url;
            
        case 'filemoon':
            return url.replace('/e/', '/embed/');
            
        case 'streamtape':
            const stMatch = url.match(/\/e\/(.+)$/);
            if (stMatch) {
                return `https://streamtape.com/e/${stMatch[1]}`;
            }
            return url;
            
        case 'vk':
            const vkMatch = url.match(/video(-?\d+_\d+)/);
            if (vkMatch) {
                return `https://vk.com/video_ext.php?oid=${vkMatch[1].split('_')[0]}&id=${vkMatch[1].split('_')[1]}&hd=2`;
            }
            return url;
            
        case 'okru':
            const okMatch = url.match(/video\/(\d+)/);
            if (okMatch) {
                return `https://ok.ru/videoembed/${okMatch[1]}`;
            }
            return url;
            
        default:
            return url;
    }
}

// ============================================
// INICIALIZAÇÃO DE DADOS
// ============================================
function initData() {
    // Usuários
    if (!fs.existsSync(path.join(DATA_DIR, 'users.json'))) {
        const adminUser = {
            admin: {
                id: uuidv4(),
                username: 'admin',
                password: bcrypt.hashSync('admin', 10),
                email: 'admin@animestream.com',
                isAdmin: true,
                isAdult: true,
                createdAt: new Date().toISOString(),
                history: [],
                favorites: [],
                watchlist: []
            }
        };
        saveJSON('users.json', adminUser);
    }
    
    // Animes
    if (!fs.existsSync(path.join(DATA_DIR, 'animes.json'))) {
        saveJSON('animes.json', {});
    }
    
    // Episódios
    if (!fs.existsSync(path.join(DATA_DIR, 'episodes.json'))) {
        saveJSON('episodes.json', {});
    }
    
    // Tags/Categorias
    if (!fs.existsSync(path.join(DATA_DIR, 'tags.json'))) {
        saveJSON('tags.json', {
            'acao': { id: 'acao', name: 'Ação', color: '#ff4757', icon: '⚔️' },
            'aventura': { id: 'aventura', name: 'Aventura', color: '#2ed573', icon: '🗺️' },
            'comedia': { id: 'comedia', name: 'Comédia', color: '#ffa502', icon: '😂' },
            'drama': { id: 'drama', name: 'Drama', color: '#747d8c', icon: '🎭' },
            'ecchi': { id: 'ecchi', name: 'Ecchi', color: '#ff6b81', icon: '💋' },
            'escolar': { id: 'escolar', name: 'Escolar', color: '#3742fa', icon: '🎒' },
            'esporte': { id: 'esporte', name: 'Esporte', color: '#2ed573', icon: '⚽' },
            'fantasia': { id: 'fantasia', name: 'Fantasia', color: '#a55eea', icon: '🔮' },
            'harem': { id: 'harem', name: 'Harem', color: '#ff9ff3', icon: '💕' },
            'isekai': { id: 'isekai', name: 'Isekai', color: '#5f27cd', icon: '🌀' },
            'magia': { id: 'magia', name: 'Magia', color: '#341f97', icon: '✨' },
            'mecha': { id: 'mecha', name: 'Mecha', color: '#576574', icon: '🤖' },
            'misterio': { id: 'misterio', name: 'Mistério', color: '#2f3542', icon: '🔍' },
            'romance': { id: 'romance', name: 'Romance', color: '#ff6b81', icon: '💘' },
            'scifi': { id: 'scifi', name: 'Sci-Fi', color: '#00d2d3', icon: '🚀' },
            'shoujo': { id: 'shoujo', name: 'Shoujo', color: '#ff9ff3', icon: '🌸' },
            'shounen': { id: 'shounen', name: 'Shounen', color: '#ff4757', icon: '🔥' },
            'sobrenatural': { id: 'sobrenatural', name: 'Sobrenatural', color: '#5f27cd', icon: '👻' },
            'suspense': { id: 'suspense', name: 'Suspense', color: '#2f3542', icon: '😰' },
            'terror': { id: 'terror', name: 'Terror', color: '#2f3542', icon: '💀' },
            'yaoi': { id: 'yaoi', name: 'Yaoi', color: '#54a0ff', icon: '🌈' },
            'yuri': { id: 'yuri', name: 'Yuri', color: '#ff9ff3', icon: '🌺' }
        });
    }
    
    // Gêneros +18
    if (!fs.existsSync(path.join(DATA_DIR, 'adult-tags.json'))) {
        saveJSON('adult-tags.json', {
            'hentai': { id: 'hentai', name: 'Hentai', color: '#ff3838', icon: '🔞' },
            'yaoi-adult': { id: 'yaoi-adult', name: 'Yaoi (+18)', color: '#54a0ff', icon: '🔞' },
            'yuri-adult': { id: 'yuri-adult', name: 'Yuri (+18)', color: '#ff9ff3', icon: '🔞' },
            'ecchi-hard': { id: 'ecchi-hard', name: 'Ecchi Hard', color: '#ff6b81', icon: '🔞' }
        });
    }
    
    // Configurações
    if (!fs.existsSync(path.join(DATA_DIR, 'config.json'))) {
        saveJSON('config.json', {
            siteName: 'AnimeStream Pro',
            siteDescription: 'Assista seus animes favoritos online em HD',
            siteLogo: '/images/logo.png',
            primaryColor: '#ff4757',
            secondaryColor: '#2f3542',
            enableAdultContent: true,
            adultVerification: true,
            defaultPlayer: 'auto',
            commentsEnabled: true,
            registrationsEnabled: true,
            ads: {
                header: '',
                sidebar: '',
                video: '',
                footer: '',
                popunder: ''
            },
            seo: {
                title: 'AnimeStream Pro - Assista Animes Online HD',
                description: 'O melhor site para assistir animes online em HD. Catálogo completo com legendas em português.',
                keywords: 'anime, online, hd, legendado, assistir, streaming'
            },
            social: {
                discord: '',
                telegram: '',
                twitter: '',
                instagram: ''
            }
        });
    }
    
    // Comentários
    if (!fs.existsSync(path.join(DATA_DIR, 'comments.json'))) {
        saveJSON('comments.json', {});
    }
    
    // Banners
    if (!fs.existsSync(path.join(DATA_DIR, 'banners.json'))) {
        saveJSON('banners.json', {});
    }
    
    // Notificações
    if (!fs.existsSync(path.join(DATA_DIR, 'notifications.json'))) {
        saveJSON('notifications.json', {});
    }
    
    // Relatórios
    if (!fs.existsSync(path.join(DATA_DIR, 'reports.json'))) {
        saveJSON('reports.json', {});
    }
}

initData();

// ============================================
// AUTH MIDDLEWARE
// ============================================
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.userId || !req.session.isAdmin) {
        return res.redirect('/');
    }
    next();
}

function requireAdult(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    
    const users = loadJSON('users.json');
    const user = Object.values(users).find(u => u.id === req.session.userId);
    
    if (!user || !user.isAdult) {
        return res.render('adult-verification', { 
            config: loadJSON('config.json'),
            user: req.session,
            redirect: req.originalUrl
        });
    }
    next();
}

// ============================================
// MULTER CONFIG
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'banner') {
            cb(null, BANNERS_DIR);
        } else {
            cb(null, IMAGES_DIR);
        }
    },
    filename: (req, file, cb) => {
        const prefix = file.fieldname === 'banner' ? 'banner' : 'anime';
        cb(null, `${prefix}_${uuidv4()}_${file.originalname}`);
    }
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Apenas imagens são permitidas!'));
    }
});

// ============================================
// HELPERS DE VIEW
// ============================================
function getAnimeStats(animeId) {
    const episodes = loadJSON('episodes.json');
    const comments = loadJSON('comments.json');
    
    const animeEpisodes = Object.values(episodes).filter(ep => ep.animeId === animeId);
    const animeComments = Object.values(comments).filter(c => c.animeId === animeId);
    
    return {
        episodesCount: animeEpisodes.length,
        commentsCount: animeComments.length,
        lastEpisode: animeEpisodes.sort((a, b) => b.number - a.number)[0] || null
    };
}

function getRelatedAnimes(anime, limit = 6) {
    const animes = loadJSON('animes.json');
    const tags = anime.tags || [];
    
    return Object.entries(animes)
        .filter(([id, a]) => {
            if (id === anime.id) return false;
            if (anime.isAdult !== a.isAdult) return false;
            const aTags = a.tags || [];
            return tags.some(tag => aTags.includes(tag));
        })
        .sort((a, b) => {
            const aCommon = (a[1].tags || []).filter(t => tags.includes(t)).length;
            const bCommon = (b[1].tags || []).filter(t => tags.includes(t)).length;
            return bCommon - aCommon;
        })
        .slice(0, limit);
}

// ============================================
// ROUTES - PÁGINAS PRINCIPAIS
// ============================================

// Home
app.get('/', (req, res) => {
    const animes = loadJSON('animes.json');
    const episodes = loadJSON('episodes.json');
    const config = loadJSON('config.json');
    const banners = loadJSON('banners.json');
    const tags = loadJSON('tags.json');
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    
    // Filtrar conteúdo adulto se usuário não tiver permissão
    const canViewAdult = req.session.userId && req.session.isAdult;
    
    // Episódios Novos (última semana)
    const newEpisodes = {};
    Object.entries(episodes).forEach(([id, ep]) => {
        if (ep.createdAt > oneWeekAgo) {
            const anime = animes[ep.animeId];
            if (anime && (!anime.isAdult || canViewAdult)) {
                newEpisodes[id] = { episode: ep, anime };
            }
        }
    });
    
    // Histórico do usuário
    let userHistory = [];
    if (req.session.userId) {
        const users = loadJSON('users.json');
        const user = Object.values(users).find(u => u.id === req.session.userId);
        if (user && user.history) {
            userHistory = user.history.slice(0, 12).map(h => {
                const anime = animes[h.animeId];
                const episode = episodes[h.episodeId];
                return { anime, episode, watchedAt: h.watchedAt };
            }).filter(h => h.anime && h.episode && (!h.anime.isAdult || canViewAdult));
        }
    }
    
    // Obras Novas
    const newAnimes = {};
    Object.entries(animes).forEach(([id, anime]) => {
        if (anime.createdAt > twoWeeksAgo && (!anime.isAdult || canViewAdult)) {
            newAnimes[id] = anime;
        }
    });
    
    // Animes Populares (por views)
    const popularAnimes = Object.entries(animes)
        .filter(([_, a]) => !a.isAdult || canViewAdult)
        .sort((a, b) => (b[1].views || 0) - (a[1].views || 0))
        .slice(0, 12);
    
    // Animes em Destaque
    const featuredAnimes = Object.entries(animes)
        .filter(([_, a]) => a.isFeatured && (!a.isAdult || canViewAdult))
        .slice(0, 6);
    
    // Todos os Animes (ordem alfabética)
    const allAnimes = Object.entries(animes)
        .filter(([_, a]) => !a.isAdult || canViewAdult)
        .sort((a, b) => a[1].title.localeCompare(b[1].title));
    
    // Banners ativos
    const activeBanners = Object.values(banners).filter(b => b.active);
    
    res.render('index', {
        newEpisodes,
        userHistory,
        newAnimes,
        popularAnimes,
        featuredAnimes,
        allAnimes,
        banners: activeBanners,
        tags,
        config,
        user: req.session
    });
});

// Página de Anime
app.get('/anime/:id', (req, res) => {
    const animes = loadJSON('animes.json');
    const episodes = loadJSON('episodes.json');
    const config = loadJSON('config.json');
    const tags = loadJSON('tags.json');
    const comments = loadJSON('comments.json');
    
    const anime = animes[req.params.id];
    if (!anime) return res.redirect('/');
    
    // Verificar permissão +18
    if (anime.isAdult && (!req.session.userId || !req.session.isAdult)) {
        return res.render('adult-verification', { 
            config, 
            user: req.session,
            redirect: req.originalUrl
        });
    }
    
    // Incrementar views
    anime.views = (anime.views || 0) + 1;
    saveJSON('animes.json', animes);
    
    // Episódios do anime
    const animeEpisodes = Object.entries(episodes)
        .filter(([_, ep]) => ep.animeId === req.params.id)
        .sort((a, b) => a[1].number - b[1].number);
    
    // Comentários do anime
    const animeComments = Object.entries(comments)
        .filter(([_, c]) => c.animeId === req.params.id)
        .sort((a, b) => new Date(b[1].createdAt) - new Date(a[1].createdAt))
        .slice(0, 20);
    
    // Animes relacionados
    const relatedAnimes = getRelatedAnimes(anime, 6);
    
    // Estatísticas
    const stats = getAnimeStats(req.params.id);
    
    res.render('anime', { 
        anime, 
        episodes: animeEpisodes, 
        comments: animeComments,
        relatedAnimes,
        stats,
        tags, 
        config, 
        user: req.session 
    });
});

// Página de Assistir Episódio
app.get('/watch/:id', (req, res) => {
    // Carregar todos os dados necessários
    const episodes     = loadJSON('episodes.json');
    const animes       = loadJSON('animes.json');
    const config       = loadJSON('config.json');
    const tags         = loadJSON('tags.json');
    const comments     = loadJSON('comments.json');

    // Buscar o episódio solicitado
    const episode = episodes[req.params.id];
    if (!episode) {
        return res.status(404).render('error', {
            message: 'Episódio não encontrado',
            config,
            user: req.session
        });
    }

    // Buscar o anime relacionado
    const anime = animes[episode.animeId];
    if (!anime) {
        return res.status(404).render('error', {
            message: 'Anime relacionado ao episódio não encontrado',
            config,
            user: req.session
        });
    }

    // Verificar restrição de conteúdo +18
    if (anime.isAdult && (!req.session.userId || !req.session.isAdult)) {
        return res.render('adult-verification', { 
            config, 
            user: req.session,
            redirect: req.originalUrl
        });
    }

    // Listar TODOS os episódios do anime (para navegação anterior/próximo e lista)
    const allEpisodes = Object.entries(episodes)
        .filter(([_, ep]) => ep.animeId === episode.animeId)
        .sort((a, b) => a[1].number - b[1].number);  // ordem crescente de número

    // Encontrar posição atual para calcular anterior e próximo
    const currentIndex = allEpisodes.findIndex(([id]) => id === req.params.id);

    const prevEpisode = currentIndex > 0 
        ? allEpisodes[currentIndex - 1] 
        : null;

    const nextEpisode = currentIndex < allEpisodes.length - 1 
        ? allEpisodes[currentIndex + 1] 
        : null;

    // Registrar no histórico do usuário (se estiver logado)
    if (req.session.userId) {
        const users = loadJSON('users.json');
        const user = Object.values(users).find(u => u.id === req.session.userId);
        
        if (user) {
            // Remove entrada anterior do mesmo episódio (evita duplicatas)
            user.history = user.history.filter(h => h.episodeId !== req.params.id);
            
            // Adiciona no início (mais recente primeiro)
            user.history.unshift({
                episodeId: req.params.id,
                animeId: episode.animeId,
                watchedAt: new Date().toISOString()
            });
            
            // Limita histórico a 50 itens (evita crescer indefinidamente)
            user.history = user.history.slice(0, 50);
            
            saveJSON('users.json', users);
        }
    }

    // Determinar tipo de player e URL processada para embed
    const videoType = episode.videoType || detectVideoType(episode.videoUrl);
    const processedVideoUrl = processVideoUrl(episode.videoUrl, videoType);

    // Comentários do episódio (ordenados mais recentes primeiro)
    const episodeComments = Object.entries(comments)
        .filter(([_, c]) => c.episodeId === req.params.id)
        .sort((a, b) => new Date(b[1].createdAt) - new Date(a[1].createdAt));

    // Renderizar a página
    res.render('watch', {
        // Dados principais
        episode,
        anime,
        
        // Navegação entre episódios
        prevEpisode,
        nextEpisode,
        allEpisodes,
        
        // Informações do player (essenciais!)
        videoType,
        processedVideoUrl,
        originalVideoUrl: episode.videoUrl,     // útil para debug ou fallback
        
        // Comentários
        comments: episodeComments,
        
        // Dados do sistema
        config,
        tags,
        user: req.session
    });
});

// Download do episódio
app.get('/download/:id', (req, res) => {
    const episodes = loadJSON('episodes.json');
    const animes = loadJSON('animes.json');
    
    const episode = episodes[req.params.id];
    if (!episode) return res.status(404).json({ error: 'Episódio não encontrado' });
    
    const anime = animes[episode.animeId];
    if (!anime) return res.status(404).json({ error: 'Anime não encontrado' });
    
    // Registrar download
    episode.downloads = (episode.downloads || 0) + 1;
    saveJSON('episodes.json', episodes);
    
    res.json({
        success: true,
        downloadUrl: episode.videoUrl,
        filename: `${anime.title}_EP${episode.number}.mp4`
    });
});

// ============================================
// ROUTES - BUSCA E FILTROS
// ============================================

// Busca
app.get('/search', (req, res) => {
    const query = (req.query.q || '').toLowerCase().trim();
    const tagFilter = req.query.tag;
    const statusFilter = req.query.status;
    const typeFilter = req.query.type;
    const yearFilter = req.query.year;
    const sortBy = req.query.sort || 'relevance';
    
    const animes = loadJSON('animes.json');
    const config = loadJSON('config.json');
    const tags = loadJSON('tags.json');
    
    const canViewAdult = req.session.userId && req.session.isAdult;
    
    let results = Object.entries(animes).filter(([_, anime]) => {
        // Filtrar conteúdo adulto
        if (anime.isAdult && !canViewAdult) return false;
        
        // Busca por texto
        let matchesQuery = true;
        if (query) {
            matchesQuery = 
                anime.title.toLowerCase().includes(query) ||
                (anime.synonyms && anime.synonyms.some(s => s.toLowerCase().includes(query))) ||
                (anime.description && anime.description.toLowerCase().includes(query)) ||
                (anime.studio && anime.studio.toLowerCase().includes(query));
        }
        
        // Filtro por tag
        let matchesTag = true;
        if (tagFilter) {
            const animeTags = anime.tags || [];
            matchesTag = animeTags.includes(tagFilter);
        }
        
        // Filtro por status
        let matchesStatus = true;
        if (statusFilter) {
            matchesStatus = anime.status === statusFilter;
        }
        
        // Filtro por tipo
        let matchesType = true;
        if (typeFilter) {
            matchesType = anime.type === typeFilter;
        }
        
        // Filtro por ano
        let matchesYear = true;
        if (yearFilter) {
            matchesYear = anime.year === parseInt(yearFilter);
        }
        
        return matchesQuery && matchesTag && matchesStatus && matchesType && matchesYear;
    });
    
    // Ordenação
    switch (sortBy) {
        case 'newest':
            results.sort((a, b) => new Date(b[1].createdAt) - new Date(a[1].createdAt));
            break;
        case 'oldest':
            results.sort((a, b) => new Date(a[1].createdAt) - new Date(b[1].createdAt));
            break;
        case 'rating':
            results.sort((a, b) => (b[1].rating || 0) - (a[1].rating || 0));
            break;
        case 'views':
            results.sort((a, b) => (b[1].views || 0) - (a[1].views || 0));
            break;
        case 'alphabetical':
            results.sort((a, b) => a[1].title.localeCompare(b[1].title));
            break;
        default:
            // Relevância - animes com mais views primeiro
            results.sort((a, b) => (b[1].views || 0) - (a[1].views || 0));
    }
    
    res.render('search', { 
        results, 
        query, 
        tagFilter,
        statusFilter,
        typeFilter,
        yearFilter,
        sortBy,
        tags, 
        config, 
        user: req.session 
    });
});

// Lista de gêneros/tags
app.get('/genres', (req, res) => {
    const tags = loadJSON('tags.json');
    const adultTags = loadJSON('adult-tags.json');
    const animes = loadJSON('animes.json');
    const config = loadJSON('config.json');
    
    const canViewAdult = req.session.userId && req.session.isAdult;
    
    // Contar animes por tag
    const tagCounts = {};
    Object.values(animes).forEach(anime => {
        if (anime.isAdult && !canViewAdult) return;
        (anime.tags || []).forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    
    res.render('genres', {
        tags,
        adultTags: canViewAdult ? adultTags : {},
        tagCounts,
        config,
        user: req.session
    });
});

// Calendário de lançamentos
app.get('/schedule', (req, res) => {
    const animes = loadJSON('animes.json');
    const config = loadJSON('config.json');
    
    const canViewAdult = req.session.userId && req.session.isAdult;
    
    // Agrupar por dia da semana
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const schedule = {};
    days.forEach(day => schedule[day] = []);
    
    Object.entries(animes).forEach(([id, anime]) => {
        if (anime.releaseDay && (!anime.isAdult || canViewAdult)) {
            schedule[anime.releaseDay].push({ id, ...anime });
        }
    });
    
    res.render('schedule', {
        schedule,
        days,
        config,
        user: req.session
    });
});

// ============================================
// ROUTES - CONTEÚDO +18
// ============================================

// Página +18
app.get('/adult', requireAdult, (req, res) => {
    const animes = loadJSON('animes.json');
    const episodes = loadJSON('episodes.json');
    const config = loadJSON('config.json');
    const adultTags = loadJSON('adult-tags.json');
    
    // Filtrar apenas conteúdo adulto
    const adultAnimes = Object.entries(animes).filter(([_, a]) => a.isAdult);
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Episódios novos +18
    const newEpisodes = {};
    Object.entries(episodes).forEach(([id, ep]) => {
        if (ep.createdAt > oneWeekAgo) {
            const anime = animes[ep.animeId];
            if (anime && anime.isAdult) {
                newEpisodes[id] = { episode: ep, anime };
            }
        }
    });
    
    // Mais vistos +18
    const popularAnimes = adultAnimes
        .sort((a, b) => (b[1].views || 0) - (a[1].views || 0))
        .slice(0, 12);
    
    // Todos os animes +18
    const allAdultAnimes = adultAnimes
        .sort((a, b) => a[1].title.localeCompare(b[1].title));
    
    res.render('adult', {
        newEpisodes,
        popularAnimes,
        allAdultAnimes,
        adultTags,
        config,
        user: req.session
    });
});

// Verificação de idade
app.post('/verify-age', requireAuth, (req, res) => {
    const { confirm, redirect } = req.body;
    
    if (confirm === 'yes') {
        const users = loadJSON('users.json');
        const user = Object.values(users).find(u => u.id === req.session.userId);
        if (user) {
            user.isAdult = true;
            req.session.isAdult = true;
            saveJSON('users.json', users);
            return res.redirect(redirect || '/adult');
        }
    }
    
    res.redirect('/');
});

// ============================================
// ROUTES - USUÁRIO
// ============================================

// Histórico
app.get('/history', requireAuth, (req, res) => {
    const users = loadJSON('users.json');
    const animes = loadJSON('animes.json');
    const episodes = loadJSON('episodes.json');
    const config = loadJSON('config.json');
    
    const canViewAdult = req.session.isAdult;
    
    const user = Object.values(users).find(u => u.id === req.session.userId);
    const history = (user?.history || [])
        .map(h => ({
            anime: animes[h.animeId],
            episode: episodes[h.episodeId],
            watchedAt: h.watchedAt
        }))
        .filter(h => h.anime && h.episode && (!h.anime.isAdult || canViewAdult));
    
    res.render('history', { history, config, user: req.session });
});

// Limpar histórico
app.post('/history/clear', requireAuth, (req, res) => {
    const users = loadJSON('users.json');
    const user = Object.values(users).find(u => u.id === req.session.userId);
    if (user) {
        user.history = [];
        saveJSON('users.json', users);
    }
    res.redirect('/history');
});

// Favoritos
app.get('/favorites', requireAuth, (req, res) => {
    const users = loadJSON('users.json');
    const animes = loadJSON('animes.json');
    const config = loadJSON('config.json');
    
    const canViewAdult = req.session.isAdult;
    
    const user = Object.values(users).find(u => u.id === req.session.userId);
    const favorites = (user?.favorites || [])
        .map(id => ({ id, ...animes[id] }))
        .filter(a => a && (!a.isAdult || canViewAdult));
    
    res.render('favorites', { favorites, config, user: req.session });
});

// Adicionar/remover favorito
app.post('/favorite/:animeId', requireAuth, (req, res) => {
    const users = loadJSON('users.json');
    const animes = loadJSON('animes.json');
    const user = Object.values(users).find(u => u.id === req.session.userId);
    
    if (user && animes[req.params.animeId]) {
        user.favorites = user.favorites || [];
        const index = user.favorites.indexOf(req.params.animeId);
        
        if (index > -1) {
            user.favorites.splice(index, 1);
        } else {
            user.favorites.push(req.params.animeId);
        }
        
        saveJSON('users.json', users);
        return res.json({ success: true, isFavorite: index === -1 });
    }
    
    res.status(400).json({ success: false });
});

// Watchlist
app.get('/watchlist', requireAuth, (req, res) => {
    const users = loadJSON('users.json');
    const animes = loadJSON('animes.json');
    const config = loadJSON('config.json');
    
    const canViewAdult = req.session.isAdult;
    
    const user = Object.values(users).find(u => u.id === req.session.userId);
    const watchlist = (user?.watchlist || [])
        .map(id => ({ id, ...animes[id] }))
        .filter(a => a && (!a.isAdult || canViewAdult));
    
    res.render('watchlist', { watchlist, config, user: req.session });
});

// Adicionar/remover watchlist
app.post('/watchlist/:animeId', requireAuth, (req, res) => {
    const users = loadJSON('users.json');
    const animes = loadJSON('animes.json');
    const user = Object.values(users).find(u => u.id === req.session.userId);
    
    if (user && animes[req.params.animeId]) {
        user.watchlist = user.watchlist || [];
        const index = user.watchlist.indexOf(req.params.animeId);
        
        if (index > -1) {
            user.watchlist.splice(index, 1);
        } else {
            user.watchlist.push(req.params.animeId);
        }
        
        saveJSON('users.json', users);
        return res.json({ success: true, inWatchlist: index === -1 });
    }
    
    res.status(400).json({ success: false });
});

// Perfil
app.get('/profile', requireAuth, (req, res) => {
    const users = loadJSON('users.json');
    const animes = loadJSON('animes.json');
    const episodes = loadJSON('episodes.json');
    const config = loadJSON('config.json');
    
    const userData = Object.values(users).find(u => u.id === req.session.userId);
    
    if (!userData) {
        req.session.destroy();
        return res.redirect('/login');
    }
    
    const totalWatched = userData.history ? userData.history.length : 0;
    const favoritesCount = userData.favorites ? userData.favorites.length : 0;
    const watchlistCount = userData.watchlist ? userData.watchlist.length : 0;
    
    const joinDate = new Date(userData.createdAt).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const stats = {
        totalWatched,
        favoritesCount,
        watchlistCount,
        joinDate
    };
    
    res.render('profile', {
        user: req.session,
        userData,
        stats,
        config
    });
});

// Atualizar perfil
app.post('/profile/update', requireAuth, upload.single('avatar'), (req, res) => {
    const users = loadJSON('users.json');
    const user = Object.values(users).find(u => u.id === req.session.userId);
    
    if (user) {
        user.email = req.body.email || user.email;
        user.bio = req.body.bio || '';
        
        if (req.file) {
            user.avatar = `/images/${req.file.filename}`;
        }
        
        if (req.body.currentPassword && req.body.newPassword) {
            if (bcrypt.compareSync(req.body.currentPassword, user.password)) {
                user.password = bcrypt.hashSync(req.body.newPassword, 10);
            } else {
                return res.render('profile', {
                    user: req.session,
                    userData: user,
                    stats: {},
                    config: loadJSON('config.json'),
                    error: 'Senha atual incorreta'
                });
            }
        }
        
        saveJSON('users.json', users);
    }
    
    res.redirect('/profile');
});

// ============================================
// ROUTES - COMENTÁRIOS
// ============================================

// Adicionar comentário
app.post('/comment', requireAuth, (req, res) => {
    const { animeId, episodeId, content, parentId } = req.body;
    
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comentário vazio' });
    }
    
    const comments = loadJSON('comments.json');
    const users = loadJSON('users.json');
    const user = Object.values(users).find(u => u.id === req.session.userId);
    
    const id = uuidv4();
    comments[id] = {
        id,
        animeId,
        episodeId: episodeId || null,
        userId: req.session.userId,
        username: user.username,
        userAvatar: user.avatar || null,
        content: content.trim(),
        parentId: parentId || null,
        createdAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0
    };
    
    saveJSON('comments.json', comments);
    res.json({ success: true, comment: comments[id] });
});

// Deletar comentário
app.post('/comment/delete/:id', requireAuth, (req, res) => {
    const comments = loadJSON('comments.json');
    const comment = comments[req.params.id];
    
    if (comment && (comment.userId === req.session.userId || req.session.isAdmin)) {
        delete comments[req.params.id];
        saveJSON('comments.json', comments);
        return res.json({ success: true });
    }
    
    res.status(403).json({ error: 'Sem permissão' });
});

// Curtir comentário
app.post('/comment/like/:id', requireAuth, (req, res) => {
    const comments = loadJSON('comments.json');
    const comment = comments[req.params.id];
    
    if (comment) {
        comment.likes = (comment.likes || 0) + 1;
        saveJSON('comments.json', comments);
        return res.json({ success: true, likes: comment.likes });
    }
    
    res.status(404).json({ error: 'Comentário não encontrado' });
});

// ============================================
// ROUTES - AUTH
// ============================================

app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    const config = loadJSON('config.json');
    res.render('login', { config, user: req.session, error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadJSON('users.json');
    const user = users[username];
    
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        req.session.username = username;
        req.session.isAdmin = user.isAdmin;
        req.session.isAdult = user.isAdult || false;
        
        const redirect = req.query.redirect || '/';
        return res.redirect(redirect);
    }
    
    const config = loadJSON('config.json');
    res.render('login', { config, user: req.session, error: 'Usuário ou senha incorretos' });
});

app.get('/register', (req, res) => {
    const config = loadJSON('config.json');
    if (!config.registrationsEnabled) {
        return res.render('error', { 
            message: 'Registros estão desativados no momento',
            config,
            user: req.session
        });
    }
    if (req.session.userId) return res.redirect('/');
    res.render('register', { config, user: req.session, error: null });
});

app.post('/register', (req, res) => {
    const config = loadJSON('config.json');
    if (!config.registrationsEnabled) {
        return res.render('error', { 
            message: 'Registros estão desativados',
            config,
            user: req.session
        });
    }
    
    const { username, password, email, confirmPassword } = req.body;
    const users = loadJSON('users.json');
    
    if (users[username]) {
        return res.render('register', { config, user: req.session, error: 'Usuário já existe' });
    }
    
    if (password !== confirmPassword) {
        return res.render('register', { config, user: req.session, error: 'Senhas não coincidem' });
    }
    
    if (password.length < 6) {
        return res.render('register', { config, user: req.session, error: 'Senha deve ter pelo menos 6 caracteres' });
    }
    
    users[username] = {
        id: uuidv4(),
        username,
        password: bcrypt.hashSync(password, 10),
        email,
        isAdmin: false,
        isAdult: false,
        createdAt: new Date().toISOString(),
        history: [],
        favorites: [],
        watchlist: []
    };
    
    saveJSON('users.json', users);
    res.redirect('/login');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ============================================
// ROUTES - ADMIN
// ============================================

// Dashboard
app.get('/admin', requireAdmin, (req, res) => {
    const animes = loadJSON('animes.json');
    const users = loadJSON('users.json');
    const episodes = loadJSON('episodes.json');
    const comments = loadJSON('comments.json');
    const reports = loadJSON('reports.json');
    const config = loadJSON('config.json');
    
    // Estatísticas
    const totalViews = Object.values(animes).reduce((sum, a) => sum + (a.views || 0), 0);
    const totalDownloads = Object.values(episodes).reduce((sum, e) => sum + (e.downloads || 0), 0);
    
    // Animes pendentes de aprovação (se houver moderação)
    const pendingAnimes = Object.entries(animes).filter(([_, a]) => a.pending);
    
    // Relatórios pendentes
    const pendingReports = Object.values(reports).filter(r => !r.resolved);
    
    res.render('admin/dashboard', {
        stats: {
            animes: Object.keys(animes).length,
            episodes: Object.keys(episodes).length,
            users: Object.keys(users).length,
            comments: Object.keys(comments).length,
            totalViews,
            totalDownloads,
            pendingReports: pendingReports.length
        },
        pendingAnimes,
        pendingReports,
        config,
        user: req.session
    });
});

// Gerenciar Animes
app.get('/admin/animes', requireAdmin, (req, res) => {
    const animes = loadJSON('animes.json');
    const config = loadJSON('config.json');
    const tags = loadJSON('tags.json');
    const adultTags = loadJSON('adult-tags.json');
    
    res.render('admin/animes', { 
        animes, 
        tags: { ...tags, ...adultTags },
        config, 
        user: req.session 
    });
});

// Adicionar Anime
app.get('/admin/anime/add', requireAdmin, (req, res) => {
    const config = loadJSON('config.json');
    const tags = loadJSON('tags.json');
    const adultTags = loadJSON('adult-tags.json');
    
    res.render('admin/add-anime', { 
        config, 
        tags,
        adultTags,
        user: req.session 
    });
});

app.post('/admin/anime/add', requireAdmin, upload.single('cover'), (req, res) => {
    const animes = loadJSON('animes.json');
    const id = uuidv4();
    
    // Processar tags
    let tags = [];
    if (req.body.tags) {
        tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
    }
    
    animes[id] = {
        id,
        title: req.body.title,
        description: req.body.description || '',
        synopsis: req.body.synopsis || '',
        rating: parseFloat(req.body.rating) || 0,
        status: req.body.status || 'ongoing',
        type: req.body.type || 'tv',
        year: parseInt(req.body.year) || new Date().getFullYear(),
        season: req.body.season || '',
        episodesCount: parseInt(req.body.episodesCount) || 0,
        duration: req.body.duration || '24 min',
        studio: req.body.studio || '',
        releaseDay: req.body.releaseDay || '',
        coverImage: req.file ? `/images/${req.file.filename}` : req.body.coverUrl || '',
        bannerImage: req.body.bannerUrl || '',
        tags: tags,
        isAdult: req.body.isAdult === 'on',
        isFeatured: req.body.isFeatured === 'on',
        views: 0,
        createdAt: new Date().toISOString()
    };
    
    saveJSON('animes.json', animes);
    res.redirect('/admin/animes');
});

// Editar Anime
app.get('/admin/anime/edit/:id', requireAdmin, (req, res) => {
    const animes = loadJSON('animes.json');
    const config = loadJSON('config.json');
    const tags = loadJSON('tags.json');
    const adultTags = loadJSON('adult-tags.json');
    const anime = animes[req.params.id];
    
    if (!anime) return res.redirect('/admin/animes');
    
    res.render('admin/edit-anime', { 
        anime, 
        tags,
        adultTags,
        config, 
        user: req.session 
    });
});

app.post('/admin/anime/edit/:id', requireAdmin, upload.single('cover'), (req, res) => {
    const animes = loadJSON('animes.json');
    const anime = animes[req.params.id];
    if (!anime) return res.redirect('/admin/animes');
    
    // Processar tags
    let tags = [];
    if (req.body.tags) {
        tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
    }
    
    anime.title = req.body.title;
    anime.description = req.body.description || '';
    anime.synopsis = req.body.synopsis || '';
    anime.rating = parseFloat(req.body.rating) || 0;
    anime.status = req.body.status || 'ongoing';
    anime.type = req.body.type || 'tv';
    anime.year = parseInt(req.body.year) || anime.year;
    anime.season = req.body.season || '';
    anime.episodesCount = parseInt(req.body.episodesCount) || 0;
    anime.duration = req.body.duration || '24 min';
    anime.studio = req.body.studio || '';
    anime.releaseDay = req.body.releaseDay || '';
    anime.tags = tags;
    anime.isAdult = req.body.isAdult === 'on';
    anime.isFeatured = req.body.isFeatured === 'on';
    
    if (req.file) anime.coverImage = `/images/${req.file.filename}`;
    else if (req.body.coverUrl) anime.coverImage = req.body.coverUrl;
    
    if (req.body.bannerUrl) anime.bannerImage = req.body.bannerUrl;
    
    anime.updatedAt = new Date().toISOString();
    
    saveJSON('animes.json', animes);
    res.redirect('/admin/animes');
});

// Deletar Anime
app.post('/admin/anime/delete/:id', requireAdmin, (req, res) => {
    const animes = loadJSON('animes.json');
    const episodes = loadJSON('episodes.json');
    const comments = loadJSON('comments.json');
    
    delete animes[req.params.id];
    
    // Deletar episódios relacionados
    Object.entries(episodes).forEach(([id, ep]) => {
        if (ep.animeId === req.params.id) delete episodes[id];
    });
    
    // Deletar comentários relacionados
    Object.entries(comments).forEach(([id, c]) => {
        if (c.animeId === req.params.id) delete comments[id];
    });
    
    saveJSON('animes.json', animes);
    saveJSON('episodes.json', episodes);
    saveJSON('comments.json', comments);
    res.redirect('/admin/animes');
});

// Gerenciar Episódios
app.get('/admin/episodes/:animeId', requireAdmin, (req, res) => {
    const animes = loadJSON('animes.json');
    const episodes = loadJSON('episodes.json');
    const config = loadJSON('config.json');
    
    const anime = animes[req.params.animeId];
    if (!anime) return res.redirect('/admin/animes');
    
    const animeEpisodes = Object.entries(episodes)
        .filter(([_, ep]) => ep.animeId === req.params.animeId)
        .sort((a, b) => a[1].number - b[1].number);
    
    res.render('admin/episodes', { anime, episodes: animeEpisodes, config, user: req.session });
});

// Adicionar Episódio
app.get('/admin/episode/add/:animeId', requireAdmin, (req, res) => {
    const animes = loadJSON('animes.json');
    const config = loadJSON('config.json');
    const anime = animes[req.params.animeId];
    
    if (!anime) return res.redirect('/admin/animes');
    
    res.render('admin/add-episode', { 
        anime, 
        config, 
        user: req.session,
        videoTypes: ['mp4', 'youtube', 'gdrive', 'blogger', 'hls', 'mp4upload', 'streamsb', 'doodstream', 'filemoon', 'streamtape', 'vk', 'okru', 'iframe']
    });
});

app.post('/admin/episode/add/:animeId', requireAdmin, (req, res) => {
    const episodes = loadJSON('episodes.json');
    const id = uuidv4();
    
    // Detectar tipo automaticamente se não especificado
    const videoType = req.body.videoType || detectVideoType(req.body.videoUrl);
    
    episodes[id] = {
        id,
        animeId: req.params.animeId,
        number: parseFloat(req.body.number),
        title: req.body.title || '',
        videoUrl: req.body.videoUrl,
        videoType: videoType,
        downloadUrl: req.body.downloadUrl || '',
        duration: req.body.duration || '',
        thumbnail: req.body.thumbnail || '',
        downloads: 0,
        createdAt: new Date().toISOString()
    };
    
    saveJSON('episodes.json', episodes);
    res.redirect(`/admin/episodes/${req.params.animeId}`);
});

// Editar Episódio
app.get('/admin/episode/edit/:id', requireAdmin, (req, res) => {
    const episodes = loadJSON('episodes.json');
    const animes = loadJSON('animes.json');
    const config = loadJSON('config.json');
    
    const episode = episodes[req.params.id];
    if (!episode) return res.redirect('/admin/animes');
    
    const anime = animes[episode.animeId];
    res.render('admin/edit-episode', { 
        episode, 
        anime, 
        config, 
        user: req.session,
        videoTypes: ['mp4', 'youtube', 'gdrive', 'blogger', 'hls', 'mp4upload', 'streamsb', 'doodstream', 'filemoon', 'streamtape', 'vk', 'okru', 'iframe']
    });
});

app.post('/admin/episode/edit/:id', requireAdmin, (req, res) => {
    const episodes = loadJSON('episodes.json');
    const episode = episodes[req.params.id];
    if (!episode) return res.redirect('/admin/animes');
    
    const videoType = req.body.videoType || detectVideoType(req.body.videoUrl);
    
    episode.number = parseFloat(req.body.number);
    episode.title = req.body.title || '';
    episode.videoUrl = req.body.videoUrl;
    episode.videoType = videoType;
    episode.downloadUrl = req.body.downloadUrl || '';
    episode.duration = req.body.duration || '';
    episode.thumbnail = req.body.thumbnail || '';
    episode.updatedAt = new Date().toISOString();
    
    saveJSON('episodes.json', episodes);
    res.redirect(`/admin/episodes/${episode.animeId}`);
});

// Deletar Episódio
app.post('/admin/episode/delete/:id', requireAdmin, (req, res) => {
    const episodes = loadJSON('episodes.json');
    const episode = episodes[req.params.id];
    if (!episode) return res.redirect('/admin/animes');
    
    const animeId = episode.animeId;
    delete episodes[req.params.id];
    
    saveJSON('episodes.json', episodes);
    res.redirect(`/admin/episodes/${animeId}`);
});

// Gerenciar Usuários
app.get('/admin/users', requireAdmin, (req, res) => {
    const users = loadJSON('users.json');
    const config = loadJSON('config.json');
    res.render('admin/users', { users, config, user: req.session });
});

app.post('/admin/user/toggle-admin/:username', requireAdmin, (req, res) => {
    const users = loadJSON('users.json');
    const user = users[req.params.username];
    if (user && user.username !== 'admin') {
        user.isAdmin = !user.isAdmin;
        saveJSON('users.json', users);
    }
    res.redirect('/admin/users');
});

app.post('/admin/user/toggle-adult/:username', requireAdmin, (req, res) => {
    const users = loadJSON('users.json');
    const user = users[req.params.username];
    if (user) {
        user.isAdult = !user.isAdult;
        saveJSON('users.json', users);
    }
    res.redirect('/admin/users');
});

app.post('/admin/user/change-password/:username', requireAdmin, (req, res) => {
    const users = loadJSON('users.json');
    const user = users[req.params.username];
    if (user && req.body.newPassword) {
        user.password = bcrypt.hashSync(req.body.newPassword, 10);
        saveJSON('users.json', users);
    }
    res.redirect('/admin/users');
});

app.post('/admin/user/delete/:username', requireAdmin, (req, res) => {
    const users = loadJSON('users.json');
    if (req.params.username !== 'admin') {
        delete users[req.params.username];
        saveJSON('users.json', users);
    }
    res.redirect('/admin/users');
});

// Gerenciar Tags
app.get('/admin/tags', requireAdmin, (req, res) => {
    const tags = loadJSON('tags.json');
    const adultTags = loadJSON('adult-tags.json');
    const config = loadJSON('config.json');
    res.render('admin/tags', { tags, adultTags, config, user: req.session });
});

app.post('/admin/tag/add', requireAdmin, (req, res) => {
    const isAdult = req.body.isAdult === 'on';
    const filename = isAdult ? 'adult-tags.json' : 'tags.json';
    const tags = loadJSON(filename);
    
    const id = req.body.id.toLowerCase().replace(/\s+/g, '-');
    tags[id] = {
        id,
        name: req.body.name,
        color: req.body.color || '#ff4757',
        icon: req.body.icon || '🏷️'
    };
    
    saveJSON(filename, tags);
    res.redirect('/admin/tags');
});

app.post('/admin/tag/delete/:id', requireAdmin, (req, res) => {
    const tags = loadJSON('tags.json');
    const adultTags = loadJSON('adult-tags.json');
    
    delete tags[req.params.id];
    delete adultTags[req.params.id];
    
    saveJSON('tags.json', tags);
    saveJSON('adult-tags.json', adultTags);
    res.redirect('/admin/tags');
});

// Gerenciar Banners
app.get('/admin/banners', requireAdmin, (req, res) => {
    const banners = loadJSON('banners.json');
    const config = loadJSON('config.json');
    res.render('admin/banners', { banners, config, user: req.session });
});

app.post('/admin/banner/add', requireAdmin, upload.single('banner'), (req, res) => {
    const banners = loadJSON('banners.json');
    const id = uuidv4();
    
    banners[id] = {
        id,
        title: req.body.title || '',
        image: req.file ? `/images/banners/${req.file.filename}` : req.body.imageUrl,
        link: req.body.link || '',
        position: req.body.position || 'home',
        active: req.body.active === 'on',
        order: parseInt(req.body.order) || 0,
        createdAt: new Date().toISOString()
    };
    
    saveJSON('banners.json', banners);
    res.redirect('/admin/banners');
});

app.post('/admin/banner/toggle/:id', requireAdmin, (req, res) => {
    const banners = loadJSON('banners.json');
    if (banners[req.params.id]) {
        banners[req.params.id].active = !banners[req.params.id].active;
        saveJSON('banners.json', banners);
    }
    res.redirect('/admin/banners');
});

app.post('/admin/banner/delete/:id', requireAdmin, (req, res) => {
    const banners = loadJSON('banners.json');
    
    // Deletar arquivo se existir
    if (banners[req.params.id] && banners[req.params.id].image) {
        const imagePath = path.join(__dirname, 'public', banners[req.params.id].image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }
    
    delete banners[req.params.id];
    saveJSON('banners.json', banners);
    res.redirect('/admin/banners');
});

// Configurações
app.get('/admin/settings', requireAdmin, (req, res) => {
    const config = loadJSON('config.json');
    res.render('admin/settings', { config, user: req.session });
});

app.post('/admin/settings', requireAdmin, (req, res) => {
    const config = loadJSON('config.json');
    
    config.siteName = req.body.siteName || 'AnimeStream Pro';
    config.siteDescription = req.body.siteDescription || '';
    config.primaryColor = req.body.primaryColor || '#ff4757';
    config.secondaryColor = req.body.secondaryColor || '#2f3542';
    config.enableAdultContent = req.body.enableAdultContent === 'on';
    config.adultVerification = req.body.adultVerification === 'on';
    config.registrationsEnabled = req.body.registrationsEnabled === 'on';
    config.commentsEnabled = req.body.commentsEnabled === 'on';
    
    config.seo = {
        title: req.body.seoTitle || '',
        description: req.body.seoDescription || '',
        keywords: req.body.seoKeywords || ''
    };
    
    config.social = {
        discord: req.body.discord || '',
        telegram: req.body.telegram || '',
        twitter: req.body.twitter || '',
        instagram: req.body.instagram || ''
    };
    
    saveJSON('config.json', config);
    res.redirect('/admin/settings');
});

// Gerenciar Anúncios
app.get('/admin/ads', requireAdmin, (req, res) => {
    const config = loadJSON('config.json');
    res.render('admin/ads', { config, user: req.session });
});

app.post('/admin/ads', requireAdmin, (req, res) => {
    const config = loadJSON('config.json');
    config.ads = {
        header: req.body.headerAd || '',
        sidebar: req.body.sidebarAd || '',
        video: req.body.videoAd || '',
        footer: req.body.footerAd || '',
        popunder: req.body.popunderAd || ''
    };
    saveJSON('config.json', config);
    res.redirect('/admin/ads');
});

// Relatórios
app.get('/admin/reports', requireAdmin, (req, res) => {
    const reports = loadJSON('reports.json');
    const config = loadJSON('config.json');
    res.render('admin/reports', { reports, config, user: req.session });
});

app.post('/admin/report/resolve/:id', requireAdmin, (req, res) => {
    const reports = loadJSON('reports.json');
    if (reports[req.params.id]) {
        reports[req.params.id].resolved = true;
        reports[req.params.id].resolvedAt = new Date().toISOString();
        reports[req.params.id].resolvedBy = req.session.username;
        saveJSON('reports.json', reports);
    }
    res.redirect('/admin/reports');
});

// ============================================
// API ROUTES
// ============================================

app.get('/api/animes', (req, res) => {
    const animes = loadJSON('animes.json');
    const canViewAdult = req.session.userId && req.session.isAdult;
    
    const filtered = Object.entries(animes)
        .filter(([_, a]) => !a.isAdult || canViewAdult)
        .reduce((obj, [id, anime]) => {
            obj[id] = anime;
            return obj;
        }, {});
    
    res.json(filtered);
});

app.get('/api/anime/:id', (req, res) => {
    const animes = loadJSON('animes.json');
    const anime = animes[req.params.id];
    
    if (!anime) return res.status(404).json({ error: 'Anime não encontrado' });
    
    if (anime.isAdult && (!req.session.userId || !req.session.isAdult)) {
        return res.status(403).json({ error: 'Conteúdo restrito' });
    }
    
    res.json(anime);
});

app.get('/api/episodes/:animeId', (req, res) => {
    const episodes = loadJSON('episodes.json');
    const animes = loadJSON('animes.json');
    const anime = animes[req.params.animeId];
    
    if (!anime) return res.status(404).json({ error: 'Anime não encontrado' });
    
    if (anime.isAdult && (!req.session.userId || !req.session.isAdult)) {
        return res.status(403).json({ error: 'Conteúdo restrito' });
    }
    
    const animeEpisodes = Object.entries(episodes)
        .filter(([_, ep]) => ep.animeId === req.params.animeId)
        .sort((a, b) => a[1].number - b[1].number);
    
    res.json(Object.fromEntries(animeEpisodes));
});

app.get('/api/search', (req, res) => {
    const query = (req.query.q || '').toLowerCase();
    const animes = loadJSON('animes.json');
    const canViewAdult = req.session.userId && req.session.isAdult;
    
    const results = Object.entries(animes)
        .filter(([_, anime]) => {
            if (anime.isAdult && !canViewAdult) return false;
            return anime.title.toLowerCase().includes(query) ||
                   (anime.synonyms && anime.synonyms.some(s => s.toLowerCase().includes(query)));
        })
        .slice(0, 10);
    
    res.json(Object.fromEntries(results));
});

app.get('/api/tags', (req, res) => {
    const tags = loadJSON('tags.json');
    res.json(tags);
});

// Reportar link quebrado
app.post('/api/report', (req, res) => {
    const { animeId, episodeId, reason } = req.body;
    const reports = loadJSON('reports.json');
    
    const id = uuidv4();
    reports[id] = {
        id,
        animeId,
        episodeId,
        reason,
        userId: req.session.userId || null,
        username: req.session.username || 'Anônimo',
        createdAt: new Date().toISOString(),
        resolved: false
    };
    
    saveJSON('reports.json', reports);
    res.json({ success: true });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
    console.error(err.stack);
    const config = loadJSON('config.json');
    res.status(500).render('error', {
        message: 'Algo deu errado!',
        error: err.message,
        config,
        user: req.session
    });
});

app.use((req, res) => {
    const config = loadJSON('config.json');
    res.status(404).render('error', {
        message: 'Página não encontrada',
        error: 'A página que você procura não existe.',
        config,
        user: req.session
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🎌 AnimeStream Pro - Servidor Iniciado 🎌           ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  🌐 URL: http://localhost:${PORT}                          ║
║                                                          ║
║  👤 Credenciais padrão:                                  ║
║     Usuário: admin                                       ║
║     Senha: admin                                         ║
║                                                          ║
║  ✨ Funcionalidades:                                      ║
║     • Upload de animes e episódios                       ║
║     • Múltiplos players (YouTube, Drive, Blogger, etc)   ║
║     • Sistema de tags e categorias                       ║
║     • Conteúdo +18 com verificação de idade              ║
║     • Favoritos e Watchlist                              ║
║     • Sistema de comentários                             ║
║     • Calendário de lançamentos                          ║
║     • Painel administrativo completo                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});
