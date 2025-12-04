import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Mail, Phone, X, Loader2 } from 'lucide-react';
import { searchApi } from '../services/api';
import type { Contact } from '../types';

/**
 * Global Search Component
 *
 * TODO: Future AI integration placeholder
 * - Add semantic search with embeddings
 * - Add natural language query processing
 * - Add AI-powered suggestions and autocomplete
 * - Add search result relevance scoring
 */
export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchApi.search(query.trim(), 10);
        setResults(data);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (contact: Contact) => {
    setQuery('');
    setIsOpen(false);
    setResults([]);
    navigate(`/contacts/${contact.id}`);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && (query.trim().length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search contacts... (Ctrl+K)"
          data-global-search
          className="h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--muted-foreground))]/30 focus:border-[hsl(var(--ring))] focus:ring-1 focus:ring-[hsl(var(--ring))]"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg animate-fade-in">
          {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-[hsl(var(--muted-foreground))]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Search className="h-8 w-8 text-[hsl(var(--muted-foreground))] mb-2" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No contacts found</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Try a different search term</p>
            </div>
          ) : (
            <ul className="py-1">
              {results.map((contact, index) => (
                <li key={contact.id}>
                  <button
                    onClick={() => handleSelect(contact)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-[hsl(var(--accent))]'
                        : 'hover:bg-[hsl(var(--accent))]/50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                      {contact.profilePicture ? (
                        <img
                          src={contact.profilePicture}
                          alt={contact.name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                        {contact.emails?.[0] && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{contact.emails[0]}</span>
                          </span>
                        )}
                        {contact.phones?.[0] && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Phone className="h-3 w-3" />
                            <span>{contact.phones[0]}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
