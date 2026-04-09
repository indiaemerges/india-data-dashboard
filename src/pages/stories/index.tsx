import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

interface Story {
  slug?: string;
  externalUrl?: string;
  title: string;
  description: string;
  date: string;
  readingTime?: string;
  tags: string[];
  previewImage?: string;
  status: "live" | "coming-soon";
}

const stories: Story[] = [
  {
    externalUrl: "https://indiaemerges.substack.com/p/indias-fertiliser-dependency-can",
    title: "India's Fertiliser Dependency: Can India Wean Itself Off Imports?",
    description:
      "India spends around $30 billion a year keeping urea cheap for farmers. Most of that money flows out as imported gas — sourced from the same Gulf region whose shipping lanes are now under stress.",
    date: "8 Apr 2026",
    tags: ["Agriculture", "Trade", "Policy"],
    previewImage:
      "https://substackcdn.com/image/fetch/$s_!Uxxi!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F34c38b1e-c677-45b5-8474-5404a4e0a3ba_1272x944.png",
    status: "live",
  },
];

const TAG_COLORS: Record<string, string> = {
  Agriculture: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  Trade:       "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  Policy:      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  Economy:     "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  Energy:      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  Banking:     "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
};

function TagBadge({ tag }: { tag: string }) {
  const cls = TAG_COLORS[tag] ?? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {tag}
    </span>
  );
}

function StoryCard({ story }: { story: Story }) {
  const href = story.externalUrl ?? (story.slug ? `/stories/${story.slug}` : "#");
  const isExternal = !!story.externalUrl;

  const inner = (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-md">
      {/* Preview image */}
      {story.previewImage && (
        <div className="relative w-full h-48">
          <Image
            src={story.previewImage}
            alt={story.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
        </div>
      )}

      <div className="p-5 flex flex-col gap-3">
        {/* Tags + external badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {story.tags.map((t) => (
            <TagBadge key={t} tag={t} />
          ))}
          {story.status === "coming-soon" && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 ml-auto">
              Coming soon
            </span>
          )}
          {isExternal && story.status === "live" && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 ml-auto">
              Substack ↗
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">
          {story.title}
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">
          {story.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-400 dark:text-gray-500">{story.date}</span>
          {story.readingTime && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{story.readingTime} read</span>
          )}
          {story.status === "live" && (
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
              {isExternal ? "Read on Substack →" : "Read story →"}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (story.status === "coming-soon") return <div>{inner}</div>;

  return isExternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="no-underline block">
      {inner}
    </a>
  ) : (
    <Link href={href} className="no-underline block">{inner}</Link>
  );
}

export default function StoriesIndex() {
  const live       = stories.filter((s) => s.status === "live");
  const comingSoon = stories.filter((s) => s.status === "coming-soon");

  return (
    <>
      <Head>
        <title>Data Stories | India Data Dashboard</title>
        <meta
          name="description"
          content="Long-form data journalism exploring India's economy, agriculture, energy, and more — powered by official government datasets."
        />
      </Head>

      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Data Stories
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Long-form data journalism exploring India&apos;s economy, agriculture, energy, and more
            — each story grounded entirely in official government datasets.
          </p>
        </div>

        {/* Live stories */}
        {live.length > 0 && (
          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {live.map((s, i) => (
                <StoryCard key={s.slug ?? s.externalUrl ?? i} story={s} />
              ))}
            </div>
          </section>
        )}

        {/* Coming soon */}
        {comingSoon.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              In the pipeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comingSoon.map((s, i) => (
                <StoryCard key={s.slug ?? s.externalUrl ?? i} story={s} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {stories.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center">
            <span className="text-4xl">📖</span>
            <p className="text-gray-500 dark:text-gray-400 mt-4">
              The first story is being written. Check back soon.
            </p>
          </div>
        )}

        {/* About section */}
        <div className="mt-12 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800">
          <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200">
            About Data Stories
          </h3>
          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
            Each story is a self-contained analytical piece that combines prose with embedded
            charts, tables, and maps. All data comes from official sources — MoSPI, RBI, Ministry
            of Agriculture, and others — and is processed using the same pipelines that power the
            rest of this dashboard.
          </p>
        </div>
      </div>
    </>
  );
}
