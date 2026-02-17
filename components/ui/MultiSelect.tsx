'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  icon?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  className = ''
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const removeOption = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(s => s !== id));
  };

  const selectedOptions = options.filter(opt => selected.includes(opt.id));

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between min-h-[42px]"
      >
        <div className="flex flex-wrap gap-1.5 flex-1">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selectedOptions.map(opt => (
              <span
                key={opt.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F7C400] text-[#552627] rounded text-sm font-medium"
              >
                {opt.icon && <span>{opt.icon}</span>}
                {opt.name}
                <button
                  onClick={(e) => removeOption(opt.id, e)}
                  className="hover:bg-[#552627] hover:text-white rounded-full p-0.5 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-sm">No options available</div>
          ) : (
            options.map(option => (
              <div
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className={`px-4 py-2.5 cursor-pointer flex items-center gap-2 transition-colors ${
                  selected.includes(option.id)
                    ? 'bg-[#FDF5E5] text-[#552627] font-medium'
                    : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.id)}
                  onChange={() => {}}
                  className="w-4 h-4 accent-[#F7C400]"
                />
                {option.icon && <span>{option.icon}</span>}
                <span>{option.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
