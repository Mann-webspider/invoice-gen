# OpenSwoole to Node.js/Express Conversion Guide

## Project Overview
This is a backend API service that manages dropdown options and related data. The original implementation uses PHP with Slim Framework and SQLite. This document outlines the requirements for converting it to Node.js/Express.

## Core Features
1. Dropdown Management System
2. CRUD Operations for various entities
3. SQLite Database Integration
4. RESTful API Endpoints

## Database Schema

### Tables

#### dropdown_categories
```sql
CREATE TABLE dropdown_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### dropdown_options
```sql
CREATE TABLE dropdown_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category) REFERENCES dropdown_categories(name)
);
```

## API Endpoints

### Dropdown Management
- `GET /api/all-dropdowns` - Get all dropdown values
- `GET /api/dropdown-options` - Get all dropdown options
- `GET /api/dropdown-categories` - Get all dropdown categories
- `GET /api/dropdown-options/{category}` - Get options for specific category
- `POST /api/dropdown-options` - Create new dropdown option
- `PUT /api/dropdown-options/{id}` - Update dropdown option
- `DELETE /api/dropdown-options/{id}` - Delete dropdown option
- `PUT /api/dropdown-options/{id}/toggle` - Toggle option active status
- `PUT /api/dropdown-options/{category}/reorder` - Reorder options in category

### Data Models

#### DropdownOption
```javascript
{
    id: number,
    category: string,
    value: string,
    label: string,
    is_active: boolean,
    sort_order: number,
    created_at: Date,
    updated_at: Date
}
```

#### DropdownCategory
```javascript
{
    id: number,
    name: string,
    description: string,
    created_at: Date,
    updated_at: Date
}
```

## Required Node.js Dependencies
```json
{
    "dependencies": {
        "express": "^4.18.2",
        "sqlite3": "^5.1.6",
        "sequelize": "^6.35.1",
        "cors": "^2.8.5",
        "body-parser": "^1.20.2",
        "morgan": "^1.10.0"
    },
    "devDependencies": {
        "nodemon": "^3.0.2",
        "jest": "^29.7.0"
    }
}
```

## Project Structure
```
project/
├── src/
│   ├── models/
│   │   ├── DropdownOption.js
│   │   └── DropdownCategory.js
│   ├── controllers/
│   │   └── DropdownController.js
│   ├── routes/
│   │   └── dropdownRoutes.js
│   ├── config/
│   │   └── database.js
│   └── app.js
├── migrations/
│   └── create_dropdown_tables.sql
├── database.sqlite
└── package.json
```

## Implementation Requirements

### 1. Database Setup
- Use SQLite with Sequelize ORM
- Implement migrations for table creation
- Set up proper foreign key relationships
- Include default category data

### 2. Models
- Implement Sequelize models for all tables
- Define proper relationships between models
- Include validation rules
- Implement timestamps

### 3. Controllers
- Implement CRUD operations for all endpoints
- Include proper error handling
- Add input validation
- Implement sorting and filtering

### 4. Routes
- Set up Express router
- Implement all required endpoints
- Add proper middleware (auth, validation, etc.)
- Include error handling middleware

### 5. API Response Format
```javascript
// Success Response
{
    "status": "success",
    "data": {
        // Response data
    }
}

// Error Response
{
    "status": "error",
    "message": "Error message",
    "errors": [
        // Validation errors
    ]
}
```

## Testing Requirements
- Unit tests for models
- API endpoint tests
- Database integration tests
- Error handling tests

## Performance Considerations
- Implement proper indexing
- Add caching where appropriate
- Optimize database queries
- Handle concurrent requests

## Security Requirements
- Input validation
- SQL injection prevention
- CORS configuration
- Rate limiting
- Error message sanitization

## Additional Notes
- Maintain backward compatibility with existing API
- Document all new endpoints
- Include proper logging
- Implement proper error handling
- Add request validation middleware
- Include proper status codes in responses

## Migration Steps
1. Set up Node.js project structure
2. Install required dependencies
3. Create database models
4. Implement controllers
5. Set up routes
6. Add middleware
7. Implement error handling
8. Add tests
9. Document API
10. Deploy and test 