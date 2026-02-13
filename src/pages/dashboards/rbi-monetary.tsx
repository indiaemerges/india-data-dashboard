import Head from "next/head";

export default function RBIMonetaryDashboard() {
  return (
    <>
      <Head><title>RBI Monetary Policy | India Data Dashboard</title></Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">RBI Monetary Policy</h1>
        <p className="text-gray-600 mb-6">Key policy rates, forex reserves, monetary aggregates, and banking statistics.</p>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <span className="text-4xl">🏦</span>
          <p className="text-gray-500 mt-4">RBI DBIE data integration coming soon. This will use pre-processed Excel data from the Database on Indian Economy.</p>
        </div>
      </div>
    </>
  );
}
