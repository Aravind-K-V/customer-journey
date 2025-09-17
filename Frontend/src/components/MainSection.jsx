import React from "react";
import HeroSection from "./LeftSection"; // This is the LeftSection.jsx content
import RightSection from "./RightSection";
import Footer from "./Footer";

const MainSection = () => {
  return (
    <div
      className="relative flex flex-col lg:flex-row w-full mx-auto min-h-[calc(100vh-120px)] gap-4 px-4 pb-4"
    >
      <main className="w-full h-[calc(98vh-90px)] flex gap-4">
        {/* Left Section */}
        <div
          className="w-[42%] h-[85vh] overflow-auto bg-blue relative"
          style={{
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <HeroSection />
        </div>

        {/* Right Section */}
        <div
          className="w-[58%] h-[85vh] overflow-auto bg-blue relative"
          style={{
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* Watermark */}
          <div className="absolute bottom-2 right-4">
            <img
              src="/assets/watermark.svg"
              alt="Kazunov 1AI Watermark"
              className="w-200 h-auto opacity-70"
              style={{ filter: "brightness(0.95)" }}
            />
          </div>

          <div className="relative z-10 p-2">
            <RightSection />
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="absolute bottom-1 h-6 right-6">
        <Footer />
      </div>
    </div>

  );
};

export default MainSection;