'use client';

import { useState, useCallback } from 'react';
import { Repository } from '@/types/analyze';
import { getRepositoriesAction } from '@/actions/analyze';

export function useRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadRepositories = useCallback(async (userId: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError("");

    try {
      const result = await getRepositoriesAction(userId);

      if (result.success && result.data) {
        setRepositories(result.data);
      } else {
        setError(result.error || "Failed to load repositories");
      }
    } catch (err) {
      setError("Failed to connect to GitHub. Please check your connection.");
      console.error("Repository loading error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    repositories,
    loading,
    error,
    loadRepositories,
    setError,
  };
}
