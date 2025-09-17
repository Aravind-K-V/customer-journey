import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RightSection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isProposalForm, setIsProposalForm] = useState(null);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [productCategory, setProductCategory] = useState('');
  const [userEmail, setUserEmail] = useState(''); // ✅ Added state for user email
  const [debugLogs, setDebugLogs] = useState([]); // ✅ Added state for debug logs
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [requestId, setRequestId] = useState(null);   // Store DB request_id after save
  const [proposalEmail, setProposalEmail] = useState('');
  const [idpResult, setIdpResult] = useState(null);
  const [idpData, setIdpData] = useState(null);
  const [proposerId, setProposerId] = useState(null); // ✅ NEW state for proposer_id
  const [proposalNumber, setProposalNumber] = useState(null)
  const [firstMember, setFirstMember] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProductCategoryAlert, setShowProductCategoryAlert] = useState(false);

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail') || '';
    setUserEmail(storedEmail);
    console.log('Logged-in userEmail set from localStorage:', storedEmail);

  }, []);

  const addDebugLog = (message) => {
    console.log(message);
    setDebugLogs(prev => [...prev, message]);
  };

  const fetchWithTimeout = (url, options, timeout = 20000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  };


  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUploadClick = () => {
    if (!productCategory) {
      setShowProductCategoryAlert(true);
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (!productCategory) {
      setShowProductCategoryAlert(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setUploadedFile(null);
    setUploadComplete(false);
    setIsProposalForm(null);
  };

  const handleDelete = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSelectedFile(null);
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setIsProposalForm(null);
    setError(null);
  };

  const handleStartUpload = async () => {
    if (!productCategory) {
      setError('Please select a product category before uploading.');
      return;
    }

    if (!selectedFile) return;
    setError(null);
    setIsProposalForm(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setRequestId(null);
    setProposalEmail('');
    setShowMismatchModal(false);
    setIsProcessing(true);

    try {
      // Step 1: Upload to localhost:5050/upload
      console.log("Step 1: Uploading file to localhost:5050/upload");
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch('http://localhost:5050/upload/', {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      const filename = uploadResult.filename;
      console.log("📁 File uploaded with filename:", filename);

      // Step 2: Detect proposal form using localhost:5050/detectproposalform
      console.log("Step 2: Detecting proposal form");
      const detectResponse = await fetchWithTimeout('http://localhost:5050/detectproposalform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: filename }),
      }, 20000);

      const detectResult = await detectResponse.json();
      console.log("🧠 Proposal Form Detection Result:", detectResult);
      console.log(productCategory)
      if (!detectResult.isProposalForm) {
        setError("Uploaded document is not a Proposal Form.");
        setIsProposalForm(false);
        setUploadedFile(selectedFile);   // ✅ ensure file info shows
        setUploadComplete(true);
        setIsProcessing(false);
        return;
      }

      setIsProposalForm(true);
      // setUploadedFile(selectedFile);
      // setUploadComplete(true);

      // Step 3: Generate presigned URL from localhost:8000/generate-presigned-url
      console.log("Step 3: Generating presigned URL");
      const uploadRes = await fetch('http://localhost:8000/generate-presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type,
        }),
      });

      const { url, key, bucket } = await uploadRes.json();
      console.log("Generated presigned URL:", url);

      // Upload to S3
      const directUpload = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!directUpload.ok) throw new Error('File upload to S3 failed');

      setUploadProgress(100);
      setUploadedFile(selectedFile);
      setUploadComplete(true);

      // Create s3_uri
      const s3_uri = `s3://${bucket}/${key}`;
      console.log("S3 URI created:", s3_uri);

      // Step 5: Call IDP via localhost:8000/upload
      console.log("Step 5: Calling IDP via localhost:8000/upload");
      const idpResponse = await fetchWithTimeout('http://localhost:8000/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "s3_url": s3_uri,
          "product_type": productCategory,
          "user_email": userEmail
        }),
      }, 600000);

      console.log("IDP Response Status:", idpResponse.status, idpResponse.statusText);

      const responseData = await idpResponse.json();

      // 1. EXTRACT THE NESTED DATA CORRECTLY
      const proposalData = responseData.data; // The actual data is nested here
      console.log("📄 Extracted Proposal Data841:", proposalData);
      if (!proposalData) throw new Error("No proposal data in IDP response");

      // 2. STORE THE COMPLETE DATA
      setIdpData(proposalData);
      setProposalEmail(proposalData.email || '');
      setProposerId(proposalData.proposer_id || null);
      setProposalNumber(responseData.proposalNo || null);
      setFirstMember(responseData.member_id || null);
      setIsProcessing(false);
      setRequestId(responseData.request_id);

      // Debug logs to verify
      console.log("[DEBUG] Extracted Proposal Data:", {
        email: proposalData.email,
        proposerId: proposalData.proposer_id,
        fullData: proposalData,
        proposalNumber: proposalNumber,
        first_member: firstMember
      });

      // 6. Email check with null safety
      if (!proposalData.email || proposalData.email.toLowerCase() !== userEmail.toLowerCase()) {
        setShowMismatchModal(true);
        return; // Stop if mismatch
      }

      console.log("Email match confirmed, proceeding to rule engine");
      await handleProceed(requestId);

    } catch (err) {
      console.error("Upload error:", {
        error: error.message,
        response: error.response?.data
      });
      setError(error.message || 'Processing failed');
      setIsProcessing(false);
    }
  };

  const handleUpdateEmailAndContinue = async (requestId) => {
    // Use the state variable directly since it's now guaranteed to be set
    if (!requestId) {
      throw new Error("No request ID available");
    }

    try {
      const updateResponse = await axios.post('http://localhost:8000/api/proposals/update-proposer-email',
        {
          request_id: requestId, // Use the state variable
          new_email: userEmail
        }
      );

      await handleProceed(requestId); // Pass the requestId to handleProceed

      setShowMismatchModal(false); // Close the modal on success

      // fetch 
    } catch (error) {
      console.error("Update error:", {
        error: error.message,
        response: error.response?.data
      });
      setError(`Update failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleProceed = async () => {
    if (!idpData)
      return;
    try {
      const response1 = await axios.post('http://localhost:8000/api/idp/extract', {
        proposerId: proposerId
      });

      const extractedData = response1.data.data;
      console.log("Extracted Data:", extractedData);

      // ✅ Pull employment_type from backend response
      const empType = extractedData.Employment_Type || null;
      localStorage.setItem("employmentType", empType);

      const convertResponse = await fetch('http://localhost:5050/convert_to_structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData })   // ✅ only extractedData
      });

      const result = await convertResponse.json();
      console.log("Convert_to_structure response:", result);

      const inputJson = {
        request_id: requestId,
        email: userEmail,
        ...idpData.data
      };

      const navigationState = {
        proposerId: proposerId,
        proposalNumber: proposalNumber,
        first_member: firstMember,
        employmentType: empType
      };

      // Step 6: Call rule engine localhost:5050/rule_engine
      console.log("Step 6: Calling rule engine");
      const response = await fetch('http://localhost:5050/rule_engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalNumber, proposerId, request_id:requestId})
      });
      const data = await response.json();
      console.log("Status from backend:", data);

      sessionStorage.setItem("ruleEngineData", JSON.stringify(data));
      const statuses = Array.isArray(data.statuses) ? data.statuses : [];
sessionStorage.setItem("inference", statuses.length > 0 ? statuses[0] : "N/A");

      let allowedScreens = JSON.parse(localStorage.getItem('allowedScreens') || "[]");
      allowedScreens.push('/Rules')
      if (data.statuses && (data.statuses.includes('STP-Accept') || data.statuses.includes('Non-STP Accept'))) {
        sessionStorage.setItem('navigationState', JSON.stringify(navigationState));
        allowedScreens.push('/STPAccept');
      } else if (data.statuses && (data.statuses.includes('NSTP') || data.statuses.includes('Non-STP'))) {
        // Save rule engine data and inference
        sessionStorage.setItem('ruleEngineData', JSON.stringify(data));
        sessionStorage.setItem('inference', data.statuses[0] || "N/A");

        // Decide the next route based on flags
        if (data.finreview_required) {
          sessionStorage.setItem("nextRoute", "/FIN");
          allowedScreens.push("/FIN")
        } else if (data.televideoagent_required) {
          sessionStorage.setItem("nextRoute", "/Tele");
                    allowedScreens.push("/Tele")

        } else if (data.mc_required) {
          sessionStorage.setItem("nextRoute", "/MC");
                    allowedScreens.push("/MC")

        } else {
          sessionStorage.setItem("nextRoute", "/non-stp");
        }
      } else if (data.statuses && data.statuses.includes('STP-Reject')) {
        allowedScreens.push('/STPReject');
      }

      // ✅ Set the final allowedScreens list in localStorage
      localStorage.setItem('allowedScreens', JSON.stringify(allowedScreens));

      // ✅ Navigate to the correct page
      if (data.statuses && (data.statuses.includes('STP-Accept') || data.statuses.includes('Non-STP Accept'))) {
        sessionStorage.setItem('navigationState', JSON.stringify(navigationState));
        navigate('/STPAccept', { replace: true });
      } else if (data.statuses && (data.statuses.includes('NSTP') || data.statuses.includes('Non-STP'))) {
        sessionStorage.setItem('navigationState', JSON.stringify(navigationState));

        // ✅ Store additional flags for ConditionCheck
        sessionStorage.setItem("mc_required", data.mc_required ? "Yes" : "No");
        sessionStorage.setItem("finreview_required", data.finreview_required ? "Yes" : "No");
        sessionStorage.setItem("televideoagent_required", data.televideoagent_required ? "Yes" : "No");

        if (allowedScreens.length > 1) {
          // Navigate to the first allowed screen after the proposal page
          navigate(allowedScreens[1], { replace: true });
        } else {
          // Fallback if no specific screen is required
          sessionStorage.setItem('navigationState', JSON.stringify(navigationState));

          navigate('/non-stp', { replace: true });
        }
      } else if (data.statuses && data.statuses.includes('STP-Reject')) {
        sessionStorage.setItem('navigationState', JSON.stringify(navigationState));

        navigate('/STPReject', { replace: true });
      } else {
        navigate('/non-stp', { replace: true });
      }
    } catch (err) {
      alert('API error969: ' + err.message);
    }
  };

  const handlePreview = () => {
    if (!uploadedFile) return;
    const fileUrl = URL.createObjectURL(uploadedFile);
    window.open(fileUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  };

  return (
    <div className="w-full h-full overflow-auto p-4">
      {/* Header */}
      <div className="flex flex-col justify-center items-start gap-1 mb-4">
        <h1 className="text-[#0F012A] font-medium text-xl leading-[28px] tracking-[-0.2px]">
          Welcome to Kazunov 1AI
        </h1>
        <p className="text-[#534B68] text-sm leading-5">
          Your one-stop insurance underwriting provider
        </p>
      </div>

      {/* ✅ Product Category Dropdown */}
      <div className="flex flex-col gap-1 mb-2">
        <label htmlFor="product-category" className="text-sm font-medium text-[#0F012A]">
          Select Product Category
        </label>
        <select
          id="product-category"
          value={productCategory}
          onChange={(e) => setProductCategory(e.target.value)}
          className="w-full border border-[#E2EAFB] rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3371F2]"
        >
          <option value="">-- Select --</option>
          <option value="Health Insurance">Health Insurance</option>
          <option value="Personal Accident Insurance">Personal Accident Insurance</option>
          <option value="Critical Illness" disabled>Critical Illness</option>
          <option value="Life Insurance" disabled>Life Insurance</option>
        </select>
      </div>

      <div className="w-full text-red-500 text-sm rounded">
        ⚠ Please ensure the logged-in email matches the one in the proposal form.
      </div>

      {/* Upload Section */}
      <div className="flex flex-col items-start gap-2 p-2 bg-white rounded-md shadow-[0px_0px_12px_0px_rgba(51,113,242,0.09)] w-full">
        {/* Upload Header */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex justify-center items-center rounded-md bg-[#EDF2FD]">
              <img src="/assets/form-svgrepo.svg" alt="PDF" className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1">
                <h2 className="text-black text-lg font-medium leading-[108%] tracking-[-0.18px]">
                  Upload Proposal Form
                </h2>
                <img src="/assets/help-icon.svg" alt="Help" className="w-3 h-3" />
              </div>
              <p className="text-[#534B68] text-xs">
                Attach the proposal document in PDF format
              </p>
            </div>
          </div>
          <button className="flex px-3 py-1.5 justify-center items-center gap-2 rounded border border-[rgba(51,113,242,0.30)] bg-white">
            <img src="/assets/download-icon.svg" className="w-3 h-3" alt="Download" />
            <span className="text-[#3371F2] text-sm font-medium">
              Download sample file
            </span>
          </button>
        </div>


        {/* Main Upload Area */}
        {uploadComplete ? (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Success/Failure Message */}
            <div className="flex flex-col items-center gap-2">
              {isProposalForm ? (
                <>
                  <img src="/assets/CheckCircleFilled.svg" className="w-10 h-10" alt="Success" />

                  <p className="text-[#7CBB5B] text-sm font-medium">File uploaded successfully</p>
                </>
              ) : (
                <>
                  <img src="/assets/CloseCircleFilled.svg" className="w-10 h-10" alt="Failure" />
                  <p className="text-[#FF4D4F] text-sm font-medium">
                    {error || "File upload failed"}
                  </p>
                  <p className="text-[#FF4D4F] text-sm font-medium">File upload failed</p>
                </>
              )}
              <p className="text-xs text-[#534B68]">
                Maximum File Size: 50 MB | Supported Format: PDF
              </p>
            </div>

            {/* File Info Box */}
            <div className="w-full p-3 border border-[#E2EAFB] rounded-md">
              <div className="flex items-start gap-2">
                <img src="/assets/pdf-svgrepo.svg" className="w-6 h-6" alt="PDF" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#0F012A] truncate text-wrap">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-[#534B68]">
                    {(uploadedFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <img
                    src="/assets/EllipsisOutlined.svg"
                    className="w-5 h-5 cursor-pointer"
                    alt="Menu"
                    onClick={() => setShowDropdown(!showDropdown)}
                  />
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-28 bg-white rounded-md shadow-lg z-10">
                      {isProposalForm ? (
                        <>
                          <div
                            className="px-3 py-1.5 text-xs hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              handlePreview();
                              setShowDropdown(false);
                            }}
                          >
                            Preview
                          </div>
                          <div
                            className="px-3 py-1.5 text-xs hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              handleDelete();
                              setShowDropdown(false);
                            }}
                          >
                            Delete
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className="px-3 py-1.5 text-xs hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              handleDelete();
                              fileInputRef.current.click();
                              setShowDropdown(false);
                            }}
                          >
                            Re-upload
                          </div>
                          <div
                            className="px-3 py-1.5 text-xs hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              handleDelete();
                              setShowDropdown(false);
                            }}
                          >
                            Delete
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {uploadComplete && uploadedFile && isProposalForm !== null && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-[#E2EAFB] rounded-full">
                    <div
                      className={`h-full rounded-full ${isProposalForm ? 'bg-[#3371F2]' : 'bg-[#FF4D4F]'}`}
                      style={{ width: isProposalForm ? '100%' : `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-[#534B68]">
                    {isProposalForm ? '100%' : `${uploadProgress}%`}
                  </span>
                </div>
              )}

              {!isProposalForm && (
                <div className="mt-1 text-xs text-[#FF4D4F]">
                  Upload file with PDF format
                </div>
              )}
            </div>

            {isProposalForm && (
              <>
                {isProcessing ? (
                  <button
                    disabled
                    className="w-full h-9 bg-gray-400 rounded text-white text-xs font-medium uppercase tracking-wider cursor-not-allowed"
                  >
                    Processing...
                  </button>
                ) : (
                  <button
                    onClick={handleProceed}
                    className="w-full h-9 bg-[#3371F2] rounded text-white text-xs font-medium uppercase tracking-wider"
                  >
                    PROCEED
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {/* Dropzone */}
            <div
              className="border-2 border-dashed border-[#3371F2] h-36 flex flex-col items-center justify-center rounded-md cursor-pointer w-full"
              onClick={handleUploadClick}
            >
              {selectedFile ? (
                <div className="w-full p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <img src="/assets/pdf-svgrepo.svg" className="w-3 h-3" alt="PDF" />
                      <div>
                        <div className="text-xs font-medium">{selectedFile.name}</div>
                        <div className="text-[10px] text-[#534B68]">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                    <img
                      src="/assets/DeleteOutlined.svg"
                      className="w-3 h-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      alt="Delete"
                    />
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded mt-1.5">
                    <div
                      className="bg-[#3371F2] h-1.5 rounded"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 flex justify-center items-center rounded-full bg-gradient-to-br from-[#3371F2] to-[rgba(51,113,242,0.40)]">
                    <img src="/assets/upload-icon.svg" className="w-5 h-5" alt="Upload" />
                  </div>
                  <p className="text-[#3371F2] underline text-sm mt-2">
                    Click to upload or drag and drop
                  </p>
                </>
              )}
            </div>

            {selectedFile && !uploadComplete && (
              <button
                onClick={handleStartUpload}
                className="mt-3 w-28 h-8 bg-[#3371F2] text-white rounded text-xs font-semibold"
              >
                Upload
              </button>
            )}

            <p className="text-xs text-[#534B68] text-center w-full">
              Maximum File Size: 50 MB | Supported Format: PDF
            </p>
          </>
        )}
      </div>

      {/* Product Category Alert Modal */}
      {showProductCategoryAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-4 w-[400px]  text-center relative">
            <button
              onClick={() => setShowProductCategoryAlert(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <img src="/assets/xmark.svg" alt="Close" className="w-4 h-4" />
            </button>
            <img
              src="/assets/Vector.svg"
              alt="Warning"
              className="w-12 h-12 mx-auto mb-2"
            />
            <h2 className="text-lg font-semibold text-[#0F012A] mb-2">
              Select Product Category First
            </h2>
            <p className="text-sm text-[#534B68] mb-4">
              Please select a product category before uploading your proposal form.
            </p>
            <button
              onClick={() => setShowProductCategoryAlert(false)}
              className="bg-[#3371F2] text-white px-4 py-1 rounded text-sm font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showMismatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-2 w-[450px] text-center relative">
            <img
              src="/assets/rejected.svg"
              alt="Close Icon"
              className="w-28 h-28 mx-auto mb-1"
            />
            <h2 className="text-lg font-semibold text-[#0F012A] mb-1 mt-1">
              Email Mismatch Detected
            </h2>
            <p className="text-sm text-[#534B68] mb-3">
              The logged-in email <strong>{userEmail}</strong> doesn't match the proposal form email <strong>{proposalEmail}</strong>.
              <br />Please ensure both emails match to proceed.
            </p>
            <div className="flex justify-center gap-4 mt-2">
              <button
                onClick={() => handleUpdateEmailAndContinue(proposerId)}
                className="bg-[#3371F2] text-white px-4 py-2 rounded text-sm font-medium"
              >
                Update and Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default RightSection;
