import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, BookOpen, Bot, Award } from 'lucide-react'

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 grad-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg">C</div>
            <span className="text-2xl font-serif font-bold text-navy tracking-tight">ClearPass <span className="text-primary">Academy</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#courses" className="hover:text-primary transition-colors">Courses</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <Link to="/login" className="px-6 py-2.5 grad-primary text-white rounded-full font-bold shadow-premium hover:shadow-hover">
              Portal Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <span className="inline-block px-4 py-1 bg-primary-light text-primary rounded-full text-xs font-bold uppercase tracking-widest border border-primary/10">
              CMS Compliance Reinvented
            </span>
            <h1 className="text-5xl lg:text-7xl font-serif font-bold text-navy leading-[1.1]">
              SNF Training with <br/>
              <span className="text-primary italic">Tactical</span> Intelligence.
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
              The only platform combining accredited LMS courses with real-time AI compliance advising and policy generation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/signup" className="px-10 py-5 grad-primary text-white font-bold rounded-2xl shadow-premium hover:shadow-hover text-lg text-center">
                Start 14-Day Free Trial
              </Link>
              <a href="#demo" className="px-10 py-5 bg-white border border-slate-200 text-navy font-bold rounded-2xl hover:bg-slate-50 transition-all text-lg text-center">
                Watch Demo
              </a>
            </div>
            <div className="flex items-center gap-6 pt-8 grayscale opacity-50">
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/CMS_Logo.png" alt="CMS" className="h-8 object-contain" />
              <div className="h-6 w-px bg-slate-200"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compliant with 42 CFR §483</p>
            </div>
          </div>
          
          <div className="relative lg:h-[600px] animate-in fade-in zoom-in-95 duration-1000 delay-300">
            <div className="absolute inset-0 grad-primary rounded-[40px] rotate-3 opacity-5"></div>
            <div className="relative h-full w-full rounded-[40px] overflow-hidden shadow-2xl border border-slate-100">
              <img 
                src="nurse_at_station_real_1778799116169.png" 
                alt="Professional nurse at station" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-8 left-8 right-8 glass p-6 rounded-3xl animate-float">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">Facility Compliance Score</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[94%]"></div>
                      </div>
                      <span className="text-xs font-black text-green-600">94%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-navy mb-6">Beyond Simple Training</h2>
            <p className="text-lg text-slate-600">We bridge the gap between "watching a video" and "staying compliant" with tools designed for the modern SNF administrator.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[32px] shadow-premium shadow-hover border border-slate-100 group">
              <div className="w-16 h-16 grad-primary rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform">
                <BookOpen size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-navy mb-4">Accredited Catalog</h3>
              <p className="text-slate-600 leading-relaxed">13+ core courses covering every F-tag requirement with automated quiz scoring and tracking.</p>
            </div>
            <div className="bg-white p-10 rounded-[32px] shadow-premium shadow-hover border border-slate-100 group">
              <div className="w-16 h-16 grad-gold rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform">
                <Bot size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-navy mb-4">AI Advisor</h3>
              <p className="text-slate-600 leading-relaxed">Real-time Claude-powered assistance for complex documentation and survey preparation questions.</p>
            </div>
            <div className="bg-white p-10 rounded-[32px] shadow-premium shadow-hover border border-slate-100 group">
              <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform">
                <Award size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-navy mb-4">Smart Certificates</h3>
              <p className="text-slate-600 leading-relaxed">QR-code verified credentials that link directly to your facility's public verification portal.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
