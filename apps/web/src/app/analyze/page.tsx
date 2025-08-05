import { AnalyzeContainer } from '@/components/analyze';

/**
 * Repository Analyzer Page
 * 
 * This page has been refactored into modular components:
 * - AnalyzeContainer: Main client component that orchestrates the analysis flow
 * - UserAuth: Handles user authentication input
 * - RepositoryList: Displays and manages repository selection
 * - BulkScanStatus: Shows progress during bulk analysis
 * - IndividualAnalysisDisplay: Shows detailed analysis for single repository
 * - BulkAnalysisDisplay: Shows aggregated analysis results
 * 
 * Custom hooks manage state and logic:
 * - useRepositories: Manages repository loading via GitHub actions
 * - useAnalysisState: Manages analysis state and results
 * - useBulkAnalysisLogic: Handles bulk scanning logic
 * 
 * GitHub actions replace direct API calls for better separation of concerns.
 */
export default function AnalyzePage() {
  return <AnalyzeContainer />;
}
