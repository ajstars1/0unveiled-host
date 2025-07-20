"""Text processing service for summarization and analysis."""

from typing import Any, Dict, Union

import numpy as np
from loguru import logger
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class TextService:
    """Service for text processing tasks."""
    
    def __init__(self) -> None:
        """Initialize the text service."""
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            lowercase=True,
        )
        logger.info("Text service initialized")
    
    async def summarize(
        self,
        text: str,
        max_length: int = 150,
        min_length: int = 30,
    ) -> str:
        """Summarize text using extractive summarization."""
        if not text.strip():
            raise ValueError("Text cannot be empty")
        
        # Split text into sentences
        sentences = self._split_into_sentences(text)
        
        if len(sentences) <= 3:
            return text  # Text is already short enough
        
        try:
            # Calculate sentence scores using TF-IDF
            sentence_scores = self._calculate_sentence_scores(sentences)
            
            # Select top sentences for summary
            summary_sentences = self._select_summary_sentences(
                sentences, sentence_scores, max_length, min_length
            )
            
            # Maintain original order
            summary = self._reconstruct_summary(sentences, summary_sentences)
            
            logger.info(f"Text summarization successful. Original: {len(text)}, Summary: {len(summary)}")
            return summary
            
        except Exception as e:
            logger.error(f"Text summarization failed: {e}")
            # Fallback to simple truncation
            return text[:max_length] + "..." if len(text) > max_length else text
    
    async def analyze(
        self,
        text: str,
        analysis_type: str = "sentiment",
    ) -> Union[str, Dict[str, Any]]:
        """Analyze text for various properties."""
        if not text.strip():
            raise ValueError("Text cannot be empty")
        
        try:
            if analysis_type == "sentiment":
                return await self._analyze_sentiment(text)
            elif analysis_type == "keywords":
                return await self._extract_keywords(text)
            elif analysis_type == "entities":
                return await self._extract_entities(text)
            elif analysis_type == "readability":
                return await self._analyze_readability(text)
            else:
                raise ValueError(f"Unsupported analysis type: {analysis_type}")
                
        except Exception as e:
            logger.error(f"Text analysis failed: {e}")
            raise RuntimeError(f"Text analysis failed: {str(e)}")
    
    def _split_into_sentences(self, text: str) -> list[str]:
        """Split text into sentences."""
        # Simple sentence splitting (can be improved with nltk or spacy)
        sentences = []
        current_sentence = ""
        
        for char in text:
            current_sentence += char
            if char in '.!?':
                sentence = current_sentence.strip()
                if sentence:
                    sentences.append(sentence)
                current_sentence = ""
        
        # Add remaining text as a sentence if it exists
        if current_sentence.strip():
            sentences.append(current_sentence.strip())
        
        return sentences
    
    def _calculate_sentence_scores(self, sentences: list[str]) -> np.ndarray:
        """Calculate TF-IDF based sentence scores."""
        # Vectorize sentences
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(sentences)
        
        # Calculate sentence importance based on TF-IDF sum
        scores = np.array(tfidf_matrix.sum(axis=1)).flatten()
        
        return scores
    
    def _select_summary_sentences(
        self,
        sentences: list[str],
        scores: np.ndarray,
        max_length: int,
        min_length: int,
    ) -> list[str]:
        """Select sentences for summary based on scores and length constraints."""
        # Sort sentences by score (descending)
        sentence_score_pairs = list(zip(sentences, scores))
        sentence_score_pairs.sort(key=lambda x: x[1], reverse=True)
        
        selected_sentences = []
        current_length = 0
        
        for sentence, _ in sentence_score_pairs:
            if current_length + len(sentence) <= max_length:
                selected_sentences.append(sentence)
                current_length += len(sentence)
            
            if current_length >= min_length and len(selected_sentences) >= 2:
                break
        
        return selected_sentences
    
    def _reconstruct_summary(
        self,
        original_sentences: list[str],
        summary_sentences: list[str],
    ) -> str:
        """Reconstruct summary maintaining original sentence order."""
        summary_parts = []
        
        for sentence in original_sentences:
            if sentence in summary_sentences:
                summary_parts.append(sentence)
        
        return " ".join(summary_parts)
    
    async def _analyze_sentiment(self, text: str) -> str:
        """Analyze sentiment (simplified implementation)."""
        # Simple keyword-based sentiment analysis
        positive_words = ["good", "great", "excellent", "amazing", "wonderful", "love", "like", "happy", "positive"]
        negative_words = ["bad", "terrible", "awful", "hate", "dislike", "sad", "negative", "poor", "horrible"]
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    async def _extract_keywords(self, text: str) -> Dict[str, Any]:
        """Extract keywords using TF-IDF."""
        # Vectorize the text
        tfidf_matrix = self.tfidf_vectorizer.fit_transform([text])
        feature_names = self.tfidf_vectorizer.get_feature_names_out()
        tfidf_scores = tfidf_matrix.toarray()[0]
        
        # Get top keywords
        keyword_scores = list(zip(feature_names, tfidf_scores))
        keyword_scores.sort(key=lambda x: x[1], reverse=True)
        
        keywords = [word for word, score in keyword_scores[:10] if score > 0]
        
        return {
            "keywords": keywords,
            "count": len(keywords),
        }
    
    async def _extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract named entities (simplified implementation)."""
        # Simple pattern-based entity extraction
        words = text.split()
        
        # Find capitalized words (potential proper nouns)
        entities = []
        for word in words:
            clean_word = word.strip('.,!?";')
            if clean_word and clean_word[0].isupper() and len(clean_word) > 1:
                entities.append(clean_word)
        
        # Remove duplicates while preserving order
        unique_entities = list(dict.fromkeys(entities))
        
        return {
            "entities": unique_entities[:10],  # Top 10 entities
            "count": len(unique_entities),
        }
    
    async def _analyze_readability(self, text: str) -> Dict[str, Any]:
        """Analyze text readability."""
        sentences = self._split_into_sentences(text)
        words = text.split()
        
        if not sentences or not words:
            return {"score": 0, "level": "unknown"}
        
        avg_sentence_length = len(words) / len(sentences)
        avg_word_length = sum(len(word) for word in words) / len(words)
        
        # Simple readability score (0-100)
        readability_score = 100 - (avg_sentence_length * 1.5) - (avg_word_length * 2)
        readability_score = max(0, min(100, readability_score))
        
        # Determine reading level
        if readability_score >= 80:
            level = "very_easy"
        elif readability_score >= 60:
            level = "easy"
        elif readability_score >= 40:
            level = "moderate"
        elif readability_score >= 20:
            level = "difficult"
        else:
            level = "very_difficult"
        
        return {
            "score": round(readability_score, 2),
            "level": level,
            "avg_sentence_length": round(avg_sentence_length, 2),
            "avg_word_length": round(avg_word_length, 2),
        } 