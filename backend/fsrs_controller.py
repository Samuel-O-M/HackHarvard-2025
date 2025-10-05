from fsrs import Scheduler, Card, Rating, ReviewLog
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple

# Initialize the FSRS scheduler optimized for SHORT-TERM demo/exam prep
# Based on the FSRS Advanced Learner's Guide:
# - Higher desired_retention (0.92) = shorter intervals, more frequent reviews
# - Lower w[0-3] = shorter initial intervals for new cards
# - Lower maximum_interval (15 days) = suitable for demo/exam timeframe
# - Using proper FSRS default parameters for w[4-20]
scheduler = Scheduler(
    parameters=(
        # w[0-3]: Initial stability (days) for new cards - MOST IMPACTFUL for short intervals
        0.3,     # w[0] - "Again" rating: very short, same day (FSRS default: 0.2172)
        0.5,     # w[1] - "Hard" rating: short, same/next day (FSRS default: 1.1771)
        1.5,     # w[2] - "Good" rating: couple days (FSRS default: 3.2602)
        5.0,     # w[3] - "Easy" rating: longer but capped (FSRS default: 16.1507)
        # w[4-20]: FSRS defaults from millions of optimized reviews
        # These control difficulty adjustment, stability growth, saturation, penalties, etc.
        7.0114,  # w[4]  - Difficulty initial mean
        0.57,    # w[5]  - Difficulty decrease factor
        2.0966,  # w[6]  - Difficulty increase factor  
        0.0069,  # w[7]  - Difficulty mean reversion
        1.5261,  # w[8]  - Stability after success
        0.112,   # w[9]  - Stability after failure
        1.0178,  # w[10] - Stability decay
        1.849,   # w[11] - Stability growth
        0.1133,  # w[12] - Short-term memory factor
        0.3127,  # w[13] - Short-term memory factor
        2.2934,  # w[14] - Stability saturation (w: lower = more growth for mature cards)
        0.2191,  # w[15] - Hard penalty factor (< 1 reduces stability increase)
        3.0004,  # w[16] - Easy bonus factor (> 1 increases stability increase)
        0.7536,  # w[17] - Advanced parameter
        0.3332,  # w[18] - Advanced parameter
        0.1437,  # w[19] - Advanced parameter
        0.2,     # w[20] - Advanced parameter
    ),
    # Higher retention = shorter intervals (guide recommends 0.92-0.95 for exams/short-term)
    desired_retention=0.92,
    # Learning steps: Must be sub-day intervals (guide: "never leave blank, never use 1d+")
    learning_steps=(timedelta(minutes=1), timedelta(minutes=10)),
    # Relearning steps: Single short step for lapses (guide: FSRS handles lapses well)
    relearning_steps=(timedelta(minutes=10),),
    # Maximum interval: Hard cap for demo/exam context (guide: use deadline/2)
    # For demo purposes, using 15 days to ensure all cards reviewed multiple times in month
    maximum_interval=15,
    # Enable fuzzing: Adds small randomness to intervals for better distribution
    enable_fuzzing=True
)

def create_new_card() -> Dict[str, Any]:
    """
    Creates a new FSRS card and returns its dictionary representation
    """
    card = Card()
    return card.to_dict()

def review_card(card_dict: Dict[str, Any], rating: int, now: datetime = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Reviews a card with the given rating and returns updated card and review log
    
    Args:
        card_dict: Dictionary representation of an FSRS card
        rating: Integer from 1-4 representing the user's rating
        now: Optional datetime for the review (defaults to current time if not provided)
    
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
    
    # Review the card (pass 'now' parameter for backdated or current reviews)
    if now is not None:
        updated_card, review_log = scheduler.review_card(card, rating_enum, now)
    else:
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

def estimate_workload_for_retention(cards: list, target_retention: float) -> float:
    """
    Estimates the daily workload (number of reviews) for a given retention target.
    
    This uses the FSRS formula to calculate expected intervals at different retention
    levels and estimates the resulting daily review count.
    
    Higher retention → Shorter intervals → More reviews per day (higher workload)
    Lower retention → Longer intervals → Fewer reviews per day (lower workload)
    
    Args:
        cards: List of card dictionaries
        target_retention: Target retention rate (0.0 to 1.0)
    
    Returns:
        Estimated daily reviews as a float
    """
    if not cards:
        return 0.0
    
    # Calculate the average stability of all cards
    # Cards in different states contribute to overall workload differently
    total_interval = 0.0
    card_count = 0
    
    for card_data in cards:
        try:
            fsrs_card = card_data.get("fsrs_card", {})
            stability = fsrs_card.get("stability", 1.0)
            state = fsrs_card.get("state", 0)
            
            # For new cards (state 0), use initial stability estimates
            if state == 0:
                # New cards will be reviewed frequently initially
                stability = 1.0
            
            # FSRS formula: I(R) = S * (R^(-1/d) - 1) where:
            # - I is the interval in days
            # - S is stability
            # - R is retrievability (target_retention)
            # - d is decay constant (typically around 0.3 for FSRS)
            # 
            # Key insight: As R approaches 1 (high retention), R^(-1/d) gets smaller,
            # making the interval shorter, requiring more frequent reviews
            
            if target_retention > 0:
                # Use FSRS-like power law with negative exponent
                # This ensures: high retention → small interval → high workload
                decay_constant = 0.3  # FSRS typical value
                
                # Calculate R^(-1/d) - 1
                # When R is high (e.g., 0.99), R^(-1/0.3) = R^(-3.33) ≈ very small
                # When R is low (e.g., 0.70), R^(-3.33) ≈ larger
                power_term = target_retention ** (-1 / decay_constant)
                interval = stability * (power_term - 1)
                
                # Clamp to reasonable bounds
                # Minimum 0.5 days, maximum based on stability
                interval = max(0.5, min(interval, stability * 50))
            else:
                interval = stability
            
            total_interval += interval
            card_count += 1
            
        except (KeyError, TypeError, ValueError):
            # Skip cards with invalid data
            continue
    
    if card_count == 0:
        return 0.0
    
    # Average interval across all cards
    avg_interval = total_interval / card_count
    
    # Daily workload = number of cards / average interval
    # This gives us how many cards need review per day on average
    daily_workload = card_count / avg_interval if avg_interval > 0 else card_count
    
    return round(daily_workload, 2)

