import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, LSTM, Embedding, Dropout, Bidirectional
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import requests
import yfinance as yf
from datetime import datetime, timedelta
import os
import pickle
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StockSentimentAnalyzer:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.max_length = 100
        self.vocab_size = 10000
        self.lemmatizer = WordNetLemmatizer()

        # Download NLTK data
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')

        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')

        try:
            nltk.data.find('corpora/wordnet')
        except LookupError:
            nltk.download('wordnet')

        self.stop_words = set(stopwords.words('english'))

    def preprocess_text(self, text):
        """Clean and preprocess text data"""
        # Convert to lowercase
        text = text.lower()

        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)

        # Remove mentions and hashtags
        text = re.sub(r'@\w+|#\w+', '', text)

        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)

        # Tokenize
        tokens = nltk.word_tokenize(text)

        # Remove stopwords and lemmatize
        tokens = [self.lemmatizer.lemmatize(word) for word in tokens if word not in self.stop_words]

        return ' '.join(tokens)

    def load_sp500_data(self):
        """Load S&P 500 stock data and related news"""
        logger.info("Loading S&P 500 data...")

        # Get S&P 500 tickers
        sp500_url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        sp500_table = pd.read_html(sp500_url)[0]
        sp500_tickers = sp500_table['Symbol'].tolist()

        # Sample major stocks for analysis
        major_stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX']

        return major_stocks

    def fetch_news_data(self, symbol, days=7):
        """Fetch news data for a stock symbol"""
        try:
            # Using Alpha Vantage for news (you'll need an API key)
            # For demo purposes, we'll use mock data
            mock_news = [
                {
                    'title': f'{symbol} shows strong quarterly performance',
                    'content': f'Investors are optimistic about {symbol} after recent earnings reports.',
                    'source': 'Financial Times',
                    'sentiment': 'positive'
                },
                {
                    'title': f'Analysts raise {symbol} price targets',
                    'content': f'Wall Street analysts have increased their price targets for {symbol}.',
                    'source': 'Bloomberg',
                    'sentiment': 'positive'
                },
                {
                    'title': f'{symbol} faces market headwinds',
                    'content': f'Economic uncertainty may impact {symbol} performance.',
                    'source': 'Reuters',
                    'sentiment': 'negative'
                }
            ]
            return mock_news
        except Exception as e:
            logger.error(f"Error fetching news for {symbol}: {e}")
            return []

    def fetch_social_media_data(self, symbol, days=7):
        """Fetch social media sentiment data"""
        try:
            # Mock social media data - in production, use Twitter API, Reddit API, etc.
            mock_social = [
                {
                    'text': f'Just bought more {symbol} shares! Bullish on the future 🚀',
                    'platform': 'twitter',
                    'sentiment': 'positive'
                },
                {
                    'text': f'{symbol} earnings call was impressive. Strong fundamentals.',
                    'platform': 'twitter',
                    'sentiment': 'positive'
                },
                {
                    'text': f'Concerned about {symbol} exposure to economic slowdown',
                    'platform': 'reddit',
                    'sentiment': 'negative'
                },
                {
                    'text': f'{symbol} showing great technical patterns 📈',
                    'platform': 'stocktwits',
                    'sentiment': 'positive'
                }
            ]
            return mock_social
        except Exception as e:
            logger.error(f"Error fetching social data for {symbol}: {e}")
            return []

    def create_training_data(self):
        """Create training dataset from various sources"""
        logger.info("Creating training dataset...")

        # Sample financial sentiment data
        positive_texts = [
            "Stock prices surged today as investors showed confidence",
            "Strong earnings report boosted company shares significantly",
            "Market rally continues with technology stocks leading gains",
            "Analysts upgrade rating following positive quarterly results",
            "Company announces dividend increase pleasing shareholders",
            "Breakthrough product launch drives stock price higher",
            "Institutional investors increase holdings in the company",
            "Revenue growth exceeds expectations for the quarter",
            "Company wins major contract boosting future prospects",
            "CEO optimistic about company future during conference call"
        ]

        negative_texts = [
            "Stock prices plummeted following disappointing earnings",
            "Company faces regulatory scrutiny affecting share value",
            "Market sell-off impacts technology sector heavily",
            "Analysts downgrade rating due to weaker than expected results",
            "Company announces layoffs causing investor concern",
            "Product recall negatively affects company reputation",
            "Declining sales figures worry Wall Street analysts",
            "Company misses quarterly earnings estimates",
            "Legal issues create uncertainty for shareholders",
            "CEO departure raises questions about company direction"
        ]

        neutral_texts = [
            "Company reports quarterly earnings as expected",
            "Stock price remains stable amid market volatility",
            "Company announces regular dividend payment",
            "Management discusses strategic initiatives",
            "Company provides guidance for upcoming quarter",
            "Stock trading within normal range",
            "Company participates in industry conference",
            "Management team remains unchanged",
            "Company reports standard operational updates",
            "Stock performance in line with market averages"
        ]

        # Create DataFrame
        data = []
        for text in positive_texts:
            data.append({'text': text, 'sentiment': 2})  # 2 = positive
        for text in negative_texts:
            data.append({'text': text, 'sentiment': 0})  # 0 = negative
        for text in neutral_texts:
            data.append({'text': text, 'sentiment': 1})  # 1 = neutral

        df = pd.DataFrame(data)

        # Preprocess texts
        df['processed_text'] = df['text'].apply(self.preprocess_text)

        return df

    def build_lstm_model(self):
        """Build and compile LSTM model for sentiment analysis"""
        logger.info("Building LSTM model...")

        model = Sequential([
            Embedding(self.vocab_size, 128, input_length=self.max_length),
            Bidirectional(LSTM(64, return_sequences=True)),
            Dropout(0.3),
            Bidirectional(LSTM(32)),
            Dropout(0.3),
            Dense(64, activation='relu'),
            Dropout(0.2),
            Dense(3, activation='softmax')  # 3 classes: negative, neutral, positive
        ])

        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )

        return model

    def train_model(self, epochs=10, batch_size=32):
        """Train the LSTM model"""
        logger.info("Training LSTM model...")

        # Create training data
        df = self.create_training_data()

        # Tokenize text
        self.tokenizer = Tokenizer(num_words=self.vocab_size, oov_token='<OOV>')
        self.tokenizer.fit_on_texts(df['processed_text'])

        # Convert text to sequences
        sequences = self.tokenizer.texts_to_sequences(df['processed_text'])
        padded_sequences = pad_sequences(sequences, maxlen=self.max_length, padding='post')

        # Prepare labels
        labels = tf.keras.utils.to_categorical(df['sentiment'], num_classes=3)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            padded_sequences, labels, test_size=0.2, random_state=42
        )

        # Build and train model
        self.model = self.build_lstm_model()

        history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=1
        )

        # Evaluate model
        loss, accuracy = self.model.evaluate(X_test, y_test, verbose=0)
        logger.info(f"Model Accuracy: {accuracy:.4f}")

        # Save model and tokenizer
        self.save_model()

        return history

    def save_model(self):
        """Save trained model and tokenizer"""
        if self.model:
            self.model.save('models/sentiment_model.h5')
            logger.info("Model saved to models/sentiment_model.h5")

        if self.tokenizer:
            with open('models/tokenizer.pkl', 'wb') as f:
                pickle.dump(self.tokenizer, f)
            logger.info("Tokenizer saved to models/tokenizer.pkl")

    def load_model(self):
        """Load trained model and tokenizer"""
        try:
            self.model = load_model('models/sentiment_model.h5')
            with open('models/tokenizer.pkl', 'rb') as f:
                self.tokenizer = pickle.load(f)
            logger.info("Model and tokenizer loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False

    def predict_sentiment(self, text):
        """Predict sentiment for given text"""
        if not self.model or not self.tokenizer:
            if not self.load_model():
                return {'sentiment': 'neutral', 'confidence': 0.0}

        # Preprocess text
        processed_text = self.preprocess_text(text)

        # Tokenize and pad
        sequence = self.tokenizer.texts_to_sequences([processed_text])
        padded_sequence = pad_sequences(sequence, maxlen=self.max_length, padding='post')

        # Predict
        prediction = self.model.predict(padded_sequence, verbose=0)[0]

        # Get sentiment
        sentiment_map = {0: 'negative', 1: 'neutral', 2: 'positive'}
        sentiment_index = np.argmax(prediction)
        confidence = float(prediction[sentiment_index])

        return {
            'sentiment': sentiment_map[sentiment_index],
            'confidence': round(confidence * 100, 2),
            'probabilities': {
                'negative': round(prediction[0] * 100, 2),
                'neutral': round(prediction[1] * 100, 2),
                'positive': round(prediction[2] * 100, 2)
            }
        }

    def analyze_stock_sentiment(self, symbol):
        """Analyze overall sentiment for a stock"""
        logger.info(f"Analyzing sentiment for {symbol}...")

        # Fetch news and social media data
        news_data = self.fetch_news_data(symbol)
        social_data = self.fetch_social_media_data(symbol)

        all_data = news_data + social_data

        if not all_data:
            return {
                'symbol': symbol,
                'overall_sentiment': 'neutral',
                'confidence': 0.0,
                'total_sources': 0,
                'sentiment_breakdown': {'positive': 0, 'neutral': 0, 'negative': 0},
                'recent_news': [],
                'social_sentiment': []
            }

        # Analyze each item
        sentiments = []
        for item in all_data:
            text = item.get('title', '') + ' ' + item.get('content', '') + ' ' + item.get('text', '')
            analysis = self.predict_sentiment(text)
            sentiments.append(analysis)

        # Calculate overall sentiment
        positive_count = sum(1 for s in sentiments if s['sentiment'] == 'positive')
        neutral_count = sum(1 for s in sentiments if s['sentiment'] == 'neutral')
        negative_count = sum(1 for s in sentiments if s['sentiment'] == 'negative')

        total = len(sentiments)
        max_sentiment = max(positive_count, neutral_count, negative_count)

        if max_sentiment == positive_count:
            overall_sentiment = 'positive'
            confidence = (positive_count / total) * 100
        elif max_sentiment == negative_count:
            overall_sentiment = 'negative'
            confidence = (negative_count / total) * 100
        else:
            overall_sentiment = 'neutral'
            confidence = (neutral_count / total) * 100

        return {
            'symbol': symbol,
            'overall_sentiment': overall_sentiment,
            'confidence': round(confidence, 2),
            'total_sources': total,
            'sentiment_breakdown': {
                'positive': positive_count,
                'neutral': neutral_count,
                'negative': negative_count
            },
            'recent_news': news_data[:3],  # Top 3 news items
            'social_sentiment': social_data[:3],  # Top 3 social items
            'timestamp': datetime.now().isoformat()
        }

    def get_market_sentiment(self):
        """Get overall market sentiment analysis"""
        logger.info("Analyzing market-wide sentiment...")

        major_stocks = self.load_sp500_data()
        market_sentiments = []

        for symbol in major_stocks[:10]:  # Analyze top 10 for performance
            try:
                sentiment = self.analyze_stock_sentiment(symbol)
                market_sentiments.append(sentiment)
            except Exception as e:
                logger.error(f"Error analyzing {symbol}: {e}")

        if not market_sentiments:
            return {
                'market_sentiment': 'neutral',
                'confidence': 0.0,
                'analyzed_stocks': 0,
                'stock_sentiments': []
            }

        # Calculate market sentiment
        positive_stocks = sum(1 for s in market_sentiments if s['overall_sentiment'] == 'positive')
        negative_stocks = sum(1 for s in market_sentiments if s['overall_sentiment'] == 'negative')
        neutral_stocks = sum(1 for s in market_sentiments if s['overall_sentiment'] == 'neutral')

        total_stocks = len(market_sentiments)

        if positive_stocks > negative_stocks and positive_stocks > neutral_stocks:
            market_sentiment = 'bullish'
            confidence = (positive_stocks / total_stocks) * 100
        elif negative_stocks > positive_stocks and negative_stocks > neutral_stocks:
            market_sentiment = 'bearish'
            confidence = (negative_stocks / total_stocks) * 100
        else:
            market_sentiment = 'neutral'
            confidence = (neutral_stocks / total_stocks) * 100

        return {
            'market_sentiment': market_sentiment,
            'confidence': round(confidence, 2),
            'analyzed_stocks': total_stocks,
            'stock_sentiments': market_sentiments,
            'breakdown': {
                'bullish_stocks': positive_stocks,
                'bearish_stocks': negative_stocks,
                'neutral_stocks': neutral_stocks
            },
            'timestamp': datetime.now().isoformat()
        }

# Global instance
sentiment_analyzer = StockSentimentAnalyzer()

def initialize_sentiment_model():
    """Initialize and train the sentiment model if not exists"""
    os.makedirs('models', exist_ok=True)

    if not os.path.exists('models/sentiment_model.h5'):
        logger.info("Training new sentiment model...")
        sentiment_analyzer.train_model(epochs=20, batch_size=16)
    else:
        logger.info("Loading existing sentiment model...")
        sentiment_analyzer.load_model()

def get_stock_sentiment(symbol: str):
    """Get sentiment analysis for a specific stock"""
    return sentiment_analyzer.analyze_stock_sentiment(symbol)

def get_market_sentiment():
    """Get overall market sentiment analysis"""
    return sentiment_analyzer.get_market_sentiment()

if __name__ == "__main__":
    # Initialize and test the model
    initialize_sentiment_model()

    # Test with sample data
    test_symbol = "AAPL"
    result = get_stock_sentiment(test_symbol)
    print(f"Sentiment analysis for {test_symbol}:")
    print(result)

    market_result = get_market_sentiment()
    print("\nMarket sentiment analysis:")
    print(market_result)