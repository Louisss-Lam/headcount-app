'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FileDropZone from '@/components/FileDropZone';

interface ManagerResult {
  id: number;
  full_name: string;
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadPageContent />
    </Suspense>
  );
}

function UploadPageContent() {
  const searchParams = useSearchParams();
  const submitted = searchParams.get('submitted');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managers, setManagers] = useState<ManagerResult[]>([]);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Fetch existing managers on page load
  useEffect(() => {
    async function fetchManagers() {
      try {
        const res = await fetch('/api/managers');
        const data = await res.json();
        if (res.ok && data.managers) {
          setManagers(data.managers);
        }
      } catch {
        // ignore — managers will show after upload
      }
    }
    fetchManagers();
  }, []);

  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadMessage(data.message);
      // Refresh manager list after upload
      const mgrRes = await fetch('/api/managers');
      const mgrData = await mgrRes.json();
      if (mgrRes.ok && mgrData.managers) {
        setManagers(mgrData.managers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Agent Roster</h1>

      {/* Submission feedback banners */}
      {submitted === 'email_sent' && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Headcount submitted and report emailed successfully.
        </div>
      )}
      {submitted === 'email_failed' && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
          Headcount submitted, but the email failed to send. Please try again.
        </div>
      )}
      {submitted === 'no_email' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          Headcount submitted. No recipient email was provided.
        </div>
      )}

      <FileDropZone onFileSelected={handleFileSelected} isLoading={isLoading} />

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {uploadMessage && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {uploadMessage}
        </div>
      )}

      {managers.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select a manager to start headcount:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {managers.map((manager) => (
              <Link
                key={manager.id}
                href={`/headcount/${manager.id}`}
                className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-center"
              >
                <p className="font-medium text-gray-900">{manager.full_name}</p>
                <p className="text-sm text-blue-600 mt-2">Start headcount &rarr;</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
