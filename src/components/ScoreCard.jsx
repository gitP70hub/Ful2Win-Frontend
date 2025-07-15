//import React from "react";
import { useNavigate } from "react-router-dom";
import { ImCancelCircle } from "react-icons/im";
import { FaTrophy } from "react-icons/fa";
import React, { useEffect } from "react";

const ScoreCard = ({ game, userId, score, roomId, gameName }) => {
  const navigate = useNavigate();

   
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("play-sound", { detail: "win" })); // ✅ Play win sound on mount
  }, []);
//sound effect added for win..

  return (
   <div className="w-screen h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white flex items-center justify-center">
  <div className="w-full max-w-sm bg-gradient-to-br from-blue-700 to-blue-600 rounded-2xl shadow-xl p-6 relative border-2 border-yellow-400/40">
        
        {/* Cancel Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-300 text-xl transition-all"
          title="Back to Lobby"
        >
          <ImCancelCircle />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold">🏆 Final Score</h2>
        </div>

        {/* Score Display */}
        <div className="bg-yellow-100 text-yellow-800 rounded-xl py-6 mb-6 text-center shadow-inner">
          <div className="flex justify-center items-center mb-2 text-4xl font-bold">
            <FaTrophy className="mr-2" /> {score}
          </div>
          <p className="text-sm text-gray-800">Your Score in {gameName}</p>
        </div>

        {/* Details Section */}
      
        {/* Actions */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <button
            onClick={() => navigate( `/tournament-lobby/${game}`)}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-2 px-6 rounded-xl shadow transition-all duration-200"
          >
            🔁 Play Again
          </button>
          <button
            onClick={() => navigate("/tournaments")}
            className="w-full bg-white text-blue-700 hover:bg-gray-100 font-semibold py-2 px-6 rounded-xl transition-all duration-200 border border-blue-300"
          >
            🏠 Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
