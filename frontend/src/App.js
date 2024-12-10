import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        'http://localhost:5000/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.success) {
        setIsFileUploaded(true);
        setError('');
        alert('File uploaded and context ready for questions!');
      } else {
        setError('Error uploading file');
      }
    } catch (error) {
      console.error('Error during file upload:', error);
      setError('Error during file upload');
    }
  };

  const handleSubmit = async () => {
    if (!isFileUploaded) {
      setError('Please upload a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/conversation', { userInput });
      if (res.data.success) {
        setAiResponse(res.data.aiResponse);
      } else {
        setError('No response received from AI');
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      setError('Failed to communicate with the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8 transition duration-300 ease-in-out">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto bg-gray-800 shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-blueAccent mb-4 text-center">SESmag AI - Fee Persona</h1>

        {/* Upload File Section */}
        <div className="mb-6">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="border border-blueAccent bg-gray-700 rounded-md py-2 px-3 w-full"
          />
          <button
            onClick={handleUpload}
            className="mt-2 bg-blueAccent text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition duration-200"
          >
            Upload File
          </button>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>

        <hr className="my-4 border-gray-700" />

        {/* User Query Section */}
        <div className="mb-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask me about SESMag..."
            className="border bg-gray-700 text-white rounded-md py-2 px-3 w-full"
          />
          <button
            onClick={handleSubmit}
            className={`mt-2 ${
              isFileUploaded ? 'bg-blueAccent' : 'bg-gray-500 cursor-not-allowed'
            } text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition duration-200 w-full`}
            disabled={!isFileUploaded}
          >
            Ask Fee
          </button>
        </div>

        {/* Loading/Error/Response */}
        {loading && <p className="text-blue-400 text-center">Loading...</p>}
        {error && <p className="text-red-400 text-center">{error}</p>}
        {aiResponse && (
          <div className="mt-4 bg-gray-700 border border-blueAccent p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Response:</h3>
            <p className="text-gray-200">{aiResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
