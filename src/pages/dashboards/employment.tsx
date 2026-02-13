import Head from "next/head";

export default function EmploymentDashboard() {
  return (
    <>
      <Head>
        <title>Employment & Labour | India Data Dashboard</title>
      </Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Employment & Labour (PLFS)
        </h1>
        <p className="text-gray-600 mb-6">
          Unemployment rate, LFPR, WPR, wages, and worker distribution from the
          Periodic Labour Force Survey.
        </p>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <span className="text-4xl">👷</span>
          <p className="text-gray-500 mt-4">
            MoSPI PLFS API integration coming soon. Will include unemployment
            rate, labor force participation, wages by employment type, and
            state-level breakdowns.
          </p>
        </div>
      </div>
    </>
  );
}
