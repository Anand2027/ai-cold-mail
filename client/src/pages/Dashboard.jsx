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
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        <input
            value={value}
            onChange={(event) => onChange(field, event.target.value)}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
    const canGenerate = form.role.trim() || form.prompt.trim() || resume;
    const canCheckAts = Boolean(resume);
    const selectedToneMeta = toneOptions.find((tone) => tone.label === form.tone) || toneOptions[0];

    const readiness = useMemo(() => {
        const done = [
            form.role.trim(),
            form.experience.trim(),
            form.skills.trim(),
            form.targetCompany.trim() || form.jobDescription.trim(),
            resume
        ].filter(Boolean).length;
        return Math.round((done / 5) * 100);
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
            const message = error.response?.data?.message || 'History load failed';
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
            toast.error('Add role/prompt or upload resume.');
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
            const message = error.response?.data?.message || 'Failed to generate. Please try again.';
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
            const message = error.response?.data?.message || 'Failed to check ATS score.';
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
        <div className="rounded-lg border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <div className="grid h-8 w-8 place-items-center rounded-md bg-sky-50 text-sky-600">
                            <Icon className="h-4 w-4" />
                        </div>
                    )}
                    <h3 className="font-semibold text-gray-950">{title}</h3>
                </div>
                <button
                    onClick={() => copyToClipboard(content, type)}
                    className="grid h-8 w-8 place-items-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-sky-600"
                    title={`Copy ${title}`}
                    type="button"
                >
                    {copied === type ? <CheckIcon className="h-5 w-5 text-emerald-500" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
                </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600">{content}</p>
        </div>
    );

    return (
        <div className="mx-auto max-w-[1480px]">
            <div className="mb-5 overflow-hidden rounded-xl border border-white/70 bg-white/75 shadow-sm backdrop-blur">
                <div className="h-1.5 bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500" />
                <div className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-sky-700 to-violet-700">AI Cold Outreach Suite</p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-gray-950">Cold mail, resume ATS, and follow-up in one clean workspace</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Fill details manually or upload resume. Generate 5 polished outreach tones and check ATS without leaving the screen.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                        <div className="rounded-lg border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 px-3 py-2">
                            <p className="text-xs text-sky-600">Tones</p>
                            <p className="text-sm font-semibold text-sky-950">5 variants</p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 px-3 py-2">
                            <p className="text-xs text-emerald-600">ATS</p>
                            <p className="text-sm font-semibold text-emerald-950">Instant score</p>
                        </div>
                    </div>
                </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(420px,0.95fr)_minmax(560px,1.05fr)]">
                <section className="overflow-hidden rounded-xl border border-white/70 bg-white/80 shadow-sm backdrop-blur">
                    <div className={`h-1 bg-gradient-to-r ${selectedToneMeta.color}`} />
                    <div className="border-b border-white/70 bg-gradient-to-br from-white/90 to-sky-50/80 px-6 py-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${selectedToneMeta.color} text-white shadow-sm`}>
                                    <UserCircleIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-950">Input Workbench</h2>
                                    <p className="text-sm text-gray-500">Manual bhar sakte ho, ya sirf resume upload karo.</p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-white/80 bg-white/60 px-3 py-2 text-right shadow-inner">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ready</p>
                                <p className="text-lg font-semibold text-gray-950">{readiness}%</p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-white/80 bg-white/60 p-1 shadow-inner">
                            <button
                                type="button"
                                onClick={() => setMode('generate')}
                                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${mode === 'generate' ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Generate Mail
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('ats')}
                                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${mode === 'ats' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Check ATS
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleGenerate} className="space-y-5 bg-gradient-to-br from-white/70 via-sky-50/50 to-violet-50/40 p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Role" field="role" value={form.role} onChange={updateField} placeholder="Backend Engineer" />
                            <Field label="Experience" field="experience" value={form.experience} onChange={updateField} placeholder="2 years / Fresher" />
                        </div>

                        <Field label="Skills" field="skills" value={form.skills} onChange={updateField} placeholder="Node.js, React, MongoDB, DSA" />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Company or team" field="targetCompany" value={form.targetCompany} onChange={updateField} placeholder="Fintech startup" />
                            <Field label="Recruiter name" field="recruiterName" value={form.recruiterName} onChange={updateField} placeholder="Optional" />
                        </div>

                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tone style</span>
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {toneOptions.map((tone) => (
                                    <button
                                        key={tone.label}
                                        type="button"
                                        onClick={() => updateField('tone', tone.label)}
                                        className={`rounded-md border px-3 py-2.5 text-left text-sm font-medium transition ${
                                            form.tone === tone.label
                                                ? `${tone.soft} shadow-sm`
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className={`mb-2 block h-1 w-10 rounded-full bg-gradient-to-r ${tone.color}`} />
                                        {tone.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">JD / hiring context</span>
                            <textarea
                                value={form.jobDescription}
                                onChange={(event) => updateField('jobDescription', event.target.value)}
                                rows={4}
                                className="mt-2 w-full resize-none rounded-md border border-gray-200 px-3 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                placeholder="Paste JD or company context. Optional but improves mail and ATS."
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Extra instruction</span>
                            <textarea
                                value={form.prompt}
                                onChange={(event) => updateField('prompt', event.target.value)}
                                rows={3}
                                className="mt-2 w-full resize-none rounded-md border border-gray-200 px-3 py-3 text-sm text-gray-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                placeholder="Shorter mail, referral ask, mention project, etc."
                            />
                        </label>

                        <div className="rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4">
                            <div className="flex items-start gap-3">
                                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-md bg-gradient-to-br from-sky-600 to-emerald-600 text-white shadow-sm">
                                    <DocumentArrowUpIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-950">Resume upload</p>
                                    <p className="mt-1 text-xs leading-5 text-gray-600">Manual fields skip karne hain to resume upload karo. PDF, DOCX, TXT up to 5MB.</p>
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.txt"
                                        onChange={handleResumeChange}
                                        className="mt-3 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-sky-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-800"
                                    />
                                    {resume && (
                                        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-sky-100 bg-white/90 px-3 py-2">
                                            <span className="truncate text-sm font-medium text-gray-700">{resume.name}</span>
                                            <button type="button" onClick={() => setResume(null)} className="grid h-7 w-7 place-items-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500">
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

                <section className="overflow-hidden rounded-xl border border-white/70 bg-white/80 shadow-sm backdrop-blur">
                    <div className="h-1 bg-gradient-to-r from-violet-500 via-sky-500 to-emerald-500" />
                    <div className="border-b border-white/70 bg-gradient-to-br from-white/90 to-violet-50/80 px-6 py-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${mode === 'ats' ? 'from-emerald-600 to-teal-600' : selectedToneMeta.color} text-white shadow-sm`}>
                                    {mode === 'ats' ? <ChartBarIcon className="h-5 w-5" /> : <EnvelopeIcon className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-950">{mode === 'ats' ? 'ATS Report' : 'Response Preview'}</h2>
                                    <p className="text-sm text-gray-500">Output, copy actions, aur recent mails yahin rahenge.</p>
                                </div>
                            </div>
                            {selectedVariant && mode === 'generate' && (
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(formatVariantPack(selectedVariant), 'full-pack')}
                                    className="inline-flex items-center justify-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
                                >
                                    {copied === 'full-pack' ? <CheckIcon className="h-4 w-4 text-emerald-500" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                                    Copy full pack
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="h-[calc(100vh-12rem)] min-h-[680px] overflow-y-auto bg-gradient-to-br from-sky-50/80 via-violet-50/60 to-emerald-50/70 p-5">
                        {visibleAts?.atsScore && (
                            <div className="mb-5 rounded-lg border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur">
                                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">ATS Score</p>
                                        <div className="mt-2 flex items-center gap-3">
                                            <p className="text-4xl font-semibold text-gray-950">{visibleAts.atsScore}/100</p>
                                            {atsRange && <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${atsRange.color}`}>{atsRange.label}</span>}
                                        </div>
                                    </div>
                                    <div className="w-full md:max-w-xs">
                                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                                            <div className={`h-full rounded-full ${atsRange?.bar || 'bg-sky-600'}`} style={{ width: `${visibleAts.atsScore}%` }} />
                                        </div>
                                        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] leading-4 text-gray-500">
                                            {atsRanges.map((range) => <span key={range.label}>{range.label}<br />{range.range}</span>)}
                                        </div>
                                    </div>
                                </div>
                                {visibleAts.atsFeedback?.length > 0 && (
                                    <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2">
                                        {visibleAts.atsFeedback.map((item) => (
                                            <p key={item} className="rounded-md bg-sky-50 px-3 py-2 text-xs leading-5 text-sky-800">{item}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'generate' && selectedVariant ? (
                            <div className="space-y-4">
                                <div className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-gray-950">Tone variants</p>
                                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">5 versions</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                                        {variants.map((variant, index) => (
                                            <button
                                                key={variant.tone}
                                                type="button"
                                                onClick={() => setSelectedToneIndex(index)}
                                                className={`rounded-md border p-3 text-left transition ${selectedToneIndex === index ? 'border-sky-300 bg-sky-50 text-sky-900 shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <span className={`mb-2 block h-1 w-8 rounded-full bg-gradient-to-r ${toneOptions[index]?.color || 'from-sky-500 to-blue-600'}`} />
                                                <p className="text-sm font-semibold">{variant.tone}</p>
                                                <p className="mt-1 text-xs text-gray-500">Score {variant.score || 85}/100</p>
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
                            <div className="rounded-lg border border-white/80 bg-white/85 p-8 text-center shadow-sm backdrop-blur">
                                <CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-600" />
                                <h3 className="mt-4 text-lg font-semibold text-gray-950">ATS check complete</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Feedback upar diya hai. Resume improve karke phir Generate Mail se cold outreach bana sakte ho.</p>
                            </div>
                        ) : (
                            <div className="flex min-h-[420px] flex-col justify-center rounded-lg border border-white/80 bg-gradient-to-br from-white/90 via-sky-50/90 to-violet-50/90 px-8 text-center shadow-sm backdrop-blur">
                                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky-50">
                                    <EnvelopeIcon className="h-8 w-8 text-sky-700" />
                                </div>
                                <h3 className="mt-5 text-xl font-semibold text-gray-950">Response yahan preview hoga</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Mail generate karo ya ATS check chalao. Right panel clean output ke liye reserved hai.</p>
                            </div>
                        )}

                        <div className="mt-5 rounded-lg border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-950">Recent 5 emails</h3>
                                    <p className="text-sm text-gray-500">Purane campaigns quick reopen ke liye.</p>
                                </div>
                                <button type="button" onClick={loadHistory} className="grid h-9 w-9 place-items-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-sky-600">
                                    <ArrowPathIcon className={`h-5 w-5 ${historyLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
                                {historyLoading ? (
                                    <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500 lg:col-span-5">Loading history...</div>
                                ) : history.length ? history.map((item) => (
                                    <button key={item._id} type="button" onClick={() => loadHistoryItem(item)} className="rounded-md border border-gray-200 bg-gray-50 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50">
                                        <ClockIcon className="mb-2 h-4 w-4 text-sky-700" />
                                        <p className="truncate text-sm font-semibold text-gray-900">{item.subject}</p>
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{item.emailBody}</p>
                                    </button>
                                )) : (
                                    <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500 lg:col-span-5">Generate first mail and old emails will appear here.</div>
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
