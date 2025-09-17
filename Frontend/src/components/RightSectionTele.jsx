import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TeleMedical = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showInvalidScreen, setShowInvalidScreen] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [underReview, setUnderReview] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleUploadClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'];

    if (!audioTypes.includes(file.type)) {
      setShowInvalidScreen(true);
      return;
    }

    setSelectedFile(file);
    setShowInvalidScreen(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadedFile(null);
    setShowDropdown(false);
    setUnderReview(false);
  };

  const handleStartUpload = () => {
    if (!selectedFile) return;

    setUploadProgress(0);
    setUploadComplete(false);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadComplete(true);
          setUploadedFile(selectedFile);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDelete = () => {
    setSelectedFile(null);
    setUploadedFile(null);
    setUploadComplete(false);
    setUploadProgress(0);
    setUnderReview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePreview = () => {
    if (!uploadedFile) return;
    const fileUrl = URL.createObjectURL(uploadedFile);
    window.open(fileUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  };

  const handleProceed = () => {
    let nextScreens = JSON.parse(sessionStorage.getItem('nextScreens') || '[]');

    if (nextScreens.length > 0) {
      const next = nextScreens.shift(); // Take current screen
      sessionStorage.setItem('nextScreens', JSON.stringify(nextScreens));

      navigate(next, { replace: true }); // ✅ Always navigate to `next`
    } else {
      // ✅ If no screens left, show Under Review
      setUnderReview(true);
    }
  };

  return (
    <div className="w-full h-full overflow-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[#0F012A] font-medium text-xl">Welcome to Kazunov 1AI</h1>
        <p className="text-[#534B68] text-sm">Your one-stop insurance underwriting provider</p>
      </div>

      {/* Progress Steps */}
      <div className="flex flex-col items-start gap-2 w-full mb-4">
        <div className="w-full h-[70px] px-4 py-2 bg-white rounded-md shadow-[0px_0px_12px_0px_rgba(51,113,242,0.09)] flex flex-col items-start gap-2">
          <div className="flex items-center gap-1 w-full">
            <div className="flex flex-col justify-center items-center w-3 h-3 rounded-full bg-[#DFE8FB]">
              <div className="w-[8px] h-[8px] rounded-full bg-[#3371F2]"></div>
            </div>
            <div className="h-0 flex-1 border-t border-t-[rgba(51,113,242,0.20)]"></div>
            <div className="flex flex-col justify-center items-center w-3 h-3 rounded-full bg-[#DFE8FB]"></div>
          </div>

          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col items-start gap-1 font-semibold">
              <span className="text-[rgba(15,1,42,0.70)] text-xs">Proposal Form</span>
              <span className="text-xs"></span>
            </div>
            <div className="flex flex-col items-start gap-1 font-semibold">
              <span className="text-[rgba(15,1,42,0.70)] text-xs">Telemedical</span>
              <span className="text-xs"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Under Review Screen */}
      {underReview ? (
        <div className="bg-white shadow-md rounded-md p-3 mt-3 min-h-[200px] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center mb-0 mt-[-10px] text-center p-6">
            <img src="/assets/under-review.svg" alt="Under Review" className="w-70 h-70 mb-4" />
            <div className="flex items-center gap-1">
              <h2 className="text-lg font-semibold text-[#0F012A]">Your Application is Under Review</h2>
              <img src="/assets/help-icon.svg" alt="Help" className="w-3 h-3" />
            </div>
            <p className="text-sm text-[#534B68] mt-1 mb-4 max-w-sm">
              Your application is currently under review by our dedicated team. You’ll receive an update on the status soon.
            </p>
            <button className="flex items-center gap-1 border border-[#3371F2] text-[#3371F2] text-sm px-4 py-1.5 rounded mx-auto">
              <img src="/assets/help.svg" className="w-4 h-4" alt="Help" />
              Help center
            </button>
          </div>
        </div>
      ) : !showInvalidScreen ? (
        <div className="bg-white rounded-md p-4 shadow flex flex-col gap-4">
          {/* Original Header Section */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex justify-center items-center rounded-md bg-[#EDF2FD]">
                <img src="/assets/form-svgrepo.svg" alt="PDF" className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1">
                  <h2 className="text-black text-lg font-semibold">Upload Telemedical Audio</h2>
                  <img src="/assets/help-icon.svg" alt="Help" className="w-3 h-3" />
                </div>
                <p className="text-[#534B68] text-xs">Attach the telemedical audio file (e.g., mp3, wav)</p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {uploadComplete ? (
            <div className="border-2 border-dashed border-[#3371F2] rounded-md w-full p-4">
              <div className="flex flex-col items-center gap-2">
                <img src="/assets/CheckCircleFilled.svg" alt="Success" className="w-8 h-8" />
                <p className="text-[#7CBB5B] text-sm font-medium">File uploaded successfully</p>
                <div className="flex items-center justify-between w-full p-1 rounded-md relative">
                  <div>
                    <p className="text-sm text-[#0F012A]">{uploadedFile.name}</p>
                    <p className="text-xs text-[#534B68]">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <img
                    src="/assets/EllipsisOutlined.svg"
                    alt="Menu"
                    className="w-5 h-5 cursor-pointer"
                    onClick={() => setShowDropdown(!showDropdown)}
                  />
                  {showDropdown && (
                    <div className="absolute right-0 top-8 w-28 bg-white border rounded shadow-md">
                      <div
                        className="px-3 py-1 text-xs hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          handlePreview();
                          setShowDropdown(false);
                        }}
                      >
                        Preview
                      </div>
                      <div
                        className="px-3 py-1 text-xs hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          handleDelete();
                          setShowDropdown(false);
                        }}
                      >
                        Delete
                      </div>
                    </div>
                  )}
                </div>
                <div className="w-full bg-gray-200 h-1 rounded">
                  <div
                    className="bg-[#3371F2] h-1 rounded"
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <button
                  onClick={handleProceed}
                  className="w-full h-9 bg-[#3371F2] text-white rounded text-xs font-medium"
                >
                  PROCEED
                </button>
              </div>
            </div>
          ) : selectedFile ? (
            <div className="border-2 border-dashed border-[#3371F2] rounded-md w-full p-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <img src="/assets/pdf-icon.svg" className="w-5 h-5" alt="Audio" />
                  <div>
                    <div className="text-xs font-medium">{selectedFile.name}</div>
                    <div className="text-[10px] text-[#534B68]">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>
                <img
                  src="/assets/DeleteOutlined.svg"
                  alt="Delete"
                  className="w-4 h-4 cursor-pointer"
                  onClick={handleDelete}
                />
              </div>
              <div className="w-full bg-gray-200 h-1 rounded mb-2">
                <div
                  className="bg-[#3371F2] h-1 rounded"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <button
                onClick={handleStartUpload}
                className="w-full h-8 bg-[#3371F2] text-white rounded text-xs font-medium"
              >
                Upload
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-[#3371F2] h-36 flex flex-col items-center justify-center rounded-md cursor-pointer w-full"
              onClick={handleUploadClick}
            >
              <div className="w-10 h-10 flex justify-center items-center rounded-full bg-gradient-to-br from-[#3371F2] to-[rgba(51,113,242,0.40)]">
                <img src="/assets/upload-icon.svg" className="w-5 h-5" alt="Upload" />
              </div>
              <p className="text-[#3371F2] underline text-sm mt-2">Click to upload or drag and drop</p>
            </div>
          )}
          <p className="text-xs text-[#534B68] text-center w-full">
            Max file size: 50 MB | Supported: mp3, wav, mpeg, webm, ogg
          </p>

          <input
            type="file"
            accept="audio/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 bg-white rounded-md shadow text-center">
          <img src="/assets/reject-audio.svg" alt="Invalid" className="w-24 h-24" />
          <h2 className="text-2xl font-semibold text-[#0F012A]">Invalid File</h2>
          <p className="text-sm text-[#534B68] mt-2">Please upload a valid audio file</p>
          <button
            onClick={() => setShowInvalidScreen(false)}
            className="mt-3 border border-[#3371F2] text-[#3371F2] px-4 py-1 rounded"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default TeleMedical;