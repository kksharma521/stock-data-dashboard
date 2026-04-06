#!/usr/bin/env python3
"""
Database Setup Script for Stock Dashboard
This script sets up MySQL database and creates tables
"""

import mysql.connector
from mysql.connector import Error
import sys

def create_database():
    """Create MySQL database and tables"""
    try:
        # Connect to MySQL server (without specifying database)
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='password'
        )

        if connection.is_connected():
            cursor = connection.cursor()

            # Create database
            cursor.execute("CREATE DATABASE IF NOT EXISTS stock_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print("✅ Database 'stock_dashboard' created successfully")

            # Use the database
            cursor.execute("USE stock_dashboard")

            # Create users table
            create_users_table = """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                username VARCHAR(50) NOT NULL UNIQUE,
                hashed_password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                watchlist TEXT DEFAULT '[]' NOT NULL,
                theme VARCHAR(20) DEFAULT 'light' NOT NULL,
                notifications BOOLEAN DEFAULT TRUE NOT NULL,
                INDEX idx_email (email),
                INDEX idx_username (username),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """

            # Create user_stocks table
            create_user_stocks_table = """
            CREATE TABLE IF NOT EXISTS user_stocks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                symbol VARCHAR(10) NOT NULL,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_symbol (symbol),
                INDEX idx_user_symbol (user_id, symbol),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """

            cursor.execute(create_users_table)
            print("✅ Users table created successfully")

            cursor.execute(create_user_stocks_table)
            print("✅ User stocks table created successfully")

            # Insert sample data
            insert_sample_data(cursor)
            print("✅ Sample data inserted successfully")

    except Error as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("✅ MySQL connection closed")

def insert_sample_data(cursor):
    """Insert sample data for testing"""
    # Check if sample user exists
    cursor.execute("SELECT COUNT(*) FROM users WHERE email = 'admin@example.com'")
    if cursor.fetchone()[0] == 0:
        # Insert sample admin user
        cursor.execute("""
            INSERT INTO users (email, username, hashed_password, full_name, watchlist, theme, notifications)
            VALUES ('admin@example.com', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYLC3zWJjK', 'Admin User', '["AAPL", "GOOGL", "MSFT"]', 'dark', true)
        """)
        print("✅ Sample admin user created (password: admin123)")

if __name__ == "__main__":
    print("🚀 Setting up Stock Dashboard Database...")
    create_database()
    print("🎉 Database setup completed!")
    print("\n📋 MySQL Workbench Connection Details:")
    print("Host: localhost")
    print("Port: 3306")
    print("Username: root")
    print("Password: password")
    print("Database: stock_dashboard")