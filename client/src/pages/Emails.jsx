import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    ArrowPathIcon,
    ChartBarIcon,
    CheckIcon,
    ClipboardDocumentIcon,
    ClockIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    MagnifyingGlassIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const atsRanges = [
    { label: 'Poor', min: 0, color: 'text-red-700 bg-red-50 border-red-100' },
    { label: 'Average', min: 50, color: 'text-amber-700 bg-amber-50 border-amber-100' },
    { label: 'Good', min: 70, color: 'text-sky-700 bg-sky-50 border-sky-100' },
    { label: 'Excellent', min: 85, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' }
];

const toneColors = [
    'from-sky-500 to-blue-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-indigo-600',
    'from-emerald-500 to-teal-600'
];

const getAtsRange = (score) => {
    if (typeof score !== 'number') return null;
    return [...atsRanges].reverse().find((range) => score >= range.min) || atsRanges[0];
};

const getVariants = (item) => {
    if (!item) return [];
    if (Array.isArray(item.toneVariants) && item.toneVariants.length) return item.toneVariants;
    return [{
        tone: 'Generated',
        subject: item.subject,
        emailBody: item.emailBody,
        linkedInDM: item.linkedInDM,
        followUpEmail: item.followUpEmail,
        score: 85
    }];
};

const formatPack = (variant) => [
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

const Emails = () => {
    const { logout } = useAuth();
    const [emails, setEmails] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [selectedToneIndex, setSelectedToneIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [copied, setCopied] = useState('');

    const selectedEmail = useMemo(
        () => emails.find((email) => email._id === selectedId) || emails[0],
        [emails, selectedId]
    );
    const variants = useMemo(() => getVariants(selectedEmail), [selectedEmail]);
    const selectedVariant = variants[selectedToneIndex] || variants[0];
    const atsRange = getAtsRange(selectedEmail?.atsScore);

    const filteredEmails = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return emails;
        return emails.filter((email) => [
            email.subject,
            email.emailBody,
            email.prompt,
            ...(email.toneVariants || []).map((variant) => `${variant.tone} ${variant.subject}`)
        ].join(' ').toLowerCase().includes(normalized));
    }, [emails, query]);

    const loadEmails = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/ai/history');
            const list = Array.isArray(data) ? data : [];
            setEmails(list);
            setSelectedId((current) => current || list[0]?._id || '');
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to load emails';
            if (message === 'User not found' || error.response?.status === 401) {
                logout();
                toast.error('Session expired. Please login again.');
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmails();
    }, []);

    useEffect(() => {
        setSelectedToneIndex(0);
    }, [selectedEmail?._id]);

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text || '');
        setCopied(type);
        toast.success('Copied!');
        setTimeout(() => setCopied(''), 2000);
    };

    const ResultCard = ({ title, content, type, icon: Icon }) => (
        <div className="rounded-lg border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-md bg-sky-50 text-sky-700">
                        <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-gray-950">{title}</h3>
                </div>
                <button
                    type="button"
                    onClick={() => copyToClipboard(content, type)}
                    className="grid h-8 w-8 place-items-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-sky-600"
                    title={`Copy ${title}`}
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
                <div className="h-1.5 bg-gradient-to-r from-violet-500 via-sky-500 to-emerald-500" />
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-sky-700">Saved Campaigns</p>
                        <h1 className="mt-1 text-2xl font-semibold text-gray-950">Email library</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                            Saare generated cold mails, tone variants, LinkedIn DMs aur follow-ups yahan reusable rahenge.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={loadEmails}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-100"
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
                <section className="overflow-hidden rounded-xl border border-white/70 bg-white/80 shadow-sm backdrop-blur">
                    <div className="border-b border-white/70 bg-gradient-to-br from-white/90 to-violet-50/80 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-gray-950">Campaigns</h2>
                                <p className="text-sm text-gray-500">{emails.length} saved emails</p>
                            </div>
                            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-sky-600 text-white">
                                <EnvelopeIcon className="h-5 w-5" />
                            </div>
                        </div>
                        <label className="mt-4 flex items-center gap-2 rounded-md border border-white/80 bg-white/80 px-3 py-2 shadow-inner">
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                className="w-full bg-transparent text-sm outline-none"
                                placeholder="Search subject, tone, content..."
                            />
                        </label>
                    </div>

                    <div className="max-h-[calc(100vh-17rem)] min-h-[520px] overflow-y-auto bg-gradient-to-br from-violet-50/50 via-sky-50/50 to-emerald-50/50 p-4">
                        {loading ? (
                            <div className="rounded-lg border border-white/80 bg-white/80 p-4 text-sm text-gray-500">Loading emails...</div>
                        ) : filteredEmails.length ? (
                            <div className="space-y-3">
                                {filteredEmails.map((email) => {
                                    const range = getAtsRange(email.atsScore);
                                    const isActive = selectedEmail?._id === email._id;
                                    return (
                                        <button
                                            key={email._id}
                                            type="button"
                                            onClick={() => setSelectedId(email._id)}
                                            className={`w-full rounded-lg border p-4 text-left shadow-sm transition ${
                                                isActive
                                                    ? 'border-sky-300 bg-white'
                                                    : 'border-white/80 bg-white/75 hover:border-sky-200 hover:bg-white'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-gray-950">{email.subject}</p>
                                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{email.emailBody}</p>
                                                </div>
                                                {range && (
                                                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${range.color}`}>
                                                        {range.label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                                <span>{email.toneVariants?.length || 1} tones</span>
                                                <span>{new Date(email.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-white/80 bg-white/80 p-6 text-center">
                                <EnvelopeIcon className="mx-auto h-10 w-10 text-sky-600" />
                                <h3 className="mt-3 font-semibold text-gray-950">No saved emails</h3>
                                <p className="mt-1 text-sm text-gray-500">Dashboard se mail generate karo, yahan automatically aa jayega.</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-white/70 bg-white/80 shadow-sm backdrop-blur">
                    <div className="h-1 bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500" />
                    {selectedEmail && selectedVariant ? (
                        <>
                            <div className="border-b border-white/70 bg-gradient-to-br from-white/90 to-sky-50/80 p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-sky-700">Selected campaign</p>
                                        <h2 className="mt-1 text-xl font-semibold text-gray-950">{selectedVariant.subject}</h2>
                                        <p className="mt-2 text-sm text-gray-500">Choose a tone and copy any asset instantly.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {typeof selectedEmail.atsScore === 'number' && atsRange && (
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold ${atsRange.color}`}>
                                                <ChartBarIcon className="h-4 w-4" />
                                                ATS {selectedEmail.atsScore}/100
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(formatPack(selectedVariant), 'full-pack')}
                                            className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
                                        >
                                            {copied === 'full-pack' ? <CheckIcon className="h-4 w-4 text-emerald-500" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                                            Copy pack
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto bg-gradient-to-br from-sky-50/80 via-violet-50/60 to-emerald-50/70 p-5">
                                <div className="mb-4 rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
                                    <p className="mb-3 text-sm font-semibold text-gray-950">Tone variants</p>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                                        {variants.map((variant, index) => (
                                            <button
                                                key={`${variant.tone}-${index}`}
                                                type="button"
                                                onClick={() => setSelectedToneIndex(index)}
                                                className={`rounded-md border p-3 text-left transition ${
                                                    selectedToneIndex === index
                                                        ? 'border-sky-300 bg-sky-50 text-sky-900 shadow-sm'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className={`mb-2 block h-1 w-8 rounded-full bg-gradient-to-r ${toneColors[index] || toneColors[0]}`} />
                                                <p className="text-sm font-semibold">{variant.tone}</p>
                                                <p className="mt-1 text-xs text-gray-500">Score {variant.score || 85}/100</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <ResultCard title="Subject Line" icon={EnvelopeIcon} content={selectedVariant.subject} type={`subject-${selectedToneIndex}`} />
                                    <ResultCard title="Cold Email" icon={DocumentTextIcon} content={selectedVariant.emailBody} type={`email-${selectedToneIndex}`} />
                                    <ResultCard title="LinkedIn DM" icon={UserCircleIcon} content={selectedVariant.linkedInDM} type={`linkedin-${selectedToneIndex}`} />
                                    <ResultCard title="Follow-up Email" icon={ClockIcon} content={selectedVariant.followUpEmail} type={`followup-${selectedToneIndex}`} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex min-h-[620px] flex-col justify-center bg-gradient-to-br from-white/90 via-sky-50/90 to-violet-50/90 p-8 text-center">
                            <EnvelopeIcon className="mx-auto h-14 w-14 text-sky-700" />
                            <h2 className="mt-4 text-xl font-semibold text-gray-950">No campaign selected</h2>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Dashboard par jaake email generate karo. Saved campaigns yahan full library ke form me dikhenge.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Emails;
