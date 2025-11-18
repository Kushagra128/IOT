"""
Summarizer Module
Generates summaries using OpenRouter API only
No NLTK, No Ollama, No TextRank - Pure OpenRouter API
"""

import os
import sys
import requests

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not required, will use hardcoded key

# Add backend directory to path for timezone_utils
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)
from timezone_utils import now_ist, format_ist


class OpenRouterSummarizer:
    """OpenRouter API-based summarizer"""
    
    def __init__(self, model="qwen/qwen-2.5-7b-instruct"):
        """
        Initialize OpenRouter summarizer
        
        Args:
            model: OpenRouter model to use
        """
        self.model = model
        
        # Get API key from environment or use default
        self.api_key = os.getenv(
            'OPENROUTER_API_KEY',
            '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'
        )
        
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.max_chars = 4000  # Limit text length for API
    
    def generate_summary(self, text):
        """
        Generate summary using OpenRouter API
        
        Args:
            text: Input text to summarize
            
        Returns:
            str: Summary text
        """
        if not text or len(text.strip()) < 50:
            return "Text too short to summarize."
        
        # Truncate if too long
        if len(text) > self.max_chars:
            text = text[-self.max_chars:]  # Take last 4000 chars
        
        try:
            # Determine transcript length for appropriate summary style
            word_count = len(text.split())
            
            # Create adaptive system prompt based on transcript length
            if word_count < 100:
                # Short transcript: concise summary
                system_prompt = """You are an intelligent meeting summarizer and transcript repair specialist.

The transcript you receive is from speech-to-text (Vosk STT) and contains imperfections:
- Missing words or incomplete phrases
- Grammar errors and typos
- Abrupt transitions
- Noisy fragments or unclear segments

YOUR TASK (2 steps):
1. REPAIR: Mentally reconstruct what the speaker actually meant by:
   - Fixing grammar and spelling
   - Filling reasonable gaps in meaning
   - Smoothing abrupt transitions
   - Expanding missing connectors for coherence
   - Preserving the speaker's original intent

2. SUMMARIZE: Produce a clear, polished summary (3-5 sentences) that:
   - Captures the main point and key context
   - Uses proper grammar and complete sentences
   - Reflects what was actually said (no hallucinations)
   - Is concise but meaningful

Output only the final summary, not the repair process."""

            else:
                # Long transcript: structured summary
                system_prompt = """You are an intelligent meeting summarizer and transcript repair specialist.

The transcript you receive is from speech-to-text (Vosk STT) and contains imperfections:
- Missing words or incomplete phrases
- Grammar errors and typos
- Abrupt transitions
- Noisy fragments or unclear segments

YOUR TASK (2 steps):
1. REPAIR: Mentally reconstruct what the speaker actually meant by:
   - Fixing grammar and spelling
   - Filling reasonable gaps in meaning
   - Smoothing abrupt transitions
   - Expanding missing connectors for coherence
   - Preserving the speaker's original intent

2. SUMMARIZE: Produce a well-structured summary with:
   • Main topics discussed (use bullet points)
   • Key points and important context
   • Decisions or conclusions reached
   • Action items or next steps (if mentioned)
   
Format: Use bullet points for clarity. Write as much as needed to capture the content fully.
Quality: Clear, polished language with proper grammar.
Accuracy: Only infer what's reasonable from the text - no hallucinations.

Output only the final summary, not the repair process."""
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "http://localhost",
                "X-Title": "RaspberryPi-Summarizer",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": f"Raw STT Transcript:\n\n{text}\n\nPlease repair and summarize this transcript."
                    }
                ]
            }
            
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                summary = result['choices'][0]['message']['content']
                print("   ✓ Summary generated (using OpenRouter)")
                return summary.strip()
            else:
                print(f"   ⚠️  OpenRouter API error (status {response.status_code})")
                return self._fallback_summary(text)
                
        except requests.exceptions.Timeout:
            print("   ⚠️  OpenRouter request timed out")
            return self._fallback_summary(text)
        except Exception as e:
            print(f"   ⚠️  OpenRouter failed: {e}")
            return self._fallback_summary(text)
    
    def _fallback_summary(self, text):
        """
        Fallback: return first 2 sentences of transcript
        
        Args:
            text: Input text
            
        Returns:
            str: First 2 sentences
        """
        # Simple sentence splitting
        sentences = []
        for line in text.split('\n'):
            line = line.strip()
            if line:
                # Split by period, question mark, exclamation
                parts = line.replace('!', '.').replace('?', '.').split('.')
                for part in parts:
                    part = part.strip()
                    if len(part) > 10:  # Ignore very short fragments
                        sentences.append(part)
        
        # Return first 2 sentences
        if len(sentences) >= 2:
            return f"{sentences[0]}. {sentences[1]}."
        elif len(sentences) == 1:
            return f"{sentences[0]}."
        else:
            return "Summary not available."


class Summarizer:
    """
    Summarizer wrapper class
    Maintains compatibility with existing code while using OpenRouter
    """
    
    def __init__(self, mode='ollama', num_sentences=5):
        """
        Initialize summarizer
        
        Args:
            mode: Mode name (kept for compatibility, always uses OpenRouter)
            num_sentences: Not used, kept for compatibility
        """
        self.mode = mode
        self.num_sentences = num_sentences
        self.display_name = "Ollama"  # Display name for logs
        
        # Get model from environment or use default (7B for better quality)
        self.model = os.environ.get('OPENROUTER_MODEL', 'qwen/qwen-2.5-7b-instruct')
        
        # Initialize OpenRouter summarizer
        self.summarizer = OpenRouterSummarizer(model=self.model)
        
        # Print compatibility message
        print(f"   ✓ Summarizer initialized (mode: {mode})")
    
    def generate_summary(self, text):
        """
        Generate summary of the text
        
        Args:
            text: Input text to summarize
            
        Returns:
            str: Summary text
        """
        return self.summarizer.generate_summary(text)
    
    def save_summary(self, summary, session_folder, session_name):
        """
        Save summary to file
        
        Args:
            summary: Summary text
            session_folder: Path to session folder
            session_name: Session name for filename
            
        Returns:
            str: Path to saved summary file
        """
        summary_file = os.path.join(
            session_folder,
            f"{session_name}_summary.txt"
        )
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            # Write header
            f.write(f"Summary: {session_name}\n")
            f.write(f"Generated: {format_ist(now_ist())} IST\n")
            f.write(f"Mode: {self.display_name}\n")
            f.write("=" * 60 + "\n\n")
            
            # Write summary
            f.write(summary)
            
            # Write footer
            f.write("\n\n" + "=" * 60 + "\n")
        
        return summary_file
    
    def get_summary_stats(self, original_text, summary):
        """
        Get statistics about the summary
        
        Args:
            original_text: Original text
            summary: Summary text
            
        Returns:
            dict: Statistics
        """
        orig_words = len(original_text.split())
        summ_words = len(summary.split())
        
        # Simple sentence count
        orig_sentences = original_text.count('.') + original_text.count('!') + original_text.count('?')
        summ_sentences = summary.count('.') + summary.count('!') + summary.count('?')
        
        compression_ratio = summ_words / orig_words if orig_words > 0 else 0
        
        return {
            'original_words': orig_words,
            'summary_words': summ_words,
            'original_sentences': orig_sentences,
            'summary_sentences': summ_sentences,
            'compression_ratio': compression_ratio
        }
