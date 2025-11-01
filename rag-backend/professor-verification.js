// Professor Verification Module (Integrated from TT with AI)
// This module verifies professors based on research publications and academic profile

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

/**
 * Safe HTTP GET request helper
 */
async function safeGetJson(url, params = {}, headers = {}) {
  try {
    const urlObj = new URL(url);
    Object.keys(params).forEach(key => urlObj.searchParams.append(key, params[key]));
    
    const response = await fetch(urlObj.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0', ...headers }
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
  }
  return {};
}

/**
 * Fetch Wikipedia summary for professor
 */
async function fetchWikipediaSummary(name, university) {
  const query = `${name} ${university}`;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  const data = await safeGetJson(url);
  
  const evidence = [];
  let text = '';
  
  if (data.extract) {
    text = String(data.extract);
  }
  if (data.content_urls?.desktop?.page) {
    evidence.push(data.content_urls.desktop.page);
  }
  
  return { text, links: evidence };
}

/**
 * Fetch Semantic Scholar author information
 */
async function fetchSemanticScholar(name, researchArea = null, university = null) {
  let query = name;
  if (researchArea) {
    query = `${name} ${researchArea}`;
  }
  if (university) {
    query = `${query} ${university}`;
  }
  
  const url = 'https://api.semanticscholar.org/graph/v1/author/search';
  const params = {
    query,
    limit: '10',
    fields: 'name,affiliations,url,paperCount,hIndex,citationCount,authorId'
  };
  
  const data = await safeGetJson(url, params);
  const textParts = [];
  const evidence = [];
  
  let matches = data.data || [];
  
  // Prioritize matches by research area
  if (researchArea) {
    matches.sort((a, b) => {
      const aAff = (a.affiliations || []).join(' ').toLowerCase();
      const bAff = (b.affiliations || []).join(' ').toLowerCase();
      const aMatch = aAff.includes(researchArea.toLowerCase());
      const bMatch = bAff.includes(researchArea.toLowerCase());
      if (aMatch !== bMatch) return bMatch ? 1 : -1;
      return (b.paperCount || 0) - (a.paperCount || 0);
    });
  }
  
  for (const item of matches.slice(0, 10)) {
    const display = item.name || '';
    const aff = (item.affiliations || []).join(', ');
    const paperCount = item.paperCount || 0;
    const hIndex = item.hIndex || 0;
    const citations = item.citationCount || 0;
    
    if (display) {
      let authorInfo = `Author: ${display} | Affiliations: ${aff}`;
      if (paperCount > 0) authorInfo += ` | Publications: ${paperCount}`;
      if (hIndex > 0) authorInfo += ` | h-index: ${hIndex}`;
      if (citations > 0) authorInfo += ` | Citations: ${citations}`;
      textParts.push(authorInfo);
    }
    
    // Fetch papers for author
    const authorId = item.authorId;
    if (authorId) {
      evidence.push(`https://www.semanticscholar.org/author/${authorId}`);
      
      try {
        const papersUrl = `https://api.semanticscholar.org/graph/v1/author/${authorId}/papers`;
        const papersParams = { fields: 'title,year,venue,paperId', limit: '5' };
        const papersData = await safeGetJson(papersUrl, papersParams);
        const papers = papersData.data || [];
        
        for (const paper of papers.slice(0, 3)) {
          if (paper.paperId) {
            evidence.push(`https://www.semanticscholar.org/paper/${paper.paperId}`);
            if (paper.title) {
              const paperInfo = `  Paper: ${paper.title}${paper.year ? ` (${paper.year})` : ''}${paper.venue ? ` ${paper.venue}` : ''}`;
              textParts.push(paperInfo.trim());
            }
          }
        }
      } catch (error) {
        // Continue without papers
      }
    }
    
    if (item.url) {
      evidence.push(item.url);
    }
  }
  
  return { text: textParts.join('\n'), links: evidence };
}

/**
 * Search DuckDuckGo for research publications
 */
async function searchDuckDuckGo(query, prioritizeResearch = false) {
  if (prioritizeResearch) {
    query = `${query} research publications`;
  }
  
  const url = 'https://duckduckgo.com/html/';
  const researchSites = ['scholar', 'researchgate', 'arxiv', 'pubmed', 'dblp', 'acm', 'ieee', 'semanticscholar'];
  
  try {
    const formData = new URLSearchParams({ q: query });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const links = [];
      
      $('a.result__a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && href.startsWith('http')) {
          const hrefLower = href.toLowerCase();
          const isResearch = researchSites.some(site => hrefLower.includes(site));
          links.push({ href, isResearch });
        }
      });
      
      // Sort: research links first
      links.sort((a, b) => {
        if (a.isResearch !== b.isResearch) return b.isResearch ? 1 : -1;
        return 0;
      });
      
      return links.slice(0, 10).map(l => l.href);
    }
  } catch (error) {
    console.error('DuckDuckGo search error:', error.message);
  }
  
  return [];
}

/**
 * Call Gemini AI for verification
 */
async function callGemini(prompt, apiKey) {
  if (!apiKey) {
    return null;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.0-flash (same as used elsewhere in the backend)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();
    
    // Try to parse JSON from response
    try {
      return JSON.parse(text);
    } catch (e) {
      // Try to extract JSON block
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(text.substring(start, end + 1));
      }
    }
  } catch (error) {
    console.error('Gemini API error:', error.message);
  }
  
  return null;
}

/**
 * Get professor from Firestore
 */
async function getProfessorFromFirestore(db, name, university) {
  if (!db) {
    console.log('⚠️ Firestore not available, skipping profile lookup');
    return null;
  }
  
  const appId = process.env.APP_ID || 'academic-match-production';
  const collectionPaths = [
    `artifacts/${appId}/public/data/professors`,
    'artifacts/academic-match-production/public/data/professors',
    'artifacts/academic-matchmaker-prod/public/data/professors',
    'professors'
  ];
  
  const universityIsValid = university && !['professor', 'of computer', 'teacher'].some(word => 
    university.toLowerCase().includes(word)
  );
  
  for (const collectionPath of collectionPaths) {
    try {
      // Handle nested collection paths (e.g., "artifacts/app_id/public/data/professors")
      let ref;
      const pathParts = collectionPath.split('/');
      
      if (pathParts.length === 1) {
        // Simple collection
        ref = db.collection(collectionPath);
      } else {
        // Navigate nested: collection -> doc -> collection -> doc -> ...
        ref = db.collection(pathParts[0]);
        for (let i = 1; i < pathParts.length - 1; i += 2) {
          if (i + 1 < pathParts.length) {
            ref = ref.doc(pathParts[i]).collection(pathParts[i + 1]);
          }
        }
        // Last part is collection name
        if (pathParts.length > 1) {
          ref = ref.collection(pathParts[pathParts.length - 1]);
        }
      }
      
      // Query by name
      let snapshot = await ref.where('name', '==', name).limit(5).get();
      
      if (!snapshot.empty) {
        // Filter by university if valid
        if (universityIsValid) {
          const filteredDocs = snapshot.docs.filter(doc => {
            const docUniversity = (doc.data().university || '').toLowerCase();
            const universityLower = university.toLowerCase();
            return docUniversity.includes(universityLower) || universityLower.includes(docUniversity);
          });
          
          if (filteredDocs.length > 0) {
            return { id: filteredDocs[0].id, ...filteredDocs[0].data() };
          }
        } else {
          // Just return first match by name
          return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        }
      }
      
      // Try case-insensitive search
      const allDocs = await ref.limit(100).get();
      const nameLower = name.toLowerCase();
      
      for (const doc of allDocs.docs) {
        const data = doc.data();
        const docName = (data.name || '').toLowerCase();
        
        if (docName.includes(nameLower) || nameLower.includes(docName)) {
          if (universityIsValid) {
            const docUniversity = (data.university || '').toLowerCase();
            const universityLower = university.toLowerCase();
            if (docUniversity.includes(universityLower) || universityLower.includes(docUniversity)) {
              return { id: doc.id, ...data };
            }
          } else {
            return { id: doc.id, ...data };
          }
        }
      }
    } catch (error) {
      console.error(`Error searching ${collectionPath}:`, error.message);
      continue;
    }
  }
  
  return null;
}

/**
 * Main verification function
 */
export async function verifyProfessor(name, university, db, geminiApiKey) {
  // Get professor from Firestore
  const firestoreProfessor = await getProfessorFromFirestore(db, name, university);
  
  // Extract research information
  let researchArea = null;
  let publications = [];
  let keywords = [];
  
  if (firestoreProfessor) {
    researchArea = firestoreProfessor.researchArea || firestoreProfessor.primaryResearchArea;
    
    // Get publications
    if (firestoreProfessor.publications) {
      publications = Array.isArray(firestoreProfessor.publications) 
        ? firestoreProfessor.publications 
        : [firestoreProfessor.publications];
    } else if (firestoreProfessor.papers) {
      publications = Array.isArray(firestoreProfessor.papers)
        ? firestoreProfessor.papers
        : [firestoreProfessor.papers];
    } else if (firestoreProfessor.pubTitle) {
      publications = [{
        title: firestoreProfessor.pubTitle,
        year: firestoreProfessor.pubYear,
        journal: firestoreProfessor.pubJournal
      }];
    }
    
    // Get keywords
    if (firestoreProfessor.keywords) {
      keywords = Array.isArray(firestoreProfessor.keywords)
        ? firestoreProfessor.keywords
        : firestoreProfessor.keywords.split(',').map(k => k.trim());
    }
  }
  
  // Check if university is valid
  const universityIsValid = university && !['professor', 'of computer', 'teacher'].some(word =>
    university.toLowerCase().includes(word)
  );
  
  // Fetch evidence from external sources
  const wiki = await fetchWikipediaSummary(name, universityIsValid ? university : '');
  const s2 = await fetchSemanticScholar(name, researchArea, universityIsValid ? university : null);
  
  // Build DuckDuckGo query
  let ddgQuery = researchArea ? `${name} ${researchArea}` : name;
  if (universityIsValid) {
    ddgQuery = `${ddgQuery} ${university}`;
  }
  if (publications.length > 0) {
    const pubTitles = publications.slice(0, 2).map(p => 
      typeof p === 'object' ? (p.title || String(p)) : String(p)
    );
    ddgQuery = `${ddgQuery} ${pubTitles.join(' ')}`;
  }
  ddgQuery += ' research publications papers';
  
  const ddgLinks = await searchDuckDuckGo(ddgQuery, true);
  
  // Combine evidence links
  const evidenceLinks = [];
  for (const link of [...wiki.links, ...s2.links, ...ddgLinks]) {
    if (link && !evidenceLinks.includes(link)) {
      evidenceLinks.push(link);
    }
  }
  
  // Build context
  let firestoreContext = '';
  let publicationsContext = '';
  
  if (firestoreProfessor) {
    firestoreContext = `
Existing Profile in Database:
Name: ${firestoreProfessor.name || name}
University: ${firestoreProfessor.university || university}
Department: ${firestoreProfessor.department || 'N/A'}
Research Area: ${researchArea || 'N/A'}
Title: ${firestoreProfessor.title || 'N/A'}
`;
    
    if (keywords.length > 0) {
      firestoreContext += `Keywords: ${keywords.slice(0, 5).join(', ')}\n`;
    }
    
    if (publications.length > 0) {
      publicationsContext = '\nPublications from Profile:\n';
      for (const pub of publications.slice(0, 5)) {
        if (typeof pub === 'object') {
          const title = pub.title || pub.pubTitle || 'N/A';
          const year = pub.year || pub.pubYear || '';
          const journal = pub.journal || pub.pubJournal || '';
          const authors = pub.authors || pub.pubAuthors || '';
          let pubStr = `- ${title}`;
          if (year && year !== 'N/A') pubStr += ` (${year})`;
          if (journal) pubStr += ` - ${journal}`;
          if (authors) pubStr += ` | Authors: ${authors}`;
          publicationsContext += pubStr + '\n';
        } else {
          publicationsContext += `- ${String(pub)}\n`;
        }
      }
      publicationsContext += '\n';
    }
  }
  
  const compiledContext = `Name: ${name}\nUniversity: ${university}\n${firestoreContext}${publicationsContext}
Wikipedia:
${wiki.text || '[none]'}

Semantic Scholar (Research Publications):
${s2.text || '[none]'}

Top Evidence Links:
${evidenceLinks.slice(0, 15).join('\n')}`;
  
  const instruction = `You are verifying whether a person is a real and active professor based on their RESEARCH PUBLICATIONS and academic profile. 
Focus on: 1) Research publications found in Semantic Scholar or profile, 2) Academic affiliations matching the university, 
3) Research area consistency, 4) Evidence of active research work. 
Prioritize verification based on PUBLICATION RECORD and research activity over general web presence. 
Return STRICT JSON with keys: verified (bool), confidence_score (0-100), summary (string explaining verification based on research/publications).`;
  
  const prompt = `${instruction}\n\nCONTEXT\n-----\n${compiledContext}\n\n
JSON ONLY RESPONSE EXAMPLE:
{
  "verified": true,
  "confidence_score": 87,
  "summary": "Professor is active in AI research at MIT with recent publications."
}`;
  
  // Try Gemini AI verification
  console.log(`🤖 Calling Gemini API for verification... ${geminiApiKey ? 'API key present' : 'No API key'}`);
  const aiJson = await callGemini(prompt, geminiApiKey);
  
  if (aiJson) {
    console.log('✅ Gemini AI verification successful');
    const verified = Boolean(aiJson.verified || false);
    const score = Math.max(0, Math.min(100, parseInt(aiJson.confidence_score) || 0));
    const summary = String(aiJson.summary || '');
    
    return {
      verified,
      confidence_score: score,
      evidence_links: evidenceLinks.slice(0, 10),
      summary
    };
  } else {
    console.log('⚠️ Gemini AI verification failed or returned null, using heuristic fallback');
  }
  
  // Fallback heuristic
  let score = 0;
  let researchBonus = 0;
  
  if (publications.length > 0) {
    researchBonus += 30;
    if (publications.length >= 2) {
      researchBonus += 10;
    }
  }
  
  if (researchArea) {
    researchBonus += 10;
  }
  
  if (s2.text) {
    if (s2.text.toLowerCase().includes('papers:') || s2.text.toLowerCase().includes('publications:')) {
      score += 50;
    } else {
      score += 30;
    }
  }
  
  if (wiki.text) {
    score += 20;
  }
  
  const researchLinks = evidenceLinks.filter(link =>
    ['scholar', 'arxiv', 'researchgate', 'pubmed', 'semanticscholar', 'dblp', 'acm', 'ieee'].some(site =>
      link.toLowerCase().includes(site)
    )
  );
  
  if (researchLinks.length > 0) {
    score += Math.min(20, researchLinks.length * 5);
  }
  
  score += researchBonus;
  score = Math.max(0, Math.min(100, score));
  const verified = score >= 60;
  
  const summaryParts = [];
  if (publications.length > 0) {
    summaryParts.push(`Found ${publications.length} publication(s) in profile`);
  }
  if (researchArea) {
    summaryParts.push(`Research area: ${researchArea}`);
  }
  if (researchLinks.length > 0) {
    summaryParts.push(`Found ${researchLinks.length} research-related evidence links`);
  }
  if (s2.text) {
    summaryParts.push('Semantic Scholar author profile found');
  }
  
  let summary = 'Heuristic result (no AI key). ';
  if (summaryParts.length > 0) {
    summary += summaryParts.join(' | ') + '. ';
  }
  summary += verified 
    ? 'Likely professor based on research activity.' 
    : 'Limited evidence of research activity.';
  
  return {
    verified,
    confidence_score: score,
    evidence_links: evidenceLinks.slice(0, 10),
    summary
  };
}

