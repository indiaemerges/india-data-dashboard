import Head from "next/head";
import { useState } from "react";
import DatasetCard from "@/components/ui/DatasetCard";
import {
  datasets,
  categoryLabels,
  datasetsByCategory,
} from "@/config/datasets.config";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter datasets by search and category
  const filteredDatasets = datasets.filter((ds) => {
    const matchesSearch =
      searchQuery === "" ||
      ds.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "all" || ds.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.keys(datasetsByCategory);

  return (
    <>
      <Head>
        <title>India Data Dashboard</title>
        <meta
          name="description"
          content="Explore India's economic, industrial, energy, and demographic data through interactive visualizations."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div>
        {/* Hero section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            India Data Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Explore India&apos;s economic, industrial, energy, and demographic
            data through interactive visualizations. Powered by MoSPI, World
            Bank, RBI, and other official sources.
          </p>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search datasets... (e.g., GDP, inflation, employment)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            <svg
              className="absolute left-3 top-3 w-4 h-4 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All ({datasets.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {categoryLabels[cat] || cat} (
                {datasetsByCategory[cat]?.length || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Dataset grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDatasets.map((ds) => (
            <DatasetCard key={ds.id} dataset={ds} />
          ))}
        </div>

        {filteredDatasets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No datasets found matching &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {/* Data sources summary */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data Sources
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                name: "MoSPI eSankhyiki",
                count: "7 datasets",
                desc: "PLFS, CPI, IIP, ASI, NAS, WPI, Energy",
              },
              {
                name: "World Bank",
                count: "1000+ indicators",
                desc: "Development data for India",
              },
              {
                name: "RBI DBIE",
                count: "Monetary data",
                desc: "Interest rates, forex, banking",
              },
              {
                name: "Census India",
                count: "2001 & 2011",
                desc: "Population, literacy, amenities",
              },
            ].map((source) => (
              <div
                key={source.name}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {source.name}
                </h3>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                  {source.count}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{source.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
