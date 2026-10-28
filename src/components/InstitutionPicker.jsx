import React, { useState, useEffect, useRef } from 'react';
import { Search, BadgeCheck, X, Loader2, AlertTriangle } from 'lucide-react';
import { searchInstitutions, isVerifiedInstitutionId } from '../services/institutionService';

const PLACEHOLDERS = {
  school: 'Search your school, e.g. "STI Dagupan" or "PUP Taguig"…',
  company: 'Search a Philippine company…',
  government: 'Search a government agency…',
  organization: 'Search an organization…'
};

/**
 * Search-and-pick field for a verified Philippine institution of the given type.
 * value: { name, id } — id is a CHED school ID or a Wikidata ID, empty when nothing is picked.
 * Typed text alone is never saved; the user must pick a result (or leave the field blank).
 */
export default function InstitutionPicker({ id, value, onChange, institutionType = 'school' }) {
  const isVerified = isVerifiedInstitutionId(value?.id) && !!value?.name;
  const minLength = institutionType === 'school' ? 2 : 3;
  const placeholder = PLACEHOLDERS[institutionType] || PLACEHOLDERS.organization;
  const [query, setQuery] = useState(isVerified ? '' : (value?.name || ''));
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState('');
  const wrapRef = useRef(null);

  // Debounced search while typing
  useEffect(() => {
    if (isVerified || query.trim().length < minLength) {
      setResults([]);
      setStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const found = await searchInstitutions(query, institutionType, controller.signal);
        setResults(found);
        setActiveIndex(found.length ? 0 : -1);
        setStatus('done');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setErrorMessage(err.message);
          setStatus('error');
        }
      }
    }, institutionType === 'school' ? 150 : 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isVerified, institutionType, minLength]);

  // Close the list on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pick = (result) => {
    onChange({ name: result.name, id: result.id });
    setQuery('');
    setOpen(false);
  };

  const clear = () => {
    onChange({ name: '', id: '' });
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      pick(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (isVerified) {
    return (
      <div className="institution-selected" id={id}>
        <BadgeCheck size={16} className="institution-verified-icon" />
        <span className="institution-selected-name" title={value.name}>{value.name}</span>
        <span className="institution-badge">Verified</span>
        <button type="button" className="action-icon-btn" onClick={clear} aria-label="Change institution">
          <X size={15} />
        </button>
      </div>
    );
  }

  const hasUnverifiedText = query.trim().length > 0;

  return (
    <div className="institution-picker" ref={wrapRef}>
      <div className="institution-input-wrap">
        <Search size={15} />
        <input
          id={id}
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={query}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value?.name) onChange({ name: '', id: '' });
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {status === 'loading' && <Loader2 size={15} className="spin institution-loading" />}
      </div>

      {open && query.trim().length >= minLength && status !== 'loading' && (
        <ul className="institution-results" role="listbox">
          {status === 'error' && (
            <li className="institution-empty">
              {/too many/i.test(errorMessage)
                ? errorMessage
                : "Can't reach the institution directory. Check your connection and try again."}
            </li>
          )}
          {status === 'done' && results.length === 0 && (
            <li className="institution-empty">{institutionType === 'school' ? `No CHED-listed school matches “${query.trim()}”. Try the school name or its city.` : `No verified Philippine institution matches “${query.trim()}”. Try the full official name.`}</li>
          )}
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === activeIndex}
              className={`institution-option ${i === activeIndex ? 'active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(r); }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="institution-option-name">{r.name}</span>
              <span className="institution-option-desc">
                {[r.type, r.location].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {hasUnverifiedText && (
        <span className="form-hint institution-warning">
          <AlertTriangle size={12} /> Pick your institution from the list. Typed text alone is not saved.
        </span>
      )}
    </div>
  );
}
