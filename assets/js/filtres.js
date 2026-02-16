// ================================================
// FILTRES ET AFFICHAGE LISTE - CinéMap IDF
// ================================================
// Gestion des filtres et de l'affichage en mode liste des cinémas

Object.assign(CinemaApp.prototype, {
    renderCinemasList() {
        const container = document.getElementById('cinemas-grid');
        
        if (!container) return;

        // Show loading skeleton
        this.showLoadingSkeleton(container);

        // Clear container after short delay to show loading effect
        setTimeout(() => {
            container.innerHTML = '';

            if (this.filteredCinemas.length === 0) {
                this.showEmptyState(container);
                return;
            }

            // Sort cinemas by rating (highest first)
            const sortedCinemas = [...this.filteredCinemas].sort((a, b) => b.note - a.note);

            sortedCinemas.forEach((cinema, index) => {
                const card = this.createCinemaCard(cinema, index);
                container.appendChild(card);
            });

            // Animate cards
            this.animateCinemaCards();
        }, 300);
    },

    createCinemaCard(cinema, index) {
        const card = document.createElement('div');
        card.className = `cinema-card rounded-xl p-6 cursor-pointer transform transition-all duration-300 opacity-0 animate-delay-${Math.min(index, 5) * 100}`;
        card.style.animationDelay = `${index * 0.1}s`;

        // Calculate distance if user location is available
        let distanceText = '';
        if (this.userLocation) {
            const distance = this.calculateDistance(
                this.userLocation.lat, 
                this.userLocation.lng,
                cinema.latitude, 
                cinema.longitude
            );
            distanceText = `<div class="text-sm text-cinema-accent font-medium">
                <i class="fas fa-route mr-1"></i>${distance.toFixed(1)} km
            </div>`;
        }

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-white mb-2 group-hover:text-cinema-accent transition-colors">
                        ${cinema.nom}
                    </h3>
                    <p class="text-gray-400 text-sm flex items-center mb-2">
                        <i class="fas fa-map-marker-alt mr-2 text-cinema-accent"></i>
                        ${cinema.adresse}
                    </p>
                    <div class="flex items-center space-x-4 mb-3">
                        <div class="flex items-center">
                            <div class="rating-stars mr-2">
                                ${this.generateStars(cinema.note)}
                            </div>
                            <span class="text-sm text-gray-300">${cinema.note}/5</span>
                        </div>
                        <span class="text-xs text-gray-500">(${cinema.avis_count} avis)</span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-cinema-accent mb-1">
                        ${cinema.prix_moyen.toFixed(2)}€
                    </div>
                    ${distanceText}
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div class="flex items-center">
                    <i class="fas fa-film mr-2 text-cinema-accent"></i>
                    <span class="text-gray-300">${cinema.salles} salle${cinema.salles > 1 ? 's' : ''}</span>
                </div>
                <div class="flex items-center">
                    <i class="fas fa-wheelchair mr-2 ${cinema.accessibilite ? 'text-green-400' : 'text-red-400'}"></i>
                    <span class="text-gray-300">${cinema.accessibilite ? 'Accessible' : 'Non accessible'}</span>
                </div>
                <div class="flex items-center">
                    <i class="fas fa-parking mr-2 ${cinema.parking ? 'text-green-400' : 'text-red-400'}"></i>
                    <span class="text-gray-300">${cinema.parking ? 'Parking' : 'Pas de parking'}</span>
                </div>
                <div class="flex items-center">
                    <i class="fas fa-phone mr-2 text-cinema-accent"></i>
                    <span class="text-gray-300 truncate">${cinema.telephone}</span>
                </div>
            </div>

            <!-- Genres -->
            <div class="mb-4">
                <h4 class="text-sm font-semibold text-cinema-accent mb-2">Genres de films:</h4>
                <div class="flex flex-wrap gap-1">
                    ${cinema.types_films.slice(0, 4).map(genre => `
                        <span class="genre-tag">${genre}</span>
                    `).join('')}
                    ${cinema.types_films.length > 4 ? `
                        <span class="text-xs text-gray-400 px-2 py-1">
                            +${cinema.types_films.length - 4} autres
                        </span>
                    ` : ''}
                </div>
            </div>

            <!-- Services -->
            <div class="mb-4">
                <h4 class="text-sm font-semibold text-cinema-accent mb-2">Services:</h4>
                <div class="flex flex-wrap gap-1">
                    ${cinema.services.slice(0, 3).map(service => `
                        <span class="bg-cinema-red bg-opacity-20 text-cinema-red px-2 py-1 rounded-full text-xs border border-cinema-red border-opacity-30">
                            ${service}
                        </span>
                    `).join('')}
                    ${cinema.services.length > 3 ? `
                        <span class="text-xs text-gray-400 px-2 py-1">
                            +${cinema.services.length - 3}
                        </span>
                    ` : ''}
                </div>
            </div>

            <!-- Horaires today -->
            <div class="mb-4 p-3 bg-cinema-dark rounded-lg border border-cinema-light">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-cinema-accent">
                        <i class="fas fa-clock mr-2"></i>Aujourd'hui:
                    </span>
                    <span class="text-sm text-white font-medium">
                        ${this.getTodayHours(cinema.horaires)}
                    </span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex space-x-3">
                <button onclick="cinemaApp.showCinemaDetails(${cinema.id})" 
                        class="flex-1 bg-cinema-accent text-cinema-dark py-2 px-4 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
                    <i class="fas fa-info-circle mr-2"></i>Détails
                </button>
                <button onclick="cinemaApp.showOnMap(${cinema.id})" 
                        class="flex-1 bg-cinema-light border border-cinema-accent text-cinema-accent py-2 px-4 rounded-lg font-semibold hover:bg-cinema-accent hover:text-cinema-dark transition-colors">
                    <i class="fas fa-map-marked-alt mr-2"></i>Carte
                </button>
                <a href="${cinema.site_web}" target="_blank" 
                   class="bg-cinema-blue text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center">
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('button') && !e.target.closest('a')) {
                this.showCinemaDetails(cinema.id);
            }
        });

        return card;
    },

    getTodayHours(horaires) {
        const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const today = days[new Date().getDay()];
        return horaires[today] || 'Horaires non disponibles';
    },

    animateCinemaCards() {
        const cards = document.querySelectorAll('.cinema-card');
        cards.forEach(card => {
            card.classList.remove('opacity-0');
            card.classList.add('fadeInUp');
        });
    },

    showLoadingSkeleton(container) {
        const skeletonCards = Array.from({ length: 6 }, (_, index) => `
            <div class="cinema-card rounded-xl p-6 animate-pulse loading-skeleton">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="h-6 bg-gray-600 rounded mb-2 w-3/4"></div>
                        <div class="h-4 bg-gray-600 rounded mb-2 w-full"></div>
                        <div class="h-4 bg-gray-600 rounded mb-3 w-1/2"></div>
                    </div>
                    <div class="w-16 h-8 bg-gray-600 rounded"></div>
                </div>
                <div class="grid grid-cols-4 gap-4 mb-4">
                    <div class="h-4 bg-gray-600 rounded"></div>
                    <div class="h-4 bg-gray-600 rounded"></div>
                    <div class="h-4 bg-gray-600 rounded"></div>
                    <div class="h-4 bg-gray-600 rounded"></div>
                </div>
                <div class="mb-4">
                    <div class="h-4 bg-gray-600 rounded mb-2 w-1/4"></div>
                    <div class="flex flex-wrap gap-1">
                        <div class="h-6 bg-gray-600 rounded-full w-16"></div>
                        <div class="h-6 bg-gray-600 rounded-full w-20"></div>
                        <div class="h-6 bg-gray-600 rounded-full w-14"></div>
                    </div>
                </div>
                <div class="flex space-x-3">
                    <div class="flex-1 h-10 bg-gray-600 rounded"></div>
                    <div class="flex-1 h-10 bg-gray-600 rounded"></div>
                    <div class="w-12 h-10 bg-gray-600 rounded"></div>
                </div>
            </div>
        `).join('');

        container.innerHTML = skeletonCards;
    },

    showEmptyState(container) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div class="bg-cinema-light rounded-full p-8 mb-6">
                    <i class="fas fa-search text-4xl text-gray-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-white mb-2">Aucun cinéma trouvé</h3>
                <p class="text-gray-400 mb-6 max-w-md">
                    Aucun cinéma ne correspond à vos critères de recherche. 
                    Essayez de modifier vos filtres ou votre recherche.
                </p>
                <button onclick="cinemaApp.clearAllFilters()" 
                        class="bg-cinema-accent text-cinema-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
                    <i class="fas fa-eraser mr-2"></i>Réinitialiser les filtres
                </button>
            </div>
        `;
    }
});