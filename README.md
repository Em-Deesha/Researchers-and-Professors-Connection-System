# 🎓 Academic Matchmaker - Researchers & Supervisors Matching System

A comprehensive platform that connects students with professors using AI-powered smart matching, real-time chat, and collaborative features.

> ⚠️ **NEW TO THIS PROJECT?** See **[START.md](./START.md)** for quick setup instructions!
> 
> 🤖 **USING CURSOR AI?** Check **[.cursorrules](./.cursorrules)** for AI assistant context!

![GitHub stars](https://img.shields.io/github/stars/Em-Deesha/Researchers-and-supervisors-matching-system)
![GitHub forks](https://img.shields.io/github/forks/Em-Deesha/Researchers-and-supervisors-matching-system)
![GitHub license](https://img.shields.io/github/license/Em-Deesha/Researchers-and-supervisors-matching-system)

## 🌟 Features

### 🤖 AI-Powered Smart Matching
- **Gemini AI Integration**: Advanced natural language processing for research interest analysis
- **Intelligent Matching**: Find professors based on research area compatibility
- **Detailed Justifications**: AI explains why each match is relevant
- **Similarity Scoring**: Provides match confidence percentages
 - **Audience Filter (New)**: Search Professors, Students, or Both

### 💬 Real-Time Chat System
- **WhatsApp-like Interface**: Modern chat UI with sidebar and main chat area
- **Real-time Messaging**: Instant message delivery using Firestore
- **Chat Management**: Pin, rename, and delete chat conversations
- **Notification System**: Real-time notifications with count badges
- **Message Persistence**: Chat history maintained across sessions

### 👥 Professional Profile System
- **Role-Based Access**: Student, Professor, and Admin roles with different permissions
- **Comprehensive Profiles**: Research areas, publications, skills, availability
- **Onboarding Flow**: Guided setup for new users
- **Profile Verification**: Professional status indicators

### 📱 Social Features
- **Global Feed**: Share research updates and discoveries
- **File Upload Support**: Share documents, images, and research materials
- **Social Interactions**: Like and comment on posts
- **Real-time Updates**: Live feed updates

### 🛠️ Admin Dashboard
- **User Analytics**: Track total users, posts, and activity
- **System Statistics**: Platform health and usage metrics
- **User Management**: Oversee platform activity
- **Recent Activity**: Monitor new users and posts

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for modern, responsive design
- **Firebase SDK** for authentication and real-time database
- **Lucide React** for beautiful icons

### Backend
- **Node.js/Express** RAG backend with AI integration
- **Google Gemini AI** for intelligent matching
- **Firebase Firestore** for real-time data storage
- **JWT Authentication** for secure API access
- **Rate Limiting & Security** with Helmet.js

## 📁 Project Structure

```
MATCH MODULE/
├── src/
│   ├── App.jsx                    # Main application with all features
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles and Tailwind
│   └── firebase-config.js         # Firebase configuration
├── rag-backend/
│   ├── production-index-fallback.js  # Main RAG backend server
│   ├── firestore-integration.js      # Firestore data access layer
│   ├── package.json                  # Backend dependencies
│   └── production.env               # Backend environment variables
├── cleanup-duplicate-chats.js     # Database cleanup utility
├── index.html                     # HTML template
├── package.json                   # Frontend dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- Google Gemini API key

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Em-Deesha/Researchers-and-supervisors-matching-system.git
cd Researchers-and-supervisors-matching-system
```

2. **Install frontend dependencies:**
```bash
npm install
```

3. **Install backend dependencies:**
```bash
cd rag-backend
npm install
cd ..
```

### Environment Setup

1. **Frontend Environment** (create `.env` in root directory):
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

2. **Backend Environment** (create `rag-backend/.env`):
```env
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret_key
PORT=3003
NODE_ENV=development
```

### Running the Application

⚠️ **IMPORTANT: This project requires TWO servers to run simultaneously - Frontend and Backend.**

**Both servers MUST be running for the application to work properly!**

#### Option 1: Manual Start (Recommended for Development)

**Terminal 1 - Start Backend Server:**
```bash
cd rag-backend
npm start
```
✅ Backend will run on `http://localhost:3003`
- You should see: `🚀 Production RAG Backend (Fallback) running on port 3003`

**Terminal 2 - Start Frontend Server:**
```bash
npm run dev
```
✅ Frontend will run on `http://localhost:3000` (or next available port)
- You should see: `➜  Local:   http://localhost:3000/`

#### Option 2: Quick Start Script

Use the convenience script to start the backend:
```bash
./start-backend.sh
```

Then in another terminal:
```bash
npm run dev
```

#### Option 3: Start Both Servers Together

Requires `concurrently` package (install with `npm install`):
```bash
npm run start:all
```

This starts both backend and frontend in a single command.

### New Feature Highlights (Oct 2025)

- Audience filter in Matchmaker to search Professors only, Students only, or Both
- Public profile route `/profile/:id` (click a name or View Profile)
- Dashboard shows real Recent Activity (searches, profile views, chat starts) and active chat count
- Matchmaker restores your last results when returning from a profile

### Matchmaker – How it works now

1. Select "I want to find": Professors and Students | Professors only | Students only
2. Enter your query and Search
3. Click a result to open `/profile/:id`, or Start Conversation
4. Activity appears on Dashboard

Firestore collections used for audience-aware search:

- Professors: `artifacts/${appId}/public/data/professors`
- Students: `artifacts/${appId}/public/data/students`

Fields considered: name, title/degree, university, department, researchArea, keywords.

### ⚠️ Common Error: "Backend server is not responding"

If you see this error in the frontend, it means:
- ❌ Backend server is NOT running on port 3003
- ✅ **Solution**: Start the backend server first (see Terminal 1 above)

**Quick Check:**
```bash
curl http://localhost:3003/health
```
If this returns JSON, backend is running ✅
If this fails, backend is NOT running ❌

### Open Your Browser

- **Frontend**: `http://localhost:3000` (or check terminal output)
- **Backend API Health**: `http://localhost:3003/health`
- **Backend API Docs**: `http://localhost:3003/`

## 🔧 Firebase Setup

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Enable Authentication (Email/Password)

### 2. Configure Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{collection}/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Set up Firestore Indexes
Create composite indexes for:
- **Users**: `keywords` (Array), `userType` (String)
- **Posts**: `timestamp` (Descending), `authorId` (String)
- **Messages**: `timestamp` (Descending), `chatId` (String)
- **Chats**: `participants` (Array), `lastMessageTime` (Descending)
- **Notifications**: `recipientId` (String), `timestamp` (Descending)

## 🌐 CORS Configuration

The backend includes comprehensive CORS configuration for development and production:

```javascript
// CORS configuration in rag-backend/production-index-fallback.js
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3004',
    'https://your-production-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

## 📊 API Endpoints

### Backend API (`http://localhost:3003`)

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/health` | GET | System health check | None |
| `/smart-match` | POST | AI-powered professor matching | JWT Required |
| `/auth/login` | POST | User authentication | None |
| `/auth/verify` | POST | Token verification | JWT Required |

### Request Examples

**Smart Matching:**
```bash
curl -X POST http://localhost:3003/smart-match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "researchInterests": "Machine Learning, AI, Data Science",
    "userType": "student"
  }'
```

**Health Check:**
```bash
curl http://localhost:3003/health
```

## 🎯 Key Features Explained

### AI-Powered Smart Matching
- **Gemini AI Integration**: Analyzes research interests using natural language processing
- **Intelligent Matching**: Finds professors based on research area compatibility
- **Detailed Justifications**: AI explains why each match is relevant
- **Similarity Scoring**: Provides match confidence percentages

### Real-Time Chat System
- **WhatsApp-like Interface**: Modern chat UI with sidebar and main chat area
- **Message Persistence**: Chat history maintained across sessions
- **Chat Management**: Pin, rename, and delete conversations
- **Real-time Notifications**: Instant message notifications with count badges
- **File Sharing**: Upload and share documents in chats

### Professional Profile System
- **Comprehensive Profiles**: Research areas, publications, skills, availability
- **Role-Based Access**: Different features for students, professors, and admins
- **Onboarding Flow**: Guided setup for new users
- **Profile Verification**: Professional status indicators

### Social Features
- **Global Feed**: Share research updates and discoveries
- **File Upload Support**: Share documents, images, and research materials
- **Social Interactions**: Like, comment, and engage with posts
- **Real-time Updates**: Live feed updates

## 🚀 Deployment Guide

> 📖 **For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Deployment (Recommended)

**Option 1: Vercel (Frontend) + Railway (Backend) - Recommended**

1. **Deploy Frontend to Vercel:**
   ```bash
   npm install -g vercel
   npm run build
   vercel --prod
   ```
   Set environment variables in Vercel dashboard:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_API_URL` (your backend URL)

2. **Deploy Backend to Railway:**
   - Connect your GitHub repo to Railway
   - Set root directory to `rag-backend`
   - Add environment variables:
     - `GEMINI_API_KEY`
     - `JWT_SECRET`
     - `PORT=3003`
     - `NODE_ENV=production`
     - `CORS_ORIGIN` (your frontend URL)

3. **Update CORS in backend** to allow your frontend domain

**Option 2: Docker Deployment**
```bash
docker-compose up -d
```

**Option 3: Manual Deployment**
- Frontend: Build with `npm run build` and serve `dist/` folder
- Backend: Run `node rag-backend/production-index-fallback.js` with `NODE_ENV=production`

### Environment Variables

**Frontend `.env`:**
```env
VITE_API_URL=https://your-backend-url.com
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Backend `rag-backend/production.env`:**
```env
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=your_strong_secret
PORT=3003
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_app_password
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

## 🚀 Usage Guide

### For Students
1. **Complete Profile**: Set up your academic profile with research interests
2. **Find Collaborators**: Use smart matching to find relevant professors
3. **Start Conversations**: Message professors directly through the chat system
4. **Share Updates**: Post about your research progress on the global feed
5. **Manage Chats**: Pin important conversations, rename chats, and organize your messages

### For Professors
1. **Professional Profile**: Create detailed academic profiles
2. **Connect with Students**: Find students interested in your research
3. **Share Research**: Post about your latest discoveries
4. **Collaborate**: Engage with the academic community through real-time chat
5. **Manage Conversations**: Organize and prioritize student communications

### For Administrators
1. **Monitor Activity**: Use the admin dashboard for insights
2. **User Management**: Track platform usage and engagement
3. **System Health**: Monitor backend performance and user activity
4. **Analytics**: View comprehensive platform statistics

## 🔧 Development

### Available Scripts

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend:**
```bash
npm start            # Start RAG backend
npm run dev          # Start with auto-reload
npm test             # Run tests
```

### Database Cleanup
```bash
node cleanup-duplicate-chats.js  # Clean up duplicate chat documents
```

## 🛠️ Troubleshooting

### Common Issues

1. **Backend Not Running**
   - Ensure the RAG backend is started on port 3003
   - Check if port 3003 is available
   - Verify backend dependencies are installed

2. **Smart Matching Errors**
   - Check Gemini API key configuration
   - Verify API key has proper permissions
   - Check backend logs for detailed error messages

3. **Firebase Connection Issues**
   - Verify Firebase configuration in `.env`
   - Check Firestore security rules
   - Ensure authentication is enabled

4. **CORS Issues**
   - Backend includes proper CORS configuration
   - Check if frontend URL is in allowed origins
   - Verify credentials are properly set

5. **Chat Issues**
   - Check Firestore indexes are created
   - Verify user profiles are properly fetched
   - Check browser console for JavaScript errors

### Debug Steps

1. **Check Backend Health:**
```bash
curl http://localhost:3003/health
```

2. **Test Smart Matching:**
```bash
curl -X POST http://localhost:3003/smart-match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"researchInterests": "test", "userType": "student"}'
```

3. **Verify Firebase:**
   - Check browser console for authentication errors
   - Verify Firestore rules are properly configured
   - Check Firebase project settings

4. **Check Logs:**
   - Monitor backend terminal for error messages
   - Check browser console for frontend errors
   - Review Firestore security rules logs

## 🔐 Security Features

- **JWT Authentication**: Secure API access with token-based authentication
- **Rate Limiting**: Prevents API abuse and ensures fair usage
- **Security Headers**: Helmet.js for comprehensive security
- **CORS Protection**: Proper cross-origin request handling
- **Input Validation**: Sanitized user inputs and queries
- **Firestore Security Rules**: Database-level security enforcement

## 📊 Performance

- **Real-time Updates**: Firestore for instant data synchronization
- **Optimized Queries**: Efficient database queries with proper indexing
- **Caching**: Smart caching for improved performance
- **Rate Limiting**: Balanced API usage for optimal performance
- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Optimized bundle sizes

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and authentication
- [ ] Profile creation and editing
- [ ] Smart matching functionality
- [ ] Real-time chat messaging
- [ ] Chat management (pin, rename, delete)
- [ ] Notification system
- [ ] File upload and sharing
- [ ] Global feed posting
- [ ] Admin dashboard functionality
- [ ] Mobile responsiveness

### API Testing
```bash
# Test health endpoint
curl http://localhost:3003/health

# Test authentication
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (frontend and backend)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test all new features thoroughly
- Update documentation as needed
- Ensure CORS and security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review [Firebase documentation](https://firebase.google.com/docs)
3. Check [Gemini AI documentation](https://ai.google.dev/docs)
4. Review backend logs for error details
5. Open an issue in the repository

## 🎉 Recent Updates

- ✅ **Enhanced Chat System**: WhatsApp-like interface with real-time messaging
- ✅ **Chat Management**: Pin, rename, and delete chat conversations
- ✅ **Notification System**: Real-time notifications with count badges
- ✅ **User Profile Fixes**: Proper name display instead of IDs
- ✅ **AI-Powered Smart Matching** with Gemini AI
- ✅ **Professional Admin Dashboard** with analytics
- ✅ **Role-Based Access Control** for different user types
- ✅ **Global Academic Feed** with social features
- ✅ **Comprehensive Profile System** with onboarding
- ✅ **Security Enhancements** with JWT and rate limiting
- ✅ **Database Cleanup Tools** for maintenance
- ✅ **CORS Configuration** for cross-origin requests
- ✅ **Code Cleanup** - Removed all unused files and dependencies

## 🌟 Acknowledgments

- **Google Gemini AI** for intelligent matching capabilities
- **Firebase** for real-time database and authentication
- **React & Tailwind CSS** for modern UI development
- **Node.js & Express** for robust backend services

---

**Built with ❤️ for the academic community**

## 📞 Contact

- **GitHub**: [@Em-Deesha](https://github.com/Em-Deesha)
- **Repository**: [Researchers-and-supervisors-matching-system](https://github.com/Em-Deesha/Researchers-and-supervisors-matching-system)

---

---

## 📚 Additional Documentation

- **[START.md](./START.md)** - Quick start guide for development
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[FIREBASE-SETUP.md](./FIREBASE-SETUP.md)** - Firebase configuration
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

---

*Last updated: January 2025*