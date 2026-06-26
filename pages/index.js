import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function Home() {
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' or 'text'
  const [resumeText, setResumeText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roastResult, setRoastResult] = useState('');
  const [score, setScore] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  const minChars = 200;
  const maxChars = 5000;
  const charsCount = resumeText.trim().length;
  const isTextValid = charsCount >= minChars && charsCount <= maxChars;
  const isFileValid = selectedFile !== null;

  const isSubmitDisabled = loading || (activeTab === 'pdf' ? !isFileValid : !isTextValid);

  // Predefined Sample Resume to test
  const SAMPLE_RESUME = `JOHN DOE
Full Stack Software Engineer | john.doe@email.com | +1-234-567-8910 | github.com/johndoe | linkedin.com/in/johndoe

SUMMARY:
Highly motivated Software Engineer with 3+ years of experience building web applications using React, Node.js, and SQL databases. Skilled in creating scalable backend systems and responsive user interfaces.

EXPERIENCE:
Software Developer | Tech Corp Inc. | Jan 2024 - Present
- Designed and built microservices using Node.js and Express, improving system throughput by 15%.
- Led a team of 3 developers to migrate a legacy codebase to Next.js, resulting in a 40% improvement in page loading performance.
- Collaborated with product designers to implement responsive, pixel-perfect user interfaces in Tailwind CSS.

Junior Developer | WebSolutions LLC | Jun 2022 - Dec 2023
- Developed and maintained company website features using JavaScript, HTML, and CSS.
- Wrote automated unit tests using Jest, achieving a 90% code coverage across core API services.
- Managed deployments using GitHub Actions and AWS EC2 instances, ensuring 99.9% application uptime.

EDUCATION:
Bachelor of Science in Computer Science | State University | Graduated May 2022

SKILLS:
- Languages: JavaScript, TypeScript, Python, HTML, CSS, SQL
- Frameworks: React, Next.js, Node.js, Express, Tailwind CSS
- Tools & Databases: PostgreSQL, MongoDB, Git, Docker, AWS, Jest`;

  const handleTrySample = () => {
    setActiveTab('text');
    setResumeText(SAMPLE_RESUME);
    setErrorMsg('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setErrorMsg('');
      } else {
        setErrorMsg('Only PDF files are supported.');
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setErrorMsg('');
      } else {
        setErrorMsg('Only PDF files are supported.');
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleRoastSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setLoading(true);
    setErrorMsg('');
    setRoastResult('');
    setScore(null);

    try {
      let response;

      if (activeTab === 'pdf') {
        const formData = new FormData();
        formData.append('resume', selectedFile);

        response = await fetch('/api/roast', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/roast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resume: resumeText }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate roast.');
      }

      setRoastResult(data.roast);
      setScore(data.score || 0);

      // Smooth scroll to results once loaded
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Safe bold markdown parser
  const parseBoldText = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-slate-200">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Custom formatted renderer
  const renderFormattedRoast = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const content = line.trim();
      if (content.startsWith('###')) {
        return <h3 key={idx} className="text-lg font-bold mt-5 mb-2 text-indigo-400">{parseBoldText(content.replace('###', '').trim())}</h3>;
      } else if (content.startsWith('##')) {
        return <h2 key={idx} className="text-xl font-bold mt-7 mb-3 text-slate-100 border-b border-slate-800 pb-2">{parseBoldText(content.replace('##', '').trim())}</h2>;
      } else if (content.startsWith('#')) {
        return <h1 key={idx} className="text-2xl font-extrabold mt-8 mb-4 text-slate-100">{parseBoldText(content.replace('#', '').trim())}</h1>;
      } else if (content.startsWith('-') || content.startsWith('*')) {
        return (
          <li key={idx} className="ml-5 list-disc text-slate-300 my-2 leading-relaxed">
            {parseBoldText(content.replace(/^[-*]\s*/, ''))}
          </li>
        );
      } else if (/^\d+\./.test(content)) {
        return (
          <div key={idx} className="ml-5 text-slate-300 my-2 leading-relaxed">
            {parseBoldText(content)}
          </div>
        );
      } else if (content === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-slate-350 my-2 leading-relaxed whitespace-pre-wrap">{parseBoldText(content)}</p>;
    });
  };

  // Helper score tone
  const getScoreInfo = (s) => {
    if (s < 30) return { tone: 'Critically Terrible', color: 'text-red-500', stroke: '#EF4444' };
    if (s < 40) return { tone: 'Brutally Honest', color: 'text-rose-500', stroke: '#F43F5E' };
    if (s < 50) return { tone: 'Highly Questionable', color: 'text-amber-500', stroke: '#F59E0B' };
    return { tone: 'Slightly Mediocre', color: 'text-yellow-500', stroke: '#EAB308' };
  };

  const scoreInfo = score !== null ? getScoreInfo(score) : null;
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = score !== null ? circumference - (score / 100) * circumference : circumference;

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col items-center justify-between font-sans antialiased selection:bg-indigo-600 selection:text-white">
      <Head>
        <title>ResumeRoast.AI</title>
        <meta name="description" content="Upload your PDF or paste your resume text to get an instant, brutally honest AI roast alongside concrete tips to fix it." />
        <link rel="icon" href="/favicon.ico?v=2" />
      </Head>

      {/* Header / Brand */}
      <header className="w-full max-w-7xl px-6 py-6 flex items-center justify-between border-b border-slate-900/60 backdrop-blur-sm sticky top-0 z-50 bg-[#070913]/85">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2.5 cursor-pointer"
        >
          <motion.img 
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            whileHover={{ rotate: 15 }}
            transition={{ type: "spring", stiffness: 300 }}
            src="/profile.png?v=2" alt="Profile" className="w-8 h-8 rounded-full border border-indigo-500/20 shadow-sm" 
          />
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            ResumeRoast.AI
          </span>
        </motion.div>
        
        {/* Nav links removed */}
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl px-6 py-12 lg:py-20 flex flex-col justify-center">
        
        {/* Two-Column Hero and Action Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Hero Text */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }} 
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span>Free • No signup required • Instant results</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-slate-100">
              Get Your Resume <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-600 bg-clip-text text-transparent">Roasted</span>
            </h1>
            
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl">
              The free AI resume roaster that gives you brutally honest feedback in seconds. Upload your resume or CV and get instant professional critique with ATS optimization to land more interviews.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => {
                  setActiveTab('pdf');
                  fileInputRef.current?.click();
                }}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/15 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload Resume</span>
              </button>
              
              <button 
                onClick={handleTrySample}
                className="px-6 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-[0.98] text-slate-300 hover:text-slate-200 font-semibold rounded-xl transition"
              >
                Try Sample Resume
              </button>
            </div>
          </motion.div>

          {/* Right Column: Upload Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.2 }} 
            className="lg:col-span-5"
          >
            <div className="glass-card rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-slate-800/80">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-60" />
              
              {/* Tab Toggles */}
              <div className="flex border-b border-slate-800/60 pb-3 mb-6">
                <button
                  type="button"
                  id="tab-pdf"
                  className={`flex-1 text-center py-2.5 text-sm font-semibold border-b-2 transition ${
                    activeTab === 'pdf'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                  onClick={() => {
                    setActiveTab('pdf');
                    setErrorMsg('');
                  }}
                  disabled={loading}
                >
                  Upload PDF
                </button>
                <button
                  type="button"
                  id="tab-text"
                  className={`flex-1 text-center py-2.5 text-sm font-semibold border-b-2 transition ${
                    activeTab === 'text'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                  onClick={() => {
                    setActiveTab('text');
                    setErrorMsg('');
                  }}
                  disabled={loading}
                >
                  Paste Text
                </button>
              </div>

              {/* Form Submission */}
              <form onSubmit={handleRoastSubmit} className="space-y-4">
                
                {/* Tab 1: PDF File Selector */}
                {activeTab === 'pdf' && (
                  <div className="space-y-3">
                    {!selectedFile ? (
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={onButtonClick}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[220px] ${
                          dragActive 
                            ? 'border-indigo-500 bg-indigo-500/5' 
                            : 'border-slate-800 hover:border-indigo-500/50 bg-[#0c0f1d]/50 hover:bg-[#101426]/50'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={loading}
                        />
                        
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 mb-4">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        
                        <p className="text-sm font-semibold text-slate-200 text-center">
                          Drop your resume here
                        </p>
                        <p className="text-xs text-slate-400 mt-1 text-center">
                          or click to browse
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-4 uppercase tracking-wider">
                          PDF files up to 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="border border-slate-800 bg-[#0c0f1d]/50 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium text-slate-200 truncate pr-2">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatBytes(selectedFile.size)}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
                          title="Remove file"
                          disabled={loading}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    <p className="text-[10px] text-slate-500 text-center">
                      By uploading, you agree to our terms of service.
                    </p>
                  </div>
                )}

                {/* Tab 2: Resume Raw Text Box */}
                {activeTab === 'text' && (
                  <div className="space-y-2">
                    <textarea
                      id="resume-text-area"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste the raw text of your resume here... (Experience, skills, summary, etc.)"
                      className="w-full h-[220px] bg-[#0c0f1d]/50 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 resize-none outline-none transition leading-relaxed"
                      disabled={loading}
                      maxLength={maxChars}
                    />
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Min. {minChars} / Max. {maxChars} characters</span>
                      <span className={`font-semibold ${isTextValid ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {charsCount} / {maxChars} chars
                      </span>
                    </div>
                  </div>
                )}

                {/* Submission Error Banner */}
                {errorMsg && (
                  <div className="p-3.5 bg-red-950/30 border border-red-900/60 rounded-xl text-red-400 text-xs font-medium leading-relaxed">
                    ⚠️ {errorMsg}
                  </div>
                )}

                {/* Action Trigger Button */}
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold tracking-wide transition duration-200 flex items-center justify-center space-x-2 ${
                    isSubmitDisabled
                      ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15 active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Analyzing Resume...</span>
                    </>
                  ) : (
                    <>
                      <span>🔥 Roast My Resume</span>
                    </>
                  )}
                </button>

              </form>
            </div>
          </motion.div>

        </div>

        {/* Corporate Trust Badges Section Removed */}

        {/* Results / Roast Report Section */}
        {roastResult && (
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            ref={resultsRef}
            className="w-full mt-24 glass-card border border-indigo-500/20 rounded-2xl p-6 md:p-8 shadow-2xl fade-in relative overflow-hidden"
          >
            {/* Colorful top border line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
            
            {/* Report Header: Brand audit status & Score Circle */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <span className="text-xs font-bold tracking-widest uppercase bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                    Audit Report
                  </span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-100">
                  🔥 The Roast Report
                </h2>
                <p className="text-xs text-slate-500">
                  AI analysis generated successfully. Feedback intent is critical/roast.
                </p>
              </div>

              {score !== null && scoreInfo && (
                <div className="flex items-center space-x-4 bg-[#0a0f21]/60 border border-slate-800/80 rounded-xl px-4 py-3">
                  {/* Gauge Circle */}
                  <div className="relative flex items-center justify-center h-16 w-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        className="stroke-slate-800"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke={scoreInfo.stroke}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <span className="absolute text-sm font-extrabold text-slate-100">
                      {score}
                    </span>
                  </div>

                  {/* Score Tagline */}
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Resume Score
                    </p>
                    <p className={`text-sm font-extrabold ${scoreInfo.color}`}>
                      {scoreInfo.tone}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Roast Report Body */}
            <div className="space-y-4 pt-6 text-sm md:text-base leading-relaxed">
              {renderFormattedRoast(roastResult)}
            </div>

            {/* Actions list visual accent box */}
            <div className="mt-8 p-4 bg-indigo-950/10 border border-indigo-500/10 rounded-xl flex items-start space-x-3">
              <span className="text-indigo-400 mt-0.5 text-lg">💡</span>
              <div>
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Important Next Step
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Review the recommendations highlighted in the roast analysis above. Edit your resume to address these action points, then drop it back in for a fresh re-grade.
                </p>
              </div>
            </div>
          </motion.section>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl px-6 py-8 border-t border-slate-900/60 flex flex-col items-center justify-center space-y-2 text-xs text-slate-600 font-medium">
        <p>© {new Date().getFullYear()} ResumeRoast.AI. Built with professional critique. All rights reserved.</p>
        <p className="flex items-center space-x-1.5 pt-1">
          <span>Created by</span>
          <a href="https://my-portfolio-eta-three-95.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-400 font-bold transition flex items-center space-x-1 group">
            <span>PRANAV</span>
            <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition -translate-x-2 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </p>
      </footer>
    </div>
  );
}
