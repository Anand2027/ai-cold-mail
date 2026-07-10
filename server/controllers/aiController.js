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

const inferCandidateName = (resumeText = '') => {
  const firstLines = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);

  const nameLine = firstLines.find((line) => (
    /^[A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+){1,3}$/.test(line)
    && !/(resume|curriculum|email|phone|linkedin|github|developer|engineer|student)/i.test(line)
  ));

  return nameLine || '';
};

const formatColdEmailBody = (body = '', candidateRole = 'Software Engineer', candidateName = '') => {
  const closingName = candidateName.trim() || `Candidate - ${candidateRole}`;
  const cleanedBody = body
    .replace(/thank you,?/gi, '')
    .replace(/best regards,?/gi, '')
    .replace(/regards,?/gi, '')
    .replace(/candidate\s*-?.*$/gim, '')
    .trim();

  const paragraphs = cleanedBody
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return [
    ...paragraphs.slice(0, 3),
    'Regards,',
    closingName
  ].join('\n\n');
};

// FIXED: Upgraded local fallback to generate a robust, superb 3-paragraph email by default
const buildLocalToneVariants = ({ role, experience, skills, targetCompany, recruiterName, jobDescription, prompt, candidateName = '' }) => {
  const candidateRole = role.trim() || 'Software Engineer';
  const cleanCandidateName = candidateName.trim();
  const candidateExperience = experience.trim() || '2+ years of production experience';
  const candidateSkills = skills.trim() || 'backend systems, API optimization, and scalable features';
  const company = targetCompany.trim() || 'your team';
  const recruiter = recruiterName.trim() || 'Hiring Team';
  const context = jobDescription.trim() || prompt.trim() || 'building reliable, scalable infrastructure';

  const openers = {
    'Confident and professional': `Hi ${recruiter},\n\nI noticed ${company} has been scaling engineering capacity, specifically regarding your work with ${context}. With technical requirements moving quickly to hit key goals, onboarding developers who can execute independently is critical.`,
    'Warm and conversational': `Hi ${recruiter},\n\nI came across ${company}’s recent updates surrounding ${context} and your engineering workflow genuinely stood out. It looks like an incredibly dynamic environment for building high-quality, impactful features.`,
    'Direct and concise': `Hi ${recruiter},\n\nI am reaching out regarding upcoming ${candidateRole} opportunities on your team at ${company}, specifically supporting technical initiatives focused on ${context}.`,
    'Senior and impact-focused': `Hi ${recruiter},\n\n${company}’s recent growth and push into ${context} demands a software engineering framework focused on high availability, performance, and strong structural execution.`,
    'Friendly referral-style': `Hi ${recruiter},\n\nI wanted to quickly introduce myself. I’ve been following ${company}’s engineering growth in the ${context} space and wanted to check for alignment with your current talent needs.`
  };

  return TONE_OPTIONS.map((toneName, index) => ({
    tone: toneName,
    subject: `${candidateRole} with expertise in ${candidateSkills}`.slice(0, 80),
    emailBody: formatColdEmailBody(`${openers[toneName]}\n\nI bring robust experience specializing in ${candidateSkills}. In my previous engineering roles, I focused on shipping clean production-level code, writing reliable APIs, and resolving architectural bottlenecks without heavy oversight. I am comfortable translating abstract requirements into concrete, scalable code changes that improve delivery speed and product stability.\n\nIf your team is currently looking to accelerate delivery timelines or strengthen platform performance, I would welcome the chance to discuss how my background fits your roadmap. Would you be open to a brief 10-minute conversation this week?`, candidateRole, cleanCandidateName),
    linkedInDM: `Hi ${recruiter}, I am exploring ${candidateRole} roles at ${company}. I bring ${candidateExperience} across ${candidateSkills}. Would it be okay if I shared my resume for a relevant opening?`,
    followUpEmail: `Hi ${recruiter}, following up on my note about ${candidateRole} opportunities at ${company}. My background in ${candidateSkills} could be useful for teams working on ${context}. Happy to share more details or a short project summary if helpful.`,
    score: 95 - index
  }));
};

const inferInterviewFocus = (resumeText = '', role = '') => {
  const normalized = normalizeText(`${resumeText} ${role}`);
  const skillMap = [
    ['React', ['react', 'jsx', 'redux', 'frontend']],
    ['Node.js', ['node', 'express', 'api', 'backend']],
    ['MongoDB', ['mongodb', 'mongoose', 'database']],
    ['JavaScript', ['javascript', 'typescript', 'es6']],
    ['Python', ['python', 'django', 'flask']],
    ['SQL', ['sql', 'mysql', 'postgresql']],
    ['System Design', ['scalable', 'microservice', 'architecture', 'system design']],
    ['DSA', ['algorithm', 'data structure', 'leetcode']]
  ];

  const matched = skillMap
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([label]) => label);

  return matched.length ? matched.slice(0, 5) : ['Projects', 'Problem solving', 'Communication', 'Role fundamentals'];
};

const buildLocalInterviewPrep = ({ resumeText, role }) => {
  const candidateRole = role.trim() || 'Software Engineer';
  const focusAreas = inferInterviewFocus(resumeText, role);
  const primarySkill = focusAreas[0] || 'your strongest technical skill';
  const secondarySkill = focusAreas[1] || 'project execution';

  const questions = [
    {
      question: `Tell me about yourself for a ${candidateRole} interview.`,
      answer: `Start with your current profile, then connect your strongest projects and skills to the ${candidateRole} role. Mention ${primarySkill}, ${secondarySkill}, and one measurable result from your resume. Keep it under 90 seconds and end by saying what kind of problems you want to solve next.`
    },
    {
      question: `Which project from your resume best proves you are ready for this role?`,
      answer: `Pick the project with the clearest business or technical impact. Explain the problem, your responsibility, the stack used, one hard tradeoff, and the final result. Interviewers like answers that show ownership, debugging ability, and product thinking.`
    },
    {
      question: `How would you explain your experience with ${primarySkill}?`,
      answer: `Give a practical example instead of a definition. Describe where you used ${primarySkill}, why it was needed, how you structured the solution, and what you would improve if you rebuilt it today.`
    },
    {
      question: `What technical challenge did you face and how did you solve it?`,
      answer: `Use the STAR format: situation, task, action, result. Focus on a bug, performance issue, integration problem, or design limitation. Highlight your investigation steps and the decision that fixed the issue.`
    },
    {
      question: `How do you write clean and maintainable code?`,
      answer: `Talk about small functions, readable names, reusable components, validation, error handling, and tests. Add that you prefer reviewing edge cases early and documenting only the parts that are not obvious from the code.`
    },
    {
      question: `How do you handle a feature when requirements are unclear?`,
      answer: `Say that you clarify user goals, define acceptance criteria, identify risks, and build the smallest useful version first. Mention that you keep stakeholders updated and avoid overengineering before the behavior is validated.`
    },
    {
      question: `What are your strengths as a ${candidateRole}?`,
      answer: `Choose two strengths backed by evidence, such as fast learning, debugging, API design, UI implementation, or database modeling. Tie each strength to a resume project or internship experience.`
    },
    {
      question: `What is one weakness you are improving?`,
      answer: `Pick a real but non-fatal weakness, such as estimating complex tasks or speaking up earlier during planning. Explain the system you use to improve it, like breaking tasks into smaller milestones or writing assumptions before coding.`
    },
    {
      question: `Why should we hire you?`,
      answer: `Connect your resume to the team's needs. Mention that you can learn quickly, ship practical features, communicate blockers early, and bring hands-on experience in ${focusAreas.slice(0, 3).join(', ')}.`
    },
    {
      question: `Do you have any questions for us?`,
      answer: `Ask about team goals, current technical challenges, success metrics for the role, code review culture, and the first project a new hire would own. This shows maturity and genuine interest.`
    }
  ];

  const quiz = questions.map((item, index) => {
    const correct = [
      'Use a specific resume example with impact',
      'Give only a memorized definition',
      'Avoid mentioning tradeoffs',
      'Keep the answer unrelated to the role'
    ];

    return {
      question: `Q${index + 1}: Best way to answer "${item.question}"`,
      options: correct,
      answerIndex: 0
    };
  });

  return {
    role: candidateRole,
    focusAreas,
    questions,
    quiz
  };
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
      tone = 'Confident and professional',
      candidateName = ''
    } = req.body;

    if (!prompt && !role && !req.file) {
      return res.status(400).json({ message: 'Add a role, prompt, or resume to generate outreach' });
    }

    const textFields = { prompt, role, experience, skills, targetCompany, recruiterName, jobDescription, tone, candidateName };
    const invalidField = Object.entries(textFields).find(([, value]) => typeof value !== 'string');
    if (invalidField) {
      return res.status(400).json({ message: `${invalidField[0]} must be a string` });
    }

    const totalContextLength = Object.values(textFields).join(' ').length;
    if (totalContextLength > 5000) {
      return res.status(400).json({ message: 'Campaign context cannot exceed 5000 characters' });
    }

    const resumeText = await safeExtractResumeText(req.file);
    const resolvedCandidateName = candidateName.trim() || inferCandidateName(resumeText);
    if (!resolvedCandidateName) {
      return res.status(400).json({ message: 'Candidate name is required' });
    }

    const atsResult = calculateAtsScore({ resumeText, role, skills, experience, jobDescription });

    const groqApiKey = process.env.GROQ_API_KEY;

    // FIXED: Rewrote the system prompt instructions to guarantee 3 lengthy paragraphs even under JSON mode constraints
    const systemPrompt = `You are an expert job outreach copywriter. Your goal is to write a superb, highly detailed, 3-paragraph cold email structure inside a clean JSON output format.

CRITICAL INSTRUCTION FOR emailBody STRING VALUE:
The value inside the "emailBody" property MUST contain exactly 2-3 distinct, detailed paragraphs separated explicitly by dual newline characters (\\n\\n). It must close out with "Regards,\\n[Name/Title]" after one blank line. Do not make it short or direct. Make it rich, professional, and thorough.

Follow this strict layout for the text contents:
- Paragraph 1 (Context hook - 40-50 words): Write a detailed observation regarding the company's business space, hiring trends, engineering scaling bottlenecks, or feature roadmaps, and how your timing aligns with their development needs.
- Paragraph 2 (Deep Value Prop - 70-100 words): Write a thorough overview of your software engineering track record. Detail building backend features, shipping systems architecture, optimizing complex APIs, handling web applications, and writing modular clean code that directly addresses performance or system stability.
- Paragraph 3 (Call to Action - 30-40 words): A professional request for a small conversational slot (10-15 minutes) this week to sync on their engineering goals.
- Closing: Use exactly "Regards,\\n[Candidate Name]" with no extra "Thank you" line.

Output MUST conform entirely to this structural layout:
{
  "subject": "Detailed descriptive subject line matching rules",
  "emailBody": "First deep paragraph here outlining contextual observation trends.\\n\\nSecond thorough paragraph emphasizing technical systems execution, engineering methodologies, optimization metrics, and independent shipping capability.\\n\\nThird paragraph providing a consultative soft close and chat invitation.\\n\\nRegards,\\nCandidate Name",
  "linkedInDM": "Short conversational message",
  "followUpEmail": "Secondary value-add follow up message",
  "toneVariants": [
    {
      "tone": "Confident and professional",
      "subject": "...",
      "emailBody": "...",
      "linkedInDM": "...",
      "followUpEmail": "...",
      "score": 95
    }
  ]
}

Return only valid JSON syntax. No markdown blocks outside the structure.`;
    
    const structuredContext = `
Candidate role: ${role.trim() || 'Software Engineer'}
Experience: ${experience.trim() || 'Production experience'}
Core skills: ${skills.trim() || 'Backend engineering, systems design, full stack development'}
Target company: ${targetCompany.trim() || 'your team'}
Recruiter name: ${recruiterName.trim() || 'Hiring Team'}
Job context: ${jobDescription.trim() || prompt.trim() || 'Building reliable and scalable products'}
Preferred tone: ${tone.trim() || 'Confident and professional'}
Required variants: ${TONE_OPTIONS.join(' | ')}
Resume details: ${resumeText ? resumeText.slice(0, 2500) : 'None provided'}
Candidate name for closing: ${resolvedCandidateName}
`;

    let parsedResponse;

    try {
      if (!groqApiKey) {
        throw new Error('AI service key process.env.GROQ_API_KEY is not configured');
      }

      const fullPrompt = `${systemPrompt}\n\nCAMPAIGN INPUT CONTEXT:\n${structuredContext}\n\nTask: Generate the preferred tone data along with ALL 5 explicit tone variants inside the toneVariants array. Ensure every emailBody value is written in a detailed 2-3 paragraph format with a clean Regards closing.`;
      
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
          response_format: { type: "json_object" },
          temperature: 0.6,
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
        throw new Error('Invalid response payload from Groq API endpoints');
      }

      const generatedText = aiResponse.data.choices[0].message.content;
      parsedResponse = JSON.parse(generatedText);
    } catch (aiError) {
      // CRITICAL: Logging the exact failure reason to terminal so you can check why Groq broke
      console.error('--- GROQ API ERROR REASON ---');
      console.error(aiError.response?.data || aiError.message);
      console.error('--- SWITCHING TO HIGH QUALITY 3-PARA LOCAL BACKEND ENGINE ---');

      const fallbackVariants = buildLocalToneVariants({ role, experience, skills, targetCompany, recruiterName, jobDescription, prompt, candidateName: resolvedCandidateName });
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
            subject: variant.subject || parsedResponse.subject || 'New Engineering Opportunity',
            emailBody: formatColdEmailBody(variant.emailBody || parsedResponse.emailBody || '', role.trim() || 'Software Engineer', resolvedCandidateName),
            linkedInDM: variant.linkedInDM || parsedResponse.linkedInDM || '',
            followUpEmail: variant.followUpEmail || parsedResponse.followUpEmail || '',
            score: Number.isFinite(Number(variant.score)) ? Math.max(1, Math.min(100, Number(variant.score))) : 90
          };
        })
      : TONE_OPTIONS.map((toneName) => ({
          tone: toneName,
          subject: parsedResponse.subject || 'New Engineering Opportunity',
          emailBody: formatColdEmailBody(parsedResponse.emailBody || '', role.trim() || 'Software Engineer', resolvedCandidateName),
          linkedInDM: parsedResponse.linkedInDM || '',
          followUpEmail: parsedResponse.followUpEmail || '',
          score: 90
        }));

    const preferredVariant = normalizedVariants.find((variant) => normalizeText(variant.tone) === normalizeText(tone)) || normalizedVariants[0];

    const emailData = {
      subject: parsedResponse.subject || preferredVariant.subject || "New Engineering Opportunity",
      emailBody: formatColdEmailBody(parsedResponse.emailBody || preferredVariant.emailBody || "", role.trim() || 'Software Engineer', resolvedCandidateName),
      linkedInDM: parsedResponse.linkedInDM || preferredVariant.linkedInDM || "",
      followUpEmail: parsedResponse.followUpEmail || preferredVariant.followUpEmail || "",
      toneVariants: normalizedVariants
    };

    if (!emailData.subject || !emailData.emailBody) {
      return res.status(500).json({ 
        message: 'AI generated incomplete email data. Please try again.' 
      });
    }

    const historyPayload = {
      userId: req.user._id,
      prompt: structuredContext.trim(),
      candidateName: resolvedCandidateName,
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
    console.error('AI Generation Error:', detail);
    
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

exports.prepareInterview = async (req, res) => {
  try {
    const { role = '', extraContext = '' } = req.body;

    if (typeof role !== 'string' || typeof extraContext !== 'string') {
      return res.status(400).json({ message: 'Role and extra context must be strings' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Resume is required for interview preparation' });
    }

    const resumeText = await safeExtractResumeText(req.file, { required: true });
    if (!resumeText.trim()) {
      return res.status(400).json({ message: 'Could not read text from this resume' });
    }

    const fallbackPrep = buildLocalInterviewPrep({ resumeText, role });
    const groqApiKey = process.env.GROQ_API_KEY;
    let parsedResponse = fallbackPrep;

    try {
      if (!groqApiKey) {
        throw new Error('AI service key process.env.GROQ_API_KEY is not configured');
      }

      const prompt = `You are an expert technical interview coach.
Create interview preparation from the candidate resume.
Return only valid JSON in this exact shape:
{
  "role": "target role",
  "focusAreas": ["skill 1", "skill 2", "skill 3", "skill 4"],
  "questions": [
    { "question": "interview question", "answer": "strong sample answer tailored to resume" }
  ],
  "quiz": [
    { "question": "quiz question", "options": ["A", "B", "C", "D"], "answerIndex": 0 }
  ]
}
Rules:
- questions must contain 10 interview questions with practical answers.
- quiz must contain 10 related quiz questions.
- answerIndex must be 0, 1, 2, or 3.
- Keep answers concise but useful.

Target role: ${role.trim() || 'Software Engineer'}
Extra context: ${extraContext.trim() || 'None'}
Resume text: ${resumeText.slice(0, 3500)}`;

      const aiResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          max_tokens: 4096
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      parsedResponse = JSON.parse(aiResponse.data.choices[0].message.content);
    } catch (aiError) {
      console.error('Interview prep AI fallback:', aiError.response?.data || aiError.message);
    }

    const questions = Array.isArray(parsedResponse.questions) && parsedResponse.questions.length
      ? parsedResponse.questions
      : fallbackPrep.questions;
    const quiz = Array.isArray(parsedResponse.quiz) && parsedResponse.quiz.length
      ? parsedResponse.quiz
      : fallbackPrep.quiz;

    res.status(200).json({
      role: parsedResponse.role || fallbackPrep.role,
      focusAreas: Array.isArray(parsedResponse.focusAreas) && parsedResponse.focusAreas.length
        ? parsedResponse.focusAreas.slice(0, 6)
        : fallbackPrep.focusAreas,
      questions: questions.slice(0, 10).map((item, index) => ({
        question: item.question || fallbackPrep.questions[index]?.question || `Interview question ${index + 1}`,
        answer: item.answer || fallbackPrep.questions[index]?.answer || 'Use your resume experience and explain the impact clearly.'
      })),
      quiz: quiz.slice(0, 10).map((item, index) => ({
        question: item.question || fallbackPrep.quiz[index]?.question || `Quiz question ${index + 1}`,
        options: Array.isArray(item.options) && item.options.length === 4 ? item.options : fallbackPrep.quiz[index]?.options,
        answerIndex: Number.isInteger(item.answerIndex) && item.answerIndex >= 0 && item.answerIndex <= 3
          ? item.answerIndex
          : fallbackPrep.quiz[index]?.answerIndex || 0
      }))
    });
  } catch (error) {
    const detail = getErrorMessage(error);
    console.error('Interview Prep Error:', detail);
    res.status(500).json({
      message: `Failed to prepare interview: ${detail}`,
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
