# Language Learning Frontend

A modern React + Vite + Tailwind CSS frontend for the language learning application with spaced repetition.

## 🚀 Features

- **Study Mode**: Interactive flashcard interface with audio playback
- **4-Level Rating System**: Again, Hard, Good, Easy (FSRS algorithm)
- **Manage Words**: Add new words with AI-generated sentences and audio
- **Statistics Dashboard**: Track your learning progress and performance
- **Responsive Design**: Beautiful UI built with Tailwind CSS
- **Audio Playback**: Listen to words and sentences in both languages

## 📦 Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests

## 📱 Pages

### Study Page (`/`)
- Shows the next card due for review
- Displays word/sentence in target language
- Show/hide answer functionality
- Audio playback for pronunciation
- 4-button rating system (Again, Hard, Good, Easy)
- Automatic loading of next card after rating

### Stats Page (`/stats`)
- **Overview Cards**: Total words, total cards, due today, reviews today
- **Card States**: Distribution of new, learning, review, relearning cards
- **Rating Distribution**: How often you rate cards (Again/Hard/Good/Easy)
- **Learning Metrics**: Total reviews, average stability, retention rate
- **Recent Reviews**: Timeline of your latest review sessions

### Manage Page (`/manage`)
- **Add New Words**: Form to input foreign language word + English translation
- **Word List**: View all your learning notes
- **Real-time Feedback**: Shows success/error messages
- **Info Box**: Explains what happens when you add a word

## 🎨 Design

The frontend follows the design shown in your diagram with:
- Clean, modern card-based layout
- Color-coded rating buttons (Red/Orange/Blue/Green)
- Emojis for visual feedback (😰😕🙂😄)
- Smooth transitions and animations
- Responsive grid layouts

## 🔌 API Integration

The frontend connects to the FastAPI backend via proxy:

```javascript
// Configured in vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

### API Endpoints Used

- `GET /study/next` - Get next card for review
- `POST /study/answer` - Submit card rating
- `GET /notes` - Get all learning notes
- `POST /notes` - Create new note (word + translation)
- `GET /stats` - Get all statistics

### Audio Files

Audio files are accessed directly from the backend:
```javascript
const AUDIO_BASE = 'http://localhost:8000/audio'
```

## 📂 Project Structure

```
frontend/
├── index.html              # HTML entry point
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── postcss.config.js       # PostCSS config
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # Main app component with routing
    ├── index.css          # Global styles + Tailwind
    └── pages/
        ├── Study.jsx      # Study flashcards page
        ├── Stats.jsx      # Statistics page
        └── Manage.jsx     # Add/manage words page
```

## 🎯 Usage Flow

### 1. Add Words (Manage Page)
1. Enter foreign language word (e.g., "objetivo")
2. Enter English translation (e.g., "target")
3. Click "Add Word"
4. Wait 10-20 seconds for AI generation
5. Word appears in your collection

### 2. Study Cards (Study Page)
1. See the question (word + sentence)
2. Click 🔊 to hear pronunciation
3. Click "Show Answer" to reveal translation
4. Rate how well you knew it:
   - 😰 **Again** - Forgot completely
   - 😕 **Hard** - Difficult to remember
   - 🙂 **Good** - Remembered with hesitation
   - 😄 **Easy** - Remembered easily
5. Next card loads automatically

### 3. Track Progress (Stats Page)
- View total words and cards
- See how many cards are due today
- Check your review count
- Analyze rating distribution
- Monitor retention rate

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#3b82f6',    // Change primary color
      secondary: '#8b5cf6',  // Change secondary color
    }
  }
}
```

### API URL

To change the backend URL, edit `vite.config.js`:

```javascript
proxy: {
  '/api': {
    target: 'http://your-backend-url:8000',
    // ...
  }
}
```

## 🚀 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 🔧 Development Tips

1. **Hot Module Replacement**: Vite provides instant HMR - changes appear immediately
2. **DevTools**: Use React DevTools for debugging components
3. **Network Tab**: Monitor API calls in browser DevTools
4. **Console**: Check for errors or API response logs

## 📝 Environment Variables

Create a `.env` file in the frontend directory if you need custom config:

```
VITE_API_URL=http://localhost:8000
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

## 🐛 Troubleshooting

### Backend Not Connecting
- Make sure backend is running on port 8000
- Check proxy configuration in `vite.config.js`
- Verify CORS is enabled in backend

### Audio Not Playing
- Ensure audio files exist in `backend/audio/` directory
- Check browser console for 404 errors
- Verify audio permissions in browser

### Cards Not Loading
- Check backend is running (`http://localhost:8000`)
- Verify database has cards created
- Look for errors in browser console

### Styling Issues
- Run `npm install` to ensure all dependencies are installed
- Make sure Tailwind is configured correctly
- Clear browser cache

## 🎉 Next Steps

1. Add more words in the Manage page
2. Start studying with the Study page
3. Track your progress in the Stats page
4. Adjust rating difficulty based on your learning style

Happy learning! 🚀📚

