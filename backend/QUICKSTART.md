# Backend Quick Start

Get the FastAPI backend running in 60 seconds!

## Prerequisites

- Python 3.8 or higher
- pip package manager
- API keys for Google Gemini and ElevenLabs

## 3-Step Setup

### Step 1: Create `.env` file

In the **parent directory** (one level up from backend folder), create `.env`:
```
GEMINI=your_gemini_api_key_here
ELEVENLABS=your_elevenlabs_api_key_here
```

### Step 2: Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Start the server

```bash
python main.py
```

**Server is running!** - `http://localhost:8000`

## Quick Test

### Test 1: Health Check
Open browser: `http://localhost:8000`

Expected response:
```json
{"message": "Language Learning API is running"}
```

### Test 2: Run Test Suite
```bash
python test_api.py
```

Expected: All tests pass

### Test 3: Create a Word
```bash
curl -X POST http://localhost:8000/notes \
  -H "Content-Type: application/json" \
  -d '{"word":"hola","translation":"hello"}'
```

Wait 10-20 seconds for AI generation. Returns note ID and card IDs.

## Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/notes` | POST | Add word (AI generates sentence + audio) |
| `/notes` | GET | Get all words |
| `/study/next` | GET | Get next card to review |
| `/study/answer` | POST | Submit rating for card |
| `/stats` | GET | Get all statistics |
| `/hardware/input` | POST | Process hardware input |

## Configuration

### Change Port
Edit `main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8080)  # Change 8000 to 8080
```

### Enable Network Access
Server runs on `0.0.0.0` by default, accessible from other computers.

Find your IP:
- Windows: `ipconfig`
- Mac/Linux: `ifconfig` or `ip addr`

Access from other devices: `http://YOUR_IP:8000`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "GEMINI API key not found" | Check `.env` is in **parent directory**, not in backend/ |
| Port 8000 already in use | Change port in `main.py` or kill process: `npx kill-port 8000` |
| Module not found | Run `pip install -r requirements.txt` again |
| Audio files not found | Check `backend/audio/` directory is created (auto-created on first note) |
| Connection refused | Ensure firewall allows port 8000 |

## Files Generated

The backend creates these automatically:
- `database.json` - All notes, cards, and review logs
- `audio/` - Directory containing all MP3 files
  - `word_1.mp3`, `translation_1.mp3`
  - `sentence_1.mp3`, `sentence_translation_1.mp3`

## Testing

### Manual Testing

1. **Add a word**:
```bash
curl -X POST http://localhost:8000/notes \
  -H "Content-Type: application/json" \
  -d '{"word":"gracias","translation":"thank you"}'
```

2. **Get next card**:
```bash
curl http://localhost:8000/study/next
```

3. **Submit rating**:
```bash
curl -X POST http://localhost:8000/study/answer \
  -H "Content-Type: application/json" \
  -d '{"card_id":1,"rating":3}'
```

4. **View stats**:
```bash
curl http://localhost:8000/stats
```

### Automated Testing

```bash
python test_api.py
```

This runs tests for all endpoints and validates responses.

## API Key Setup

### Google Gemini
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `.env`: `GEMINI=your_key_here`

### ElevenLabs
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up and get API key from profile
3. Add to `.env`: `ELEVENLABS=your_key_here`

## Full Documentation

See [Backend README](README.md) for:
- Complete API endpoint documentation
- Database schema
- FSRS algorithm configuration
- Controller functions
- External API integration details

## Success Checklist

- [ ] `.env` file created with both API keys
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Server starts without errors
- [ ] Browser shows API running message at `http://localhost:8000`
- [ ] Can create notes via `/notes` endpoint
- [ ] Audio files are generated in `audio/` directory
- [ ] Test script passes all tests

**Ready!** Backend is now serving the API. Start the frontend to use the full application.

