import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { 
  FiShield, FiUserPlus, FiBriefcase, FiMail, FiLock, FiUser, 
  FiMapPin, FiDollarSign, FiCheckCircle, FiAlertCircle, FiArrowLeft, FiRefreshCw,
  FiEdit3, FiTrash2, FiX, FiSave, FiRotateCcw
} from 'react-icons/fi';

const AdminMasterSetupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    companyName: '',
    industry: 'Technology',
    headquarters: '',
    budget: '',
    description: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingCompanyId, setEditingCompanyId] = useState(null);

  const [provisionedList, setProvisionedList] = useState([]);
  const [employerList, setEmployerList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all companies & registered employers
  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();
      const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

      const [resComps, resEmps] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/auth/admin/employers', {
          credentials: 'include',
          headers: { ...(userId ? { 'x-user-id': userId } : {}) }
        })
      ]);

      const dataComps = await resComps.json();
      const dataEmps = await resEmps.json();

      if (resComps.ok && dataComps.success) {
        setProvisionedList(dataComps.companies || []);
      }
      if (resEmps.ok && dataEmps.success) {
        setEmployerList(dataEmps.employers || []);
      }
    } catch (err) {
      console.error('Error fetching master data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      companyName: '',
      industry: 'Technology',
      headquarters: '',
      budget: '',
      description: ''
    });
    setIsEditing(false);
    setEditingUserId(null);
    setEditingCompanyId(null);
    setError('');
  };

  // Populate form directly when clicking Edit Employer
  const handleOpenEdit = (emp) => {
    setError('');
    setIsEditing(true);
    setEditingUserId(emp._id);

    // Find linked company details from provisionedList
    const linkedComp = provisionedList.find(
      (c) => (c.companyId && emp.company?.companyId && c.companyId === emp.company.companyId) ||
             (c.postedBy && String(c.postedBy) === String(emp._id)) ||
             (c.name && emp.company?.name && c.name.toLowerCase() === emp.company.name.toLowerCase())
    );

    setEditingCompanyId(linkedComp ? linkedComp.companyId : null);

    setFormData({
      username: emp.username || '',
      email: emp.email || '',
      password: '', // Kept empty unless admin inputs a new password
      companyName: emp.company?.name || linkedComp?.name || '',
      industry: linkedComp?.industry || 'Technology',
      headquarters: linkedComp?.headquarters || '',
      budget: linkedComp?.budget || '',
      description: linkedComp?.description || ''
    });

    // Scroll smoothly to form
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Submit Handler for Create AND Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.email.trim() || !formData.companyName.trim()) {
      setError('Username, Email, and Company Name are required.');
      return;
    }

    if (!isEditing && !formData.password.trim()) {
      setError('Initial Password is required when creating a new employer.');
      return;
    }

    setIsSubmitting(true);

    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();
      const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

      if (isEditing && editingUserId) {
        // 1. Update Employer Credentials
        const resEmp = await fetch(`/api/auth/admin/employers/${editingUserId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password || undefined
          })
        });
        const dataEmp = await resEmp.json();

        // 2. Update Company Profile if companyId exists
        if (editingCompanyId) {
          await fetch(`/api/companies/${editingCompanyId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(userId ? { 'x-user-id': userId } : {})
            },
            body: JSON.stringify({
              name: formData.companyName,
              industry: formData.industry,
              headquarters: formData.headquarters,
              budget: formData.budget,
              description: formData.description
            })
          });
        }

        if (resEmp.ok && dataEmp.success) {
          toast.success(`Employer "${formData.username}" and Company Profile updated!`);
          resetForm();
          fetchMasterData();
        } else {
          setError(dataEmp.message || 'Failed to update employer.');
        }
      } else {
        // Create New Employer & Company
        const response = await fetch('/api/auth/admin/create-employer-company', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.success(`Employer "${formData.username}" & Company "${formData.companyName}" created successfully!`);
          resetForm();
          fetchMasterData();
        } else {
          setError(data.message || 'Failed to provision employer and company.');
        }
      }
    } catch (err) {
      console.error('Master Setup submit error:', err);
      setError('An error occurred during master setup operation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Employer
  const handleDeleteEmployer = async (empId, username) => {
    if (!window.confirm(`Are you sure you want to delete employer "${username}" and their company profile?`)) {
      return;
    }

    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();
      const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

      const res = await fetch(`/api/auth/admin/employers/${empId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...(userId ? { 'x-user-id': userId } : {}) }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Employer "${username}" deleted.`);
        if (editingUserId === empId) {
          resetForm();
        }
        fetchMasterData();
      } else {
        toast.error(data.message || 'Failed to delete employer.');
      }
    } catch (err) {
      console.error('Error deleting employer:', err);
      toast.error('An error occurred deleting employer.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-4rem)]">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-800/40">
        <div>
          <button
            onClick={() => navigate('/manage-companies')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-purple-200 hover:text-white mb-3 transition-colors cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Company Directory
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold">
              <FiShield className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Master Data Setup</h1>
          </div>
          <p className="mt-2 text-purple-200/80 text-sm">
            Manage all Employer accounts, manipulate credentials, and provision linked Company Profiles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div ref={formRef} className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {isEditing ? (
                  <>
                    <FiEdit3 className="w-5 h-5 text-amber-400" />
                    <span>Edit Employer & Company Profile</span>
                  </>
                ) : (
                  <>
                    <FiUserPlus className="w-5 h-5 text-purple-400" />
                    <span>Provision Employer & Company</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditing 
                  ? `Editing record for employer account: ${formData.username}`
                  : 'Creates an employer login and auto-links their company profile.'}
              </p>
            </div>
            {isEditing && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase">
                  Editing Mode
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FiX className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-center gap-3 text-rose-700 text-sm font-semibold">
                <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Employer Credentials */}
            <div className="border-b border-slate-100 pb-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <FiUser className="w-4 h-4" />
                <span>1. Employer Credentials</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      name="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="e.g. acme_employer"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Employer Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="employer@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {isEditing ? 'Reset Password (leave blank to keep current)' : 'Initial Password *'}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <input
                    type="password"
                    name="password"
                    required={!isEditing}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isEditing ? "Type new password to update..." : "Set temporary password..."}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Company Profile Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <FiBriefcase className="w-4 h-4" />
                <span>2. Company Profile Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="e.g. Fintech, SaaS, AI"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Headquarters / Location
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      name="headquarters"
                      value={formData.headquarters}
                      onChange={handleChange}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Salary Budget / Compensation
                  </label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g. $100k - $150k"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Company Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Overview of company mission, tech stack, and workplace culture..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-sm transition-colors cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-7 py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer ${
                  isEditing 
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25' 
                    : 'bg-purple-700 hover:bg-purple-800 shadow-purple-600/25'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isEditing ? <FiSave className="w-4 h-4" /> : <FiCheckCircle className="w-4 h-4" />}
                    <span>{isEditing ? 'Save Employer & Company Changes' : 'Provision Employer & Company'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Master Provisioned Employers Directory Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Employer Accounts</h3>
              <p className="text-xs text-slate-500">Live directory of all active employer accounts.</p>
            </div>
            <button
              onClick={fetchMasterData}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-purple-700 transition-colors shadow-xs cursor-pointer"
              title="Refresh"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                Loading employer records...
              </div>
            ) : employerList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
                No employer accounts found.
              </div>
            ) : (
              employerList.map((emp) => {
                const isSelected = editingUserId === emp._id;
                return (
                  <div
                    key={emp._id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between gap-3 ${
                      isSelected ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{emp.username}</span>
                          <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md uppercase">
                            {emp.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <FiMail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{emp.email}</span>
                        </p>
                        <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1">
                          <FiBriefcase className="w-3.5 h-3.5 text-blue-600" />
                          <span>Company: <strong>{emp.company ? emp.company.name : 'Not Assigned'}</strong></span>
                        </p>
                      </div>

                      {/* Action Controls for Admin */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-500 text-white shadow-sm' 
                              : 'bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-700'
                          }`}
                          title="Populate details to form for editing"
                        >
                          <FiEdit3 className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'Editing' : 'Edit'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteEmployer(emp._id, emp.username)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Employer Account"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMasterSetupPage;
