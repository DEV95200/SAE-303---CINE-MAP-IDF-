// ================================================
// APPLICATION PRINCIPALE - CinéMap IDF
// ================================================
// Gestion de l'application complète : navigation, données, filtres
// Développé pour la SAÉ 303 - BUT MMI 2

class CinemaApp {
    constructor() {
        // Données et état de l'application
        this.cinemas = [];
        this.filteredCinemas = [];
        this.currentView = 'map';
        this.userLocation = null;
        
        // Références vers les composants
        this.map = null;
        this.markers = [];
        this.markerClusterGroup = null;
        
        // Initialisation de l'application
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoadingScreen();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load cinema data
        await this.loadCinemaData();
        
        // Initialize map
        this.initializeMap();
        
        // Initialize filters
        this.initializeFilters();
        
        // Initialize geolocation manager
        this.initializeGeolocation();
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        console.log('CinéMap IDF initialized successfully!');
    }

    showLoadingScreen() {
        document.getElementById('loading-screen').classList.remove('hidden');
    }

    hideLoadingScreen() {
        setTimeout(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('hidden');
                document.getElementById('loading-screen').style.opacity = '1';
            }, 500);
        }, 1000);
    }

    async loadCinemaData() {
        try {
            const response = await fetch('./include/cinemas_data.json');
            const data = await response.json();
            
            // Normaliser les données des cinémas
            this.cinemas = (data.cinemas || []).map(cinema => {
                // Si les coordonnées sont dans un objet 'coordonnees'
                if (cinema.coordonnees && cinema.coordonnees.latitude && cinema.coordonnees.longitude) {
                    cinema.latitude = cinema.coordonnees.latitude;
                    cinema.longitude = cinema.coordonnees.longitude;
                }
                
                // Filtrer les cinémas sans coordonnées valides
                return cinema;
            }).filter(cinema => cinema.latitude && cinema.longitude);
            
            this.filteredCinemas = [...this.cinemas];
            this.genres = data.genres || [];
            this.departements = data.departements || [];
            
            console.log(`✅ Chargé ${this.cinemas.length} cinémas avec coordonnées valides`);
            this.updateResultsCounter();
            
            // Si on est sur la vue liste, la rendre immédiatement
            if (this.currentView === 'list') {
                this.renderCinemasList();
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            this.showError('Erreur lors du chargement des données des cinémas');
        }
    }

    initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.id.replace('nav-', '');
                this.switchView(section);
            });
        });

        // Mobile menu
        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Mobile navigation
        document.querySelectorAll('.mobile-nav-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.target.textContent.trim();
                const section = text.includes('Carte') ? 'map' : 
                              text.includes('Liste') ? 'list' : 
                              text.includes('Statistiques') ? 'stats' : 
                              text.includes('propos') ? 'about' : 'map';
                this.switchView(section);
                this.toggleMobileMenu();
            });
        });

        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Geolocation
        document.getElementById('geolocation-btn').addEventListener('click', () => {
            this.requestGeolocation();
        });

        // Clear filters
        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearAllFilters();
        });

        // Modal close
        document.getElementById('cinema-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('cinema-modal')) {
                this.closeModal();
            }
        });

        // Filter changes
        document.getElementById('genre-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('departement-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('rating-filter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('services-filter').addEventListener('change', () => {
            this.applyFilters();
        });
    }

    switchView(view) {
        // Hide all sections
        document.querySelectorAll('.content-section, .about-section').forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });

        // Show selected section
        let targetSection;
        if (view === 'about') {
            targetSection = document.getElementById('about-section');
        } else {
            targetSection = document.getElementById(`${view}-section`);
        }
        
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
        }

        // Hide/Show filters panel based on view
        const filtersPanel = document.getElementById('filters-panel');
        if (view === 'about') {
            filtersPanel.style.display = 'none';
        } else {
            filtersPanel.style.display = 'block';
        }

        // Update navigation with ARIA attributes
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        const activeBtn = document.getElementById(`nav-${view}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-pressed', 'true');
        }

        this.currentView = view;

        // Handle view-specific initialization
        if (view === 'list') {
            this.renderCinemasList();
        } else if (view === 'stats') {
            this.renderStatistics();
        } else if (view === 'map' && this.map) {
            // Refresh map
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const menuBtn = document.getElementById('mobile-menu-btn');
        const isHidden = mobileMenu.classList.contains('hidden');
        
        mobileMenu.classList.toggle('hidden');
        
    
        menuBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        menuBtn.setAttribute('aria-label', isHidden ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation');
    }

    initializeFilters() {
        // Populate genre filter
        const genreFilter = document.getElementById('genre-filter');
        this.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });

        // Populate department filter
        const deptFilter = document.getElementById('departement-filter');
        this.departements.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.code;
            option.textContent = `${dept.code} - ${dept.nom}`;
            deptFilter.appendChild(option);
        });
    }

    applyFilters() {
        const genre = document.getElementById('genre-filter').value;
        const departement = document.getElementById('departement-filter').value;
        const rating = parseFloat(document.getElementById('rating-filter').value) || 0;
        const service = document.getElementById('services-filter').value;

        this.filteredCinemas = this.cinemas.filter(cinema => {
            // Genre filter
            if (genre !== 'all' && !cinema.types_films.includes(genre)) {
                return false;
            }

            // Department filter
            if (departement !== 'all' && cinema.departement !== departement) {
                return false;
            }

            // Rating filter
            if (rating > 0 && cinema.note < rating) {
                return false;
            }

            // Service filter
            if (service !== 'all') {
                if (service === 'parking' && !cinema.parking) {
                    return false;
                }
                if (service !== 'parking' && !cinema.services.includes(service)) {
                    return false;
                }
            }

            return true;
        });

        // Update displays
        this.updateResultsCounter();
        this.updateMapMarkers();
        
        if (this.currentView === 'list') {
            this.renderCinemasList();
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredCinemas = [...this.cinemas];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredCinemas = this.cinemas.filter(cinema =>
                cinema.nom.toLowerCase().includes(searchTerm) ||
                cinema.ville.toLowerCase().includes(searchTerm) ||
                cinema.adresse.toLowerCase().includes(searchTerm) ||
                cinema.types_films.some(genre => genre.toLowerCase().includes(searchTerm))
            );
        }

        this.updateResultsCounter();
        this.updateMapMarkers();
        
        if (this.currentView === 'list') {
            this.renderCinemasList();
        }
    }

    clearAllFilters() {
        document.getElementById('genre-filter').value = 'all';
        document.getElementById('departement-filter').value = 'all';
        document.getElementById('rating-filter').value = '0';
        document.getElementById('services-filter').value = 'all';
        document.getElementById('search-input').value = '';

        this.filteredCinemas = [...this.cinemas];
        this.updateResultsCounter();
        this.updateMapMarkers();
        
        if (this.currentView === 'list') {
            this.renderCinemasList();
        }
    }

    updateResultsCounter() {
        const counter = document.getElementById('results-count');
        if (counter) {
            counter.textContent = this.filteredCinemas.length;
        }
    }

    requestGeolocation() {
        const btn = document.getElementById('geolocation-btn');
        const originalContent = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Localisation...';
        btn.disabled = true;

        // Utiliser le gestionnaire de géolocalisation
        if (window.gestionnaireGeolocalisation) {
            window.gestionnaireGeolocalisation.getCurrentPosition()
                .then(() => {
                    const position = window.gestionnaireGeolocalisation.userPosition;
                    if (position) {
                        this.userLocation = {
                            lat: position.latitude,
                            lng: position.longitude
                        };
                        
                        this.showUserLocationOnMap();
                        this.findNearestCinemas();
                        
                        btn.innerHTML = '<i class="fas fa-check mr-2"></i>Position trouvée';
                        btn.classList.add('success');
                        
                        setTimeout(() => {
                            btn.innerHTML = originalContent;
                            btn.classList.remove('success');
                            btn.disabled = false;
                        }, 2000);
                    }
                })
                .catch((error) => {
                    console.error('Erreur géolocalisation:', error);
                    btn.innerHTML = '<i class="fas fa-times mr-2"></i>Erreur';
                    btn.classList.add('error');
                    
                    setTimeout(() => {
                        btn.innerHTML = originalContent;
                        btn.classList.remove('error');
                        btn.disabled = false;
                    }, 3000);
                });
        } else {
            // Fallback vers l'ancienne méthode
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                    
                        this.showUserLocationOnMap();
                        this.findNearestCinemas();
                        
                        btn.innerHTML = originalContent;
                        btn.disabled = false;
                        
                        this.showSuccess('Position obtenue avec succès !');
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        this.showError('Impossible d\'obtenir votre position');
                        
                        btn.innerHTML = originalContent;
                        btn.disabled = false;
                    }
                );
            } else {
                this.showError('La géolocalisation n\'est pas supportée par votre navigateur');
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    }

    findNearestCinemas() {
        if (!this.userLocation) return;

        const cinemasWithDistance = this.cinemas.map(cinema => ({
            ...cinema,
            distance: this.calculateDistance(
                this.userLocation.lat, 
                this.userLocation.lng,
                cinema.latitude, 
                cinema.longitude
            )
        }));

        // Sort by distance
        cinemasWithDistance.sort((a, b) => a.distance - b.distance);

        // Show nearest cinemas (within 10km)
        const nearestCinemas = cinemasWithDistance.filter(cinema => cinema.distance <= 10);
        
        if (nearestCinemas.length > 0) {
            this.showNearestCinemasModal(nearestCinemas.slice(0, 5));
        } else {
            this.showInfo('Aucun cinéma trouvé dans un rayon de 10km');
        }
    }

    showNearestCinemasModal(cinemas) {
        const modalContent = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-cinema-accent">
                        <i class="fas fa-location-arrow mr-2"></i>Cinémas les plus proches
                    </h2>
                    <button onclick="cinemaApp.closeModal()" class="text-gray-400 hover:text-white text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-4">
                    ${cinemas.map(cinema => `
                        <div class="bg-cinema-light p-4 rounded-lg border border-cinema-medium hover:border-cinema-accent transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-semibold text-white">${cinema.nom}</h3>
                                <span class="text-cinema-accent font-medium">${cinema.distance.toFixed(1)} km</span>
                            </div>
                            <p class="text-gray-400 text-sm mb-2">
                                <i class="fas fa-map-marker-alt mr-1"></i>${cinema.adresse}
                            </p>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="rating-stars mr-2">
                                        ${this.generateStars(cinema.note)}
                                    </div>
                                    <span class="text-sm text-gray-400">(${cinema.avis_count} avis)</span>
                                </div>
                                <button onclick="cinemaApp.showCinemaDetails(${cinema.id})" 
                                        class="bg-cinema-accent text-cinema-dark px-3 py-1 rounded-lg text-sm font-medium hover:bg-yellow-500 transition-colors">
                                    Voir détails
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('modal-content').innerHTML = modalContent;
        document.getElementById('cinema-modal').classList.remove('hidden');
        document.getElementById('modal-content').parentElement.classList.add('modal-enter');
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        return stars;
    }

    closeModal() {
        const modal = document.getElementById('cinema-modal');
        const content = document.getElementById('modal-content').parentElement;
        
        content.classList.add('modal-exit');
        setTimeout(() => {
            modal.classList.add('hidden');
            content.classList.remove('modal-enter', 'modal-exit');
        }, 300);
    }

    showCinemaDetails(cinemaId) {
        const cinema = this.cinemas.find(c => c.id === cinemaId);
        if (!cinema) return;

        const modalContent = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h2 class="text-3xl font-bold text-cinema-accent mb-2">${cinema.nom}</h2>
                        <p class="text-gray-400">
                            <i class="fas fa-map-marker-alt mr-2"></i>${cinema.adresse}
                        </p>
                    </div>
                    <button onclick="cinemaApp.closeModal()" class="text-gray-400 hover:text-white text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div class="bg-cinema-light p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-cinema-accent mb-3">Informations générales</h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-400">Note:</span>
                                    <div class="flex items-center">
                                        <div class="rating-stars mr-2">${this.generateStars(cinema.note)}</div>
                                        <span class="text-white">${cinema.note}/5 (${cinema.avis_count} avis)</span>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-400">Salles:</span>
                                    <span class="text-white">${cinema.salles}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-400">Prix moyen:</span>
                                    <span class="text-cinema-accent font-semibold">${cinema.prix_moyen.toFixed(2)}€</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-400">Accessibilité:</span>
                                    <span class="${cinema.accessibilite ? 'text-green-400' : 'text-red-400'}">
                                        <i class="fas fa-${cinema.accessibilite ? 'check' : 'times'} mr-1"></i>
                                        ${cinema.accessibilite ? 'Accessible' : 'Non accessible'}
                                    </span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-400">Parking:</span>
                                    <span class="${cinema.parking ? 'text-green-400' : 'text-red-400'}">
                                        <i class="fas fa-${cinema.parking ? 'check' : 'times'} mr-1"></i>
                                        ${cinema.parking ? 'Disponible' : 'Non disponible'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-cinema-light p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-cinema-accent mb-3">Contact</h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-center">
                                    <i class="fas fa-phone mr-3 text-cinema-accent w-4"></i>
                                    <span class="text-white">${cinema.telephone}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-globe mr-3 text-cinema-accent w-4"></i>
                                    <a href="${cinema.site_web}" target="_blank" class="text-cinema-accent hover:underline">
                                        Site web
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="bg-cinema-light p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-cinema-accent mb-3">Genres de films</h3>
                            <div class="flex flex-wrap gap-2">
                                ${cinema.types_films.map(genre => `
                                    <span class="genre-tag">${genre}</span>
                                `).join('')}
                            </div>
                        </div>

                        <div class="bg-cinema-light p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-cinema-accent mb-3">Services</h3>
                            <div class="flex flex-wrap gap-2">
                                ${cinema.services.map(service => `
                                    <span class="bg-cinema-red bg-opacity-20 text-cinema-red px-3 py-1 rounded-full text-sm border border-cinema-red border-opacity-30">
                                        ${service}
                                    </span>
                                `).join('')}
                            </div>
                        </div>

                        <div class="bg-cinema-light p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-cinema-accent mb-3">Horaires</h3>
                            <div class="space-y-1 text-sm">
                                ${Object.entries(cinema.horaires).map(([jour, horaire]) => `
                                    <div class="flex justify-between">
                                        <span class="text-gray-400 capitalize">${jour}:</span>
                                        <span class="text-white">${horaire}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex justify-center">
                    <button onclick="cinemaApp.showOnMap(${cinema.id})" 
                            class="bg-cinema-accent text-cinema-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
                        <i class="fas fa-map-marked-alt mr-2"></i>Voir sur la carte
                    </button>
                </div>
            </div>
        `;

        document.getElementById('modal-content').innerHTML = modalContent;
        document.getElementById('cinema-modal').classList.remove('hidden');
        document.getElementById('modal-content').parentElement.classList.add('modal-enter');
    }

    showOnMap(cinemaId) {
        const cinema = this.cinemas.find(c => c.id === cinemaId);
        if (!cinema) return;

        this.closeModal();
        this.switchView('map');
        
        setTimeout(() => {
            if (this.map) {
                this.map.setView([cinema.latitude, cinema.longitude], 16);
                
                // Find and open the marker popup
                this.markerClusterGroup.eachLayer(marker => {
                    if (marker.cinemaData && marker.cinemaData.id === cinemaId) {
                        marker.openPopup();
                    }
                });
            }
        }, 100);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm transition-all duration-300 transform translate-x-full`;
        
        const icons = {
            error: 'fas fa-exclamation-circle',
            success: 'fas fa-check-circle',
            info: 'fas fa-info-circle'
        };

        const colors = {
            error: 'bg-red-600 border-red-500',
            success: 'bg-green-600 border-green-500',
            info: 'bg-blue-600 border-blue-500'
        };

        notification.innerHTML = `
            <div class="flex items-center">
                <i class="${icons[type]} mr-3"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.className += ` ${colors[type]}`;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    initializeMap() {
        console.log('Initialisation de la carte...');
        
        if (window.GestionnaireCartes) {
            try {
                this.mapManager = new GestionnaireCartes(this);
                // Exposer mapManager globalement pour les autres modules
                window.mapManager = this.mapManager;
                
                // Initialiser la carte
                this.mapManager.initialiser();
                
                // Attendre un peu avant de mettre à jour les marqueurs
                setTimeout(() => {
                    this.updateMapMarkers();
                }, 100);
                
                console.log('✅ Carte initialisée avec succès');
            } catch (error) {
                console.error('Erreur lors de l\'initialisation de la carte:', error);
                // Ne pas afficher le popup d'erreur si la carte fonctionne partiellement
                if (!this.mapManager || !this.mapManager.carte) {
                    this.showError('Erreur lors du chargement de la carte');
                }
            }
        } else {
            console.warn('GestionnaireCartes non disponible');
            setTimeout(() => this.initializeMap(), 1000); // Retry après 1 seconde
        }
    }
    
    updateMapMarkers() {
        if (this.mapManager) {
            this.mapManager.mettreAJourMarqueurs(this.filteredCinemas);
            // Mettre à jour le compteur de résultats
            this.updateResultsCounter();
            console.log(`${this.filteredCinemas.length} cinémas affichés sur la carte`);
        }
    }
    
    showUserLocationOnMap() {
        if (this.mapManager && this.userLocation) {
            this.mapManager.ajouterMarqueurUtilisateur(this.userLocation.lat, this.userLocation.lng);
        }
    }
    
    renderCinemasList() {
        console.log('Affichage de la liste des cinémas...');
        const container = document.getElementById('cinemas-grid');
        
        if (!container) {
            console.error('Container cinemas-grid non trouvé');
            return;
        }

        // Vider le container
        container.innerHTML = '';

        if (this.filteredCinemas.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-film text-6xl text-gray-600 mb-4"></i>
                    <h3 class="text-xl text-gray-400 mb-2">Aucun cinéma trouvé</h3>
                    <p class="text-gray-500">Essayez de modifier vos filtres</p>
                </div>
            `;
            return;
        }

        // Trier les cinémas par note (plus haute d'abord)
        const sortedCinemas = [...this.filteredCinemas].sort((a, b) => b.note - a.note);

        // Créer les cartes de cinémas
        sortedCinemas.forEach((cinema, index) => {
            const card = this.createCinemaCard(cinema, index);
            container.appendChild(card);
        });

        console.log(`✅ ${sortedCinemas.length} cinémas affichés`);
    }
    
    createCinemaCard(cinema, index) {
        const card = document.createElement('div');
        card.className = 'cinema-card';
        
        // Calculer les horaires d'aujourd'hui
        const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
        const todayHours = cinema.horaires && cinema.horaires[today] ? cinema.horaires[today] : '14:00-22:30';
        
        // Déterminer si le cinéma est ouvert
        const isOpen = this.isCinemaCurrentlyOpen(cinema);
        
        card.innerHTML = `
            <!-- En-tête avec nom et prix -->
            <div class="cinema-header">
                <h2 class="cinema-title">${cinema.nom}</h2>
                <div class="cinema-price">${cinema.prix_moyen ? cinema.prix_moyen.toFixed(2) : '9.00'}€</div>
            </div>
            
            <!-- Adresse -->
            <div class="cinema-address">
                <i class="fas fa-map-marker-alt"></i> ${cinema.adresse}
            </div>
            
            <!-- Rating avec étoiles -->
            <div class="cinema-rating">
                <div class="stars">
                    ${this.generateStarsHTML(cinema.note || 4.5)}
                </div>
                <span class="rating-info">${(cinema.note || 4.5).toFixed(1)}/5 (${cinema.avis_count || 234} avis)</span>
            </div>
            
            <!-- Informations pratiques -->
            <div class="cinema-details">
                <div class="detail-item">
                    <i class="fas fa-film"></i>
                    <span>${cinema.salles || 3} Salles</span>
                </div>
                <div class="detail-item ${cinema.accessibilite ? 'positive' : 'negative'}">
                    <i class="fas fa-${cinema.accessibilite ? 'wheelchair' : 'times'}"></i>
                    <span>${cinema.accessibilite ? 'Accessible' : 'Pas de parking'}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>01:4...</span>
                </div>
            </div>
            
            <!-- Genres de films -->
            <div class="genres-section">
                <h4>Genres de films:</h4>
                <div class="tags-container">
                    ${(cinema.types_films || ['Art et Essai', 'Drame', 'Auteur', 'International']).slice(0, 4).map(genre => 
                        `<span class="genre-tag">${genre}</span>`
                    ).join('')}
                    ${cinema.types_films && cinema.types_films.length > 4 ? `<span class="more-tag">+${cinema.types_films.length - 4} autres</span>` : ''}
                </div>
            </div>
            
            <!-- Services -->
            <div class="services-section">
                <h4>Services:</h4>
                <div class="tags-container">
                    ${(cinema.services || ['API et Essai', 'VR', 'Projection', '+1']).slice(0, 3).map(service => 
                        `<span class="service-tag">${service}</span>`
                    ).join('')}
                    ${cinema.services && cinema.services.length > 3 ? `<span class="service-count">+${cinema.services.length - 3}</span>` : ''}
                </div>
            </div>
            
            <!-- Horaires d'aujourd'hui -->
            <div class="today-hours">
                <span class="status-indicator ${isOpen ? 'open' : 'closed'}">●</span>
                <span class="hours-text">Aujourd'hui: ${todayHours}</span>
            </div>
            
            <!-- Boutons d'action -->
            <div class="action-buttons">
                <button class="btn-details" onclick="cinemaApp.showCinemaDetails(${cinema.id})">
                    <i class="fas fa-info-circle"></i> Détails
                </button>
                <button class="btn-map" onclick="cinemaApp.showOnMap(${cinema.id})">
                    <i class="fas fa-map-marked-alt"></i> Carte
                </button>
                <a href="${cinema.site_web || '#'}" target="_blank" class="btn-external">
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `;
        
        // Animation d'apparition
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
        
        return card;
    }
    
    generateStarsHTML(rating) {
        const stars = [];
        const fullStars = Math.floor(rating || 4.5);
        const hasHalfStar = (rating || 4.5) % 1 >= 0.5;
        
        for (let i = 0; i < fullStars; i++) {
            stars.push('<i class="fas fa-star"></i>');
        }
        
        if (hasHalfStar) {
            stars.push('<i class="fas fa-star-half-alt"></i>');
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push('<i class="far fa-star"></i>');
        }
        
        return stars.join('');
    }
    
    isCinemaCurrentlyOpen(cinema) {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const today = now.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
        
        if (cinema.horaires && cinema.horaires[today]) {
            const [start, end] = cinema.horaires[today].split('-').map(time => {
                const [h, m] = time.split(':').map(Number);
                return h * 100 + m;
            });
            return currentTime >= start && currentTime <= end;
        }
        
        // Par défaut, considérer ouvert entre 14h et 22h30
        return currentTime >= 1400 && currentTime <= 2230;
    }
    
    showOnMap(cinemaId) {
        // Basculer vers la vue carte
        this.switchView('map');
        
        // Trouver le cinéma
        const cinema = this.cinemas.find(c => c.id === cinemaId);
        if (cinema && this.mapManager) {
            // Centrer la carte sur le cinéma
            this.map.setView([cinema.latitude, cinema.longitude], 15);
            
            // Ouvrir le popup du marqueur
            const marker = this.mapManager.marqueurs.find(m => m.donneesCinema && m.donneesCinema.id === cinemaId);
            if (marker) {
                marker.openPopup();
            }
        }
    }

    initializeGeolocation() {
        if (window.GestionnaireGeolocalisation) {
            window.gestionnaireGeolocalisation = new GestionnaireGeolocalisation(this);
            console.log('✅ Gestionnaire de géolocalisation initialisé');
        } else {
            console.warn('GestionnaireGeolocalisation non disponible');
        }
    }
    
    renderStatistics() {
        console.log('Début rendu statistiques...');
        
        // Vérifier si nous avons des données
        if (!this.cinemas || this.cinemas.length === 0) {
            console.warn('Aucune donnée cinema disponible pour les statistiques');
            // Afficher un message d'attente
            const container = document.querySelector('.stats-container');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #ccc;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <p>Chargement des données en cours...</p>
                        <p>Veuillez patienter.</p>
                    </div>
                `;
            }
            return;
        }

        console.log(`Génération des statistiques pour ${this.cinemas.length} cinémas...`);
        
        // Vérifier si StatistiquesCinemas existe
        if (typeof StatistiquesCinemas === 'undefined') {
            console.error('StatistiquesCinemas class not found!');
            this.renderBasicStatistics();
            return;
        }
        
        // Créer et utiliser la classe StatistiquesCinemas
        try {
            const stats = new StatistiquesCinemas(this.cinemas);
            stats.afficherToutesLesStatistiques();
            console.log(`✅ Statistiques générées avec succès!`);
        } catch (error) {
            console.error('Erreur lors du rendu des statistiques:', error);
            this.renderBasicStatistics();
        }
    }

    // Fonction pour des statistiques sous forme d'articles et insights
    renderBasicStatistics() {
        console.log('🔄 Rendu des statistiques sous forme d\'articles...');
        
        const container = document.querySelector('.stats-container');
        if (!container) {
            console.error('Container stats-container introuvable');
            return;
        }

        // Analyser les données
        const totalCinemas = this.cinemas.length;
        const avgRating = (this.cinemas.reduce((sum, c) => sum + c.note, 0) / totalCinemas).toFixed(1);
        const avgPrice = (this.cinemas.reduce((sum, c) => sum + (c.prix_moyen || 12), 0) / totalCinemas).toFixed(2);
        const totalScreens = this.cinemas.reduce((sum, c) => sum + (c.salles || 5), 0);
        const totalReviews = this.cinemas.reduce((sum, c) => sum + (c.avis_count || 0), 0);
        const parkingCount = this.cinemas.filter(c => c.parking).length;
        
        // Départements analysis
        const deptCount = {};
        const deptNames = {
            '75': 'Paris',
            '77': 'Seine-et-Marne', 
            '78': 'Yvelines',
            '91': 'Essonne',
            '92': 'Hauts-de-Seine',
            '93': 'Seine-Saint-Denis',
            '94': 'Val-de-Marne',
            '95': 'Val-d\'Oise'
        };
        this.cinemas.forEach(c => {
            deptCount[c.departement] = (deptCount[c.departement] || 0) + 1;
        });
        
        // Genres analysis
        const genreCount = {};
        this.cinemas.forEach(c => {
            if (c.types_films && Array.isArray(c.types_films)) {
                c.types_films.forEach(genre => {
                    genreCount[genre] = (genreCount[genre] || 0) + 1;
                });
            }
        });
        
        // Services analysis
        const serviceCount = {};
        this.cinemas.forEach(c => {
            if (c.services && Array.isArray(c.services)) {
                c.services.forEach(service => {
                    serviceCount[service] = (serviceCount[service] || 0) + 1;
                });
            }
        });
        
        // Top cinémas
        const topCinemas = [...this.cinemas]
            .sort((a, b) => b.note - a.note)
            .slice(0, 5);
            
        // Cinémas les plus accessibles
        const accessibleCinemas = this.cinemas.filter(c => c.accessibilite).length;
        
        // Prix ranges
        const expensiveCinemas = this.cinemas.filter(c => (c.prix_moyen || 12) > 15).length;
        const cheapCinemas = this.cinemas.filter(c => (c.prix_moyen || 12) < 10).length;

        container.innerHTML = `
            <div class="stats-articles-container">
                
                <!-- En-tête -->
                <div class="stats-intro" style="
                    background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(0, 0, 0, 0.3));
                    border: 1px solid rgba(212, 175, 55, 0.3);
                    border-radius: 12px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    text-align: center;
                ">
                    <h2 style="color: #d4af37; font-size: 2rem; margin-bottom: 1rem;">
                        <i class="fas fa-chart-line"></i> Analyse des cinémas d'Île-de-France
                    </h2>
                    <p style="color: #e0e0e0; font-size: 1.2rem; line-height: 1.6;">
                        Découvrez les tendances et insights de notre réseau de <strong style="color: #d4af37;">${totalCinemas} cinémas</strong>
                        répartis dans la région Île-de-France.
                    </p>
                </div>

                <!-- Article 1: Vue d'ensemble -->
                <article class="stat-article" style="
                    background: rgba(0, 0, 0, 0.4);
                    border-left: 4px solid #d4af37;
                    border-radius: 8px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                ">
                    <h3 style="color: #d4af37; font-size: 1.5rem; margin-bottom: 1rem;">
                        <i class="fas fa-eye"></i> Vue d'ensemble du réseau
                    </h3>
                    <div style="color: #e0e0e0; line-height: 1.8; font-size: 1.1rem;">
                        <p style="margin-bottom: 1.5rem;">
                            Notre analyse porte sur <strong style="color: #d4af37;">${totalCinemas} établissements cinématographiques</strong> 
                            répartis dans la région Île-de-France. Ces cinémas totalisent <strong style="color: #d4af37;">${totalScreens} salles de projection</strong> 
                            et ont collecté plus de <strong style="color: #d4af37;">${totalReviews} avis clients</strong>.
                        </p>
                        <p style="margin-bottom: 1.5rem;">
                            Avec une note moyenne de <strong style="color: #d4af37;">${avgRating}/5 étoiles</strong>, 
                            la qualité de l'expérience cinématographique en Île-de-France témoigne d'un niveau de service élevé. 
                            Le prix moyen d'une place s'établit à <strong style="color: #d4af37;">${avgPrice}€</strong>.
                        </p>
                    </div>
                </article>

                <!-- Article 2: Répartition géographique -->
                <article class="stat-article" style="
                    background: rgba(0, 0, 0, 0.4);
                    border-left: 4px solid #4a9eff;
                    border-radius: 8px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                ">
                    <h3 style="color: #4a9eff; font-size: 1.5rem; margin-bottom: 1rem;">
                        <i class="fas fa-map-marked-alt"></i> Répartition géographique et accessibilité
                    </h3>
                    <div style="color: #e0e0e0; line-height: 1.8; font-size: 1.1rem;">
                        <p style="margin-bottom: 1.5rem;">
                            <strong style="color: #4a9eff;">Paris (75)</strong> concentre la majorité de l'offre cinématographique avec 
                            <strong>${deptCount['75'] || 0} cinémas</strong> (${((deptCount['75'] || 0) / totalCinemas * 100).toFixed(1)}% du total). 
                            Les <strong style="color: #4a9eff;">Hauts-de-Seine (92)</strong> arrivent en seconde position avec 
                            <strong>${deptCount['92'] || 0} établissements</strong>.
                        </p>
                        <p style="margin-bottom: 1.5rem;">
                            En termes d'accessibilité, <strong style="color: #4a9eff;">${accessibleCinemas} cinémas</strong> 
                            (${(accessibleCinemas/totalCinemas*100).toFixed(1)}%) sont équipés pour l'accueil des personnes à mobilité réduite. 
                            Par ailleurs, <strong style="color: #4a9eff;">${parkingCount} établissements</strong> 
                            (${(parkingCount/totalCinemas*100).toFixed(1)}%) disposent d'un parking, facilitant l'accès en voiture.
                        </p>
                    </div>
                </article>

                <!-- Article 3: Diversité culturelle -->
                <article class="stat-article" style="
                    background: rgba(0, 0, 0, 0.4);
                    border-left: 4px solid #ff6b6b;
                    border-radius: 8px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                ">
                    <h3 style="color: #ff6b6b; font-size: 1.5rem; margin-bottom: 1rem;">
                        <i class="fas fa-theater-masks"></i> Diversité de l'offre cinématographique
                    </h3>
                    <div style="color: #e0e0e0; line-height: 1.8; font-size: 1.1rem;">
                        <p style="margin-bottom: 1.5rem;">
                            L'offre cinématographique francilienne se distingue par sa richesse avec 
                            <strong style="color: #ff6b6b;">${Object.keys(genreCount).length} genres</strong> différents proposés. 
                            Cette diversité reflète la volonté des exploitants de satisfaire tous les publics, 
                            des blockbusters grand public aux films d'auteur.
                        </p>
                        <p style="margin-bottom: 1.5rem;">
                            Les genres les plus représentés incluent l'<strong style="color: #ff6b6b;">Action</strong>, 
                            la <strong style="color: #ff6b6b;">Comédie</strong>, le <strong style="color: #ff6b6b;">Drame</strong> 
                            et l'<strong style="color: #ff6b6b;">Animation</strong>, garantissant une programmation 
                            équilibrée entre divertissement populaire et proposition culturelle exigeante.
                        </p>
                    </div>
                </article>

                <!-- Article 4: Innovation technologique -->
                <article class="stat-article" style="
                    background: rgba(0, 0, 0, 0.4);
                    border-left: 4px solid #9c27b0;
                    border-radius: 8px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                ">
                    <h3 style="color: #9c27b0; font-size: 1.5rem; margin-bottom: 1rem;">
                        <i class="fas fa-cogs"></i> Technologies et services premium
                    </h3>
                    <div style="color: #e0e0e0; line-height: 1.8; font-size: 1.1rem;">
                        <p style="margin-bottom: 1.5rem;">
                            L'innovation technologique est au cœur de l'expérience cinématographique francilienne. 
                            De nombreux établissements proposent des <strong style="color: #9c27b0;">salles IMAX</strong>, 
                            de la <strong style="color: #9c27b0;">3D</strong>, et des systèmes audio 
                            <strong style="color: #9c27b0;">Dolby Atmos</strong> pour une immersion maximale.
                        </p>
                        <p style="margin-bottom: 1.5rem;">
                            Certains cinémas se démarquent également par leurs <strong style="color: #9c27b0;">espaces VIP</strong>, 
                            leurs <strong style="color: #9c27b0;">bars et restaurants</strong> intégrés, 
                            transformant la sortie cinéma en véritable expérience de loisir complète.
                        </p>
                    </div>
                </article>

                <!-- Article 5: Analyse tarifaire -->
                <article class="stat-article" style="
                    background: rgba(0, 0, 0, 0.4);
                    border-left: 4px solid #ff9800;
                    border-radius: 8px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                ">
                    <h3 style="color: #ff9800; font-size: 1.5rem; margin-bottom: 1rem;">
                        <i class="fas fa-euro-sign"></i> Politique tarifaire et accessibilité économique
                    </h3>
                    <div style="color: #e0e0e0; line-height: 1.8; font-size: 1.1rem;">
                        <p style="margin-bottom: 1.5rem;">
                            L'analyse tarifaire révèle une offre diversifiée avec <strong style="color: #ff9800;">${cheapCinemas} cinémas</strong> 
                            proposant des tarifs inférieurs à 10€, garantissant l'accessibilité du 7ème art au plus grand nombre. 
                            À l'opposé, <strong style="color: #ff9800;">${expensiveCinemas} établissements premium</strong> 
                            pratiquent des tarifs supérieurs à 15€, proposant une expérience haut de gamme.
                        </p>
                        <p style="margin-bottom: 1.5rem;">
                            Cette segmentation tarifaire permet à chaque spectateur de trouver l'offre correspondant 
                            à ses attentes et à son budget, contribuant à la démocratisation culturelle 
                            dans la région Île-de-France.
                        </p>
                    </div>
                </article>

                <!-- Top cinémas -->
                <article class="stat-article" style="
                    background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(0, 0, 0, 0.4));
                    border: 1px solid rgba(212, 175, 55, 0.3);
                    border-radius: 12px;
                    padding: 2rem;
                ">
                    <h3 style="color: #d4af37; font-size: 1.5rem; margin-bottom: 1.5rem; text-align: center;">
                        <i class="fas fa-trophy"></i> Les cinémas d'excellence - Top 5
                    </h3>
                    <div style="color: #e0e0e0; line-height: 1.6; margin-bottom: 1.5rem;">
                        <p style="text-align: center; font-size: 1.1rem;">
                            Ces établissements se distinguent par leur qualité de service exceptionnelle 
                            et la satisfaction de leur clientèle :
                        </p>
                    </div>
                    <div class="top-cinemas-articles">
                        ${topCinemas.map((cinema, index) => `
                            <div style="
                                background: rgba(0, 0, 0, 0.3);
                                border-radius: 8px;
                                padding: 1.5rem;
                                margin-bottom: 1rem;
                                border-left: 3px solid #d4af37;
                            ">
                                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                    <span style="
                                        background: #d4af37;
                                        color: #000;
                                        width: 35px;
                                        height: 35px;
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-weight: bold;
                                        font-size: 1.2rem;
                                    ">${index + 1}</span>
                                    <h4 style="color: #d4af37; font-size: 1.3rem; margin: 0;">${cinema.nom}</h4>
                                    <div style="margin-left: auto;">
                                        <span style="
                                            background: rgba(212, 175, 55, 0.2);
                                            color: #d4af37;
                                            padding: 0.5rem 1rem;
                                            border-radius: 20px;
                                            font-weight: bold;
                                        ">⭐ ${cinema.note}/5</span>
                                    </div>
                                </div>
                                <p style="color: #ccc; margin-bottom: 0.5rem; line-height: 1.6;">
                                    <strong>${cinema.adresse}</strong>
                                </p>
                                <p style="color: #aaa; font-size: 0.95rem; margin: 0;">
                                    💬 ${cinema.avis_count || 0} avis clients • 
                                    ${cinema.salles || 'N/A'} salles • 
                                    💰 ${cinema.prix_moyen || 'N/A'}€
                                </p>
                            </div>
                        `).join('')}
                    </div>
                </article>

            </div>
        `;
        
        console.log('✅ Statistiques articles affichées');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cinemaApp = new CinemaApp();
});