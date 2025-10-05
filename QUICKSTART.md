# Hearsay - Quick Start Guide

Get Hearsay running in 5 minutes!

## What You'll Need

- **Python 3.8+** - Backend server
- **Node.js 16+** - Frontend interface  
- **API Keys** (free tiers work fine):
  - Google Gemini: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
  - ElevenLabs: [elevenlabs.io](https://elevenlabs.io/)

## Installation

### Step 1: Get API Keys

1. **Google Gemini**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key"
   - Copy your key

2. **ElevenLabs**
   - Visit [ElevenLabs](https://elevenlabs.io/)
   - Sign up (free tier available)
   - Go to Profile → Copy API key

### Step 2: Configure Environment

Create a `.env` file in the project root directory:

```
GEMINI=your_gemini_api_key_here
ELEVENLABS=your_elevenlabs_api_key_here
```

**Important:** The `.env` file must be in the same directory as this QUICKSTART.md file.

### Step 3: Start Backend

Open a terminal:

```bash
cd backend
pip install -r requirements.txt
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Backend is ready!** ✓

### Step 4: Start Frontend

Open a **new terminal** (keep backend running):

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
VITE ready in xxx ms
Local: http://localhost:3000
```

**Frontend is ready!** ✓

### Step 5: Start Learning

1. Open your browser to `http://localhost:3000`
2. Click **"Manage"** in the navigation
3. Add your first word:
   - **Foreign Language:** `hola`
   - **English:** `hello`
   - Click **"Add Word"** (wait 10-20 seconds for AI generation)
4. Click **"Study"** to review your first card!
5. Click **"Stats"** to see your progress

**You're all set!** 🎉

## Optional: Hardware Setup

Want to use physical buttons or gesture sensors? 

See the [Hardware Quick Start Guide](hardware/QUICKSTART.md) for detailed instructions.

**Quick version:**
1. Connect Arduino with buttons or sensors
2. Upload the Arduino sketch
3. Edit `hardware/config.py` with your backend URL
4. Run `python hardware_buttons.py` or `python hardware_sensors.py`

## Common Issues

### "ModuleNotFoundError" when starting backend

**Fix:** Make sure you're in the backend directory and ran `pip install -r requirements.txt`

```bash
cd backend
pip install -r requirements.txt
```

### "GEMINI API key not found"

**Fix:** Check that your `.env` file is in the **project root**, not inside backend/ or frontend/

```
Project Root/
├── .env          ← Should be here
├── backend/
├── frontend/
└── hardware/
```

### Port 8000 or 3000 already in use

**Fix:** Kill the process using that port:

```bash
# Kill port 8000
npx kill-port 8000

# Kill port 3000
npx kill-port 3000
```

Or change the port in the config files (see detailed guides).

### Frontend shows "Network Error"

**Fix:** Make sure the backend is running on port 8000. Check the backend terminal for errors.

### Audio files not generating

**Fix:** Verify your ElevenLabs API key is correct in the `.env` file. Free tier has monthly character limits.

### Nothing happens when I add a word

**Fix:** Wait 10-20 seconds—the AI is generating your sentence. Check the browser console (F12) for error messages.

## Next Steps

### Learn More

- **Backend Details:** [backend/README.md](backend/README.md) - API endpoints, database schema, FSRS algorithm
- **Frontend Details:** [frontend/README.md](frontend/README.md) - React components, pages, styling
- **Hardware Details:** [hardware/README.md](hardware/README.md) - Wiring diagrams, Arduino setup

### Quick Guides

- **Backend Quick Start:** [backend/QUICKSTART.md](backend/QUICKSTART.md)
- **Frontend Quick Start:** [frontend/QUICKSTART.md](frontend/QUICKSTART.md)
- **Hardware Quick Start:** [hardware/QUICKSTART.md](hardware/QUICKSTART.md)

### Test Everything Works

Run the automated test suite:

```bash
cd backend
python test_api.py
```

All tests should pass ✓

## How to Use Hearsay

### Adding Words

1. Go to the **Manage** page
2. Enter a foreign language word and its English translation
3. Click "Add Word"
4. Wait ~15 seconds while AI generates a contextual sentence
5. Audio files are created automatically

### Studying

1. Go to the **Study** page
2. Listen to the word and sentence (click 🔊 icons)
3. Try to recall the meaning
4. Click "Show Answer" to reveal the translation
5. Rate how well you knew it:
   - **Again** (😰) - Forgot completely
   - **Hard** (😕) - Very difficult
   - **Good** (🙂) - Recalled with effort
   - **Easy** (😄) - Instant recall

### Tracking Progress

1. Go to the **Stats** page
2. View your learning metrics:
   - Total words and cards
   - Cards due today
   - Review count
   - Retention rate
   - Learning timeline

## Using Hardware (Optional)

Once you've set up the hardware controllers:

### Button Controls

Press any button while on the Study page:
- **Button 1** → Show answer + rate as Hard
- **Button 2** → Show answer + rate as Medium
- **Button 3** → Show answer + rate as Good
- **Button 4** → Show answer + rate as Easy

### Gesture Controls

Wave your hand near a sensor (3-step gesture):
1. Place hand near sensor (< 30cm)
2. Wait 1 second
3. Remove hand
4. Rating is submitted!

- **Sensor X** → Hard rating
- **Sensor Y** → Good rating

## System Check

Everything is working if:

```
✓ Backend: http://localhost:8000 shows "Language Learning API is running"
✓ Frontend: http://localhost:3000 shows the Hearsay interface
✓ Can add words in Manage page (wait for AI generation)
✓ Can study cards in Study page
✓ Stats page shows your metrics
✓ Audio plays when you click the 🔊 icons
```

## Getting Help

### Check the Logs

- **Backend errors:** Look in the terminal where you ran `python main.py`
- **Frontend errors:** Press F12 in your browser → Console tab
- **Hardware errors:** Look in the terminal where you ran the Python script

### Detailed Documentation

Each component has comprehensive troubleshooting:
- [Backend Troubleshooting](backend/README.md#troubleshooting)
- [Frontend Troubleshooting](frontend/README.md#troubleshooting)
- [Hardware Troubleshooting](hardware/README.md#troubleshooting)

### Common Questions

**Q: How much do the API keys cost?**  
A: Both have free tiers that work great for personal use. ElevenLabs: 10k characters/month. Gemini: Generous free quota.

**Q: Can I use this without hardware?**  
A: Yes! The web interface works perfectly on its own. Hardware is optional for accessibility.

**Q: What languages are supported?**  
A: Any language supported by ElevenLabs TTS and Google Gemini (most major languages).

**Q: How does the spaced repetition work?**  
A: We use FSRS, which calculates optimal review timing based on your performance. Better than traditional algorithms!

**Q: Can I export my data?**  
A: Yes! Your data is in `backend/database.json` (JSON format) and `backend/audio/` (MP3 files).

---

**Happy learning!** 🚀

For more details, see the [full README](README.md) or component-specific documentation.
