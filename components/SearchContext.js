// File: components/SearchContext.js

import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext({
  query: '',
  setQuery: () => {},
  clearQuery: () => {}
});

export function SearchProvider({ children }) {
  const [query, setQuery] = useState('');

  const clearQuery = () => setQuery('');

  return (
    <SearchContext.Provider value={{ query, setQuery, clearQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchQuery() {
  const { query } = useContext(SearchContext);
  return query;
}

export function useSetSearchQuery() {
  const { setQuery } = useContext(SearchContext);
  return setQuery;
}

export function useClearSearchQuery() {
  const { clearQuery } = useContext(SearchContext);
  return clearQuery;
}
