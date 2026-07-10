import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    ArrowPathIcon,
    ChartBarIcon,
    CheckCircleIcon,
    CheckIcon,
    ClipboardDocumentIcon,
    ClockIcon,
    DocumentArrowUpIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    SparklesIcon,
    UserCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const initialForm = {
    candidateName: '',
    role: '',
    experience: '',
    skills: '',
    targetCompany: '',
    recruiterName: '',
    jobDescription: '',
    tone: 'Confident and professional',
    prompt: ''
};

const toneOptions = [
    { label: 'Confident and professional', color: 'from-sky-500 to-blue-600', soft: 'bg-sky-50 text-sky-800 border-sky-200' },
    { label: 'Warm and conversational', color: 'from-rose-500 to-pink-600', soft: 'bg-rose-50 text-rose-800 border-rose-200' },
    { label: 'Direct and concise', color: 'from-amber-500 to-orange-600', soft: 'bg-amber-50 text-amber-800 border-amber-200' },
    { label: 'Senior and impact-focused', color: 'from-violet-500 to-indigo-600', soft: 'bg-violet-50 text-violet-800 border-violet-200' },
    { label: 'Friendly referral-style', color: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
];

const atsRanges = [
    { label: 'Poor', range: '0-49', min: 0, color: 'text-red-700 bg-red-50 border-red-100', bar: 'bg-red-500' },
    { label: 'Average', range: '50-69', min: 50, color: 'text-amber-700 bg-amber-50 border-amber-100', bar: 'bg-amber-500' },
    { label: 'Good', range: '70-84', min: 70, color: 'text-sky-700 bg-sky-50 border-sky-100', bar: 'bg-sky-500' },
    { label: 'Excellent', range: '85-100', min: 85, color: 'text-emerald-700 bg-emerald-50 border-emerald-100', bar: 'bg-emerald-500' }
];

const getAtsRange = (score) => {
    if (typeof score !== 'number') return null;
    return [...atsRanges].reverse().find((range) => score >= range.min) || atsRanges[0];
};

const getApiErrorMessage = (error, fallback) => (
    error.response?.data?.message
    || error.response?.data?.error
    || error.message
    || fallback
);

const getVariants = (result) => {
    if (!result) return [];
    if (Array.isArray(result.toneVariants) && result.toneVariants.length) return result.toneVariants;
    return [{
        tone: 'Generated',
        subject: result.subject,
        emailBody: result.emailBody,
        linkedInDM: result.linkedInDM,
        followUpEmail: result.followUpEmail,
        score: 85
    }];
};

const Field = ({ label, field, value, onChange, placeholder }) => (
    <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <input
            value={value}
            onChange={(event) => onChange(field, event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
            placeholder={placeholder}
        />
    </label>
);

const formatVariantPack = (variant) => [
    `Tone: ${variant.tone}`,
    `Subject: ${variant.subject}`,
    '',
    'Cold Email:',
    variant.emailBody,
    '',
    'LinkedIn DM:',
    variant.linkedInDM,
    '',
    'Follow-up Email:',
    variant.followUpEmail
].join('\n');

const AtsScoreGraph = ({ score = 0, range }) => {
    const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
    const circumference = 2 * Math.PI * 44;
    const offset = circumference - (safeScore / 100) * circumference;
    const bars = [42, 58, 76, safeScore];

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-32 w-32">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="44" fill="none" stroke="rgb(30 41 59)" strokeWidth="12" />
                    <circle
                        cx="60"
                        cy="60"
                        r="44"
                        fill="none"
                        stroke="url(#atsGradient)"
                        strokeLinecap="round"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                    <defs>
                        <linearGradient id="atsGradient" x1="0" x2="1" y1="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="55%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                        <p className="text-3xl font-semibold text-slate-50">{safeScore}</p>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ATS</p>
                    </div>
                </div>
            </div>
            <div className="w-full min-w-0">
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-50">Resume match graph</span>
                    {range && <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${range.color}`}>{range.label}</span>}
                </div>
                <div className="grid h-28 grid-cols-4 items-end gap-3 rounded-lg border border-slate-700 bg-slate-950 p-3">
                    {bars.map((value, index) => (
                        <div key={`${value}-${index}`} className="flex h-full flex-col justify-end gap-2">
                            <div
                                className={`rounded-t-md ${index === 3 ? 'bg-gradient-to-t from-emerald-500 to-cyan-300' : 'bg-slate-700'}`}
                                style={{ height: `${Math.max(12, value)}%` }}
                            />
                            <span className="text-center text-[10px] font-semibold text-slate-500">{['Base', 'Skills', 'JD', 'You'][index]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { logout } = useAuth();
    const [mode, setMode] = useState('generate');
    const [form, setForm] = useState(initialForm);
    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [atsOnlyResult, setAtsOnlyResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [selectedToneIndex, setSelectedToneIndex] = useState(0);
    const [copied, setCopied] = useState('');

    const variants = useMemo(() => getVariants(result), [result]);
    const selectedVariant = variants[selectedToneIndex] || variants[0];
    const visibleAts = mode === 'ats' ? atsOnlyResult : result;
    const atsRange = getAtsRange(visibleAts?.atsScore);
    const canGenerate = form.candidateName.trim() && (form.role.trim() || form.prompt.trim() || resume);
    const canCheckAts = Boolean(resume);
    const selectedToneMeta = toneOptions.find((tone) => tone.label === form.tone) || toneOptions[0];

    const readiness = useMemo(() => {
        const done = [
            form.candidateName.trim(),
            form.role.trim(),
            form.experience.trim(),
            form.skills.trim(),
            form.targetCompany.trim() || form.jobDescription.trim(),
            resume
        ].filter(Boolean).length;
        return Math.round((done / 6) * 100);
    }, [form, resume]);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleAuthError = (message, status) => {
        if (message === 'User not found' || status === 401) {
            logout();
            toast.error('Session mismatch hai. Please signup/login karke dobara try karo.');
            return true;
        }
        return false;
    };

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const { data } = await api.get('/ai/history');
            setHistory(Array.isArray(data) ? data.slice(0, 5) : []);
        } catch (error) {
            const message = getApiErrorMessage(error, 'History load failed');
            if (!handleAuthError(message, error.response?.status)) toast.error(message);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleResumeChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a PDF, DOCX, or TXT resume.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Resume must be under 5MB.');
            event.target.value = '';
            return;
        }

        setResume(file);
        setAtsOnlyResult(null);
    };

    const buildPayload = () => {
        const payload = new FormData();
        Object.entries(form).forEach(([key, value]) => payload.append(key, value));
        if (resume) payload.append('resume', resume);
        return payload;
    };

    const handleGenerate = async (event) => {
        event.preventDefault();
        if (!canGenerate) {
            toast.error('Candidate name required hai, phir role/prompt ya resume add karo.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/ai/generate-email', buildPayload());
            setResult(data);
            setAtsOnlyResult(null);
            setMode('generate');
            setSelectedToneIndex(0);
            setHistory((current) => [data, ...current.filter((item) => item._id !== data._id)].slice(0, 5));
            toast.success('Mail pack generated!');
        } catch (error) {
            const message = getApiErrorMessage(error, 'Failed to generate. Please try again.');
            if (!handleAuthError(message, error.response?.status)) toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAts = async () => {
        if (!canCheckAts) {
            toast.error('ATS check ke liye resume upload karo.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/ai/check-ats', buildPayload());
            setAtsOnlyResult(data);
            setMode('ats');
            toast.success('ATS score checked!');
        } catch (error) {
            const message = getApiErrorMessage(error, 'Failed to check ATS score.');
            if (!handleAuthError(message, error.response?.status)) toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text || '');
        setCopied(type);
        toast.success('Copied!');
        setTimeout(() => setCopied(''), 2000);
    };

    const loadHistoryItem = (item) => {
        setMode('generate');
        setResult(item);
        setAtsOnlyResult(null);
        setSelectedToneIndex(0);
        toast.success('Old campaign loaded.');
    };

    const ResultCard = ({ title, content, type, icon: Icon }) => (
        <div className="rounded-lg border border-slate-700/80 bg-slate-900/85 p-5 shadow-sm shadow-black/20 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <div className="grid h-8 w-8 place-items-center rounded-md bg-cyan-400/10 text-cyan-300">
                            <Icon className="h-4 w-4" />
                        </div>
                    )}
                    <h3 className="font-semibold text-slate-50">{title}</h3>
                </div>
                <button
                    onClick={() => copyToClipboard(content, type)}
                    className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                    title={`Copy ${title}`}
                    type="button"
                >
                    {copied === type ? <CheckIcon className="h-5 w-5 text-emerald-500" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
                </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{content}</p>
        </div>
    );

    return (
        <div className="mx-auto max-w-[1480px] pb-12">
            <div className="mb-5 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-slate-950/20">
                <div className="h-1.5 bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500" />
                <div className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-300">AI Cold Outreach Suite</p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-50">Cold mail, resume ATS, and follow-up in one clean workspace</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Fill details manually or upload resume. Generate 5 polished outreach tones and check ATS without leaving the screen.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">
                            <p className="text-xs text-cyan-300">Tones</p>
                            <p className="text-sm font-semibold text-slate-50">5 variants</p>
                        </div>
                        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
                            <p className="text-xs text-emerald-300">ATS</p>
                            <p className="text-sm font-semibold text-slate-50">Instant score</p>
                        </div>
                    </div>
                </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(420px,0.95fr)_minmax(560px,1.05fr)]">
                <section className="rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-slate-950/20">
                    <div className={`h-1 bg-gradient-to-r ${selectedToneMeta.color}`} />
                    <div className="border-b border-slate-800 bg-slate-900 px-6 py-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${selectedToneMeta.color} text-white shadow-sm`}>
                                    <UserCircleIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-50">Input Workbench</h2>
                                    <p className="text-sm text-slate-400">Manual bhar sakte ho, ya sirf resume upload karo.</p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-right shadow-inner">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready</p>
                                <p className="text-lg font-semibold text-slate-50">{readiness}%</p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-slate-700 bg-slate-950/60 p-1 shadow-inner">
                            <button
                                type="button"
                                onClick={() => setMode('generate')}
                                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${mode === 'generate' ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                            >
                                Generate Mail
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('ats')}
                                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${mode === 'ats' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                            >
                                Check ATS
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleGenerate} className="space-y-5 bg-slate-950 p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Candidate name *" field="candidateName" value={form.candidateName} onChange={updateField} placeholder="Your full name" />
                            <Field label="Role" field="role" value={form.role} onChange={updateField} placeholder="Backend Engineer" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Experience" field="experience" value={form.experience} onChange={updateField} placeholder="2 years / Fresher" />
                            <Field label="Skills" field="skills" value={form.skills} onChange={updateField} placeholder="Node.js, React, MongoDB, DSA" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Company or team" field="targetCompany" value={form.targetCompany} onChange={updateField} placeholder="Fintech startup" />
                            <Field label="Recruiter name" field="recruiterName" value={form.recruiterName} onChange={updateField} placeholder="Optional" />
                        </div>

                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tone style</span>
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {toneOptions.map((tone) => (
                                    <button
                                        key={tone.label}
                                        type="button"
                                        onClick={() => updateField('tone', tone.label)}
                                        className={`rounded-md border px-3 py-2.5 text-left text-sm font-medium transition ${
                                            form.tone === tone.label
                                                ? `${tone.soft} shadow-sm`
                                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className={`mb-2 block h-1 w-10 rounded-full bg-gradient-to-r ${tone.color}`} />
                                        {tone.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">JD / hiring context</span>
                            <textarea
                                value={form.jobDescription}
                                onChange={(event) => updateField('jobDescription', event.target.value)}
                                rows={4}
                                className="mt-2 w-full resize-none rounded-md border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                                placeholder="Paste JD or company context. Optional but improves mail and ATS."
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Extra instruction</span>
                            <textarea
                                value={form.prompt}
                                onChange={(event) => updateField('prompt', event.target.value)}
                                rows={3}
                                className="mt-2 w-full resize-none rounded-md border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                                placeholder="Shorter mail, referral ask, mention project, etc."
                            />
                        </label>

                        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                            <div className="flex items-start gap-3">
                                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-md bg-gradient-to-br from-sky-600 to-emerald-600 text-white shadow-sm">
                                    <DocumentArrowUpIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-50">Resume upload</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-400">Manual fields skip karne hain to resume upload karo. PDF, DOCX, TXT up to 5MB.</p>
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.txt"
                                        onChange={handleResumeChange}
                                        className="mt-3 block w-full text-sm text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-700"
                                    />
                                    {resume && (
                                        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-slate-700 bg-slate-950 px-3 py-2">
                                            <span className="truncate text-sm font-medium text-slate-300">{resume.name}</span>
                                            <button type="button" onClick={() => setResume(null)} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-red-500/10 hover:text-red-300">
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="submit"
                                disabled={loading || !canGenerate}
                                className="flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-sky-700 to-blue-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:from-sky-800 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading && mode === 'generate' ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
                                Generate Mail
                            </button>
                            <button
                                type="button"
                                disabled={loading || !canCheckAts}
                                onClick={handleCheckAts}
                                className="flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading && mode === 'ats' ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ChartBarIcon className="h-5 w-5" />}
                                Check ATS Only
                            </button>
                        </div>
                    </form>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-slate-950/20">
                    <div className="h-1 bg-gradient-to-r from-violet-500 via-sky-500 to-emerald-500" />
                    <div className="border-b border-slate-800 bg-slate-900 px-6 py-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${mode === 'ats' ? 'from-emerald-600 to-teal-600' : selectedToneMeta.color} text-white shadow-sm`}>
                                    {mode === 'ats' ? <ChartBarIcon className="h-5 w-5" /> : <EnvelopeIcon className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-50">{mode === 'ats' ? 'ATS Report' : 'Response Preview'}</h2>
                                    <p className="text-sm text-slate-400">Output, copy actions, aur recent mails yahin rahenge.</p>
                                </div>
                            </div>
                            {selectedVariant && mode === 'generate' && (
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(formatVariantPack(selectedVariant), 'full-pack')}
                                    className="inline-flex items-center justify-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
                                >
                                    {copied === 'full-pack' ? <CheckIcon className="h-4 w-4 text-emerald-500" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                                    Copy full pack
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-950 p-5 pb-10">
                        {visibleAts?.atsScore && (
                            <div className="mb-5 rounded-lg border border-slate-700/80 bg-slate-900/85 p-5 shadow-sm shadow-black/20 backdrop-blur">
                                <AtsScoreGraph score={visibleAts.atsScore} range={atsRange} />
                                {visibleAts.atsFeedback?.length > 0 && (
                                    <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2">
                                        {visibleAts.atsFeedback.map((item) => (
                                            <p key={item} className="rounded-md bg-cyan-400/10 px-3 py-2 text-xs leading-5 text-cyan-100">{item}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'generate' && selectedVariant ? (
                            <div className="space-y-4">
                                <div className="rounded-lg border border-slate-700/80 bg-slate-900/85 p-4 shadow-sm shadow-black/20 backdrop-blur">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-50">Tone variants</p>
                                        <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">5 versions</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                                        {variants.map((variant, index) => (
                                            <button
                                                key={variant.tone}
                                                type="button"
                                                onClick={() => setSelectedToneIndex(index)}
                                                className={`rounded-md border p-3 text-left transition ${selectedToneIndex === index ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-50 shadow-sm' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600 hover:bg-slate-800'}`}
                                            >
                                                <span className={`mb-2 block h-1 w-8 rounded-full bg-gradient-to-r ${toneOptions[index]?.color || 'from-sky-500 to-blue-600'}`} />
                                                <p className="text-sm font-semibold">{variant.tone}</p>
                                                <p className="mt-1 text-xs text-slate-500">Score {variant.score || 85}/100</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <ResultCard title="Subject Line" icon={EnvelopeIcon} content={selectedVariant.subject} type={`subject-${selectedToneIndex}`} />
                                <ResultCard title="Cold Email" icon={DocumentTextIcon} content={selectedVariant.emailBody} type={`email-${selectedToneIndex}`} />
                                <ResultCard title="LinkedIn DM" icon={UserCircleIcon} content={selectedVariant.linkedInDM} type={`linkedin-${selectedToneIndex}`} />
                                <ResultCard title="Follow-up Email" icon={ClockIcon} content={selectedVariant.followUpEmail} type={`followup-${selectedToneIndex}`} />
                            </div>
                        ) : mode === 'ats' && atsOnlyResult ? (
                            <div className="rounded-lg border border-slate-700/80 bg-slate-900/85 p-8 text-center shadow-sm shadow-black/20 backdrop-blur">
                                <CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-600" />
                                <h3 className="mt-4 text-lg font-semibold text-slate-50">ATS check complete</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Feedback upar diya hai. Resume improve karke phir Generate Mail se cold outreach bana sakte ho.</p>
                            </div>
                        ) : (
                            <div className="flex min-h-[420px] flex-col justify-center rounded-lg border border-slate-700/80 bg-slate-900/85 px-8 text-center shadow-sm shadow-black/20 backdrop-blur">
                                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cyan-400/10">
                                    <EnvelopeIcon className="h-8 w-8 text-cyan-300" />
                                </div>
                                <h3 className="mt-5 text-xl font-semibold text-slate-50">Response yahan preview hoga</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Mail generate karo ya ATS check chalao. Right panel clean output ke liye reserved hai.</p>
                            </div>
                        )}

                        <div className="mt-5 mb-4 rounded-lg border border-slate-700/80 bg-slate-900/85 p-5 shadow-sm shadow-black/20 backdrop-blur">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-50">Recent 5 emails</h3>
                                    <p className="text-sm text-slate-400">Purane campaigns quick reopen ke liye.</p>
                                </div>
                                <button type="button" onClick={loadHistory} className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-cyan-300">
                                    <ArrowPathIcon className={`h-5 w-5 ${historyLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
                                {historyLoading ? (
                                    <div className="rounded-md bg-slate-950 p-4 text-sm text-slate-400 lg:col-span-5">Loading history...</div>
                                ) : history.length ? history.map((item) => (
                                    <button key={item._id} type="button" onClick={() => loadHistoryItem(item)} className="rounded-md border border-slate-700 bg-slate-950 p-3 text-left transition hover:border-cyan-400/40 hover:bg-slate-800">
                                        <ClockIcon className="mb-2 h-4 w-4 text-cyan-300" />
                                        <p className="truncate text-sm font-semibold text-slate-100">{item.subject}</p>
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.emailBody}</p>
                                    </button>
                                )) : (
                                    <div className="rounded-md bg-slate-950 p-4 text-sm text-slate-400 lg:col-span-5">Generate first mail and old emails will appear here.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
