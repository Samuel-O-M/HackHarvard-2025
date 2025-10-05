"""
Dummy Data Generator for Language Learning App Demo

This script:
1. Clears the database.json file and audio directory
2. Creates 50 Spanish words with A1-level sentences using Gemini API
3. Generates audio files using ElevenLabs API
4. Generates fake review logs between September 3 and October 3, 2025

Usage: python gen_dummy_data.py
"""

import random
import time
import os
import glob
from datetime import datetime, timezone, timedelta
import database
import gemini_controller
import elevenlabs_controller
import fsrs_controller

# 50 common Spanish A1 words with translations
SPANISH_WORDS = [
    ("hola", "hello"),
    ("adiós", "goodbye"),
    ("gracias", "thank you"),
    ("por favor", "please"),
    ("sí", "yes"),
    ("no", "no"),
    ("agua", "water"),
    ("comida", "food"),
    ("casa", "house"),
    ("perro", "dog"),
    ("gato", "cat"),
    ("libro", "book"),
    ("mesa", "table"),
    ("silla", "chair"),
    ("puerta", "door"),
    ("ventana", "window"),
    ("día", "day"),
    ("noche", "night"),
    ("sol", "sun"),
    ("luna", "moon"),
    ("amigo", "friend"),
    ("familia", "family"),
    ("madre", "mother"),
    ("padre", "father"),
    ("hermano", "brother"),
    ("hermana", "sister"),
    ("escuela", "school"),
    ("trabajo", "work"),
    ("calle", "street"),
    ("ciudad", "city"),
    ("país", "country"),
    ("mundo", "world"),
    ("tiempo", "time"),
    ("año", "year"),
    ("mes", "month"),
    ("semana", "week"),
    ("hora", "hour"),
    ("minuto", "minute"),
    ("nombre", "name"),
    ("edad", "age"),
    ("niño", "child"),
    ("hombre", "man"),
    ("mujer", "woman"),
    ("chico", "boy"),
    ("chica", "girl"),
    ("grande", "big"),
    ("pequeño", "small"),
    ("bueno", "good"),
    ("malo", "bad"),
    ("feliz", "happy")
]

def clear_audio_directory():
    """Deletes all audio files from the audio directory"""
    print("🗑️  Clearing audio directory...")
    audio_dir = os.path.join(os.path.dirname(__file__), 'audio')
    
    # Create directory if it doesn't exist
    os.makedirs(audio_dir, exist_ok=True)
    
    # Delete all .mp3 files
    audio_files = glob.glob(os.path.join(audio_dir, '*.mp3'))
    deleted_count = 0
    for audio_file in audio_files:
        try:
            os.remove(audio_file)
            deleted_count += 1
        except Exception as e:
            print(f"⚠️  Warning: Could not delete {audio_file}: {e}")
    
    print(f"✅ Deleted {deleted_count} audio files")

def clear_database():
    """Clears the database by writing empty lists"""
    print("🗑️  Clearing database...")
    data = {
        "learning_notes": [],
        "cards": [],
        "review_logs": []
    }
    database.write_data(data)
    print("✅ Database cleared")

def create_note_with_cards(word, translation, note_id, creation_date):
    """
    Creates a learning note with two cards (forward and reverse)
    Uses Gemini to generate A1-level sentence and ElevenLabs to generate audio
    """
    print(f"📝 Creating note for '{word}'...")
    
    # Generate sentence using Gemini (A1 level, no known words)
    success, sentence, sentence_translation, error = gemini_controller.generate_sentence_simple(word, translation)
    
    # Wait 10 seconds to avoid quota limits
    time.sleep(10)
    
    if not success:
        print(f"❌ Failed to generate sentence for '{word}': {error}")
        print(f"   Using fallback sentence...")
        sentence = f"El {word} es importante."
        sentence_translation = f"The {translation} is important."
    
    # Generate audio files using ElevenLabs
    print(f"🔊 Generating audio for '{word}'...")
    audio_success, filenames, audio_error = elevenlabs_controller.generate_audio_for_note(
        word, translation, sentence, sentence_translation, note_id
    )
    
    if not audio_success:
        print(f"❌ Failed to generate audio for '{word}': {audio_error}")
        # Use placeholder filenames if audio generation fails
        filenames = {
            "word_audio": f"word_{note_id}.mp3",
            "translation_audio": f"translation_{note_id}.mp3",
            "sentence_audio": f"sentence_{note_id}.mp3",
            "sentence_translation_audio": f"sentence_translation_{note_id}.mp3"
        }
    
    # Create note with audio files
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
        "created_at": creation_date.isoformat()
    }
    
    # Create forward card
    forward_card_id = note_id * 2 - 1
    forward_card = {
        "id": forward_card_id,
        "note_id": note_id,
        "direction": "forward",
        "fsrs_card": fsrs_controller.create_new_card()
    }
    # Update the due date to match creation date
    forward_card["fsrs_card"]["due"] = creation_date.isoformat()
    
    # Create reverse card
    reverse_card_id = note_id * 2
    reverse_card = {
        "id": reverse_card_id,
        "note_id": note_id,
        "direction": "reverse",
        "fsrs_card": fsrs_controller.create_new_card()
    }
    # Update the due date to match creation date
    reverse_card["fsrs_card"]["due"] = creation_date.isoformat()
    
    return note, forward_card, reverse_card

def generate_card_difficulty_profile():
    """
    Generates a difficulty profile for a card - determines the likelihood of different ratings
    
    Returns:
        tuple: (weights for [Again, Hard, Good, Easy], profile_name)
    """
    profile_type = random.random()
    
    if profile_type < 0.20:  # 20% - Very Easy Cards (user knows these well)
        return [5, 10, 35, 50], "easy"
    elif profile_type < 0.40:  # 20% - Hard Cards (user struggles with these)
        return [40, 35, 20, 5], "hard"
    elif profile_type < 0.60:  # 20% - Medium-Hard Cards
        return [25, 35, 30, 10], "medium-hard"
    elif profile_type < 0.80:  # 20% - Medium-Easy Cards
        return [10, 20, 45, 25], "medium-easy"
    else:  # 20% - Average Cards
        return [15, 25, 40, 20], "average"

def generate_review_logs(cards, start_date, end_date):
    """
    Generates fake review logs for cards between start_date and end_date
    Simulates realistic study patterns with varied difficulty per card
    """
    print(f"📊 Generating review logs from {start_date.date()} to {end_date.date()}...")
    
    review_logs = []
    review_log_id = 1
    
    profile_stats = {"easy": 0, "hard": 0, "medium-hard": 0, "medium-easy": 0, "average": 0}
    
    for card in cards:
        card_dict = card.copy()
        
        weights, profile_name = generate_card_difficulty_profile()
        profile_stats[profile_name] += 1
        
        if profile_name == "easy":
            num_reviews = random.randint(3, 8)
        elif profile_name == "hard":
            num_reviews = random.randint(5, 12)
        else:
            num_reviews = random.randint(3, 9)
        
        # Get card creation date
        initial_due = card_dict["fsrs_card"].get("due", "")
        try:
            card_creation_date = datetime.fromisoformat(initial_due.replace('Z', '+00:00'))
        except:
            card_creation_date = start_date
        
        last_review_time = None

        for review_num in range(num_reviews):
            # Calculate the base date for this review
            if review_num == 0:
                # First review happens within the first 2 days
                base_date = card_creation_date + timedelta(days=random.uniform(0, 2))
            else:
                # Subsequent reviews are based on the FSRS due date
                due_str = card_dict["fsrs_card"].get("due", "")
                if due_str:
                    try:
                        base_date = datetime.fromisoformat(due_str.replace('Z', '+00:00'))
                    except (ValueError, TypeError):
                        # Fallback if due date is invalid
                        base_date = last_review_time + timedelta(days=random.uniform(0.5, 3)) if last_review_time else card_creation_date
                else:
                    base_date = last_review_time + timedelta(days=random.uniform(0.5, 3)) if last_review_time else card_creation_date

            # Add jitter to simulate user reviewing early or late
            review_date = base_date + timedelta(days=random.uniform(-0.3, 0.5))
            
            # Add a realistic random time of day
            hour = random.choices(
                list(range(8, 23)),
                weights=[5, 10, 8, 6, 5, 4, 6, 8, 10, 12, 15, 18, 12, 8, 5]
            )[0]
            minute = random.randint(0, 59)
            review_datetime = review_date.replace(hour=hour, minute=minute, second=random.randint(0, 59))

            if review_datetime > end_date:
                break
            
            rating = random.choices([1, 2, 3, 4], weights=weights)[0]
            
            updated_fsrs_card, review_log = fsrs_controller.review_card(card_dict["fsrs_card"], rating)
            
            card_dict["fsrs_card"] = updated_fsrs_card
            
            review_log["review_datetime"] = review_datetime.isoformat()
            
            review_log_entry = {
                "id": review_log_id,
                "card_id": card_dict["id"],
                **review_log
            }
            review_logs.append(review_log_entry)
            review_log_id += 1
            last_review_time = review_datetime
        
        card["fsrs_card"] = card_dict["fsrs_card"]
    
    print(f"✅ Generated {len(review_logs)} review logs")
    print(f"📈 Card difficulty distribution:")
    total_cards = len(cards)
    if total_cards > 0:
        print(f"   - Easy learners: {profile_stats['easy']} cards ({profile_stats['easy']/total_cards*100:.1f}%)")
        print(f"   - Hard learners: {profile_stats['hard']} cards ({profile_stats['hard']/total_cards*100:.1f}%)")
        print(f"   - Medium-hard: {profile_stats['medium-hard']} cards ({profile_stats['medium-hard']/total_cards*100:.1f}%)")
        print(f"   - Medium-easy: {profile_stats['medium-easy']} cards ({profile_stats['medium-easy']/total_cards*100:.1f}%)")
        print(f"   - Average: {profile_stats['average']} cards ({profile_stats['average']/total_cards*100:.1f}%)")
    
    return review_logs

def main():
    """Main function to generate dummy data"""
    print("🚀 Starting dummy data generation...")
    print("=" * 60)
    
    # Step 1: Clear audio directory and database
    clear_audio_directory()
    print()
    clear_database()
    print()
    
    # Step 2: Set date range for reviews
    # September 3, 2025 to October 3, 2025
    start_date = datetime(2025, 9, 3, 8, 0, 0, tzinfo=timezone.utc)
    end_date = datetime(2025, 10, 3, 22, 0, 0, tzinfo=timezone.utc)
    
    # Step 3: Create notes and cards
    notes = []
    cards = []
    
    for idx, (word, translation) in enumerate(SPANISH_WORDS, start=1):
        # Spread out creation dates over the first day
        hours_offset = (idx - 1) * 0.3  # About 18 minutes apart
        creation_date = start_date + timedelta(hours=hours_offset)
        
        note, forward_card, reverse_card = create_note_with_cards(
            word, translation, idx, creation_date
        )
        
        notes.append(note)
        cards.append(forward_card)
        cards.append(reverse_card)
    
    print()
    print(f"✅ Created {len(notes)} notes and {len(cards)} cards")
    print()
    
    # Step 4: Generate review logs
    review_logs = generate_review_logs(cards, start_date, end_date)
    print()
    
    # Step 5: Write everything to database
    print("💾 Writing data to database.json...")
    data = {
        "learning_notes": notes,
        "cards": cards,
        "review_logs": review_logs
    }
    database.write_data(data)
    
    print("=" * 60)
    print("✅ Dummy data generation complete!")
    print(f"📊 Summary:")
    print(f"   - {len(notes)} learning notes")
    print(f"   - {len(cards)} cards")
    print(f"   - {len(review_logs)} review logs")
    print(f"   - Review period: {start_date.date()} to {end_date.date()}")
    print()
    print("🎉 Your app is ready for a demo!")

if __name__ == "__main__":
    main()

