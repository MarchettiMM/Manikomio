// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Navegação entre páginas
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove a classe active de todos os links
            document.querySelectorAll('.nav-link').forEach(item => {
                item.classList.remove('active');
            });
            
            // Adiciona a classe active ao link clicado
            this.classList.add('active');
            
            // Esconde todas as páginas
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });
            
            // Mostra a página correspondente
            const pageId = this.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');
            
            // Scroll para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
    
    // Formulário de contato
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Obrigado pela sua mensagem! A equipe do Manikomio entrará em contato em breve.');
        this.reset();
    });
    
    // Efeito nos botões de play dos vídeos
    document.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', function() {
            const videoCard = this.closest('.video-card');
            const videoTitle = videoCard.querySelector('.video-title').textContent;
            alert(`Reproduzindo: ${videoTitle}\n\nEm um site real, este botão iniciaria o vídeo.`);
        });
    });
    
    // Efeito de hover nas estatísticas
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Decorações flutuantes
    const decorations = document.querySelectorAll('.decoration');
    decorations.forEach((decoration, index) => {
        // Posiciona aleatoriamente
        const top = Math.random() * 80 + 10;
        const left = Math.random() * 80 + 10;
        decoration.style.top = `${top}%`;
        decoration.style.left = `${left}%`;
        
        // Animação flutuante
        let direction = 1;
        let position = 0;
        
        setInterval(() => {
            position += 0.5 * direction;
            
            if (position > 5 || position < -5) {
                direction *= -1;
            }
            
            decoration.style.transform = `translateY(${position}px)`;
        }, 100);
    });
    
    // Efeito de digitação no título (opcional)
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
        
        // Inicia a animação após um pequeno delay
        setTimeout(typeWriter, 500);
    }
    
    // Adiciona evento de clique nos links do footer
    document.querySelectorAll('.footer-links .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            
            // Ativa a página correspondente
            document.querySelectorAll('.nav-link').forEach(item => {
                item.classList.remove('active');
            });
            
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });
            
            const targetLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
            if (targetLink) {
                targetLink.classList.add('active');
                document.getElementById(pageId).classList.add('active');
                
                // Scroll para o topo
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
});

// Configurações da API do YouTube
const YOUTUBE_API_KEY = 'AIzaSyADye-5HIah6qFBa4xN2whZVo8-uSO_Xs8'; // SUBSTITUA POR SUA CHAVE
const CHANNEL_ID = '@Manikomioloko'; // ID do canal Manikomio (precisa buscar)
const MAX_RESULTS = 10;

// Função para buscar os vídeos do canal
async function fetchYouTubeVideos() {
    const container = document.getElementById('videos-container');
    
    try {
        // Primeiro, busca o ID do canal usando o nome
        const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Manikomioloko&type=channel&key=${YOUTUBE_API_KEY}`
        );
        
        const searchData = await searchResponse.json();
        const channelId = searchData.items[0]?.id?.channelId;
        
        if (!channelId) {
            throw new Error('Canal não encontrado');
        }
        
        // Busca os vídeos do canal
        const videosResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${MAX_RESULTS}&order=date&type=video&key=${YOUTUBE_API_KEY}`
        );
        
        const videosData = await videosResponse.json();
        displayVideos(videosData.items);
        
    } catch (error) {
        console.error('Erro ao buscar vídeos:', error);
        container.innerHTML = `
            <div class="video-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar vídeos. Tente novamente mais tarde.</p>
            </div>
        `;
    }
}

// Função para exibir os vídeos
function displayVideos(videos) {
    const container = document.getElementById('videos-container');
    container.innerHTML = '';
    
    videos.forEach(video => {
        const videoId = video.id.videoId;
        const title = video.snippet.title;
        const thumbnail = video.snippet.thumbnails.medium.url;
        const channelTitle = video.snippet.channelTitle;
        const publishedAt = new Date(video.snippet.publishedAt).toLocaleDateString('pt-BR');
        
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbnail}" alt="${title}" style="width:100%; height:100%; object-fit:cover;">
                <div class="play-button" data-video-id="${videoId}">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-info">
                <h3 class="video-title">${title}</h3>
                <p>Canal: ${channelTitle}</p>
                <div class="video-stats">
                    <span>Publicado em: ${publishedAt}</span>
                </div>
            </div>
        `;
        
        container.appendChild(videoCard);
    });
    
    // Adiciona evento de clique nos botões de play
    document.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            playYouTubeVideo(videoId);
        });
    });
}

// Função para reproduzir vídeo
function playYouTubeVideo(videoId) {
    // Abre o vídeo no YouTube em uma nova aba
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    
    // OU para embed no próprio site (mais avançado):
    // openVideoModal(videoId);
}

// Executa quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    // Chama a função após 1 segundo (para não bloquear o carregamento inicial)
    setTimeout(fetchYouTubeVideos, 1000);
});