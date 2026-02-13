import Head from "next/head";

export default function IndustrialDashboard() {
  return (
    <>
      <Head><title>Industrial Production | India Data Dashboard</title></Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Industrial Production (IIP & ASI)</h1>
        <p className="text-gray-600 mb-6">Index of Industrial Production and Annual Survey of Industries data.</p>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <span className="text-4xl">🏭</span>
          <p className="text-gray-500 mt-4">MoSPI IIP and ASI API integration coming soon. Will include manufacturing index, mining, electricity, and 57 factory-sector indicators.</p>
        </div>
      </div>
    </>
  );
}
