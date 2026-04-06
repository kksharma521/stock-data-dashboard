# Stock Dashboard - Database Setup

## MySQL Database Setup

### Option 1: Docker (Recommended)

1. **Install Docker Desktop** (if not already installed)
   - Download from: https://www.docker.com/products/docker-desktop

2. **Start MySQL Database:**
   ```bash
   cd stock-dashboard
   docker-compose up -d
   ```

3. **Wait for MySQL to be ready** (check logs):
   ```bash
   docker-compose logs mysql
   ```

### Option 2: Local MySQL Installation

1. **Install MySQL Server:**
   - Download MySQL from: https://dev.mysql.com/downloads/mysql/
   - Or use package manager: `choco install mysql` (Windows)

2. **Start MySQL Service:**
   ```bash
   net start mysql
   ```

3. **Run Database Setup Script:**
   ```bash
   python setup_database.py
   ```

## MySQL Workbench Access

### Connection Details:
- **Host:** `localhost` or `127.0.0.1`
- **Port:** `3306`
- **Username:** `root` (Docker) or `stockuser` (local)
- **Password:** `password` (Docker) or `stockpass` (local)
- **Database:** `stock_dashboard`

### Steps to Connect:

1. **Open MySQL Workbench**
2. **Click "New Connection" (+ icon)**
3. **Enter connection details above**
4. **Test Connection** (should succeed)
5. **Open connection and explore tables**

## Database Schema

### Tables:

#### `users`
- User accounts and authentication
- Stores hashed passwords, preferences
- Watchlist stored as JSON array

#### `user_stocks`
- Individual stock entries in user watchlists
- Links users to their favorite stocks
- Tracks when stocks were added

### Views:

#### `user_watchlist_summary`
- Summary of user watchlists
- Shows total stocks, favorites, and symbols

## Sample Data

The database includes sample users:
- **admin@example.com** / **admin** (password: admin123)
- **demo@example.com** / **demo** (password: admin123)

## Troubleshooting

### Connection Issues:
1. **Check if MySQL is running:**
   ```bash
   docker-compose ps  # For Docker
   netstat -an | find "3306"  # For local MySQL
   ```

2. **Reset Docker containers:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

3. **Check MySQL logs:**
   ```bash
   docker-compose logs mysql
   ```

### Permission Issues:
- Ensure MySQL user has proper permissions
- For Docker: containers run as root by default
- For local: grant permissions in MySQL

## Security Notes

- **Change default passwords** in production
- **Use environment variables** for sensitive data
- **Enable SSL** for MySQL connections
- **Regular backups** of database

## Migration from SQLite

If migrating from SQLite:
1. Export data from SQLite database
2. Transform data to match MySQL schema
3. Import into MySQL database
4. Update application configuration