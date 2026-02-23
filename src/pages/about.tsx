import Head from "next/head";

export default function AboutPage() {
  return (
    <>
      <Head><title>About | India Data Dashboard</title></Head>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About</h1>

        <div className="prose prose-gray">
          <p className="text-gray-600 dark:text-gray-300">
            The India Data Dashboard is an open-source project that curates and
            visualizes India&apos;s key economic, industrial, energy, and demographic
            datasets through interactive charts and dashboards.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Data Sources</h2>
          <div className="space-y-3">
            {[
              { name: "MoSPI eSankhyiki", url: "https://www.mospi.gov.in/", desc: "Ministry of Statistics — PLFS, CPI, IIP, ASI, NAS, WPI, Energy Statistics (7 datasets, 100+ indicators)" },
              { name: "World Bank", url: "https://data.worldbank.org/", desc: "Development Indicators — GDP, trade, population, inflation (1000+ indicators)" },
              { name: "RBI DBIE", url: "https://dbie.rbi.org.in/", desc: "Database on Indian Economy — monetary policy, banking, forex" },
              { name: "Census India", url: "https://censusindia.gov.in/", desc: "Population Census 2001 & 2011 — demographics, literacy, amenities" },
              { name: "data.gov.in", url: "https://data.gov.in/", desc: "India Open Government Data Platform — 19,000+ datasets" },
              { name: "PPAC", url: "https://ppac.gov.in/", desc: "Petroleum Planning & Analysis Cell — petroleum production and consumption" },
            ].map((source) => (
              <div key={source.name} className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline">{source.name}</a>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{source.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Technology</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Built with Next.js, React, TypeScript, Tailwind CSS, and Plotly.js.
            Data fetched live from APIs using TanStack Query. Deployed as a static
            site on GitHub Pages. Open source under GPL-3.0 license.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Contributing</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            This project is maintained by{" "}
            <a href="https://github.com/indiaemerges" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline">
              indiaemerges
            </a>
            . Contributions, data corrections, and new dashboard ideas are welcome via GitHub Issues and Pull Requests.
          </p>
        </div>
      </div>
    </>
  );
}
