'use client';

import { Repository, AnalysisResult } from '@/types/analyze';
import { analyzeRepositoryAction } from '@/actions/analyze';

export function useBulkAnalysisLogic() {
  const scanRepositories = async (
    reposToScan: Repository[],
    scanType: string,
    userId: string,
    setScanningAll: (scanning: boolean) => void,
    setCurrentScanRepo: (repo: string) => void,
    setAllAnalyses: (analyses: { [key: string]: AnalysisResult }) => void,
    setError: (error: string) => void,
    cancelScanRef: React.RefObject<boolean>
  ) => {
    cancelScanRef.current = false;
    setScanningAll(true);
    setError("");
    setAllAnalyses({});

    const analyses: { [key: string]: AnalysisResult } = {};
    let successCount = 0;
    let failureCount = 0;

    console.log(`🚀 Starting scan of ${scanType}`);

    for (let i = 0; i < reposToScan.length; i++) {
      // Check if user cancelled the scan
      if (cancelScanRef.current) {
        setError(
          `Scan cancelled after analyzing ${i} repositories. ${successCount} successful, ${failureCount} failed.`,
        );
        break;
      }

      const repo = reposToScan[i];
      setCurrentScanRepo(
        `${repo.name} (${i + 1}/${reposToScan.length}) - ${successCount} success, ${failureCount} failed`,
      );

      try {
        const [owner, repoName] = repo.full_name.split("/");

        console.log(`🔍 Starting analysis for ${repo.full_name}...`);

        const data = await analyzeRepositoryAction(userId, owner, repoName, 50);

        console.log(`📊 Analysis data for ${repo.full_name}:`, {
          success: data.success,
          hasData: !!data.data,
          error: data.error,
        });

        if (data.success && data.data) {
          analyses[repo.full_name] = data as AnalysisResult;
          successCount++;
          console.log(`✅ Successfully analyzed ${repo.full_name}`);
        } else {
          failureCount++;
          console.error(
            `❌ Failed to analyze ${repo.full_name}:`,
            data.error || "Unknown error",
          );
        }
      } catch (err) {
        failureCount++;
        console.error(`❌ Error analyzing ${repo.full_name}:`, err);
      }

      // Update analyses in real-time so user can see progress
      setAllAnalyses({ ...analyses });

      // Small delay between requests to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setAllAnalyses(analyses);
    setScanningAll(false);
    setCurrentScanRepo("");

    // Show final summary (only if not cancelled)
    if (!cancelScanRef.current) {
      const totalRepos = reposToScan.length;
      const message = `Scan of ${scanType} completed: ${successCount}/${totalRepos} repositories analyzed successfully`;
      if (failureCount > 0) {
        setError(
          `${message}. ${failureCount} repositories failed to analyze (check console for details).`,
        );
      } else {
        console.log(`🎉 ${message}`);
      }
    }
  };

  return { scanRepositories };
}
