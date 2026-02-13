import Head from "next/head";
import DatasetCard from "@/components/ui/DatasetCard";
import { datasets } from "@/config/datasets.config";

export default function DashboardsIndex() {
  return (
    <>
      <Head>
        <title>All Dashboards | India Data Dashboard</title>
        <meta
          name="description"
          content="Browse all available data dashboards for India's economy, industry, energy, and demographics."
        />
      </Head>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          All Dashboards
        </h1>
        <p className="text-gray-600 mb-6">
          Interactive visualizations across {datasets.length} datasets from
          government and international sources.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map((ds) => (
            <DatasetCard key={ds.id} dataset={ds} />
          ))}
        </div>
      </div>
    </>
  );
}
