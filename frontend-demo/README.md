# HackHarvard-2025 Frontend Demo

This is a frontend-only demonstration version of the HackHarvard-2025 language learning application, designed to be hosted on GitHub Pages.

## What is this?

This demo version runs entirely in the browser without requiring a backend server. It uses pre-generated dummy data to showcase the application's features.

## Features

- ✅ View existing flashcards and notes
- ✅ Study mode with spaced repetition scheduling
- ✅ Statistics and progress tracking
- ✅ Audio playback for words and sentences
- ❌ Cannot generate new flashcards (requires backend)
- ❌ Progress is not persisted (resets on page reload)

## How to Deploy to GitHub Pages

1. Make sure you're in the `frontend-demo` directory:
   ```bash
   cd frontend-demo
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

This will build the application and deploy it to the `gh-pages` branch of your repository.

## Local Development

To run the demo locally:

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Full Version

For the full version with backend capabilities (generating new flashcards, persistent storage, etc.), please visit the main repository and follow the setup instructions:

https://github.com/Samuel-O-M/HackHarvard-2025

## Technical Details

### Changes from Main Frontend

1. **Local Data Source**: Uses `/dummy_database.json` and `/dummy_audio/` from the public directory instead of API calls
2. **Modified API Layer**: `src/api/backend.js` simulates API responses using local data
3. **Disabled Features**: 
   - Creating new notes shows an alert directing users to self-host
   - FSRS optimization shows an alert directing users to self-host
4. **GitHub Pages Configuration**:
   - Base path set to `/HackHarvard-2025/`
   - Homepage configured for GitHub Pages URL
   - Deploy script included

### File Structure

```
frontend-demo/
├── public/
│   ├── dummy_database.json    # Pre-generated learning data
│   └── dummy_audio/            # Pre-generated audio files
├── src/
│   ├── api/
│   │   └── backend.js         # Modified to use local data
│   └── pages/
│       ├── Manage.jsx         # Shows alert for backend features
│       ├── Stats.jsx          # Shows alert for optimization
│       └── Study.jsx          # Uses local audio paths
└── vite.config.js             # Configured for GitHub Pages
```

## Notes

- All user interactions only modify browser memory (React state)
- Page reload will reset all progress to initial dummy data
- Audio files are loaded from `/dummy_audio/` directory
- No authentication or user accounts in demo mode
