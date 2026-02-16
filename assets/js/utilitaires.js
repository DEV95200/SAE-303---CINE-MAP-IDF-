// ================================================
// UTILITAIRES - CinéMap IDF
// ================================================
// Classes utilitaires pour notifications, stockage, formatage, thèmes

// Gestionnaire de notifications toast
class GestionnaireToasts {
  static show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="fas ${this.getIcon(type)} text-${this.getColor(type)}"></i>
        <span>${message}</span>
        <button class="ml-4 text-gray-400 hover:text-white">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => toast.classList.add('show'), 100);

    // Bouton fermer
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => this.remove(toast));

    // Auto-suppression
    setTimeout(() => this.remove(toast), duration);

    return toast;
  }

  static remove(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  static getIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  static getColor(type) {
    const colors = {
      success: 'green-500',
      error: 'red-500',
      warning: 'yellow-500',
      info: 'blue-500'
    };
    return colors[type] || colors.info;
  }
}

// Gestionnaire de stockage local
class GestionnaireStockage {
  static setItem(key, value) {
    try {
      localStorage.setItem(`cinemap_${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  }

  static getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`cinemap_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Erreur lors de la lecture:', error);
      return defaultValue;
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(`cinemap_${key}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  }

  static clear() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('cinemap_'))
        .forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  }
}

// Utilitaires pour les coordonnées GPS
class GeoUtils {
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRad(value) {
    return value * Math.PI / 180;
  }

  static formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }

  static getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La géolocalisation n\'est pas supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'Erreur de géolocalisation';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission de géolocalisation refusée';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position non disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'Timeout de géolocalisation';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
}

// Utilitaires de formatage
class UtilitairesFormat {
  static formatNumber(number, locale = 'fr-FR') {
    return new Intl.NumberFormat(locale).format(number);
  }

  static formatPrice(price, currency = 'EUR', locale = 'fr-FR') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  static truncateText(text, maxLength = 100, suffix = '...') {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + suffix;
  }

  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static formatPhoneNumber(phone) {
    // Format français: 01 23 45 67 89
    if (phone.length === 10 && phone.startsWith('0')) {
      return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone;
  }
}

// Gestionnaire de thème
class GestionnaireThemes {
  constructor() {
    this.currentTheme = StorageManager.getItem('theme', 'dark');
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.classList.toggle('dark', this.currentTheme === 'dark');
    document.documentElement.classList.toggle('light', this.currentTheme === 'light');
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    StorageManager.setItem('theme', this.currentTheme);
    this.applyTheme();
    return this.currentTheme;
  }

  setTheme(theme) {
    if (['dark', 'light'].includes(theme)) {
      this.currentTheme = theme;
      StorageManager.setItem('theme', this.currentTheme);
      this.applyTheme();
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Utilitaires de performance
class UtilitairesPerformance {
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(2)} milliseconds`);
    return result;
  }
}

// Exposition globale des utilitaires
window.GestionnaireToasts = GestionnaireToasts;
window.ToastManager = GestionnaireToasts; // Maintien compatibilité
window.GestionnaireStockage = GestionnaireStockage;
window.StorageManager = GestionnaireStockage; // Maintien compatibilité
window.UtilitairesGeo = GeoUtils;
window.GeoUtils = GeoUtils; // Maintien compatibilité
window.UtilitairesFormat = UtilitairesFormat;
window.FormatUtils = UtilitairesFormat; // Maintien compatibilité
window.GestionnaireThemes = GestionnaireThemes;
window.ThemeManager = GestionnaireThemes; // Maintien compatibilité
window.UtilitairesPerformance = UtilitairesPerformance;
window.PerformanceUtils = UtilitairesPerformance; // Maintien compatibilité

console.log('✅ Utilitaires chargés et disponibles globalement');

// Initialisation du gestionnaire de thème
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});