import Head from "next/head";

export default function PetroleumDashboard() {
  return (
    <>
      <Head><title>Petroleum & Refining | India Data Dashboard</title></Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Petroleum & Refining</h1>
        <p className="text-gray-600 mb-6">Petroleum production, refinery throughput, and consumption data from PPAC.</p>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <span className="text-4xl">🛢️</span>
          <p className="text-gray-500 mt-4">PPAC data integration coming soon. This will use pre-processed CSV data from the Petroleum Planning & Analysis Cell.</p>
        </div>
      </div>
    </>
  );
}
