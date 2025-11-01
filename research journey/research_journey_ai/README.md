# AI-Powered First Research Journey Platform

A comprehensive platform that guides students through their first research journey using AI agents. This system provides step-by-step guidance from topic selection to research proposal writing, powered by advanced AI technologies.

## 🎯 Features

- **🤖 AI-Powered Topic Selection**: Get personalized research topic suggestions based on your interests
- **📚 Automated Literature Review**: AI-generated literature summaries using RAG (Retrieval Augmented Generation)
- **📝 Research Proposal Builder**: Step-by-step guidance for crafting professional research proposals
- **💾 Progress Tracking**: Save and resume your research sessions automatically
- **👨‍🏫 Professor Contact Guidance**: Learn how to reach out to potential advisors effectively
- **📄 Export Capabilities**: Download your research proposal and progress

## 🛠 Tech Stack

- **Backend**: FastAPI + Python 3.8+
- **Frontend**: React 18 + TailwindCSS + Vite
- **AI Framework**: Google Gemini Pro + RAG (Retrieval Augmented Generation)
- **Database**: SQLite + SQLAlchemy
- **Styling**: TailwindCSS + Framer Motion

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- Google Gemini API key

### Installation & Setup

1. **Clone and navigate to the project:**
   ```bash
   cd research_journey_ai
   ```

2. **Run the automated setup:**
   ```bash
   python setup.py
   ```

3. **Set your Gemini API key:**
   - Open `backend/.env`
   - Replace `your_gemini_api_key_here` with your actual Gemini API key

4. **Start the application:**
   ```bash
   python start_all.py
   ```

5. **Access the platform:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
research_journey_ai/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main FastAPI application
│   ├── ai_agent.py            # AI agents and LangChain integration
│   ├── models.py              # SQLAlchemy database models
│   ├── crud.py                # Database operations
│   ├── db.py                  # Database configuration
│   └── .env                   # Environment variables
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── TopicSelector.jsx
│   │   │   ├── LiteratureReview.jsx
│   │   │   ├── ProposalBuilder.jsx
│   │   │   └── ProgressSaver.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Home.jsx
│   │   │   └── ResearchJourney.jsx
│   │   ├── App.jsx            # Main App component
│   │   └── main.jsx           # Entry point
│   ├── package.json           # Node.js dependencies
│   └── vite.config.js         # Vite configuration
├── requirements.txt           # Python dependencies
├── setup.py                  # Automated setup script
├── start_backend.py          # Backend startup script
├── start_frontend.py         # Frontend startup script
├── start_all.py              # Start both servers
└── README.md                 # This file
```

## 🔧 Manual Setup (Alternative)

If you prefer manual setup:

### Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp backend/env_template.txt backend/.env
# Edit backend/.env with your OpenAI API key

# Start backend
cd backend
python main.py
```

### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

## 🎮 Usage Guide

### Step 1: Getting Started
1. Open http://localhost:5173 in your browser
2. Enter your name and area of interest (e.g., "AI in agriculture")
3. Click "Begin My Research Journey"

### Step 2: Topic Selection
1. Review AI-generated topic suggestions
2. Select the most interesting topic
3. Explore keywords and research questions

### Step 3: Literature Review
1. Read the AI-generated literature summary
2. Review key papers and their relevance
3. Understand the current state of research

### Step 4: Proposal Writing
1. Review the AI-generated research proposal
2. Edit and customize the title, abstract, objectives, and methodology
3. Save your progress

### Step 5: Save and Export
1. Get guidance on contacting professors
2. Download your research proposal
3. Save your complete research journey

## 🤖 AI Features

### Topic Agent
- Analyzes your area of interest
- Generates refined research topics
- Provides keywords and sample questions
- Explains why each topic is suitable for beginners

### Literature Agent
- Uses RAG (Retrieval Augmented Generation) with FAISS
- Searches through pre-loaded research papers
- Generates comprehensive literature summaries
- Identifies key papers and research gaps

### Proposal Agent
- Creates structured research proposals
- Generates titles, abstracts, objectives, and methodology
- Provides SMART goal guidance
- Offers timeline and resource suggestions

### Progress Agent
- Saves all your work automatically
- Tracks your progress through the journey
- Provides professor contact guidance
- Enables proposal export

## 🔑 API Endpoints

- `POST /sessions` - Create new research session
- `GET /sessions/{session_id}` - Get session data
- `PUT /sessions/{session_id}` - Update session data
- `POST /suggest-topic` - Generate topic suggestions
- `POST /literature-summary` - Generate literature review
- `POST /generate-proposal` - Create research proposal
- `POST /professor-guidance` - Get professor contact guidance

## 🛡 Environment Variables

Create `backend/.env` with:
```
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./research_journey.db
```

## 🐛 Troubleshooting

### Common Issues

1. **Gemini API Key Error**
   - Ensure your API key is correctly set in `backend/.env`
   - Verify the key has sufficient credits

2. **Port Already in Use**
   - Backend runs on port 8000, frontend on 5173
   - Kill existing processes or change ports in configuration

3. **Database Issues**
   - Delete `research_journey.db` to reset the database
   - Run the setup script again

4. **Node.js Dependencies**
   - Delete `frontend/node_modules` and run `npm install` again
   - Ensure Node.js version 16+ is installed

## 🚀 Deployment

### Production Deployment
1. Build the frontend: `cd frontend && npm run build`
2. Use a production WSGI server like Gunicorn for the backend
3. Set up a reverse proxy with Nginx
4. Use PostgreSQL instead of SQLite for production

### Docker Deployment (Optional)
```dockerfile
# Add Dockerfile for containerized deployment
# Include both frontend and backend in multi-stage build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review the API documentation at http://localhost:8000/docs
3. Check the console logs for error messages
4. Ensure all dependencies are properly installed

## 🎉 Success!

Once everything is running, you should see:
- ✅ Backend API running on http://localhost:8000
- ✅ Frontend application on http://localhost:5173
- ✅ Database initialized with sample data
- ✅ AI agents ready to assist with your research journey

Happy researching! 🎓
