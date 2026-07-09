import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
