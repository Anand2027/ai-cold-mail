import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftOnRectangleIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-slate-950/75 backdrop-blur border-b border-white/10 flex items-center justify-between px-4 lg:px-6 shrink-0">
            <div className="hidden md:block">
                <p className="text-sm text-slate-400">Welcome back</p>
                <h2 className="text-base font-semibold text-white">{user?.name || 'User'}</h2>
            </div>

            <div className="flex items-center gap-2 text-base font-semibold text-white md:hidden">
                <SparklesIcon className="h-5 w-5 text-sky-700" />
                MailGen AI
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-200 sm:block">
                    AI Outreach Studio
                </div>
                <button
                    onClick={logout}
                    className="flex items-center rounded-md border border-white/10 px-3 py-2 text-slate-300 transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-1.5" />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Navbar;
