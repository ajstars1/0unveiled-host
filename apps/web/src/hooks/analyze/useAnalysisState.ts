'use client';

import { useState, useRef } from 'react';
import { Repository, AnalysisResult } from '@/types/analyze';

export function useRepositorySelection() {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

  const toggleRepoSelection = (repoId: number) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const selectAllRepos = (repositories: Repository[]) => {
    const allRepoIds = new Set(repositories.map((repo) => repo.id));
    setSelectedRepos(allRepoIds);
  };

  const clearSelection = () => {
    setSelectedRepos(new Set());
  };

  return {
    selectedRepos,
    selectedRepo,
    setSelectedRepo,
    toggleRepoSelection,
    selectAllRepos,
    clearSelection,
  };
}

export function useBulkAnalysis() {
  const [scanningAll, setScanningAll] = useState(false);
  const [currentScanRepo, setCurrentScanRepo] = useState<string>("");
  const [allAnalyses, setAllAnalyses] = useState<{ [key: string]: AnalysisResult }>({});
  const cancelScanRef = useRef<boolean>(false);

  const cancelScan = () => {
    cancelScanRef.current = true;
    setScanningAll(false);
    setCurrentScanRepo("");
  };

  const resetScan = () => {
    cancelScanRef.current = false;
    setScanningAll(false);
    setCurrentScanRepo("");
    setAllAnalyses({});
  };

  return {
    scanningAll,
    setScanningAll,
    currentScanRepo,
    setCurrentScanRepo,
    allAnalyses,
    setAllAnalyses,
    cancelScanRef,
    cancelScan,
    resetScan,
  };
}

export function useAnalysisState() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");

  const clearError = () => setError("");
  const clearAnalysis = () => setAnalysis(null);

  return {
    analyzing,
    setAnalyzing,
    analysis,
    setAnalysis,
    error,
    setError,
    clearError,
    clearAnalysis,
  };
}
