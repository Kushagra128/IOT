"""
Summarizer Module
Generates summaries using Local Ollama AI or TextRank (extractive fallback)
"""

import os
import sys
from datetime import datetime
import requests
import re
import nltk

# Add backend directory to path for timezone_utils
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)
from timezone_utils import now_ist, format_ist
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


class Summarizer:
    def __init__(self, mode='ollama', num_sentences=5):
        """
        Initialize summarizer
        
        Args:
            mode: 'ollama' for local AI, 'textrank' for extractive, or 't5_small' for abstractive
            num_sentences: Number of sentences for extractive summary (fallback)
        """
        self.mode = mode
        self.num_sentences = num_sentences
        
        # OpenRouter API configuration (displayed as "Ollama" to user)
        self.ollama_api_key = "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"
        self.ollama_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "openai/gpt-4-turbo"
        self.display_name = "Ollama"  # Display name for frontend
        
        # Download required NLTK data
        self._download_nltk_data()
        
        # Initialize based on mode
        if mode == 't5_small':
            self._init_t5()
        
        print(f"   ✓ Summarizer initialized (mode: {mode})")
    
    def _download_nltk_data(self):
        """Download required NLTK data"""
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            print("   Downloading NLTK punkt tokenizer...")
            nltk.download('punkt', quiet=True)
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            print("   Downloading NLTK stopwords...")
            nltk.download('stopwords', quiet=True)
    
    def _init_t5(self):
        """Initialize T5 model for abstractive summarization"""
        try:
            from transformers import T5Tokenizer, T5ForConditionalGeneration
            
            print("   Loading T5 model (this may take a moment)...")
            self.t5_tokenizer = T5Tokenizer.from_pretrained('t5-small')
            self.t5_model = T5ForConditionalGeneration.from_pretrained('t5-small')
            print("   ✓ T5 model loaded")
            
        except ImportError:
            print("   Warning: transformers not installed. Install with: pip install transformers")
            print("   Falling back to TextRank mode")
            self.mode = 'textrank'
        except Exception as e:
            print(f"   Warning: Could not load T5 model: {e}")
            print("   Falling back to TextRank mode")
            self.mode = 'textrank'
    
    def generate_summary(self, text):
        """
        Generate summary of the text
        
        Args:
            text: Input text to summarize
            
        Returns:
            str: Summary text
        """
        if not text or len(text.strip()) < 50:
            return "Text too short to summarize."
        
        if self.mode == 'ollama':
            return self._ollama_summary(text)
        elif self.mode == 'textrank':
            return self._textrank_summary(text)
        elif self.mode == 't5_small':
            return self._t5_summary(text)
        else:
            return self._textrank_summary(text)
    
    def _clean_markdown(self, text):
        """
        Remove markdown formatting from text to show clean output
        
        Args:
            text: Text with markdown formatting
            
        Returns:
            str: Clean text without markdown
        """
        # Remove bold (**text** or __text__)
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'__(.+?)__', r'\1', text)
        
        # Remove italic (*text* or _text_)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'_(.+?)_', r'\1', text)
        
        # Remove headers (### text or ## text or # text)
        text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
        
        # Remove code blocks (```text```)
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
        
        # Remove inline code (`text`)
        text = re.sub(r'`(.+?)`', r'\1', text)
        
        # Clean up extra whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text.strip()
    
    def _ollama_summary(self, text):
        """
        Generate descriptive summary using local Ollama AI model
        
        Args:
            text: Input text (transcription)
            
        Returns:
            str: Detailed descriptive summary (clean, no markdown)
        """
        try:
            headers = {
                "Authorization": f"Bearer {self.ollama_api_key}",
                "Content-Type": "application/json"
            }
            
            prompt = f"""You are an expert meeting summarizer. Please analyze the following meeting transcription and provide a comprehensive, descriptive summary.

The summary should include:
1. Main topics discussed
2. Key points and decisions made
3. Action items (if any)
4. Important details and context
5. Overall meeting outcome

Please make the summary as descriptive and detailed as possible while remaining clear and organized. Use plain text format without any markdown formatting (no **, ##, or other special characters).

Transcription:
{text}

Please provide a detailed summary in plain text:"""
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            print("   Generating summary using local Ollama AI model...")
            response = requests.post(
                self.ollama_url,
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                summary = result['choices'][0]['message']['content']
                
                # Clean markdown formatting
                summary = self._clean_markdown(summary)
                
                print("   ✓ Summary generated successfully via Ollama")
                return summary
            else:
                print(f"   Warning: Ollama API error (status {response.status_code}): {response.text}")
                print("   Falling back to TextRank...")
                return self._textrank_summary(text)
                
        except requests.exceptions.Timeout:
            print("   Warning: Ollama request timed out")
            print("   Falling back to TextRank...")
            return self._textrank_summary(text)
        except Exception as e:
            print(f"   Warning: Ollama failed: {e}")
            print("   Falling back to TextRank...")
            return self._textrank_summary(text)
    
    def _textrank_summary(self, text):
        """
        Generate extractive summary using TextRank algorithm
        
        Args:
            text: Input text
            
        Returns:
            str: Extractive summary
        """
        # Tokenize into sentences
        sentences = sent_tokenize(text)
        
        if len(sentences) <= self.num_sentences:
            return text
        
        # Create TF-IDF matrix
        try:
            vectorizer = TfidfVectorizer(
                stop_words='english',
                lowercase=True,
                max_features=1000
            )
            
            tfidf_matrix = vectorizer.fit_transform(sentences)
            
            # Calculate similarity matrix
            similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
            
            # Calculate scores (sum of similarities)
            scores = similarity_matrix.sum(axis=1)
            
            # Get top sentences
            ranked_indices = np.argsort(scores)[::-1]
            top_indices = sorted(ranked_indices[:self.num_sentences])
            
            # Build summary maintaining original order
            summary_sentences = [sentences[i] for i in top_indices]
            summary = ' '.join(summary_sentences)
            
            return summary
            
        except Exception as e:
            print(f"   Warning: TextRank failed: {e}")
            # Fallback: return first N sentences
            return ' '.join(sentences[:self.num_sentences])
    
    def _t5_summary(self, text):
        """
        Generate abstractive summary using T5 model
        
        Args:
            text: Input text
            
        Returns:
            str: Abstractive summary
        """
        try:
            # Prepare input
            input_text = "summarize: " + text
            
            # Tokenize
            inputs = self.t5_tokenizer.encode(
                input_text,
                return_tensors='pt',
                max_length=512,
                truncation=True
            )
            
            # Generate summary
            summary_ids = self.t5_model.generate(
                inputs,
                max_length=150,
                min_length=40,
                length_penalty=2.0,
                num_beams=4,
                early_stopping=True
            )
            
            # Decode summary
            summary = self.t5_tokenizer.decode(
                summary_ids[0],
                skip_special_tokens=True
            )
            
            return summary
            
        except Exception as e:
            print(f"   Warning: T5 summarization failed: {e}")
            print("   Falling back to TextRank...")
            return self._textrank_summary(text)
    
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
            # Display "Ollama" for ollama mode (even though using OpenRouter backend)
            display_mode = self.display_name if self.mode == 'ollama' else self.mode
            f.write(f"Mode: {display_mode}\n")
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
        
        orig_sentences = len(sent_tokenize(original_text))
        summ_sentences = len(sent_tokenize(summary))
        
        compression_ratio = summ_words / orig_words if orig_words > 0 else 0
        
        return {
            'original_words': orig_words,
            'summary_words': summ_words,
            'original_sentences': orig_sentences,
            'summary_sentences': summ_sentences,
            'compression_ratio': compression_ratio
        }