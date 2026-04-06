-- Stock Dashboard Database Initialization
-- Run this script when setting up MySQL database

CREATE DATABASE IF NOT EXISTS stock_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stock_dashboard;

-- Users table with optimized schema
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    watchlist TEXT DEFAULT '[]' NOT NULL COMMENT 'JSON array of stock symbols',
    theme VARCHAR(20) DEFAULT 'light' NOT NULL,
    notifications BOOLEAN DEFAULT TRUE NOT NULL,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User accounts and preferences';

-- User stocks table for watchlist management
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User watchlist and favorites';

-- Insert sample data for testing
INSERT IGNORE INTO users (email, username, hashed_password, full_name, watchlist, theme, notifications)
VALUES
('admin@example.com', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYLC3zWJjK', 'Admin User', '["AAPL", "GOOGL", "MSFT"]', 'dark', true),
('demo@example.com', 'demo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYLC3zWJjK', 'Demo User', '["TSLA", "NVDA", "AMZN"]', 'light', true);

-- Sample watchlist entries
INSERT IGNORE INTO user_stocks (user_id, symbol, is_favorite)
SELECT u.id, 'AAPL', true FROM users u WHERE u.username = 'admin'
UNION ALL
SELECT u.id, 'GOOGL', false FROM users u WHERE u.username = 'admin'
UNION ALL
SELECT u.id, 'MSFT', true FROM users u WHERE u.username = 'admin'
UNION ALL
SELECT u.id, 'TSLA', true FROM users u WHERE u.username = 'demo'
UNION ALL
SELECT u.id, 'NVDA', false FROM users u WHERE u.username = 'demo'
UNION ALL
SELECT u.id, 'AMZN', false FROM users u WHERE u.username = 'demo';

-- Create a view for user watchlist summary
CREATE OR REPLACE VIEW user_watchlist_summary AS
SELECT
    u.id as user_id,
    u.username,
    u.email,
    COUNT(us.id) as total_stocks,
    SUM(us.is_favorite) as favorite_stocks,
    GROUP_CONCAT(us.symbol ORDER BY us.added_at) as symbols
FROM users u
LEFT JOIN user_stocks us ON u.id = us.user_id
GROUP BY u.id, u.username, u.email;

-- Grant permissions for MySQL Workbench access
-- GRANT ALL PRIVILEGES ON stock_dashboard.* TO 'stockuser'@'%' IDENTIFIED BY 'stockpass';
-- FLUSH PRIVILEGES;