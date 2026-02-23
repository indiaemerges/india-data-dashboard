import Link from "next/link";
import type { DatasetEntry } from "@/config/datasets.config";

interface DatasetCardProps {
  dataset: DatasetEntry;
}

export default function DatasetCard({ dataset }: DatasetCardProps) {
  return (
    <Link
      href={dataset.dashboardPath}
      className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md transition-all no-underline group"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{dataset.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {dataset.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {dataset.description}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {dataset.source}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {dataset.updateFrequency}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                dataset.dataType === "live-api"
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : dataset.dataType === "hybrid"
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              {dataset.dataType === "live-api"
                ? "Live API"
                : dataset.dataType === "hybrid"
                  ? "Live + Cached"
                  : "Cached Data"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
