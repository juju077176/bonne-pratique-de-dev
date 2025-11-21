// Gestion des modales
document.addEventListener('DOMContentLoaded', () => {
    console.log('[AUTH] Initializing');
    
    // Récupérer les éléments
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    
    // Ouvrir modales
    if (loginBtn) {
        loginBtn.onclick = () => {
            console.log('[AUTH] Opening login modal');
            loginModal.style.display = 'block';
        };
    }
    
    if (registerBtn) {
        registerBtn.onclick = () => {
            console.log('[AUTH] Opening register modal');
            registerModal.style.display = 'block';
        };
    }
    
    // Fermer modales avec X
    document.querySelectorAll('.close').forEach(btn => {
        btn.onclick = function() {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
            if (adminModal) adminModal.style.display = 'none';
        };
    });
    
    // Formulaire de connexion
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log('[AUTH] Login form submitted');
            
            const email = e.target.querySelector('input[type="email"]').value;
            console.log('[AUTH] Email:', email);
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                console.log('[AUTH] Response status:', response.status);
                const data = await response.json();
                console.log('[AUTH] Response data:', data);
                
                if (response.ok) {
                    localStorage.setItem('userEmail', email);
                    loginModal.style.display = 'none';
                    showNotification('Connexion réussie');
                    updateAuthUI(email);
                } else {
                    showNotification(data.message || 'Erreur de connexion');
                }
            } catch (error) {
                console.error('[AUTH] Error:', error);
                showNotification('Erreur de connexion');
            }
        };
    }
    
    // Formulaire d'inscription
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            console.log('[AUTH] Register form submitted');
            
            const email = e.target.querySelector('input[type="email"]').value;
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('userEmail', email);
                    registerModal.style.display = 'none';
                    showNotification('Inscription réussie');
                    updateAuthUI(email);
                } else {
                    showNotification(data.message || 'Erreur d\'inscription');
                }
            } catch (error) {
                console.error('[AUTH] Error:', error);
                showNotification('Erreur d\'inscription');
            }
        };
    }
    
    // Déconnexion
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            console.log('[AUTH] Logging out');
            localStorage.removeItem('userEmail');
            updateAuthUI(null);
            showNotification('Déconnexion réussie');
        };
    }
    
    // Bouton Admin
    if (adminBtn) {
        adminBtn.onclick = () => {
            console.log('[AUTH] Opening admin panel');
            adminModal.style.display = 'block';
            if (window.initAdminPanel) {
                window.initAdminPanel();
            } else {
                console.error('[AUTH] initAdminPanel not found');
            }
        };
    }
    
    // Vérifier l'état de connexion au chargement
    const savedEmail = localStorage.getItem('userEmail');
    console.log('[AUTH] Saved email:', savedEmail);
    if (savedEmail) {
        updateAuthUI(savedEmail);
    }
});

function updateAuthUI(email) {
    console.log('[AUTH] Updating UI for:', email);
    
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const adminBtn = document.getElementById('adminBtn');
    
    if (email) {
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        document.getElementById('userEmail').textContent = email;
        
        // Afficher bouton admin si admin
        if (email === 'ju.riviere77@gmail.com') {
            adminBtn.style.display = 'inline-block';
        } else {
            adminBtn.style.display = 'none';
        }
    } else {
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
        adminBtn.style.display = 'none';
    }
}

function showNotification(message) {
    console.log('[AUTH] Notification:', message);
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}
