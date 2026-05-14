import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Shell = ({ children }) => {
  const location = useLocation()
  
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'My Courses', path: '/catalog', icon: '📚' },
    { label: 'Certificates', path: '/certificates', icon: '🏅' },
  ]

  const complianceItems = [
    { label: 'AI Advisor', path: '/ai-advisor', icon: '🤖' },
    { label: 'Policy Gen', path: '/policy-gen', icon: '📝' },
    { label: 'Survey Sim', path: '/survey-sim', icon: '🔍' },
  ]

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-navy text-white flex flex-col shrink-0 relative z-20">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 grad-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg ring-1 ring-white/20">C</div>
          <div>
            <span className="font-serif font-bold text-xl block leading-tight">ClearPass</span>
            <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Academy</span>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-3 mb-4">Main Navigation</div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                location.pathname === item.path 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-x-1' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{item.icon}</span> {item.label}
            </Link>
          ))}
          
          <div className="pt-10 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-3 mb-4">Intelligence Tools</div>
          {complianceItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                location.pathname === item.path 
                  ? 'bg-gold text-navy shadow-lg shadow-gold/20 translate-x-1' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-navy-light bg-navy-light/30">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center text-navy font-bold">JD</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Jane Doe</p>
              <p className="text-xs text-slate-400 truncate">RN Supervisor</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center h-16 shrink-0">
          <h2 className="text-xl font-serif font-bold text-navy truncate">
            {navItems.find(i => i.path === location.pathname)?.label || 
             complianceItems.find(i => i.path === location.pathname)?.label || 
             'ClearPass Academy'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-xs bg-gold-light text-navy px-2 py-1 rounded font-bold border border-gold/20">
              TRIAL: 12 DAYS LEFT
            </span>
            <button className="p-2 text-slate-400 hover:text-navy transition-colors">🔔</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Shell
