# FlowList Pro - Quick Start Guide

## Prerequisites

- Node.js v18+ installed
- MongoDB installed and running
- Git installed

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Todo-List-Web-Application
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

Example `.env` contents:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/flowlist-pro
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
```

### 4. Start MongoDB

```bash
# If using local MongoDB
mongod

# Or if using MongoDB service
sudo service mongodb start
```

### 5. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend should now be running on `http://localhost:5000`.

### 6. Serve the Frontend

You can use any static file server. Here are a few options:

#### Option A: Python HTTP Server
```bash
cd frontend/public
python3 -m http.server 3000
```

#### Option B: Node HTTP Server
```bash
# Install http-server globally
npm install -g http-server

# Serve frontend
cd frontend/public
http-server -p 3000
```

#### Option C: VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click on `frontend/public/index.html`
3. Select "Open with Live Server"

The frontend should now be accessible at `http://localhost:3000`.

## First Time Setup

### 1. Create an Account

1. Open `http://localhost:3000` in your browser
2. Click "Register" or "Don't have an account?"
3. Fill in your details:
   - Name: Your full name
   - Email: Your email address
   - Password: Minimum 8 characters
   - Confirm Password: Re-enter password
4. Click "Create Account"
5. You'll be redirected to the dashboard

### 2. Add Your First Task

1. In the task input field, type your first task
2. Press Enter or click "Add Task"
3. The task appears in the list below

### 3. Explore the Features

#### Priority Matrix
1. Click "Priority Matrix" in the sidebar
2. Drag tasks between quadrants to set priority
3. Quadrants:
   - **Do First:** Urgent & Important
   - **Schedule:** Not Urgent but Important
   - **Delegate:** Urgent but Not Important
   - **Eliminate:** Not Urgent & Not Important

#### Pomodoro Timer
1. Find the timer in the right sidebar
2. Click "Start" to begin a 25-minute focus session
3. Timer will notify you when time is up
4. Break time starts automatically

#### Time Blocker
1. Click "Time Blocker" in the sidebar
2. Drag unscheduled tasks to time slots
3. Navigate between days using arrows
4. Click "Today" to return to current day

#### Analytics
1. Click "Analytics" in the sidebar
2. View your productivity metrics
3. Change date range (7/30/90 days)
4. See insights and recommendations

#### Energy Tracker
1. Find the energy tracker in the right sidebar
2. Click an emoji to log your current energy level
3. Track energy patterns throughout the day

## Keyboard Shortcuts

- `Cmd/Ctrl + K` - Focus search
- `Cmd/Ctrl + N` - New task
- `Cmd/Ctrl + 1` - Navigate to Tasks
- `Cmd/Ctrl + 2` - Navigate to Priority Matrix
- `Cmd/Ctrl + 3` - Navigate to Time Blocker
- `Cmd/Ctrl + 4` - Navigate to Analytics
- `Esc` - Close modals

## Troubleshooting

### Backend won't start

**Error: `EADDRINUSE`**
- Another process is using port 5000
- Solution: Change `PORT` in `.env` or kill the process:
  ```bash
  # Find process
  lsof -i :5000

  # Kill process
  kill -9 <PID>
  ```

**Error: `MongooseError: connect ECONNREFUSED`**
- MongoDB is not running
- Solution: Start MongoDB:
  ```bash
  mongod
  # or
  sudo service mongodb start
  ```

**Error: `JWT_SECRET is not defined`**
- Missing environment variables
- Solution: Create `.env` file in `backend` directory with proper values

### Frontend issues

**Error: `Failed to load tasks: 401`**
- Authentication token expired or invalid
- Solution: Logout and login again

**Error: `CORS policy: No 'Access-Control-Allow-Origin'`**
- Backend CORS not configured properly
- Solution: Check `CORS_ORIGIN` in backend `.env` matches frontend URL

**API calls failing**
- Check backend is running on correct port
- Verify `API_BASE` in frontend API modules matches backend URL
- Default: `http://localhost:5000/api/v1`

### Browser compatibility

**Features not working**
- Use a modern browser: Chrome 61+, Firefox 60+, Safari 11+, Edge 16+
- Enable JavaScript
- Allow notifications for Pomodoro timer alerts

## Project Structure

```
Todo-List-Web-Application/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Authentication, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── controllers/     # Business logic
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
└── frontend/
    └── public/
        ├── index.html           # Login/Register page
        ├── dashboard.html       # Main app
        ├── css/                 # Stylesheets
        └── js/
            ├── api/             # API modules
            ├── components/      # UI components
            ├── utils/           # Utilities
            ├── auth.js          # Auth page logic
            └── app.js           # Main app logic
```

## Development Workflow

### Making Changes

1. **Backend Changes:**
   - Edit files in `backend/`
   - Server auto-restarts with nodemon
   - Test with Postman or frontend

2. **Frontend Changes:**
   - Edit files in `frontend/public/`
   - Refresh browser to see changes
   - Use browser DevTools for debugging

### Testing

```bash
# Backend tests (if configured)
cd backend
npm test

# Frontend - manual testing in browser
# Use browser DevTools Console to check for errors
```

### Debugging

**Backend:**
- Check terminal logs
- Use `console.log()` for debugging
- Use Postman to test API endpoints

**Frontend:**
- Open browser DevTools (F12)
- Check Console for errors
- Use Network tab to inspect API calls
- Check Application > Local Storage for stored data

## Common Tasks

### Reset Password

Currently manual process:
1. Access MongoDB
2. Delete user or update password hash
3. Or use backend API endpoint (if implemented)

### Clear All Data

```bash
# Clear MongoDB database
mongo
use flowlist-pro
db.dropDatabase()
```

### Export Data

Use Analytics > Export button (if implemented) or:
```bash
# MongoDB export
mongoexport --db flowlist-pro --collection tasks --out tasks.json
```

## API Documentation

### Authentication Endpoints

```
POST /api/v1/auth/register  - Register new user
POST /api/v1/auth/login     - Login user
POST /api/v1/auth/logout    - Logout user
GET  /api/v1/auth/me        - Get current user
```

### Task Endpoints

```
GET    /api/v1/tasks        - Get all tasks
POST   /api/v1/tasks        - Create task
GET    /api/v1/tasks/:id    - Get task by ID
PATCH  /api/v1/tasks/:id    - Update task
DELETE /api/v1/tasks/:id    - Delete task
```

### Pomodoro Endpoints

```
POST /api/v1/pomodoro/start       - Start session
POST /api/v1/pomodoro/:id/complete - Complete session
GET  /api/v1/pomodoro/active      - Get active session
GET  /api/v1/pomodoro/stats       - Get statistics
```

### Energy Endpoints

```
POST /api/v1/energy         - Log energy level
GET  /api/v1/energy/today   - Get today's logs
GET  /api/v1/energy/stats   - Get statistics
```

### Analytics Endpoints

```
GET /api/v1/analytics/dashboard  - Get dashboard data
GET /api/v1/analytics/trends     - Get trends
GET /api/v1/analytics/insights   - Get AI insights
```

## Support & Resources

- **Documentation:** See `CLAUDE.md` for coding standards
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`
- **Issues:** Create GitHub issue (if repository is public)

## What's Next?

1. **Customize Pomodoro Settings:**
   - Click settings icon in timer
   - Adjust work/break durations
   - Save preferences

2. **Set Up Categories:**
   - Add category to tasks (e.g., "Work", "Personal")
   - Filter by category in task list

3. **Track Your Productivity:**
   - Use Pomodoro timer regularly
   - Log energy levels throughout day
   - Review Analytics weekly

4. **Optimize Your Workflow:**
   - Use Priority Matrix to organize tasks
   - Schedule tasks in Time Blocker
   - Follow insights in Analytics

## Tips for Maximum Productivity

1. **Start with Priority Matrix:** Organize tasks by urgency and importance
2. **Time Block Your Day:** Schedule focused work periods
3. **Use Pomodoro Technique:** 25-minute focus sessions with breaks
4. **Track Energy Levels:** Schedule hard tasks during high-energy times
5. **Review Analytics Weekly:** Learn from your patterns
6. **Keep Tasks Under 140 Characters:** Forces clarity and focus
7. **Use Tags for Context:** Add #project or #context tags
8. **Set Realistic Deadlines:** Avoid overcommitment
9. **Take Breaks Seriously:** Rest is part of productivity
10. **Celebrate Wins:** Check off completed tasks and see your progress

## Need Help?

If you encounter issues not covered here:

1. Check browser console for errors (F12)
2. Check backend terminal for errors
3. Verify MongoDB is running
4. Ensure all dependencies are installed
5. Review `IMPLEMENTATION_SUMMARY.md` for technical details
6. Check `CLAUDE.md` for project architecture

Happy productivity! 🚀
