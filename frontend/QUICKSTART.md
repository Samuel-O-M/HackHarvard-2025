# Frontend Quick Start

## Prerequisites

- Node.js 16+ installed
- Backend server running on port 8000

## Installation & Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## ✅ Quick Test

1. **Open the app**: `http://localhost:3000`
2. **Go to Manage page**: Click "Manage" in navigation
3. **Add a word**:
   - Foreign Language: `hola`
   - English: `hello`
   - Click "Add Word" (wait 10-20 seconds)
4. **Go to Study page**: Click "Study" in navigation
5. **Review the card**: Click "Show Answer", then rate it
6. **Check Stats**: Click "Stats" to see your progress

## 🚨 Troubleshooting

### Port 3000 already in use?
```bash
# Kill the process on port 3000
npx kill-port 3000

# Or change the port in vite.config.js
server: {
  port: 3001  // Use different port
}
```

### Backend not connecting?
1. Verify backend is running: `http://localhost:8000`
2. Check backend console for errors
3. Ensure CORS is enabled in backend

### Dependencies not installing?
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📱 Pages Overview

- **`/`** - Study page (review flashcards)
- **`/stats`** - Statistics dashboard
- **`/manage`** - Add and view words

## 🎯 Development Workflow

1. Make changes to files
2. Save (HMR will reload automatically)
3. Check browser for updates
4. Test functionality
5. Check console for errors

## 🚀 Ready to Learn!

Your frontend is now running and connected to the backend. Start adding words and studying! 🎉

