import React from 'react';

const AccessDeniedModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[400px] text-center relative">
        <h2 className="text-xl font-semibold text-[#0F012A] mb-2">
          Access Denied 🔒
        </h2>
        <p className="text-sm text-[#534B68] mb-4">
          You do not have permission to access this screen.
        </p>
        <button
          onClick={onClose}
          className="bg-[#3371F2] text-white px-4 py-2 rounded text-sm font-medium"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default AccessDeniedModal;