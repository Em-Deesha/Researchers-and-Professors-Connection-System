import os
import json
from typing import Dict, List, Tuple, Optional

import requests
from bs4 import BeautifulSoup

from .database import get_professor_from_firestore


def _safe_get_json(url: str, headers: Dict[str, str] | None = None, params: Dict[str, str] | None = None) -> dict:
    try:
        resp = requests.get(url, headers=headers or {}, params=params or {}, timeout=15)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        return {}
    return {}


def fetch_wikipedia_summary(name: str, university: str) -> Tuple[str, List[str]]:
    query = f"{name} {university}"
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(query)}"
    data = _safe_get_json(url)
    evidence: List[str] = []
    text = ""
    if data.get("extract"):
        text = str(data.get("extract"))
    if data.get("content_urls", {}).get("desktop", {}).get("page"):
        evidence.append(data["content_urls"]["desktop"]["page"])
    return text, evidence


def fetch_semantic_scholar(name: str, research_area: str = None, university: str = None) -> Tuple[str, List[str]]:
    # Public author search endpoint (rate-limited but free)
    # Build more specific query if research area is available
    query = name
    if research_area:
        query = f"{name} {research_area}"
    if university:
        query = f"{query} {university}"
    
    url = "https://api.semanticscholar.org/graph/v1/author/search"
    # Request author stats: paperCount, hIndex, citationCount for verification
    params = {"query": query, "limit": "10", "fields": "name,affiliations,url,paperCount,hIndex,citationCount"}
    data = _safe_get_json(url, params=params)
    text_parts: List[str] = []
    evidence: List[str] = []
    
    # Filter and prioritize matches
    matches = data.get("data") or []
    
    # If we have research area, prioritize authors with matching affiliations/research
    if research_area:
        matches.sort(key=lambda x: (
            research_area.lower() in " ".join(x.get("affiliations", []) or []).lower(),
            x.get("paperCount", 0)
        ), reverse=True)
    
    for item in matches[:10]:
        display = item.get("name", "")
        aff = ", ".join(item.get("affiliations") or [])
        paper_count = item.get("paperCount", 0)
        h_index = item.get("hIndex", 0)
        citations = item.get("citationCount", 0)
        
        if display:
            author_info = f"Author: {display} | Affiliations: {aff}"
            if paper_count > 0:
                author_info += f" | Publications: {paper_count}"
            if h_index > 0:
                author_info += f" | h-index: {h_index}"
            if citations > 0:
                author_info += f" | Citations: {citations}"
            text_parts.append(author_info)
        
        # Add author profile URL and fetch their papers
        author_id = item.get("authorId")
        if author_id:
            evidence.append(f"https://www.semanticscholar.org/author/{author_id}")
            # Fetch their papers for better evidence
            try:
                papers_url = f"https://api.semanticscholar.org/graph/v1/author/{author_id}/papers"
                papers_params = {"fields": "title,year,venue,paperId", "limit": "5"}
                papers_data = _safe_get_json(papers_url, params=papers_params)
                papers = papers_data.get("data", [])
                
                if papers:
                    for paper in papers[:3]:
                        paper_id = paper.get("paperId")
                        if paper_id:
                            evidence.append(f"https://www.semanticscholar.org/paper/{paper_id}")
                            title = paper.get("title", "")
                            year = paper.get("year", "")
                            venue = paper.get("venue", "")
                            if title:
                                text_parts.append(f"  Paper: {title} ({year}) {venue}".strip())
            except Exception:
                # If paper fetch fails, continue without papers
                pass
        
        if item.get("url"):
            evidence.append(item["url"])
    
    return "\n".join(text_parts), evidence


def search_duckduckgo(query: str, prioritize_research: bool = False) -> List[str]:
    # Simple, free HTML search as a stand-in for Google results
    # Prioritize research/publication-related queries
    if prioritize_research:
        query = f"{query} research publications"
    
    url = "https://duckduckgo.com/html/"
    try:
        resp = requests.post(url, data={"q": query}, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        links: List[str] = []
        research_sites = ["scholar", "researchgate", "arxiv", "pubmed", "dblp", "acm", "ieee", "semanticscholar"]
        
        for a in soup.select("a.result__a"):
            href = a.get("href")
            if href and href.startswith("http"):
                # Prioritize research-related links
                href_lower = href.lower()
                is_research = any(site in href_lower for site in research_sites)
                links.append((href, is_research))
        
        # Sort: research links first, then others
        links.sort(key=lambda x: (not x[1], x[0]))
        return [link[0] for link in links[:10]]
    except Exception:
        return []


def _call_gemini(prompt: str) -> dict | None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        res = model.generate_content(prompt)
        text = (res.text or "").strip()
        # Expect JSON in the reply; try to parse
        try:
            return json.loads(text)
        except Exception:
            # Attempt to extract JSON block
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(text[start : end + 1])
            return None
    except Exception:
        return None


def verify_professor(name: str, university: str) -> Dict[str, object]:
    # First, try to get existing professor data from Firestore (if available)
    firestore_professor: Optional[Dict] = get_professor_from_firestore(name, university)
    
    # Extract research information from Firestore
    research_area = None
    publications = []
    keywords = []
    
    if firestore_professor:
        research_area = firestore_professor.get('researchArea') or firestore_professor.get('primaryResearchArea')
        
        # Get publications from Firestore
        if firestore_professor.get('publications'):
            publications = firestore_professor['publications'] if isinstance(firestore_professor['publications'], list) else [firestore_professor['publications']]
        elif firestore_professor.get('papers'):
            publications = firestore_professor['papers'] if isinstance(firestore_professor['papers'], list) else [firestore_professor['papers']]
        elif firestore_professor.get('pubTitle'):
            publications = [{'title': firestore_professor.get('pubTitle'), 'year': firestore_professor.get('pubYear'), 'journal': firestore_professor.get('pubJournal')}]
        
        # Get keywords
        if firestore_professor.get('keywords'):
            if isinstance(firestore_professor['keywords'], list):
                keywords = firestore_professor['keywords']
            elif isinstance(firestore_professor['keywords'], str):
                keywords = [k.strip() for k in firestore_professor['keywords'].split(',')]
    
    # Prioritize research area over university name for better publication matching
    # If university looks invalid (contains "professor", "of", etc.), focus on research
    university_is_valid = university and not any(word in university.lower() for word in ['professor', 'of computer', 'teacher'])
    
    # Gather evidence from external sources with research focus
    wiki_text, wiki_links = fetch_wikipedia_summary(name, university if university_is_valid else "")
    
    # For Semantic Scholar, prioritize research area over university if university is invalid
    s2_university = university if university_is_valid else None
    s2_text, s2_links = fetch_semantic_scholar(name, research_area, s2_university)
    
    # Build search query prioritizing research publications and research area
    if research_area:
        # Use research area as primary search term
        ddg_query = f"{name} {research_area}"
    else:
        ddg_query = f"{name}"
    
    if university_is_valid:
        ddg_query = f"{ddg_query} {university}"
    
    if publications:
        # Include publication titles in search - this is the strongest signal
        pub_titles = [p.get('title', str(p)) if isinstance(p, dict) else str(p) for p in publications[:2]]
        ddg_query = f"{ddg_query} {' '.join(pub_titles)}"
    
    ddg_query += " research publications papers"
    
    ddg_links = search_duckduckgo(ddg_query, prioritize_research=True)

    evidence_links: List[str] = []
    for link in wiki_links + s2_links + ddg_links:
        if link not in evidence_links:
            evidence_links.append(link)

    # Build context including Firestore data if available
    firestore_context = ""
    publications_context = ""
    
    if firestore_professor:
        firestore_context = (
            f"\nExisting Profile in Database:\n"
            f"Name: {firestore_professor.get('name', name)}\n"
            f"University: {firestore_professor.get('university', university)}\n"
            f"Department: {firestore_professor.get('department', 'N/A')}\n"
            f"Research Area: {research_area or 'N/A'}\n"
            f"Title: {firestore_professor.get('title', 'N/A')}\n"
        )
        
        if keywords:
            firestore_context += f"Keywords: {', '.join(keywords[:5])}\n"
        
        if publications:
            publications_context = "\nPublications from Profile:\n"
            for pub in publications[:5]:
                if isinstance(pub, dict):
                    title = pub.get('title', pub.get('pubTitle', 'N/A'))
                    year = pub.get('year', pub.get('pubYear', 'N/A'))
                    journal = pub.get('journal', pub.get('pubJournal', ''))
                    authors = pub.get('authors', pub.get('pubAuthors', ''))
                    pub_str = f"- {title}"
                    if year and year != 'N/A':
                        pub_str += f" ({year})"
                    if journal:
                        pub_str += f" - {journal}"
                    if authors:
                        pub_str += f" | Authors: {authors}"
                    publications_context += pub_str + "\n"
                else:
                    publications_context += f"- {str(pub)}\n"
            publications_context += "\n"
    
    compiled_context = (
        f"Name: {name}\nUniversity: {university}\n{firestore_context}\n{publications_context}"
        f"Wikipedia:\n{wiki_text or '[none]'}\n\n"
        f"Semantic Scholar (Research Publications):\n{s2_text or '[none]'}\n\n"
        f"Top Evidence Links:\n" + "\n".join(evidence_links[:15])
    )

    instruction = (
        "You are verifying whether a person is a real and active professor based on their RESEARCH PUBLICATIONS and academic profile. "
        "Focus on: 1) Research publications found in Semantic Scholar or profile, 2) Academic affiliations matching the university, "
        "3) Research area consistency, 4) Evidence of active research work. "
        "Prioritize verification based on PUBLICATION RECORD and research activity over general web presence. "
        "Return STRICT JSON with keys: verified (bool), confidence_score (0-100), summary (string explaining verification based on research/publications)."
    )

    prompt = (
        f"{instruction}\n\nCONTEXT\n-----\n{compiled_context}\n\n"
        "JSON ONLY RESPONSE EXAMPLE:\n"
        "{\n  \"verified\": true,\n  \"confidence_score\": 87,\n  \"summary\": \"Professor is active in AI research at MIT with recent publications.\"\n}"
    )

    ai_json = _call_gemini(prompt)

    if ai_json is None:
        # Fallback heuristic - prioritize research publications
        score = 0
        research_bonus = 0
        
        # Check for publications in Firestore
        if publications:
            research_bonus += 30
            if len(publications) >= 2:
                research_bonus += 10
        
        # Check for research area
        if research_area:
            research_bonus += 10
        
        # Semantic Scholar results (research-focused)
        if s2_text:
            # Check if Semantic Scholar found papers/publications
            if "Papers:" in s2_text or "papers:" in s2_text.lower():
                score += 50
            else:
                score += 30
        
        # Wikipedia can help but less weight
        if wiki_text:
            score += 20
        
        # Evidence links from research sources
        research_links = [link for link in evidence_links if any(site in link.lower() for site in ["scholar", "arxiv", "researchgate", "pubmed", "semanticscholar", "dblp", "acm", "ieee"])]
        if research_links:
            score += min(20, len(research_links) * 5)
        
        score += research_bonus
        score = max(0, min(100, score))
        verified = score >= 60
        
        summary_parts = []
        if publications:
            summary_parts.append(f"Found {len(publications)} publication(s) in profile")
        if research_area:
            summary_parts.append(f"Research area: {research_area}")
        if research_links:
            summary_parts.append(f"Found {len(research_links)} research-related evidence links")
        if s2_text:
            summary_parts.append("Semantic Scholar author profile found")
        
        summary = "Heuristic result (no AI key). "
        if summary_parts:
            summary += " | ".join(summary_parts) + ". "
        summary += "Likely professor based on research activity." if verified else "Limited evidence of research activity."
        return {
            "verified": verified,
            "confidence_score": score,
            "evidence_links": evidence_links[:10],
            "summary": summary,
        }

    verified = bool(ai_json.get("verified", False))
    try:
        score = int(ai_json.get("confidence_score", 0))
    except Exception:
        score = 0
    summary = str(ai_json.get("summary", ""))

    score = max(0, min(100, score))

    return {
        "verified": verified,
        "confidence_score": score,
        "evidence_links": evidence_links[:10],
        "summary": summary,
    }


