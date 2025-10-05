"""
Regenerate Review Logs Only

This script:
1. Reads the existing database.json
2. Keeps all learning_notes and cards as-is
3. Resets the FSRS state of all cards to their initial state (based on creation date)
4. Deletes all review_logs
5. Regenerates review logs using realistic review patterns

Usage: python gen_dummy_logs.py [--debug or -d for detailed output]
"""

import random
from datetime import datetime, timezone, timedelta
import database
import fsrs_controller

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

def generate_review_logs(cards, start_date, end_date, debug=False):
    """
    Generates fake review logs for cards between start_date and end_date
    Simulates realistic study patterns with varied difficulty per card
    """
    print(f"📊 Generating review logs from {start_date.date()} to {end_date.date()}...")
    if debug:
        print(f"   Total duration: {(end_date - start_date).days} days")
    print()
    
    review_logs = []
    review_log_id = 1
    
    profile_stats = {"easy": 0, "hard": 0, "medium-hard": 0, "medium-easy": 0, "average": 0}
    
    for card_idx, card in enumerate(cards, 1):
        card_dict = card.copy()
        card_id = card_dict["id"]
        
        weights, profile_name = generate_card_difficulty_profile()
        profile_stats[profile_name] += 1
        
        if profile_name == "easy":
            num_reviews = random.randint(3, 8)
        elif profile_name == "hard":
            num_reviews = random.randint(5, 12)
        else:
            num_reviews = random.randint(3, 9)
        
        if debug:
            print(f"Card {card_id} (#{card_idx}/{len(cards)}): Profile={profile_name}, Target reviews={num_reviews}")
        
        # Get the initial due date for this card
        initial_due = card_dict["fsrs_card"].get("due", "")
        try:
            card_creation_date = datetime.fromisoformat(initial_due.replace('Z', '+00:00'))
        except:
            card_creation_date = start_date
        
        if debug:
            print(f"  Card created at: {card_creation_date.strftime('%Y-%m-%d %H:%M')}")
        
        last_review_time = None
        reviews_completed = 0

        for review_num in range(num_reviews):
            # Calculate the base date for this review
            if review_num == 0:
                # First review happens within the first 2 days after card creation
                days_offset = random.uniform(0, 2)
                base_date = card_creation_date + timedelta(days=days_offset)
                
                if debug:
                    print(f"  Review {review_num + 1}: First review, offset={days_offset:.2f} days")
                    print(f"    Base date: {base_date.strftime('%Y-%m-%d %H:%M')}")
            else:
                # Subsequent reviews are based on the FSRS due date
                due_str = card_dict["fsrs_card"].get("due", "")
                if due_str:
                    try:
                        fsrs_due = datetime.fromisoformat(due_str.replace('Z', '+00:00'))
                        base_date = fsrs_due
                        
                        if debug:
                            print(f"  Review {review_num + 1}: Using FSRS due date")
                            print(f"    Due: {fsrs_due.strftime('%Y-%m-%d %H:%M')}")
                    except (ValueError, TypeError):
                        # Fallback if due date is invalid
                        fallback_days = random.uniform(0.5, 3)
                        base_date = last_review_time + timedelta(days=fallback_days) if last_review_time else card_creation_date
                        
                        if debug:
                            print(f"  Review {review_num + 1}: Due invalid, using fallback +{fallback_days:.2f} days")
                else:
                    fallback_days = random.uniform(0.5, 3)
                    base_date = last_review_time + timedelta(days=fallback_days) if last_review_time else card_creation_date
                    
                    if debug:
                        print(f"  Review {review_num + 1}: No due, using fallback +{fallback_days:.2f} days")

            # Add jitter to simulate user reviewing early or late
            jitter_days = random.uniform(-0.3, 0.5)
            review_date = base_date + timedelta(days=jitter_days)
            
            if debug:
                print(f"    Base + jitter({jitter_days:.2f}): {review_date.strftime('%Y-%m-%d %H:%M')}")
            
            # Add a realistic random time of day
            hour = random.choices(
                list(range(8, 23)),
                weights=[5, 10, 8, 6, 5, 4, 6, 8, 10, 12, 15, 18, 12, 8, 5]
            )[0]
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            
            try:
                review_datetime = review_date.replace(hour=hour, minute=minute, second=second)
            except ValueError:
                # Handle edge case where date is invalid
                review_datetime = review_date
            
            if debug:
                print(f"    Final datetime: {review_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Check if review is beyond end_date
            if review_datetime > end_date:
                if debug:
                    print(f"    ❌ Beyond end_date ({end_date.strftime('%Y-%m-%d')}), stopping reviews for this card")
                break
            
            # Check if review is before start_date (shouldn't happen but safety check)
            if review_datetime < start_date:
                if debug:
                    print(f"    ⚠️  Before start_date, adjusting to start_date")
                review_datetime = start_date + timedelta(hours=random.randint(0, 12))
            
            if debug:
                print(f"    ✅ Review scheduled")
            
            rating = random.choices([1, 2, 3, 4], weights=weights)[0]
            
            if debug:
                print(f"    Rating: {rating} ({'Again' if rating == 1 else 'Hard' if rating == 2 else 'Good' if rating == 3 else 'Easy'})")
            
            # Review the card using FSRS with the backdated review_datetime
            # This ensures FSRS calculates intervals from the simulated time, not current time
            updated_fsrs_card, review_log = fsrs_controller.review_card(card_dict["fsrs_card"], rating, review_datetime)
            
            if debug:
                new_due = updated_fsrs_card.get("due", "")
                if new_due:
                    try:
                        new_due_dt = datetime.fromisoformat(new_due.replace('Z', '+00:00'))
                        days_until_next = (new_due_dt - review_datetime).total_seconds() / 86400
                        print(f"    New FSRS due: {new_due_dt.strftime('%Y-%m-%d %H:%M')} (in {days_until_next:.1f} days)")
                    except:
                        pass
            
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
            reviews_completed += 1
        
        if debug:
            print(f"  Completed {reviews_completed}/{num_reviews} reviews")
            print()
        
        card["fsrs_card"] = card_dict["fsrs_card"]
    
    print()
    print(f"✅ Generated {len(review_logs)} review logs")
    print(f"📈 Card difficulty distribution:")
    total_cards = len(cards)
    if total_cards > 0:
        print(f"   - Easy learners: {profile_stats['easy']} cards ({profile_stats['easy']/total_cards*100:.1f}%)")
        print(f"   - Hard learners: {profile_stats['hard']} cards ({profile_stats['hard']/total_cards*100:.1f}%)")
        print(f"   - Medium-hard: {profile_stats['medium-hard']} cards ({profile_stats['medium-hard']/total_cards*100:.1f}%)")
        print(f"   - Medium-easy: {profile_stats['medium-easy']} cards ({profile_stats['medium-easy']/total_cards*100:.1f}%)")
        print(f"   - Average: {profile_stats['average']} cards ({profile_stats['average']/total_cards*100:.1f}%)")
    print(f"   - Average reviews per card: {len(review_logs)/total_cards:.1f}")
    
    return review_logs

def reset_card_fsrs_state(card, creation_date):
    """
    Resets a card's FSRS state to initial state
    
    Args:
        card: The card dict to reset
        creation_date: The datetime when the card was created
    """
    # Create a fresh FSRS card
    card["fsrs_card"] = fsrs_controller.create_new_card()
    # Set the due date to the creation date
    card["fsrs_card"]["due"] = creation_date.isoformat()

def main():
    """Main function to regenerate review logs"""
    print("🚀 Starting review logs regeneration...")
    print("=" * 60)
    
    # Ask if user wants debug output
    import sys
    debug = "--debug" in sys.argv or "-d" in sys.argv
    
    if debug:
        print("🐛 Debug mode enabled - showing detailed output")
        print()
    
    # Step 1: Read existing database
    print("📖 Reading existing database.json...")
    data = database.read_data()
    
    notes = data.get("learning_notes", [])
    cards = data.get("cards", [])
    
    print(f"✅ Found {len(notes)} notes and {len(cards)} cards")
    print()
    
    if not cards:
        print("❌ No cards found in database! Please run gen_dummy_data.py first.")
        return
    
    # Step 2: Reset all card FSRS states to initial state
    print("🔄 Resetting all card FSRS states to initial...")
    
    # Find the earliest creation date from notes
    if notes:
        earliest_note = min(notes, key=lambda n: n.get("created_at", ""))
        start_date = datetime.fromisoformat(earliest_note["created_at"].replace('Z', '+00:00'))
    else:
        # Fallback to September 3, 2025
        start_date = datetime(2025, 9, 3, 8, 0, 0, tzinfo=timezone.utc)
    
    # Reset each card to its initial state based on its associated note
    note_map = {note["id"]: note for note in notes}
    for card in cards:
        note_id = card.get("note_id")
        if note_id and note_id in note_map:
            note = note_map[note_id]
            creation_date = datetime.fromisoformat(note["created_at"].replace('Z', '+00:00'))
            reset_card_fsrs_state(card, creation_date)
    
    print(f"✅ Reset {len(cards)} cards to initial FSRS state")
    print()
    
    # Step 3: Set date range for reviews
    # Use the same range as gen_dummy_data.py
    end_date = datetime(2025, 10, 3, 22, 0, 0, tzinfo=timezone.utc)
    
    # Step 4: Generate new review logs
    review_logs = generate_review_logs(cards, start_date, end_date, debug=debug)
    print()
    
    # Step 5: Write updated data to database
    print("💾 Writing updated data to database.json...")
    data["cards"] = cards
    data["review_logs"] = review_logs
    database.write_data(data)
    
    print("=" * 60)
    print("✅ Review logs regeneration complete!")
    print(f"📊 Summary:")
    print(f"   - {len(notes)} learning notes (unchanged)")
    print(f"   - {len(cards)} cards (FSRS states updated)")
    print(f"   - {len(review_logs)} review logs (regenerated)")
    print(f"   - Review period: {start_date.date()} to {end_date.date()}")
    print()
    print("🎉 Your database now has realistic review history!")
    print()
    if not debug:
        print("💡 Tip: Run with --debug or -d flag to see detailed generation log")

if __name__ == "__main__":
    main()


