

// ======= Initialisation de la carte =======
const map = L.map('map').setView([48.8566, 2.3522], 10);
// ==========================================






// ======Définition des styles de carte=======

// plan classique
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
});

// vue satellite
const satelliteLayer = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri'
  }
);
// ============================================






// ======== Récupère le style de carte choisi dans l'index ========
const mapStyleSelect = document.getElementById('map-style-select');
// ================================================================






// ===== Appplique le style de carte choisi =====
function applyBaseLayer(style) {
  // On enlève les deux (si présents)
  if (map.hasLayer(osmLayer)) map.removeLayer(osmLayer);
  if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);

  if (style === 'satellite') {
    satelliteLayer.addTo(map);
  } else {
    // valeur par défaut
    osmLayer.addTo(map);
  }
}
// ===============================================






// ===== Style par défaut au chargement =====
applyBaseLayer(mapStyleSelect ? mapStyleSelect.value : 'osm');
// ==========================================






// ====== changement de style ======
if (mapStyleSelect) {
  mapStyleSelect.addEventListener('change', (e) => {
    applyBaseLayer(e.target.value);
  });
}
// ==================================






// ======== MarkerCluster (groupement des marqueurs selon les départements) ========
const markerCluster = L.markerClusterGroup();
map.addLayer(markerCluster);
// =================================================================================






// ====== Conserver en mémoire les marqueurs =======
const allMarkers = [];
// =================================================





// ======= Récupère la liste déroulante dans l'index ======
const depSelect = document.getElementById('departement-select');
// ========================================================






// ========= Etablir la liste des noms des départements =========
const depNames = {
  "75": "Paris",
  "77": "Seine-et-Marne",
  "78": "Yvelines",
  "91": "Essonne",
  "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne",
  "95": "Val-d'Oise"
};
// ===============================================================






// ======= Raffraîchissement ========
function refreshMarkers(selectedDep) {
  // Supprime tous les marqueurs du cluster
  markerCluster.clearLayers();

  // Filtre les marqueurs selon le département
  const markersToShow = allMarkers.filter(marker => {
    if (!selectedDep || selectedDep === 'all') return true;
    return marker.dep && marker.dep.toString() === selectedDep.toString();
  });

  // Ajoute les marqueurs filtrés au cluster
  markersToShow.forEach(marker => markerCluster.addLayer(marker));
}
// ==================================






// ======= Chargement des données du fichier JS =======
fetch('include/cinemas_data.json')
  .then(res => res.json())
  .then(data => {
    
    const depsSet = new Set();

    data.forEach(cinema => {
      if (!cinema.geo) return;

      // ======== Latitude et Longitude ==========
      const [latStr, lonStr] = cinema.geo.split(',');
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      // =========================================

      if (isNaN(lat) || isNaN(lon)) return;

      // ======== Récupère le code et le nom du département ===========
      const depCode = cinema.dep != null ? cinema.dep.toString() : '';
      const depLabel = depNames[depCode] || depCode || 'Département inconnu';
      // ==============================================================

      // ======= Création du marqueur =======
      const marker = L.marker([lat, lon]).bindPopup(`
        <strong>${cinema.nom}</strong><br>
        ${cinema.adresse || ''}<br>
        ${cinema.commune || ''}<br>
        ${depLabel}
      `);
      // =====================================

      // ====== Ajoute l'info de département au marqueur pour le filtrage =====
      marker.dep = depCode;
      // ======================================================================

      // ====== Stocke le marqueur ======
      allMarkers.push(marker);
      // ================================

      // ====== Enregistrement du departement ======
      if (depCode) {
        depsSet.add(depCode);
      }
      // ===========================================

    });

    // ====== Ajout dynamique des options de département dans la liste déroulante ======
    if (depSelect) {
      const baseOption = depSelect.querySelector('option[value="all"]');
      depSelect.innerHTML = '';
      if (baseOption) {
        depSelect.appendChild(baseOption);
      } else {
        const optAll = document.createElement('option');
        optAll.value = 'all';
        optAll.textContent = 'Tous les départements';
        depSelect.appendChild(optAll);
      }

      // ======= Trie les départements par code =======
      const deps = Array.from(depsSet).sort((a, b) => a.localeCompare(b));

      deps.forEach(dep => {
        const opt = document.createElement('option');
        opt.value = dep;
        opt.textContent = depNames[dep] || dep; // nom du département
        depSelect.appendChild(opt);
      });
      // ==============================================

    }
    //================================================================================

    // ======= Affichage de tous les marqueurs =======
    refreshMarkers('all');
    // ===============================================

  })
  .catch(err => {
    console.error('Erreur lors du chargement des données des cinémas :', err);
  });
// ===================================================


if (depSelect) {
  depSelect.addEventListener('change', () => {
    const selectedDep = depSelect.value;
    refreshMarkers(selectedDep);
  });
}
