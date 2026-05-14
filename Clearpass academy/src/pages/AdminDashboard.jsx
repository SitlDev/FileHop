import React from 'react'
import Shell from '../components/layout/Shell'
import { Users, FileCheck, AlertCircle, TrendingUp, FileSpreadsheet } from 'lucide-react'

const AdminDashboard = () => {
  const stats = [
    { label: 'Overdue Staff', value: '12', icon: <AlertCircle size={24} />, color: 'bg-rose-50 text-rose-500' },
    { label: 'Compliance Rate', value: '88.4%', icon: <TrendingUp size={24} />, color: 'bg-green-50 text-green-500' },
    { label: 'Active Learners', value: '142', icon: <Users size={24} />, color: 'bg-primary-light text-primary' },
    { label: 'Certs Issued', value: '1,204', icon: <FileCheck size={24} />, color: 'bg-gold-light text-gold' },
  ]

  const heatmapData = [
    { name: 'Abuse Prev', rate: 98, color: 'bg-green-500' },
    { name: 'Inf Control', rate: 72, color: 'bg-blue-500' },
    { name: 'MDS 3.0', rate: 45, color: 'bg-rose-500' },
    { name: 'Resident Rights', rate: 92, color: 'bg-green-500' },
    { name: 'QAPI', rate: 64, color: 'bg-amber-500' },
    { name: 'Dementia', rate: 81, color: 'bg-blue-500' },
  ]

  const recentActivity = [
    { user: 'Maria S.', action: 'completed Infection Control', time: '10m ago', status: 'success' },
    { user: 'John D.', action: 'is now overdue for HIPAA', time: '2h ago', status: 'overdue' },
    { user: 'Sarah L.', action: 'passed Resident Rights (100%)', time: '4h ago', status: 'success' },
  ]

  return (
    <Shell>
      <div className="p-8 max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
          <div>
            <h2 className="text-4xl font-serif font-bold text-navy tracking-tight">Compliance Overview</h2>
            <p className="text-slate-500 mt-2 text-lg">Monitoring facility performance and staff readiness</p>
          </div>
          <button className="flex items-center gap-2 px-8 py-4 grad-primary text-white font-bold rounded-2xl shadow-premium hover:shadow-hover transition-all">
            <FileSpreadsheet size={20} />
            Export Compliance Report
          </button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-premium hover:scale-[1.02] transition-transform duration-300">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <h3 className="text-4xl font-serif font-bold text-navy mt-1 tracking-tight">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Heatmap Section */}
        <section className="bg-navy p-10 lg:p-14 rounded-[48px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <h4 className="text-2xl font-serif font-bold text-white tracking-tight">Compliance Heatmap by Course</h4>
              <span className="text-xs font-bold text-white/40 tracking-[0.3em] uppercase">Real-time Metrics</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {heatmapData.map(item => (
                <div key={item.name} className={`${item.color} p-6 rounded-[32px] text-white shadow-xl flex flex-col justify-between aspect-square group hover:scale-105 transition-all duration-300`}>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-tight">{item.name}</span>
                  <span className="text-3xl font-serif font-bold tracking-tight">{item.rate}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] grad-primary opacity-20 blur-[120px] -mr-64 -mt-64"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold opacity-10 blur-[80px] -ml-32 -mb-32"></div>
        </section>

        {/* Activity Feed */}
        <section className="bg-white rounded-[48px] border border-slate-100 shadow-premium p-10 lg:p-14">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-2xl font-serif font-bold text-navy tracking-tight">Recent Compliance Events</h4>
            <button className="text-primary font-bold text-sm hover:underline">View All Activity</button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((event, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-6">
                  <div className={`w-3 h-3 rounded-full ${event.status === 'success' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'}`}></div>
                  <p className="text-navy font-bold text-lg">
                    {event.user} <span className="text-slate-500 font-normal">{event.action}</span>
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-400 tabular-nums">{event.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  )
}

export default AdminDashboard
