import React, { useRef, useState } from 'react'; 
import axios from 'axios';

const RightSectionMC = () => {
  const { proposerId, proposalNumber, first_member } = JSON.parse(sessionStorage.getItem('navigationState'));
  console.log("Navigation State MC:", proposerId, proposalNumber);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('upload');
  const [formData, setFormData] = useState({ date: '', time: '', location: '' });
  const [underReview, setUnderReview] = useState(false);

  const ProgressTracker = () => (
    <div className="flex flex-col items-start gap-2 w-full">
      <div className="w-full px-4 py-2 bg-white rounded-md shadow-[0px_0px_12px_0px_rgba(51,113,242,0.09)]">
        <div className="flex items-center gap-1 w-full">
          <div className="w-3 h-3 rounded-full bg-[#DFE8FB] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#3371F2]"></div>
          </div>
          <div className="flex-1 border-t border-[rgba(51,113,242,0.20)]"></div>
          <div className="w-3 h-3 rounded-full bg-[#DFE8FB]"></div>
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-[rgba(15,1,42,0.70)]">Proposal form</span>
          <span className="text-[rgba(15,1,42,0.70)]">Medical check</span>
        </div>
      </div>
    </div>
  );

  const handleUploadClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return;

    setUploadedFile(file);
    setUploadProgress(0);
    setUploadComplete(false);

    try {
      // Step 1: Request presigned URL from backend
      const file_type = "medical docs"
      const presignRes = await axios.post('http://localhost:8000/save-support-docs', {
        filename: file.name,
        contentType: file.type,
        proposerId,
        proposalNumber,
        file_type,
        first_member
      });

      const { url, s3Link } = presignRes.data;

      // Step 2: Upload file directly to S3 with presigned PUT URL
      await axios.put(url, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
            if (percent === 100) {
              setUploadComplete(true);
              setUnderReview(true); // Show under review screen after upload
            }
          }
        },
      });

      console.log("✅ File uploaded successfully. S3 link:", s3Link);
    } catch (err) {
      console.error('❌ Upload failed:', err.response?.data || err.message);
      setUploadedFile(null);
      setUploadProgress(0);
    }
  };

  const handleDelete = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setUnderReview(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBookAppointment = () => {
    // After booking appointment, show under review screen
    setUnderReview(true);
  };

  const screenWrapper = (content) => (
    <div className="w-full h-full overflow-auto p-4">
      <div className="flex flex-col justify-center items-start gap-1 mb-4">
        <h1 className="text-[#0F012A] font-medium text-xl leading-[28px] tracking-[-0.2px]">
          Welcome to Kazunov 1AI
        </h1>
        <p className="text-[#534B68] text-sm leading-5">
          Your one-stop insurance underwriting provider
        </p>
      </div>
      <ProgressTracker />
      {content}
    </div>
  );

  // Under Review Screen
  const underReviewContent = (
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
  );

  const uploadContent = (
    <div className="mt-4 flex flex-col gap-4">
      {/* 🔵 Blue Info Box (separate at top) */}
      <div className="w-full relative bg-gradient-to-r from-[#05235A] to-[#0D3F8E] text-white p-4 rounded-md overflow-hidden shadow-md">
        <img
          src="/assets/Union.svg"
          alt="Logo BG"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 opacity-100"
        />
        <div className="relative z-10 flex flex-col lg:flex-row items-start justify-between w-full gap-4">
          <div className="flex gap-3">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1">
                No Recent Medical Diagnostics?
                <img src="/assets/help-icon.svg" className="w-4 h-4 opacity-80" />
              </h3>
              <p className="text-xs text-white text-opacity-80 mt-1 max-w-md">
                The <span className="font-semibold">Schedule Your Medical Checkup Now!</span>
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={() => setStep('slot')}
              className="bg-white text-[#3371F2] text-xs font-semibold px-4 py-2 rounded-md shadow"
            >
              BOOK NOW
            </button>
          </div>
        </div>
      </div>

      {/* ⚪ White Upload Box */}
      <div className="bg-white p-4 rounded-md shadow-[0px_0px_12px_0px_rgba(51,113,242,0.09)]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex justify-center items-center rounded-md bg-[#EDF2FD]">
              <img src="/assets/word.svg" alt="PDF" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-black text-sm font-medium">Upload Medical Diagnostics</h2>
              <p className="text-xs text-[#534B68]">Submit your medical diagnostics document for verification</p>
            </div>
          </div>
          {/* ✅ Download sample file stays here */}
          <button className="flex items-center gap-2 px-3 py-1.5 border border-[rgba(51,113,242,0.30)] rounded bg-white">
            <img src="/assets/download-icon.svg" className="w-3 h-3" alt="Download" />
            <span className="text-[#3371F2] text-sm font-medium">Download sample file</span>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 📁 Upload Area */}
        <div
          className="mt-4 border-2 border-dashed border-[#3371F2] h-36 flex flex-col items-center justify-center rounded-md cursor-pointer"
          onClick={handleUploadClick}
        >
          {!uploadedFile ? (
            <>
              <div className="w-10 h-10 flex justify-center items-center rounded-full bg-gradient-to-br from-[#3371F2] to-[rgba(51,113,242,0.40)]">
                <img src="/assets/upload-icon.svg" className="w-5 h-5" alt="Upload" />
              </div>
              <p className="text-[#3371F2] underline text-sm mt-2">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum File Size: 50 MB. Supported Format: PDF
              </p>
            </>
          ) : (
            <div className="w-full p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <img src="/assets/pdf-icon.svg" className="w-4 h-4" alt="PDF" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <img
                  src="/assets/DeleteOutlined.svg"
                  className="w-4 h-4 cursor-pointer"
                  alt="Delete"
                  onClick={handleDelete}
                />
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded mt-1.5">
                <div
                  className="bg-[#3371F2] h-1.5 rounded"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const slotBooking = (
    <div className="mt-4 bg-white p-4 rounded-md shadow-md">
      <h2 className="text-base font-medium text-black mb-2">Schedule A Medical Test</h2>
      <label className="text-sm text-gray-700 block mb-1">Pick a date</label>
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleInputChange}
        className="w-full border p-2 rounded mb-3"
      />
      <label className="text-sm text-gray-700 block mb-1">Pick a time slot</label>
      <select
        name="time"
        value={formData.time}
        onChange={handleInputChange}
        className="w-full border p-2 rounded mb-3"
      >
        <option value="">Select Time Slot</option>
        {["9 AM - 12 PM", "12 PM - 3 PM", "3 PM - 6 PM", "6 PM - 9 PM"].map((slot) => (
          <option key={slot} value={slot}>{slot}</option>
        ))}
      </select>
      <label className="text-sm text-gray-700 block mb-1">Enter your location</label>
      <input
        type="text"
        name="location"
        value={formData.location}
        onChange={handleInputChange}
        className="w-full border p-2 rounded mb-4"
        placeholder="Enter Location"
      />
      <button
        onClick={handleBookAppointment}
        className="w-full bg-[#3371F2] text-white py-2 rounded text-sm font-semibold"
      >
        Proceed
      </button>
    </div>
  );

  // Show under review screen if either:
  // 1. File was uploaded and upload is complete, OR
  // 2. Appointment was booked (step is not needed for slot booking anymore)
  if (underReview) {
    return screenWrapper(underReviewContent);
  }

  if (step === 'slot') {
    return screenWrapper(slotBooking);
  }

  return screenWrapper(uploadContent);
};

export default RightSectionMC;