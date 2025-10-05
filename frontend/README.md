# Frontend - Hearsay Web Application

A modern, responsive React application providing an intuitive interface for Hearsay's audio-based learning system with spaced repetition. Built with React 18, Vite, and Tailwind CSS.

## Overview

The frontend provides a complete user interface for managing flashcards, studying with spaced repetition, and tracking learning progress. It seamlessly integrates with hardware controllers for accessible, hands-free learning.

## Features

- **Study Mode**: Interactive flashcard interface with audio playback
- **4-Level Rating System**: Again, Hard, Good, Easy (FSRS algorithm)
- **Manage Words**: Add new vocabulary with AI-generated sentences
- **Statistics Dashboard**: Comprehensive learning analytics
- **Hardware Integration**: Real-time polling for button/sensor input
- **Audio Playback**: High-quality text-to-speech in both languages
- **Responsive Design**: Beautiful UI that works on all devices
- **Real-Time Updates**: Instant feedback and smooth transitions

## Architecture

### Technology Stack

- **React 18.2.0** - Modern UI library with hooks
- **Vite 5.0.8** - Lightning-fast build tool and dev server
- **Tailwind CSS 3.3.6** - Utility-first CSS framework
- **React Router 6.20.0** - Client-side routing
- **Axios 1.6.2** - HTTP client for API requests

### Project Structure

```
frontend/
├── src/
│   ├── main.jsx              # React entry point, renders App
│   ├── App.jsx               # Main app with routing and navigation
│   ├── index.css             # Global styles + Tailwind directives
│   ├── api/
│   │   └── backend.js        # Backend API client
│   └── pages/
│       ├── Study.jsx         # Flashcard review interface
│       ├── Manage.jsx        # Add and view words
│       └── Stats.jsx         # Statistics dashboard
├── index.html                # HTML entry point
├── vite.config.js            # Vite configuration with proxy
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── package.json              # Dependencies and scripts
├── README.md                 # This file
└── QUICKSTART.md             # Fast setup guide
```

## Pages

### Study Page (`/`)

The main learning interface for reviewing flashcards.

**Features:**
- Displays next card due for review based on FSRS scheduling
- Shows word and contextual sentence in target language
- Audio playback buttons for word and sentence
- Show/Hide answer toggle
- 4-button rating system with emojis
- Automatic loading of next card after rating
- Hardware input support via polling
- "No cards due" message when all cards reviewed

**User Flow:**
1. Card appears showing target language word + sentence
2. User listens to audio (optional)
3. User tries to recall the meaning
4. User clicks "Show Answer" to reveal translation
5. User rates recall difficulty (1-4)
6. Next card loads automatically

**Rating Buttons:**
- 😰 **Again (1)** - Red - Forgot completely
- 😕 **Hard (2)** - Orange - Very difficult
- 🙂 **Good (3)** - Blue - Recalled with effort
- 😄 **Easy (4)** - Green - Instant recall

**Hardware Integration:**
- Polls `/hardware/poll` endpoint every 500ms
- Processes show_card and submit_rating actions
- Notifies backend of page changes via `/hardware/page`

**Component State:**
```javascript
{
  currentCard: null,          // Current card data
  showAnswer: false,          // Answer visibility
  loading: true,              // Loading state
  isSubmitting: false,        // Prevent double-submission
  noCardsDue: false          // No cards available
}
```

---

### Manage Page (`/manage`)

Interface for adding new vocabulary and viewing existing words.

**Features:**
- Form to add new word + translation
- Real-time feedback (success/error messages)
- Loading indicator during AI generation (10-20s)
- List of all existing notes with details
- Info box explaining the creation process

**Add Word Form:**
- **Foreign Language** input (e.g., "hola")
- **English Translation** input (e.g., "hello")
- **Add Word** button (disabled during processing)

**What Happens When You Add a Word:**
1. Backend selects your top 10% mastered words
2. Gemini AI generates contextual sentence
3. ElevenLabs creates 4 audio files
4. Two flashcards created (forward + reverse)
5. Success message displays with note ID

**Word List:**
Displays all learning notes with:
- Word and translation
- Generated sentence (with asterisks marking target word)
- Sentence translation
- Creation timestamp

**Error Handling:**
- Network errors
- API failures
- Missing fields
- Timeout errors

---

### Stats Page (`/stats`)

Comprehensive dashboard for tracking learning progress.

**Statistics Displayed:**

**Overview Cards:**
- **Total Words**: Count of unique vocabulary
- **Total Cards**: Count of flashcards (2 per word)
- **Due Today**: Cards needing review
- **Reviews Today**: Reviews completed today

**Card State Distribution:**
- New cards (never reviewed)
- Learning cards (currently learning)
- Review cards (successfully learned)
- Relearning cards (recently forgotten)

**Rating Distribution:**
- Breakdown of Again/Hard/Good/Easy ratings
- Percentages for each rating
- Visual indicators of performance

**Learning Metrics:**
- Total reviews all-time
- Average stability (memory strength)
- Retention rate (% remembered)

**Recent Reviews:**
- Timeline of latest review sessions
- Card details and ratings
- Timestamps

**Data Source:**
All metrics calculated from `/stats` endpoint response containing:
- `learning_notes` array
- `cards` array with FSRS state
- `review_logs` array with historical data

**Calculations:**
```javascript
// Cards due today
cards.filter(c => new Date(c.fsrs_card.due) <= now)

// Reviews today
review_logs.filter(r => 
  new Date(r.review).toDateString() === today.toDateString()
)

// State distribution
cards.reduce((acc, c) => {
  acc[c.fsrs_card.state]++
  return acc
}, {0: 0, 1: 0, 2: 0, 3: 0})

// Rating distribution
review_logs.reduce((acc, r) => {
  acc[r.rating]++
  return acc
}, {1: 0, 2: 0, 3: 0, 4: 0})

// Average stability
cards.reduce((sum, c) => 
  sum + c.fsrs_card.stability, 0
) / cards.length

// Retention rate
cards.filter(c => c.fsrs_card.reps > 0 && c.fsrs_card.state !== 3).length /
cards.filter(c => c.fsrs_card.reps > 0).length
```

---

## API Integration

### Backend Client (`src/api/backend.js`)

Configures Axios instance with proxy to backend.

```javascript
import axios from 'axios'

export async function getApi() {
  return axios.create({
    baseURL: '/api',  // Proxied to http://localhost:8000
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 30000  // 30 second timeout for AI generation
  })
}
```

### Vite Proxy Configuration

```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

**Benefits:**
- Avoids CORS issues in development
- Cleaner API calls (no hardcoded URLs)
- Easy to change backend URL
- Works seamlessly with production builds

### API Endpoints Used

| Endpoint | Method | Usage | Page |
|----------|--------|-------|------|
| `/study/next` | GET | Get next card to review | Study |
| `/study/answer` | POST | Submit card rating | Study |
| `/notes` | GET | Get all learning notes | Manage, Stats |
| `/notes` | POST | Create new note | Manage |
| `/stats` | GET | Get full statistics | Stats |
| `/hardware/poll` | GET | Poll hardware actions | Study |
| `/hardware/page` | POST | Update current page | All (via routing) |

### Audio File Access

Audio files are served directly from backend:

```javascript
const AUDIO_BASE = 'http://localhost:8000/audio'

// Usage
<audio src={`${AUDIO_BASE}/${note.word_audio}`} />
```

**Audio Files:**
- `word_{id}.mp3` - Target language word
- `translation_{id}.mp3` - English translation
- `sentence_{id}.mp3` - Context sentence
- `sentence_translation_{id}.mp3` - Sentence translation

---

## Styling

### Tailwind CSS

**Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
```

**Common Patterns:**
- Cards: `bg-white shadow-lg rounded-xl p-6`
- Buttons: `px-4 py-2 rounded-lg font-medium transition-colors`
- Navigation: `flex space-x-4` with active state styling
- Responsive: `container mx-auto px-6`

**Color Scheme:**
- Primary: Blue (`blue-600`, `blue-500`)
- Success: Green (`green-500`, `green-600`)
- Warning: Orange (`orange-500`, `orange-600`)
- Error: Red (`red-500`, `red-600`)
- Background: Gray (`gray-50`, `gray-100`)

### Custom CSS

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}
```

---

## Hardware Integration

### Page Tracking Hook

```javascript
function usePageTracking() {
  const location = useLocation()
  
  useEffect(() => {
    const notifyBackend = async () => {
      const api = await getApi()
      let pageName = 'study'
      if (location.pathname === '/stats') pageName = 'stats'
      else if (location.pathname === '/manage') pageName = 'manage'
      
      await api.post('/hardware/page', { page: pageName })
    }
    notifyBackend()
  }, [location])
}
```

**Purpose:** Backend ignores hardware input unless page is "study".

### Action Polling (Study Page)

```javascript
useEffect(() => {
  const pollInterval = setInterval(async () => {
    const api = await getApi()
    const response = await api.get('/hardware/poll')
    const { actions } = response.data
    
    for (const action of actions) {
      if (action.action === 'show_card') {
        setShowAnswer(true)
      } else if (action.action === 'submit_rating') {
        handleRating(action.rating)
      }
    }
  }, 500)  // Poll every 500ms
  
  return () => clearInterval(pollInterval)
}, [currentCard])
```

**Flow:**
1. Hardware controller sends input to backend
2. Backend queues action
3. Frontend polls and retrieves actions
4. Frontend executes actions (show answer, submit rating)
5. UI updates accordingly

---

## Development

### Start Development Server

```bash
npm run dev
```

Runs on `http://localhost:3000` with:
- Hot Module Replacement (HMR)
- Instant updates on file changes
- Source maps for debugging

### Build for Production

```bash
npm run build
```

Creates optimized production build in `dist/`:
- Minified JavaScript
- Optimized CSS
- Compressed assets
- Source maps (optional)

### Preview Production Build

```bash
npm run preview
```

Serves production build locally for testing.

---

## Testing

### Manual Testing Checklist

**Study Page:**
- [ ] Card loads on page load
- [ ] Audio buttons play correct audio
- [ ] Show Answer reveals translation
- [ ] All 4 rating buttons work
- [ ] Next card loads after rating
- [ ] "No cards due" message shows when appropriate
- [ ] Hardware input triggers actions

**Manage Page:**
- [ ] Form accepts input
- [ ] Validation works (required fields)
- [ ] Loading indicator shows during creation
- [ ] Success message displays
- [ ] Error messages display appropriately
- [ ] Word list updates after adding word
- [ ] Word list displays all notes correctly

**Stats Page:**
- [ ] All statistics display
- [ ] Numbers are accurate
- [ ] Card state distribution shows
- [ ] Rating distribution shows
- [ ] Recent reviews display
- [ ] Updates after completing reviews

**Navigation:**
- [ ] All nav links work
- [ ] Active page highlighted
- [ ] Page tracking notifies backend

---

## Dependencies

### Production Dependencies

```json
{
  "react": "^18.2.0",              // UI library
  "react-dom": "^18.2.0",          // React DOM renderer
  "react-router-dom": "^6.20.0",   // Routing
  "axios": "^1.6.2"                // HTTP client
}
```

### Development Dependencies

```json
{
  "@types/react": "^18.2.43",           // TypeScript types
  "@types/react-dom": "^18.2.17",       // TypeScript types
  "@vitejs/plugin-react": "^4.2.1",     // Vite React plugin
  "autoprefixer": "^10.4.16",           // CSS autoprefixer
  "postcss": "^8.4.32",                 // CSS processor
  "tailwindcss": "^3.3.6",              // CSS framework
  "vite": "^5.0.8"                      // Build tool
}
```

---

## Configuration Files

### `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### `tailwind.config.js`

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
```

### `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

---

## Troubleshooting

### Backend Not Connecting

**Symptoms:** Network errors, 404 responses

**Solutions:**
1. Verify backend is running: `http://localhost:8000`
2. Check proxy configuration in `vite.config.js`
3. Inspect browser console for CORS errors
4. Ensure backend CORS is enabled

### Audio Not Playing

**Symptoms:** Silent playback, 404 errors

**Solutions:**
1. Check audio files exist in `backend/audio/`
2. Verify audio URLs in network tab
3. Check browser audio permissions
4. Try different browser (some block autoplay)

### Hardware Actions Not Working

**Symptoms:** Button presses ignored

**Solutions:**
1. Verify you're on Study page
2. Check hardware controller is running
3. Inspect `/hardware/poll` responses in network tab
4. Ensure backend receives hardware inputs

### Styling Issues

**Symptoms:** Broken layout, missing styles

**Solutions:**
1. Run `npm install` to ensure dependencies
2. Verify Tailwind is configured correctly
3. Check browser console for CSS errors
4. Clear browser cache (`Ctrl+Shift+R`)

### Port Already in Use

**Symptoms:** "Port 3000 is already in use"

**Solutions:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port in vite.config.js
server: { port: 3001 }
```

---

## Performance

### Optimization Techniques

**Code Splitting:**
- React Router handles route-based splitting automatically
- Each page loads only when needed

**Lazy Loading:**
```javascript
const Stats = lazy(() => import('./pages/Stats'))
```

**Memo and Callbacks:**
```javascript
const MemoizedCard = memo(({ card }) => { ... })
const handleRating = useCallback((rating) => { ... }, [currentCard])
```

**Debouncing:**
```javascript
// For search/filter inputs
const debouncedSearch = useMemo(
  () => debounce((value) => setSearch(value), 300),
  []
)
```

### Current Performance

- **Initial Load:** ~500ms
- **Page Navigation:** <100ms
- **API Calls:** 10-20ms (card retrieval), 10-20s (note creation)
- **Hardware Polling:** 500ms interval (minimal overhead)

---

## Next Steps

- Add keyboard shortcuts for Study page
- Implement dark mode
- Add settings page for customization
- Create mobile-optimized layouts
- Add offline support with service workers
- Implement progress graphs and charts
- Add export/import functionality

---

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)

---

Built for HackHarvard 2025
