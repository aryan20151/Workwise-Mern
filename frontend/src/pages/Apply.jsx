import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiFileText, FiUser, FiMail, FiBriefcase, FiAlertCircle, FiCheckCircle, FiCpu, FiZap, FiCheck, FiX, FiAward, FiSend } from 'react-icons/fi';

const Apply = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [skills, setSkills] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // AI Assistant States
  const [isAnalyzingAts, setIsAnalyzingAts] = useState(false);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [atsResult, setAtsResult] = useState(null);

  // Auto-populate user details from AuthContext without extra API calls
  useEffect(() => {
    if (user) {
      if (user.username) setName(user.username);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    // 1. Check React Router location state (clean URL)
    if (location.state?.companyId && location.state?.companyName) {
      setCompanyId(location.state.companyId);
      setCompanyName(location.state.companyName);
      return;
    }

    // 2. Query params fallback
    const searchParams = new URLSearchParams(location.search);
    const queryCompanyId = searchParams.get('companyId');
    const queryCompanyName = searchParams.get('companyName');

    if (queryCompanyId && queryCompanyName) {
      setCompanyId(queryCompanyId);
      setCompanyName(decodeURIComponent(queryCompanyName));
    } else {
      // 3. Fallback to API check for session application data
      fetchSessionApplyData();
    }
  }, [location]);

  const fetchSessionApplyData = async () => {
    try {
      const response = await fetch('/api/apply/data');
      const result = await response.json();
      if (result.success && result.data) {
        setCompanyId(result.data.companyId || '');
        setCompanyName(result.data.companyName || '');
      } else {
        setError('No company details were found in the session. Please browse the companies page first.');
      }
    } catch (err) {
      console.error('Error fetching session apply data:', err);
      setError('Failed to retrieve company details. Please browse companies first.');
    }
  };

  // AI Feature 1: Analyze ATS Resume Compatibility with Gemini AI
  const handleAnalyzeAts = async () => {
    if (!skills || skills.trim().length < 3) {
      setError('Please enter your CV text or list your key skills in the text area below before running the AI ATS Match.');
      return;
    }

    setIsAnalyzingAts(true);
    setError('');
    try {
      const response = await fetch('/api/ai/match-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: companyName ? `Developer at ${companyName}` : 'Software Engineer',
          jobDescription: `Job posting at ${companyName}. Required: core engineering expertise, frameworks, and modern software development practices.`,
          userSkills: skills,
          resumeText: skills
        })
      });

      const data = await response.json();
      if (data.success && data.result) {
        setAtsResult(data.result);
      } else {
        setError(data.message || 'Failed to generate AI ATS analysis.');
      }
    } catch (err) {
      console.error('Error running AI ATS analysis:', err);
      setError('Error connecting to Gemini AI service.');
    } finally {
      setIsAnalyzingAts(false);
    }
  };

  // AI Feature 2: Generate Cover Letter with Gemini AI
  const handleGenerateCoverLetter = async () => {
    setIsGeneratingLetter(true);
    setError('');
    try {
      const response = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: 'Fullstack Software Engineer',
          companyName: companyName || 'Target Company',
          jobDescription: `Role at ${companyName} focused on fullstack web application development.`,
          userSkills: skills
        })
      });

      const data = await response.json();
      if (data.success && data.coverLetter) {
        setCoverLetter(data.coverLetter);
      } else {
        setError(data.message || 'Failed to generate AI Cover Letter.');
      }
    } catch (err) {
      console.error('Error generating cover letter:', err);
      setError('Error connecting to Gemini AI cover letter generator.');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const [isExtractingSkills, setIsExtractingSkills] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleExtractSkillsFromFile = async () => {
    if (!resumeFile) {
      setError('Please select/upload a CV or Resume file first.');
      return;
    }

    setIsExtractingSkills(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/ai/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: resumeFile.name,
          rawContent: resumeFile.name
        })
      });
      const data = await res.json();
      if (data.success && data.extractedSkills) {
        setSkills(data.extractedSkills);
        setSuccess(`Successfully extracted skills from ${resumeFile.name}!`);
      } else {
        setError('Failed to extract skills from the uploaded file.');
      }
    } catch (err) {
      console.error('Error extracting skills from file:', err);
      setError('Error parsing skills from CV file.');
    } finally {
      setIsExtractingSkills(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resumeFile) {
      setError('Please choose a resume file to upload.');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Upload the resume
      const fileData = new FormData();
      fileData.append('resume', resumeFile);

      const fileResponse = await fetch('/upload-resume', {
        method: 'POST',
        body: fileData
      });

      if (!fileResponse.ok) {
        const text = await fileResponse.text();
        throw new Error(text || 'Resume upload failed');
      }

      const fileResult = await fileResponse.json();
      if (!fileResult.success || !fileResult.filename) {
        throw new Error(fileResult.error || 'Failed to capture upload file path');
      }

      // Step 2: Add application to Cart
      const cartResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyId,
          companyName,
          name,
          email,
          resumePath: fileResult.filename,
          coverLetter
        })
      });

      const cartResult = await cartResponse.json();
      if (!cartResponse.ok || !cartResult.success) {
        throw new Error(cartResult.error || 'Failed to add application to cart');
      }

      setSuccess('Application submitted successfully! Redirecting to cart...');
      setTimeout(() => {
        navigate('/cart');
      }, 2000);

    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'An error occurred while submitting your application.');
      setIsLoading(false);
    }
  };

  if (isFetchingUser) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold animate-pulse">Initializing application form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-[calc(100vh-4rem)]">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8 space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full mb-3">
            <FiZap className="w-3.5 h-3.5" />
            <span>AI-Powered Application Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Application Form
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            Fill in your details, analyze your ATS score with Gemini AI, and apply seamlessly.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-800">Application Error</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              {error.includes('browse') && (
                <Link to="/companies" className="text-xs font-bold text-rose-700 underline mt-2 block">
                  Return to Companies Page
                </Link>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start gap-3">
            <FiCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Success</p>
              <p className="text-xs text-emerald-600 mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        {companyId && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Company Info Box */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-xl">
                  <FiBriefcase className="w-5 h-5" />
                  <span>{companyName}</span>
                </div>
                <p className="text-xs text-blue-100 mt-1">Position: Fullstack / Web Development Role</p>
              </div>
              <span className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold">
                Active Job Listing
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Full Name (Disabled & Auto-filled) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name (Account Auto-filled)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiUser className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={name}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed text-sm"
                    placeholder="Loading profile..."
                  />
                </div>
              </div>

              {/* Email Address (Disabled & Auto-filled) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address (Account Auto-filled)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiMail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    disabled
                    readOnly
                    value={email}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed text-sm"
                    placeholder="Loading email..."
                  />
                </div>
              </div>
            </div>

            {/* Candidate Key Skills & Resume Text */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Paste CV / Resume Text & Skills (Required for AI ATS Match)
              </label>
              <textarea
                rows={3}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="block w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-medium"
                placeholder="Paste your CV summary or list skills here (e.g. Fullstack Developer with expertise in React, Node.js, Express, MongoDB, JavaScript, Python, Tailwind CSS...)"
              />
            </div>

            {/* AI Smart Tools Box */}
            <div className="border border-indigo-100 bg-gradient-to-tr from-indigo-50/50 via-white to-blue-50/50 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <FiCpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Google Gemini AI Assistant</h3>
                    <p className="text-xs text-slate-500">Analyze ATS compatibility & generate cover letters in 1 click</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* AI Feature 1 Button */}
                  <button
                    type="button"
                    onClick={handleAnalyzeAts}
                    disabled={isAnalyzingAts}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <FiZap className="w-3.5 h-3.5" />
                    <span>{isAnalyzingAts ? 'Analyzing ATS...' : 'Check AI ATS Match'}</span>
                  </button>

                  {/* AI Feature 2 Button */}
                  <button
                    type="button"
                    onClick={handleGenerateCoverLetter}
                    disabled={isGeneratingLetter}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <FiZap className="w-3.5 h-3.5" />
                    <span>{isGeneratingLetter ? 'Generating Letter...' : 'AI Cover Letter'}</span>
                  </button>
                </div>
              </div>

              {/* AI ATS Result Display */}
              {atsResult && (
                <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FiAward className="w-5 h-5 text-indigo-600" />
                      <span className="text-sm font-bold text-slate-800">ATS Match Breakdown</span>
                    </div>
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 font-extrabold text-sm rounded-full">
                      {atsResult.score}% Compatibility
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{atsResult.summary}</p>

                  <div className="grid sm:grid-cols-2 gap-4 pt-1">
                    {/* Matched Skills */}
                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 mb-2">
                        <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Matched Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {atsResult.matchedSkills?.map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-100">
                      <span className="text-xs font-bold text-amber-800 flex items-center gap-1 mb-2">
                        <FiX className="w-3.5 h-3.5 text-amber-600" />
                        Missing Keywords
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {atsResult.missingSkills?.map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-semibold rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {atsResult.suggestions && (
                    <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 text-xs text-blue-900 space-y-1">
                      <span className="font-bold block text-blue-950 mb-1">💡 AI Recommendations:</span>
                      {atsResult.suggestions.map((s, idx) => (
                        <p key={idx} className="flex items-start gap-1.5">
                          <span>•</span>
                          <span>{s}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cover Letter Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Cover Letter (Optional / Auto-Generated)
              </label>
              <textarea
                rows={5}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="block w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                placeholder="Write or click 'AI Cover Letter' above to generate..."
              />
            </div>

            {/* Resume Upload Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Upload CV / Resume (PDF / DOCX)
                </label>
                {resumeFile && (
                  <button
                    type="button"
                    onClick={handleExtractSkillsFromFile}
                    disabled={isExtractingSkills}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <FiZap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isExtractingSkills ? 'Extracting...' : '✨ Extract Skills from CV'}</span>
                  </button>
                )}
              </div>
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50 hover:bg-blue-50/30 transition-all cursor-pointer relative">
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <FiFileText className="w-8 h-8 text-blue-600" />
                  <p className="text-sm font-semibold text-slate-700">
                    {resumeFile ? `📄 Selected: ${resumeFile.name}` : 'Click or drag file to upload'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {resumeFile ? 'Click "✨ Extract Skills from CV" button above to populate skills!' : 'PDF, DOC, DOCX up to 5MB'}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Application Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 text-base active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <span>Submitting Application...</span>
              ) : (
                <>
                  <FiSend className="w-5 h-5" />
                  <span>Submit Application to {companyName}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Apply;
