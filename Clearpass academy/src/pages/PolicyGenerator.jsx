import React, { useState } from 'react'
import Shell from '../components/layout/Shell'
import { FileText, Wand2, Copy, Printer, Download, Check } from 'lucide-react'

const PolicyGenerator = () => {
  const [selectedType, setSelectedType] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPolicy, setGeneratedPolicy] = useState('')
  const [copied, setCopied] = useState(false)

  const policyTypes = [
    { id: 'abuse', title: 'Abuse Prevention', ref: '§483.12', icon: '🛡️' },
    { id: 'pressure', title: 'Pressure Injury', ref: '§483.25(b)', icon: '🩹' },
    { id: 'infection', title: 'Infection Control', ref: '§483.80', icon: '🧼' },
    { id: 'antipsychotic', title: 'Antipsychotic GDR', ref: '§483.45(d)', icon: '💊' },
    { id: 'careplan', title: 'Care Planning', ref: '§483.21', icon: '📋' },
    { id: 'rights', title: 'Resident Rights', ref: '§483.10', icon: '⚖️' },
    { id: 'mds', title: 'MDS Accuracy', ref: '§483.20', icon: '📊' },
    { id: 'staffing', title: 'Staffing Standards', ref: '§483.35', icon: '👥' },
    { id: 'qapi', title: 'QAPI Program', ref: '§483.75', icon: '📈' },
    { id: 'advance', title: 'Advance Directives', ref: 'Part 489', icon: '📝' },
    { id: 'compliance', title: 'Compliance Program', ref: '§483.85', icon: '🤝' },
    { id: 'falls', title: 'Falls Prevention', ref: '§483.25(d)', icon: '🚶' }
  ]

  const handleGenerate = () => {
    if (!selectedType) return
    setIsGenerating(true)
    setGeneratedPolicy('')

    // Mock generation
    setTimeout(() => {
      setGeneratedPolicy(`
POLICY NUMBER: POL-2025-${selectedType.id.toUpperCase()}
POLICY TITLE: ${selectedType.title}
REGULATORY REFERENCE: ${selectedType.ref}
EFFECTIVE DATE: May 14, 2025

PURPOSE:
To ensure the facility maintains compliance with CMS federal regulations regarding ${selectedType.title.toLowerCase()} and provides the highest quality of care to all residents.

SCOPE:
This policy applies to all facility staff, contractors, and volunteers.

POLICY STATEMENT:
The facility shall establish and maintain a comprehensive program for ${selectedType.title.toLowerCase()} that includes assessment, intervention, documentation, and ongoing monitoring.

PROCEDURES:
1. Initial assessment shall be conducted upon admission...
2. Staff shall be trained annually on ${selectedType.title.toLowerCase()} protocols...
3. Documentation must be completed in the EMR within 2 hours of any event...
4. The Director of Nursing shall review all incidents weekly...
      `)
      setIsGenerating(false)
    }, 2000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPolicy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Shell>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-navy">Policy Generator</h1>
          <p className="text-slate-500 mt-1">Generate CMS-compliant policy drafts in seconds using AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Selector */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-navy uppercase tracking-widest mb-4">Select Policy Type</h3>
              <div className="grid grid-cols-1 gap-3">
                {policyTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      selectedType?.id === type.id 
                        ? 'bg-primary-light border-primary shadow-sm' 
                        : 'bg-white border-transparent hover:border-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy text-sm leading-tight">{type.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{type.ref}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={!selectedType || isGenerating}
                className="w-full mt-6 py-4 bg-navy text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-navy-light transition-all disabled:opacity-50 shadow-lg"
              >
                {isGenerating ? 'Generating...' : <><Wand2 size={18} /> Generate Draft</>}
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col min-h-[500px]">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Document Preview</span>
                </div>
                {generatedPolicy && (
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors title='Copy'">
                      {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                    <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors">
                      <Printer size={18} />
                    </button>
                    <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors">
                      <Download size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 p-8 overflow-y-auto">
                {isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 animate-pulse font-medium">Claude is drafting your policy based on latest CMS guidance...</p>
                  </div>
                ) : generatedPolicy ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm text-navy leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100">
                    {generatedPolicy}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30">
                    <FileText size={64} className="mb-4 text-slate-300" />
                    <p className="text-lg font-bold text-navy">No Document Generated</p>
                    <p className="text-sm">Select a policy type on the left to begin.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

export default PolicyGenerator
