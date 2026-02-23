import Head from "next/head";

export default function ExploreIndex() {
  return (
    <>
      <Head><title>Data Explorer | India Data Dashboard</title></Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Data Explorer</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Query any indicator from MoSPI, World Bank, data.gov.in, or Census APIs directly.</p>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Free-form data explorer coming soon. You&apos;ll be able to select any source, browse indicators, apply filters, and visualize custom queries.</p>
        </div>
      </div>
    </>
  );
}
