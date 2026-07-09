const axios = require('axios');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const EmailHistory = require('../models/EmailHistory');

const TONE_OPTIONS = [
  'Confident and professional',
  'Warm and conversational',
  'Direct and concise',
  'Senior and impact-focused',
  'Friendly referral-style'
];

const normalizeText = (value = '') => value.toString().toLowerCase().replace(/\s+/g, ' ').trim();

const uniqueList = (value = '') => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .filter((item, index, list) => list.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index);

const buildLocalToneVariants = ({ role, experience, skills, targetCompany, recruiterName, jobDescription, prompt }) => {
  const candidateRole = role.trim() || 'Software Engineer';
  const candidateExperience = experience.trim() || 'hands-on experience';
  const candidateSkills = skills.trim() || 'backend systems, problem solving, and production features';
  const company = targetCompany.trim() || 'your team';
  const recruiter = recruiterName.trim() || 'there';
  const context = jobDescription.trim() || prompt.trim() || 'building reliable, scalable products';

  const openers = {
    'Confident and professional': `Hi ${recruiter}, I noticed ${company} is focused on ${context}.`,
    'Warm and conversational': `Hi ${recruiter}, I came across ${company}'s work around ${context} and it genuinely stood out.`,
    'Direct and concise': `Hi ${recruiter}, I am reaching out for ${candidateRole} opportunities at ${company}.`,
    'Senior and impact-focused': `Hi ${recruiter}, ${company}'s focus on ${context} looks like the kind of environment where strong execution matters.`,
    'Friendly referral-style': `Hi ${recruiter}, I wanted to quickly introduce myself for ${candidateRole} roles at ${company}.`
  };

  return TONE_OPTIONS.map((toneName, index) => ({
    tone: toneName,
    subject: `${candidateRole} with ${candidateExperience}`.slice(0, 80),
    emailBody: `${openers[toneName]}\nTeams hiring for this role usually need someone who can ramp fast, write clean code, and contribute without heavy hand-holding.\nI bring ${candidateExperience} with strengths in ${candidateSkills}.\nI can help with feature delivery, debugging, APIs, and measurable product improvements.\nWould you be open to a quick conversation this week?\nBest,\nCandidate - ${candidateRole}`,
    linkedInDM: `Hi ${recruiter}, I am exploring ${candidateRole} roles at ${company}. I bring ${candidateExperience} across ${candidateSkills}. Would it be okay if I shared my resume for a relevant opening?`,
    followUpEmail: `Hi ${recruiter}, following up on my note about ${candidateRole} opportunities at ${company}. My background in ${candidateSkills} could be useful for teams working on ${context}. Happy to share more details or a short project summary if helpful.`,
    score: 92 - index
  }));
};

const extractResumeText = async (file) => {
  if (!file) return '';

  if (file.mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const data = await parser.getText();
      return data.text || '';
    } finally {
      await parser.destroy();
    }
  }

  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const data = await mammoth.extractRawText({ buffer: file.buffer });
    return data.value || '';
  }

  if (file.mimetype === 'text/plain') {
    return file.buffer.toString('utf8');
  }

  return '';
};

const getErrorMessage = (error) => (
  error.response?.data?.error?.message
  || error.response?.data?.message
  || error.message
  || 'Unknown server error'
);

const safeExtractResumeText = async (file, { required = false } = {}) => {
  try {
    return await extractResumeText(file);
  } catch (error) {
    const message = `Could not read resume text: ${getErrorMessage(error)}`;
    console.error('Resume parse error:', message);
    if (required) throw new Error(message);
    return '';
  }
};

const calculateAtsScore = ({ resumeText, role, skills, experience, jobDescription }) => {
  if (!resumeText) return null;

  const normalizedResume = normalizeText(resumeText);
  const targetSkills = uniqueList(skills);
  const jdKeywords = normalizeText(jobDescription)
    .split(/[^a-z0-9+#.]+/i)
    .filter((word) => word.length > 3)
    .slice(0, 35);

  const keywordPool = [...targetSkills, ...jdKeywords]
    .map((keyword) => normalizeText(keyword))
    .filter(Boolean)
    .filter((keyword, index, list) => list.indexOf(keyword) === index);

  const matchedKeywords = keywordPool.filter((keyword) => normalizedResume.includes(keyword));
  const keywordScore = keywordPool.length ? Math.round((matchedKeywords.length / keywordPool.length) * 45) : 28;
  const roleScore = role && normalizedResume.includes(normalizeText(role).split(' ')[0]) ? 15 : 8;
  const experienceScore = experience && normalizedResume.includes(normalizeText(experience).split(' ')[0]) ? 15 : 9;
  const sectionScore = ['experience', 'project', 'skills', 'education'].reduce(
    (score, section) => score + (normalizedResume.includes(section) ? 5 : 0),
    0
  );
  const contactScore = /[\w.-]+@[\w.-]+\.\w+/.test(resumeText) || /\+?\d[\d\s-]{8,}/.test(resumeText) ? 5 : 0;
  const finalScore = Math.max(35, Math.min(98, keywordScore + roleScore + experienceScore + sectionScore + contactScore));

  const feedback = [];
  if (matchedKeywords.length) {
    feedback.push(`Matched keywords: ${matchedKeywords.slice(0, 8).join(', ')}`);
  }
  const missingKeywords = keywordPool.filter((keyword) => !matchedKeywords.includes(keyword)).slice(0, 6);
  if (missingKeywords.length) {
    feedback.push(`Add missing role keywords: ${missingKeywords.join(', ')}`);
  }
  if (!normalizedResume.includes('project')) feedback.push('Add 1-2 project bullets with measurable impact.');
  if (!normalizedResume.includes('skills')) feedback.push('Add a clear Skills section for better ATS parsing.');
  if (!contactScore) feedback.push('Add email or phone so recruiters can contact you quickly.');

  return {
    score: finalScore,
    feedback: feedback.length ? feedback : ['Resume is aligned well with the selected role.']
  };
};

exports.generateEmail = async (req, res) => {
  try {
    const {
      prompt = '',
      role = '',
      experience = '',
      skills = '',
      targetCompany = '',
      recruiterName = '',
      jobDescription = '',
      tone = 'Confident and professional'
    } = req.body;

    if (!prompt && !role && !req.file) {
      return res.status(400).json({ message: 'Add a role, prompt, or resume to generate outreach' });
    }

    const textFields = { prompt, role, experience, skills, targetCompany, recruiterName, jobDescription, tone };
    const invalidField = Object.entries(textFields).find(([, value]) => typeof value !== 'string');
    if (invalidField) {
      return res.status(400).json({ message: `${invalidField[0]} must be a string` });
    }

    const totalContextLength = Object.values(textFields).join(' ').length;
    if (totalContextLength > 5000) {
      return res.status(400).json({ message: 'Campaign context cannot exceed 5000 characters' });
    }

    const resumeText = await safeExtractResumeText(req.file);
    const atsResult = calculateAtsScore({ resumeText, role, skills, experience, jobDescription });

    // Call Groq API (Free tier - No quota issues!)
    const groqApiKey = process.env.GROQ_API_KEY;

    const systemPrompt = `You are an expert job outreach strategist.

Your task is to generate a HIGH-CONVERTING cold email to a recruiter for a job opportunity.

IMPORTANT:
- Even if the user gives only 2–4 words, assume realistic context.
- Do NOT ask for clarification.
- Make professional assumptions.
- Avoid generic phrases.
- Keep it concise and structured.

====================================================
OUTPUT FORMAT (STRICT)
====================================================

Return ONLY valid JSON:

{
  "subject": "",
  "emailBody": "",
  "linkedInDM": "",
  "followUpEmail": "",
  "toneVariants": [
    {
      "tone": "Confident and professional",
      "subject": "",
      "emailBody": "",
      "linkedInDM": "",
      "followUpEmail": "",
      "score": 0
    }
  ]
}

No markdown.
No explanations.
Only JSON.

====================================================
CONTEXT ASSUMPTIONS
====================================================

Assume:
- Candidate has 2+ years experience
- Strong in DSA and system design
- Has worked on backend APIs or scalable systems
- Has contributed to production-level features
- Actively seeking Software Engineer roles

If prompt is short like:
"SDE role"
"Backend engineer"
"Startup job"
"Product company"

Create intelligent assumptions about:
- Scaling challenges
- Hiring urgency
- Performance or system reliability issues
- Team growth

====================================================
SUBJECT LINE RULES
====================================================

• 6–9 words
• Must sound confident
• No generic phrases like:
  - "Quick question"
  - "Looking for opportunity"
  - "Job application"
• Should highlight value or experience

Example styles:
"Backend engineer with 2+ yrs scaling APIs"
"Engineer focused on scalable system design"
"Software engineer improving system performance"

====================================================
EMAIL BODY STRUCTURE (STRICT)
====================================================

Keep 60–90 words.

Line 1: Personalized observation about hiring  
Line 2: Mention common hiring/scaling challenge  
Line 3-4: Candidate's experience and strengths  
Line 5: Specific impact or contribution  
Line 6: Clear CTA  
Line 7: Sign-off with name and title  

Tone:
• Confident
• Professional
• Not desperate
• No emojis
• No hype words

====================================================
LINKEDIN DM STRUCTURE
====================================================

30–50 words.
Short, conversational.
Observation + value + soft ask.

====================================================
FOLLOW-UP EMAIL STRUCTURE
====================================================

50–80 words.
New angle.
Emphasize long-term value.
Professional urgency.
Clear CTA.

====================================================

Return ONLY valid JSON.`;
    
    const structuredContext = `
Candidate role: ${role.trim() || 'Use smart assumptions'}
Experience: ${experience.trim() || 'Use smart assumptions'}
Core skills: ${skills.trim() || 'Use smart assumptions'}
Target company/team: ${targetCompany.trim() || 'Not specified'}
Recruiter/hiring manager: ${recruiterName.trim() || 'Not specified'}
Job description or hiring context: ${jobDescription.trim() || 'Not specified'}
Preferred tone: ${tone.trim() || 'Confident and professional'}
Required tone variants: ${TONE_OPTIONS.join(' | ')}
Extra request: ${prompt.trim() || 'Generate a strong cold email from the available candidate context'}
Resume highlights: ${resumeText ? resumeText.slice(0, 2500) : 'No resume uploaded'}
ATS score: ${atsResult ? `${atsResult.score}/100` : 'No resume uploaded'}
`;

    let parsedResponse;

    try {
      if (!groqApiKey) {
        throw new Error('AI service is not configured');
      }

      const fullPrompt = `${systemPrompt}\n\nCAMPAIGN CONTEXT:\n${structuredContext}\n\nGenerate ALL 5 tone variants listed in Required tone variants. Each variant must have subject, emailBody, linkedInDM, followUpEmail, and score from 1-100. Put the preferred tone as the top-level subject/emailBody/linkedin/followUp fields too. Return ONLY valid JSON:\n{"subject": "...", "emailBody": "...", "linkedInDM": "...", "followUpEmail": "...", "toneVariants": [{"tone": "Confident and professional", "subject": "...", "emailBody": "...", "linkedInDM": "...", "followUpEmail": "...", "score": 90}]}`;
      const aiResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: fullPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096
        },
        {
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (!aiResponse.data.choices || !aiResponse.data.choices[0] || !aiResponse.data.choices[0].message) {
        throw new Error('Invalid response from Groq API');
      }

      const generatedText = aiResponse.data.choices[0].message.content;
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(generatedText);
    } catch (aiError) {
      console.error('AI fallback used:', aiError.response?.data || aiError.message);
      const fallbackVariants = buildLocalToneVariants({ role, experience, skills, targetCompany, recruiterName, jobDescription, prompt });
      const preferredFallback = fallbackVariants.find((variant) => normalizeText(variant.tone) === normalizeText(tone)) || fallbackVariants[0];
      parsedResponse = {
        subject: preferredFallback.subject,
        emailBody: preferredFallback.emailBody,
        linkedInDM: preferredFallback.linkedInDM,
        followUpEmail: preferredFallback.followUpEmail,
        toneVariants: fallbackVariants
      };
    }

    const normalizedVariants = Array.isArray(parsedResponse.toneVariants)
      ? TONE_OPTIONS.map((toneName) => {
          const variant = parsedResponse.toneVariants.find((item) => normalizeText(item?.tone) === normalizeText(toneName)) || {};
          return {
            tone: toneName,
            subject: variant.subject || parsedResponse.subject || 'New Opportunity',
            emailBody: variant.emailBody || parsedResponse.emailBody || '',
            linkedInDM: variant.linkedInDM || parsedResponse.linkedInDM || '',
            followUpEmail: variant.followUpEmail || parsedResponse.followUpEmail || '',
            score: Number.isFinite(Number(variant.score)) ? Math.max(1, Math.min(100, Number(variant.score))) : 85
          };
        })
      : TONE_OPTIONS.map((toneName) => ({
          tone: toneName,
          subject: parsedResponse.subject || 'New Opportunity',
          emailBody: parsedResponse.emailBody || '',
          linkedInDM: parsedResponse.linkedInDM || '',
          followUpEmail: parsedResponse.followUpEmail || '',
          score: 85
        }));

    const preferredVariant = normalizedVariants.find((variant) => normalizeText(variant.tone) === normalizeText(tone)) || normalizedVariants[0];

    const emailData = {
      subject: parsedResponse.subject || preferredVariant.subject || "New Opportunity",
      emailBody: parsedResponse.emailBody || preferredVariant.emailBody || "",
      linkedInDM: parsedResponse.linkedInDM || preferredVariant.linkedInDM || "",
      followUpEmail: parsedResponse.followUpEmail || preferredVariant.followUpEmail || "",
      toneVariants: normalizedVariants
    };

    // Validate response data
    if (!emailData.subject || !emailData.emailBody) {
      return res.status(500).json({ 
        message: 'AI generated incomplete email data. Please try again.' 
      });
    }

    const historyPayload = {
      userId: req.user._id,
      prompt: structuredContext.trim(),
      subject: emailData.subject,
      emailBody: emailData.emailBody,
      linkedInDM: emailData.linkedInDM,
      followUpEmail: emailData.followUpEmail,
      toneVariants: emailData.toneVariants,
      atsScore: atsResult?.score,
      atsFeedback: atsResult?.feedback || []
    };

    let historyEntry;
    try {
      historyEntry = await EmailHistory.create(historyPayload);
    } catch (historyError) {
      console.error('Email history save failed:', getErrorMessage(historyError));
      historyEntry = {
        ...historyPayload,
        _id: `unsaved-${Date.now()}`,
        createdAt: new Date()
      };
    }

    res.status(200).json(historyEntry);
  } catch (error) {
    const detail = getErrorMessage(error);
    console.error('AI Generation Error:', error.response?.data || detail);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        message: 'Too many requests. Please wait a moment before trying again.',
        error: 'Rate limit exceeded'
      });
    }

    res.status(500).json({ 
      message: `Failed to generate email: ${detail}`,
      error: detail
    });
  }
};

exports.checkAts = async (req, res) => {
  try {
    const {
      role = '',
      experience = '',
      skills = '',
      jobDescription = ''
    } = req.body;

    const textFields = { role, experience, skills, jobDescription };
    const invalidField = Object.entries(textFields).find(([, value]) => typeof value !== 'string');
    if (invalidField) {
      return res.status(400).json({ message: `${invalidField[0]} must be a string` });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Resume is required for ATS check' });
    }

    const resumeText = await safeExtractResumeText(req.file, { required: true });
    if (!resumeText.trim()) {
      return res.status(400).json({ message: 'Could not read text from this resume' });
    }

    const atsResult = calculateAtsScore({ resumeText, role, skills, experience, jobDescription });
    res.status(200).json({
      atsScore: atsResult.score,
      atsFeedback: atsResult.feedback,
      resumeWords: resumeText.split(/\s+/).filter(Boolean).length
    });
  } catch (error) {
    const detail = getErrorMessage(error);
    console.error('ATS Check Error:', detail);
    res.status(500).json({
      message: `Failed to check ATS score: ${detail}`,
      error: detail
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await EmailHistory.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};
