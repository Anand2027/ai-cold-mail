import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { SparklesIcon, LockClosedIcon, EnvelopeIcon, UserIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            toast.success(data.message);
            if (data.token) {
                login(data);
                navigate('/dashboard');
                return;
            }
            sessionStorage.setItem('pendingVerification', JSON.stringify({ userId: data.userId, email: data.email || email }));
            navigate('/verify-otp', { state: { userId: data.userId, email } });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            
            {/* Ambient Matrix Mesh Gradients */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-20 blur-[120px] bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-500 rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 pointer-events-none opacity-10 blur-[100px] bg-cyan-600 rounded-full" />

            {/* Top Branding Header */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-4">
                <div className="inline-flex items-center justify-center gap-2.5 group cursor-pointer">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20">
                        <SparklesIcon className="h-5 w-5 stroke-[2] text-slate-950" />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                        MailGen<span className="text-cyan-400">AI</span>
                    </span>
                </div>
                <h2 className="text-center text-3xl font-black tracking-tight text-white">
                    Create your account
                </h2>
                <p className="text-sm text-slate-400">
                    Get started with your automated optimization suite
                </p>
            </div>

            {/* Glowing Premium Auth Card Container */}
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 opacity-50 blur-sm pointer-events-none" />
                
                <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-4 border border-white/10 rounded-2xl shadow-2xl shadow-black/80 sm:px-10 relative">
                    
                    {/* Security Badge Accent */}
                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-slate-950 border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" /> Secure Registration Endpoint
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        
                        {/* Full Name Input Field */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                Full Name
                            </label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                    <UserIcon className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition duration-200"
                                />
                            </div>
                        </div>

                        {/* Email Input Field */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                Email Address
                            </label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                    <EnvelopeIcon className="h-4 w-4" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition duration-200"
                                />
                            </div>
                        </div>

                        {/* Password Input Field */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                Password
                            </label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                    <LockClosedIcon className="h-4 w-4" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition duration-200"
                                />
                            </div>
                        </div>

                        {/* Premium Action Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:opacity-95 shadow-lg shadow-cyan-500/10 active:scale-[0.99] transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {loading ? (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4 animate-spin stroke-[2.5]" />
                                        Initializing Account...
                                    </>
                                ) : (
                                    'Create Enterprise Account'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer Auth Switch Text */}
                    <div className="mt-6 text-center text-xs border-t border-white/5 pt-4">
                        <span className="text-slate-500 font-medium">Already have an account? </span>
                        <Link to="/login" className="font-bold text-cyan-400 hover:text-cyan-300 transition duration-150 ml-0.5 inline-flex items-center gap-0.5">
                            Sign In <span className="text-[10px]">→</span>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Signup;