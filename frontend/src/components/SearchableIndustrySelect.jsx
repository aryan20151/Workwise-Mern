import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiLayers, FiSearch, FiCheck, FiPlus, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';

const DEFAULT_INDUSTRIES = [
  'Frontend Development',
  'Backend Engineering',
  'Full Stack Engineering',
  'DevOps & Cloud',
  'AI & Machine Learning',
  'Mobile Development',
  'UI/UX Design',
  'Technology & SaaS',
  'Fintech',
  'Healthcare & Biotech',
  'E-Commerce & Retail',
  'Cybersecurity',
  'Data Science & Analytics',
  'EdTech',
  'Gaming & Entertainment',
  'Automotive & EV',
  'Robotics & Hardware',
  'SpaceTech & Aerospace'
];

const SearchableIndustrySelect = ({
  value = '',
  onChange,
  name = 'industry',
  placeholder = 'Select or create industry...',
  theme = 'blue' // 'blue' or 'purple'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [industriesList, setIndustriesList] = useState(DEFAULT_INDUSTRIES);
  const containerRef = useRef(null);

  // If initial value is not in DEFAULT_INDUSTRIES, include it in list
  useEffect(() => {
    if (value && !industriesList.includes(value)) {
      setIndustriesList((prev) => [value, ...prev]);
    }
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredIndustries = useMemo(() => {
    if (!searchQuery.trim()) return industriesList;
    const q = searchQuery.toLowerCase().trim();
    return industriesList.filter((ind) => ind.toLowerCase().includes(q));
  }, [industriesList, searchQuery]);

  const hasExactMatch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return industriesList.some((ind) => ind.toLowerCase() === q);
  }, [industriesList, searchQuery]);

  const handleSelect = (selectedVal) => {
    if (onChange) {
      // Pass standard synthetic-like event object for compatibility with form handleChange
      onChange({
        target: {
          name: name,
          value: selectedVal
        }
      });
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateNew = () => {
    const newInd = searchQuery.trim();
    if (!newInd) return;

    if (!industriesList.includes(newInd)) {
      setIndustriesList((prev) => [newInd, ...prev]);
    }
    handleSelect(newInd);
  };

  const isPurple = theme === 'purple';
  const ringColor = isPurple ? 'focus:ring-purple-600' : 'focus:ring-blue-600';
  const badgeColor = isPurple ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700';
  const hoverBg = isPurple ? 'hover:bg-purple-50 hover:text-purple-900' : 'hover:bg-blue-50 hover:text-blue-900';
  const activeBg = isPurple ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white';
  const iconColor = isPurple ? 'text-purple-600' : 'text-blue-600';

  return (
    <div className="relative" ref={containerRef}>
      {/* Selector Input / Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 ${ringColor} focus:bg-white transition-all text-left flex items-center justify-between cursor-pointer`}
      >
        <div className="flex items-center gap-2 truncate">
          <FiLayers className={`absolute left-3.5 top-3.5 w-4 h-4 ${iconColor} shrink-0`} />
          <span className="truncate">
            {value ? (
              <span className="font-bold text-slate-900">{value}</span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </span>
        </div>
        {isOpen ? (
          <FiChevronUp className={`w-4 h-4 ${iconColor} shrink-0 ml-2`} />
        ) : (
          <FiChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 sticky top-0">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!hasExactMatch && searchQuery.trim()) {
                      handleCreateNew();
                    } else if (filteredIndustries.length > 0) {
                      handleSelect(filteredIndustries[0]);
                    }
                  }
                }}
                placeholder="Search industry or type custom..."
                className={`w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 ${ringColor}`}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {/* Create New Industry Button if not in list */}
            {searchQuery.trim() && !hasExactMatch && (
              <button
                type="button"
                onClick={handleCreateNew}
                className={`w-full px-3.5 py-2.5 text-left rounded-xl text-xs font-bold border border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all flex items-center justify-between cursor-pointer mb-1`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FiPlus className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Create & Select <strong>"{searchQuery.trim()}"</strong>
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-md">
                  New
                </span>
              </button>
            )}

            {filteredIndustries.length === 0 && hasExactMatch ? (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                No matching industries found.
              </div>
            ) : (
              filteredIndustries.map((ind) => {
                const isSelected = value === ind;
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => handleSelect(ind)}
                    className={`w-full px-3.5 py-2 text-left rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? `${activeBg} font-bold shadow-xs`
                        : `${hoverBg} text-slate-700 font-medium`
                    }`}
                  >
                    <span className="truncate">{ind}</span>
                    {isSelected && <FiCheck className="w-4 h-4 shrink-0 text-white ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableIndustrySelect;
