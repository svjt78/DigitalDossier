// components/SearchContext.js

import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext({
  query: '',
  setQuery: () => {}
});

export function SearchProvider({ children }) {
  const [query, setQuery] = useState('');

  return (
    <SearchContext.Provider value={{ query, setQuery }}>
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
