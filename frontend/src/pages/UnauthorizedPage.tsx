import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();

  const homeLink = user?.role === 'LAWYER' ? '/lawyer/dashboard' : user ? '/citizen/dashboard' : '/login';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>

        <div className="space-y-2">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-widest">Access Denied</p>
          <h1 className="text-3xl font-extrabold text-white">Unauthorized</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            You don't have permission to access this page.
            {user && (
              <> Your current role (<strong className="text-slate-300">{user.role}</strong>) does not grant access to this section.</>
            )}
          </p>
        </div>

        {/* Helpful callout */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl px-5 py-4 text-sm text-slate-400 text-left">
          <p className="font-semibold text-slate-300 mb-1">Why am I here?</p>
          <ul className="list-disc list-inside space-y-1 text-slate-500 text-xs">
            <li>Citizens cannot access Lawyer-only pages</li>
            <li>Lawyers cannot access Citizen-only pages</li>
            <li>Direct URL access is restricted by role</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={homeLink}
            id="unauthorized-go-home"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to My Dashboard
          </Link>

          {user && (
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl px-5 py-2.5 text-sm border border-slate-700 transition"
            >
              Switch Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
