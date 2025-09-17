import React from "react";
import LeftSection from "./LeftSection";
import Footer from "./Footer";
import Header from "./Header";

const Layout = ({ RightComponent, CustomHeader }) => {
  return (
    <div className="min-h-screen bg-blue-50 overflow-hidden">
      {/* Header */}
      {CustomHeader ? <CustomHeader /> : <Header />}

      <div className="relative flex flex-col lg:flex-row w-full mx-auto min-h-[calc(100vh-120px)] gap-4 px-4 pb-4">
        <main className="w-full h-[calc(98vh-90px)] flex gap-4">
          {/* Left Section */}
          <div
            className="w-[42%] h-[85vh] overflow-auto bg-blue relative"
            style={{ borderRadius: "10px" }}
          >
            <LeftSection />
          </div>

          {/* Right Section (Content + Footer) */}
          <div
            className="w-[58%] h-[85vh] flex flex-col justify-between overflow-auto bg-blue relative"
            style={{ borderRadius: "10px" }}
          >
            <div className="relative z-10 p-2 flex-1">
              <RightComponent />
            </div>

            {/* Footer at the bottom of Right Panel */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;