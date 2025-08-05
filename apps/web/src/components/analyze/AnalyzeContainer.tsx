'use client';

import { useState, useEffect, useRef } from 'react';
import { Repository, AnalysisResult } from '@/types/analyze';
import { useRepositories } from '@/hooks/analyze/useRepositories';
import { useRepositorySelection, useBulkAnalysis, useAnalysisState } from '@/hooks/analyze/useAnalysisState';
import { useBulkAnalysisLogic } from '@/hooks/analyze/useBulkAnalysisLogic';
import { analyzeRepositoryAction } from '@/actions/analyze';
import { UserAuth } from './UserAuth';
import { RepositoryList } from './RepositoryList';
import { BulkScanStatus } from './BulkScanStatus';
import { ErrorDisplay } from './ErrorDisplay';
import { IndividualAnalysisDisplay } from './IndividualAnalysisDisplay';
import { BulkAnalysisDisplay } from './BulkAnalysisDisplay';

export function AnalyzeContainer() {
  const [userId, setUserId] = useState<string>("");
  
  // Custom hooks
  const { repositories, loading, error: repoError, loadRepositories, setError: setRepoError } = useRepositories();
  const { 
    selectedRepos, 
    selectedRepo, 
    setSelectedRepo, 
    toggleRepoSelection, 
    selectAllRepos, 
    clearSelection 
  } = useRepositorySelection();
  const {
    scanningAll,
    setScanningAll,
    currentScanRepo,
    setCurrentScanRepo,
    allAnalyses,
    setAllAnalyses,
    cancelScanRef,
    cancelScan,
    resetScan,
  } = useBulkAnalysis();
  const {
    analyzing,
    setAnalyzing,
    analysis,
    setAnalysis,
    error: analysisError,
    setError: setAnalysisError,
    clearError,
    clearAnalysis,
  } = useAnalysisState();

  const { scanRepositories } = useBulkAnalysisLogic();

  // Combined error
  const error = repoError || analysisError;
  const setError = (err: string) => {
    setRepoError(err);
    setAnalysisError(err);
  };

  useEffect(() => {
    if (userId) {
      loadRepositories(userId);
    }
  }, [userId, loadRepositories]);

  const handleUserIdSubmit = (newUserId: string) => {
    setUserId(newUserId);
  };

  const handleRepositorySelect = (repo: Repository) => {
    setSelectedRepo(repo);
  };

  const handleSelectAll = () => {
    selectAllRepos(repositories);
  };

  const handleRefresh = () => {
    if (userId) {
      loadRepositories(userId);
    }
  };

  const analyzeRepository = async (repo: Repository) => {
    if (!repo) return;

    setAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);

    try {
      const [owner, repoName] = repo.full_name.split("/");
      const data = await analyzeRepositoryAction(userId, owner, repoName, 200);

      if (data.success) {
        setAnalysis(data as AnalysisResult);
      } else {
        setAnalysisError(data.error || "Analysis failed");
      }
    } catch (err) {
      setAnalysisError("Analysis failed. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeSelected = () => {
    if (selectedRepo) {
      analyzeRepository(selectedRepo);
    }
  };

  const handleScanSelected = async () => {
    const selectedRepoList = repositories.filter((repo) =>
      selectedRepos.has(repo.id),
    );
    if (!selectedRepoList.length) return;

    await scanRepositories(
      selectedRepoList,
      `selected repositories (${selectedRepoList.length})`,
      userId,
      setScanningAll,
      setCurrentScanRepo,
      setAllAnalyses,
      setError,
      { current: cancelScanRef.current }
    );
  };

  const handleScanAll = async () => {
    if (!repositories.length) return;

    await scanRepositories(
      repositories,
      `all repositories (${repositories.length})`,
      userId,
      setScanningAll,
      setCurrentScanRepo,
      setAllAnalyses,
      setError,
      { current: cancelScanRef.current }
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Repository Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analyze your GitHub repositories with AI-powered insights
          </p>
        </div>

        <UserAuth onUserIdSubmit={handleUserIdSubmit} loading={loading} />

        <ErrorDisplay error={error} onDismiss={clearError} />

        {userId && (
          <div className="space-y-8">
            <div className="w-full">
              <BulkScanStatus
                isScanning={scanningAll}
                currentScanRepo={currentScanRepo}
                completedCount={Object.keys(allAnalyses).length}
                onCancel={cancelScan}
              />

              <RepositoryList
                repositories={repositories}
                selectedRepo={selectedRepo}
                selectedRepos={selectedRepos}
                loading={loading}
                scanningAll={scanningAll}
                onRepositorySelect={handleRepositorySelect}
                onToggleSelection={toggleRepoSelection}
                onSelectAll={handleSelectAll}
                onClearSelection={clearSelection}
                onRefresh={handleRefresh}
                onScanSelected={handleScanSelected}
                onScanAll={handleScanAll}
                onCancelScan={cancelScan}
                onAnalyzeSelected={handleAnalyzeSelected}
              />
            </div>

            <div className="w-full">
              {analysis ? (
                <IndividualAnalysisDisplay
                  analysis={analysis}
                  onBackToSummary={() => {
                    setAnalysis(null);
                    setSelectedRepo(null);
                  }}
                  showBackButton={Object.keys(allAnalyses).length > 0}
                />
              ) : Object.keys(allAnalyses).length > 0 ? (
                <BulkAnalysisDisplay
                  allAnalyses={allAnalyses}
                  onSelectRepository={(repoName) => {
                    const repo = repositories.find(r => r.full_name === repoName);
                    if (repo) {
                      setSelectedRepo(repo);
                      setAnalysis(allAnalyses[repoName]);
                    }
                  }}
                />
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
                  <div className="text-8xl mb-6">🔍</div>
                  <h3 className="text-3xl font-semibold text-gray-900 mb-4">
                    Ready to Analyze
                  </h3>
                  <p className="text-xl text-gray-600">
                    Select a repository from above to start your analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
