import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg flex flex-col hidden md:flex">

      {/* Logo + Back */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          MailGen AI
        </h1>

        {/* Back to Landing */}
        <NavLink
          to="/"
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-3">

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `group flex items-center px-4 py-3 rounded-xl transition-all duration-300 
            ${
              isActive
                ? "bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          <HomeIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition" />
          Dashboard
        </NavLink>

        <NavLink
          to="/emails"
          className={({ isActive }) =>
            `group flex items-center px-4 py-3 rounded-xl transition-all duration-300 
            ${
              isActive
                ? "bg-purple-50 text-purple-700 shadow-sm border-l-4 border-purple-600"
                : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          <DocumentTextIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition" />
          Emails
        </NavLink>

      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-center text-xs text-gray-500">
        🚀 Built with React + MERN
      </div>
    </div>
  );
};

export default Sidebar;