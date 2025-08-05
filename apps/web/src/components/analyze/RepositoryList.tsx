'use client';

import { Repository } from '@/types/analyze';
import { Button } from '@/components/ui/button';
import { RepositoryCard } from '@/components/analyze/RepositoryCard';

interface RepositoryListProps {
  repositories: Repository[];
  selectedRepo: Repository | null;
  selectedRepos: Set<number>;
  loading: boolean;
  scanningAll: boolean;
  onRepositorySelect: (repo: Repository) => void;
  onToggleSelection: (repoId: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRefresh: () => void;
  onScanSelected: () => void;
  onScanAll: () => void;
  onCancelScan: () => void;
  onAnalyzeSelected: () => void;
}

export function RepositoryList({
  repositories,
  selectedRepo,
  selectedRepos,
  loading,
  scanningAll,
  onRepositorySelect,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onRefresh,
  onScanSelected,
  onScanAll,
  onCancelScan,
  onAnalyzeSelected,
}: RepositoryListProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Your Repositories
        </h2>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading || scanningAll}
            className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
          {repositories.length > 0 && (
            <>
              {!scanningAll ? (
                <>
                  {selectedRepos.size > 0 && (
                    <>
                      <Button
                        onClick={onScanSelected}
                        variant="outline"
                        size="sm"
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                      >
                        Scan Selected ({selectedRepos.size})
                      </Button>
                      <Button
                        onClick={onClearSelection}
                        variant="outline"
                        size="sm"
                        className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
                      >
                        Clear
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={onSelectAll}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
                  >
                    Select All
                  </Button>
                  <Button
                    onClick={onScanAll}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                  >
                    Scan All ({repositories.length})
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onCancelScan}
                  variant="outline"
                  size="sm"
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                >
                  Cancel Scan
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {repositories.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedRepos.size > 0 
                ? `${selectedRepos.size} repositories selected` 
                : "Click repositories to select them for bulk analysis"}
            </div>
            <div className="flex space-x-2">
              {selectedRepos.size > 0 && (
                <Button
                  onClick={onClearSelection}
                  variant="outline"
                  size="sm"
                  className="px-3 py-1 text-sm"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-96 overflow-y-auto">
        {repositories.map((repo) => (
          <RepositoryCard
            key={repo.id}
            repository={repo}
            isSelected={selectedRepo?.id === repo.id}
            isInBulkSelection={selectedRepos.has(repo.id)}
            onSelect={onRepositorySelect}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>

      {selectedRepo && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyzeSelected}
            disabled={loading || scanningAll}
            className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-300 font-medium"
          >
            Analyze {selectedRepo.name}
          </Button>
        </div>
      )}
    </div>
  );
}
