import Head from "next/head";
import Link from "next/link";

const SLUG  = "fertiliser-localisation";
const TITLE = "India's Fertiliser Dependency: Can India Wean Itself Off Imports?";
const DATE  = "April 2026";
const TAGS  = ["Agriculture", "Trade", "Policy"];
const SOURCE_NOTE =
  "Data: Department of Fertilisers (MoC&I); PPAC; FAI Annual Statistical Yearbook; MoAFW.";

const TAG_COLORS: Record<string, string> = {
  Agriculture: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  Trade:       "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  Policy:      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
};

/** Placeholder block used where a chart will eventually sit */
function ChartPlaceholder({ label }: { label: string }) {
  return (
    <div className="my-6 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 h-64 flex items-center justify-center">
      <p className="text-sm text-gray-400 dark:text-gray-500">[Chart: {label}]</p>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 pl-4 border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/10 rounded-r-lg py-3 pr-4">
      <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">{children}</p>
    </div>
  );
}

export default function FertiliserLocalisation() {
  return (
    <>
      <Head>
        <title>{TITLE} | Data Stories · India Data Dashboard</title>
        <meta
          name="description"
          content="India spends over ₹1.5 lakh crore a year subsidising fertilisers yet imports nearly half its urea. Can domestic capacity and nano-urea close the gap?"
        />
      </Head>

      {/* Back nav */}
      <div className="mb-6">
        <Link
          href="/stories"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 no-underline flex items-center gap-1"
        >
          ← Data Stories
        </Link>
      </div>

      <article className="max-w-3xl">

        {/* Story header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {TAGS.map((t) => (
              <span
                key={t}
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  TAG_COLORS[t] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {TITLE}
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            India spends over ₹1.5 lakh crore a year subsidising fertilisers — yet imports nearly
            half its urea. This story traces the supply chain, maps regional consumption patterns,
            and examines whether domestic capacity expansion and nano-urea can close the gap.
          </p>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">{DATE} · 8 min read</p>
        </header>

        {/* ── Section 1 ── */}
        <section className="prose prose-gray dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
            The subsidy burden
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            India&apos;s fertiliser subsidy bill has more than doubled since 2019-20, ballooning to
            ₹1.75 lakh crore in 2022-23 after the Russia-Ukraine war sent global gas and potash
            prices to record highs. Urea alone — the most widely used nitrogen fertiliser — accounts
            for roughly 60% of that outlay, yet its retail price has been frozen at ₹242/bag
            (45 kg) since 2012 under the Nutrient-Based Subsidy scheme.
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            The gap between the controlled price and the economic cost is bridged entirely by the
            central government. When global gas prices spiked in 2021-22, that gap widened to over
            ₹3,500 per bag — meaning the government paid nearly fifteen times what farmers paid at
            the point of sale.
          </p>

          <ChartPlaceholder label="Fertiliser subsidy outlay vs. urea retail price, 2015-16 to 2023-24" />

          <Callout>
            At ₹1.75 lakh crore, India&apos;s 2022-23 fertiliser subsidy was larger than the
            entire defence capital outlay — and roughly twice the MGNREGA budget.
          </Callout>

          {/* ── Section 2 ── */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
            Why India still imports half its urea
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            India&apos;s 31 urea plants have a combined capacity of about 25 million metric tonnes
            (MMT) per year. Domestic demand, however, has consistently run above 33 MMT — leaving
            an 8–10 MMT shortfall that is covered by imports, primarily from Russia, Oman,
            China, and the UAE.
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Capacity has grown slowly because the economics of new urea plants are unfavourable
            without guaranteed feedstock. India&apos;s domestic natural gas prices were historically
            lower than import parity, but gas availability has been uncertain; most new plants
            prefer imported RLNG, which makes their cost structure sensitive to global LNG prices —
            the very volatility the subsidy regime is trying to insulate farmers from.
          </p>

          <ChartPlaceholder label="India urea production vs. consumption vs. imports, 2010-11 to 2023-24 (MMT)" />

          {/* ── Section 3 ── */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
            The regional imbalance
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Consumption is heavily skewed towards the Indo-Gangetic Plain. Uttar Pradesh, Punjab,
            Haryana, and Bihar together account for over 40% of urea offtake despite representing
            a smaller share of gross cropped area — a reflection of the wheat-paddy cropping system
            that is among the most fertiliser-intensive in the world.
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            By contrast, states like Rajasthan, Madhya Pradesh, and much of the north-east are
            significantly under-fertilised relative to agronomic potential, partly due to logistics
            and partly because subsidy benefits are less accessible in fragmented land-holding
            markets.
          </p>

          <ChartPlaceholder label="State-wise urea consumption per hectare of net sown area (choropleth, latest year)" />

          {/* ── Section 4 ── */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
            Can nano-urea change the equation?
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            IFFCO&apos;s nano-urea — a liquid formulation sprayed directly on leaves — has been
            positioned as a game-changer. A 500 ml bottle (sold at ₹225) is claimed to replace
            one bag (45 kg) of conventional urea, dramatically reducing both logistics costs and
            import dependence. By 2023-24, IFFCO had capacity to produce over 200 million bottles
            per year across its Kalol and Phulpur plants.
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Independent agronomic studies have shown more mixed results. Meta-analyses across
            kharif crops suggest yield responses of 4–8% with nano-urea supplementation — positive
            but not consistently equivalent to a full bag substitution. The government&apos;s push
            to blend nano-urea requirements into procurement contracts for conventional urea has
            drawn farmer pushback, and mandatory blending targets were subsequently softened.
          </p>

          <Callout>
            The nano-urea story is still being written. At scale, even a 20–25% substitution rate
            would reduce import dependence by ~2 MMT — worth ~₹7,000 crore in annual foreign
            exchange at current prices.
          </Callout>

          {/* ── Section 5 ── */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
            What the data suggests about the path forward
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Three themes emerge from the data. First, the flat retail price has discouraged
            efficient use — nitrogen use efficiency in India&apos;s paddy-wheat belt is among the
            lowest globally. A direct benefit transfer model, piloted in a handful of districts
            since 2017, transfers subsidies to farmer accounts rather than suppressing price,
            allowing market signals to guide application rates.
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Second, new domestic capacity is coming. The revival of the Ramagundam, Gorakhpur,
            Sindri, and Barauni plants under the New Urea Policy added roughly 3.5 MMT of new
            capacity between 2018 and 2022. A further 1.27 MMT Talcher plant — to be fed by
            coal gasification rather than natural gas — is under construction.
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Third, diversification away from urea matters as much as replacing urea imports.
            The NPK imbalance — India applies roughly 8 kg of potash for every 30 kg of nitrogen —
            reflects the pricing distortion. Correcting this would reduce absolute urea demand
            while improving soil health and crop resilience.
          </p>

          <ChartPlaceholder label="NPK nutrient consumption ratio over time (N:P:K balance)" />

          {/* ── Closing ── */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
            The bottom line
          </h2>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            India is unlikely to become fully self-sufficient in fertilisers in the near term —
            potash and phosphate will remain almost entirely imported regardless of domestic
            industrial policy. But the urea import dependency is addressable: a combination of new
            gas-based capacity, nano-urea at proven agronomic doses, and a gradual shift toward
            DBT pricing could reduce the import bill by ₹15,000–20,000 crore annually by 2030.
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            The harder reform — gradually rationalising the retail price while protecting farmer
            incomes through direct transfers — remains politically difficult but economically
            compelling. The data makes the case; the politics will decide the timing.
          </p>
        </section>

        {/* Source note */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">{SOURCE_NOTE}</p>
        </div>

        {/* Back link */}
        <div className="mt-6">
          <Link
            href="/stories"
            className="text-sm text-orange-600 dark:text-orange-400 hover:underline no-underline"
          >
            ← Back to Data Stories
          </Link>
        </div>

      </article>
    </>
  );
}
