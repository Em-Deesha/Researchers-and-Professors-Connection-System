import os
import json
from typing import List, Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class ResearchJourneyAI:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self._setup_rag()
    
    def _setup_rag(self):
        """Initialize RAG system with sample research papers"""
        # Sample research papers for literature review
        self.sample_papers = [
            {
                "title": "Machine Learning Applications in Agricultural Yield Prediction",
                "abstract": "This paper explores the use of machine learning algorithms to predict agricultural yields based on weather data, soil conditions, and historical crop performance. The study demonstrates that ensemble methods achieve 85% accuracy in yield prediction.",
                "keywords": ["machine learning", "agriculture", "yield prediction", "ensemble methods"],
                "authors": "Smith, J., Johnson, A., Brown, K.",
                "year": "2023"
            },
            {
                "title": "Deep Learning for Crop Disease Detection in Smart Agriculture",
                "abstract": "We present a deep learning approach for automated crop disease detection using computer vision. Our CNN-based model achieves 92% accuracy in identifying common crop diseases from leaf images.",
                "keywords": ["deep learning", "computer vision", "crop disease", "CNN"],
                "authors": "Garcia, M., Lee, S., Wilson, R.",
                "year": "2023"
            },
            {
                "title": "IoT Sensors and AI for Precision Agriculture",
                "abstract": "This research investigates the integration of IoT sensors with AI algorithms for precision agriculture. The system monitors soil moisture, temperature, and nutrient levels to optimize irrigation and fertilization.",
                "keywords": ["IoT", "precision agriculture", "sensors", "optimization"],
                "authors": "Chen, L., Martinez, P., Taylor, D.",
                "year": "2022"
            },
            {
                "title": "Natural Language Processing for Agricultural Knowledge Extraction",
                "abstract": "We develop NLP techniques to extract actionable insights from agricultural research papers and farmer reports. The system uses transformer models to identify key farming practices and recommendations.",
                "keywords": ["NLP", "knowledge extraction", "transformer", "agriculture"],
                "authors": "Kumar, A., Singh, V., Patel, N.",
                "year": "2023"
            }
        ]
    
    def suggest_topics(self, area_of_interest: str) -> Dict[str, Any]:
        """Generate topic suggestions based on area of interest"""
        prompt = f"""
        You are an expert research advisor helping a student choose their first research topic.
        
        The student is interested in: {area_of_interest}
        
        Please provide:
        1. 3-5 refined research topics with clear focus
        2. 5-7 relevant keywords for each topic
        3. 2-3 sample research questions for each topic
        4. Brief explanation of why each topic is suitable for a beginner researcher
        
        Format your response as JSON with this structure:
        {{
            "topics": [
                {{
                    "title": "Topic title",
                    "keywords": ["keyword1", "keyword2", "keyword3"],
                    "questions": ["Question 1", "Question 2", "Question 3"],
                    "explanation": "Why this topic is good for beginners"
                }}
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            result = response.text
            
            # Try to extract JSON from the response
            try:
                # Look for JSON in the response
                json_start = result.find('{')
                json_end = result.rfind('}') + 1
                if json_start != -1 and json_end != -1:
                    json_str = result[json_start:json_end]
                    return json.loads(json_str)
            except:
                pass
            
            # Fallback if JSON parsing fails
            return {
                "topics": [
                    {
                        "title": f"AI Applications in {area_of_interest}",
                        "keywords": ["artificial intelligence", "machine learning", area_of_interest.lower()],
                        "questions": [
                            f"How can AI improve {area_of_interest}?",
                            f"What are the challenges of implementing AI in {area_of_interest}?",
                            f"What are the ethical considerations of AI in {area_of_interest}?"
                        ],
                        "explanation": f"This topic combines your interest in {area_of_interest} with current AI trends, making it highly relevant and researchable."
                    }
                ]
            }
        except Exception as e:
            # Fallback if API call fails
            return {
                "topics": [
                    {
                        "title": f"AI Applications in {area_of_interest}",
                        "keywords": ["artificial intelligence", "machine learning", area_of_interest.lower()],
                        "questions": [
                            f"How can AI improve {area_of_interest}?",
                            f"What are the challenges of implementing AI in {area_of_interest}?",
                            f"What are the ethical considerations of AI in {area_of_interest}?"
                        ],
                        "explanation": f"This topic combines your interest in {area_of_interest} with current AI trends, making it highly relevant and researchable."
                    }
                ]
            }
    
    def generate_literature_summary(self, selected_topic: str) -> Dict[str, Any]:
        """Generate literature review summary using RAG"""
        # Create context from sample papers
        context = "\n\n".join([
            f"Title: {paper['title']}\nAbstract: {paper['abstract']}\nKeywords: {', '.join(paper['keywords'])}\nAuthors: {paper['authors']}\nYear: {paper['year']}"
            for paper in self.sample_papers
        ])
        
        prompt = f"""
        You are helping a student write a literature review for their research topic.
        
        Topic: {selected_topic}
        
        Based on the following research papers, provide a comprehensive literature review summary:
        
        {context}
        
        Please provide:
        1. A brief overview of current research in this area
        2. Key findings from recent studies
        3. Research gaps and opportunities
        4. 3-5 key papers that the student should read
        5. Suggestions for further reading
        
        Format as a structured summary that a beginner researcher can understand.
        """
        
        try:
            response = self.model.generate_content(prompt)
            summary = response.text
            
            return {
                "summary": summary,
                "key_papers": [
                    {
                        "title": "Machine Learning Applications in Agricultural Yield Prediction",
                        "authors": "Smith, J., Johnson, A., Brown, K.",
                        "year": "2023",
                        "relevance": "Highly relevant to AI in agriculture research"
                    },
                    {
                        "title": "Deep Learning for Crop Disease Detection in Smart Agriculture",
                        "authors": "Garcia, M., Lee, S., Wilson, R.",
                        "year": "2023",
                        "relevance": "Excellent example of AI applications in agriculture"
                    }
                ]
            }
        except Exception as e:
            return {
                "summary": f"Based on current research in {selected_topic}, there are several key areas of investigation including machine learning applications, deep learning approaches, and IoT integration. Recent studies show promising results in yield prediction and disease detection using AI techniques.",
                "key_papers": [
                    {
                        "title": "Machine Learning Applications in Agricultural Yield Prediction",
                        "authors": "Smith, J., Johnson, A., Brown, K.",
                        "year": "2023",
                        "relevance": "Highly relevant to AI in agriculture research"
                    }
                ]
            }
    
    def generate_proposal(self, topic: str, research_questions: str) -> Dict[str, Any]:
        """Generate research proposal components"""
        
        try:
            # Generate title
            title_prompt = f"Generate a clear, concise research title for this topic: {topic}. The title should be specific and researchable. Return only the title."
            title_response = self.model.generate_content(title_prompt)
            title = title_response.text.strip()
            
            # Generate abstract
            abstract_prompt = f"""
            Write a research abstract for this topic: {topic}
            Research questions: {research_questions}
            
            The abstract should be 150-200 words and include:
            - Background and motivation
            - Research objectives
            - Proposed methodology
            - Expected outcomes
            """
            abstract_response = self.model.generate_content(abstract_prompt)
            abstract = abstract_response.text.strip()
            
            # Generate objectives
            objectives_prompt = f"""
            Based on this topic: {topic} and research questions: {research_questions}
            
            Generate 3-5 specific, measurable research objectives that a beginner researcher can achieve.
            Each objective should be clear and actionable.
            """
            objectives_response = self.model.generate_content(objectives_prompt)
            objectives = objectives_response.text.strip()
            
            # Generate methodology
            methodology_prompt = f"""
            For this research topic: {topic}
            
            Provide a detailed methodology section that includes:
            1. Research design and approach
            2. Data collection methods
            3. Analysis techniques
            4. Timeline and milestones
            5. Resources needed
            
            Make it practical for a student researcher.
            """
            methodology_response = self.model.generate_content(methodology_prompt)
            methodology = methodology_response.text.strip()
            
            return {
                "title": title,
                "abstract": abstract,
                "objectives": objectives,
                "methodology": methodology
            }
        except Exception as e:
            # Fallback proposal
            return {
                "title": f"Research on {topic}",
                "abstract": f"This research investigates {topic} to address current challenges and opportunities in the field. The study aims to provide practical insights and contribute to the growing body of knowledge in this area.",
                "objectives": f"1. Analyze current state of {topic}\n2. Identify key challenges and opportunities\n3. Develop practical solutions\n4. Evaluate effectiveness of proposed approaches",
                "methodology": f"Mixed-methods approach combining literature review, data analysis, and practical implementation. Timeline: 6-12 months with regular milestones and progress reviews."
            }
    
    def generate_professor_contact_guidance(self, topic: str) -> Dict[str, Any]:
        """Generate guidance for contacting professors"""
        
        prompt = f"""
        A student wants to contact professors about this research topic: {topic}
        
        Provide guidance on:
        1. How to find relevant professors
        2. What to include in the initial email
        3. Sample email template
        4. Follow-up strategies
        5. What to prepare before meeting
        6. Common mistakes to avoid
        
        Make the advice practical and encouraging for a beginner.
        """
        
        try:
            response = self.model.generate_content(prompt)
            guidance = response.text
            
            return {
                "guidance": guidance,
                "sample_email": f"""
Subject: Research Collaboration Opportunity - {topic}

Dear Professor [Name],

I hope this email finds you well. I am a [your level] student interested in conducting research in {topic}. 

I have been following your work on [specific area] and believe your expertise would be invaluable for my research project. I am particularly interested in [specific aspect] and would love to discuss potential collaboration opportunities.

I have prepared a brief research proposal and would be grateful for the opportunity to meet with you to discuss my ideas and receive your guidance.

Thank you for your time and consideration.

Best regards,
[Your Name]
[Your Contact Information]
                """.strip()
            }
        except Exception as e:
            return {
                "guidance": f"""
                Here's how to contact professors about your research in {topic}:
                
                1. **Finding Professors**: Search university websites, Google Scholar, and academic databases for faculty working in your area.
                
                2. **Email Content**: Be specific about your research interests, show you've read their work, and explain how you can contribute.
                
                3. **Follow-up**: Send a polite follow-up after 1-2 weeks if you don't hear back.
                
                4. **Preparation**: Have a clear research question, read their recent papers, and prepare specific questions about their work.
                
                5. **Common Mistakes**: Don't send generic emails, don't ask for too much time initially, and always be professional.
                """,
                "sample_email": f"""
Subject: Research Collaboration Opportunity - {topic}

Dear Professor [Name],

I hope this email finds you well. I am a [your level] student interested in conducting research in {topic}. 

I have been following your work on [specific area] and believe your expertise would be invaluable for my research project. I am particularly interested in [specific aspect] and would love to discuss potential collaboration opportunities.

I have prepared a brief research proposal and would be grateful for the opportunity to meet with you to discuss my ideas and receive your guidance.

Thank you for your time and consideration.

Best regards,
[Your Name]
[Your Contact Information]
                """.strip()
            }