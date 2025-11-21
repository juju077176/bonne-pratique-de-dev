let currentServices = [];

// Charger les services au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    setupEventListeners();
});

function setupEventListeners() {
    const myBtn = document.getElementById('myReservationsBtn');
    if (myBtn) {
        myBtn.addEventListener('click', () => {
            document.getElementById('services-section').style.display = 'none';
            document.getElementById('reservations-section').style.display = 'block';
            loadUserReservations();
        });
    }

    const backBtn = document.getElementById('backToServices');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('services-section').style.display = 'block';
            document.getElementById('reservations-section').style.display = 'none';
        });
    }

    // Submit du formulaire de réservation (modale)
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const serviceId = bookingForm.dataset.serviceId;
            const datetimeLocal = document.getElementById('bookingDateTime').value;
            if (!serviceId || !datetimeLocal) return showNotification('Service et date requis');

            // convertir datetime-local (YYYY-MM-DDTHH:mm) en 'YYYY-MM-DD HH:mm:00'
            const dateTime = formatDateTimeLocalToSQL(datetimeLocal);

            const email = localStorage.getItem('userEmail');
            if (!email) {
                showNotification('Veuillez vous connecter pour réserver');
                document.getElementById('loginModal').style.display = 'block';
                return;
            }

            try {
                const response = await fetch('/api/reservations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'user-email': email
                    },
                    body: JSON.stringify({ serviceId, dateTime })
                });

                const data = await response.json();
                showNotification(data.message || (response.ok ? 'Réservation confirmée' : 'Erreur'));
                if (response.ok) {
                    document.getElementById('bookingModal').style.display = 'none';
                    loadUserReservations();
                }
            } catch (err) {
                showNotification('Erreur lors de la réservation');
            }
        });
    }

    // fermeture de la modale de réservation (si utilisateur clique sur la croix)
    document.querySelectorAll('#bookingModal .close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('bookingModal').style.display = 'none';
        });
    });
}

// Charger les services
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des services');
        }
        const services = await response.json();
        currentServices = services || []; // important : remplir currentServices
        displayServices(services);
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement des services');
    }
}

// Afficher les services
function displayServices(services) {
    const container = document.getElementById('services-container');
    if (!container) return;

    // appeler bookService qui ouvre la modale
    container.innerHTML = services.map(service => `
        <div class="service-card">
            <h3>${service.name}</h3>
            <p>${service.description || 'Aucune description'}</p>
            <p>Durée: ${service.duration} minutes</p>
            <button onclick="bookService('${service.id}')" class="btn-book">
                Réserver
            </button>
        </div>
    `).join('');
}

function bookService(serviceId) {
    const email = localStorage.getItem('userEmail');
    if (!email) {
        showNotification('Veuillez vous connecter pour réserver');
        document.getElementById('loginModal').style.display = 'block';
        return;
    }

    const service = currentServices.find(s => s.id === serviceId);
    if (!service) {
        showNotification('Service introuvable');
        return;
    }

    // ouvrir la modale et préremplir
    showBookingModal(serviceId);
}

function showBookingModal(serviceId) {
    const service = currentServices.find(s => s.id === serviceId);
    if (!service) return;

    const modal = document.getElementById('bookingModal');
    const form = document.getElementById('bookingForm');
    const dateInput = document.getElementById('bookingDate');
    const timeSelect = document.getElementById('timeSlots');
    
    // Définir le service ID
    form.dataset.serviceId = serviceId;
    
    // Définir la date par défaut (aujourd'hui)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const dd = String(today.getDate()).padStart(2,'0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    
    // Réinitialiser le select
    timeSelect.innerHTML = '<option value="">Chargement...</option>';
    
    // Charger les créneaux pour aujourd'hui
    loadAvailableSlots(serviceId, dateInput.value, timeSelect);
    
    // Écouter les changements de date
    dateInput.onchange = () => {
        console.log('[BOOKING] Date changed to:', dateInput.value);
        timeSelect.innerHTML = '<option value="">Chargement...</option>';
        loadAvailableSlots(serviceId, dateInput.value, timeSelect);
    };
    
    // Afficher le modal
    modal.style.display = 'block';
    
    // Gérer la soumission du formulaire
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const selectedOption = timeSelect.options[timeSelect.selectedIndex];
        if (!selectedOption || !selectedOption.dataset.datetime) {
            showNotification('Veuillez choisir un créneau horaire');
            return;
        }
        
        const datetime = selectedOption.dataset.datetime;
        const email = localStorage.getItem('userEmail');
        
        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-email': email
                },
                body: JSON.stringify({ serviceId, dateTime: datetime })
            });

            const data = await response.json();
            
            if (response.ok) {
                showNotification('Réservation confirmée');
                modal.style.display = 'none';
            } else {
                showNotification(data.message || 'Erreur lors de la réservation');
            }
        } catch (err) {
            showNotification('Erreur lors de la réservation');
        }
    };
}

// charge les créneaux depuis le backend et bloque les options prises
async function loadAvailableSlots(serviceId, date, selectElement) {
    console.log('[BOOKING] Loading slots for:', serviceId, date);
    
    if (!serviceId || !date || !selectElement) {
        console.error('[BOOKING] Missing parameters');
        return;
    }
    
    try {
        const url = `/api/slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`;
        console.log('[BOOKING] Fetching:', url);
        
        const resp = await fetch(url);
        console.log('[BOOKING] Response status:', resp.status);
        
        if (!resp.ok) {
            throw new Error('Erreur chargement créneaux');
        }
        
        const slots = await resp.json();
        console.log('[BOOKING] Received slots:', slots);
        
        if (!Array.isArray(slots) || slots.length === 0) {
            selectElement.innerHTML = '<option value="">Aucun créneau disponible ce jour</option>';
            return;
        }
        
        // Créer les options
        selectElement.innerHTML = slots.map(s => {
            const disabled = s.available ? '' : 'disabled';
            return `<option value="${s.time}" data-datetime="${s.datetime}" ${disabled}>${s.time}${s.available ? '' : ' (occupé)'}</option>`;
        }).join('');
        
        console.log('[BOOKING] Slots displayed:', slots.length);
    } catch (err) {
        console.error('[BOOKING] Error:', err);
        selectElement.innerHTML = '<option value="">Erreur chargement</option>';
        showNotification('Erreur chargement créneaux');
    }
}

// utilitaire : convertir datetime-local -> SQL DATETIME string (conserver si utilisé ailleurs)
function formatDateTimeLocalToSQL(value) {
    if (!value) return '';
    if (value.indexOf('T') === -1) return value;
    let parts = value.split('T');
    let date = parts[0];
    let time = parts[1];
    if (time.length === 5) time = time + ':00';
    return `${date} ${time}`;
}

async function handleBooking(serviceId) {
    const email = localStorage.getItem('userEmail');
    if (!email) {
        showNotification('Veuillez vous connecter pour réserver');
        document.getElementById('loginModal').style.display = 'block';
        return;
    }

    const dateTime = prompt('Choisissez une date et heure (format: YYYY-MM-DD HH:mm:ss)');
    if (!dateTime) return;

    try {
        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-email': email
            },
            body: JSON.stringify({
                serviceId,
                dateTime
            })
        });

        const data = await response.json();
        showNotification(data.message);
        
        if (response.ok) {
            loadUserReservations();
        }
    } catch (error) {
        showNotification('Erreur lors de la réservation');
    }
}

document.getElementById('myReservationsBtn').addEventListener('click', () => {
    document.getElementById('services-section').style.display = 'none';
    document.getElementById('reservations-section').style.display = 'block';
    loadUserReservations();
});

async function loadUserReservations() {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    try {
        const response = await fetch(`/api/reservations?email=${email}`);
        const reservations = await response.json();
        displayUserReservations(reservations);
    } catch (error) {
        showNotification('Erreur lors du chargement des réservations');
    }
}

function displayUserReservations(reservations) {
    const container = document.getElementById('reservations-container');
    if (!container) return;

    if (reservations.length === 0) {
        container.innerHTML = '<p>Aucune réservation</p>';
        return;
    }

    container.innerHTML = reservations.map(res => {
        const reservationDate = new Date(res.datetime);
        const now = new Date();
        const canCancel = reservationDate > now;
        
        return `
            <div class="reservation-item">
                <h3>${res.serviceName || 'Service non défini'}</h3>
                <p>Date: ${reservationDate.toLocaleString()}</p>
                <p>Durée: ${res.duration || 0} minutes</p>
                ${canCancel ? 
                    `<button onclick="cancelReservation('${res.id}')" class="btn-cancel">
                        Annuler
                    </button>` : 
                    '<p class="past-reservation">Réservation passée</p>'
                }
            </div>
        `;
    }).join('');
}

async function cancelReservation(reservationId) {
    const confirmModal = document.getElementById('confirmCancelModal');
    const confirmBtn = document.getElementById('confirmCancel');
    const cancelBtn = document.getElementById('cancelCancel');

    confirmModal.style.display = 'block';

    return new Promise((resolve) => {
        confirmBtn.onclick = async () => {
            confirmModal.style.display = 'none';
            try {
                const response = await fetch(`/api/reservations/${reservationId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'user-email': localStorage.getItem('userEmail')
                    }
                });

                if (response.ok) {
                    showNotification('Réservation annulée avec succès');
                    loadUserReservations();
                } else {
                    const data = await response.json();
                    showNotification(data.message || 'Erreur lors de l\'annulation');
                }
            } catch (error) {
                showNotification('Erreur lors de l\'annulation');
            }
        };

        cancelBtn.onclick = () => {
            confirmModal.style.display = 'none';
        };
    });
}

// Fonction utilitaire pour les notifications
function showNotification(message) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}
