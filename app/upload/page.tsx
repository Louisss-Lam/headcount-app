'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FileDropZone from '@/components/FileDropZone';

interface ManagerPreview {
  id: string;
  full_name: string;
  email?: string;
  agentCount: number;
}

interface SendStatus {
  managerId: string;
  name: string;
  email: string;
  status: 'sent' | 'failed' | 'no_email';
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
  const [isSending, setIsSending] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [managers, setManagers] = useState<ManagerPreview[]>([]);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [sendResults, setSendResults] = useState<SendStatus[]>([]);
  const [sendSummary, setSendSummary] = useState<string | null>(null);

  // Fetch existing managers on page load
  useEffect(() => {
    async function fetchManagers() {
      try {
        const res = await fetch('/api/managers');
        const data = await res.json();
        if (res.ok && data.managers) {
          setManagers(
            data.managers.map((m: { id: string; full_name: string; email?: string }) => ({
              ...m,
              agentCount: 0,
            }))
          );
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
    setSendResults([]);
    setSendSummary(null);

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
      setManagers(data.managers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAll = async () => {
    setIsSending(true);
    setError(null);
    setSendSummary(null);

    try {
      const res = await fetch('/api/notifications/send', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send notifications');
      }

      setSendResults(data.results);
      const sent = data.emailsSent ?? 0;
      const failed = data.emailsFailed ?? 0;
      setSendSummary(`${sent} email(s) sent successfully.${failed > 0 ? ` ${failed} failed.` : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notifications');
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async (managerId: string) => {
    setResendingId(managerId);

    try {
      const res = await fetch('/api/notifications/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend');
      }

      // Update status for this manager
      setSendResults((prev) => {
        const exists = prev.some((r) => r.managerId === managerId);
        if (exists) {
          return prev.map((r) => (r.managerId === managerId ? { ...r, status: 'sent' as const } : r));
        }
        // Manager not in results yet (re-send before "Send All") — add them
        const mgr = managers.find((m) => m.id === managerId);
        return [...prev, { managerId, name: mgr?.full_name ?? '', email: mgr?.email ?? '', status: 'sent' as const }];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend notification');
    } finally {
      setResendingId(null);
    }
  };

  // Build a lookup from send results
  const statusByManager = new Map(sendResults.map((r) => [r.managerId, r]));

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

      {sendSummary && (
        <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          {sendSummary}
        </div>
      )}

      {managers.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Managers ({managers.length})
            </h2>
            <button
              onClick={handleSendAll}
              disabled={isSending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {isSending ? 'Sending...' : 'Send All Links'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Manager</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Email</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Agents</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => {
                  const status = statusByManager.get(manager.id);
                  return (
                    <tr key={manager.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">{manager.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">{manager.email || '—'}</td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {manager.agentCount > 0 ? manager.agentCount : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!status && (
                          <span className="text-gray-400">—</span>
                        )}
                        {status?.status === 'sent' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Sent
                          </span>
                        )}
                        {status?.status === 'failed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Failed
                          </span>
                        )}
                        {status?.status === 'no_email' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            No email
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {manager.email ? (
                          <button
                            onClick={() => handleResend(manager.id)}
                            disabled={resendingId === manager.id}
                            className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resendingId === manager.id ? 'Sending...' : 'Re-send'}
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
