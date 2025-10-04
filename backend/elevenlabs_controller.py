import os
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from typing import Tuple

ELEVENLABS_CLIENT = None

def initialize_client():
    """
    Initializes the ElevenLabs API client
    """
    global ELEVENLABS_CLIENT
    if ELEVENLABS_CLIENT is None:
        try:
            load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
            api_key = os.getenv("ELEVENLABS")
            if not api_key:
                raise ValueError("ELEVENLABS API key not found in environment variables.")
            ELEVENLABS_CLIENT = ElevenLabs(api_key=api_key)
        except Exception as e:
            raise ConnectionError(f"Failed to initialize ElevenLabs client: {e}") from e

def generate_audio(text: str, filename: str) -> Tuple[bool, str]:
    """
    Generates audio from text and saves it to a file
    
    Args:
        text: The text to convert to speech
        filename: The filename to save the audio (e.g., "word_1.mp3")
    
    Returns:
        Tuple of (success, message)
    """
    if not ELEVENLABS_CLIENT:
        try:
            initialize_client()
        except ConnectionError as e:
            return False, str(e)

    output_dir = os.path.join(os.path.dirname(__file__), "audio")
    
    try:
        os.makedirs(output_dir, exist_ok=True)
    except OSError as e:
        return False, f"Failed to create directory '{output_dir}': {e}"

    file_path = os.path.join(output_dir, filename)
    
    try:
        audio_stream = ELEVENLABS_CLIENT.text_to_speech.convert(
            text=text,
            voice_id="21m00Tcm4TlvDq8ikWAM",
            model_id="eleven_multilingual_v2"
        )

        with open(file_path, "wb") as f:
            for chunk in audio_stream:
                if chunk:
                    f.write(chunk)
        
        return True, f"Successfully saved audio to {file_path}"

    except Exception as e:
        return False, f"An error occurred: {e}"

def generate_audio_for_note(word: str, translation: str, sentence: str, 
                           sentence_translation: str, note_id: int) -> Tuple[bool, dict, str]:
    """
    Generates audio files for all components of a note
    
    Args:
        word: The target word
        translation: The word translation
        sentence: The sentence (with or without asterisks)
        sentence_translation: The sentence translation
        note_id: The ID of the note (used for unique filenames)
    
    Returns:
        Tuple of (success, filenames_dict, error_message)
        filenames_dict contains keys: word_audio, translation_audio, 
                                      sentence_audio, sentence_translation_audio
    """
    filenames = {}
    
    # Remove asterisks from sentence for audio generation
    sentence_clean = sentence.replace('*', '')
    
    # Generate word audio
    success, message = generate_audio(word, f"word_{note_id}.mp3")
    if not success:
        return False, {}, f"Failed to generate word audio: {message}"
    filenames['word_audio'] = f"word_{note_id}.mp3"
    
    # Generate translation audio
    success, message = generate_audio(translation, f"translation_{note_id}.mp3")
    if not success:
        return False, {}, f"Failed to generate translation audio: {message}"
    filenames['translation_audio'] = f"translation_{note_id}.mp3"
    
    # Generate sentence audio
    success, message = generate_audio(sentence_clean, f"sentence_{note_id}.mp3")
    if not success:
        return False, {}, f"Failed to generate sentence audio: {message}"
    filenames['sentence_audio'] = f"sentence_{note_id}.mp3"
    
    # Generate sentence translation audio
    success, message = generate_audio(sentence_translation, f"sentence_translation_{note_id}.mp3")
    if not success:
        return False, {}, f"Failed to generate sentence translation audio: {message}"
    filenames['sentence_translation_audio'] = f"sentence_translation_{note_id}.mp3"
    
    return True, filenames, ""

