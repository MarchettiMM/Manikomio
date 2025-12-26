// script.js - Manikomio (VERSÃO DEFINITIVA)
'use strict';

// ===== CONFIGURAÇÕES =====
const YOUTUBE_API_KEY = 'AIzaSyCazihY4Ephy19avGh5iJjOz3honhKFmLc';
const CHANNEL_NAME = '@Manikomioloko';
const MAX_RESULTS = 12;

// ===== ESTADO GLOBAL =====
let allVideos = []; // Todos os vídeos já carregados
let currentVideos = []; // Vídeos atualmente exibidos (com filtros)
let isLoading = false;
let channelId = '';
let lastSearch = '';
let lastSort = 'dateDesc';

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Site Manikomio carregado');
    
    initNavigation();
    initContactForm();
    initStatsHover();
    initFooterLinks();
    initTypeWriter();
    
    // Configura ordenação padrão
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) sortSelect.value = 'dateDesc';
    
    // Inicializa YouTube
    setTimeout(initYouTube, 800);
    
    // Configura eventos dos filtros
    setTimeout(initFilters, 1000);
});

// ===== NAVEGAÇÃO =====
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-link').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
            
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });
            
            const pageId = this.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ===== CONTATO =====
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Obrigado pela sua mensagem! A equipe do Manikomio entrará em contato em breve.');
            this.reset();
        });
    }
}

// ===== ESTATÍSTICAS HOVER =====
function initStatsHover() {
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ===== FOOTER LINKS =====
function initFooterLinks() {
    document.querySelectorAll('.footer-links .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            const targetLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
            if (targetLink) {
                targetLink.click();
            }
        });
    });
}

// ===== TYPEWRITER EFFECT =====
function initTypeWriter() {
    const title = document.querySelector('.logo h1');
    if (title) {
        const originalText = title.textContent;
        title.textContent = '';
        let i = 0;
        
        function typeWriter() {
            if (i < originalText.length) {
                title.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        }
        
        setTimeout(typeWriter, 500);
    }
}

// ===== FILTROS =====
function initFilters() {
    const applyButton = document.getElementById('applyFilters');
    const searchInput = document.getElementById('searchVideo');
    const sortSelect = document.getElementById('sortBy');
    
    if (!applyButton || !searchInput || !sortSelect) {
        console.warn('Elementos de filtro não encontrados');
        setTimeout(initFilters, 500);
        return;
    }
    
    console.log('✅ Filtros configurados');
    
    // Evento no botão aplicar
    applyButton.addEventListener('click', function(e) {
        e.preventDefault();
        handleFilterChange();
    });
    
    // Evento no input (com debounce)
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            handleFilterChange();
        }, 600);
    });
    
    // Evento no select
    sortSelect.addEventListener('change', function() {
        handleFilterChange();
    });
}

function handleFilterChange() {
    const sortBy = document.getElementById('sortBy').value;
    const searchTerm = document.getElementById('searchVideo').value.trim();
    
    console.log('🔄 Mudança de filtros:', { sortBy, searchTerm });
    
    // Atualizar estado
    lastSort = sortBy;
    lastSearch = searchTerm;
    
    // Se há termo de busca, busca na API
    if (sortBy || searchTerm) {
        searchVideosInAPI(searchTerm, sortBy);
    }
}

// ===== YOUTUBE API =====
async function initYouTube() {
    console.log('🎬 Inicializando YouTube...');
    
    // Primeiro: buscar canal
    try {
        // Método 1: Por handle
        const handleName = CHANNEL_NAME.replace('@', '');
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handleName}&key=${YOUTUBE_API_KEY}`;
        
        console.log('🔍 Buscando canal por handle:', handleName);
        const response = await fetch(channelUrl);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            channelId = data.items[0].id;
            console.log('✅ Canal encontrado:', channelId);
        } else {
            // Método 2: Por busca
            await findChannelBySearch();
        }
        
        // Carregar vídeos iniciais
        if (channelId) {
            await loadInitialVideos();
        } else {
            throw new Error('Canal não encontrado');
        }
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showErrorMessage('Erro ao carregar vídeos. Tente recarregar a página.');
    }
}

async function findChannelBySearch() {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(CHANNEL_NAME)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
    
    try {
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            channelId = data.items[0].id.channelId;
            console.log('✅ Canal encontrado por busca:', channelId);
        }
    } catch (error) {
        console.error('❌ Erro na busca do canal:', error);
    }
}

async function loadInitialVideos() {
    if (isLoading) return;
    isLoading = true;
    
    showLoading('Carregando vídeos...');
    
    try {
        // Carregar vídeos mais recentes
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${MAX_RESULTS}&key=${YOUTUBE_API_KEY}`;
        
        console.log('📥 Carregando vídeos iniciais');
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            showNoVideosMessage();
            return;
        }
        
        const videoIds = data.items
            .map(item => item.id.videoId)
            .filter(id => id)
            .join(',');
        
        // Carregar detalhes
        await loadVideoDetails(videoIds, data.items);
        
    } catch (error) {
        console.error('❌ Erro ao carregar vídeos:', error);
        showErrorMessage('Erro na conexão com YouTube.');
    } finally {
        isLoading = false;
    }
}

async function searchVideosInAPI(searchTerm, sortBy) {
    if (isLoading || !channelId) return;
    isLoading = true;
    
    showLoading(`Buscando: "${searchTerm}"`);
    
    try {
        // Determinar ordenação da API
        let apiOrder = 'relevance'; // Padrão para busca
        
        // Converter ordenação para parâmetro da API
        if (sortBy.includes('date')) {
            apiOrder = 'date';
        } else if (sortBy.includes('view')) {
            apiOrder = 'viewCount';
        } else if (sortBy.includes('like')) {
            apiOrder = 'rating';
        }
        
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(searchTerm)}&type=video&order=${apiOrder}&maxResults=${MAX_RESULTS}&key=${YOUTUBE_API_KEY}`;
        
        console.log('🔍 Buscando na API:', { searchTerm, apiOrder });
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            showNoResultsMessage(searchTerm);
            return;
        }
        
        const videoIds = data.items
            .map(item => item.id.videoId)
            .filter(id => id)
            .join(',');
        
        // Carregar detalhes
        await loadVideoDetails(videoIds, data.items);
        
    } catch (error) {
        console.error('❌ Erro na busca:', error);
        showErrorMessage('Erro na busca. Tente novamente.');
    } finally {
        isLoading = false;
    }
    applyLocalSorting(sortBy)
}

async function loadVideoDetails(videoIds, videoItems) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.items) {
            throw new Error('Sem dados de vídeo');
        }
        
        // Processar vídeos
        const newVideos = data.items.map(video => {
            return {
                id: video.id,
                title: video.snippet.title,
                description: video.snippet.description,
                thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
                publishedAt: video.snippet.publishedAt,
                duration: video.contentDetails.duration,
                views: parseInt(video.statistics.viewCount || 0),
                likes: parseInt(video.statistics.likeCount || 0),
                comments: parseInt(video.statistics.commentCount || 0),
                channelTitle: video.snippet.channelTitle
            };
        });
        
        // Atualizar lista de vídeos
        allVideos = newVideos;
        currentVideos = [...newVideos];
        
        console.log(`✅ ${newVideos.length} vídeos carregados`);
        
        // Aplicar ordenação local se necessário
        if (lastSort.includes('Asc') || lastSort.includes('comments')) {
            applyLocalSorting(lastSort);
        }
        
        // Exibir vídeos
        displayVideos(currentVideos);
        
    } catch (error) {
        console.error('❌ Erro nos detalhes:', error);
        throw error;
    }
}

// ===== ORDENAÇÃO LOCAL =====
function applyLocalSorting(sortBy) {
    if (!currentVideos || currentVideos.length === 0) return;
    
    console.log('🔀 Ordenando localmente:', sortBy);
    
    const videosToSort = [...currentVideos];
    
    switch (sortBy) {
        case 'dateDesc':
            // Já vem ordenado por data da API
            break;
            
        case 'dateAsc':
            videosToSort.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
            break;
            
        case 'viewsDesc':
            videosToSort.sort((a, b) => b.views - a.views);
            break;
            
        case 'viewsAsc':
            videosToSort.sort((a, b) => a.views - b.views);
            break;
            
        case 'likesDesc':
            videosToSort.sort((a, b) => b.likes - a.likes);
            break;
            
        case 'likesAsc':
            videosToSort.sort((a, b) => a.likes - b.likes);
            break;
            
        case 'commentsDesc':
            videosToSort.sort((a, b) => b.comments - a.comments);
            break;
            
        case 'commentsAsc':
            videosToSort.sort((a, b) => a.comments - b.comments);
            break;
            
        default:
            break;
    }
    
    currentVideos = videosToSort;
}

// ===== EXIBIÇÃO DE VÍDEOS =====
function displayVideos(videos) {
    const container = document.getElementById('videos-container');
    if (!container) return;
    
    if (!videos || videos.length === 0) {
        showNoVideosMessage();
        return;
    }
    
    let html = '';
    
    videos.forEach(video => {
        const duration = formatDuration(video.duration);
        const published = formatDate(video.publishedAt);
        
        html += `
            <div class="video-card">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <div class="play-button" data-video-id="${video.id}">
                        <i class="fas fa-play"></i>
                    </div>
                    <div class="video-duration">${duration}</div>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                    <p class="video-channel">${video.channelTitle}</p>
                    <p class="video-date">${published}</p>
                    
                    <div class="video-stats-grid">
                        <div class="stat-item">
                            <span class="stat-icon"><i class="fas fa-eye"></i></span>
                            <span class="stat-text">${formatNumber(video.views)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon"><i class="fas fa-thumbs-up"></i></span>
                            <span class="stat-text">${formatNumber(video.likes)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon"><i class="fas fa-comment"></i></span>
                            <span class="stat-text">${formatNumber(video.comments)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon"><i class="fas fa-calendar"></i></span>
                            <span class="stat-text">${published}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Configurar botões play
    document.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            playVideo(videoId);
        });
    });
}

function playVideo(videoId) {
    const video = allVideos.find(v => v.id === videoId);
    if (!video) return;
    
    // Abrir no YouTube
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
}

// ===== FUNÇÕES AUXILIARES =====
function formatDuration(duration) {
    if (!duration) return '00:00';
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '00:00';
    
    const hours = (match[1] || '').replace('H', '') || '0';
    const minutes = (match[2] || '').replace('M', '') || '0';
    const seconds = (match[3] || '').replace('S', '') || '0';
    
    let result = '';
    if (parseInt(hours) > 0) {
        result += hours.padStart(2, '0') + ':';
    }
    result += minutes.padStart(2, '0') + ':';
    result += seconds.padStart(2, '0');
    
    return result;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays <= 7) return `Há ${diffDays} dias`;
        
        return date.toLocaleDateString('pt-BR');
    } catch {
        return dateString;
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace('.', ',') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.', ',') + 'K';
    }
    return num.toString();
}

// ===== MENSAGENS DE STATUS =====
function showLoading(message) {
    const container = document.getElementById('videos-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="video-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>${message}</p>
        </div>
    `;
}

function showErrorMessage(message) {
    const container = document.getElementById('videos-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="video-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn" style="margin-top: 15px;">
                <i class="fas fa-redo"></i> Recarregar Página
            </button>
        </div>
    `;
}

function showNoVideosMessage() {
    const container = document.getElementById('videos-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="video-error">
            <i class="fas fa-video-slash"></i>
            <p>Nenhum vídeo encontrado.</p>
        </div>
    `;
}

function showNoResultsMessage(searchTerm) {
    const container = document.getElementById('videos-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="video-error">
            <i class="fas fa-search"></i>
            <p>Nenhum resultado para "${searchTerm}".</p>
            <button onclick="clearSearch()" class="btn" style="margin-top: 15px;">
                <i class="fas fa-times"></i> Limpar Busca
            </button>
        </div>
    `;
}

// ===== FUNÇÕES GLOBAIS =====
window.clearSearch = function() {
    const searchInput = document.getElementById('searchVideo');
    const sortSelect = document.getElementById('sortBy');
    
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'dateDesc';
    
    lastSearch = '';
    lastSort = 'dateDesc';
    
    // Recarregar vídeos iniciais
    if (channelId) {
        loadInitialVideos();
    }
};

window.reloadVideos = function() {
    if (channelId) {
        loadInitialVideos();
    }
};

// No seu script.js - Dados hardcoded (simples para começar)
const PRODUCTS_DATA = [
    {
        id: 1,
        title: "Camisa de Botão Oversized",
        image: "camisabotao.jpeg",
        price: "R$ 179,90",
        oldPrice: "",
        link: "https://www.lolja.com.br/produto/camisa-de-botao-oversized-manikomio-17148",
        tags: ["6x sem juros"]
    },
    {
        id: 2,
        title: "Shoulder Bag Colorida - Hehe Colorido",
        image: "shoulder.jpeg",
        price: "R$ 119,90",
        oldPrice: "",
        link: "https://www.lolja.com.br/produto/shoulder-bag-colorida-hehe-colorido-19833",
        tags: ["6x sem juros"]
    },
    {
        id: 3,
        title: "Camiseta Oversized Preta",
        image: "camisapreta.jpeg",
        price: "R$ 129,90",
        oldPrice: "R$ 199,90",
        link: "https://www.lolja.com.br/produto/camiseta-oversized-preta-gnomo-17142",
        tags: ["-35%"]
    },
    {
        id: 4,
        title: "Jogo de Cartas Perna Kurta",
        image: "pernakurta.jpeg",
        price: "R$ 69,90",
        oldPrice: "",
        link: "https://www.lolja.com.br/produto/card-game-perna-curta-21162",
        tags: ["6x sem juros"]
    },
    {
        id: 5,
        title: "Moletom Preto Elfcore",
        image: "moletompreto.jpeg",
        price: "R$ 249,90",
        oldPrice: "R$ 269,90",
        link: "https://www.lolja.com.br/produto/moletom-preto-elfcore-18961",
        tags: ["-7%"]
    }
];

// Função para carregar produtos
function loadProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    let html = '';
    
    PRODUCTS_DATA.forEach(product => {
        html += `
            <a href="${product.link}" target="_blank" class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">${product.price}</div>
                    ${product.oldPrice ? `<div class="product-old-price">${product.oldPrice}</div>` : ''}
                    
                    <div class="product-tags">
                        ${product.tags.map(tag => `<span class="product-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </a>
        `;
    });
    
    container.innerHTML = html;
}

// Adicione na inicialização
document.addEventListener('DOMContentLoaded', function() {
    // ... outras inicializações ...
    loadProducts(); // Adicione esta linha
});