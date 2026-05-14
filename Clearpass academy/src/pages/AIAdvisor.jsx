import React, { useState } from 'react'
import Shell from '../components/layout/Shell'
import { Send, Bot, User, AlertTriangle, Sparkles } from 'lucide-react'

const AIAdvisor = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your ClearPass Compliance Advisor. How can I help you with SNF regulations or clinical documentation today?" }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const quickPrompts = [
    "What F-tags are most commonly cited in SNF surveys?",
    "How do I document an unavoidable pressure injury?",
    "Walk me through PDPM ICD-10 mapping for a hip fracture",
    "What are the October 2025 MDS v3.10 changes?",
    "What triggers Immediate Jeopardy?",
    "What are §483.85 mandatory compliance program elements?"
  ]

  const handleSend = async (text = input) => {
    if (!text.trim()) return
    
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    // Mock API call reflecting the specific system prompt in the instructions
    setTimeout(() => {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: `As a CMS SNF compliance expert, I recommend referencing the State Operations Manual Appendix PP. Regarding ${text.toLowerCase()}, ensure your facility's policies align with the FY 2025–2026 SNF PPS final rules. Specifically, look into the relevant F-tag requirements for documentation accuracy.`
      }])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <Shell>
      <div className="h-full flex flex-col max-w-4xl mx-auto p-6">
        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3 items-start shadow-sm">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            <strong>DISCLAIMER:</strong> For training and educational reference only. Not legal or regulatory advice. 
            Always verify with current CMS State Operations Manual guidance for compliance decisions.
          </p>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col mb-4">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'assistant' ? 'bg-navy text-white' : 'bg-primary text-white'
                }`}>
                  {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'assistant' 
                    ? 'bg-gray-100 text-navy rounded-tl-none' 
                    : 'bg-primary text-white rounded-tr-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-navy text-white flex items-center justify-center shrink-0">
                  <Bot size={18} />
                </div>
                <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-6 py-4 border-t border-gray-50 flex gap-2 overflow-x-auto no-scrollbar">
            {quickPrompts.map(p => (
              <button 
                key={p}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-slate-600 rounded-full text-xs font-bold border border-gray-200 transition-all"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/30">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a compliance question..."
                className="w-full pl-4 pr-12 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm transition-all text-sm"
              />
              <button 
                onClick={() => handleSend()}
                className="absolute right-2 top-2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

export default AIAdvisor
