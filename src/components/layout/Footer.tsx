export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              Data sourced from{" "}
              <a
                href="https://www.mospi.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 dark:text-orange-400 hover:underline"
              >
                MoSPI
              </a>
              ,{" "}
              <a
                href="https://data.worldbank.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 dark:text-orange-400 hover:underline"
              >
                World Bank
              </a>
              ,{" "}
              <a
                href="https://dbie.rbi.org.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 dark:text-orange-400 hover:underline"
              >
                RBI
              </a>
              , and other government sources.
            </p>
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            <a
              href="https://github.com/indiaemerges"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 dark:hover:text-gray-300"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
