// components/PlayerControls.tsx

import React from "react";

type PlayerControlsProps = {
  isShuffle: boolean;
  setIsShuffle: (v: (prev: boolean) => boolean) => void;
  isRepeat: boolean;
  setIsRepeat: (v: (prev: boolean) => boolean) => void;
  playPrev: () => void;
  handlePlayPause: () => void;
  playNext: () => void;
};

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isShuffle,
  setIsShuffle,
  isRepeat,
  setIsRepeat,
  playPrev,
  handlePlayPause,
  playNext,
}) => (
  <>
    {/* Playback mode buttons */}
    <div className="mb-3 flex gap-3 items-center">
      <button
        onClick={() => setIsShuffle((s) => !s)}
        className={`px-4 py-1 rounded-lg border shadow ${
          isShuffle
            ? "bg-blue-500 text-white ring-2 ring-blue-400"
            : "bg-white/30 dark:bg-gray-800/40 text-gray-700 dark:text-gray-200"
        }`}
        title={isShuffle ? "Shuffle mode ON" : "Shuffle mode OFF"}
      >
        {isShuffle ? "🔀 Shuffle On" : "🔀 Shuffle Off"}
      </button>
      <button
        onClick={() => setIsRepeat((r) => !r)}
        className={`px-4 py-1 rounded-lg border shadow ${
          isRepeat
            ? "bg-pink-500 text-white ring-2 ring-pink-400"
            : "bg-white/30 dark:bg-gray-800/40 text-gray-700 dark:text-gray-200"
        }`}
        title={isRepeat ? "Repeat mode ON" : "Repeat mode OFF"}
      >
        {isRepeat ? "🔁 Repeat On" : "🔁 Repeat Off"}
      </button>
    </div>

    {/* Main controls */}
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={playPrev}
        className="px-3 py-1 rounded-full bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all hover:scale-105"
      >
        ⏮ Prev
      </button>
      <button
        onClick={handlePlayPause}
        className="px-3 py-1 rounded-full bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all hover:scale-110"
      >
        ⏯ Play/Pause
      </button>
      <button
        onClick={playNext}
        className="px-3 py-1 rounded-full bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700 shadow transition-all hover:scale-105"
      >
        Next ⏭
      </button>
    </div>
  </>
);

export default PlayerControls;
