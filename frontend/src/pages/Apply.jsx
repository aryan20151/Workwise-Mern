import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FiFileText, FiUser, FiMail, FiBriefcase, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const Apply = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // 1. Get company details from URL Query Parameters
    const searchParams = new URLSearchParams(location.search);
    const queryCompanyId = searchParams.get('companyId');
    const queryCompanyName = searchParams.get('companyName');

    if (queryCompanyId && queryCompanyName) {
      setCompanyId(queryCompanyId);
      setCompanyName(decodeURIComponent(queryCompanyName));
      fetchUserDetails();
    } else {
      // 2. Fallback to API check for session application data
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
        fetchUserDetails();
      } else {
        setError('No company details were found in the session. Please browse the companies page first.');
        setIsFetchingUser(false);
      }
    } catch (err) {
      console.error('Error fetching session apply data:', err);
      setError('Failed to retrieve company details. Please browse companies first.');
      setIsFetchingUser(false);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const response = await fetch('/api/auth/user-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          setName(result.user.username || '');
          setEmail(result.user.email || '');
        }
      }
    } catch (err) {
      console.error('Error fetching user profile data:', err);
    } finally {
      setIsFetchingUser(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
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
          resumePath: fileResult.filename
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
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Application Form
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            Please fill in your details and upload your CV/resume to apply.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
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
          <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start gap-3">
            <FiCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Success</p>
              <p className="text-xs text-emerald-600 mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {/* Hide form if no company info is loaded */}
        {companyId && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Company Info Box */}
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-2">
              <div className="flex items-center gap-2 text-blue-800 font-bold mb-1">
                <FiBriefcase className="w-5 h-5 text-blue-600" />
                <span>Applying to: {companyName}</span>
              </div>
              <p className="text-xs text-blue-600 font-medium">Company Reference ID: {companyId}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiUser className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    readOnly
                    value={name}
                    className="block w-full pl-11 pr-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-500 focus:outline-none cursor-not-allowed text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Pre-filled from your profile credentials</p>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiMail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    readOnly
                    value={email}
                    className="block w-full pl-11 pr-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-500 focus:outline-none cursor-not-allowed text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Pre-filled from your profile credentials</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Company ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Company ID
                </label>
                <input
                  type="text"
                  required
                  readOnly
                  value={companyId}
                  className="block w-full px-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-500 focus:outline-none cursor-not-allowed text-sm"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  readOnly
                  value={companyName}
                  className="block w-full px-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-500 focus:outline-none cursor-not-allowed text-sm"
                />
              </div>
            </div>

            {/* Resume File Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Resume / CV File
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 transition-colors flex flex-col items-center justify-center bg-slate-50/50">
                <FiFileText className="w-10 h-10 text-slate-400 mb-3" />
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 file:cursor-pointer hover:file:bg-blue-100"
                />
                <p className="text-[10px] text-slate-400 mt-2">Accepted formats: PDF, DOC, DOCX up to 5MB</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Apply now'
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default Apply;
