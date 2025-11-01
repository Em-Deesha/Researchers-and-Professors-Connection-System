# Floating Chatbot for Profile Pages

## Overview
This component adds a floating chat assistant to profile pages that helps users understand and analyze academic profiles.

## Features
- 💬 Floating chat icon at bottom-left corner
- 📝 Context-aware suggested questions (different for professors vs students)
- 🤖 Placeholder responses based on profile data
- 💅 Modern, clean UI with Tailwind CSS
- 🔄 Ready for AI backend integration

## Usage

```jsx
import ProfileChatAssistant from './components/floating-chatbot/ProfileChatAssistant.jsx';

// In your profile page component:
{profile && <ProfileChatAssistant profile={profile} />}
```

## Profile Data Structure
The component expects a profile object with:
- `name` - Person's name
- `title` - Job title or degree
- `university` - Institution name
- `researchArea` - Primary research area
- `bio` - Biography text
- `keywords` - Array or comma-separated string of keywords
- `userType` - 'professor' or 'student' (optional, auto-detected)
- Education fields: `degree`, `eduInstitution`, `gpa`
- Experience fields: `expTitle`, `expOrganization`, `expDescription`
- Publication fields: `pubTitle`, `pubJournal`, `pubAuthors`, `pubYear`
- Project fields: `projTitle`, `projDescription`, `projRole`
- Achievement fields: `achTitle`, `achDescription`

## Suggested Questions

### For Professors:
- "Summarize this professor's profile"
- "Summarize research papers"
- "Summarize research interests"
- "List main publications"
- "Suggest matching students"

### For Students:
- "Summarize this student's profile"
- "Summarize this CV"
- "Highlight top skills"
- "Summarize portfolio"
- "Suggest professors for collaboration"

## Future Integration
Currently uses placeholder responses. To connect to AI backend:
1. Replace `generatePlaceholderResponse` function
2. Make API call to your AI service
3. Pass profile data as context to AI

## Styling
Uses Tailwind CSS classes. Fully responsive and mobile-friendly.

