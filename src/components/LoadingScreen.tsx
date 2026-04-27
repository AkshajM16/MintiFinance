import React from "react";

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black/80">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg text-white font-semibold">Loading...</p>
    </div>
  );
} 