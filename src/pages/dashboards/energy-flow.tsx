import Head from "next/head";

export default function EnergyFlowDashboard() {
  return (
    <>
      <Head>
        <title>Energy Balance & Flows | India Data Dashboard</title>
      </Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Energy Balance & Flows
        </h1>
        <p className="text-gray-600 mb-6">
          India&apos;s energy balance as interactive Sankey diagrams.
          Production, transformation, and end-use across all fuels.
        </p>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <span className="text-4xl">⚡</span>
          <p className="text-gray-500 mt-4">
            Sankey diagram integration with MoSPI Energy Statistics API coming
            soon. This will migrate and enhance the existing{" "}
            <a
              href="https://indiaemerges.github.io/india_energy_flow/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              India Energy Flow
            </a>{" "}
            visualization.
          </p>
        </div>
      </div>
    </>
  );
}
