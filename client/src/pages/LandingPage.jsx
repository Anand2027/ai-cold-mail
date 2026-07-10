import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ArrowRightIcon,
    EnvelopeOpenIcon,
    DocumentCheckIcon,
    AcademicCapIcon,
    SparklesIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    PlayCircleIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('email'); // 'email', 'ats', 'interview'

    // Mock data to show in the interactive dashboard preview
    const dashboardContent = {
        email: {
            title: "AI Cold Email Generator",
            description: "Generate 5 parallel tones (Executive, Warm, Direct, Referral, Casual) to land in the right inbox.",
            preview: (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex gap-2 mb-4">
                        {['Executive', 'Direct', 'Casual'].map((tone, i) => (
                            <span key={tone} className={`px-3 py-1 text-[10px] font-bold rounded-lg ${i === 0 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-white/5'}`}>
                                {tone}
                            </span>
                        ))}
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 text-sm">
                        <p className="text-cyan-300 font-bold mb-2">Subject: Scaling your backend infra — [Your Name]</p>
                        <p className="text-slate-400 leading-relaxed">Hi Team,<br/><br/>I noticed you're expanding your distributed systems. With my background in optimizing Kubernetes clusters and reducing latency by 40%, I'd love to explore how I can add value...</p>
                    </div>
                </div>
            )
        },
        ats: {
            title: "ATS Resume Scorer",
            description: "Upload your resume and the job description. Get an instant match score and missing keywords.",
            preview: (
                <div className="flex flex-col sm:flex-row gap-6 items-center animate-fade-in">
                    <div className="relative h-24 w-24 shrink-0 rounded-full border-4 border-slate-800 flex items-center justify-center">
                        <svg className="absolute inset-0 h-full w-full -rotate-90 transform text-emerald-500" viewBox="0 0 36 36">
                            <path strokeDasharray="92, 100" className="stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="text-2xl font-black text-white">92%</span>
                    </div>
                    <div className="space-y-3 w-full">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                            <p className="text-[11px] font-bold text-emerald-400 uppercase">Match Found</p>
                            <p className="text-xs text-slate-300 mt-1">Your profile strongly matches a "Senior Backend Engineer".</p>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                            <p className="text-[11px] font-bold text-rose-400 uppercase">Missing Keywords</p>
                            <p className="text-xs text-slate-300 mt-1">Add <span className="text-white font-bold">GraphQL</span> and <span className="text-white font-bold">Redis</span> to pass the filter.</p>
                        </div>
                    </div>
                </div>
            )
        },
        interview: {
            title: "PDF & Quiz Interview Prep",
            description: "Upload study material or job descriptions to auto-generate mock quizzes and technical interviews.",
            preview: (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl">
                        <DocumentTextIcon className="h-8 w-8 text-indigo-400" />
                        <div>
                            <p className="text-sm font-bold text-white">System_Design_Guide.pdf</p>
                            <p className="text-xs text-indigo-300">Scanned successfully • 45 potential questions generated</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl space-y-3">
                        <p className="text-sm text-slate-300 font-medium">Q: How do you prevent a cache stampede in a highly concurrent system?</p>
                        <button className="w-full bg-slate-950 border border-indigo-500/30 text-indigo-400 text-xs font-bold py-2 rounded-lg hover:bg-indigo-500/10 transition">
                            Start Audio/Quiz Mock Loop
                        </button>
                    </div>
                </div>
            )
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-cyan-500/30 selection:text-white overflow-x-hidden relative">
            
            {/* Ambient Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] pointer-events-none opacity-20 blur-[160px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-full" />
            
            {/* Navbar */}
            <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2.5 group cursor-pointer">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition duration-300">
                            <SparklesIcon className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            MailGen<span className="text-cyan-400">AI</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link to="/dashboard" className="px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm font-semibold text-white hover:bg-slate-800 transition">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-slate-400 transition hover:text-white">Sign In</Link>
                                <Link to="/signup" className="shadow-lg shadow-cyan-500/10 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 hover:scale-[1.02]">
                                    Start Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="pt-24 pb-16">
                
                {/* Hero Section - Direct & Explicit */}
                <section className="relative mx-auto max-w-4xl px-4 text-center space-y-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-300 uppercase tracking-widest">
                        The 3-in-1 Job Hunt Toolkit
                    </div>
                    
                    <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl leading-[1.1]">
                        Land Interviews Faster with an <br />
                        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            AI-Powered Arsenal.
                        </span>
                    </h1>
                    
                    <p className="mx-auto max-w-2xl text-lg text-slate-400 leading-relaxed">
                        Stop guessing. Write personalized cold emails, score your resume against strict ATS filters, and prep for technical rounds by converting any PDF into an interactive quiz.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                        <Link to={user ? '/dashboard' : '/signup'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-slate-950 shadow-xl transition hover:bg-slate-100 hover:scale-[1.02]">
                            Unlock Your Free Toolkit
                            <ArrowRightIcon className="h-5 w-5 stroke-[2.5]" />
                        </Link>
                        <a href="#demo" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur px-8 py-4 text-base font-bold text-white transition hover:bg-slate-900">
                            <PlayCircleIcon className="h-5 w-5" /> See How It Works
                        </a>
                    </div>
                </section>

                {/* Interactive Feature Showcase - Replaces the bottom quiz */}
                <section id="demo" className="max-w-5xl mx-auto px-4 pt-24 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-white">Everything you need in one unified dashboard.</h2>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                        <div className="grid md:grid-cols-12">
                            
                            {/* Left Side: Tabs */}
                            <div className="md:col-span-5 bg-slate-950/50 p-6 border-r border-white/5 space-y-2">
                                <button 
                                    onClick={() => setActiveTab('email')}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${activeTab === 'email' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'border-transparent text-slate-400 hover:bg-slate-900'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <EnvelopeOpenIcon className="h-6 w-6" />
                                        <div>
                                            <p className="font-bold text-white">1. Cold Emails</p>
                                            <p className="text-xs mt-0.5 opacity-80">Generate 5 unique outreach tones</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setActiveTab('ats')}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${activeTab === 'ats' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'border-transparent text-slate-400 hover:bg-slate-900'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <DocumentCheckIcon className="h-6 w-6" />
                                        <div>
                                            <p className="font-bold text-white">2. ATS Scoring</p>
                                            <p className="text-xs mt-0.5 opacity-80">Match resume vs job description</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setActiveTab('interview')}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${activeTab === 'interview' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'border-transparent text-slate-400 hover:bg-slate-900'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <AcademicCapIcon className="h-6 w-6" />
                                        <div>
                                            <p className="font-bold text-white">3. Interview Prep</p>
                                            <p className="text-xs mt-0.5 opacity-80">PDF to custom technical quizzes</p>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Right Side: Dynamic Content */}
                            <div className="md:col-span-7 p-8 lg:p-12 flex flex-col justify-center">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Live Preview</span>
                                <h3 className="text-2xl font-bold text-white mb-2">{dashboardContent[activeTab].title}</h3>
                                <p className="text-sm text-slate-400 mb-8 max-w-md">{dashboardContent[activeTab].description}</p>
                                
                                {/* Dynamic Component Box */}
                                <div className="min-h-[200px]">
                                    {dashboardContent[activeTab].preview}
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Features Grid (Simplified to match the 3 pillars) */}
                <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/5 hover:border-cyan-500/30 transition duration-300">
                            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 grid place-items-center mb-4">
                                <EnvelopeOpenIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Never Write from Scratch</h3>
                            <p className="text-sm text-slate-400">Our engine parses your resume and auto-crafts high-converting emails tailored exactly to the hiring manager.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/5 hover:border-emerald-500/30 transition duration-300">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 grid place-items-center mb-4">
                                <DocumentCheckIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Beat the ATS Bots</h3>
                            <p className="text-sm text-slate-400">Stop getting auto-rejected. Instantly know which keywords your resume is missing before you hit submit.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-900/30 border border-white/5 hover:border-indigo-500/30 transition duration-300">
                            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 grid place-items-center mb-4">
                                <AcademicCapIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Aces Every Interview</h3>
                            <p className="text-sm text-slate-400">Upload any tech documentation or job description PDF. We'll generate custom quizzes to prepare you for the loop.</p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="mx-auto max-w-4xl px-4 pb-20">
                    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-10 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-3xl blur-2xl" />
                        <h2 className="text-3xl font-black text-white relative z-10 mb-4">Ready to automate your job hunt?</h2>
                        <p className="text-slate-400 mb-8 relative z-10 max-w-lg mx-auto">Get access to Cold Emails, ATS Scoring, and Interview Quizzes all in one place.</p>
                        <Link to="/signup" className="relative z-10 inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-8 py-4 text-sm font-bold text-white transition hover:scale-105 shadow-xl shadow-indigo-500/20">
                            Create Your Free Account
                        </Link>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default LandingPage;