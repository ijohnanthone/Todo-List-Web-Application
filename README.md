# FlowList Pro

A comprehensive full-stack productivity hub that transforms task management into an intelligent workflow system. Built for students and workers who need more than just a simple todo list.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D5.0-green.svg)

## 🚀 Features

### Core Functionality
- **Smart Task Management** - Priority matrix (Eisenhower), categories, tags, deadlines
- **Pomodoro Timer** - Customizable work/break intervals with session tracking
- **Energy Tracking** - Monitor energy levels throughout the day
- **Study Sessions** - Dedicated study time tracking and analytics
- **Time Blocking** - Calendar-based task scheduling
- **Daily Standups** - Quick daily notes and reflections
- **Analytics Dashboard** - Productivity insights and statistics

### Advanced Features
- **Recurring Tasks** - Daily, weekly, monthly patterns
- **Collaboration** - Share tasks with view/edit permissions
- **Comments** - Task-level discussions and notes
- **Cloud Sync** - MongoDB-backed data persistence
- **Secure Authentication** - JWT-based auth with bcrypt encryption

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
  - Download: [https://nodejs.org/](https://nodejs.org/)
  - Verify: `node --version`

- **MongoDB** (v5.0 or higher)
  - Local Installation: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
  - Or use MongoDB Atlas (cloud): [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
  - Verify: `mongod --version`

- **npm** (comes with Node.js)
  - Verify: `npm --version`

- **Git** (for version control)
  - Download: [https://git-scm.com/](https://git-scm.com/)
  - Verify: `git --version`

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ijohnanthone/Todo-List-Web-Application.git
cd Todo-List-Web-Application
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

**Dependencies installed:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables
- `cors` - Cross-Origin Resource Sharing
- `helmet` - Security headers
- `express-validator` - Input validation
- `express-rate-limit` - Rate limiting

**Dev dependencies:**
- `nodemon` - Auto-restart during development

### 3. Install Frontend Dependencies

Currently, the frontend uses vanilla JavaScript with no build step required. No installation needed for frontend.

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp ../.env.example .env
```

### 2. Edit the `.env` File

Open `backend/.env` and configure the following variables:

```env
# Environment
NODE_ENV=development

# Server
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/flowlist-pro

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-here-change-in-production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Important Configuration Notes:**

- **MONGODB_URI**:
  - For local MongoDB: `mongodb://localhost:27017/flowlist-pro`
  - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/flowlist-pro`

- **JWT_SECRET**:
  - **CRITICAL**: Change this to a strong, random string (minimum 32 characters)
  - Generate a secure secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Never commit the actual secret to version control

- **CORS_ORIGIN**:
  - Development: `http://localhost:3000` or your frontend URL
  - Production: Your production domain

### 3. MongoDB Setup

#### Option A: Local MongoDB

1. **Start MongoDB service:**

   ```bash
   # macOS (via Homebrew)
   brew services start mongodb-community

   # Linux (systemd)
   sudo systemctl start mongod

   # Windows
   net start MongoDB
   ```

2. **Verify MongoDB is running:**

   ```bash
   mongo --eval 'db.runCommand({ connectionStatus: 1 })'
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add a database user (remember username/password)
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get the connection string and update `MONGODB_URI` in `.env`

## 🏃 Running the Application

### Development Mode

#### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend API will start at: `http://localhost:5000`

You should see:
```
Server running in development mode on port 5000
MongoDB Connected: localhost
```

#### 2. Start the Frontend

Since the frontend is vanilla JavaScript, simply open the HTML files in a browser or use a simple HTTP server:

**Option A: Using VS Code Live Server**
1. Install "Live Server" extension in VS Code
2. Right-click `frontend/public/index.html`
3. Select "Open with Live Server"

**Option B: Using Python HTTP Server**
```bash
cd frontend/public
python3 -m http.server 3000
```

**Option C: Using Node.js HTTP Server**
```bash
# Install http-server globally
npm install -g http-server

# Run server
cd frontend/public
http-server -p 3000
```

The frontend will be available at: `http://localhost:3000`

### Production Mode

```bash
cd backend
NODE_ENV=production npm start
```

## 📁 Project Structure

```
Todo-List-Web-Application/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── taskController.js    # Task CRUD operations
│   │   ├── pomodoroController.js
│   │   ├── energyController.js
│   │   ├── studySessionController.js
│   │   ├── standupController.js
│   │   ├── commentController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js       # Error handling
│   │   ├── rateLimiter.js        # Rate limiting
│   │   └── validator.js          # Input validation
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Task.js               # Task schema
│   │   ├── PomodoroSession.js
│   │   ├── EnergyLog.js
│   │   ├── StudySession.js
│   │   ├── Standup.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── auth.js               # Auth endpoints
│   │   ├── tasks.js              # Task endpoints
│   │   ├── pomodoro.js
│   │   ├── energy.js
│   │   ├── studySessions.js
│   │   ├── standups.js
│   │   ├── comments.js
│   │   ├── taskComments.js
│   │   └── analytics.js
│   ├── server.js                 # Entry point
│   ├── package.json
│   └── .env                      # Environment variables (create this)
├── frontend/
│   └── public/
│       ├── index.html            # Login/Register page
│       ├── css/
│       │   ├── variables.css     # CSS custom properties
│       │   ├── base.css          # Base styles
│       │   ├── components.css    # Reusable components
│       │   ├── layouts.css       # Layout styles
│       │   └── features.css      # Feature-specific styles
│       └── js/                   # JavaScript modules (pending)
├── .env.example                  # Environment template
├── .gitignore
├── CLAUDE.md                     # Development guidelines
└── README.md                     # This file
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "both"  // "student", "worker", or "both"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Task Endpoints

#### Get All Tasks
```http
GET /api/v1/tasks
Authorization: Bearer <token>

Query Parameters:
- completed: true/false
- priority: urgent-important, not-urgent-important, etc.
- category: string
- search: string
- page: number (default: 1)
- limit: number (default: 20)
```

#### Create Task
```http
POST /api/v1/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Complete project proposal",
  "priority": "urgent-important",
  "category": "Work",
  "tags": ["project", "deadline"],
  "deadline": "2026-03-15T23:59:59Z",
  "estimatedPomodoros": 4
}
```

#### Update Task
```http
PATCH /api/v1/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Updated task text",
  "completed": true
}
```

#### Delete Task
```http
DELETE /api/v1/tasks/:id
Authorization: Bearer <token>
```

### Other Endpoints

- **Pomodoro Sessions**: `/api/v1/pomodoro`
- **Energy Logs**: `/api/v1/energy`
- **Study Sessions**: `/api/v1/study-sessions`
- **Standups**: `/api/v1/standups`
- **Comments**: `/api/v1/comments`
- **Analytics**: `/api/v1/analytics`

### Health Check

```http
GET /api/v1/health

Response:
{
  "success": true,
  "message": "FlowList Pro API is running",
  "timestamp": "2026-03-06T02:00:00.000Z"
}
```

## 🛠️ Development

### Code Style Guidelines

Follow the conventions in `CLAUDE.md`:

- **JavaScript**: camelCase for variables/functions, PascalCase for classes
- **Error Handling**: Always use try-catch with async/await
- **Comments**: Use JSDoc for functions and classes
- **Security**: Validate all inputs, sanitize outputs

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: Add feature description"

# Push to remote
git push origin feature/feature-name

# Create Pull Request on GitHub
```

### Commit Message Convention

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## 🧪 Testing

### Backend Tests (Pending Implementation)

```bash
cd backend
npm test
```

### Manual Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] JWT token is stored and used
- [ ] Create task endpoint works
- [ ] Update task endpoint works
- [ ] Delete task endpoint works
- [ ] Filter tasks by priority
- [ ] Search tasks
- [ ] Pomodoro session creation
- [ ] Energy log creation
- [ ] Analytics data retrieval

## 🚀 Deployment

### Backend Deployment (Heroku Example)

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create flowlist-pro-api
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-production-secret
   heroku config:set MONGODB_URI=your-mongodb-atlas-uri
   heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
   ```

5. **Deploy**
   ```bash
   git subtree push --prefix backend heroku main
   ```

### Frontend Deployment (Netlify/Vercel)

1. Connect your GitHub repository to Netlify or Vercel
2. Set build directory to `frontend/public`
3. Deploy

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error**: `MongooseServerSelectionError`

**Solution**:
1. Verify MongoDB is running: `mongod --version`
2. Check connection string in `.env`
3. Ensure no firewall blocking port 27017
4. For Atlas: Verify IP whitelist and credentials

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### JWT Authentication Errors

**Error**: `JsonWebTokenError: invalid token`

**Solution**:
1. Ensure token is sent in Authorization header: `Bearer <token>`
2. Verify JWT_SECRET matches between requests
3. Check token expiration (default: 7 days)
4. Clear browser localStorage and re-login

### CORS Errors

**Error**: `Access to fetch at ... has been blocked by CORS policy`

**Solution**:
1. Verify `CORS_ORIGIN` in `.env` matches frontend URL
2. Ensure credentials are included in fetch requests
3. Check backend CORS configuration in `server.js`

## 📖 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [REST API Best Practices](https://restfulapi.net/)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**John Anthony**
- GitHub: [@ijohnanthone](https://github.com/ijohnanthone)

## 🙏 Acknowledgments

- Built with guidance from architectural best practices
- Inspired by productivity methodologies (GTD, Pomodoro, Eisenhower Matrix)
- Co-developed with Claude Sonnet 4.5

---

**Need Help?** Open an issue on GitHub or contact the maintainer.

**Happy Productivity! 🚀**
