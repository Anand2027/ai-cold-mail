import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ArrowRightIcon,
    BoltIcon,
    ChartBarIcon,
    DocumentTextIcon,
    SparklesIcon,
    CheckCircleIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const features = [
    {
        name: '5 AI Outreach Tones',
        description: 'Instantly generate confident, warm, direct, executive, and referral-style variants in a single parallel run.',
        icon: BoltIcon,
        badge: 'Popular'
    },
    {
        name: 'Resume-Aware Context Engine',
        description: 'Deeply parses your technical skills, projects, and career milestones to craft hyper-personalized recruiter hooks.',
        icon: DocumentTextIcon,
    },
    {
        name: 'Real-Time ATS Score Graph',
        description: 'Get an immediate visual alignment breakdown against target roles before you hit send.',
        icon: ChartBarIcon,
    },
];

const LandingPage = () => {
    const { user } = useAuth();
    const [selectedTone, setSelectedTone] = useState('Executive');

    const previewData = {
        Executive: { title: "Subject: Strategic Growth Opportunity - [Your Name]", desc: "Tailored with a high-level value proposition focusing on ROI, scale, and cross-functional leadership alignment." },
        Warm: { title: "Subject: Greatly admired your team's work + Introduction", desc: "Constructed with personalized rapport, emphasizing cultural fit, shared professional circles, and mutual enthusiasm." },
        Direct: { title: "Subject: Senior Engineer Application - [Your Name]", desc: "Stripped of fluff. Directly mappings core technical competencies to open requirements for quick filtering." }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-cyan-500/30 selection:text-white overflow-x-hidden relative">
            
            {/* SaaS Mesh Gradient Backgrounds */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-30 blur-[130px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-full" />
            <div className="absolute top-[800px] -right-40 w-96 h-96 pointer-events-none opacity-10 blur-[100px] bg-cyan-400 rounded-full" />

            {/* Navbar */}
            <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2.5 group cursor-pointer">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition duration-300">
                            <SparklesIcon className="h-5 w-5 fill-slate-950" />
                        </div>
                        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            MailGen<span className="text-cyan-400">AI</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link to="/dashboard" className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none">
                                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg transition group-hover:opacity-100" />
                                <div className="relative px-4 py-2 bg-slate-950 rounded-[7px] text-sm font-semibold text-cyan-400 transition group-hover:bg-slate-950/90 group-hover:text-white">
                                    Dashboard
                                </div>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-slate-400 transition hover:text-white">
                                    Sign In
                                </Link>
                                <Link to="/signup" className="shadow-lg shadow-cyan-500/10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]">
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="pt-16">
                {/* Hero Section */}
                <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-24 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
                        
                        {/* Hero Text */}
                        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur px-3.5 py-1 text-xs font-medium text-cyan-300 shadow-inner">
                                <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                                Cold Email + ATS Matcher v2.0
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.15]">
                                Write recruiter outreach with a{' '}
                                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
                                    resume score
                                </span>{' '}
                                built in.
                            </h1>
                            <p className="mx-auto lg:mx-0 max-w-xl text-base sm:text-lg leading-relaxed text-slate-400">
                                Stop spraying and praying. Generate hyper-tailored cold emails, LinkedIn connection pitches, and follow-ups backed by data-driven applicant systems.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
                                <Link
                                    to={user ? '/dashboard' : '/signup'}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-md transition hover:bg-slate-100 hover:scale-[1.01]"
                                >
                                    Start Generating Free
                                    <ArrowRightIcon className="h-4 w-4 stroke-[2.5]" />
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur px-6 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
                                >
                                    Explore Workbench
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="pt-6 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5"><CheckCircleIcon className="h-4 w-4 text-cyan-500" /> No credit card required</span>
                                <span className="flex items-center gap-1.5"><CheckCircleIcon className="h-4 w-4 text-cyan-500" /> 10 free generations/mo</span>
                            </div>
                        </div>

                        {/* Hero Visual SaaS Sandbox Preview */}
                        <div className="lg:col-span-6 relative group">
                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-20 blur-xl dynamic-glow transition group-hover:opacity-30" />
                            <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 shadow-2xl shadow-black/60">
                                
                                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">Live Workbench Preview</p>
                                        </div>
                                        <p className="text-sm font-bold text-white mt-0.5">Campaign Workspace</p>
                                    </div>
                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur">
                                        ATS Target Match: 86%
                                    </span>
                                </div>

                                <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                                    {/* Score Chart Controls */}
                                    <div className="flex flex-col justify-between rounded-xl border border-white/5 bg-slate-950/80 p-5">
                                        <div className="relative mx-auto h-32 w-32">
                                            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                                                <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
                                                <circle cx="60" cy="60" r="46" fill="none" stroke="url(#cyanGradient)" strokeLinecap="round" strokeWidth="10" strokeDasharray="289" strokeDashoffset="40" className="drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                                                <defs>
                                                    <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#22d3ee" />
                                                        <stop offset="100%" stopColor="#3b82f6" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <div className="absolute inset-0 grid place-items-center text-center">
                                                <div>
                                                    <p className="text-3xl font-extrabold text-white tracking-tight">86</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Score</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Bar Charts */}
                                        <div className="mt-5 grid h-16 grid-cols-4 items-end gap-2.5">
                                            {[48, 62, 74, 86].map((bar, index) => (
                                                <div key={index} className="flex h-full flex-col justify-end gap-1.5">
                                                    <div className={`rounded-t-sm transition-all duration-500 ${index === 3 ? 'bg-gradient-to-t from-cyan-500 to-blue-400' : 'bg-slate-800'}`} style={{ height: `${bar}%` }} />
                                                    <span className="text-center text-[9px] font-semibold text-slate-500">{['Base', 'Skills', 'JD', 'You'][index]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tone interactive preview toggles */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-1.5 border-b border-slate-800/80 pb-2">
                                            {['Executive', 'Warm', 'Direct'].map((tone) => (
                                                <button 
                                                    key={tone} 
                                                    onClick={() => setSelectedTone(tone)}
                                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${selectedTone === tone ? 'bg-white/10 text-cyan-400 border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    {tone}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div className="rounded-xl border border-white/5 bg-slate-950/50 p-3.5 space-y-2 min-h-[140px] flex flex-col justify-center">
                                            <p className="text-xs font-semibold text-cyan-300 transition-all duration-300">{previewData[selectedTone].title}</p>
                                            <p className="text-[11px] leading-relaxed text-slate-400 transition-all duration-300">{previewData[selectedTone].desc}</p>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between text-[11px] text-slate-500 px-1">
                                            <span>⚡ Generated in 1.4s</span>
                                            <span className="text-cyan-500 hover:underline cursor-pointer inline-flex items-center gap-0.5">Copy Draft <ChevronRightIcon className="h-2.5 w-2.5" /></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Features Bento/Grid Section */}
                <section className="relative border-t border-white/5 bg-slate-900/30 py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        
                        <div className="mb-16 text-center lg:text-left">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Built into one cohesive pipeline
                            </h2>
                            <p className="mt-4 max-w-2xl text-base text-slate-400">
                                Everything you need to escape the recruitment void, speed up optimization mechanics, and capture executive interest.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {features.map((feature, i) => (
                                <div 
                                    key={feature.name} 
                                    className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-6 shadow-inner transition hover:border-white/10 hover:bg-slate-900/70"
                                >
                                    {feature.badge && (
                                        <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                                            {feature.badge}
                                        </span>
                                    )}
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-cyan-400 border border-white/5 shadow-md">
                                        <feature.icon className="h-5 w-5 stroke-[1.8]" />
                                    </div>
                                    <h3 className="mt-6 text-base font-bold text-white">{feature.name}</h3>
                                    <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{feature.description}</p>
                                </div>
                            ))}
                        </div>

                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;