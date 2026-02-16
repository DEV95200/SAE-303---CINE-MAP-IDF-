// ================================================
// GESTIONNAIRE DE CARTE - CinéMap IDF
// ================================================
// Gestion de la carte interactive Leaflet avec géolocalisation
// et affichage des cinémas d'Île-de-France

class GestionnaireCartes {
    constructor(app) {
        // Références et état de l'application
        this.app = app;
        this.carte = null;
        this.marqueurs = [];
        this.groupeMarqueurs = null;
        this.marqueurUtilisateur = null;
        this.cercleRayon = null;
        this.groupeProximite = null;
        this.groupeItineraire = null;
        
        // Configuration des styles de carte
        this.stylesCartes = {
            osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        };
        
        this.styleActuel = 'osm';
        this.coucheActuelle = null;
    }

    // ================================================
    //  INITIALISATION DE LA CARTE
    // ================================================
    initialiser() {
        console.log('Initialisation du gestionnaire de cartes...');
        
        // Créer la carte centrée sur l'Île-de-France
        this.carte = L.map('map', {
            zoomControl: false
        }).setView([48.8566, 2.3522], 10);

        // Ajouter les contrôles de zoom personnalisés
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.carte);

        // Définir le style initial de la carte
        this.definirStyleCarte('osm');

        // Initialiser le groupe de marqueurs avec clustering
        this.groupeMarqueurs = L.markerClusterGroup({
            chunkedLoading: true,
            spiderfyOnMaxZoom: false,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            maxClusterRadius: 80,
            iconCreateFunction: (cluster) => this.creerIconeCluster(cluster)
        });

        this.carte.addLayer(this.groupeMarqueurs);

        // Configurer le sélecteur de style de carte
        const selecteurStyle = document.getElementById('map-style-select');
        if (selecteurStyle) {
            selecteurStyle.addEventListener('change', (e) => {
                this.definirStyleCarte(e.target.value);
            });
        }

        // Stocker les références dans l'app principale
        this.app.map = this.carte;
        this.app.markerClusterGroup = this.groupeMarqueurs;

        // Ajouter les styles CSS personnalisés
        this.ajouterStylesMarqueurs();

        // Exposer globalement
        window.gestionnaireCartes = this;

        console.log('✅ Gestionnaire de cartes initialisé avec succès');
    }

    // ================================================
    // GESTION DES STYLES DE CARTE
    // ================================================
    definirStyleCarte(style) {
        if (this.coucheActuelle) {
            this.carte.removeLayer(this.coucheActuelle);
        }

        const urlTuiles = this.stylesCartes[style] || this.stylesCartes.osm;
        
        this.coucheActuelle = L.tileLayer(urlTuiles, {
            attribution: this.obtenirAttribution(style),
            maxZoom: 18,
            id: `mapbox/${style}`
        });

        this.coucheActuelle.addTo(this.carte);
        this.styleActuel = style;
    }

    // Attribution des sources pour chaque style de carte
    obtenirAttribution(style) {
        const attributions = {
            osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            dark: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        };
        return attributions[style] || attributions.osm;
    }

    // ================================================
    // GESTION DE LA POSITION ET NAVIGATION
    // ================================================
    centrerSurPosition(lat, lng, zoom = 13) {
        if (this.carte) {
            this.carte.setView([lat, lng], zoom);
            console.log(`Carte centrée sur: ${lat}, ${lng}`);
        } else {
            console.error('Carte non initialisée');
        }
    }

    // Ajouter un marqueur pour la position utilisateur
    ajouterMarqueurUtilisateur(lat, lng) {
        if (this.marqueurUtilisateur) {
            this.carte.removeLayer(this.marqueurUtilisateur);
        }

        const iconeUtilisateur = L.divIcon({
            className: 'marqueur-utilisateur',
            html: `
                <div class="marqueur-user">
                    <div class="marqueur-user-interne">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="marqueur-user-pulse"></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        this.marqueurUtilisateur = L.marker([lat, lng], { icon: iconeUtilisateur })
            .addTo(this.carte)
            .bindPopup(`
                <div class="contenu-popup-user">
                    <div class="titre-popup">
                        <i class="fas fa-map-marker-alt"></i>
                        Votre position
                    </div>
                    <p class="coordonnees">
                        ${lat.toFixed(4)}, ${lng.toFixed(4)}
                    </p>
                </div>
            `);
            
        console.log(`Marqueur utilisateur ajouté: ${lat}, ${lng}`);
    }

    // Mettre à jour la position utilisateur
    mettreAJourPositionUtilisateur(lat, lng) {
        if (this.marqueurUtilisateur) {
            this.marqueurUtilisateur.setLatLng([lat, lng]);
        } else {
            this.ajouterMarqueurUtilisateur(lat, lng);
        }
    }

    // ================================================
    //  GESTION DES MARQUEURS DE CINÉMAS
    // ================================================
    creerIconeCinema(cinema) {
        // Définir la couleur en fonction de la note
        let couleurIcone = '#d4af37'; // Or par défaut

        if (cinema.note >= 4.5) {
            couleurIcone = '#ffd700'; // Or brillant
        } else if (cinema.note >= 4.0) {
            couleurIcone = '#d4af37'; // Or standard
        } else if (cinema.note >= 3.5) {
            couleurIcone = '#ff8c00'; // Orange
        } else {
            couleurIcone = '#ff6b6b'; // Rouge
        }

        return L.divIcon({
            className: 'marqueur-cinema-personnalise',
            html: `
                <div class="conteneur-marqueur-cinema">
                    <div class="marqueur-cinema" style="background-color: ${couleurIcone}">
                        <i class="fas fa-film"></i>
                    </div>
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
    }

    // Créer le contenu de la popup pour un cinéma
    creerContenuPopup(cinema) {
        return `
            <div class="popup-cinema">
                <div class="en-tete-popup-cinema">${cinema.nom}</div>
                <div class="info-popup-cinema">
                    <div class="mb-2">
                        <i class="fas fa-map-marker-alt mr-2"></i>${cinema.ville}
                    </div>
                    <div class="mb-2">
                        <i class="fas fa-film mr-2"></i>${cinema.salles || 3} salle${cinema.salles > 1 ? 's' : ''}
                    </div>
                    <div class="note-popup-cinema mb-3">
                        <div class="flex items-center">
                            <div class="etoiles-note mr-2">
                                ${this.app.generateStars(cinema.note)}
                            </div>
                            <span>${cinema.note || '4.5'}/5 (${cinema.avis_count || '234'} avis)</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong class="text-cinema-accent">${(cinema.prix_moyen || 9.5).toFixed(2)}€</strong> prix moyen
                    </div>
                    <div class="text-center mt-3">
                        <button onclick="cinemaApp.showCinemaDetails(${cinema.id})" 
                                class="bouton-details">
                            <i class="fas fa-info-circle mr-1"></i>Voir détails
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Créer l'icône de cluster pour regrouper plusieurs marqueurs
    creerIconeCluster(cluster) {
        const nombreEnfants = cluster.getChildCount();
        let classeCSS = ' marker-cluster-';

        if (nombreEnfants < 10) {
            classeCSS += 'small';
        } else if (nombreEnfants < 100) {
            classeCSS += 'medium';
        } else {
            classeCSS += 'large';
        }

        return new L.DivIcon({
            html: '<div><span>' + nombreEnfants + '</span></div>',
            className: 'marker-cluster' + classeCSS,
            iconSize: new L.Point(40, 40)
        });
    }

    // Mettre à jour les marqueurs sur la carte
    mettreAJourMarqueurs(cinemas) {
        // Vider les marqueurs existants
        this.groupeMarqueurs.clearLayers();
        this.marqueurs = [];

        if (!cinemas || cinemas.length === 0) {
            return;
        }

        // Ajouter les marqueurs pour les cinémas filtrés
        cinemas.forEach(cinema => {
            const marqueur = L.marker([cinema.latitude, cinema.longitude], {
                icon: this.creerIconeCinema(cinema)
            });

            marqueur.donneesCinema = cinema;

            const contenuPopup = this.creerContenuPopup(cinema);
            marqueur.bindPopup(contenuPopup, {
                maxWidth: 300,
                className: 'popup-personnalisee'
            });

            // Ajouter animation au clic
            marqueur.on('click', function(e) {
                this.bounce();
            });

            this.marqueurs.push(marqueur);
            this.groupeMarqueurs.addLayer(marqueur);
        });

        // Ajuster la vue si il y a peu de marqueurs
        if (this.marqueurs.length > 0 && cinemas.length < 50) {
            const groupe = new L.featureGroup(this.marqueurs);
            this.carte.fitBounds(groupe.getBounds().pad(0.1));
        }
    }

    // ================================================
    // FONCTIONNALITÉS DE PROXIMITÉ ET GÉOLOCALISATION
    // ================================================
    afficherCinemasProches(cinemasProches, positionUtilisateur, rayon) {
        console.log(`Affichage de ${cinemasProches.length} cinémas les plus proches`);
        
        try {
            // Nettoyer l'affichage précédent
            this.nettoyerAffichageProximite();

            if (!this.carte) {
                console.error('Carte non initialisée');
                return;
            }

            // Créer le groupe pour les marqueurs de proximité
            this.groupeProximite = L.layerGroup().addTo(this.carte);

            // Ajouter le cercle de rayon de recherche
            this.cercleRayon = L.circle([positionUtilisateur.latitude, positionUtilisateur.longitude], {
                radius: rayon * 1000, // Convertir en mètres
                fillColor: '#d4af37',
                color: '#d4af37',
                weight: 2,
                opacity: 0.6,
                fillOpacity: 0.1
            }).addTo(this.carte);

            // Ajouter les marqueurs pour les cinémas proches
            cinemasProches.forEach((cinema, index) => {
                const rang = index + 1;
                const estOuvert = this.estCinemaOuvert(cinema);
                
                const iconePersonnalisee = L.divIcon({
                    html: `
                        <div class="marqueur-proximite ${estOuvert ? 'ouvert' : 'ferme'}">
                            <span class="rang">${rang}</span>
                            <i class="fas fa-film"></i>
                        </div>
                    `,
                    className: 'marqueur-proximite-personnalise',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                });

                const marqueur = L.marker([cinema.latitude, cinema.longitude], { icon: iconePersonnalisee })
                    .bindPopup(this.creerPopupProximite(cinema, rang))
                    .addTo(this.groupeProximite);

                // Ligne entre utilisateur et cinéma
                const ligne = L.polyline([
                    [positionUtilisateur.latitude, positionUtilisateur.longitude],
                    [cinema.latitude, cinema.longitude]
                ], {
                    color: '#d4af37',
                    weight: 2,
                    opacity: 0.5,
                    dashArray: '5, 10'
                }).addTo(this.groupeProximite);
            });

            // Ajuster la vue pour inclure tous les points
            const limites = L.latLngBounds();
            limites.extend([positionUtilisateur.latitude, positionUtilisateur.longitude]);
            
            cinemasProches.forEach(cinema => {
                limites.extend([cinema.latitude, cinema.longitude]);
            });
            
            if (limites.isValid()) {
                this.carte.fitBounds(limites.pad(0.1));
            }
            
            console.log('✅ Cinémas proches affichés avec succès');
            
        } catch (erreur) {
            console.error('Erreur dans afficherCinemasProches:', erreur);
            throw erreur;
        }
    }

    // Créer la popup pour les cinémas de proximité
    creerPopupProximite(cinema, rang) {
        const estOuvert = this.estCinemaOuvert(cinema);
        const tempsMarche = Math.ceil(cinema.distance / 5 * 60); // 5km/h
        const tempsVoiture = Math.ceil(cinema.distance / 30 * 60); // 30km/h

        return `
            <div class="popup-proximite">
                <div class="en-tete-popup">
                    <div class="badge-rang">#${rang}</div>
                    <h4>${cinema.nom}</h4>
                    <div class="badge-statut ${estOuvert ? 'ouvert' : 'ferme'}">
                        ${estOuvert ? 'Ouvert' : 'Fermé'}
                    </div>
                </div>
                
                <div class="contenu-popup">
                    <div class="info-distance">
                        <div class="distance-principale">
                            <i class="fas fa-route"></i>
                            <span>${cinema.distance.toFixed(1)} km</span>
                        </div>
                        <div class="info-temps">
                            <span><i class="fas fa-walking"></i> ${tempsMarche} min</span>
                            <span><i class="fas fa-car"></i> ${tempsVoiture} min</span>
                        </div>
                    </div>
                    
                    <div class="details-cinema">
                        <p><i class="fas fa-map-marker-alt"></i> ${cinema.adresse}</p>
                        <div class="ligne-details">
                            <span><i class="fas fa-tv"></i> ${cinema.ecrans || cinema.salles || 3} écran${(cinema.ecrans || cinema.salles || 3) > 1 ? 's' : ''}</span>
                            ${cinema.prix_moyen ? `<span><i class="fas fa-euro-sign"></i> ${cinema.prix_moyen.toFixed(2)}€</span>` : ''}
                            ${cinema.note ? `<span><i class="fas fa-star"></i> ${cinema.note}/5</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="actions-popup">
                        <button onclick="window.gestionnaireGeolocalisation.naviguerVers(${cinema.latitude}, ${cinema.longitude}, '${cinema.nom}')" class="bouton-navigation">
                            <i class="fas fa-directions"></i> Itinéraire
                        </button>
                        <button onclick="cinemaApp.showCinemaDetails(${cinema.id})" class="bouton-details-popup">
                            <i class="fas fa-info-circle"></i> Détails
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Vérifier si un cinéma est ouvert
    estCinemaOuvert(cinema) {
        if (!cinema.horaires) return true;

        const maintenant = new Date();
        const jourActuel = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][maintenant.getDay()];
        const heureActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();

        const horairesJour = cinema.horaires[jourActuel];
        if (!horairesJour || horairesJour === 'Fermé') return false;

        const [debut, fin] = horairesJour.split('-');
        if (!debut || !fin) return true;

        const [heureDebut, minDebut] = debut.split(':').map(n => parseInt(n));
        const [heureFin, minFin] = fin.split(':').map(n => parseInt(n));

        const heureDebutMin = heureDebut * 60 + minDebut;
        const heureFinMin = heureFin * 60 + minFin;

        return heureActuelle >= heureDebutMin && heureActuelle <= heureFinMin;
    }

    // Nettoyer l'affichage de proximité
    nettoyerAffichageProximite() {
        if (this.cercleRayon) {
            this.carte.removeLayer(this.cercleRayon);
            this.cercleRayon = null;
        }

        if (this.groupeProximite) {
            this.carte.removeLayer(this.groupeProximite);
            this.groupeProximite = null;
        }
    }

    // ================================================
    // AFFICHAGE D'ITINÉRAIRES
    // ================================================
    afficherItineraireVersDestination(latDepart, lngDepart, latDest, lngDest, nomDestination) {
        console.log(`Affichage de l'itinéraire vers ${nomDestination}`);
        
        // Nettoyer les affichages précédents
        this.nettoyerAffichageProximite();
        
        if (this.groupeItineraire) {
            this.carte.removeLayer(this.groupeItineraire);
        }
        
        this.groupeItineraire = L.layerGroup();
        
        // Marqueur de départ (position utilisateur)
        const iconeDepart = L.divIcon({
            className: 'marqueur-utilisateur',
            html: '<div class="marqueur-interne"><i class="fas fa-user"></i></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        const marqueurDepart = L.marker([latDepart, lngDepart], { icon: iconeDepart })
            .bindPopup('<div class="contenu-popup"><strong>Votre position</strong></div>');
        
        this.groupeItineraire.addLayer(marqueurDepart);
        
        // Marqueur de destination
        const iconeDestination = L.divIcon({
            className: 'marqueur-cinema marqueur-cinema-surligne',
            html: '<div class="marqueur-interne"><i class="fas fa-film"></i></div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        
        const marqueurDestination = L.marker([latDest, lngDest], { icon: iconeDestination })
            .bindPopup(`<div class="contenu-popup"><strong>${nomDestination}</strong></div>`);
        
        this.groupeItineraire.addLayer(marqueurDestination);
        
        // Ligne d'itinéraire (approximation directe)
        const ligneItineraire = L.polyline([[latDepart, lngDepart], [latDest, lngDest]], {
            color: '#d4af37',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 5'
        });
        
        this.groupeItineraire.addLayer(ligneItineraire);
        
        // Ajouter le groupe à la carte
        this.carte.addLayer(this.groupeItineraire);
        
        // Ajuster la vue
        const limites = L.latLngBounds([[latDepart, lngDepart], [latDest, lngDest]]);
        this.carte.fitBounds(limites, { padding: [50, 50] });
        
        // Afficher la bannière de destination
        const banniere = document.getElementById('best-destination-banner');
        if (banniere) {
            banniere.classList.add('visible');
            setTimeout(() => {
                banniere.classList.remove('visible');
            }, 5000);
        }
        
        // Ouvrir les popups avec délai
        setTimeout(() => {
            marqueurDepart.openPopup();
            setTimeout(() => {
                marqueurDestination.openPopup();
            }, 1000);
        }, 500);
    }

    // ================================================
    // MÉTHODES UTILITAIRES
    // ================================================
    afficherTousCinemas() {
        console.log('Retour à la vue normale');
        
        this.nettoyerAffichageProximite();
        
        if (this.marqueurUtilisateur) {
            this.carte.removeLayer(this.marqueurUtilisateur);
            this.marqueurUtilisateur = null;
        }
        
        if (this.groupeItineraire) {
            this.carte.removeLayer(this.groupeItineraire);
            this.groupeItineraire = null;
        }

        // Masquer la bannière
        const banniere = document.getElementById('best-destination-banner');
        if (banniere) {
            banniere.classList.remove('visible');
        }

        // Réafficher tous les marqueurs
        this.mettreAJourMarqueurs(this.app.filteredCinemas);
        
        // Vue d'ensemble de l'Île-de-France
        this.carte.setView([48.8566, 2.3522], 10);
    }

    // Invalider la taille de la carte (utile après redimensionnement)
    invaliderTaille() {
        if (this.carte) {
            this.carte.invalidateSize();
        }
    }

    // ================================================
    // STYLES CSS PERSONNALISÉS
    // ================================================
    ajouterStylesMarqueurs() {
        const style = document.createElement('style');
        style.textContent = `
            /* ================================================ */
            /* STYLES DES MARQUEURS DE CINÉMAS */
            /* ================================================ */
            .marqueur-cinema-personnalise {
                background: transparent !important;
                border: none !important;
            }

            .conteneur-marqueur-cinema {
                position: relative;
                width: 30px;
                height: 30px;
            }

            .marqueur-cinema {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #1a1a1a;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid #1a1a1a;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: transform 0.3s ease;
                position: relative;
                z-index: 1000;
            }

            .marqueur-cinema:hover {
                transform: scale(1.2);
            }

            /* ================================================ */
            /*  STYLES DU MARQUEUR UTILISATEUR */
            /* ================================================ */
            .marqueur-utilisateur {
                background: transparent !important;
                border: none !important;
            }

            .marqueur-user {
                position: relative;
                width: 40px;
                height: 40px;
            }

            .marqueur-user-interne {
                width: 20px;
                height: 20px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 10px;
                z-index: 1001;
            }

            .marqueur-user-pulse {
                width: 40px;
                height: 40px;
                background: rgba(59, 130, 246, 0.3);
                border-radius: 50%;
                position: absolute;
                top: 0;
                left: 0;
                animation: pulse-animation 2s infinite;
            }

            @keyframes pulse-animation {
                0% {
                    transform: scale(0.8);
                    opacity: 1;
                }
                100% {
                    transform: scale(2);
                    opacity: 0;
                }
            }

            /* ================================================ */
            /* STYLES DES MARQUEURS DE PROXIMITÉ */
            /* ================================================ */
            .marqueur-proximite-personnalise {
                background: transparent !important;
                border: none !important;
            }

            .marqueur-proximite {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
                font-weight: bold;
                border: 3px solid #d4af37;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                position: relative;
                flex-direction: column;
                padding: 2px;
            }

            .marqueur-proximite.ouvert {
                background: #10b981;
                border-color: #10b981;
            }

            .marqueur-proximite.ferme {
                background: #ef4444;
                border-color: #ef4444;
            }

            .marqueur-proximite .rang {
                font-size: 10px;
                font-weight: 900;
                line-height: 1;
                margin-bottom: 1px;
            }

            /* ================================================ */
            /*  STYLES DES POPUPS */
            /* ================================================ */
            .leaflet-popup-content-wrapper {
                background: #1a1a1a !important;
                border: 1px solid #d4af37 !important;
                color: white !important;
                border-radius: 8px !important;
            }

            .leaflet-popup-tip {
                background: #1a1a1a !important;
                border: 1px solid #d4af37 !important;
            }

            .popup-personnalisee .leaflet-popup-content {
                margin: 12px;
            }

            .contenu-popup-user {
                text-align: center;
                font-family: 'Inter', sans-serif;
            }

            .titre-popup {
                color: #d4af37;
                font-weight: 600;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 6px;
                justify-content: center;
            }

            .coordonnees {
                font-size: 12px;
                color: #9ca3af;
                margin: 0;
            }

            /* ================================================ */
            /* STYLES POPUPS DE PROXIMITÉ */
            /* ================================================ */
            .popup-proximite {
                min-width: 250px;
                font-family: 'Inter', sans-serif;
            }

            .en-tete-popup {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #2a2a2a;
            }

            .badge-rang {
                background: #d4af37;
                color: #000;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 900;
                flex-shrink: 0;
            }

            .badge-statut {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
            }

            .badge-statut.ouvert {
                background: rgba(16, 185, 129, 0.2);
                color: #10b981;
            }

            .badge-statut.ferme {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
            }

            .distance-principale {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 16px;
                font-weight: 600;
                color: #d4af37;
                margin-bottom: 4px;
            }

            .info-temps {
                display: flex;
                gap: 12px;
                font-size: 12px;
                color: #9ca3af;
            }

            .actions-popup {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                padding-top: 8px;
                border-top: 1px solid #2a2a2a;
            }

            .bouton-navigation {
                flex: 1;
                background: #d4af37;
                color: #000;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.3s;
            }

            .bouton-navigation:hover {
                background: #b8941f;
            }

            .bouton-details-popup {
                background: transparent;
                color: #d4af37;
                border: 1px solid #d4af37;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }

            .bouton-details-popup:hover {
                background: rgba(212, 175, 55, 0.1);
            }

            /* ================================================ */
            /* ANIMATIONS */
            /* ================================================ */
            .bounce {
                animation: bounce-effect 0.6s ease-in-out;
            }

            @keyframes bounce-effect {
                0%, 20%, 60%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-10px);
                }
                80% {
                    transform: translateY(-5px);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ================================================
//  EXPOSITION GLOBALE
// ================================================
// Maintenir la compatibilité avec l'ancien nom
window.MapManager = GestionnaireCartes;
window.GestionnaireCartes = GestionnaireCartes;

console.log('✅ Gestionnaire de cartes chargé et disponible globalement');