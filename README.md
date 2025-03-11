# Multiness Fitness App

Eine dynamische Fitness-Community-App mit fortschrittlicher Theme-Anpassung und Benutzererfahrung.

## Features

- React.js Frontend
- TailwindCSS für Styling
- TypeScript für Typsicherheit
- Umfassendes Mock-Daten-Management
- Vollständig responsives Mobile Design
- Mehrsprachige Unterstützung (Deutsch/Englisch)
- Admin-Panel mit Benutzerverifizierung
- Erweitertes Event- und Mitgliedermanagement-System
- Theme- und Accessibility-Einstellungen
- LocalStorage-basierte Benutzereinstellungen

## Backup und Wiederherstellung

### Backup erstellen

Um ein Backup des aktuellen Projektstands zu erstellen:

```bash
./backup.sh
```

Dies erstellt eine .tar.gz-Datei im `backups`-Verzeichnis mit einem Zeitstempel, z.B.:
`backups/multiness_backup_20250311_173231.tar.gz`

### Backup wiederherstellen

Um ein Backup wiederherzustellen:

1. Entpacken Sie die Backup-Datei:
```bash
tar -xzf backups/[BACKUP_FILENAME].tar.gz -C ./
```

2. Installieren Sie die Abhängigkeiten neu:
```bash
npm install
```

3. Starten Sie die Entwicklungsumgebung:
```bash
npm run dev
```

## Entwicklung

### Installation

```bash
npm install
```

### Entwicklungsserver starten

```bash
npm run dev
```

Die App ist dann unter `http://localhost:5000` verfügbar.

## GitHub Repository

Das Projekt wird auf GitHub unter https://github.com/multiness/multiness-fitness-app gehostet.

Um Änderungen zu pushen (wenn Sie Zugriff haben):

```bash
git add .
git commit -m "Ihre Commit-Nachricht"
git push origin main
```
