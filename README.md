# InterviewAI - AI-Powered Interview Preparation Platform

## Overview

InterviewAI is a comprehensive platform that uses artificial intelligence to help candidates prepare for interviews through video analysis, real-time feedback, and personalized improvement suggestions.

## Features

### Frontend (React + TypeScript)
- **Authentication**: Secure login/registration with JWT tokens
- **Dashboard**: Personal analytics and performance overview
- **Video Analysis**: Upload interview recordings for AI analysis
- **Real-time Feedback**: Immediate insights on tone, body language, and speech patterns
- **Progress Tracking**: Monitor improvement over time
- **Question Bank**: Access to technical and behavioral interview questions
- **Report Generation**: Detailed analysis reports with actionable feedback

### Backend (Node.js + Express + MongoDB)
- **User Management**: Registration, authentication, and profile management
- **Interview Processing**: Video upload and analysis pipeline
- **AI Integration**: Support for multiple AI services (Gemini, OpenAI, Deepgram)
- **Data Analytics**: Performance tracking and user statistics
- **RESTful APIs**: Comprehensive API endpoints for all functionalities

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- Axios for API communication
- React Router for navigation

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Multer for file uploads
- Express Validator for input validation
- bcrypt for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <[https://github.com/VANSHTalyani/InterviewAI/](https://github.com/VANSHTalyani/InterviewAI/)>
   cd InterviewAI/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Start MongoDB**
   ```bash
   # macOS with Homebrew
   brew services start mongodb/brew/mongodb-community
   
   # Or run directly
   mongod --config /usr/local/etc/mongod.conf
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd Frontend/project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Default API URL is already set for local development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user

### Users
- `GET /api/users/stats` - Get user statistics
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password

### Interviews
- `GET /api/interviews` - Get user interviews
- `POST /api/interviews` - Create new interview
- `GET /api/interviews/:id` - Get specific interview
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Delete interview
- `POST /api/interviews/:id/upload` - Upload interview recording
- `POST /api/interviews/:id/analyze` - Start AI analysis

### Questions
- `GET /api/interviews/questions` - Get random interview questions

## Development Workflow

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd Frontend/project
npm run dev  # Starts Vite dev server with HMR
```

### Database Management
```bash
cd backend
npm run seed  # Populate database with sample questions
```

## Features Implementation Status

### ✅ Completed
- User authentication and authorization
- Basic CRUD operations for interviews
- File upload functionality
- Frontend routing and navigation
- Responsive UI components
- API integration layer

### 🚧 In Progress
- AI analysis integration
- Real-time video processing
- Advanced analytics dashboard
- Report generation

### 📋 Planned
- Google OAuth integration
- Advanced AI feedback
- Performance analytics
- Mobile responsive improvements
- Social features

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/interviewai
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_key
DEEPGRAM_API_KEY=your_deepgram_key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, interview7ai@gmail.com or create an issue in the repository.
