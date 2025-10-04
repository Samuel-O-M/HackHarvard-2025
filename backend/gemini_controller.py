import os
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Tuple, List

GEMINI_CLIENT = None

def initialize_client():
    """
    Initializes the Gemini API client
    """
    global GEMINI_CLIENT
    if GEMINI_CLIENT is None:
        try:
            load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
            api_key = os.getenv("GEMINI")
            if not api_key:
                raise ValueError("GEMINI API key not found in environment variables.")
            
            genai.configure(api_key=api_key)
            GEMINI_CLIENT = genai.GenerativeModel('gemini-pro')
        except Exception as e:
            raise ConnectionError(f"Failed to initialize Gemini client: {e}") from e

def generate_sentence(target_word: str, known_words: List[str]) -> Tuple[bool, str, str, str]:
    """
    Generates a sentence using the target word and known words
    
    Args:
        target_word: The word that must be in the sentence
        known_words: List of words the learner knows well
    
    Returns:
        Tuple of (success, sentence_with_asterisks, sentence_translation, error_message)
    """
    if not GEMINI_CLIENT:
        try:
            initialize_client()
        except ConnectionError as e:
            return False, "", "", str(e)
    
    try:
        # Construct the prompt
        known_words_str = ", ".join(known_words) if known_words else "none"
        prompt = f"""you are constructing a sentence for a language learner. the target word is "{target_word}" so it must be in the sentence. these are some words that the learner knows well: {known_words_str}. now give a sentence with around 10 words that has some of the words of the list and the target sentence. bold the target sentence using *word*. also provide a translation of the sentence on a new line."""
        
        # Generate content
        response = GEMINI_CLIENT.generate_content(prompt)
        
        if not response or not response.text:
            return False, "", "", "Empty response from Gemini API"
        
        # Parse the response
        response_text = response.text.strip()
        lines = response_text.split('\n')
        
        # Filter out empty lines
        lines = [line.strip() for line in lines if line.strip()]
        
        if len(lines) < 2:
            return False, "", "", "Gemini response did not contain both sentence and translation"
        
        sentence_with_asterisks = lines[0]
        sentence_translation = lines[1]
        
        return True, sentence_with_asterisks, sentence_translation, ""
    
    except Exception as e:
        return False, "", "", f"An error occurred while generating sentence: {e}"

def generate_sentence_simple(target_word: str, translation: str) -> Tuple[bool, str, str, str]:
    """
    Generates a sentence using just the target word and translation (no known words)
    
    Args:
        target_word: The word that must be in the sentence
        translation: The English translation of the target word
    
    Returns:
        Tuple of (success, sentence_with_asterisks, sentence_translation, error_message)
    """
    if not GEMINI_CLIENT:
        try:
            initialize_client()
        except ConnectionError as e:
            return False, "", "", str(e)
    
    try:
        prompt = f"""you are constructing a sentence for a language learner. the target word is "{target_word}" (which means "{translation}" in English) so it must be in the sentence. create a simple sentence with around 10 words that uses the target word. bold the target word using *word*. also provide an English translation of the sentence on a new line."""
        
        response = GEMINI_CLIENT.generate_content(prompt)
        
        if not response or not response.text:
            return False, "", "", "Empty response from Gemini API"
        
        response_text = response.text.strip()
        lines = response_text.split('\n')
        lines = [line.strip() for line in lines if line.strip()]
        
        if len(lines) < 2:
            return False, "", "", "Gemini response did not contain both sentence and translation"
        
        sentence_with_asterisks = lines[0]
        sentence_translation = lines[1]
        
        return True, sentence_with_asterisks, sentence_translation, ""
    
    except Exception as e:
        return False, "", "", f"An error occurred while generating sentence: {e}"

