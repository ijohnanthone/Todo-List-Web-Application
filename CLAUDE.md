# FlowList Pro - Development Guidelines

## Project Overview
FlowList Pro is a full-stack productivity hub that transforms a simple todo list into a comprehensive task management system for students and workers. The application features MongoDB authentication, cloud sync, and unique productivity tools.

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing, helmet for security headers
- **Validation**: express-validator
- **Environment**: dotenv for configuration

### Frontend
- **Core**: Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS with CSS custom properties
- **Build**: No build step required (native ES modules)
- **API Communication**: Fetch API with async/await
- **Storage**: localStorage for offline support

## Project Structure

```
Todo-List-Web-Application/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication middleware
│   │   └── errorHandler.js      # Global error handler
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Task.js               # Task schema
│   │   ├── PomodoroSession.js   # Pomodoro tracking
│   │   └── EnergyLog.js          # Energy level tracking
│   ├── routes/
│   │   ├── auth.js               # Login/Register/Logout
│   │   ├── tasks.js              # CRUD operations
│   │   ├── pomodoro.js           # Timer sessions
│   │   ├── analytics.js          # Stats and insights
│   │   └── collaboration.js      # Sharing features
│   ├── controllers/
│   │   └── [controller files]
│   ├── utils/
│   │   ├── validators.js         # Input validation
│   │   └── helpers.js            # Utility functions
│   └── server.js                 # Entry point
├── frontend/
│   ├── public/
│   │   ├── index.html            # Login/Register page
│   │   ├── dashboard.html        # Main app interface
│   │   ├── css/
│   │   │   ├── variables.css     # Design tokens
│   │   │   ├── base.css          # Reset and base styles
│   │   │   ├── components.css    # Reusable components
│   │   │   └── layouts.css       # Page layouts
│   │   └── js/
│   │       ├── api/
│   │       │   ├── auth.js       # Auth API calls
│   │       │   ├── tasks.js      # Task API calls
│   │       │   └── analytics.js  # Analytics API calls
│   │       ├── components/
│   │       │   ├── TaskList.js
│   │       │   ├── PomodoroTimer.js
│   │       │   ├── PriorityMatrix.js
│   │       │   ├── TimeBlocker.js
│   │       │   └── Analytics.js
│   │       ├── utils/
│   │       │   ├── storage.js    # localStorage helpers
│   │       │   └── formatters.js # Date/time formatters
│   │       ├── auth.js           # Authentication logic
│   │       └── app.js            # Main application logic
│   └── assets/
│       └── icons/                # SVG icons
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
├── CLAUDE.md                     # This file
└── README.md
```

## Coding Standards

### General Principles
1. **Keep it simple**: Favor readability over cleverness
2. **Separation of concerns**: Each module has a single responsibility
3. **DRY (Don't Repeat Yourself)**: Extract reusable logic into utilities
4. **Error handling**: Always handle errors gracefully with user-friendly messages
5. **Security first**: Validate all inputs, sanitize outputs, use parameterized queries

### JavaScript Style Guide

#### Naming Conventions
- **Variables/Functions**: camelCase (`getUserTasks`, `taskList`)
- **Classes**: PascalCase (`TaskController`, `PomodoroTimer`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_TASKS`)
- **Private methods**: Prefix with underscore (`_validateInput`)
- **Boolean variables**: Use "is", "has", "should" prefixes (`isCompleted`, `hasDeadline`)

#### Code Structure
```javascript
// ✅ GOOD: Clear, descriptive function names
async function createTaskWithDeadline(userId, taskData) {
  const validatedData = validateTaskInput(taskData);
  const task = await Task.create({
    userId,
    ...validatedData,
    deadline: new Date(taskData.deadline)
  });
  return task;
}

// ❌ BAD: Unclear names, no validation
async function ct(u, d) {
  return await Task.create({ userId: u, ...d });
}
```

#### Error Handling
```javascript
// ✅ GOOD: Comprehensive error handling
try {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  // ... operation
} catch (error) {
  console.error('Error in getUserTasks:', error);
  throw new ApiError(500, 'Failed to fetch tasks');
}

// ❌ BAD: No error handling
const user = await User.findById(userId);
```

#### Async/Await
- **Always use async/await** instead of callbacks or raw promises
- **Avoid callback hell**: Chain promises or use async/await
- **Handle rejections**: Wrap in try-catch blocks

```javascript
// ✅ GOOD
async function updateTask(taskId, updates) {
  try {
    const task = await Task.findById(taskId);
    Object.assign(task, updates);
    await task.save();
    return task;
  } catch (error) {
    throw new ApiError(500, 'Failed to update task');
  }
}
```

### Backend Conventions

#### API Routes
- Use **RESTful conventions**
- Prefix all routes with `/api/v1`
- Use plural nouns for resources (`/tasks`, `/users`)
- Use HTTP methods correctly (GET, POST, PUT, PATCH, DELETE)

```javascript
// ✅ GOOD: RESTful structure
router.get('/api/v1/tasks', authMiddleware, getTasks);
router.post('/api/v1/tasks', authMiddleware, createTask);
router.patch('/api/v1/tasks/:id', authMiddleware, updateTask);
router.delete('/api/v1/tasks/:id', authMiddleware, deleteTask);
```

#### Request/Response Format
```javascript
// Success response structure
{
  "success": true,
  "data": { /* payload */ },
  "message": "Task created successfully"
}

// Error response structure
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [/* field errors */]
  }
}
```

#### Authentication
- **All protected routes** must use `authMiddleware`
- Store JWT in **httpOnly cookies** (preferred) or localStorage (fallback)
- Token expiration: 7 days (refresh tokens: 30 days)
- Hash passwords with bcrypt (12 rounds)

```javascript
// Middleware usage
router.get('/api/v1/tasks', authMiddleware, taskController.getTasks);

// JWT payload structure
const payload = {
  userId: user._id,
  email: user.email,
  role: user.role
};
```

#### Database Models
- Use **Mongoose schemas** with strict validation
- Define indexes for frequently queried fields
- Use virtuals for computed properties
- Add timestamps (`createdAt`, `updatedAt`)

```javascript
const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: [true, 'Task text is required'],
    trim: true,
    maxlength: [140, 'Task cannot exceed 140 characters']
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'],
    default: 'not-urgent-not-important'
  },
  deadline: Date,
  category: String,
  tags: [String],
  pomodoroCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ userId: 1, completed: 1 });
taskSchema.index({ deadline: 1 });
```

### Frontend Conventions

#### Component Structure
- Each component is a **self-contained module**
- Export a factory function or class
- Handle own event listeners and cleanup

```javascript
// ✅ GOOD: Component pattern
class PomodoroTimer {
  constructor(container) {
    this.container = container;
    this.duration = 25 * 60; // 25 minutes
    this.timeLeft = this.duration;
    this.isRunning = false;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="pomodoro-timer">
        <div class="time-display">${this.formatTime(this.timeLeft)}</div>
        <button class="btn-start">Start</button>
        <button class="btn-pause">Pause</button>
        <button class="btn-reset">Reset</button>
      </div>
    `;
  }

  bindEvents() {
    // Event listeners
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
```

#### API Communication
- Use a centralized API module
- Include authentication token in headers
- Handle network errors gracefully
- Show loading states

```javascript
// api/tasks.js
const API_BASE = '/api/v1';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function getTasks(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  return apiRequest(`/tasks?${queryString}`);
}

export async function createTask(taskData) {
  return apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
}
```

#### State Management
- Use a simple state object for global state
- Emit custom events for state changes
- Update UI reactively

```javascript
// app.js
const state = {
  user: null,
  tasks: [],
  filter: 'all',
  activeView: 'tasks'
};

function setState(updates) {
  Object.assign(state, updates);
  window.dispatchEvent(new CustomEvent('statechange', { detail: state }));
}

// Listen for changes
window.addEventListener('statechange', (event) => {
  render(event.detail);
});
```

### CSS Standards

#### Architecture
- Use **CSS Custom Properties** for theming
- Follow **BEM methodology** for class names (Block__Element--Modifier)
- Mobile-first responsive design
- Minimize use of `!important`

```css
/* variables.css */
:root {
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-secondary: #8b5cf6;
  --color-success: #10b981;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;

  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  --font-family-sans: 'Space Grotesk', system-ui, sans-serif;
  --font-family-mono: 'IBM Plex Mono', monospace;

  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 1rem;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* BEM naming */
.task-card { /* Block */ }
.task-card__title { /* Element */ }
.task-card__title--urgent { /* Modifier */ }
```

## Security Best Practices

### Input Validation
1. **Backend**: Validate ALL inputs with express-validator
2. **Frontend**: Client-side validation for UX (not security)
3. **Database**: Use Mongoose validation as last line of defense
4. **Sanitization**: Remove/escape HTML and SQL injection attempts

### Authentication & Authorization
1. **Passwords**:
   - Minimum 8 characters
   - Hash with bcrypt (12 rounds)
   - Never log or display passwords
2. **JWT Tokens**:
   - Sign with strong secret (32+ characters)
   - Include expiration time
   - Validate on every protected route
3. **Authorization**:
   - Check user ownership of resources
   - Implement role-based access control (RBAC) where needed

### Environment Variables
```bash
# .env file (NEVER commit this)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/flowlist-pro
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
```

## Testing Standards

### Backend Tests (Jest + Supertest)
- Unit tests for utilities and helpers
- Integration tests for API endpoints
- Test authentication flows
- Test error scenarios

### Frontend Tests (Manual + Future E2E)
- Manual testing checklist for each feature
- Future: Playwright for E2E testing
- Test cross-browser compatibility (Chrome, Firefox, Safari)
- Test responsive design (mobile, tablet, desktop)

## Git Workflow

### Branch Naming
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Production hotfixes

### Commit Messages
Follow conventional commits:
```
feat: Add Pomodoro timer component
fix: Resolve task deletion bug
docs: Update API documentation
refactor: Simplify authentication middleware
test: Add tests for task controller
chore: Update dependencies
```

### Pull Request Guidelines
1. Create descriptive PR title and description
2. Link related issues
3. Ensure all tests pass
4. Request code review
5. Update documentation if needed

## Performance Guidelines

### Backend
- Use database indexes for frequently queried fields
- Implement pagination for large datasets (default: 20 items per page)
- Cache frequently accessed data (Redis for future)
- Use projection to limit returned fields

### Frontend
- Lazy load non-critical components
- Debounce search and filter inputs (300ms)
- Use document fragments for bulk DOM updates
- Minimize reflows and repaints
- Compress and optimize images

## Accessibility (a11y)

1. **Semantic HTML**: Use proper HTML5 elements
2. **ARIA labels**: Add aria-label, aria-describedby where needed
3. **Keyboard navigation**: Ensure all features work without mouse
4. **Focus management**: Visible focus indicators, logical tab order
5. **Color contrast**: Meet WCAG AA standards (4.5:1 for normal text)
6. **Screen readers**: Test with NVDA or VoiceOver

## Feature-Specific Guidelines

### Pomodoro Timer
- Default: 25 min work, 5 min break
- Customizable durations
- Browser notifications (request permission)
- Track completed pomodoros per task
- Prevent tab sleep during active session

### Priority Matrix (Eisenhower)
- Four quadrants: Urgent/Important combinations
- Drag-and-drop between quadrants
- Visual indicators (colors: red, yellow, green, blue)
- Auto-suggest based on deadlines

### Time Blocking
- Calendar view (day/week)
- Drag tasks to time slots
- Conflict detection
- Integration with deadlines
- Color-coded by category

### Analytics Dashboard
- Charts: Tasks completed over time (line chart)
- Category distribution (pie chart)
- Productivity heat map (calendar view)
- Average pomodoro sessions per day
- Energy level patterns

### Collaboration
- Share individual tasks or entire lists
- Real-time updates (Socket.io for future enhancement)
- Permission levels: view-only, edit
- Comment threads on shared tasks

## Documentation

### Code Comments
- Use JSDoc for functions and classes
- Explain "why" not "what"
- Document complex algorithms
- Keep comments up-to-date

```javascript
/**
 * Calculate productivity score based on completed tasks and energy levels
 * @param {string} userId - The user's unique identifier
 * @param {Date} startDate - Start of analysis period
 * @param {Date} endDate - End of analysis period
 * @returns {Promise<Object>} Productivity metrics including score, trends, and insights
 */
async function calculateProductivityScore(userId, startDate, endDate) {
  // Implementation
}
```

## Deployment Considerations

### Environment Setup
- Development: localhost:5000 (backend), localhost:3000 (frontend)
- Staging: [TBD]
- Production: [TBD]

### Database Migrations
- Use Mongoose migrations for schema changes
- Always backup before migrations
- Test migrations on staging first

### Monitoring & Logging
- Log all errors with stack traces
- Track API response times
- Monitor database query performance
- Set up health check endpoint (`/api/v1/health`)

## Questions or Clarifications?

If anything in this guide is unclear or you need to make architectural decisions not covered here, follow these principles:
1. Security first
2. User experience second
3. Performance third
4. Simplicity always

For major architectural changes, document the decision and rationale in this file or create an ADR (Architecture Decision Record).
