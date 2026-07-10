import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    DocumentArrowUpIcon,
    QuestionMarkCircleIcon,
    SparklesIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';

const initialForm = {
    role: '',
    extraContext: ''
};

const getApiErrorMessage = (error, fallback) => (
    error.response?.data?.message
    || error.response?.data?.error
    || error.message
    || fallback
);

const escapePdfText = (value) => value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const wrapText = (text, maxLength = 88) => {
    const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let line = '';

    words.forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (next.length > maxLength) {
            if (line) lines.push(line);
            line = word;
        } else {
            line = next;
        }
    });

    if (line) lines.push(line);
    return lines;
};

const createPdfBlob = (prep) => {
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 48;
    const lineHeight = 15;
    const pages = [];
    let lines = [];
    let y = pageHeight - margin;

    const pushPage = () => {
        pages.push(lines);
        lines = [];
        y = pageHeight - margin;
    };

    const addLine = (line = '', size = 11, bold = false) => {
        if (y < margin) pushPage();
        lines.push({ text: line, y, size, bold });
        y -= lineHeight + (size > 12 ? 3 : 0);
    };

    addLine(`Interview Preparation - ${prep.role || 'Candidate'}`, 18, true);
    addLine('');
    addLine(`Focus areas: ${(prep.focusAreas || []).join(', ')}`, 11);
    addLine('');

    (prep.questions || []).forEach((item, index) => {
        addLine(`${index + 1}. ${item.question}`, 12, true);
        wrapText(item.answer).forEach((line) => addLine(line));
        addLine('');
    });

    if (lines.length) pushPage();

    const objects = [];
    const addObject = (content) => {
        objects.push(content);
        return objects.length;
    };

    const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const boldFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const pageIds = [];

    pages.forEach((pageLines) => {
        const content = pageLines.map((line) => (
            `BT /${line.bold ? 'F2' : 'F1'} ${line.size} Tf ${margin} ${line.y} Td (${escapePdfText(line.text)}) Tj ET`
        )).join('\n');
        const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
        const pageId = addObject(`<< /Type /Page /Parent PAGES_PLACEHOLDER 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
        pageIds.push(pageId);
    });

    const pagesId = objects.length + 1;
    const catalogId = objects.length + 2;
    const resolvedObjects = objects.map((object) => object.replace('PAGES_PLACEHOLDER', pagesId));
    resolvedObjects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
    resolvedObjects.push(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    resolvedObjects.forEach((object, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${resolvedObjects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${resolvedObjects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;

    return new Blob([pdf], { type: 'application/pdf' });
};

const Interview = () => {
    const [form, setForm] = useState(initialForm);
    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(false);
    const [prep, setPrep] = useState(null);
    const [quizStarted, setQuizStarted] = useState(false);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const score = useMemo(() => {
        if (!prep?.quiz?.length) return 0;
        return prep.quiz.reduce((total, item, index) => total + (answers[index] === item.answerIndex ? 1 : 0), 0);
    }, [answers, prep]);

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
        setPrep(null);
        setQuizStarted(false);
        setAnswers({});
        setSubmitted(false);
    };

    const handlePrepare = async (event) => {
        event.preventDefault();
        if (!resume) {
            toast.error('Interview prep ke liye resume upload karo.');
            return;
        }

        const payload = new FormData();
        payload.append('role', form.role);
        payload.append('extraContext', form.extraContext);
        payload.append('resume', resume);

        setLoading(true);
        try {
            const { data } = await api.post('/ai/interview-prep', payload);
            setPrep(data);
            setQuizStarted(false);
            setAnswers({});
            setSubmitted(false);
            toast.success('Interview Q&A ready!');
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Failed to prepare interview.'));
        } finally {
            setLoading(false);
        }
    };

    const downloadPdf = () => {
        if (!prep) return;
        const url = URL.createObjectURL(createPdfBlob(prep));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(prep.role || 'interview-prep').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-qa.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const startQuiz = () => {
        setQuizStarted(true);
        setSubmitted(false);
        setAnswers({});
    };

    return (
        <div className="mx-auto max-w-[1480px] pb-12">
            <div className="mb-5 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-slate-950/20">
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500" />
                <div className="p-5">
                    <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">AI Interview Prep</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-50">Resume upload karo, interview Q&A aur quiz ready karo</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">PDF/DOCX/TXT resume se role-based interview questions, strong sample answers, downloadable PDF, aur 10-question quiz score.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                <section className="rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-slate-950/20">
                    <div className="border-b border-slate-800 bg-slate-900 px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-emerald-600 to-cyan-600 text-white">
                                <DocumentArrowUpIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-50">Resume Workbench</h2>
                                <p className="text-sm text-slate-400">Resume upload karke prep generate karo.</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handlePrepare} className="space-y-5 p-6">
                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Target role</span>
                            <input
                                value={form.role}
                                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                                placeholder="Frontend Developer / MERN Stack Intern"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Extra context</span>
                            <textarea
                                value={form.extraContext}
                                onChange={(event) => setForm((current) => ({ ...current, extraContext: event.target.value }))}
                                rows={4}
                                className="mt-2 w-full resize-none rounded-md border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                                placeholder="Company round, HR round, technical stack, DSA focus, etc."
                            />
                        </label>

                        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                            <p className="text-sm font-semibold text-slate-50">Resume upload</p>
                            <p className="mt-1 text-xs leading-5 text-slate-400">PDF, DOCX, TXT up to 5MB.</p>
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:from-emerald-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
                            Prepare Interview
                        </button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-slate-950/20">
                    <div className="border-b border-slate-800 bg-slate-900 px-6 py-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-sky-600 text-white">
                                    <QuestionMarkCircleIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-50">Questions, Answers & Quiz</h2>
                                    <p className="text-sm text-slate-400">Generated prep yahin preview hoga.</p>
                                </div>
                            </div>
                            {prep && (
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={downloadPdf}
                                        className="inline-flex items-center justify-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                        Download PDF
                                    </button>
                                    <button
                                        type="button"
                                        onClick={startQuiz}
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        <QuestionMarkCircleIcon className="h-4 w-4" />
                                        Prepare Quiz
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-5 p-5">
                        {!prep ? (
                            <div className="flex min-h-[420px] flex-col justify-center rounded-lg border border-slate-700/80 bg-slate-900/85 px-8 text-center">
                                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cyan-400/10">
                                    <SparklesIcon className="h-8 w-8 text-cyan-300" />
                                </div>
                                <h3 className="mt-5 text-xl font-semibold text-slate-50">Interview prep yahan aayega</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Left panel me resume upload karke Prepare Interview chalao.</p>
                            </div>
                        ) : quizStarted ? (
                            <div className="space-y-4">
                                {submitted && (
                                    <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-5">
                                        <div className="flex items-center gap-3">
                                            <CheckCircleIcon className="h-8 w-8 text-emerald-300" />
                                            <div>
                                                <p className="text-lg font-semibold text-slate-50">Score: {score}/{prep.quiz.length}</p>
                                                <p className="text-sm text-emerald-100">Correct answers green me marked hain.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {prep.quiz.map((item, index) => (
                                    <div key={item.question} className="rounded-lg border border-slate-700/80 bg-slate-900/85 p-5">
                                        <p className="font-semibold text-slate-50">{item.question}</p>
                                        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                                            {item.options.map((option, optionIndex) => {
                                                const selected = answers[index] === optionIndex;
                                                const correct = submitted && item.answerIndex === optionIndex;
                                                const wrong = submitted && selected && item.answerIndex !== optionIndex;
                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        disabled={submitted}
                                                        onClick={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}
                                                        className={`rounded-md border px-3 py-2.5 text-left text-sm transition ${
                                                            correct
                                                                ? 'border-emerald-400 bg-emerald-400/10 text-emerald-100'
                                                                : wrong
                                                                    ? 'border-red-400 bg-red-400/10 text-red-100'
                                                                    : selected
                                                                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-100'
                                                                        : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setSubmitted(true)}
                                    disabled={Object.keys(answers).length !== prep.quiz.length || submitted}
                                    className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-sky-600 px-4 py-3 font-semibold text-white transition hover:from-violet-700 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Submit Quiz
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-lg border border-slate-700/80 bg-slate-900/85 p-5">
                                    <p className="text-sm font-semibold text-slate-400">Role</p>
                                    <h3 className="mt-1 text-xl font-semibold text-slate-50">{prep.role}</h3>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {prep.focusAreas?.map((area) => (
                                            <span key={area} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">{area}</span>
                                        ))}
                                    </div>
                                </div>

                                {prep.questions.map((item, index) => (
                                    <div key={item.question} className="rounded-lg border border-slate-700/80 bg-slate-900/85 p-5">
                                        <p className="text-sm font-semibold text-cyan-300">Question {index + 1}</p>
                                        <h3 className="mt-2 font-semibold text-slate-50">{item.question}</h3>
                                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Interview;
