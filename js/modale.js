// ================================================
//  GESTIONNAIRE DE MODALES - CinéMap IDF
// ================================================
// Gestion des fenêtres modales pour les détails des cinémas
Object.assign(CinemaApp.prototype, {
    
    // Affichage détaillé d'un cinéma dans une modale
    showCinemaDetailsEnhanced(cinemaId) {
        const cinema = this.cinemas.find(c => c.id === cinemaId);
        if (!cinema) return;

        // Calculate additional information
        const distance = this.userLocation ? 
            this.calculateDistance(this.userLocation.lat, this.userLocation.lng, cinema.latitude, cinema.longitude) : null;
        
        const similarCinemas = this.findSimilarCinemas(cinema, 3);
        const todayHours = this.getTodayHours(cinema.horaires);
        const isOpenNow = this.isOpenNow(cinema.horaires);

        const modalContent = `
            <div class="relative bg-cinema-dark">
                <!-- Hero Section with Background -->
                <div class="relative h-32 bg-gradient-to-r from-cinema-red via-cinema-accent to-cinema-blue opacity-20">
                    <div class="absolute inset-0 bg-cinema-dark bg-opacity-50"></div>
                </div>
                
                <div class="relative -mt-16 p-6">
                    <!-- Header -->
                    <div class="flex justify-between items-start mb-6">
                        <div class="flex items-center space-x-4">
                            <div class="bg-cinema-accent p-4 rounded-xl">
                                <i class="fas fa-film text-2xl text-cinema-dark"></i>
                            </div>
                            <div>
                                <h2 class="text-3xl font-bold text-white mb-1">${cinema.nom}</h2>
                                <p class="text-gray-400 flex items-center">
                                    <i class="fas fa-map-marker-alt mr-2"></i>${cinema.adresse}
                                    ${distance ? `<span class="ml-4 text-cinema-accent"><i class="fas fa-route mr-1"></i>${distance.toFixed(1)} km</span>` : ''}
                                </p>
                            </div>
                        </div>
                        <button onclick="cinemaApp.closeModal()" class="text-gray-400 hover:text-white text-2xl transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Status Bar -->
                    <div class="bg-cinema-light rounded-lg p-4 mb-6 flex items-center justify-between">
                        <div class="flex items-center space-x-6">
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded-full ${isOpenNow ? 'bg-green-400' : 'bg-red-400'} mr-2"></div>
                                <span class="text-sm font-medium ${isOpenNow ? 'text-green-400' : 'text-red-400'}">
                                    ${isOpenNow ? 'Ouvert' : 'Fermé'}
                                </span>
                            </div>
                            <div class="text-sm text-gray-300">
                                <i class="fas fa-clock mr-1"></i>Aujourd'hui: ${todayHours}
                            </div>
                        </div>
                        <div class="flex items-center">
                            <div class="rating-stars mr-2">${this.generateStars(cinema.note)}</div>
                            <span class="text-white font-medium">${cinema.note}/5</span>
                            <span class="text-sm text-gray-400 ml-2">(${cinema.avis_count} avis)</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Main Info Column -->
                        <div class="lg:col-span-2 space-y-6">
                            
                            <!-- Quick Stats -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div class="bg-cinema-light rounded-lg p-4 text-center">
                                    <i class="fas fa-tv text-cinema-accent text-xl mb-2 block"></i>
                                    <div class="text-lg font-bold text-white">${cinema.salles}</div>
                                    <div class="text-xs text-gray-400">Salles</div>
                                </div>
                                <div class="bg-cinema-light rounded-lg p-4 text-center">
                                    <i class="fas fa-euro-sign text-cinema-accent text-xl mb-2 block"></i>
                                    <div class="text-lg font-bold text-white">${cinema.prix_moyen.toFixed(2)}€</div>
                                    <div class="text-xs text-gray-400">Prix moyen</div>
                                </div>
                                <div class="bg-cinema-light rounded-lg p-4 text-center">
                                    <i class="fas fa-wheelchair text-${cinema.accessibilite ? 'green' : 'red'}-400 text-xl mb-2 block"></i>
                                    <div class="text-lg font-bold text-white">${cinema.accessibilite ? 'Oui' : 'Non'}</div>
                                    <div class="text-xs text-gray-400">Accessible</div>
                                </div>
                                <div class="bg-cinema-light rounded-lg p-4 text-center">
                                    <i class="fas fa-parking text-${cinema.parking ? 'green' : 'red'}-400 text-xl mb-2 block"></i>
                                    <div class="text-lg font-bold text-white">${cinema.parking ? 'Oui' : 'Non'}</div>
                                    <div class="text-xs text-gray-400">Parking</div>
                                </div>
                            </div>

                            <!-- Genres Section -->
                            <div class="bg-cinema-light rounded-lg p-4">
                                <h3 class="text-lg font-semibold text-cinema-accent mb-3 flex items-center">
                                    <i class="fas fa-masks-theater mr-2"></i>Genres de films
                                </h3>
                                <div class="flex flex-wrap gap-2">
                                    ${cinema.types_films.map(genre => `
                                        <span class="genre-tag cursor-pointer hover:bg-cinema-accent hover:text-cinema-dark transition-colors"
                                              onclick="cinemaApp.filterByGenre('${genre}')">${genre}</span>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Services Section -->
                            <div class="bg-cinema-light rounded-lg p-4">
                                <h3 class="text-lg font-semibold text-cinema-accent mb-3 flex items-center">
                                    <i class="fas fa-cogs mr-2"></i>Services et équipements
                                </h3>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    ${cinema.services.map(service => `
                                        <div class="flex items-center space-x-2 p-2 bg-cinema-medium rounded">
                                            <i class="fas fa-check text-green-400"></i>
                                            <span class="text-sm text-white">${service}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                        </div>

                        <!-- Sidebar Column -->
                        <div class="space-y-6">
                            
                            <!-- Contact Info -->
                            <div class="bg-cinema-light rounded-lg p-4">
                                <h3 class="text-lg font-semibold text-cinema-accent mb-3 flex items-center">
                                    <i class="fas fa-address-card mr-2"></i>Contact
                                </h3>
                                <div class="space-y-3">
                                    <div class="flex items-center">
                                        <i class="fas fa-phone text-cinema-accent w-5 mr-3"></i>
                                        <a href="tel:${cinema.telephone}" class="text-white hover:text-cinema-accent transition-colors">
                                            ${cinema.telephone}
                                        </a>
                                    </div>
                                    <div class="flex items-center">
                                        <i class="fas fa-globe text-cinema-accent w-5 mr-3"></i>
                                        <a href="${cinema.site_web}" target="_blank" 
                                           class="text-white hover:text-cinema-accent transition-colors truncate">
                                            Site officiel
                                        </a>
                                    </div>
                                    <div class="flex items-start">
                                        <i class="fas fa-map-marker-alt text-cinema-accent w-5 mr-3 mt-1"></i>
                                        <div class="text-white text-sm leading-relaxed">${cinema.adresse}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Schedule -->
                            <div class="bg-cinema-light rounded-lg p-4">
                                <h3 class="text-lg font-semibold text-cinema-accent mb-3 flex items-center">
                                    <i class="fas fa-clock mr-2"></i>Horaires
                                </h3>
                                <div class="space-y-2">
                                    ${Object.entries(cinema.horaires).map(([jour, horaire]) => `
                                        <div class="flex justify-between text-sm ${this.isToday(jour) ? 'bg-cinema-accent bg-opacity-20 px-2 py-1 rounded' : ''}">
                                            <span class="text-gray-300 capitalize font-medium">${jour}:</span>
                                            <span class="text-white">${horaire}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Similar Cinemas -->
                            ${similarCinemas.length > 0 ? `
                            <div class="bg-cinema-light rounded-lg p-4">
                                <h3 class="text-lg font-semibold text-cinema-accent mb-3 flex items-center">
                                    <i class="fas fa-thumbs-up mr-2"></i>Cinémas similaires
                                </h3>
                                <div class="space-y-2">
                                    ${similarCinemas.map(similar => `
                                        <div class="flex justify-between items-center p-2 bg-cinema-medium rounded cursor-pointer hover:bg-cinema-dark transition-colors"
                                             onclick="cinemaApp.showCinemaDetails(${similar.id})">
                                            <div>
                                                <div class="text-sm font-medium text-white truncate">${similar.nom}</div>
                                                <div class="text-xs text-gray-400">${similar.ville}</div>
                                            </div>
                                            <div class="flex items-center">
                                                <div class="rating-stars text-xs mr-1">${this.generateStars(similar.note)}</div>
                                                <span class="text-xs text-white">${similar.note}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}

                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="mt-8 flex flex-col sm:flex-row gap-3">
                        <button onclick="cinemaApp.showOnMap(${cinema.id})" 
                                class="flex-1 bg-cinema-accent text-cinema-dark py-3 px-6 rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center justify-center">
                            <i class="fas fa-map-marked-alt mr-2"></i>Voir sur la carte
                        </button>
                        ${this.userLocation ? `
                        <button onclick="cinemaApp.getDirections(${cinema.latitude}, ${cinema.longitude})" 
                                class="flex-1 bg-cinema-blue text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center">
                            <i class="fas fa-route mr-2"></i>Itinéraire
                        </button>
                        ` : ''}
                        <button onclick="cinemaApp.shareCinema(${cinema.id})" 
                                class="bg-cinema-light text-cinema-accent py-3 px-6 rounded-lg font-semibold hover:bg-cinema-accent hover:text-cinema-dark transition-colors flex items-center justify-center">
                            <i class="fas fa-share-alt mr-2"></i>Partager
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-content').innerHTML = modalContent;
        document.getElementById('cinema-modal').classList.remove('hidden');
        document.getElementById('modal-content').parentElement.classList.add('modal-enter');
    },

    // Helper methods for modal functionality
    isOpenNow(horaires) {
        const now = new Date();
        const currentDay = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const todayHours = horaires[currentDay];
        if (!todayHours || todayHours === 'Fermé') return false;
        
        const [openTime, closeTime] = todayHours.split('-');
        if (!openTime || !closeTime) return false;
        
        const openMinutes = this.timeToMinutes(openTime.trim());
        const closeMinutes = this.timeToMinutes(closeTime.trim());
        
        // Handle overnight hours (e.g., 10:00-02:00)
        if (closeMinutes < openMinutes) {
            return currentTime >= openMinutes || currentTime <= closeMinutes;
        }
        
        return currentTime >= openMinutes && currentTime <= closeMinutes;
    },

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    },

    isToday(day) {
        const today = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][new Date().getDay()];
        return day === today;
    },

    findSimilarCinemas(cinema, limit = 3) {
        return this.cinemas
            .filter(c => c.id !== cinema.id)
            .map(c => ({
                ...c,
                similarity: this.calculateSimilarity(cinema, c)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    },

    calculateSimilarity(cinema1, cinema2) {
        let score = 0;
        
        // Same department
        if (cinema1.departement === cinema2.departement) score += 3;
        
        // Similar rating
        const ratingDiff = Math.abs(cinema1.note - cinema2.note);
        score += Math.max(0, 2 - ratingDiff);
        
        // Similar price
        const priceDiff = Math.abs(cinema1.prix_moyen - cinema2.prix_moyen);
        score += Math.max(0, 2 - priceDiff / 2);
        
        // Common genres
        const commonGenres = cinema1.types_films.filter(genre => 
            cinema2.types_films.includes(genre)
        ).length;
        score += commonGenres * 0.5;
        
        // Common services
        const commonServices = cinema1.services.filter(service => 
            cinema2.services.includes(service)
        ).length;
        score += commonServices * 0.3;
        
        return score;
    },

    filterByGenre(genre) {
        this.closeModal();
        document.getElementById('genre-filter').value = genre;
        this.applyFilters();
        this.switchView('map');
    },

    getDirections(lat, lng) {
        if (!this.userLocation) {
            this.showError('Position utilisateur non disponible');
            return;
        }
        
        const url = `https://www.google.com/maps/dir/${this.userLocation.lat},${this.userLocation.lng}/${lat},${lng}`;
        window.open(url, '_blank');
    },

    shareCinema(cinemaId) {
        const cinema = this.cinemas.find(c => c.id === cinemaId);
        if (!cinema) return;

        const shareData = {
            title: `${cinema.nom} - CinéMap IDF`,
            text: `Découvrez ${cinema.nom} à ${cinema.ville} - Note: ${cinema.note}/5 ⭐`,
            url: window.location.href + `?cinema=${cinemaId}`
        };

        if (navigator.share && navigator.canShare(shareData)) {
            navigator.share(shareData)
                .then(() => this.showSuccess('Partagé avec succès !'))
                .catch((error) => console.log('Erreur lors du partage:', error));
        } else {
            // Fallback: copy to clipboard
            const textToShare = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
            navigator.clipboard.writeText(textToShare)
                .then(() => this.showSuccess('Lien copié dans le presse-papier !'))
                .catch(() => this.showError('Impossible de copier le lien'));
        }
    },

    // Override the original method to use the enhanced version
    showCinemaDetails(cinemaId) {
        this.showCinemaDetailsEnhanced(cinemaId);
    }
});