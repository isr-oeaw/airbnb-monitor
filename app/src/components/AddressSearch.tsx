import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { reverseGeocode, searchAddresses, type GeocodingResult } from '../lib/geocoding';

interface AddressSearchProps {
  onSubmit: (result: GeocodingResult) => void;
}

const GEOLOCATION_TIMEOUT_MS = 10_000;

function LocateIcon() {
  return (
    <svg
      className="address-search__locate-icon"
      viewBox="0 0 24 24"
      width={20}
      height={20}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function AddressSearch({ onSubmit }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchAddresses(value);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setActiveIndex(-1);
    } catch {
      setError('Adresssuche nicht verfügbar.');
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectResult = (result: GeocodingResult) => {
    setQuery(result.label);
    setIsOpen(false);
    onSubmit(result);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      selectResult(suggestions[activeIndex]);
      return;
    }
    if (suggestions.length > 0) {
      selectResult(suggestions[0]);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmit(event as unknown as FormEvent);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        break;
      case 'Enter':
        event.preventDefault();
        if (activeIndex >= 0) {
          selectResult(suggestions[activeIndex]);
        } else if (suggestions[0]) {
          selectResult(suggestions[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleLocate = () => {
    if (isLocating) return;

    if (!navigator.geolocation) {
      setError('Standortbestimmung ist in diesem Browser nicht verfügbar.');
      return;
    }

    setIsLocating(true);
    setError(null);
    setIsOpen(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const result = await reverseGeocode(latitude, longitude);
          if (!result) {
            setError('Der Standort liegt außerhalb Österreichs oder konnte nicht zugeordnet werden.');
            return;
          }
          selectResult(result);
        } catch {
          setError('Adresse für den Standort konnte nicht ermittelt werden.');
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setIsLocating(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError('Standortzugriff wurde verweigert.');
            break;
          case geoError.TIMEOUT:
            setError('Standortbestimmung hat zu lange gedauert.');
            break;
          default:
            setError('Standort konnte nicht ermittelt werden.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 0,
      },
    );
  };

  return (
    <form className="address-search" onSubmit={handleSubmit} ref={containerRef}>
      <div className="address-search__field">
        <input
          type="text"
          className="address-search__input"
          placeholder="Adresse in Österreich eingeben…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-label="Adresse suchen"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        <button
          type="button"
          className="address-search__locate"
          onClick={handleLocate}
          disabled={isLocating}
          aria-label="Aktuellen Standort verwenden"
        >
          <LocateIcon />
        </button>
      </div>

      {isLocating && <p className="address-search__hint">Standort wird ermittelt…</p>}
      {!isLocating && isLoading && <p className="address-search__hint">Suche…</p>}
      {error && <p className="address-search__error">{error}</p>}

      {isOpen && suggestions.length > 0 && (
        <ul className="address-search__suggestions" role="listbox">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.lat}-${suggestion.lng}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={
                index === activeIndex
                  ? 'address-search__suggestion address-search__suggestion--active'
                  : 'address-search__suggestion'
              }
              onMouseDown={(e) => {
                e.preventDefault();
                selectResult(suggestion);
              }}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
