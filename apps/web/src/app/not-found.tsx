import { NotFoundContent } from "@/components/404/not-found-content";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-secondary flex items-center justify-center p-4">
                  <div className="max-w-2xl w-full text-center space-y-8">
                    <NotFoundContent />
                  </div>
                </div>
  );
}
