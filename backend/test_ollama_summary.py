"""
Test Local Ollama AI Summarization
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'iot-meeting-minutes'))

from summarizer import Summarizer

# Sample meeting transcription
test_transcript = """
Good morning everyone. Let's start today's project meeting. First on the agenda is the website redesign project. 
Sarah, can you give us an update? Yes, we've completed the wireframes for the homepage and the about page. 
The design team has approved them and we're ready to move to the development phase. That's great news. 
John, how's the backend API development going? We've finished implementing the user authentication endpoints 
and the data retrieval APIs. We're currently working on the payment integration which should be done by Friday. 
Excellent. Now regarding the mobile app, Mike, what's the status? We've encountered some issues with the iOS build. 
The app crashes on devices running iOS 16. We're investigating the root cause and expect to have a fix by tomorrow. 
Okay, please keep us updated on that. Let's discuss the timeline. Based on current progress, we should be able to 
launch the beta version by the end of next month. Does everyone agree? Yes, that sounds reasonable. 
We'll need to coordinate with the marketing team for the launch campaign. I'll set up a meeting with them next week. 
Perfect. Any other concerns or questions? No, I think we're good. Alright, let's wrap up. 
Thank you everyone for your updates. See you at the next meeting.
"""

print("🧪 Testing Local Ollama AI Summarization\n")
print("=" * 60)

# Initialize summarizer with Ollama mode
print("\n1. Initializing Summarizer with Ollama mode...")
summarizer = Summarizer(mode='ollama')

# Generate summary
print("\n2. Generating summary from transcription...")
print(f"   Transcription length: {len(test_transcript)} characters")
print(f"   Word count: {len(test_transcript.split())} words\n")

summary = summarizer.generate_summary(test_transcript)

print("\n" + "=" * 60)
print("📝 GENERATED SUMMARY (Clean Format):")
print("=" * 60)
print(summary)
print("=" * 60)

# Get stats
stats = summarizer.get_summary_stats(test_transcript, summary)
print("\n📊 Summary Statistics:")
print(f"   Original words: {stats['original_words']}")
print(f"   Summary words: {stats['summary_words']}")
print(f"   Compression ratio: {stats['compression_ratio']:.2%}")
print(f"   Original sentences: {stats['original_sentences']}")
print(f"   Summary sentences: {stats['summary_sentences']}")

print("\n✅ Test completed!")
