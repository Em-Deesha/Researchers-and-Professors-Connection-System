import React, { useState } from 'react';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';

const ProfileChatAssistant = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Determine profile type
  const profileType = profile?.userType || (profile?.title?.toLowerCase().includes('professor') || profile?.title?.toLowerCase().includes('dr.') || profile?.title?.toLowerCase().includes('phd') ? 'professor' : 'student');

  // Suggested questions based on profile type
  const suggestedQuestions = profileType === 'professor' 
    ? [
        "Summarize this professor's profile",
        "Summarize research papers",
        "Summarize research interests",
        "List main publications",
        "Suggest matching students"
      ]
    : [
        "Summarize this student's profile",
        "Summarize this CV",
        "Highlight top skills",
        "Summarize portfolio",
        "Suggest professors for collaboration"
      ];

  // Generate detailed AI response based on question
  const generatePlaceholderResponse = (question) => {
    const lowerQuestion = question.toLowerCase().trim();
    const name = profile?.name || 'This person';
    // Detect gender from name or use default - better detection for female names
    const isFemale = profile?.gender === 'female' || 
                     name.toLowerCase().includes('she') || 
                     (profile?.title && !profile.title.toLowerCase().includes('professor') && !profile.title.toLowerCase().includes('dr.'));
    const pronouns = isFemale ? { subject: 'She', possessive: 'her', object: 'her' } : 
                     profile?.gender === 'male' ? { subject: 'He', possessive: 'his', object: 'him' } : 
                     { subject: 'They', possessive: 'their', object: 'them' };
    const keywords = Array.isArray(profile?.keywords) ? profile.keywords : (profile?.keywords ? String(profile.keywords).split(',').map(s => s.trim()).filter(Boolean) : []);
    
    // Questions about contact information - CHECK FIRST
    if (lowerQuestion.includes('contact') || lowerQuestion.includes('email') || lowerQuestion.includes('reach') || lowerQuestion.includes('website')) {
      let response = `${name}'s contact information:\n\n`;
      
      if (profile?.email) {
        response += `**Email:** ${profile.email}\n`;
      }
      if (profile?.website) {
        response += `**Website:** ${profile.website}\n`;
      }
      if (profile?.phone) {
        response += `**Phone:** ${profile.phone}\n`;
      }
      
      if (!profile?.email && !profile?.website && !profile?.phone) {
        response += `Contact information is not provided in this profile.`;
      } else {
        response += `\nYou can reach ${pronouns.object} at ${profile?.email || profile?.website || 'the contact details above'}.`;
      }
      
      return response;
    }
    
    // Questions about verification status - CHECK EARLY
    if (lowerQuestion.includes('verified') || lowerQuestion.includes('verification') || lowerQuestion.includes('verify') || lowerQuestion === 'is she verified' || lowerQuestion === 'is he verified') {
      let response = `${name}'s verification status:\n\n`;
      
      if (profile?.isActive !== undefined) {
        const isVerified = profile.isActive === true || profile.isActive === 'true' || profile.isActive === 'verified';
        response += `**Status:** ${isVerified ? '✅ Verified/Active' : '❌ Unverified'}\n\n`;
        
        if (isVerified) {
          response += `${pronouns.subject} has a verified profile. This means ${pronouns.possessive} information has been confirmed and ${pronouns.subject.toLowerCase()} is an active member of the platform.`;
        } else {
          response += `${pronouns.subject}'s profile is currently unverified. The information shown may not have been confirmed yet.`;
        }
      } else {
        response += `Verification status is not specified in this profile. Based on the profile information available, verification status cannot be determined.`;
      }
      
      return response;
    }
    
    // Question about interests
    if (lowerQuestion.includes('interest')) {
      let response = `${name}'s research interests and areas of focus:\n\n`;
      
      if (keywords.length > 0) {
        response += `**Primary Areas of Interest:**\n${keywords.map(k => `• ${k}`).join('\n')}\n\n`;
      }
      
      if (profile?.researchArea) {
        response += `**Main Research Focus:** ${profile.researchArea}\n\n`;
      }
      
      // Use full bio, not truncated
      if (profile?.bio && profile.bio.trim()) {
        response += `**Research Background:**\n${profile.bio}\n\n`;
      }
      
      response += `${pronouns.subject} has expertise in ${keywords.length > 0 ? keywords.length : 'multiple'} key areas. `;
      if (profile?.expTitle) {
        response += `These interests are demonstrated through ${pronouns.possessive} work as ${profile.expTitle}`;
        if (profile.expOrganization) {
          response += ` at ${profile.expOrganization}`;
        }
        response += `. `;
      }
      if (profile?.projTitle) {
        response += `${pronouns.possessive} project work on "${profile.projTitle}" showcases practical application of these interests.`;
      }
      
      return response;
    }
    
    // Question about education
    if (lowerQuestion.includes('education') || lowerQuestion.includes('degree') || lowerQuestion.includes('study')) {
      let response = `${name}'s educational background:\n\n`;
      
      if (profile?.degree) {
        response += `**Degree:** ${profile.degree}\n`;
      }
      if (profile?.eduInstitution) {
        response += `**Institution:** ${profile.eduInstitution}\n`;
      }
      if (profile?.gpa) {
        response += `**GPA:** ${profile.gpa}\n`;
      }
      if (profile?.eduStartDate || profile?.eduEndDate) {
        response += `**Duration:** ${profile.eduStartDate || '—'} ${profile.eduEndDate ? `→ ${profile.eduEndDate}` : ''}\n`;
      }
      response += `\n`;
      
      if (profile?.degree && profile?.eduInstitution) {
        response += `${pronouns.subject} is ${profile.eduEndDate ? 'a graduate' : 'currently pursuing'} of ${profile.degree} from ${profile.eduInstitution}${profile.gpa ? ` with a GPA of ${profile.gpa}` : ''}. `;
      }
      
      if (profile?.title && profile.title.includes(profile?.degree)) {
        response += `${pronouns.possessive} academic qualifications align with ${pronouns.possessive} specialization in ${profile?.researchArea || 'their field'}.`;
      }
      
      return response;
    }
    
    // Summarize profile
    if (lowerQuestion.includes('summarize') && lowerQuestion.includes('profile')) {
      let response = `**Profile Summary for ${name}**\n\n`;
      
      // Build natural summary using actual profile data
      if (profile?.title && profile?.university) {
        response += `${name} is ${profile.title} at ${profile.university}. `;
      } else if (profile?.title) {
        response += `${name} is ${profile.title}. `;
      } else if (profile?.university) {
        response += `${name} is associated with ${profile.university}. `;
      }
      
      if (profile?.researchArea) {
        response += `${pronouns.possessive} primary research area is ${profile.researchArea}. `;
      }
      
      response += `\n\n`;
      
      // Education
      if (profile?.degree || profile?.eduInstitution) {
        response += `**Education:**\n`;
        if (profile.degree) {
          response += `${pronouns.subject} ${profile.eduEndDate ? 'earned' : 'is pursuing'} ${pronouns.possessive} ${profile.degree}`;
          if (profile.eduInstitution) response += ` from ${profile.eduInstitution}`;
          if (profile.gpa) response += ` with a GPA of ${profile.gpa}`;
          response += `.\n`;
        }
        response += `\n`;
      }
      
      // Experience
      if (profile?.expTitle) {
        response += `**Professional Experience:**\n`;
        response += `${pronouns.subject} works as ${profile.expTitle}`;
        if (profile.expOrganization) response += ` at ${profile.expOrganization}`;
        if (profile.expStartDate || profile.expEndDate) {
          response += ` (${profile.expStartDate || '—'} ${profile.expEndDate ? `→ ${profile.expEndDate}` : ''})`;
        }
        response += `.\n`;
        if (profile.expDescription) {
          response += `${profile.expDescription}\n`;
        }
        response += `\n`;
      }
      
      // Research & Publications
      if (profile?.pubTitle) {
        response += `**Publications & Research:**\n`;
        response += `${pronouns.subject} published "${profile.pubTitle}"`;
        if (profile.pubYear) response += ` in ${profile.pubYear}`;
        if (profile.pubJournal) response += ` at ${profile.pubJournal}`;
        if (profile.pubAuthors) response += ` with ${profile.pubAuthors}`;
        response += `.\n\n`;
      }
      
      // Skills
      if (keywords.length > 0) {
        response += `**Key Skills & Expertise:**\n`;
        response += `${pronouns.possessive} expertise includes: ${keywords.join(', ')}.\n\n`;
      }
      
      // Projects
      if (profile?.projTitle) {
        response += `**Projects:**\n`;
        response += `${pronouns.subject} ${profile.projRole ? `served as ${profile.projRole} on '${profile.projTitle}'` : `worked on "${profile.projTitle}"`}. `;
        if (profile.projDescription) {
          response += `${profile.projDescription}`;
        }
        response += `\n\n`;
      }
      
      // Bio - use full bio, not truncated
      if (profile?.bio && profile.bio.trim()) {
        response += `**About ${name}:**\n${profile.bio}\n\n`;
      }
      
      // Final summary
      response += `**Summary:** ${name} is a ${profile?.title || 'professional'}${profile?.university ? ` at ${profile.university}` : ''} specializing in ${profile?.researchArea || 'their field'}. `;
      if (keywords.length > 0) {
        response += `${pronouns.subject} has expertise in ${keywords.slice(0, 4).join(', ')}${keywords.length > 4 ? ` and ${keywords.length - 4} other areas` : ''}. `;
      }
      if (profile?.expTitle) {
        response += `${pronouns.possessive} work as ${profile.expTitle} demonstrates strong technical skills and commitment to ${profile?.researchArea || 'research excellence'}.`;
      }
      
      return response;
    }
    
    // Summarize research interests
    if (lowerQuestion.includes('summarize') && lowerQuestion.includes('research interest')) {
      let response = `**${name}'s Research Interests:**\n\n`;
      
      if (profile?.researchArea) {
        response += `${pronouns.possessive} primary research focus is ${profile.researchArea}. `;
      }
      
      if (keywords.length > 0) {
        response += `${pronouns.subject} has interests and expertise in:\n`;
        keywords.forEach((keyword, i) => {
          response += `${i + 1}. ${keyword}\n`;
        });
        response += `\n`;
      }
      
      if (profile?.bio && profile.bio.trim()) {
        // Extract full bio, not filtered
        response += `**Research Background:**\n${profile.bio}\n\n`;
      }
      
      response += `${pronouns.possessive} research interests demonstrate a strong commitment to ${profile?.researchArea || 'their field'}, with practical applications visible in ${profile?.expTitle ? `${pronouns.possessive} work as ${profile.expTitle}` : `${pronouns.possessive} academic and professional activities`}.`;
      
      return response;
    }
    
    // Summarize papers/publications
    if (lowerQuestion.includes('summarize') && lowerQuestion.includes('paper')) {
      let response = `**Publications Summary for ${name}**\n\n`;
      
      if (profile?.pubTitle) {
        response += `**Main Publication:**\n`;
        response += `• **Title:** ${profile.pubTitle}\n`;
        if (profile.pubYear) response += `• **Year:** ${profile.pubYear}\n`;
        if (profile.pubAuthors) response += `• **Authors:** ${profile.pubAuthors}\n`;
        if (profile.pubJournal) response += `• **Venue:** ${profile.pubJournal}\n`;
        response += `\n`;
        response += `This publication demonstrates ${pronouns} research contributions to ${profile?.researchArea || 'the field'}, particularly in areas related to ${keywords.length > 0 ? keywords.slice(0, 2).join(' and ') : profile?.researchArea || 'their specialization'}.\n\n`;
      } else {
        response += `Publication details are ${profile?.pubTitle ? 'available' : 'not specified'} in the profile.\n\n`;
      }
      
      if (profile?.bio) {
        const pubMentions = profile.bio.match(/research|publication|paper|journal|conference/gi);
        if (pubMentions) {
          response += `The profile indicates active engagement in research activities, with work spanning ${profile?.researchArea || 'multiple areas'}.\n`;
        }
      }
      
      return response;
    }
    
    // List publications
    if (lowerQuestion.includes('list') && lowerQuestion.includes('publication')) {
      let response = `**Publications for ${name}:**\n\n`;
      
      if (profile?.pubTitle) {
        response += `1. **${profile.pubTitle}**\n`;
        if (profile.pubYear) response += `   Year: ${profile.pubYear}\n`;
        if (profile.pubAuthors) response += `   Authors: ${profile.pubAuthors}\n`;
        if (profile.pubJournal) response += `   Published in: ${profile.pubJournal}\n`;
        if (profile.pubLink) response += `   Link: ${profile.pubLink}\n`;
      } else {
        response += `Publication information is not provided in this profile.\n`;
        response += `However, ${name}'s research activities in ${profile?.researchArea || 'their field'} suggest active scholarly work.\n`;
      }
      
      return response;
    }
    
    // Summarize CV
    if (lowerQuestion.includes('summarize') && lowerQuestion.includes('cv')) {
      let response = `**CV Summary for ${name}**\n\n`;
      
      response += `**Education:**\n`;
      if (profile?.degree) {
        response += `• ${profile.degree}`;
        if (profile.eduInstitution) response += ` from ${profile.eduInstitution}`;
        if (profile.gpa) response += ` (GPA: ${profile.gpa})`;
        response += `\n`;
      } else {
        response += `• Educational background not specified\n`;
      }
      response += `\n`;
      
      if (profile?.expTitle) {
        response += `**Professional Experience:**\n`;
        response += `• **${profile.expTitle}**\n`;
        if (profile.expOrganization) response += `  Organization: ${profile.expOrganization}\n`;
        if (profile.expStartDate || profile.expEndDate) {
          response += `  Duration: ${profile.expStartDate || '—'} ${profile.expEndDate ? `→ ${profile.expEndDate}` : ''}\n`;
        }
        if (profile.expDescription) response += `  ${profile.expDescription}\n`;
        response += `\n`;
      }
      
      if (keywords.length > 0) {
        response += `**Core Skills:**\n`;
        response += keywords.map(k => `• ${k}`).join('\n');
        response += `\n\n`;
      }
      
      if (profile?.projTitle) {
        response += `**Projects:**\n`;
        response += `• ${profile.projTitle}`;
        if (profile.projRole) response += ` (${profile.projRole})`;
        response += `\n`;
        if (profile.projDescription) response += `  ${profile.projDescription}\n`;
        response += `\n`;
      }
      
      if (profile?.achTitle) {
        response += `**Achievements:**\n`;
        response += `• ${profile.achTitle}\n`;
        if (profile.achDescription) response += `  ${profile.achDescription}\n`;
      }
      
      return response;
    }
    
    // Highlight skills
    if (lowerQuestion.includes('highlight') && lowerQuestion.includes('skill')) {
      let response = `**Key Skills for ${name}:**\n\n`;
      
      if (keywords.length > 0) {
        response += `**Technical Skills:**\n`;
        keywords.forEach((skill, i) => {
          response += `${i + 1}. **${skill}**\n`;
        });
        response += `\n`;
        response += `${name} demonstrates proficiency in ${keywords.length} key areas, with particular strength in ${keywords.slice(0, 3).join(', ')}.\n\n`;
      }
      
      if (profile?.projTitle) {
        response += `**Applied Skills Demonstrated:**\n`;
        response += `Through projects like "${profile.projTitle}", ${name} has applied ${keywords.slice(0, 2).join(' and ')} in practical contexts.\n`;
      }
      
      return response;
    }
    
    // Summarize portfolio
    if (lowerQuestion.includes('summarize') && lowerQuestion.includes('portfolio')) {
      let response = `**Portfolio Summary for ${name}**\n\n`;
      
      if (profile?.projTitle) {
        response += `**Key Project:**\n`;
        response += `• **${profile.projTitle}**\n`;
        if (profile.projRole) response += `  Role: ${profile.projRole}\n`;
        if (profile.projDescription) response += `  Description: ${profile.projDescription}\n`;
        response += `\n`;
      }
      
      if (profile?.pubTitle) {
        response += `**Research Contributions:**\n`;
        response += `• ${profile.pubTitle}`;
        if (profile.pubJournal) response += ` (${profile.pubJournal})`;
        response += `\n\n`;
      }
      
      if (profile?.achTitle) {
        response += `**Achievements:**\n`;
        response += `• ${profile.achTitle}\n`;
        if (profile.achDescription) response += `  ${profile.achDescription}\n`;
        response += `\n`;
      }
      
      response += `**Portfolio Overview:** ${name}'s portfolio showcases work in ${profile?.researchArea || 'their field'}, demonstrating both academic rigor and practical application.`;
      
      return response;
    }
    
    // Suggest matches
    if (lowerQuestion.includes('suggest') && (lowerQuestion.includes('student') || lowerQuestion.includes('professor') || lowerQuestion.includes('collaborat'))) {
      let response = `**Collaboration Suggestions for ${name}**\n\n`;
      
      response += `**Ideal Matching Criteria:**\n`;
      if (profile?.researchArea) {
        response += `• Research focus in ${profile.researchArea}\n`;
      }
      if (keywords.length > 0) {
        response += `• Shared interests in: ${keywords.slice(0, 4).join(', ')}\n`;
      }
      response += `\n`;
      
      response += `**Recommended Matches:**\n`;
      response += `${name} would be an excellent collaborator for ${profileType === 'professor' ? 'students' : 'professors'} who:\n`;
      response += `• Work in ${profile?.researchArea || 'related fields'}\n`;
      response += `• Have complementary skills in ${keywords.length > 2 ? keywords.slice(1, 3).join(' and ') : 'related areas'}\n`;
      response += `• Are interested in ${keywords.length > 0 ? keywords[0] : profile?.researchArea || 'similar research topics'}\n\n`;
      
      response += `**Why This Match Works:**\n`;
      response += `${name}'s expertise in ${keywords.slice(0, 2).join(' and ')} combined with ${profile?.title ? `${pronouns.possessive} ${profile.title} position` : `${pronouns.possessive} academic background`} makes ${pronouns.object} ideal for collaborative research projects.`;
      
      return response;
    }
    
    // Questions about experience/work
    if (lowerQuestion.includes('experience') || lowerQuestion.includes('work') || lowerQuestion.includes('job')) {
      let response = `${name}'s professional experience:\n\n`;
      
      if (profile?.expTitle) {
        response += `**Current Role:** ${profile.expTitle}\n`;
        if (profile.expOrganization) {
          response += `**Organization:** ${profile.expOrganization}\n`;
        }
        if (profile.expStartDate || profile.expEndDate) {
          response += `**Duration:** ${profile.expStartDate || '—'} ${profile.expEndDate ? `→ ${profile.expEndDate}` : ''}\n`;
        }
        response += `\n`;
        
        if (profile.expDescription) {
          response += `**Responsibilities:**\n${profile.expDescription}\n\n`;
        }
        
        response += `${pronouns.subject} has been working as ${profile.expTitle}${profile.expOrganization ? ` at ${profile.expOrganization}` : ''}${profile.expStartDate && profile.expEndDate ? ` from ${profile.expStartDate} to ${profile.expEndDate}` : profile.expStartDate ? ` since ${profile.expStartDate}` : ''}. `;
        if (profile.expDescription) {
          response += profile.expDescription;
        }
      } else {
        response += `Professional experience details are not provided in this profile.\n`;
      }
      
      return response;
    }
    
    // Questions about skills
    if (lowerQuestion.includes('skill') || lowerQuestion.includes('expertise')) {
      let response = `${name}'s skills and expertise:\n\n`;
      
      if (keywords.length > 0) {
        response += `**Technical Skills:**\n${keywords.map(k => `• ${k}`).join('\n')}\n\n`;
        response += `${pronouns.subject} has ${keywords.length} key areas of expertise, with strong proficiency in ${keywords.slice(0, 4).join(', ')}${keywords.length > 4 ? `, and ${keywords.length - 4} additional areas` : ''}.\n\n`;
      }
      
      if (profile?.projTitle) {
        response += `**Applied in Projects:**\n${pronouns.subject} has demonstrated these skills through ${pronouns.possessive} work on "${profile.projTitle}"${profile.projDescription ? `, which involved ${profile.projDescription}` : ''}.\n`;
      }
      
      return response;
    }
    
    // Questions about projects
    if (lowerQuestion.includes('project')) {
      let response = `${name}'s projects:\n\n`;
      
      if (profile?.projTitle) {
        response += `**Main Project:** ${profile.projTitle}\n`;
        if (profile.projRole) {
          response += `**Role:** ${profile.projRole}\n`;
        }
        if (profile.projStartDate || profile.projEndDate) {
          response += `**Duration:** ${profile.projStartDate || '—'} ${profile.projEndDate ? `→ ${profile.projEndDate}` : ''}\n`;
        }
        response += `\n`;
        
        if (profile.projDescription) {
          response += `**Description:**\n${profile.projDescription}\n`;
        }
      } else {
        response += `Project information is not provided in this profile.\n`;
      }
      
      return response;
    }
    
    // Questions about publications
    if (lowerQuestion.includes('publication') || lowerQuestion.includes('paper')) {
      let response = `${name}'s publications and research:\n\n`;
      
      if (profile?.pubTitle) {
        response += `**Publication:** ${profile.pubTitle}\n`;
        if (profile.pubYear) {
          response += `**Year:** ${profile.pubYear}\n`;
        }
        if (profile.pubAuthors) {
          response += `**Authors:** ${profile.pubAuthors}\n`;
        }
        if (profile.pubJournal) {
          response += `**Published in:** ${profile.pubJournal}\n`;
        }
        if (profile.pubLink) {
          response += `**Link:** ${profile.pubLink}\n`;
        }
        response += `\n`;
        
        response += `This publication focuses on ${profile?.researchArea || 'their research area'}, demonstrating ${pronouns.possessive} contributions to the field.`;
      } else {
        response += `${pronouns.subject} is actively engaged in research in ${profile?.researchArea || 'their field'}. `;
        if (profile?.expTitle && profile.expDescription) {
          response += `${pronouns.possessive} work as ${profile.expTitle} involves ${profile.expDescription}.`;
        }
      }
      
      return response;
    }
    
    // Questions about achievements/certifications
    if (lowerQuestion.includes('achievement') || lowerQuestion.includes('certification') || lowerQuestion.includes('certificate')) {
      let response = `${name}'s achievements and certifications:\n\n`;
      
      if (profile?.achTitle) {
        response += `**Achievement:** ${profile.achTitle}\n`;
        if (profile.achYear) {
          response += `**Year:** ${profile.achYear}\n`;
        }
        if (profile.achDescription) {
          response += `**Description:**\n${profile.achDescription}\n`;
        }
      } else {
        response += `Achievement and certification information is not provided in this profile.`;
      }
      
      return response;
    }
    
    // Default response - give brief overview and suggest specific questions
    let response = `I can provide detailed information about ${name}. Here's a brief overview:\n\n`;
    
    // Brief summary only
    if (profile?.title && profile?.university) {
      response += `• ${pronouns.subject} is ${profile.title} at ${profile.university}\n`;
    }
    
    if (profile?.degree && profile?.eduInstitution) {
      response += `• ${pronouns.subject} ${profile.eduEndDate ? 'earned' : 'is pursuing'} ${pronouns.possessive} ${profile.degree} from ${profile.eduInstitution}${profile.gpa ? ` (GPA: ${profile.gpa})` : ''}\n`;
    }
    
    if (profile?.researchArea) {
      response += `• Research focus: ${profile.researchArea}\n`;
    }
    
    if (keywords.length > 0) {
      response += `• Expertise: ${keywords.slice(0, 5).join(', ')}${keywords.length > 5 ? `, and ${keywords.length - 5} more` : ''}\n`;
    }
    
    response += `\n**Ask me specific questions like:**\n`;
    response += `• "What are ${pronouns.possessive} interests?"\n`;
    response += `• "Tell me about ${pronouns.possessive} education"\n`;
    response += `• "What is ${pronouns.possessive} experience?"\n`;
    response += `• "What are ${pronouns.possessive} skills?"\n`;
    response += `• "Contact information"\n`;
    response += `• "Is ${pronouns.subject.toLowerCase()} verified?"\n`;
    response += `• "Summarize the profile"\n`;
    response += `• "What are ${pronouns.possessive} projects?"\n`;
    response += `• "What are ${pronouns.possessive} publications?"\n`;
    
    return response;
  };

  const handleSendMessage = (question = null) => {
    const questionText = question || inputValue.trim();
    if (!questionText) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: questionText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input if using text input
    if (!question) {
      setInputValue('');
    }

    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      const response = generatePlaceholderResponse(questionText);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(question);
  };

  // Initialize with greeting message when chat opens
  React.useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'assistant',
        content: `Hi! I can help you understand ${profile?.name || 'this profile'}. What would you like me to do?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, profile?.name]);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center ${isOpen ? 'hidden' : 'flex'} hover:scale-110`}
        aria-label="Open chat assistant"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[500px] h-[700px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-semibold">Profile Assistant</h3>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setMessages([]);
                setInputValue('');
              }}
              className="hover:bg-indigo-700 rounded-full p-1 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <div 
                    className="text-sm whitespace-pre-wrap chatbot-response"
                    style={{ 
                      lineHeight: '1.6',
                      fontSize: '0.875rem'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600; color: #1f2937;">$1</strong>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-4 pt-2 pb-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2 font-semibold">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me anything about this profile..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileChatAssistant;

