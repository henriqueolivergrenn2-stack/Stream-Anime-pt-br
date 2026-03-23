/**
 * AnimeStream Pro - JavaScript Principal
 */

// ============================================
// UTILITÁRIOS
// ============================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Debounce para eventos frequentes
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle para scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// HEADER & NAVEGAÇÃO
// ============================================

// Toggle dropdown do usuário
function toggleDropdown() {
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// Toggle menu mobile
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    }
}

// Header scroll effect
const header = document.querySelector('.header');
if (header) {
    window.addEventListener('scroll', throttle(() => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 100) {
            header.style.background = 'rgba(15, 15, 26, 0.98)';
        } else {
            header.style.background = 'rgba(15, 15, 26, 0.95)';
        }
    }, 100));
}

// ============================================
// BACK TO TOP
// ============================================

const backToTop = document.getElementById('backToTop');
if (backToTop) {
    window.addEventListener('scroll', throttle(() => {
        if (window.pageYOffset > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }, 100));
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ============================================
// SLIDER DE CONTEÚDO
// ============================================

function slideContent(button, direction) {
    const slider = button.parentElement;
    const contentRow = slider.querySelector('.content-row');
    if (!contentRow) return;
    
    const card = contentRow.querySelector('.anime-card');
    if (!card) return;
    
    const cardWidth = card.offsetWidth + 20;
    const scrollAmount = cardWidth * 4;
    
    contentRow.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

// ============================================
// BANNER SLIDER
// ============================================

let bannerInterval;

function initBannerSlider() {
    const slider = document.getElementById('bannerSlider');
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dot');
    
    if (slides.length <= 1) return;
    
    let currentSlide = 0;
    
    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
        
        currentSlide = index;
        
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }
    
    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        goToSlide(next);
    }
    
    // Auto-play
    bannerInterval = setInterval(nextSlide, 5000);
    
    // Click nos dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(bannerInterval);
            goToSlide(index);
            bannerInterval = setInterval(nextSlide, 5000);
        });
    });
}

// ============================================
// TOGGLE DE VIEW (GRID/LIST)
// ============================================

function toggleView(button, view) {
    const grid = document.getElementById('allAnimesGrid');
    if (!grid) return;
    
    // Atualizar botões
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Mudar view
    if (view === 'list') {
        grid.classList.remove('grid-6');
        grid.classList.add('list-view');
    } else {
        grid.classList.add('grid-6');
        grid.classList.remove('list-view');
    }
}

// ============================================
// PASSWORD TOGGLE
// ============================================

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = input.parentElement.querySelector('.toggle-password');
    if (!button) return;
    
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

// ============================================
// PASSWORD STRENGTH
// ============================================

function checkPasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    const colors = ['#ff4757', '#ffa502', '#2ed573', '#3742fa'];
    const texts = ['Muito fraca', 'Fraca', 'Boa', 'Forte', 'Muito forte'];
    
    strengthBar.style.width = `${(strength / 5) * 100}%`;
    strengthBar.style.background = colors[Math.min(strength - 1, 3)] || '#ff4757';
    
    if (password.length === 0) {
        strengthText.textContent = '';
        strengthBar.style.width = '0';
    } else {
        strengthText.textContent = texts[Math.min(strength, 4)];
        strengthText.style.color = colors[Math.min(strength - 1, 3)] || '#ff4757';
    }
}

// ============================================
// FAVORITOS E WATCHLIST
// ============================================

async function toggleFavorite(animeId) {
    const btn = document.getElementById('favoriteBtn');
    if (!btn) return;
    
    const icon = btn.querySelector('i');
    const text = btn.querySelector('span');
    
    try {
        const response = await fetch(`/favorite/${animeId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.isFavorite) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                text.textContent = 'Favoritado';
                btn.classList.add('active');
                showToast('Adicionado aos favoritos!', 'success');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                text.textContent = 'Favoritar';
                btn.classList.remove('active');
                showToast('Removido dos favoritos!', 'info');
            }
        }
    } catch (error) {
        showToast('Erro ao atualizar favoritos', 'error');
    }
}

async function toggleWatchlist(animeId) {
    const btn = document.getElementById('watchlistBtn');
    if (!btn) return;
    
    const icon = btn.querySelector('i');
    const text = btn.querySelector('span');
    
    try {
        const response = await fetch(`/watchlist/${animeId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.inWatchlist) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                text.textContent = 'Na Watchlist';
                btn.classList.add('active');
                showToast('Adicionado à watchlist!', 'success');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                text.textContent = 'Watchlist';
                btn.classList.remove('active');
                showToast('Removido da watchlist!', 'info');
            }
        }
    } catch (error) {
        showToast('Erro ao atualizar watchlist', 'error');
    }
}

// ============================================
// COMENTÁRIOS
// ============================================

async function submitComment(event, animeId, episodeId) {
    event.preventDefault();
    
    const form = event.target;
    const textarea = form.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) {
        showToast('Digite um comentário', 'error');
        return;
    }
    
    try {
        const response = await fetch('/comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ animeId, episodeId, content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            textarea.value = '';
            showToast('Comentário enviado!', 'success');
            
            // Adicionar comentário na lista sem recarregar
            addCommentToList(data.comment);
        } else {
            showToast(data.error || 'Erro ao enviar comentário', 'error');
        }
    } catch (error) {
        showToast('Erro ao enviar comentário', 'error');
    }
}

function addCommentToList(comment) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    // Remover mensagem de vazio se existir
    const emptyState = commentsList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const commentHtml = `
        <div class="comment-item" data-comment-id="${comment.id}">
            <div class="comment-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${comment.username}</span>
                    <span class="comment-date">Agora</span>
                </div>
                <p class="comment-text">${escapeHtml(comment.content)}</p>
                <div class="comment-actions">
                    <button class="action-btn" onclick="likeComment('${comment.id}')">
                        <i class="far fa-thumbs-up"></i>
                        <span>0</span>
                    </button>
                    <button class="action-btn delete" onclick="deleteComment('${comment.id}')">
                        <i class="far fa-trash-alt"></i>
                        <span>Deletar</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    commentsList.insertAdjacentHTML('afterbegin', commentHtml);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function deleteComment(commentId) {
    if (!confirm('Tem certeza que deseja deletar este comentário?')) return;
    
    try {
        const response = await fetch(`/comment/delete/${commentId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (comment) {
                comment.remove();
                showToast('Comentário deletado!', 'success');
            }
        } else {
            showToast(data.error || 'Erro ao deletar', 'error');
        }
    } catch (error) {
        showToast('Erro ao deletar comentário', 'error');
    }
}

async function likeComment(commentId) {
    try {
        const response = await fetch(`/comment/like/${commentId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const btn = document.querySelector(`[data-comment-id="${commentId}"] .action-btn`);
            if (btn) {
                btn.querySelector('span').textContent = data.likes;
                btn.classList.add('active');
            }
        }
    } catch (error) {
        showToast('Erro ao curtir comentário', 'error');
    }
}

// ============================================
// VIDEO PLAYER
// ============================================

let lightsOn = true;

function toggleLights() {
    const overlay = document.getElementById('lightsOverlay');
    const player = document.getElementById('videoPlayer');
    
    if (!overlay || !player) return;
    
    lightsOn = !lightsOn;
    
    if (lightsOn) {
        overlay.classList.remove('active');
        player.style.zIndex = '';
    } else {
        overlay.classList.add('active');
        player.style.zIndex = '1000';
    }
}

function toggleFullscreen() {
    const player = document.getElementById('videoPlayer');
    if (!player) return;
    
    if (!document.fullscreenElement) {
        if (player.requestFullscreen) {
            player.requestFullscreen();
        } else if (player.webkitRequestFullscreen) {
            player.webkitRequestFullscreen();
        } else if (player.msRequestFullscreen) {
            player.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function filterEpisodes() {
    const searchInput = document.getElementById('episodeSearch');
    const episodesList = document.getElementById('episodesList');
    if (!searchInput || !episodesList) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const episodes = episodesList.querySelectorAll('.episode-thumb');
    
    episodes.forEach(episode => {
        const number = episode.dataset.number;
        const title = episode.querySelector('.thumb-title');
        const titleText = title ? title.textContent.toLowerCase() : '';
        
        if ((number && number.includes(searchTerm)) || titleText.includes(searchTerm)) {
            episode.style.display = 'flex';
        } else {
            episode.style.display = 'none';
        }
    });
}

// ============================================
// COMPARTILHAMENTO
// ============================================

function shareAnime() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            url: window.location.href
        });
    } else {
        copyLink();
    }
}

function shareOn(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    
    let shareUrl = '';
    
    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${title}%20${url}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Link copiado!', 'success');
    }).catch(() => {
        showToast('Erro ao copiar link', 'error');
    });
}

// ============================================
// REPORTAR
// ============================================

function reportAnime(animeId) {
    const reason = prompt('Qual o problema com este anime?\n\n1. Link quebrado\n2. Informação incorreta\n3. Outro problema');
    
    if (reason) {
        submitReport(animeId, null, reason);
    }
}

function reportEpisode(animeId, episodeId) {
    const reason = prompt('Qual o problema com este episódio?\n\n1. Vídeo não funciona\n2. Áudio ruim\n3. Legenda incorreta\n4. Outro problema');
    
    if (reason) {
        submitReport(animeId, episodeId, reason);
    }
}

async function submitReport(animeId, episodeId, reason) {
    try {
        const response = await fetch('/api/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ animeId, episodeId, reason })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Reporte enviado! Obrigado.', 'success');
        } else {
            showToast(data.error || 'Erro ao enviar reporte', 'error');
        }
    } catch (error) {
        showToast('Erro ao enviar reporte', 'error');
    }
}

// ============================================
// BUSCA COM SUGESTÕES
// ============================================

const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');

if (searchInput && searchSuggestions) {
    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchSuggestions.innerHTML = '';
            searchSuggestions.classList.remove('active');
            return;
        }
        
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            const animes = Object.entries(data).slice(0, 5);
            
            if (animes.length > 0) {
                searchSuggestions.innerHTML = animes.map(([id, anime]) => `
                    <a href="/anime/${id}" class="suggestion-item">
                        <img src="${anime.coverImage || '/images/default-anime.jpg'}" alt="${anime.title}">
                        <div class="suggestion-info">
                            <span class="suggestion-title">${anime.title}</span>
                            ${anime.rating ? `<span class="suggestion-rating"><i class="fas fa-star"></i> ${anime.rating.toFixed(1)}</span>` : ''}
                        </div>
                    </a>
                `).join('');
                searchSuggestions.classList.add('active');
            } else {
                searchSuggestions.innerHTML = '<div class="suggestion-empty">Nenhum resultado</div>';
                searchSuggestions.classList.add('active');
            }
        } catch (error) {
            console.error('Erro na busca:', error);
        }
    }, 300));
    
    // Fechar sugestões ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            searchSuggestions.classList.remove('active');
        }
    });
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    // Remover toast anterior se existir
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animar entrada
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// FILTROS DE BUSCA
// ============================================

function applyFilter(key, value) {
    const url = new URL(window.location.href);
    if (value) {
        url.searchParams.set(key, value);
    } else {
        url.searchParams.delete(key);
    }
    window.location.href = url.toString();
}

function clearFilters() {
    const query = new URL(window.location.href).searchParams.get('q');
    const url = new URL(window.location.origin + '/search');
    if (query) {
        url.searchParams.set('q', query);
    }
    window.location.href = url.toString();
}

// ============================================
// TECLAS DE ATALHO
// ============================================

document.addEventListener('keydown', (e) => {
    // ESC para fechar menus
    if (e.key === 'Escape') {
        const mobileMenu = document.getElementById('mobileMenu');
        const dropdown = document.querySelector('.dropdown');
        const lightsOverlay = document.getElementById('lightsOverlay');
        const searchSuggestions = document.getElementById('searchSuggestions');
        
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
        
        if (dropdown && dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
        }
        
        if (lightsOverlay && lightsOverlay.classList.contains('active')) {
            toggleLights();
        }
        
        if (searchSuggestions) {
            searchSuggestions.classList.remove('active');
        }
    }
    
    // / para focar busca
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // F para fullscreen no player
    if (e.key === 'f' && document.getElementById('videoPlayer')) {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            toggleFullscreen();
        }
    }
    
    // L para lights
    if (e.key === 'l' && document.getElementById('videoPlayer')) {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            toggleLights();
        }
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar slider de banners
    initBannerSlider();
    
    // Lazy loading de imagens
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // Adicionar classe ao body quando JS estiver carregado
    document.body.classList.add('js-loaded');
    
    console.log('%c🎌 AnimeStream Pro', 'color: #ff4757; font-size: 20px; font-weight: bold;');
    console.log('%cInicializado com sucesso!', 'color: #2ed573;');
    console.log('%cAtalhos: / = busca | ESC = fechar | F = fullscreen | L = luzes', 'color: #a0a0b0;');
});
