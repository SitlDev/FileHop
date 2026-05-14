import React from 'react'
import Shell from '../components/layout/Shell'
import { Download, Printer, ExternalLink, ShieldCheck } from 'lucide-react'

const certificates = [
  {
    id: 'CP-2025-A7K2M9XQ',
    course: 'Infection Control 2025',
    date: 'May 14, 2025',
    hours: 2.0,
    score: 95
  }
]

const Certificates = () => {
  return (
    <Shell>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-navy">My Certificates</h1>
          <p className="text-slate-500 mt-1">Verified proof of your clinical compliance training</p>
        </div>

        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {certificates.map((cert) => (
              <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
                <div className="p-8 flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                      <ShieldCheck size={18} />
                    </span>
                    <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Verified & Authentic</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-navy mb-1">{cert.course}</h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</span>
                      <span className="text-sm font-bold text-navy">{cert.date}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CE Hours</span>
                      <span className="text-sm font-bold text-navy">{cert.hours} Hours</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                      <span className="text-sm font-bold text-navy">{cert.score}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Certificate ID</span>
                      <span className="text-sm font-mono font-bold text-primary">{cert.id}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-8 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center gap-3">
                  <button className="w-full md:w-48 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-navy font-bold rounded-xl hover:bg-gray-100 transition-all">
                    <Printer size={16} /> Print View
                  </button>
                  <button className="w-full md:w-48 flex items-center justify-center gap-2 px-4 py-3 bg-navy text-white font-bold rounded-xl hover:shadow-lg transition-all">
                    <Download size={16} /> Download PDF
                  </button>
                  <button className="w-full md:w-48 flex items-center justify-center gap-2 px-4 py-2 text-primary font-bold text-sm hover:underline">
                    <ExternalLink size={14} /> Verification Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center">
            <div className="text-slate-300 mb-4 flex justify-center">
              <ShieldCheck size={48} />
            </div>
            <h3 className="text-xl font-bold text-navy mb-2">No certificates yet</h3>
            <p className="text-slate-500 mb-8">Complete your first course and pass the quiz to earn a certificate.</p>
            <Link to="/catalog" className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </Shell>
  )
}

export default Certificates
