# Frontend Quick Start

Get the React app running in 60 seconds!

## Prerequisites

- Node.js 16+ installed
- Backend server running on port 8000

## 3-Step Setup

### Step 1: Navigate to frontend directory
```bash
cd frontend
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Start development server
```bash
npm run dev
```

**Frontend is running!** - `http://localhost:3000`

## Quick Test

1. **Open browser** → `http://localhost:3000`
2. **Click "Manage"** in navigation
3. **Add a word**:
   - Foreign Language: `hola`
   - English: `hello`
   - Click "Add Word" (wait 10-20 seconds)
4. **Click "Study"** → Review your first card!
5. **Click "Show Answer"** → See translation
6. **Rate the card** → Click one of the 4 buttons
7. **Click "Stats"** → See your progress

## Pages

- **`/`** (Study) - Review flashcards
- **`/stats`** - View statistics
- **`/manage`** - Add and view words

## Configuration

### Change Port

Edit `vite.config.js`:
```javascript
server: {
  port: 3001  // Change from 3000 to 3001
}
```

### Change Backend URL

Edit `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://192.168.1.100:8000',  // Change backend URL
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

## Troubleshooting

### Port 3000 already in use?
```bash
# Kill the process
npx kill-port 3000

# Or use different port (see Configuration above)
```

### Backend not connecting?
1. Verify backend is running: `http://localhost:8000`
2. Check browser console for errors
3. Ensure proxy is configured in `vite.config.js`

### Dependencies not installing?
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### White screen or errors?
```bash
# Check for build errors in terminal
# Check browser console (F12)
# Try hard refresh (Ctrl+Shift+R)
```

## Development Tips

1. **Hot Module Replacement** - Changes appear instantly, no refresh needed
2. **Browser DevTools** - Press F12 to see console, network, and React components
3. **React DevTools** - Install browser extension for component inspection
4. **Network Tab** - Monitor API calls and responses

## Build for Production

```bash
npm run build
```

Output in `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Success Checklist

- [ ] `npm install` completed without errors
- [ ] `npm run dev` starts server on port 3000
- [ ] Browser shows navigation and pages
- [ ] Can navigate between Study, Stats, and Manage
- [ ] Backend API calls work (check network tab)
- [ ] No console errors

## Full Documentation

See [Frontend README](README.md) for:
- Complete component documentation
- API integration details
- Styling guide
- Hardware integration
- Performance optimization

**Ready to learn!** Your frontend is now connected to the backend.
