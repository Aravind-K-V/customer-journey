import React, { useRef, useState } from 'react';


const RightSectionUnderReview = () => {

     return (
        <div className="w-full h-full overflow-auto p-4">
            <div className="flex flex-col justify-center items-start gap-1 mb-4">
                <h1 className="text-[#0F012A] font-medium text-xl leading-[28px] tracking-[-0.2px]">
                    Welcome to Kazunov 1AI
                </h1>
                <p className="text-[#534B68] text-sm leading-5">
                    Your one-stop insurance underwriting provider
                </p>
            </div>
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
            </div>    </div>
    );
}

export default RightSectionUnderReview;