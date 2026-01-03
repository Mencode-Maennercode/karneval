# PräsenzWerk Website

Professionelle Website für PräsenzWerk - Innovation für Digitale Sichtbarkeit

## Technologien

- **Next.js 15** - Modernes React Framework
- **Tailwind CSS** - Utility-First CSS Framework
- **Framer Motion** - Animations-Bibliothek
- **TypeScript** - Typsicheres JavaScript
- **Lucide React** - Moderne Icon-Bibliothek

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

Die Website ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Build

```bash
npm run build
npm start
```

## Features

- ✨ Animierte Hero-Section mit modernen Effekten
- 📱 Vollständig responsive Design
- 🎨 Angepasst an PräsenzWerk Markenfarben (Navy Blue & Cyan)
- ⚡ Optimiert für Performance und SEO
- 🎯 Klare Präsentation der Dienstleistungen
- 📧 Funktionales Kontaktformular
- 🌐 Deutschsprachiger Inhalt

## Struktur

- `/app` - Next.js App-Verzeichnis
  - `/components` - React-Komponenten
    - `Header.tsx` - Navigation
    - `HeroSection.tsx` - Hero-Bereich mit Animationen
    - `ServicesSection.tsx` - Leistungsübersicht
    - `BenefitsSection.tsx` - Vorteile
    - `ContactSection.tsx` - Kontaktformular
    - `Footer.tsx` - Fußbereich
  - `page.tsx` - Hauptseite
  - `layout.tsx` - Layout-Wrapper
  - `globals.css` - Globale Styles

## Anpassungen

### Farben
Die Markenfarben sind in `tailwind.config.ts` definiert:
- `brand-navy`: #1a2745
- `brand-cyan`: #4da6b8
- `brand-light`: #e8f4f6

### Kontaktinformationen
Aktualisieren Sie die Kontaktdaten in `app/components/ContactSection.tsx` und `app/components/Footer.tsx`.

### Inhalte
Alle deutschen Texte können direkt in den Komponenten angepasst werden.
