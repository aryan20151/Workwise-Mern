import React, { useState, useEffect } from 'react';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
  FiZap,
  FiUser,
  FiBriefcase,
  FiHeadphones,
  FiGlobe,
  FiExternalLink
} from 'react-icons/fi';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const categories = [
    { id: 'General Inquiry', label: 'General Inquiry', icon: FiMessageSquare },
    { id: 'Job Seekers', label: 'Job Applications', icon: FiUser },
    { id: 'Employers & Hiring', label: 'Employers & Hiring', icon: FiBriefcase },
    { id: 'Technical Support', label: 'Technical Issue', icon: FiHeadphones },
    { id: 'Feedback', label: 'Feedback', icon: FiZap }
  ];

  const faqs = [
    {
      question: 'How do I apply for job openings on Workwise?',
      answer: 'Browse companies or jobs from the top navigation bar, select a company or vacancy you like, and click "Apply Now". You can upload your resume, add custom notes, and track application status live.'
    },
    {
      question: 'How long does it take for employers to respond?',
      answer: 'Most employers on Workwise review applications within 24 to 48 business hours. You will receive notifications directly in your account dashboard when your application status changes.'
    },
    {
      question: 'Is Workwise completely free for job seekers?',
      answer: 'Yes! Workwise is 100% free for candidate registration, browsing top companies, and submitting job applications. There are no hidden fees or charges for job seekers.'
    },
    {
      question: 'How can companies post job openings on Workwise?',
      answer: 'Employers can navigate to our Employer Portal or reach out directly to our hiring team via the contact form under "Employers & Hiring" to publish verified job opportunities.'
    },
    {
      question: 'How do I track my submitted applications?',
      answer: 'Log in to your Workwise account and navigate to your user profile or application dashboard to view real-time status updates (Pending, Under Review, Accepted, or Closed).'
    }
  ];

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch('/api/auth/user-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setName(data.user.username || '');
          setEmail(data.user.email || '');
          if (data.user.phone) setPhone(data.user.phone);
        }
      }
    } catch (err) {
      console.error('Error fetching user info for contact prefill:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, phone, category, message })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Message sent successfully! Our support specialists will get back to you shortly.');
        setMessage('');
      } else {
        setErrorMsg(data.error || 'Failed to submit contact query. Please try again.');
      }
    } catch (err) {
      console.error('Submit contact error:', err);
      setErrorMsg('An error occurred while sending your message. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50/50">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 px-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border-b border-indigo-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            We're Here To Help
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            How can we assist your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">career & hiring</span>?
          </h1>
          <p className="mt-4 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Have questions about applying, job postings, or account support? Send us a query and our team will respond within 2 hours.
          </p>

          {/* SLA Badges strip */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-3 text-xs sm:text-sm font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <FiZap className="text-amber-400 w-4 h-4" />
              <span>Avg. Response: &lt; 2 Hours</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <FiClock className="text-emerald-400 w-4 h-4" />
              <span>Mon - Fri: 9:00 AM - 7:00 PM IST</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <FiGlobe className="text-blue-400 w-4 h-4" />
              <span>Global Support Coverage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Form & Direct Contact Channels */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                <FiMessageSquare className="text-blue-600 w-6 h-6 shrink-0" />
                Send Us a Message
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Fill out the details below and select an inquiry category to route your query directly to the right support team.
              </p>
            </div>

            {/* Inquiry Category Pills */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Inquiry Topic
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alert Messages */}
            {successMsg && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
                <FiCheckCircle className="text-emerald-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Submitted Successfully</h4>
                  <p className="text-xs font-medium text-emerald-700 mt-0.5">{successMsg}</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
                <FiAlertCircle className="text-rose-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900">Submission Error</h4>
                  <p className="text-xs font-medium text-rose-700 mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                  />
                </div>
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Phone Number <span className="text-slate-400 text-none font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-medium">{message.length}/1000</span>
                </div>
                <textarea
                  required
                  rows={5}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your query or request in detail..."
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 py-3.5 px-8 text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Direct Support Channels & Info Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Support Status Box */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-blue-800/50">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Support Live Now
                </span>
                <FiClock className="text-blue-300 w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Direct Support Desk</h3>
              <p className="text-blue-200/80 text-xs leading-relaxed">
                Our support team is actively monitoring incoming requests. Contact us directly or drop an email anytime.
              </p>
            </div>

            {/* Direct Cards */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-6">
              
              {/* Location Card */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                  <FiMapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Headquarters</h4>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">123 XYZ</p>
                  <p className="text-xs text-slate-500 mt-0.5">Haryana, India 10001</p>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Get Directions <FiExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Phone Card */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
                  <FiPhone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Support</h4>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">+1 123 456 7890</p>
                  <p className="text-xs text-slate-500 mt-0.5">Mon - Sat (9am - 7pm IST)</p>
                  <a
                    href="tel:+11234567890"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2"
                  >
                    Call Now <FiPhone className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Email Card */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 border border-purple-100">
                  <FiMail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Support</h4>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">abc@gmail.com</p>
                  <p className="text-xs text-slate-500 mt-0.5">Response within 24 hours guaranteed</p>
                  <a
                    href="mailto:abc@gmail.com"
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 mt-2"
                  >
                    Send Email <FiMail className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Interactive FAQ Accordion Section */}
      <section className="py-14 bg-white border-t border-slate-200/70 mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
              <FiHelpCircle className="w-3.5 h-3.5" /> FAQ Center
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Have questions? Find quick answers right here.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-blue-200 bg-blue-50/20 shadow-md shadow-blue-500/5'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isOpen ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-slate-600 text-sm leading-relaxed border-t border-blue-100/60 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;
