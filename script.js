// script.js - Manikomio (REFATORADO)
'use strict';

// ===== CONFIGURAÇÕES =====
const YOUTUBE_API_KEY = 'AIzaSyADye-5HIah6qFBa4xN2whZVo8-uSO_Xs8';
const CHANNEL_NAME = '@Manikomioloko';
const MAX_RESULTS = 10;

// ===== ESTADO GLOBAL =====
let allVideos = [];
let filteredVideos = [];
let isLoading = false;
let channelId = '';
let currentSort = 'dateDesc';
let currentSearch = '';

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Manikomio inicializando...');
    
    // Inicializar componentes
    initNavigation();
    initContactForm();
    initFilters();
    
    // Carregar vídeos
    setTimeout(loadYouTubeData, 500);
});

// ===== NAVEGAÇÃO =====
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Ativar link clicado
            document.querySelectorAll('.nav-link').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
            
            // Mostrar página correspondente
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });
            
            const pageId = this.getAttribute('data-page');
            const page = document.getElementById(pageId);
            if (page) page.classList.add('active');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ===== CONTATO =====
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Obrigado pela sua mensagem! A equipe do Manikomio entrará em contato em breve.');
        this.reset();
    });
}

// ===== FILTROS =====
function initFilters() {
    const sortSelect = document.getElementById('sortBy');
    const searchInput = document.getElementById('searchVideo');
    const applyButton = document.getElementById('applyFilters');
    
    if (!sortSelect || !searchInput || !applyButton) {
        console.warn('Elementos de filtro não encontrados');
        return;
    }
    
    // Configurar valores padrão
    sortSelect.value = 'dateDesc';
    searchInput.value = '';
    
    // Evento no botão aplicar
    applyButton.addEventListener('click', function(e) {
        e.preventDefault();
        applyFilters();
    });
    
    // Evento no input de busca (com debounce)
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 500);
    });
    
    // Evento no select de ordenação
    sortSelect.addEventListener('change', function() {
        applyFilters();
    });
}

function applyFilters() {
    const sortSelect = document.getElementById('sortBy');
    const searchInput = document.getElementById('searchVideo');
    
    if (!sortSelect || !searchInput) return;
    
    currentSort = sortSelect.value;
    currentSearch = searchInput.value.trim().toLowerCase();
    
    console.log('🔍 Aplicando filtros:', { sort: currentSort, search: currentSearch });
    
    // Se não há vídeos carregados ainda, aguarda
    if (allVideos.length === 0) {
        console.log('Aguardando carregamento dos vídeos...');
        return;
    }
    
    // Aplicar filtros
    filterAndSortVideos();
}

function filterAndSortVideos() {
    // 1. Aplicar filtro de busca
    if (currentSearch) {
        filteredVideos = allVideos.filter(video => 
            video.title.toLowerCase().includes(currentSearch) ||
            video.description?.toLowerCase().includes(currentSearch)
        );
    } else {
        filteredVideos = [...allVideos];
    }
    
    // 2. Aplicar ordenação
    sortVideos(currentSort);
    
    // 3. Exibir resultados
    displayVideos(filteredVideos);
}

function sortVideos(sortBy) {
    switch(sortBy) {
        case 'dateDesc':
            filteredVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            break;
        case 'dateAsc':
            filteredVideos.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
            break;
        case 'viewsDesc':
            filteredVideos.sort((a, b) => b.views - a.views);
            break;
        case 'viewsAsc':
            filteredVideos.sort((a, b) => a.views - b.views);
            break;
        case 'likesDesc':
            filteredVideos.sort((a, b) => b.likes - a.likes);
            break;
        case 'likesAsc':
            filteredVideos.sort((a, b) => a.likes - b.likes);
            break;
        case 'commentsDesc':
            filteredVideos.sort((a, b) => b.comments - a.comments);
            break;
        case 'commentsAsc':
            filteredVideos.sort((a, b) => a.comments - b.comments);
            break;
        default:
            filteredVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
}

// ===== YOUTUBE API =====
async function loadYouTubeData() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    
    try {
        // 1. Buscar ID do canal
        channelId = await getChannelId();
        if (!channelId) throw new Error('Não foi possível encontrar o canal');
        
        // 2. Buscar vídeos do canal
        await loadChannelVideos();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        showError('Erro ao carregar vídeos do YouTube. Tente recarregar a página.');
    } finally {
        isLoading = false;
    }
}

async function getChannelId() {
    try {
        // Remover @ do nome do canal
        const handle = CHANNEL_NAME.replace('@', '');
        
        // Tentar buscar por handle
        const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${YOUTUBE_API_KEY}`;
        console.log('🔍 Buscando canal:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            console.log('✅ Canal encontrado:', data.items[0].id);
            return data.items[0].id;
        }
        
        // Se não encontrar por handle, tentar por busca
        console.log('⚠️ Canal não encontrado por handle, tentando busca...');
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(CHANNEL_NAME)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (searchData.items && searchData.items.length > 0) {
            const channelId = searchData.items[0].id.channelId;
            console.log('✅ Canal encontrado por busca:', channelId);
            return channelId;
        }
        
        throw new Error('Canal não encontrado');
        
    } catch (error) {
        console.error('❌ Erro ao buscar canal:', error);
        throw error;
    }
}

async function loadChannelVideos() {
    try {
        // Buscar vídeos do canal (ordenados por data)
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${MAX_RESULTS}&key=${YOUTUBE_API_KEY}`;
        console.log('📥 Buscando vídeos:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            showNoVideos();
            return;
        }
        
        // Extrair IDs dos vídeos
        const videoIds = data.items
            .map(item => item.id.videoId)
            .filter(id => id)
            .join(',');
        
        // Buscar detalhes dos vídeos
        await loadVideoDetails(videoIds, data.items);
        
    } catch (error) {
        console.error('❌ Erro ao carregar vídeos:', error);
        throw error;
    }
}

async function loadVideoDetails(videoIds, videoItems) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            throw new Error('Nenhum detalhe de vídeo retornado');
        }
        
        // Processar vídeos
        allVideos = data.items.map(video => {
            const searchItem = videoItems.find(item => item.id.videoId === video.id);
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
        
        console.log(`✅ ${allVideos.length} vídeos carregados`);
        
        // Aplicar filtros iniciais
        filteredVideos = [...allVideos];
        sortVideos(currentSort);
        displayVideos(filteredVideos);
        
    } catch (error) {
        console.error('❌ Erro nos detalhes:', error);
        throw error;
    }
}

// ===== EXIBIÇÃO DE VÍDEOS =====
function displayVideos(videos) {
    const container = document.getElementById('videos-container');
    if (!container) return;
    
    if (!videos || videos.length === 0) {
        container.innerHTML = `
            <div class="video-error">
                <i class="fas fa-search"></i>
                <p>Nenhum vídeo encontrado com os filtros atuais.</p>
                <button onclick="clearFilters()" class="btn" style="margin-top: 15px;">
                    <i class="fas fa-times"></i> Limpar Filtros
                </button>
            </div>
        `;
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
    
    // Adicionar eventos aos botões de play
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
    
    // Abrir modal ou nova aba
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    
    // Ou para abrir no modal (se tiver configurado):
    // openVideoModal(videoId);
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
        if (diffDays <= 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
        
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
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

// ===== FUNÇÕES DE INTERFACE =====
function showLoading() {
    const container = document.getElementById('videos-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="video-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando vídeos do Manikomio...</p>
        </div>
    `;
}

function showError(message) {
    const container = document.getElementById('videos-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="video-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button onclick="retryLoad()" class="btn" style="margin-top: 15px;">
                <i class="fas fa-redo"></i> Tentar Novamente
            </button>
        </div>
    `;
}

function showNoVideos() {
    const container = document.getElementById('videos-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="video-error">
            <i class="fas fa-video-slash"></i>
            <p>Nenhum vídeo encontrado para este canal.</p>
            <button onclick="location.reload()" class="btn" style="margin-top: 15px;">
                <i class="fas fa-redo"></i> Recarregar Página
            </button>
        </div>
    `;
}

// ===== FUNÇÕES GLOBAIS (para uso nos botões) =====
window.clearFilters = function() {
    const sortSelect = document.getElementById('sortBy');
    const searchInput = document.getElementById('searchVideo');
    
    if (sortSelect) sortSelect.value = 'dateDesc';
    if (searchInput) searchInput.value = '';
    
    currentSort = 'dateDesc';
    currentSearch = '';
    
    applyFilters();
};

window.retryLoad = function() {
    loadYouTubeData();
};

// ===== TESTE DE FUNCIONAMENTO =====
function testAPI() {
    console.log('🧪 Testando API do YouTube...');
    
    const testUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=Manikomioloko&key=${YOUTUBE_API_KEY}`;
    
    fetch(testUrl)
        .then(response => {
            console.log('Status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Resposta:', data);
            if (data.error) {
                console.error('Erro da API:', data.error);
            }
        })
        .catch(error => console.error('Erro de rede:', error));
}

// Executar teste após carregamento
setTimeout(testAPI, 3000);