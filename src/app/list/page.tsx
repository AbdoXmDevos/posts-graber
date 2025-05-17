"use client"

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yvridhefmcfyznuopbab.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cmlkaGVmbWNmeXpudW9wYmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTUyNTAsImV4cCI6MjA2MTI3MTI1MH0.W9LAI6zikSioovgwvUJtoBu_qZlDn3Btk1KS6sSKw-E'
);

type JsonFile = {
  id: string;
  created_at: string;
  instagram_username: string;
  result_number: number;
  json_text?: any;
};

export default function ListPage() {
  const [jsonFiles, setJsonFiles] = useState<JsonFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<JsonFile | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showFullJson, setShowFullJson] = useState(false);

  useEffect(() => {
    async function fetchJsonFiles() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('amine-json-files')
          .select('id, created_at, instagram_username, result_number')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setJsonFiles(data || []);
      } catch (err: any) {
        console.error('Error fetching JSON files:', err);
        setError(err.message || 'Failed to fetch JSON files');
      } finally {
        setLoading(false);
      }
    }

    fetchJsonFiles();
  }, []);

  const handleViewJson = async (file: JsonFile) => {
    if (!file.json_text) {
      try {
        const { data, error } = await supabase
          .from('amine-json-files')
          .select('json_text')
          .eq('id', file.id)
          .single();

        if (error) {
          throw error;
        }

        file.json_text = data.json_text;
      } catch (err: any) {
        console.error('Error fetching JSON content:', err);
        setError(err.message || 'Failed to fetch JSON content');
        return;
      }
    }

    setSelectedFile(file);
    setShowJsonPreview(true);
    setShowFullJson(false);
  };

  const handleDownloadJson = (file: JsonFile) => {
    if (!file.json_text) {
      handleViewJson(file);
      return;
    }

    const jsonString = JSON.stringify(file.json_text, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram_${file.instagram_username}_${new Date(file.created_at).getTime()}.json`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 text-purple-300">Instagram JSON Files</h2>
        <p className="text-gray-400 mb-6">View and download your previously generated Instagram data</p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : jsonFiles.length === 0 ? (
          <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded">
            <p>No JSON files found. Generate some data first!</p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Posts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {jsonFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-200">{file.instagram_username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {new Date(file.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">{file.result_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center">
                      <button
                        onClick={() => handleViewJson(file)}
                        className="flex items-center cursor-pointer text-purple-400 hover:text-purple-300 mr-4 bg-gray-800 px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadJson(file)}
                        className="flex items-center text-green-400 cursor-pointer hover:text-green-300 bg-gray-800 px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedFile && showJsonPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col text-white">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-purple-300">
                  {selectedFile.instagram_username} - {new Date(selectedFile.created_at).toLocaleString()}
                </h3>
                <button
                  onClick={() => {
                    setShowJsonPreview(false);
                    setShowFullJson(false);
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-auto flex-grow">
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-300">JSON Preview:</h3>
                    <button
                      onClick={() => setShowFullJson(!showFullJson)}
                      className="text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded hover:bg-gray-600"
                    >
                      {showFullJson ? 'Show Less' : `Show All (${selectedFile.json_text.length} items)`}
                    </button>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    {selectedFile.result_number} posts from @{selectedFile.instagram_username}
                  </div>
                </div>
                <pre className="text-xs bg-black text-gray-300 p-4 rounded shadow-inner overflow-auto max-h-[60vh] border border-gray-700">
                  {showFullJson
                    ? JSON.stringify(selectedFile.json_text, null, 2)
                    : JSON.stringify(selectedFile.json_text.slice(0, 3), null, 2) +
                      (selectedFile.json_text.length > 3 ? '\n// ... more items ...' : '')}
                </pre>
              </div>
              <div className="p-4 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => handleDownloadJson(selectedFile)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
