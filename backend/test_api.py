"""
Simple test script to verify the API is working correctly.
Make sure the server is running before executing this script.

Usage: python test_api.py
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def print_section(title):
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def test_root():
    print_section("Testing Root Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_create_note():
    print_section("Testing Create Note Endpoint")
    try:
        data = {
            "word": "hola",
            "translation": "hello"
        }
        print(f"Request: {json.dumps(data, indent=2)}")
        response = requests.post(f"{BASE_URL}/notes", json=data)
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200:
            print(f"✅ Note created successfully!")
            print(f"   Note ID: {result.get('note_id')}")
            print(f"   Card IDs: {result.get('card_ids')}")
            return True, result
        else:
            print(f"❌ Failed to create note")
            return False, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None

def test_get_notes():
    print_section("Testing Get Notes Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/notes")
        print(f"Status Code: {response.status_code}")
        notes = response.json()
        print(f"Total Notes: {len(notes)}")
        if notes:
            print(f"Latest Note Preview:")
            latest = notes[-1]
            print(f"  - Word: {latest.get('word')}")
            print(f"  - Translation: {latest.get('translation')}")
            print(f"  - Sentence: {latest.get('sentence', 'N/A')[:50]}...")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_get_next_card():
    print_section("Testing Get Next Card Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/study/next")
        print(f"Status Code: {response.status_code}")
        result = response.json()
        
        if "message" in result:
            print(f"Message: {result['message']}")
        else:
            print(f"Card ID: {result.get('id')}")
            print(f"Direction: {result.get('direction')}")
            print(f"Note Word: {result.get('note', {}).get('word')}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_answer_card(card_id):
    print_section("Testing Answer Card Endpoint")
    try:
        data = {
            "card_id": card_id,
            "rating": 3
        }
        print(f"Request: {json.dumps(data, indent=2)}")
        response = requests.post(f"{BASE_URL}/study/answer", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_get_stats():
    print_section("Testing Get Stats Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/stats")
        print(f"Status Code: {response.status_code}")
        stats = response.json()
        print(f"Total Notes: {len(stats.get('learning_notes', []))}")
        print(f"Total Cards: {len(stats.get('cards', []))}")
        print(f"Total Review Logs: {len(stats.get('review_logs', []))}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_hardware_input():
    print_section("Testing Hardware Input Endpoint")
    try:
        data = {
            "input_type": "button",
            "value": "button_1"
        }
        print(f"Request: {json.dumps(data, indent=2)}")
        response = requests.post(f"{BASE_URL}/hardware/input", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("\n" + "🚀 Starting API Tests ".center(60, "="))
    print(f"Base URL: {BASE_URL}")
    print("="*60)
    
    # Check if server is running
    print("\n⏳ Checking if server is running...")
    try:
        requests.get(f"{BASE_URL}/", timeout=2)
        print("✅ Server is running!")
    except:
        print("❌ Server is not running. Please start the server first:")
        print("   python main.py")
        return
    
    results = []
    
    # Test root endpoint
    results.append(("Root Endpoint", test_root()))
    
    # Test get notes (should work even if empty)
    results.append(("Get Notes", test_get_notes()))
    
    # Test create note (this may take a while due to API calls)
    print("\n⏳ Creating note (this may take 10-20 seconds due to AI generation)...")
    success, note_result = test_create_note()
    results.append(("Create Note", success))
    
    if success and note_result:
        card_ids = note_result.get('card_ids', [])
        if card_ids:
            # Test get next card
            results.append(("Get Next Card", test_get_next_card()))
            
            # Test answer card
            results.append(("Answer Card", test_answer_card(card_ids[0])))
    
    # Test stats
    results.append(("Get Stats", test_get_stats()))
    
    # Test hardware input
    results.append(("Hardware Input", test_hardware_input()))
    
    # Print summary
    print_section("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Your API is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()

