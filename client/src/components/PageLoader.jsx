import { Loader2 } from "lucide-react";

/**
 * A simple loading spinner displayed while lazy components are loading.
 * Used as a fallback for React.Suspense.
 */
export default function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-sky-600" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
        </div>
    );
}
