import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "../../../shared/hooks/useDebounce"; // Assuming we have this or I'll use a local implementation
import { searchService } from "../../../services/search.service";

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    courses: [],
    teachers: [],
    lessons: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Debounce the query to avoid spamming the "API"
  const [debouncedQuery] = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults({ courses: [], teachers: [], lessons: [] });
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const data = await searchService.searchGlobal(debouncedQuery);
        setResults(data);
      } catch (error) {
        console.error("Search failed", error);
        // Handle error state if needed
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults({ courses: [], teachers: [], lessons: [] });
    setIsOpen(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    clearSearch,
  };
}
