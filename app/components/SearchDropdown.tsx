'use client';

import React, { useRef, useEffect } from 'react';
import { useSearch } from './SearchContext';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';

interface SearchResult {
  id: string;
  type: 'user' | 'product' | 'order' | 'review' | 'notification';
  title: string;
  subtitle: string;
  description?: string;
  url: string;
  icon: string;
  metadata?: Record<string, any>;
}

export default function SearchDropdown() {
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    isSearchOpen,
    setIsSearchOpen,
    clearSearch,
    navigateToResult
  } = useSearch();

  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && searchResults[selectedIndex]) {
            navigateToResult(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          clearSearch();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, searchResults, selectedIndex, navigateToResult, clearSearch]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsSearchOpen(true);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim()) {
      setIsSearchOpen(true);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigateToResult(result);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'product': return 'bg-green-100 text-green-800';
      case 'order': return 'bg-purple-100 text-purple-800';
      case 'notification': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return 'User';
      case 'product': return 'Product';
      case 'order': return 'Order';
      case 'notification': return 'Action';
      default: return type;
    }
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search anything..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 w-64"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {isSearchOpen && (searchTerm.trim() || searchResults.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50"
        >
          {/* Search Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Search Results</h3>
              {isSearching && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                  <span>Searching...</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="py-2">
            {searchResults.length === 0 && !isSearching && searchTerm.trim() && (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-400 text-4xl mb-2">🔍</div>
                <p className="text-sm text-gray-500">No results found for "{searchTerm}"</p>
                <p className="text-xs text-gray-400 mt-1">Try searching for users, products, or orders</p>
              </div>
            )}

            {searchResults.map((result, index) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result)}
                className={`px-4 py-3 cursor-pointer transition-all duration-200 ${
                  index === selectedIndex
                    ? 'bg-green-50 border-l-4 border-green-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{result.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {result.title}
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{result.subtitle}</p>
                    {result.description && (
                      <p className="text-xs text-gray-500 truncate">{result.description}</p>
                    )}
                  </div>
                  <div className="text-gray-400">
                    <ArrowDownIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search Footer */}
          {searchResults.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Press Enter to select, Esc to close</span>
                <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 