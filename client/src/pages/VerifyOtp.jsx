import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { SparklesIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const VerifyOtp = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const pendingVerification = (() => {
        try {
            return JSON.parse(sessionStorage.getItem('pendingVerification') || '{}');
        } catch {
            return {};
        }
    })();

    const userId = location.state?.userId || pendingVerification.userId;
    const email = location.state?.email || pendingVerification.email;

    // React 18+ components me side-effects (like navigation) ko useEffect me rakhna best practice hai
    useEffect(() => {
        if (!userId) {
            navigate('/signup');
        }
    }, [userId, navigate]);

    if (!userId) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-otp', { userId, otp });
            login(data);
            sessionStorage.removeItem('pendingVerification');
            toast.success('Email verified successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/resend-otp', { userId, email });
            sessionStorage.setItem('pendingVerification', JSON.stringify({ userId: data.userId, email: data.email }));
            toast.success(data.message || 'OTP sent again.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            
            {/* Ambient Matrix Mesh Gradients */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-20 blur-[120px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 pointer-events-none opacity-10 blur-[100px] bg-indigo-600 rounded-full" />

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
                    Verify your email
                </h2>
                <p className="text-sm text-slate-400 px-4">
                    We sent a security code to <span className="font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">{email}</span>
                </p>
            </div>

            {/* Glowing Premium OTP Card Container */}
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 opacity-50 blur-sm pointer-events-none" />
                
                <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-4 border border-white/10 rounded-2xl shadow-2xl shadow-black/80 sm:px-10 relative">
                    
                    {/* Security Badge Accent */}
                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-slate-950 border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheckIcon className="h-3 w-3 text-cyan-400 animate-pulse" /> 2FA Authentication
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        
                        {/* OTP Input Field Box */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                                Enter 6-Digit OTP
                            </label>
                            <div className="relative rounded-xl shadow-sm">
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="block w-full px-3 py-3.5 bg-slate-950/80 border border-white/10 rounded-xl text-center text-3xl tracking-[0.6em] font-mono font-bold text-cyan-400 placeholder-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition duration-200"
                                    placeholder="000000"
                                />
                            </div>
                        </div>

                        {/* Premium Action Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:opacity-95 shadow-lg shadow-cyan-500/10 active:scale-[0.99] transition duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {loading ? (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4 animate-spin stroke-[2.5]" />
                                        Verifying Credentials...
                                    </>
                                ) : (
                                    'Verify & Continue'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Resend Action Area */}
                    <div className="mt-6 text-center border-t border-white/5 pt-4">
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={loading}
                            className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition duration-150 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:hover:text-slate-400"
                        >
                            <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Didn't receive the code? Resend OTP
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;