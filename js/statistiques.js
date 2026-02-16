// ================================================
//  GESTIONNAIRE DE STATISTIQUES - CinéMap IDF  
// ================================================
// Calculs et affichage des statistiques des cinémas d'Île-de-France
// Données sources : Région Île-de-France (Open Data)
// https://data.iledefrance.fr/explore/dataset/les_salles_de_cinemas_en_ile-de-france

class StatistiquesCinemas {
    constructor(cinemas = []) {
        this.cinemas = cinemas;
        
        // Configuration des couleurs du thème
        this.couleurs = {
            primaire: '#d4af37',    // Or
            secondaire: '#b8941f',   // Or foncé
            accent: '#ffd700',       // Or brillant
            texte: '#ffffff',        // Blanc
            texteSecondaire: '#9ca3af', // Gris
            arrierePlan: '#1a1a1a',  // Noir
            arrierePlanCarte: '#2a2a2a' // Gris foncé
        };

        // Palette pour les éléments colorés
        this.paletteGraphiques = [
            '#d4af37', '#ffd700', '#ff8c00', '#ff6b6b', 
            '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
            '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce'
        ];
    }

    // ================================================
    //  FONCTION PRINCIPALE D'AFFICHAGE
    // ================================================
    afficherToutesLesStatistiques() {
        console.log('Génération des statistiques complètes...');
        
        try {
            // 1. Cartes de statistiques principales
            this.afficherCartesStatistiques();
            

            
            // 3. Insights et tendances
            setTimeout(() => {
                this.afficherInsights();
            }, 400);
            
            // 4. Top cinémas
            setTimeout(() => {
                this.afficherTopCinemas();
            }, 600);
            
            console.log('Statistiques générées avec succès');
            
        } catch (erreur) {
            console.error('Erreur lors de la génération des statistiques:', erreur);
            this.afficherErreurChargement();
        }
    }

    // ================================================
    //  CARTES DE STATISTIQUES PRINCIPALES
    // ================================================
    afficherCartesStatistiques() {
        const conteneur = document.getElementById('stats-cards-container');
        if (!conteneur) {
            console.warn('Conteneur des cartes statistiques non trouvé');
            return;
        }

        const stats = this.calculerStatistiquesPrincipales();
        
        const cartes = [
            {
                icone: 'fas fa-film',
                valeur: stats.nombreTotal,
                label: 'Cinémas',
                description: 'en Île-de-France',
                couleur: '#d4af37'
            },
            {
                icone: 'fas fa-map-marker-alt', 
                valeur: stats.nombreDepartements,
                label: 'Départements',
                description: 'couverts',
                couleur: '#4ecdc4'
            },
            {
                icone: 'fas fa-tv',
                valeur: stats.totalSalles,
                label: 'Écrans',
                description: 'au total',
                couleur: '#ff8c00'
            },
            {
                icone: 'fas fa-star',
                valeur: stats.noteMoyenne.toFixed(1),
                label: 'Note moyenne',
                description: 'étoiles sur 5',
                couleur: '#ffd700'
            },
            {
                icone: 'fas fa-euro-sign',
                valeur: `${stats.prixMoyen.toFixed(1)}€`,
                label: 'Prix moyen',
                description: 'par entrée',
                couleur: '#45b7d1'
            },
            {
                icone: 'fas fa-wheelchair',
                valeur: `${stats.tauxAccessibilite}%`,
                label: 'Accessibilité',
                description: 'des cinémas',
                couleur: '#96ceb4'
            }
        ];

        conteneur.innerHTML = cartes.map(carte => `
            <div class="carte-stat" style="border-left: 4px solid ${carte.couleur};">
                <div class="icone-carte" style="color: ${carte.couleur};">
                    <i class="${carte.icone}"></i>
                </div>
                <div class="contenu-carte">
                    <div class="valeur-principale" style="color: ${carte.couleur};">
                        ${carte.valeur}
                    </div>
                    <div class="label-carte">${carte.label}</div>
                    <div class="description-carte">${carte.description}</div>
                </div>
            </div>
        `).join('');
    }

    // ================================================
    //  CALCULS STATISTIQUES PRINCIPAUX
    // ================================================
    calculerStatistiquesPrincipales() {
        if (!this.cinemas || this.cinemas.length === 0) {
            return this.statistiquesParDefaut();
        }

        const stats = {
            nombreTotal: this.cinemas.length,
            nombreDepartements: new Set(this.cinemas.map(c => c.departement)).size,
            totalSalles: this.cinemas.reduce((total, cinema) => total + (cinema.salles || 0), 0),
            noteMoyenne: this.cinemas.reduce((total, cinema) => total + (cinema.note || 0), 0) / this.cinemas.length,
            prixMoyen: this.cinemas.reduce((total, cinema) => total + (cinema.prix_moyen || 0), 0) / this.cinemas.length,
            tauxAccessibilite: Math.round((this.cinemas.filter(c => c.accessibilite).length / this.cinemas.length) * 100)
        };

        return stats;
    }

    statistiquesParDefaut() {
        return {
            nombreTotal: 0,
            nombreDepartements: 0,
            totalSalles: 0,
            noteMoyenne: 0,
            prixMoyen: 0,
            tauxAccessibilite: 0
        };
    }

    // ================================================
    //  CALCULS POUR LES INSIGHTS
    // ================================================
    calculerRepartitionDepartements() {
        const comptage = {};
        const nomsDepart = {
            '75': 'Paris',
            '77': 'Seine-et-Marne', 
            '78': 'Yvelines',
            '91': 'Essonne',
            '92': 'Hauts-de-Seine',
            '93': 'Seine-Saint-Denis',
            '94': 'Val-de-Marne',
            '95': 'Val-d\'Oise'
        };

        this.cinemas.forEach(cinema => {
            const dept = cinema.departement || 'Inconnu';
            comptage[dept] = (comptage[dept] || 0) + 1;
        });

        const labels = Object.keys(comptage).map(code => 
            nomsDepart[code] || `Dépt ${code}`
        );
        const values = Object.values(comptage);

        return { labels, values };
    }

    calculerGenresPopulaires() {
        const comptageGenres = {};
        
        this.cinemas.forEach(cinema => {
            if (cinema.types_films && Array.isArray(cinema.types_films)) {
                cinema.types_films.forEach(genre => {
                    comptageGenres[genre] = (comptageGenres[genre] || 0) + 1;
                });
            }
        });

        // Trier par popularité et prendre le top 10
        const genresTries = Object.entries(comptageGenres)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        return {
            labels: genresTries.map(([genre]) => genre),
            values: genresTries.map(([, count]) => count)
        };
    }





    // ================================================
    //  INSIGHTS ET TENDANCES
    // ================================================
    afficherInsights() {
        const conteneur = document.getElementById('insights-container');
        if (!conteneur) return;

        const insights = this.genererInsights();
        
        conteneur.innerHTML = insights.map(insight => `
            <div class="carte-insight">
                <div class="icone-insight" style="color: ${insight.couleur};">
                    <i class="${insight.icone}"></i>
                </div>
                <div class="contenu-insight">
                    <h4 class="titre-insight">${insight.titre}</h4>
                    <p class="description-insight">${insight.description}</p>
                    <div class="stat-insight" style="color: ${insight.couleur};">
                        ${insight.statistique}
                    </div>
                </div>
            </div>
        `).join('');
    }

    genererInsights() {
        if (!this.cinemas || this.cinemas.length === 0) {
            return [];
        }

        const stats = this.calculerStatistiquesPrincipales();
        const repartitionDept = this.calculerRepartitionDepartements();
        const genresPopulaires = this.calculerGenresPopulaires();
        
        const insights = [
            {
                icone: 'fas fa-crown',
                titre: 'Département Leader',
                description: `${repartitionDept.labels[0]} concentre le plus de cinémas avec une forte densité culturelle.`,
                statistique: `${Math.max(...repartitionDept.values)} cinémas`,
                couleur: '#d4af37'
            },
            {
                icone: 'fas fa-masks-theater',
                titre: 'Genre Dominant',
                description: `${genresPopulaires.labels[0]} est le genre le plus représenté dans l'offre cinématographique.`,
                statistique: `${genresPopulaires.values[0]} cinémas`,
                couleur: '#ff8c00'
            },
            {
                icone: 'fas fa-accessibility',
                titre: 'Accessibilité',
                description: `${stats.tauxAccessibilite}% des cinémas sont accessibles aux personnes à mobilité réduite.`,
                statistique: `${Math.round(this.cinemas.filter(c => c.accessibilite).length)} cinémas`,
                couleur: '#96ceb4'
            },
            {
                icone: 'fas fa-parking',
                titre: 'Stationnement',
                description: 'Facilities de parking disponibles pour une expérience cinéma optimale.',
                statistique: `${Math.round((this.cinemas.filter(c => c.parking).length / this.cinemas.length) * 100)}% avec parking`,
                couleur: '#45b7d1'
            },
            {
                icone: 'fas fa-clock',
                titre: 'Horaires Étendues',
                description: 'La majorité des cinémas proposent des séances jusqu\'à minuit ou plus tard.',
                statistique: 'Ouvert tard',
                couleur: '#4ecdc4'
            }
        ];

        return insights.slice(0, 5); // Limiter à 5 insights
    }

    // ================================================
    //  TOP CINÉMAS
    // ================================================
    afficherTopCinemas() {
        const conteneur = document.getElementById('top-cinemas-container');
        if (!conteneur) return;

        const topCinemas = this.obtenirTopCinemas();
        
        conteneur.innerHTML = topCinemas.map((cinema, index) => `
            <div class="carte-top-cinema" data-cinema-id="${cinema.id}">
                <div class="rang-cinema" style="background-color: ${this.paletteGraphiques[index]};">
                    #${index + 1}
                </div>
                <div class="info-cinema-top">
                    <h4 class="nom-cinema-top">${cinema.nom}</h4>
                    <div class="localisation-cinema">
                        <i class="fas fa-map-marker-alt"></i>
                        ${cinema.ville} (${cinema.departement})
                    </div>
                    <div class="details-cinema-top">
                        <span class="note-cinema-top">
                            <i class="fas fa-star"></i> ${cinema.note}/5
                        </span>
                        <span class="prix-cinema-top">
                            <i class="fas fa-euro-sign"></i> ${cinema.prix_moyen}€
                        </span>
                        <span class="salles-cinema-top">
                            <i class="fas fa-tv"></i> ${cinema.salles} salles
                        </span>
                    </div>
                    <div class="services-cinema-top">
                        ${(cinema.services || []).slice(0, 3).map(service => 
                            `<span class="badge-service">${service}</span>`
                        ).join('')}
                    </div>
                </div>
                <button class="bouton-voir-cinema" onclick="cinemaApp.showCinemaDetails(${cinema.id})">
                    <i class="fas fa-eye"></i> Voir
                </button>
            </div>
        `).join('');
    }

    obtenirTopCinemas() {
        return this.cinemas
            .filter(cinema => cinema.note > 0)
            .sort((a, b) => {
                // Tri par note, puis par nombre d'avis, puis par nombre de salles
                if (b.note !== a.note) return b.note - a.note;
                if (b.avis_count !== a.avis_count) return (b.avis_count || 0) - (a.avis_count || 0);
                return (b.salles || 0) - (a.salles || 0);
            })
            .slice(0, 5);
    }

    // ================================================
    // GESTION D'ERREUR
    // ================================================
    afficherErreurChargement() {
        const conteneurs = [
            'stats-cards-container',
            'insights-container', 
            'top-cinemas-container'
        ];

        conteneurs.forEach(id => {
            const conteneur = document.getElementById(id);
            if (conteneur) {
                conteneur.innerHTML = `
                    <div class="erreur-statistiques">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erreur de chargement</h3>
                        <p>Impossible de charger les statistiques. Veuillez réessayer.</p>
                    </div>
                `;
            }
        });
    }

}

// ================================================
// EXPOSITION GLOBALE
// ================================================
window.StatistiquesCinemas = StatistiquesCinemas;
window.CinemaStatistics = StatistiquesCinemas; // Maintien compatibilité

console.log('Gestionnaire de statistiques chargé et disponible globalement');