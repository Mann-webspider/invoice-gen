# OpenSwoole Project

## Database Setup

1. Copy the environment file template:
   ```bash
   cp .env.example .env
   ```

2. Install MySQL if you haven't already:
   ```bash
   sudo apt update
   sudo apt install mysql-server
   ```

3. Start MySQL service:
   ```bash
   sudo service mysql start
   ```

4. Initialize the database:
   ```bash
   sudo mysql < database/init.sql
   ```

This will:
- Create the database `openswoole_db`
- Set up the necessary user with appropriate permissions
- Configure the database with UTF-8 encoding

## Environment Variables

The following environment variables are used in this project:

- `DB_HOST`: MySQL host (default: localhost)
- `DB_DATABASE`: Database name (default: openswoole_db)
- `DB_USERNAME`: Database username (default: root)
- `DB_PASSWORD`: Database password (default: empty)

Make sure to update these values in your `.env` file if you use different credentials. 

dockerfile name 
build command
docker build -t manndshelby/invoice-backend:latest -f dockerfile .

push command
docker push manndshelby/invoice-backend:latest


pull command 
docker compose pull php-app