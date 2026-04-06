from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import string
import random
import hashlib
import hmac
import time
import re
from collections import defaultdict

# ✅ Advanced Password hashing with multiple algorithms
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "argon2"],
    default="pbkdf2_sha256",
    pbkdf2_sha256__default_rounds=30000
)

# ✅ JWT configuration with refresh tokens
SECRET_KEY = "your-secret-key-change-in-production-jarnox-stock-dashboard-2026-advanced-auth"
REFRESH_SECRET_KEY = "refresh-secret-key-change-in-production-jarnox-stock-dashboard-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Short-lived access tokens
REFRESH_TOKEN_EXPIRE_DAYS = 30

# ✅ Rate limiting storage (in production, use Redis)
rate_limit_store = defaultdict(list)

# ✅ 2FA configuration
TOTP_WINDOW = 30  # seconds
TOTP_DIGITS = 6

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hashed password with timing attack protection"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password with strong parameters"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify JWT token with type checking"""
    try:
        secret = SECRET_KEY if token_type == "access" else REFRESH_SECRET_KEY
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])

        if payload.get("type") != token_type:
            return None

        email: str = payload.get("sub")
        if email is None:
            return None
        return payload
    except JWTError:
        return None


def validate_password(password: str) -> dict:
    """Advanced password validation with entropy calculation"""
    issues = []
    score = 0

    # Length check
    if len(password) < 12:
        issues.append("Password must be at least 12 characters long")
    else:
        score += 1

    # Character variety
    char_sets = [
        (re.compile(r'[a-z]'), "lowercase letters", 1),
        (re.compile(r'[A-Z]'), "uppercase letters", 1),
        (re.compile(r'\d'), "numbers", 1),
        (re.compile(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]'), "special characters", 2)
    ]

    for pattern, desc, points in char_sets:
        if pattern.search(password):
            score += points
        else:
            issues.append(f"Password must contain {desc}")

    # Dictionary words check (basic)
    common_words = ["password", "123456", "qwerty", "admin", "user", "login"]
    if any(word in password.lower() for word in common_words):
        issues.append("Password contains common dictionary words")
        score = max(0, score - 1)

    # Sequential characters check
    if re.search(r'(.)\1{2,}', password):  # Repeated characters
        issues.append("Password contains repeated characters")
        score = max(0, score - 1)

    return {
        "valid": len(issues) == 0 and score >= 4,
        "issues": issues,
        "score": score,
        "strength": "Very Weak" if score < 2 else "Weak" if score < 3 else "Fair" if score < 4 else "Good" if score < 5 else "Strong"
    }


def validate_email(email: str) -> bool:
    """Advanced email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email)) and len(email) <= 254


def check_rate_limit(identifier: str, max_requests: int = 5, window_seconds: int = 300) -> bool:
    """Rate limiting check"""
    now = time.time()
    request_times = rate_limit_store[identifier]

    # Remove old requests outside the window
    request_times[:] = [t for t in request_times if now - t < window_seconds]

    # Check if under limit
    if len(request_times) >= max_requests:
        return False

    # Add current request
    request_times.append(now)
    return True


def generate_stock_captcha() -> dict:
    """Generate stock market oriented CAPTCHA"""
    stock_terms = [
        "BULL", "BEAR", "IPO", "ETF", "NYSE", "NASDAQ", "DOW", "SP500",
        "AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA", "META", "NFLX",
        "LONG", "SHORT", "BUY", "SELL", "HOLD", "GAIN", "LOSS", "TREND",
        "VOLATILE", "STABLE", "DIVIDEND", "SPLIT", "MERGER", "ACQUIRE"
    ]

    # Generate 2-3 stock terms
    num_terms = random.randint(2, 3)
    selected_terms = random.sample(stock_terms, num_terms)

    # Create question
    operations = ["+", "-", "*", "SUM", "DIFF"]
    operation = random.choice(operations)

    if operation == "+":
        question = f"{selected_terms[0]} + {selected_terms[1]}"
        answer = selected_terms[0] + selected_terms[1]
    elif operation == "-":
        question = f"{selected_terms[0]} - {selected_terms[1]}"
        answer = selected_terms[0] + selected_terms[1]  # Concat for strings
    elif operation == "*":
        question = f"{selected_terms[0]} * {selected_terms[1]}"
        answer = selected_terms[0] + selected_terms[1]  # Concat for strings
    elif operation == "SUM":
        question = f"SUM of {selected_terms[0]} and {selected_terms[1]}"
        answer = selected_terms[0] + selected_terms[1]
    else:  # DIFF
        question = f"Combine {selected_terms[0]} and {selected_terms[1]}"
        answer = selected_terms[0] + selected_terms[1]

    if num_terms == 3:
        question += f" + {selected_terms[2]}"
        answer += selected_terms[2]

    return {
        "question": question,
        "answer": answer.upper(),
        "terms": selected_terms
    }


def verify_stock_captcha(user_input: str, correct_answer: str) -> bool:
    """Verify stock market CAPTCHA"""
    return user_input.upper().replace(" ", "") == correct_answer.replace(" ", "")


def generate_totp_secret() -> str:
    """Generate TOTP secret for 2FA"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=32))


def generate_totp_code(secret: str, time_step: int = None) -> str:
    """Generate TOTP code"""
    if time_step is None:
        time_step = int(time.time() // TOTP_WINDOW)

    # HMAC-SHA1
    key = secret.encode()
    msg = time_step.to_bytes(8, 'big')
    hmac_hash = hmac.new(key, msg, hashlib.sha1).digest()

    # Dynamic truncation
    offset = hmac_hash[-1] & 0x0F
    code = ((hmac_hash[offset] & 0x7F) << 24) | \
           ((hmac_hash[offset + 1] & 0xFF) << 16) | \
           ((hmac_hash[offset + 2] & 0xFF) << 8) | \
           (hmac_hash[offset + 3] & 0xFF)

    # Generate 6-digit code
    return str(code % (10 ** TOTP_DIGITS)).zfill(TOTP_DIGITS)


def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """Verify TOTP code with time window"""
    current_time = int(time.time() // TOTP_WINDOW)

    for i in range(-window, window + 1):
        if generate_totp_code(secret, current_time + i) == code:
            return True
    return False


def hash_sensitive_data(data: str) -> str:
    """Hash sensitive data for logging (not for passwords)"""
    return hashlib.sha256(data.encode()).hexdigest()


def sanitize_input(input_str: str, max_length: int = 1000) -> str:
    """Sanitize user input to prevent injection attacks"""
    if not input_str:
        return ""

    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>]', '', input_str)

    # Limit length
    return sanitized[:max_length].strip()
