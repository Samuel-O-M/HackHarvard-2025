import json
import os
from typing import Dict, Any
from threading import Lock

# File path for the database
DATABASE_FILE = os.path.join(os.path.dirname(__file__), 'database.json')

# Lock for thread-safe file operations
_file_lock = Lock()

def initialize_database():
    """
    Creates database.json if it doesn't exist with empty lists
    """
    if not os.path.exists(DATABASE_FILE):
        initial_data = {
            "learning_notes": [],
            "cards": [],
            "review_logs": []
        }
        with _file_lock:
            with open(DATABASE_FILE, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f, indent=2, ensure_ascii=False)

def read_data() -> Dict[str, Any]:
    """
    Reads data from database.json
    Returns a dictionary with learning_notes, cards, and review_logs
    """
    initialize_database()
    
    with _file_lock:
        try:
            with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Ensure all required keys exist
            if "learning_notes" not in data:
                data["learning_notes"] = []
            if "cards" not in data:
                data["cards"] = []
            if "review_logs" not in data:
                data["review_logs"] = []
            
            return data
        except json.JSONDecodeError:
            # If file is corrupted, reinitialize
            return {
                "learning_notes": [],
                "cards": [],
                "review_logs": []
            }

def write_data(data: Dict[str, Any]):
    """
    Writes data to database.json atomically
    """
    with _file_lock:
        # Write to a temporary file first
        temp_file = DATABASE_FILE + '.tmp'
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # Replace the original file
        if os.path.exists(DATABASE_FILE):
            os.replace(temp_file, DATABASE_FILE)
        else:
            os.rename(temp_file, DATABASE_FILE)

def get_next_id(data: Dict[str, Any], key: str) -> int:
    """
    Gets the next available ID for a given list (learning_notes, cards, or review_logs)
    """
    if not data[key]:
        return 1
    
    max_id = max(item.get('id', 0) for item in data[key])
    return max_id + 1

