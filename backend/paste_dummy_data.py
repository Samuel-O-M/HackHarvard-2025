"""
Paste Dummy Data Script

This script:
1. Clears database.json and audio directory
2. Copies dummy_database.json to database.json
3. Copies all files from dummy_audio/ to audio/

This is useful for quickly setting up a demo environment without calling APIs.

Usage: python paste_dummy_data.py
"""

import json
import os
import shutil
import glob

# Paths
SCRIPT_DIR = os.path.dirname(__file__)
DATABASE_FILE = os.path.join(SCRIPT_DIR, 'database.json')
DUMMY_DATABASE_FILE = os.path.join(SCRIPT_DIR, 'dummy_database.json')
AUDIO_DIR = os.path.join(SCRIPT_DIR, 'audio')
DUMMY_AUDIO_DIR = os.path.join(SCRIPT_DIR, 'dummy_audio')

def clear_audio_directory():
    """Deletes all audio files from the audio directory"""
    print("🗑️  Clearing audio directory...")
    
    # Create directory if it doesn't exist
    os.makedirs(AUDIO_DIR, exist_ok=True)
    
    # Delete all .mp3 files
    audio_files = glob.glob(os.path.join(AUDIO_DIR, '*.mp3'))
    deleted_count = 0
    for audio_file in audio_files:
        try:
            os.remove(audio_file)
            deleted_count += 1
        except Exception as e:
            print(f"⚠️  Warning: Could not delete {audio_file}: {e}")
    
    print(f"✅ Deleted {deleted_count} audio files")

def copy_database():
    """Copies dummy_database.json to database.json"""
    print("📄 Copying dummy_database.json to database.json...")
    
    if not os.path.exists(DUMMY_DATABASE_FILE):
        print(f"❌ Error: {DUMMY_DATABASE_FILE} not found!")
        return False
    
    try:
        shutil.copy2(DUMMY_DATABASE_FILE, DATABASE_FILE)
        print("✅ Database copied successfully")
        return True
    except Exception as e:
        print(f"❌ Error copying database: {e}")
        return False

def copy_audio_files():
    """Copies all audio files from dummy_audio/ to audio/"""
    print("🔊 Copying audio files from dummy_audio/ to audio/...")
    
    if not os.path.exists(DUMMY_AUDIO_DIR):
        print(f"❌ Error: {DUMMY_AUDIO_DIR} directory not found!")
        return False
    
    # Create audio directory if it doesn't exist
    os.makedirs(AUDIO_DIR, exist_ok=True)
    
    # Get all .mp3 files from dummy_audio
    dummy_audio_files = glob.glob(os.path.join(DUMMY_AUDIO_DIR, '*.mp3'))
    
    if not dummy_audio_files:
        print("⚠️  Warning: No audio files found in dummy_audio/")
        return True
    
    copied_count = 0
    for audio_file in dummy_audio_files:
        try:
            filename = os.path.basename(audio_file)
            destination = os.path.join(AUDIO_DIR, filename)
            shutil.copy2(audio_file, destination)
            copied_count += 1
        except Exception as e:
            print(f"⚠️  Warning: Could not copy {audio_file}: {e}")
    
    print(f"✅ Copied {copied_count} audio files")
    return True

def main():
    """Main function to paste demo data"""
    print("🚀 Starting paste dummy data...")
    print("=" * 60)
    
    # Step 1: Clear audio directory
    clear_audio_directory()
    print()
    
    # Step 2: Copy database from dummy_database.json
    if not copy_database():
        print("❌ Failed to copy database. Aborting.")
        return
    print()
    
    # Step 3: Copy audio files from dummy_audio/
    if not copy_audio_files():
        print("⚠️  Audio files not copied, but continuing...")
    print()
    
    # Step 4: Read the copied database to show summary
    try:
        with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print("=" * 60)
        print("✅ Dummy data pasted successfully!")
        print(f"📊 Summary:")
        print(f"   - {len(data.get('learning_notes', []))} learning notes")
        print(f"   - {len(data.get('cards', []))} cards")
        print(f"   - {len(data.get('review_logs', []))} review logs")
        print()
        print("🎉 Your app is ready for a demo!")
    except Exception as e:
        print(f"⚠️  Could not read database for summary: {e}")

if __name__ == "__main__":
    main()
