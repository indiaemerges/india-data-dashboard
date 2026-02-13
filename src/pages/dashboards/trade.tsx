import Head from "next/head";
import { useWorldBankIndicators } from "@/lib/hooks/useWorldBank";
import { WORLD_BANK_INDICATORS } from "@/lib/api/worldbank";
import LineChart from "@/components/charts/LineChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

export default function TradeDashboard() {
  const { data: series, isLoading, error, refetch } = useWorldBankIndicators(
    [
      WORLD_BANK_INDICATORS.EXPORTS_GDP_PCT,
      WORLD_BANK_INDICATORS.IMPORTS_GDP_PCT,
      WORLD_BANK_INDICATORS.FDI_NET_INFLOWS_GDP,
      WORLD_BANK_INDICATORS.CURRENT_ACCOUNT_GDP,
    ],
    { years: 35 }
  );

  if (isLoading) return <LoadingSpinner message="Fetching trade data..." />;
  if (error || !series?.length) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : "Failed to fetch trade data"}
        onRetry={() => refetch()}
      />
    );
  }

  // Split into trade flow and capital flow charts
  const tradeFlows = series.filter(
    (s) =>
      s.indicatorId === WORLD_BANK_INDICATORS.EXPORTS_GDP_PCT ||
      s.indicatorId === WORLD_BANK_INDICATORS.IMPORTS_GDP_PCT
  );
  const capitalFlows = series.filter(
    (s) =>
      s.indicatorId === WORLD_BANK_INDICATORS.FDI_NET_INFLOWS_GDP ||
      s.indicatorId === WORLD_BANK_INDICATORS.CURRENT_ACCOUNT_GDP
  );

  return (
    <>
      <Head>
        <title>International Trade | India Data Dashboard</title>
      </Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          International Trade
        </h1>
        <p className="text-gray-600 mb-6">
          India&apos;s exports, imports, FDI, and current account balance as a
          percentage of GDP.
        </p>

        <div className="space-y-6">
          {tradeFlows.length > 0 && (
            <LineChart
              series={tradeFlows}
              title="Trade as % of GDP"
              subtitle="Exports and Imports of goods and services"
              source="World Bank"
              yAxisTitle="% of GDP"
              height={420}
            />
          )}

          {capitalFlows.length > 0 && (
            <LineChart
              series={capitalFlows}
              title="Capital Flows as % of GDP"
              subtitle="Foreign Direct Investment and Current Account Balance"
              source="World Bank"
              yAxisTitle="% of GDP"
              height={420}
            />
          )}
        </div>
      </div>
    </>
  );
}
