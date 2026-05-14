import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, ShieldAlert, Check, Calendar, Award, Building } from 'lucide-react'

const Verify = () => {
  const { certificateId } = useParams()
  const [cert, setCert] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock verification
    setTimeout(() => {
      if (certificateId === 'CP-2025-A7K2M9XQ') {
        setCert({
          id: certificateId,
          learner: 'Jane Doe',
          course: 'Infection Control 2025',
          date: 'May 14, 2025',
          hours: 2.0,
          facility: 'Pine Haven Skilled Nursing',
          ref: '42 CFR §483.80'
        })
      }
      setIsLoading(false)
    }, 1000)
  }, [certificateId])

  if (isLoading) return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6 text-white">
      <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
      <p className="font-serif italic">Verifying credential ID...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="bg-gradient-to-br from-navy to-navy-light p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <span className="text-3xl font-bold">C</span>
          </div>
          <h1 className="text-xl font-serif font-bold">ClearPass Academy</h1>
          <p className="text-white/60 text-xs uppercase tracking-widest mt-1">Credential Verification Portal</p>
        </div>

        <div className="p-10">
          {cert ? (
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-green-50 text-green-600 rounded-full mb-4 ring-8 ring-green-50/50">
                  <ShieldCheck size={48} />
                </div>
                <h2 className="text-2xl font-bold text-green-600">Valid & Authentic</h2>
                <p className="text-slate-500 text-sm mt-1">This certificate was issued by ClearPass Academy</p>
              </div>

              <div className="grid grid-cols-1 gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <Award className="text-gold mt-1 shrink-0" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Learner</p>
                    <p className="text-lg font-serif font-bold text-navy">{cert.learner}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Check className="text-primary mt-1 shrink-0" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course Completed</p>
                    <p className="font-bold text-navy">{cert.course}</p>
                    <p className="text-xs text-slate-500">{cert.ref}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-4">
                    <Calendar className="text-slate-400 mt-1 shrink-0" size={20} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                      <p className="text-sm font-bold text-navy">{cert.date}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Building className="text-slate-400 mt-1 shrink-0" size={20} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility</p>
                      <p className="text-sm font-bold text-navy">{cert.facility}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Certificate ID</p>
                <span className="px-4 py-2 bg-gold-light text-navy font-mono font-bold rounded-lg border border-gold/20">
                  {cert.id}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="p-4 bg-rose-50 text-rose-600 rounded-full mb-4 inline-block">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-2xl font-bold text-rose-600">Verification Failed</h2>
              <p className="text-slate-500 mt-2 px-10">No certificate with ID <strong>{certificateId}</strong> was found in our secure records.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-8 px-6 py-2 bg-navy text-white font-bold rounded-xl"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Verified by ClearPass Academy · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Verify
