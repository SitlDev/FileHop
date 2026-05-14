import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { lessonData, quizData } from '../utils/SeedData'
import { CheckCircle, ChevronLeft, ChevronRight, Play, BookOpen, FileText } from 'lucide-react'

const CoursePlayer = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [completedLessons, setCompletedLessons] = useState([])
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizResult, setQuizResult] = useState(null)

  const lessons = lessonData[courseId] || []
  const currentLesson = lessons[currentLessonIndex]
  const quizQuestions = quizData[courseId] || []
  
  const progress = Math.round(((completedLessons.length) / (lessons.length + 1)) * 100)

  const handleNext = () => {
    if (!completedLessons.includes(currentLesson.id)) {
      setCompletedLessons([...completedLessons, currentLesson.id])
    }
    
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1)
      window.scrollTo(0, 0)
    } else {
      setShowQuiz(true)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleQuizSubmit = () => {
    let correctCount = 0
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answer) {
        correctCount++
      }
    })
    
    const score = Math.round((correctCount / quizQuestions.length) * 100)
    const passed = score >= 80
    setQuizResult({ score, passed })
    
    if (passed) {
      setCompletedLessons([...completedLessons, 'quiz'])
    }
  }

  if (!currentLesson && !showQuiz) return <div className="p-20 text-center">Course not found</div>

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between shadow-lg z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/catalog" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Course Player</h1>
            <h2 className="text-lg font-serif font-bold leading-tight">
              {showQuiz ? 'Final Knowledge Check' : currentLesson.title}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Progress: {progress}%</span>
            <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/catalog')}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
          >
            EXIT
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-20">
          <div className="max-w-3xl mx-auto">
            {showQuiz ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center mb-12">
                  <span className="inline-block p-3 bg-gold-light rounded-2xl text-gold mb-4">
                    <FileText size={32} />
                  </span>
                  <h2 className="text-4xl font-serif font-bold text-navy mb-2">Knowledge Check</h2>
                  <p className="text-slate-500">Score 80% or higher to earn your certificate.</p>
                </div>

                {quizResult ? (
                  <div className="space-y-10">
                    <div className={`p-8 rounded-2xl border-2 text-center animate-in zoom-in-95 ${quizResult.passed ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
                      <h3 className={`text-5xl font-bold mb-2 ${quizResult.passed ? 'text-green-600' : 'text-rose-600'}`}>
                        {quizResult.score}%
                      </h3>
                      <p className="text-xl font-bold text-navy mb-6">
                        {quizResult.passed ? 'Congratulations! You passed.' : 'Please review and try again.'}
                      </p>
                      {quizResult.passed && (
                        <Link to="/certificates" className="inline-block px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                          View My Certificate
                        </Link>
                      )}
                    </div>

                    <div className="space-y-8">
                      <h4 className="text-lg font-bold text-navy border-b pb-2">Review Your Answers</h4>
                      {quizQuestions.map((q, idx) => {
                        const isCorrect = quizAnswers[idx] === q.answer
                        return (
                          <div key={idx} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-white border-green-100' : 'bg-rose-50/50 border-rose-100'}`}>
                            <p className="font-bold text-navy mb-4">
                              <span className={isCorrect ? 'text-green-600' : 'text-rose-600'}>
                                {isCorrect ? '✓' : '✗'} Q{idx + 1}.
                              </span> {q.question}
                            </p>
                            <div className="grid grid-cols-1 gap-2 mb-4">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className={`p-3 rounded-lg text-sm ${
                                  optIdx === q.answer ? 'bg-green-500 text-white font-bold' : 
                                  optIdx === quizAnswers[idx] ? 'bg-rose-500 text-white font-bold' : 'bg-gray-50 text-slate-400'
                                }`}>
                                  {opt}
                                </div>
                              ))}
                            </div>
                            <div className={`p-4 rounded-xl text-sm ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-rose-50 text-rose-800'}`}>
                              <p className="font-bold mb-1">Explanation:</p>
                              {q.explanation}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {!quizResult.passed && (
                      <button 
                        onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                        className="w-full py-5 bg-navy text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-10">
                    {quizQuestions.map((q, idx) => (
                      <div key={idx} className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-lg font-bold text-navy leading-tight">
                          <span className="text-primary mr-2">Q{idx + 1}.</span> {q.question}
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                          {q.options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={() => setQuizAnswers({ ...quizAnswers, [idx]: optIdx })}
                              className={`text-left p-4 rounded-xl border-2 transition-all font-medium ${
                                quizAnswers[idx] === optIdx 
                                  ? 'bg-primary text-white border-primary shadow-md' 
                                  : 'bg-white text-navy border-white hover:border-gray-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                      className="w-full py-5 bg-primary text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Evaluation
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <article className="prose prose-slate max-w-none animate-in fade-in duration-500">
                <div className="mb-10">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest mb-2 block">
                    Lesson {currentLessonIndex + 1} of {lessons.length}
                  </span>
                  <h2 className="text-4xl font-serif font-bold text-navy leading-tight">{currentLesson.title}</h2>
                </div>
                
                <div 
                  className="text-slate-700 leading-relaxed space-y-6 text-lg"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                />

                <div className="mt-16 pt-10 border-t border-gray-100 flex justify-between items-center">
                  <button 
                    onClick={handleBack}
                    disabled={currentLessonIndex === 0}
                    className="flex items-center gap-2 px-6 py-3 text-navy font-bold rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-20"
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>
                  <button 
                    onClick={handleNext}
                    className="flex items-center gap-2 px-10 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    {currentLessonIndex === lessons.length - 1 ? 'Start Final Quiz' : 'Next Lesson'} <ChevronRight size={18} />
                  </button>
                </div>
              </article>
            )}
          </div>
        </main>

        {/* Sidebar Outline */}
        <aside className="hidden lg:flex w-80 bg-gray-50 border-l border-gray-100 flex-col shrink-0 overflow-y-auto">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-navy uppercase text-xs tracking-widest mb-4">Course Content</h3>
            <div className="space-y-2">
              {lessons.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  onClick={() => { setCurrentLessonIndex(idx); setShowQuiz(false); }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                    idx === currentLessonIndex && !showQuiz ? 'bg-white shadow-sm ring-1 ring-black/5' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className={`mt-0.5 rounded-full p-0.5 ${completedLessons.includes(lesson.id) ? 'text-green-500' : 'text-slate-300'}`}>
                    <CheckCircle size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${idx === currentLessonIndex && !showQuiz ? 'text-primary' : 'text-navy'}`}>
                      {idx + 1}. {lesson.title}
                    </p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => { if (completedLessons.length >= lessons.length) setShowQuiz(true); }}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                  showQuiz ? 'bg-white shadow-sm ring-1 ring-black/5' : completedLessons.length >= lessons.length ? 'hover:bg-gray-100' : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div className={`mt-0.5 rounded-full p-0.5 ${completedLessons.includes('quiz') ? 'text-green-500' : 'text-slate-300'}`}>
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${showQuiz ? 'text-primary' : 'text-navy'}`}>
                    Knowledge Check
                  </p>
                </div>
              </button>
            </div>
          </div>
          
          <div className="p-6 mt-auto">
            <div className="bg-navy p-4 rounded-xl text-white">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Support</p>
              <p className="text-xs leading-relaxed">Need help with this course? Contact your facility administrator.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CoursePlayer
