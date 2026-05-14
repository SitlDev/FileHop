import React from 'react'
import Shell from '../components/layout/Shell'

const Dashboard = () => {
  return (
    <Shell>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-premium group hover:bg-navy transition-colors duration-500">
            <p className="text-[10px] font-bold text-slate-400 group-hover:text-primary-light uppercase tracking-[0.2em] mb-2">Compliance Score</p>
            <h3 className="text-4xl font-serif font-bold text-navy group-hover:text-white mt-1 transition-colors">92%</h3>
            <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden ring-1 ring-slate-200 group-hover:ring-white/10">
              <div className="bg-green-500 h-full" style={{ width: '92%' }}></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-premium">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Courses Done</p>
            <h3 className="text-4xl font-serif font-bold text-navy mt-1">8/13</h3>
            <p className="text-xs text-primary font-bold mt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              +2 this week
            </p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-premium">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Contact Hours</p>
            <h3 className="text-4xl font-serif font-bold text-navy mt-1">14.5</h3>
            <p className="text-xs text-slate-400 mt-4">Earned this year</p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-premium">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Next Due</p>
            <h3 className="text-4xl font-serif font-bold text-rose-500 mt-1">2 Days</h3>
            <p className="text-xs text-slate-400 mt-4">Infection Control</p>
          </div>
        </div>

        {/* Active Courses */}
        <section>
          <div className="flex justify-between items-end mb-8 px-2">
            <div>
              <h3 className="text-3xl font-serif font-bold text-navy">Continue Learning</h3>
              <p className="text-slate-500 text-sm mt-1">Pick up where you left off</p>
            </div>
            <button className="text-primary font-bold text-sm hover:underline flex items-center gap-2">
              View Catalog <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium shadow-hover flex gap-8 items-center cursor-pointer group">
              <div className="w-24 h-24 bg-slate-50 rounded-[24px] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                <img src="safety_real_thumb_1778799160653.png" alt="Infection Control" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 py-1">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Lesson 4 of 6</p>
                <h4 className="text-2xl font-serif font-bold text-navy group-hover:text-primary transition-colors">Infection Control 2025</h4>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-xs font-black text-slate-400">65%</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium shadow-hover flex gap-8 items-center cursor-pointer group">
              <div className="w-24 h-24 bg-slate-50 rounded-[24px] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                <img src="clinical_real_thumb_1778799130079.png" alt="Patient Rights" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 py-1">
                <p className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1">Lesson 2 of 5</p>
                <h4 className="text-2xl font-serif font-bold text-navy group-hover:text-primary transition-colors">Patient Rights & Privacy</h4>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-gold h-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-xs font-black text-slate-400">30%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Shell>
  )
}

export default Dashboard
