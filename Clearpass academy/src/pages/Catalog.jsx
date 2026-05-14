import React from 'react'
import Shell from '../components/layout/Shell'
import { Link } from 'react-router-dom'

import { catalogCourses as courses } from '../utils/SeedData'

const Catalog = () => {
  return (
    <Shell>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-navy">Course Catalog</h1>
            <p className="text-slate-500 mt-1">13 compliance courses available for your facility</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-100 shadow-sm overflow-x-auto max-w-full">
            <button className="px-4 py-2 bg-primary text-white rounded-md text-sm font-bold shrink-0">All</button>
            <button className="px-4 py-2 text-slate-500 hover:bg-gray-50 rounded-md text-sm font-medium shrink-0">Clinical</button>
            <button className="px-4 py-2 text-slate-500 hover:bg-gray-50 rounded-md text-sm font-medium shrink-0">Safety</button>
            <button className="px-4 py-2 text-slate-500 hover:bg-gray-50 rounded-md text-sm font-medium shrink-0">Legal</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-[32px] border border-slate-100 shadow-premium shadow-hover overflow-hidden flex flex-col group">
              <div className="h-48 bg-slate-50 relative overflow-hidden">
                <img 
                  src={
                    course.id === 'cp-ic' ? 'safety_real_thumb_1778799160653.png' : 
                    course.id === 'cp-adrd' || course.id === 'cp-rr' ? 'clinical_real_thumb_1778799130079.png' : 
                    'admin_real_thumb_1778799144394.png'
                  } 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  {course.plan === 'command' && <span className="bg-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Command</span>}
                  <span className="bg-white/80 backdrop-blur text-navy text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-100">1.0 HRS</span>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">{course.regulatory}</p>
                <h3 className="text-2xl font-serif font-bold text-navy mb-4 leading-tight group-hover:text-primary transition-colors">{course.title}</h3>
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm">{course.icon}</span>
                    <span className="text-xs font-bold text-slate-500">CMS ACCREDITED</span>
                  </div>
                  <Link 
                    to={`/course/${course.id}`}
                    className="px-6 py-2.5 grad-primary text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    Start Course
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

export default Catalog
