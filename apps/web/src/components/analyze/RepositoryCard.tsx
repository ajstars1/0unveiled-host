'use client';

import { Repository } from '@/types/analyze';

interface RepositoryCardProps {
  repository: Repository;
  isSelected: boolean;
  isInBulkSelection: boolean;
  onSelect: (repo: Repository) => void;
  onToggleSelection: (repoId: number) => void;
}

export function RepositoryCard({
  repository,
  isSelected,
  isInBulkSelection,
  onSelect,
  onToggleSelection,
}: RepositoryCardProps) {
  const handleCardClick = () => {
    onSelect(repository);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection(repository.id);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleSelection(repository.id);
  };

  const getBorderClass = () => {
    if (isSelected) return "border-black bg-gray-50";
    if (isInBulkSelection) return "border-blue-500 bg-blue-50";
    return "border-gray-200 hover:border-gray-400 hover:bg-gray-50";
  };

  return (
    <div
      className={`p-4 border-2 rounded-2xl transition-all cursor-pointer ${getBorderClass()}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate text-sm">
              {repository.name}
            </h3>
            {repository.private && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                Private
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {repository.description || "No description available"}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <input
            type="checkbox"
            checked={isInBulkSelection}
            onChange={handleCheckboxChange}
            onClick={handleCheckboxClick}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {repository.language && (
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>{repository.language}</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>⭐ {repository.stargazers_count}</span>
          <span>🍴 {repository.forks_count}</span>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Updated: {new Date(repository.updated_at).toLocaleDateString()}
      </div>
    </div>
  );
}
