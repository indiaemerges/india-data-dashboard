import Link from "next/link";
import { useRouter } from "next/router";
import { datasets, categoryLabels } from "@/config/datasets.config";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();

  // Group datasets by category
  const grouped = datasets.reduce(
    (acc, ds) => {
      if (!acc[ds.category]) acc[ds.category] = [];
      acc[ds.category].push(ds);
      return acc;
    },
    {} as Record<string, typeof datasets>
  );

  const categoryOrder = [
    "economy",
    "prices",
    "industry",
    "energy",
    "demographics",
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Dashboards
          </h2>

          {categoryOrder.map((category) => {
            const items = grouped[category];
            if (!items) return null;

            return (
              <div key={category} className="mb-4">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 px-2">
                  {categoryLabels[category] || category}
                </h3>
                <ul className="space-y-0.5">
                  {items.map((ds) => {
                    const isActive =
                      router.pathname === ds.dashboardPath ||
                      router.asPath.includes(ds.id);
                    return (
                      <li key={ds.id}>
                        <Link
                          href={ds.dashboardPath}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm no-underline transition-colors ${
                            isActive
                              ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                          onClick={onClose}
                        >
                          <span className="text-base">{ds.icon}</span>
                          <span className="truncate">{ds.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {/* Explorer link */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/explore"
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm no-underline transition-colors ${
                router.pathname.startsWith("/explore")
                  ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={onClose}
            >
              <span className="text-base">🔍</span>
              <span>Data Explorer</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
