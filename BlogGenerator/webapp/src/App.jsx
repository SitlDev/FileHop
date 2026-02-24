import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Terminal, Search, Wand2, Key, LayoutGrid,
  Settings, Download, Eye, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp,
  Image as ImageIcon, DollarSign, CloudUpload,
  User, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Components ---

const Header = ({ status }) => (
  <header className="h-16 border-b border-border-dark flex items-center justify-between px-8 bg-panel-dark/50 backdrop-blur-md z-10">
    <div className="flex items-center gap-3">
      <Terminal className="text-brand-primary w-6 h-6" />
      <h1 className="font-bold text-xl tracking-tight">KnotStranded</h1>
      <span className="text-xs text-slate-500 ml-2">Web Edition</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-xs font-mono text-slate-400">{status}</div>
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span className="text-slate-400">Live</span>
      </div>
    </div>
  </header>
);

const App = () => {
  const [config, setConfig] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [status, setStatus] = useState('Idle');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(['movies', 'tv', 'celebrity', 'local']);
  const [aiProvider, setAiProvider] = useState('claude');
  const [numArticles, setNumArticles] = useState(3);
  const [temp, setTemp] = useState(0.7);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    fetchConfig();
    fetchCategories();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/config');
      setConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch config', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setStatus('Searching the web...');
    try {
      const res = await axios.post('/api/search', {
        provider: aiProvider,
        num_results: numArticles,
        categories: selectedCategories,
        query_filter: '',
        api_key: aiProvider === 'claude' ? config.anthropic_api_key : (aiProvider === 'gemini' ? config.gemini_api_key : config.openai_api_key)
      });
      setSearchResults(res.data.news_items || []);
      setStatus(`Found ${res.data.news_items?.length || 0} articles`);
    } catch (err) {
      console.error('Search failed', err);
      setStatus('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatus('Generating blog posts...');
    try {
      await axios.post('/api/generate', {
        selected_ids: Array.from(selectedIds),
        config: {
          ...config,
          ai_provider: aiProvider,
          temperature: temp,
          max_tokens: 2000
        }
      });

      // Poll for status
      const poll = setInterval(async () => {
        const res = await axios.get('/api/status');
        if (res.data.status === 'complete') {
          clearInterval(poll);
          setGeneratedFiles(res.data.generated_files);
          setStatus('Generation complete!');
          setIsGenerating(false);
        } else if (res.data.status === 'error') {
          clearInterval(poll);
          setStatus(`Error: ${res.data.error} `);
          setIsGenerating(false);
        }
      }, 2000);
    } catch (err) {
      console.error('Generation failed', err);
      setStatus('Generation failed');
      setIsGenerating(false);
    }
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="flex flex-col h-screen bg-bg-dark text-slate-100 antialiased">
      <Header status={status} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Panel */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {searchResults.length === 0 && !isSearching ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto text-center py-20"
              >
                <div className="mb-6 flex justify-center">
                  <div className="bg-brand-primary/20 p-6 rounded-full">
                    <Wand2 className="text-brand-primary w-16 h-16" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold mb-4 tracking-tight">AI Blog Factory</h2>
                <p className="text-lg text-slate-400 mb-8">
                  Search, generate, and monetize in seconds.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
                  {[
                    { icon: <Terminal className="w-5 h-5" />, title: 'Multi-AI', desc: 'Claude, Gemini, GPT' },
                    { icon: <Search className="w-5 h-5" />, title: 'Real-time', desc: 'Live web search' },
                    { icon: <ImageIcon className="w-5 h-5" />, title: 'AI Images', desc: 'DALL-E 3 visuals' },
                    { icon: <DollarSign className="w-5 h-5" />, title: 'Monetized', desc: 'Affiliate links' },
                    { icon: <User className="w-5 h-5" />, title: 'Persona', desc: 'Writer styles' },
                    { icon: <RefreshCw className="w-5 h-5" />, title: 'Admin', desc: 'Easy management' }
                  ].map((item, i) => (
                    <div key={i} className="bg-panel-dark border border-border-dark p-4 rounded-xl hover:border-brand-primary/50 transition-colors group">
                      <div className="text-brand-primary mb-2 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div className="font-bold text-sm mb-1">{item.title}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Search className="text-brand-primary" />
                    Search Results
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedIds(new Set(searchResults.map(a => a.id)))}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {searchResults.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => {
                        const next = new Set(selectedIds);
                        if (next.has(article.id)) next.delete(article.id);
                        else next.add(article.id);
                        setSelectedIds(next);
                      }}
                      className={`p - 4 rounded - xl border transition - all cursor - pointer group ${selectedIds.has(article.id)
                        ? 'bg-brand-primary/10 border-brand-primary shadow-lg shadow-brand-primary/5'
                        : 'bg-panel-dark border-border-dark hover:border-brand-primary/30'
                        } `}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt - 1 rounded - full p - 1 ${selectedIds.has(article.id) ? 'bg-brand-primary text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'} `}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                              {article.category}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{article.source}</span>
                          </div>
                          <h3 className="font-bold text-lg group-hover:text-brand-primary transition-colors">{article.title}</h3>
                          <p className="text-sm text-slate-400 mt-2 line-clamp-2">{article.snippet}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedIds.size > 0 && (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-6 bg-panel-dark border border-brand-primary/30 rounded-xl flex items-center justify-between sticky bottom-8 shadow-2xl backdrop-blur-md"
                  >
                    <div>
                      <h3 className="font-bold text-lg">Ready to Generate</h3>
                      <p className="text-sm text-slate-400 mt-1">{selectedIds.size} articles selected</p>
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="btn-primary"
                    >
                      {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                      Generate Blogs
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {generatedFiles.length > 0 && (
            <div className="mt-12 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="text-green-500" />
                Latest Generations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedFiles.map((file, i) => (
                  <div key={i} className="bg-panel-dark border border-border-dark p-4 rounded-xl flex items-center justify-between group hover:border-brand-primary/30 transition-all">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{file.writer.name}</span>
                      </div>
                      <h4 className="font-bold text-sm truncate">{file.title}</h4>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/ api / view / ${file.filename} `, '_blank')}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-brand-primary transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(`/ api / download / ${file.filename} `, '_blank')}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-green-500 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-80 border-l border-border-dark bg-panel-dark/30 backdrop-blur-xl p-6 flex flex-col gap-6 overflow-y-auto hide-scrollbar">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </h2>

            <div className="space-y-6">
              {/* Categories */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-3 block">Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {['movies', 'tv', 'music', 'celebrity', 'awards', 'streaming', 'books', 'gaming', 'local'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedCategories.includes(cat)
                        ? 'bg-brand-primary/20 border-brand-primary text-brand-primary'
                        : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Provider */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">AI Provider</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'claude', name: 'Claude', color: 'brand-primary' },
                    { id: 'gemini', name: 'Gemini', color: 'brand-gemini' },
                    { id: 'chatgpt', name: 'OpenAI', color: 'brand-openai' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setAiProvider(p.id)}
                      className={`px - 4 py - 3 rounded - xl flex items - center justify - between border transition - all ${aiProvider === p.id
                        ? `bg-panel-dark border-${p.color} ring-1 ring-${p.color}`
                        : 'bg-white/5 border-transparent hover:border-white/10'
                        } `}
                    >
                      <span className={`text - sm font - bold ${aiProvider === p.id ? `text-${p.color}` : 'text-slate-400'} `}>
                        {p.name}
                      </span>
                      {aiProvider === p.id && <CheckCircle2 className={`w - 4 h - 4 text - ${p.color} `} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Keys */}
              <div className="space-y-4">
                <div className="glass-panel p-4 pb-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">API Configuration</label>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="password"
                        placeholder="Anthropic Key"
                        value={config.anthropic_api_key || ''}
                        onChange={(e) => setConfig({ ...config, anthropic_api_key: e.target.value })}
                        className="w-full bg-bg-dark border border-border-dark rounded-lg px-3 py-2 text-xs focus:border-brand-primary outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Gemini Key"
                        value={config.gemini_api_key || ''}
                        onChange={(e) => setConfig({ ...config, gemini_api_key: e.target.value })}
                        className="w-full bg-bg-dark border border-border-dark rounded-lg px-3 py-2 text-xs focus:border-brand-gemini outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="OpenAI Key"
                        value={config.openai_api_key || ''}
                        onChange={(e) => setConfig({ ...config, openai_api_key: e.target.value })}
                        className="w-full bg-bg-dark border border-border-dark rounded-lg px-3 py-2 text-xs focus:border-brand-openai outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Local Pulse Settings */}
              <div className="space-y-4 pt-4 border-t border-border-dark">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-brand-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Local Intelligence</span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Override City/State</label>
                    <input
                      type="text"
                      value={config.custom_location || ''}
                      placeholder={config.detected_location || "City, State"}
                      onChange={(e) => setConfig({ ...config, custom_location: e.target.value })}
                      className="w-full bg-white/5 border border-border-dark rounded-lg p-2 text-xs focus:border-brand-primary outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Override Zip</label>
                    <input
                      type="text"
                      value={config.custom_zip || ''}
                      placeholder={config.postal_hint || "90210"}
                      onChange={(e) => setConfig({ ...config, custom_zip: e.target.value })}
                      className="w-full bg-white/5 border border-border-dark rounded-lg p-2 text-xs focus:border-brand-primary outline-none text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Articles</label>
                    <span className="text-xs font-mono text-brand-primary">{numArticles}</span>
                  </div>
                  <input
                    type="range" min="1" max="10"
                    value={numArticles}
                    onChange={(e) => setNumArticles(parseInt(e.target.value))}
                    className="w-full h-1 bg-border-dark rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Creativity</label>
                    <span className="text-xs font-mono text-brand-primary">{temp}</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(parseFloat(e.target.value))}
                    className="w-full h-1 bg-border-dark rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full py-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-2xl shadow-brand-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-auto"
          >
            {isSearching ? <RefreshCw className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            SEARCH NEWS
          </button>
        </aside>
      </div>
    </div>
  );
};

export default App;
