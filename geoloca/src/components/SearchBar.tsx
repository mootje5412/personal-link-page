import { useEffect, useRef, useState } from 'react';
import { searchPlaces, type SearchResult } from '../utils/location';
import './SearchBar.css';

interface SearchBarProps {
  onSelect: (result: SearchResult) => void;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      const items = await searchPlaces(query);
      setResults(items);
      setOpen(items.length > 0);
      setLoading(false);
    }, 350);

    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="search-bar" ref={wrapperRef}>
      <label className="search-field">
        <svg className="search-svg" viewBox="0 0 20 20" aria-hidden>
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
          <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder="Search a place"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <span className="search-spin" />}
      </label>
      {open && (
        <ul className="search-list">
          {results.map((item) => (
            <li key={`${item.lat}-${item.lng}-${item.label}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(item);
                  setQuery(item.label.split(',')[0] ?? item.label);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
