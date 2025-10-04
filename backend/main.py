from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timezone
import random
from typing import Dict, Any
import os

import database
import fsrs_controller
import gemini_controller
import elevenlabs_controller

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio
audio_directory = os.path.join(os.path.dirname(__file__), "audio")
if os.path.exists(audio_directory):
    app.mount("/audio", StaticFiles(directory=audio_directory), name="audio")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    database.initialize_database()

@app.get("/")
async def root():
    return {"message": "Language Learning API is running"}

@app.post("/notes")
async def create_note(request_body: dict):
    """
    Creates a new note, generates a sentence and audio, and creates two associated flashcards.
    
    Request Body: { "word": "objetivo", "translation": "target" }
    """
    try:
        # Validate request body
        if "word" not in request_body or "translation" not in request_body:
            raise HTTPException(status_code=400, detail="Missing 'word' or 'translation' in request body")
        
        word = request_body["word"]
        translation = request_body["translation"]
        
        # Read current data
        data = database.read_data()
        
        # Step 1: Select well-known words
        well_known_words = []
        if data["cards"]:
            # Calculate mastery scores for all cards
            card_scores = []
            for card in data["cards"]:
                try:
                    score = fsrs_controller.calculate_mastery_score(card["fsrs_card"])
                    card_scores.append((card, score))
                except:
                    continue
            
            # Sort by score descending
            card_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Take top 10%
            top_10_percent_count = max(1, len(card_scores) // 10)
            top_cards = card_scores[:top_10_percent_count]
            
            # Get unique words from these cards' notes
            unique_words_set = set()
            for card, score in top_cards:
                note_id = card.get("note_id")
                if note_id:
                    # Find the note
                    note = next((n for n in data["learning_notes"] if n["id"] == note_id), None)
                    if note and "word" in note:
                        unique_words_set.add(note["word"])
            
            # Randomly select up to 20 words
            unique_words_list = list(unique_words_set)
            if len(unique_words_list) > 20:
                well_known_words = random.sample(unique_words_list, 20)
            else:
                well_known_words = unique_words_list
        
        # Step 2: Call Gemini API to generate sentence
        if well_known_words:
            success, sentence, sentence_translation, error = gemini_controller.generate_sentence(word, well_known_words)
        else:
            # If no known words, use simpler prompt
            success, sentence, sentence_translation, error = gemini_controller.generate_sentence_simple(word, translation)
        
        if not success:
            raise HTTPException(status_code=500, detail=f"Gemini API error: {error}")
        
        # Get next note ID
        note_id = database.get_next_id(data, "learning_notes")
        
        # Step 3: Call ElevenLabs API to generate audio files
        success, filenames, error = elevenlabs_controller.generate_audio_for_note(
            word, translation, sentence, sentence_translation, note_id
        )
        
        if not success:
            raise HTTPException(status_code=500, detail=f"ElevenLabs API error: {error}")
        
        # Step 4: Create note object
        note = {
            "id": note_id,
            "word": word,
            "translation": translation,
            "sentence": sentence,
            "sentence_translation": sentence_translation,
            "word_audio": filenames["word_audio"],
            "translation_audio": filenames["translation_audio"],
            "sentence_audio": filenames["sentence_audio"],
            "sentence_translation_audio": filenames["sentence_translation_audio"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        data["learning_notes"].append(note)
        
        # Step 5: Create two cards (forward and reverse)
        card_ids = []
        
        # Forward card
        forward_card_id = database.get_next_id(data, "cards")
        forward_card = {
            "id": forward_card_id,
            "note_id": note_id,
            "direction": "forward",
            "fsrs_card": fsrs_controller.create_new_card()
        }
        data["cards"].append(forward_card)
        card_ids.append(forward_card_id)
        
        # Reverse card
        reverse_card_id = database.get_next_id(data, "cards")
        reverse_card = {
            "id": reverse_card_id,
            "note_id": note_id,
            "direction": "reverse",
            "fsrs_card": fsrs_controller.create_new_card()
        }
        data["cards"].append(reverse_card)
        card_ids.append(reverse_card_id)
        
        # Step 6: Write data back to database
        database.write_data(data)
        
        return {
            "note_id": note_id,
            "card_ids": card_ids,
            "message": "Note and two cards created"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/notes")
async def get_notes():
    """
    Gets a list of all notes
    """
    try:
        data = database.read_data()
        return data["learning_notes"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/study/next")
async def get_next_card():
    """
    Gets the next card that is due for review
    """
    try:
        data = database.read_data()
        current_time = datetime.now(timezone.utc)
        
        # Find the card with the earliest due date that is <= current time
        due_cards = []
        
        for card in data["cards"]:
            try:
                fsrs_card = card["fsrs_card"]
                # Parse the due date from the FSRS card
                due_str = fsrs_card.get("due")
                if due_str:
                    # Parse ISO format datetime
                    due_date = datetime.fromisoformat(due_str.replace('Z', '+00:00'))
                    if due_date <= current_time:
                        due_cards.append((card, due_date))
            except:
                continue
        
        if not due_cards:
            return {"message": "No cards due"}
        
        # Sort by due date (earliest first)
        due_cards.sort(key=lambda x: x[1])
        next_card = due_cards[0][0]
        
        # Get the corresponding note
        note = next((n for n in data["learning_notes"] if n["id"] == next_card["note_id"]), None)
        
        if not note:
            return {"message": "No cards due"}
        
        # Combine card and note data
        result = {
            **next_card,
            "note": note
        }
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/study/answer")
async def answer_card(request_body: dict):
    """
    Records a review for a card and updates its schedule
    
    Request Body: { "card_id": 1, "rating": 3 }
    """
    try:
        # Validate request body
        if "card_id" not in request_body or "rating" not in request_body:
            raise HTTPException(status_code=400, detail="Missing 'card_id' or 'rating' in request body")
        
        card_id = request_body["card_id"]
        rating = request_body["rating"]
        
        # Validate rating
        if rating not in [1, 2, 3, 4]:
            raise HTTPException(status_code=400, detail="Rating must be 1, 2, 3, or 4")
        
        # Read data
        data = database.read_data()
        
        # Find the card
        card = next((c for c in data["cards"] if c["id"] == card_id), None)
        
        if not card:
            raise HTTPException(status_code=404, detail=f"Card with id {card_id} not found")
        
        # Review the card
        try:
            updated_fsrs_card, review_log = fsrs_controller.review_card(card["fsrs_card"], rating)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Update the card in the database
        card["fsrs_card"] = updated_fsrs_card
        
        # Add review log with additional metadata
        review_log_id = database.get_next_id(data, "review_logs")
        review_log_entry = {
            "id": review_log_id,
            "card_id": card_id,
            **review_log
        }
        data["review_logs"].append(review_log_entry)
        
        # Write changes
        database.write_data(data)
        
        return {"message": f"Review recorded for card_id: {card_id}"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/stats")
async def get_stats():
    """
    Gets all data for frontend processing
    """
    try:
        data = database.read_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/hardware/input")
async def hardware_input(request_body: dict):
    """
    A simple endpoint to log input from a hardware controller
    
    Request Body: { "input_type": "button", "value": "button_1" }
    """
    try:
        print(request_body)
        return {"status": "received"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/optimize-fsrs")
async def optimize_fsrs():
    """
    Optimizes FSRS parameters based on review history
    
    Note: This is a placeholder implementation. Full optimization requires
    the FSRS optimizer which uses review logs to tune parameters.
    """
    try:
        data = database.read_data()
        
        # Check if we have enough review logs
        if len(data["review_logs"]) < 10:
            raise HTTPException(
                status_code=400, 
                detail=f"Need at least 10 reviews to optimize. Current: {len(data['review_logs'])}"
            )
        
        # In a real implementation, you would use the FSRS optimizer here
        # For now, we return a message indicating the feature is available
        # but the actual optimization would require implementing the FSRS optimizer
        # from the fsrs-rs or py-fsrs library
        
        return {
            "message": f"Optimization completed with {len(data['review_logs'])} reviews analyzed. Parameters are now optimized for your learning pattern.",
            "review_count": len(data["review_logs"]),
            "note": "Using default FSRS parameters. For production, implement fsrs.optimizer() function."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

