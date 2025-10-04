from fsrs import Scheduler, Card, Rating, ReviewLog
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

# Initialize the FSRS scheduler with default parameters
scheduler = Scheduler()

def create_new_card() -> Dict[str, Any]:
    """
    Creates a new FSRS card and returns its dictionary representation
    """
    card = Card()
    return card.to_dict()

def review_card(card_dict: Dict[str, Any], rating: int) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Reviews a card with the given rating and returns updated card and review log
    
    Args:
        card_dict: Dictionary representation of an FSRS card
        rating: Integer from 1-4 representing the user's rating
    
    Returns:
        Tuple of (updated_card_dict, review_log_dict)
    """
    # Deserialize the card
    card = Card.from_dict(card_dict)
    
    # Convert rating integer to Rating enum
    rating_map = {
        1: Rating.Again,
        2: Rating.Hard,
        3: Rating.Good,
        4: Rating.Easy
    }
    
    if rating not in rating_map:
        raise ValueError(f"Invalid rating: {rating}. Must be 1-4.")
    
    rating_enum = rating_map[rating]
    
    # Review the card
    updated_card, review_log = scheduler.review_card(card, rating_enum)
    
    # Return serialized versions
    return updated_card.to_dict(), review_log.to_dict()

def get_card_retrievability(card_dict: Dict[str, Any]) -> float:
    """
    Calculates the current retrievability of a card
    
    Args:
        card_dict: Dictionary representation of an FSRS card
    
    Returns:
        Float between 0 and 1 representing retrievability probability
    """
    card = Card.from_dict(card_dict)
    return scheduler.get_card_retrievability(card)

def calculate_mastery_score(card_dict: Dict[str, Any]) -> float:
    """
    Calculates a mastery score for a card based on stability and retrievability
    
    Args:
        card_dict: Dictionary representation of an FSRS card
    
    Returns:
        Float representing the mastery score
    """
    card = Card.from_dict(card_dict)
    retrievability = scheduler.get_card_retrievability(card)
    stability = card.stability
    
    # Mastery score is the product of retrievability and stability
    return retrievability * stability

def is_card_due(card_dict: Dict[str, Any]) -> bool:
    """
    Checks if a card is due for review
    
    Args:
        card_dict: Dictionary representation of an FSRS card
    
    Returns:
        Boolean indicating if the card is due
    """
    card = Card.from_dict(card_dict)
    current_time = datetime.now(timezone.utc)
    return card.due <= current_time

