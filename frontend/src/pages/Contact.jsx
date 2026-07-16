import React, { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiMapPin, FiMessageSquare, FiSend, FiCheckCircle } from 'react-icons/fi';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
        body: JSON.stringify({ name, email, message })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Message sent successfully! We will get back to you soon.');
        setMessage('');
      } else {
        setErrorMsg(data.error || 'Failed to submit contact query.');
      }
    } catch (err) {
      console.error('Submit contact error:', err);
      setErrorMsg('An error occurred. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Header */}
      <section className="bg-slate-900 text-white py-16 text-center px-4 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-950">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight">Get in Touch with Us</h1>
          <p className="mt-3 text-slate-300 text-lg">
            Have any questions or feedback? We'd love to hear from you!
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 max-w-4xl mx-auto px-4 w-full">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FiMessageSquare className="text-blue-600 w-6 h-6" />
            Send Us a Message
          </h2>

          {successMsg && (
            <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start gap-3">
              <FiCheckCircle className="text-emerald-600 w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-emerald-800">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
              <FiCheckCircle className="text-rose-600 w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-rose-800">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your query or message here..."
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Info Blocks */}
      <section className="bg-slate-50 py-16 border-t border-slate-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight mb-12">
            Contact Information
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Address */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <FiMapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Our Location</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                123 Naraingarh, Haryana, India 10001
              </p>
            </div>

            {/* Phone */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <FiPhone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Phone Number</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                +1 123 456 7890
              </p>
            </div>

            {/* Email */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <FiMail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Email Address</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                abc@gmail.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
