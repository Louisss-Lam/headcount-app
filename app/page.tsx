import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Headcount Tracker
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        Upload your daily agent roster, drag-and-drop each agent into their
        category, and export the results to Excel.
      </p>
      <Link
        href="/upload"
        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
      >
        Get Started — Upload Excel
      </Link>
    </div>
  );
}
