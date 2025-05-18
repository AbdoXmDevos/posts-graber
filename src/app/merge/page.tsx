"use client"

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yvridhefmcfyznuopbab.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cmlkaGVmbWNmeXpudW9wYmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTUyNTAsImV4cCI6MjA2MTI3MTI1MH0.W9LAI6zikSioovgwvUJtoBu_qZlDn3Btk1KS6sSKw-E'
);

// Define types for Instagram post data
interface InstagramPost {
  imageUrl?: string;
  caption?: string;
  timestamp?: string;
  likes?: number;
  comments?: number;
  username?: string; // Added username field
  [key: string]: unknown; // For any other properties
}

type JsonFile = {
  id: string;
  created_at: string;
  instagram_username: string;
  result_number: number;
  json_text?: any;
  selected?: boolean; // For UI selection state
};

export default function MergePage() {
  const [jsonFiles, setJsonFiles] = useState<JsonFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergedData, setMergedData] = useState<InstagramPost[] | null>(null);
  const [showFullJson, setShowFullJson] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

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

        // Add selected property to each file
        const filesWithSelection = (data || []).map(file => ({
          ...file,
          selected: false
        }));

        setJsonFiles(filesWithSelection);
      } catch (err: any) {
        console.error('Error fetching JSON files:', err);
        setError(err.message || 'Failed to fetch JSON files');
      } finally {
        setLoading(false);
      }
    }

    fetchJsonFiles();
  }, []);

  const toggleFileSelection = (id: string) => {
    setJsonFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === id ? { ...file, selected: !file.selected } : file
      )
    );
  };

  const handleMergeFiles = async () => {
    try {
      const selectedFiles = jsonFiles.filter(file => file.selected);
      
      if (selectedFiles.length === 0) {
        setError('Please select at least one file to merge');
        return;
      }

      setMerging(true);
      setError(null);
      setMergedData(null);
      setDownloadLink('');
      setCopySuccess(null);

      // Fetch the full JSON content for each selected file
      const mergedPosts: InstagramPost[] = [];
      
      for (const file of selectedFiles) {
        // Fetch JSON content if not already loaded
        if (!file.json_text) {
          const { data, error } = await supabase
            .from('amine-json-files')
            .select('json_text')
            .eq('id', file.id)
            .single();

          if (error) {
            throw error;
          }

          file.json_text = data.json_text;
        }

        // Add username to each post and add to merged array
        const postsWithUsername = file.json_text.map((post: any) => ({
          ...post,
          username: file.instagram_username
        }));

        mergedPosts.push(...postsWithUsername);
      }

      // Set the merged data
      setMergedData(mergedPosts);

      // Create a downloadable blob
      const jsonString = JSON.stringify(mergedPosts, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setDownloadLink(url);

      // Show success toast
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(
          `Successfully merged ${mergedPosts.length} posts from ${selectedFiles.length} files!`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('Error merging JSON files:', err);
      setError(err.message || 'Failed to merge JSON files');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-white">Merge JSON Files</h2>
        <p className="text-gray-400 mb-4">
          Select multiple JSON files to merge them into a single file. Each post will include the username of the original account.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-300">
            {error}
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={handleMergeFiles}
            disabled={loading || merging || jsonFiles.filter(f => f.selected).length === 0}
            className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
              loading || merging || jsonFiles.filter(f => f.selected).length === 0
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
            }`}
          >
            {merging ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Merging...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Merge Selected Files
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : jsonFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No JSON files found in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-12">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Posts</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {jsonFiles.map((file) => (
                  <tr 
                    key={file.id} 
                    className={`hover:bg-gray-800 transition-colors cursor-pointer ${file.selected ? 'bg-purple-900/20' : ''}`}
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={file.selected || false}
                        onChange={() => toggleFileSelection(file.id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-700 rounded bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mergedData && mergedData.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-800 animate-slideIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Merged JSON Result</h3>
            <div className="flex space-x-2">
              <a
                href={downloadLink}
                download={`merged_instagram_${new Date().getTime()}.json`}
                className="inline-flex items-center px-3 py-1 bg-gray-800 text-purple-400 text-sm rounded hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download JSON ({mergedData.length} posts)
              </a>
              <button
                onClick={() => {
                  const jsonStr = JSON.stringify(mergedData, null, 2);
                  navigator.clipboard.writeText(jsonStr)
                    .then(() => {
                      setCopySuccess('Copied!');
                      setTimeout(() => setCopySuccess(null), 3000);
                    })
                    .catch(err => {
                      console.error('Failed to copy JSON:', err);
                      setCopySuccess('Failed');
                      setTimeout(() => setCopySuccess(null), 3000);
                    });
                }}
                className="inline-flex items-center px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors"
              >
                {copySuccess ? copySuccess : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy JSON
                  </>
                )}
              </button>
              <button
                onClick={() => setShowFullJson(!showFullJson)}
                className="inline-flex items-center px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors"
              >
                {showFullJson ? 'Show Less' : 'Show All'}
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className={`text-xs overflow-auto bg-black text-gray-300 p-4 rounded-md shadow-inner border border-gray-700 ${!showFullJson ? 'max-h-80' : ''}`}>
              {showFullJson
                ? JSON.stringify(mergedData, null, 2)
                : JSON.stringify(mergedData.slice(0, 3), null, 2) + (mergedData.length > 3 ? '\n// ... more items ...' : '')}
            </pre>

            {!showFullJson && mergedData.length > 3 && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
