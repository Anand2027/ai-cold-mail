import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-slate-950/80 backdrop-blur border-r border-white/10 flex-col hidden md:flex">
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gray-950 text-white">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">MailGen AI</h1>
            <p className="text-xs text-slate-400">Cold outreach</p>
          </div>
        </div>

        <NavLink
          to="/"
          className="p-2 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition"
          title="Back to home"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </NavLink>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `group flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition ${
              isActive
                ? 'bg-sky-400/10 text-sky-200'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <HomeIcon className="w-5 h-5 mr-3" />
          Dashboard
        </NavLink>

        <NavLink
          to="/emails"
          className={({ isActive }) =>
            `group flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition ${
              isActive
                ? 'bg-sky-400/10 text-sky-200'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <DocumentTextIcon className="w-5 h-5 mr-3" />
          Emails
        </NavLink>

        <NavLink
          to="/interview"
          className={({ isActive }) =>
            `group flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition ${
              isActive
                ? 'bg-sky-400/10 text-sky-200'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <QuestionMarkCircleIcon className="w-5 h-5 mr-3" />
          Interview
        </NavLink>
      </nav>

      <div className="m-4 rounded-lg border border-white/10 bg-gradient-to-br from-sky-500/10 to-emerald-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Workspace</p>
        <p className="mt-2 text-sm font-medium text-white">Resume + outreach</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">Generate, score, and reuse your best campaigns.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
