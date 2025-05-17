"use client"
import { useState, useEffect } from 'react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [limit, setLimit] = useState<number | ''>(30); // Default limit of 30 posts
  const [fields, setFields] = useState({
    imageUrl: true,
    caption: true,
    timestamp: false,
    likes: false,
    comments: false
  });
  const [downloadLink, setDownloadLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<any[] | null>(null);
  const [showFullJson, setShowFullJson] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [savedToDatabase, setSavedToDatabase] = useState(false);

  const handleSubmit = async () => {
    if (!username) {
      setError('Please enter an Instagram username');
      return;
    }

    // If limit is empty string, it will be treated as unlimited (0)
    // Otherwise, ensure it's a non-negative number
    if (limit !== '' && limit < 0) {
      setError('Please enter a valid limit (0 or empty for unlimited)');
      return;
    }

    setLoading(true);
    setError(null);
    setDownloadLink('');
    setProcessingTime(0);
    setJsonData(null);
    setShowFullJson(false);
    setCopySuccess(null);

    // Start a timer to show processing time
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setProcessingTime(elapsedSeconds);
    }, 1000);

    try {
      // Convert empty string limit to 0 (unlimited)
      const effectiveLimit = limit === '' ? 0 : limit;

      const response = await fetch('/api/scrape', {
        method: 'POST',
        body: JSON.stringify({
          username,
          fields,
          limit: effectiveLimit // Include the limit parameter in the API call
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // First check if the response is valid JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response. Please check server logs.');
      }

      if (!response.ok) {
        // Check if it's a Supabase connection error
        if (data.error === 'Failed to connect to Supabase storage') {
          throw new Error(`Storage service error: ${data.message}`);
        } else {
          throw new Error(data.message || data.error || 'Failed to fetch Instagram data');
        }
      }

      // We should always get direct data now
      if (data.data) {
        // Store the JSON data for display
        setJsonData(data.data);

        // Create a downloadable blob
        const jsonString = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        setDownloadLink(url);

        // Set saved to database state
        setSavedToDatabase(data.savedToDatabase || false);

        // Log some info about the data
        console.info(`Received ${data.postCount} posts for ${data.username}`);
        console.info(`Timestamp: ${data.timestamp}`);
        console.info(`Suggested filename: ${data.fileName}`);
        console.info(`Saved to database: ${data.savedToDatabase}`);

        // Show success toast with link to list page
        if (data.savedToDatabase && (window as any).showToast) {
          (window as any).showToast(
            `Successfully generated JSON for @${username} with ${data.postCount} posts!`,
            'success',
            '/list',
            'View all files'
          );
        }
      } else {
        throw new Error('No data returned from server');
      }
    } catch (err: any) {
      console.error('Error fetching Instagram data:', err);

      // Check if the error is related to a timeout
      if (
        err.message && (
          err.message.includes('timed out') ||
          err.message.includes('timeout') ||
          err.message.includes('Apify run timed out')
        )
      ) {
        setError('Generation timed out. Please try to regenerate with fewer posts or try again later.');
      } else {
        setError(err.message || 'Failed to fetch Instagram data. Please try again later.');
      }
    } finally {
      clearInterval(timerInterval);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-lg shadow-md border border-gray-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Generate Instagram JSON</h2>

      <div className="mb-4">
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Instagram username"
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Number of posts to extract (empty or 0 for unlimited):
        </label>
        <div className="flex items-center">
          <input
            type="number"
            min="0"
            value={limit}
            onChange={e => {
              const inputValue = e.target.value;
              if (inputValue === '') {
                // Allow empty input (will be treated as unlimited)
                setLimit('');
              } else {
                const val = parseInt(inputValue);
                if (!isNaN(val) && val >= 0) {
                  setLimit(val);
                }
              }
            }}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Fields to include:</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center text-gray-300 hover:text-white">
            <input
              type="checkbox"
              checked={fields.imageUrl}
              onChange={() => setFields(f => ({ ...f, imageUrl: !f.imageUrl }))}
              className="mr-2 h-4 w-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-800"
            />
            Image URL
          </label>
          <label className="flex items-center text-gray-300 hover:text-white">
            <input
              type="checkbox"
              checked={fields.caption}
              onChange={() => setFields(f => ({ ...f, caption: !f.caption }))}
              className="mr-2 h-4 w-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-800"
            />
            Caption
          </label>
          <label className="flex items-center text-gray-300 hover:text-white">
            <input
              type="checkbox"
              checked={fields.timestamp}
              onChange={() => setFields(f => ({ ...f, timestamp: !f.timestamp }))}
              className="mr-2 h-4 w-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-800"
            />
            Timestamp
          </label>
          <label className="flex items-center text-gray-300 hover:text-white">
            <input
              type="checkbox"
              checked={fields.likes}
              onChange={() => setFields(f => ({ ...f, likes: !f.likes }))}
              className="mr-2 h-4 w-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-800"
            />
            Likes Count
          </label>
          <label className="flex items-center text-gray-300 hover:text-white">
            <input
              type="checkbox"
              checked={fields.comments}
              onChange={() => setFields(f => ({ ...f, comments: !f.comments }))}
              className="mr-2 h-4 w-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-800"
            />
            Comments Count
          </label>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
      >
        {loading ? `Processing... (${processingTime}s)` : 'Generate JSON'}
      </button>

      {loading && (
        <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-md text-sm">
          <div className="flex items-center text-gray-300">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {processingTime > 10
              ? `Instagram data scraping can take up to 60 seconds. Please be patient... (${processingTime}s)`
              : 'Processing request...'}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: `${Math.min(processingTime * 1.6, 100)}%` }}></div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-gray-800 border border-red-900 rounded-md text-gray-200">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold mb-1 text-red-400">
                {error.includes('Storage service error') ? 'Storage Service Error' : 'Error'}
              </div>
              <div>{error}</div>
              {error.includes('try to regenerate') && (
                <div className="mt-3 p-2 bg-gray-700 rounded-md border border-gray-600">
                  <p className="text-yellow-300 font-medium">Suggestion:</p>
                  <p className="text-gray-300 mt-1">Try setting a lower post limit or try again in a few minutes.</p>
                </div>
              )}
              {error.includes('Storage service error') && (
                <div className="mt-3 text-sm border-t border-gray-700 pt-3">
                  <strong className="text-gray-300">Troubleshooting:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-400">
                    <li>Make sure your Supabase environment variables are correctly set in the .env file</li>
                    <li>Check that SUPABASE_URL and SUPABASE_KEY are valid</li>
                    <li>Verify that the 'instagram-files' bucket exists in your Supabase storage</li>
                    <li>Ensure your Supabase service is running and accessible</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {downloadLink && jsonData && (
        <div className="mt-6 flex space-x-3">
          <a
            href={downloadLink}
            download={`instagram_${username}_${Date.now()}.json`}
            className="flex-1 p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md text-center hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center"
            onClick={() => {
              // Clean up blob URLs when they're clicked to prevent memory leaks
              setTimeout(() => {
                URL.revokeObjectURL(downloadLink);
              }, 1000);
            }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download JSON ({jsonData.length} posts)
          </a>
          <button
            onClick={() => {
              const jsonStr = JSON.stringify(jsonData, null, 2);
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
            className="p-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 border border-gray-700 relative flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            {copySuccess ? copySuccess : 'Copy All'}
            {copySuccess === 'Copied!' && (
              <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3"></span>
            )}
          </button>
        </div>
      )}

      {jsonData && jsonData.length > 0 && (
        <div className="mt-6 border border-gray-700 rounded-lg p-5 bg-gray-800">
          <div className="bg-gray-900 p-4 rounded-md mb-4 text-sm border border-gray-700">
            <div className="font-medium text-purple-400 mb-2">Data Summary:</div>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <div className="text-gray-300">Total Posts: <span className="font-semibold text-white">{jsonData.length}</span></div>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="text-gray-300">Username: <span className="font-semibold text-white">@{username}</span></div>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div className="text-gray-300">Limit: <span className="font-semibold text-white">{limit === 0 || limit === '' ? "Unlimited" : `${limit} posts`}</span></div>
              </div>
              {jsonData[0]?.timestamp && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-gray-300">Latest: <span className="font-semibold text-white">
                    {new Date(jsonData[0].timestamp).toLocaleDateString()}
                  </span></div>
                </div>
              )}
              {jsonData[0]?.likes && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <div className="text-gray-300">Avg. Likes: <span className="font-semibold text-white">
                    {Math.round(jsonData.reduce((sum, post) => sum + (post.likes || 0), 0) / jsonData.length)}
                  </span></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-semibold text-gray-200">JSON Preview:</h3>
            <button
              onClick={() => setShowFullJson(!showFullJson)}
              className="text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded-md hover:bg-gray-600 border border-gray-600"
            >
              {showFullJson ? 'Show Less' : `Show All (${jsonData.length} items)`}
            </button>
          </div>

          <div className="relative">
            <pre className={`text-xs overflow-auto bg-black text-gray-300 p-4 rounded-md shadow-inner border border-gray-700 ${!showFullJson ? 'max-h-80' : ''}`}>
              {showFullJson
                ? JSON.stringify(jsonData, null, 2)
                : JSON.stringify(jsonData.slice(0, 3), null, 2) + (jsonData.length > 3 ? '\n// ... more items ...' : '')}
            </pre>

            {!showFullJson && jsonData.length > 3 && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
