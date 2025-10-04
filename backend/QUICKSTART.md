# Quick Start Guide

## Prerequisites

- Python 3.8 or higher
- `.env` file in the parent directory with API keys

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify `.env` file exists in parent directory:**
   ```
   c:\Users\Samu\Desktop\Coding\HackHarvard-2025\.env
   ```
   
   Should contain:
   ```
   ELEVENLABS=your_api_key_here
   GEMINI=your_api_key_here
   ```

## Running the Server

```bash
python main.py
```

The server will start on `http://localhost:8000`

## Testing the API

### 1. Check if server is running:
```bash
curl http://localhost:8000/
```

Expected response:
```json
{"message": "Language Learning API is running"}
```

### 2. Create your first note:
```bash
curl -X POST http://localhost:8000/notes \
  -H "Content-Type: application/json" \
  -d '{"word": "objetivo", "translation": "target"}'
```

This will:
- Generate a contextual sentence using Gemini AI
- Create 4 audio files using ElevenLabs TTS
- Create 2 flashcards (forward and reverse)
- Save everything to `database.json`

### 3. Get all notes:
```bash
curl http://localhost:8000/notes
```

### 4. Get next card to study:
```bash
curl http://localhost:8000/study/next
```

### 5. Answer a card:
```bash
curl -X POST http://localhost:8000/study/answer \
  -H "Content-Type: application/json" \
  -d '{"card_id": 1, "rating": 3}'
```

Ratings:
- 1 = Again (forgot)
- 2 = Hard (difficult to remember)
- 3 = Good (remembered with hesitation)
- 4 = Easy (remembered easily)

### 6. Get statistics:
```bash
curl http://localhost:8000/stats
```

## Interactive API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## File Structure After Running

```
backend/
├── main.py                      # ✅ Created
├── database.py                  # ✅ Created
├── fsrs_controller.py           # ✅ Created
├── gemini_controller.py         # ✅ Created
├── elevenlabs_controller.py     # ✅ Created
├── requirements.txt             # ✅ Created
├── database.json               # Auto-created on first run
└── audio/                      # Audio files stored here
    ├── word_1.mp3
    ├── translation_1.mp3
    ├── sentence_1.mp3
    └── sentence_translation_1.mp3
```

## Troubleshooting

### Import Error: No module named 'fastapi'
```bash
pip install -r requirements.txt
```

### API Key Error
Make sure the `.env` file exists in the parent directory (one level up from backend):
```
c:\Users\Samu\Desktop\Coding\HackHarvard-2025\.env
```

### Port Already in Use
If port 8000 is already in use, you can change it in `main.py` (last line):
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Use port 8001 instead
```

### CORS Issues
CORS is currently set to allow all origins. For production, update the CORS settings in `main.py`.

## Development Mode

For development with auto-reload:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Next Steps

1. Test the `/notes` endpoint to create a few learning notes
2. Use `/study/next` to get cards for review
3. Practice with `/study/answer` to see FSRS scheduling in action
4. Check `/stats` to see all your data

Enjoy learning! 🚀

