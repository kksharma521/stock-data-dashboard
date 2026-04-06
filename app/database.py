from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Integer, Float, Text, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database configuration with fallback
# Try MySQL first, fallback to SQLite
MYSQL_URL = "mysql+pymysql://root:password@localhost/stock_dashboard"
SQLITE_URL = "sqlite:///./stock_dashboard.db"

# Check if MySQL is available
engine = None
try:
    engine = create_engine(MYSQL_URL, echo=False)
    # Test connection
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        DATABASE_URL = MYSQL_URL
        print("✅ Using MySQL database")
    except Exception as e:
        print(f"⚠️  MySQL not available ({e}), falling back to SQLite")
        engine = None
except Exception as e:
    print(f"⚠️  MySQL driver not available ({e}), falling back to SQLite")
    engine = None

# Fall back to SQLite if MySQL is not available
if engine is None:
    DATABASE_URL = SQLITE_URL
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # User preferences stored as JSON
    watchlist = Column(Text, default="[]", nullable=False)  # JSON array of stock symbols
    theme = Column(String(20), default="light", nullable=False)
    notifications = Column(Boolean, default=True, nullable=False)

    # Two-factor authentication
    two_factor_enabled = Column(Boolean, default=False, nullable=False)
    two_factor_secret = Column(String(255), nullable=True)  # Encrypted TOTP secret

    # Security tracking
    last_login = Column(DateTime, nullable=True)
    login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)

    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4',
        'mysql_collate': 'utf8mb4_unicode_ci'
    }


class UserStock(Base):
    __tablename__ = "user_stocks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)
    symbol = Column(String(10), index=True, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_favorite = Column(Boolean, default=False, nullable=False)

    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4',
        'mysql_collate': 'utf8mb4_unicode_ci'
    }


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
