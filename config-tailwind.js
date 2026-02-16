// ================================================
// CONFIGURATION TAILWIND - CinéMap IDF
// ================================================
// Configuration personnalisée des couleurs et styles Tailwind CSS

tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cinema: {
          dark: '#0a0a0a',
          medium: '#1a1a1a',
          light: '#2a2a2a',
          accent: '#d4af37',
          red: '#e50914',
          blue: '#0f3460'
        }
      },
      fontFamily: {
        'cinema': ['Bebas Neue', 'Arial', 'sans-serif']
      }
    }
  }
}