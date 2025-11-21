const ADMIN_EMAIL = 'ju.riviere77@gmail.com';
let selectedUser = null;
let allServices = [];

// Initialiser le panneau admin
function initAdminPanel() {
    console.log('[ADMIN] Initializing admin panel');
    loadUsers();
    loadServicesForAdmin();
    setupAdminEvents();
}

// Charger tous les utilisateurs
async function loadUsers() {
    console.log('[ADMIN] Loading users');
    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'user-email': localStorage.getItem('userEmail') }
        });
        
        if (!response.ok) throw new Error('Erreur chargement utilisateurs');
        
        const users = await response.json();
        console.log('[ADMIN] Users loaded:', users);
        displayUsers(users);
    } catch (error) {
        console.error('[ADMIN] Error:', error);
        document.getElementById('usersList').innerHTML = '<p style="color:red;">Erreur de chargement</p>';
    }
}

// Afficher les utilisateurs
function displayUsers(users) {
    const container = document.getElementById('usersList');
    if (!users || users.length === 0) {
        container.innerHTML = '<p>Aucun utilisateur</p>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-item" onclick="selectUser('${user.email}')">
            ${user.email}
        </div>
    `).join('');
}

// Sélectionner un utilisateur
async function selectUser(email) {
    console.log('[ADMIN] User selected:', email);
    selectedUser = email;
    
    // Marquer visuellement
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('selected');
        if (item.textContent.trim() === email) {
            item.classList.add('selected');
        }
    });
    
    // Charger les détails
    await loadUserDetails(email);
}

// Charger les détails d'un utilisateur
async function loadUserDetails(email) {
    try {
        const response = await fetch(`/api/reservations?email=${encodeURIComponent(email)}`);
        const reservations = await response.json();
        displayUserDetails(email, reservations);
    } catch (error) {
        console.error('[ADMIN] Error loading details:', error);
    }
}

// Afficher les détails d'un utilisateur
function displayUserDetails(email, reservations) {
    const container = document.getElementById('userDetails');
    
    let html = `
        <h3>${email}</h3>
        
        <div class="admin-section">
            <h4>Ajouter une réservation</h4>
            <select id="adminServiceSelect">
                ${allServices.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
            <input type="datetime-local" id="adminDateTime" />
            <button onclick="createReservationForUser()">Créer</button>
        </div>
        
        <div class="admin-section">
            <h4>Réservations (${reservations.length})</h4>
            ${reservations.length === 0 ? '<p>Aucune réservation</p>' : ''}
            ${reservations.map(res => `
                <div class="reservation-item">
                    <strong>${res.serviceName || 'Service'}</strong><br>
                    Date: ${new Date(res.datetime).toLocaleString()}<br>
                    <input type="datetime-local" id="edit-${res.id}" value="${formatDateTime(res.datetime)}" />
                    <button onclick="updateReservation('${res.id}')">Modifier</button>
                    <button onclick="deleteReservation('${res.id}')" class="btn-danger">Supprimer</button>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

// Charger les services pour le select
async function loadServicesForAdmin() {
    try {
        const response = await fetch('/api/services');
        allServices = await response.json();
    } catch (error) {
        console.error('[ADMIN] Error loading services:', error);
    }
}

// Créer une réservation pour un utilisateur
async function createReservationForUser() {
    if (!selectedUser) {
        alert('Sélectionnez un utilisateur');
        return;
    }
    
    const serviceId = document.getElementById('adminServiceSelect').value;
    const dateTime = document.getElementById('adminDateTime').value;
    
    if (!serviceId || !dateTime) {
        alert('Remplissez tous les champs');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-email': localStorage.getItem('userEmail')
            },
            body: JSON.stringify({
                userEmail: selectedUser,
                serviceId,
                dateTime: dateTime.replace('T', ' ') + ':00'
            })
        });
        
        if (response.ok) {
            showNotification('Réservation créée');
            loadUserDetails(selectedUser);
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        alert('Erreur lors de la création');
    }
}

// Modifier une réservation
async function updateReservation(id) {
    const newDateTime = document.getElementById(`edit-${id}`).value;
    
    try {
        const response = await fetch(`/api/admin/reservations/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'user-email': localStorage.getItem('userEmail')
            },
            body: JSON.stringify({
                dateTime: newDateTime.replace('T', ' ') + ':00'
            })
        });
        
        if (response.ok) {
            showNotification('Réservation modifiée');
            loadUserDetails(selectedUser);
        } else {
            alert('Erreur de modification');
        }
    } catch (error) {
        alert('Erreur de modification');
    }
}

// Supprimer une réservation
let reservationToDelete = null;

async function deleteReservation(id) {
    reservationToDelete = id;
    document.getElementById('confirmDeleteModal').style.display = 'block';
}

async function confirmDeleteReservation() {
    if (!reservationToDelete) return;
    
    try {
        const response = await fetch(`/api/admin/reservations/${reservationToDelete}`, {
            method: 'DELETE',
            headers: { 'user-email': localStorage.getItem('userEmail') }
        });
        
        if (response.ok) {
            showNotification('Réservation supprimée');
            loadUserDetails(selectedUser);
        } else {
            alert('Erreur de suppression');
        }
    } catch (error) {
        alert('Erreur de suppression');
    } finally {
        document.getElementById('confirmDeleteModal').style.display = 'none';
        reservationToDelete = null;
    }
}

// Formater datetime pour input
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Setup des événements
function setupAdminEvents() {
    const closeBtn = document.getElementById('closeAdminModal');
    const modal = document.getElementById('adminModal');
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');
    
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }
    
    if (confirmBtn) {
        confirmBtn.onclick = confirmDeleteReservation;
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            confirmDeleteModal.style.display = 'none';
            reservationToDelete = null;
        };
    }
    
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
        if (e.target === confirmDeleteModal) {
            confirmDeleteModal.style.display = 'none';
            reservationToDelete = null;
        }
    };
}

// Exposer la fonction d'initialisation
window.initAdminPanel = initAdminPanel;
