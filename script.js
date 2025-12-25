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