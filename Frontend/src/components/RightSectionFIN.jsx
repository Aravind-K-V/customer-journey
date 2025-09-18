import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'


const UploadBox = ({ title,file_type, iconSrc, onUploadSuccess }) => {
  const {proposerId, proposalNumber,first_member} = JSON.parse(sessionStorage.getItem('navigationState'));
  console.log("Navigation State FIN:", proposerId, proposalNumber);
  const [fileData, setFileData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');

 const handleUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const allowedTypes = ['application/pdf', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    alert('Only PDF and PNG files are allowed!');
    resetUpload();
    return;
  }

  setFileData(file);
  setStatus('uploading');
  setProgress(0);

  try {
    // Step 1: Ask backend for presigned URL
    const presignRes = await axios.post('http://13.232.45.218:8000/save-support-docs', {
      filename: file.name,
      contentType: file.type,
      proposerId,
      proposalNumber,
      file_type,
      first_member
    });

    const { url, s3Link } = presignRes.data;

    // Step 2: Upload file to S3 directly
    await axios.put(url, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percent);
      },
    });

    // Step 3: Mark success
    setStatus('success');
    onUploadSuccess(title, file, s3Link); // pass s3 link if you need it
  } catch (error) {
    console.error('Upload error:', error);
    setStatus('error');
  }
};

  const resetUpload = () => {
    setFileData(null);
    setProgress(0);
    setStatus('idle');
  };

  return (
    <div className="border border-dashed border-[#3371F2] rounded-md p-4 h-[75px] flex flex-col justify-between">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-3 items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3371F2] to-[rgba(51,113,242,0.40)] flex items-center justify-center">
            <img src={iconSrc} className="w-4 h-4" alt="Icon" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-[#0F012A]">
              <span className="inline-flex items-center gap-1">
                {fileData ? `${title}: ${fileData.name}` : title}
                {status === 'success' && (
                  <img src="/assets/correct.svg" alt="Success" className="w-4 h-4" />
                )}
                {status === 'error' && (
                  <img src="/assets/wrong.svg" alt="Error" className="w-4 h-4" />
                )}
              </span>
            </h4>
            <p className="text-xs text-[#534B68]">
              {fileData ? `${(fileData.size / (1024 * 1024)).toFixed(2)} MB` : 'Maximum File Size: 50 MB  Supported Format: PDF'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fileData && status === 'error' && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf, .png"
                onChange={handleUpload}
                className="hidden"
              />
              <div className="flex items-center gap-1 text-sm text-[#3371F2]">
                <img src="/assets/RedoOutlined.svg" alt="Retry" className="w-4 h-4" />
              </div>
            </label>
          )}
          {fileData && status === 'success' && (
            <button onClick={resetUpload}>
              <img src="/assets/trash.svg" alt="Delete" className="w-4 h-4" />
            </button>
          )}
          {fileData && status === 'uploading' && (
            <button onClick={resetUpload}>
              <img src="/assets/xmark.svg" alt="Cancel" className="w-4 h-4" />
            </button>
          )}
          {status === 'idle' && (
            <label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded bg-[#3371F2] text-white text-sm cursor-pointer">
                <img src="/assets/cloud-arrow-up.svg" className="w-4 h-4" alt="Upload" />
                Upload File
              </div>
            </label>
          )}
        </div>
      </div>

      {fileData && (
        <div className="flex items-center mt-2 gap-2">
          <div className="w-full bg-[#E2EAFB] rounded-full h-[4px] relative overflow-hidden">
            <div
              className={`h-[4px] rounded-full transition-all duration-300 ${status === 'error' ? 'bg-[#3371F2]' : 'bg-[#3371F2]'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {status === 'uploading' && (
            <span className="text-xs text-[#3371F2]">{progress}%</span>
          )}
        </div>
      )}
    </div>
  );
};

const FINScreen = () => {
  const navigationState = JSON.parse(sessionStorage.getItem('navigationState'));
  console.log("Navigation State:", navigationState);
  const navigate = useNavigate();
  const employmentType = navigationState?.employmentType;
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [showPaymentPortal, setShowPaymentPortal] = useState(false);
  const [showApprovedScreen, setShowApprovedScreen] = useState(false);
  const [showUnderReviewScreen, setShowUnderReviewScreen] = useState(false);

  const handleSuccess = (title) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [title]: true,
    }));
  };

  const allUploaded = (() => {
    const hasPAN = uploadedFiles["Upload PAN"];

    if (employmentType === '{\"self_employed"\}') {
      const hasGST = uploadedFiles["Upload GST Return"];
      const hasITR = uploadedFiles["Upload ITR"];
      return hasPAN && (hasGST || hasITR);
    }
    if (employmentType == '{\"salaried\"}') {
      const hasBank = uploadedFiles["Upload Bank Statement"];
      const hasPayslip = uploadedFiles["Upload Payslip"];
      return hasPAN && (hasBank || hasPayslip);
    }

    return false;
  })();

  const handleNext = () => {
    let screens = JSON.parse(sessionStorage.getItem('nextScreens')) || [];
    screens.shift(); // Remove current screen (FIN)
    sessionStorage.setItem('nextScreens', JSON.stringify(screens));

    if (screens.length > 0) {
      navigate(screens[0], { replace: true }); // Go to next screen (MC/MERT)
    } else {
      setShowUnderReviewScreen(true);
    }
  };

  return (
    <div className="w-full h-full overflow-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[#0F012A] font-medium text-xl">Welcome to Kazunov 1AI</h1>
        <p className="text-[#534B68] text-sm">Your one-stop insurance underwriting provider</p>
      </div>

      {/* Step Progress */}
      <div className="mb-2">
        <div className="bg-white rounded-md shadow-md p-2">
          <div className="flex items-center gap-1 w-full">
            <div className="flex items-center justify-center w-3 h-3 bg-[#DFE8FB] rounded-full">
              <div className="w-2 h-2 bg-[#3371F2] rounded-full"></div>
            </div>
            <div className="flex-1 h-px bg-[rgba(51,113,242,0.2)]"></div>
            <div className="w-3 h-3 bg-[#DFE8FB] rounded-full"></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-[rgba(15,1,42,0.7)]">
            <span>Proposal form</span>
            <span>Financial</span>
          </div>
        </div>
      </div>

      {/* WHITE CARD BOX */}
      <div className="bg-white shadow-md rounded-md p-3 mt-3 min-h-[200px] flex flex-col items-center justify-center">
        {showUnderReviewScreen ? (
          // ✅ Under Review Screen
          <div className="flex flex-col items-center justify-center text-center p-6">
            <img src="/assets/under-review.svg" alt="Under Review" className="w-70 h-70 mb-4" />
            <h2 className="text-lg font-semibold text-[#0F012A]">Your Application is Under Review</h2>
            <p className="text-sm text-[#534B68] mt-1 mb-4 max-w-sm">
              Your application is currently under review by our dedicated team. You’ll receive an update soon.
            </p>
            <button className="flex items-center gap-1 border border-[#3371F2] text-[#3371F2] text-sm px-4 py-1.5 rounded mx-auto">
              <img src="/assets/help.svg" className="w-4 h-4" alt="Help" /> Help center
            </button>
          </div>
        ) : !showApprovedScreen && !showPaymentPortal ? (
          // ✅ Upload UI
          <>
            <div className="w-full relative bg-gradient-to-r from-[#05235A] to-[#0D3F8E] text-white p-4 rounded-md overflow-hidden">
              <img
                src="/assets/Union.svg"
                alt="Logo BG"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 opacity-100"
              />
              <div className="relative z-10 flex gap-3">
                <div className="w-10 h-10 bg-[#EDF2FD] rounded flex items-center justify-center">
                  <img src="/assets/file-pdf.svg" alt="Doc Icon" className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold flex items-center gap-1">
                    Upload Documents for Financial Review
                    <img src="/assets/help-icon.svg" className="w-4 h-4 opacity-80" />
                  </h3>
                  <p className="text-xs text-white text-opacity-80 mt-1">
                    The <span className="font-semibold">"Upload Document"</span> feature allows users to securely submit their proposal form for verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Employment Type */}
            <div className="w-full flex justify-end mt-2 gap-2 items-center">
              <span className="text-sm font-medium text-[#0F012A]">Employment Type :</span>
              <span className="bg-[#EDF2FD] px-3 py-1 text-sm text-[#3371F2] rounded">
                ● {employmentType}
              </span>
            </div>

            {/* Upload Fields */}
            <div className="w-full flex flex-col gap-2 mt-3">
              {employmentType === '{\"self_employed"\}' && (
                <>
                  <UploadBox title="Upload GST Return" file_type="GST Document"  iconSrc="/assets/cloud-arrow-up.svg" onUploadSuccess={handleSuccess} />
                  <UploadBox title="Upload ITR" file_type="ITR Document" iconSrc="/assets/cloud-arrow-up.svg" onUploadSuccess={handleSuccess} />
                  <UploadBox title="Upload PAN" file_type="PAN Document" iconSrc="/assets/cloud-arrow-up.svg" onUploadSuccess={handleSuccess} />
                </>
              )}
              
              {employmentType === '{\"salaried"\}' && (
                <>
                  <UploadBox title="Upload Payslip" file_type="Payslip" iconSrc="/assets/cloud-arrow-up.svg" onUploadSuccess={handleSuccess} />
                  <UploadBox title="Upload Bank Statement" file_type="Bank Statement" iconSrc="/assets/cloud-arrow-up.svg" onUploadSuccess={handleSuccess} />
                  <UploadBox title="Upload PAN" file_type="PAN Document" iconSrc="/assets/cloud-arrow-up.svg" onUploadSuccess={handleSuccess} />
                </>
              )}
            </div>

            {/* Proceed Button */}
            {allUploaded && (
              <div className="flex justify-end mt-4 w-full">
                <button
                  onClick={handleNext}
                  className="px-6 py-2 text-xs bg-[#3371F2] text-white rounded shadow-md"
                >
                  Proceed
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default FINScreen;