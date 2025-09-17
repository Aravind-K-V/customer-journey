import React from 'react';

const Footer = () => {
  return (
    <div className="relative w-full mt-2 px-4 py-2">
      {/* ✅ Watermark inside the footer area */}
      <div className="absolute bottom-2 right-4">
        <img
          src="/assets/watermark.svg"
          alt="Kazunov 1AI Watermark"
          className="w-[200px] h-auto opacity-70"
          style={{ filter: "brightness(0.95)" }}
        />
      </div>

      {/* ✅ Main footer content */}
      <footer className="flex justify-between items-center text-xs text-gray-500 relative z-10">
        <div className="flex items-center gap-2">
          <span>Powered by</span>
          <img
            src="/assets/company logo.svg"
            alt="Footer Logo"
            className="w-[90px] h-auto object-contain"
          />
        </div>
      </footer>
    </div>
  );
};

export default Footer;