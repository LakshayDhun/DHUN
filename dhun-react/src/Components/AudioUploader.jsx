import { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";

// ─────────────────────────────────────────
//  AudioUploader
//  Props: onFileReady(file) — called when a
//  valid file is loaded and waveform is ready
// ─────────────────────────────────────────
export default function AudioUploader({ onFileReady }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [dragging, setDragging] = useState(false);

  const waveRef = useRef(null);      // div that wavesurfer renders into
  const surferRef = useRef(null);    // wavesurfer instance
  const inputRef = useRef(null);     // hidden file input

  const ACCEPTED = ["audio/mpeg", "audio/wav", "audio/wave", "audio/x-wav"];

  // ── Validate & load file ──────────────────
  const handleFile = useCallback((f) => {
    setError("");
    if (!f) return;

    // Type check
    if (!ACCEPTED.includes(f.type)) {
      setError(`❌  "${f.name}" is not supported. Please upload a .mp3 or .wav file.`);
      setFile(null);
      return;
    }

    // Size check — 100 MB max
    if (f.size > 100 * 1024 * 1024) {
      setError("❌  File is too large. Maximum size is 100 MB.");
      return;
    }

    setFile(f);
    setLoading(true);
    setPlaying(false);
    setCurrentTime(0);

    // Destroy old instance
    if (surferRef.current) {
      surferRef.current.destroy();
      surferRef.current = null;
    }

    // Create WaveSurfer
    const ws = WaveSurfer.create({
      container: waveRef.current,
      waveColor: "#7b5fff",
      progressColor: "#ff5f7b",
      cursorColor: "#ffffff44",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      normalize: true,
      backend: "WebAudio",
    });

    surferRef.current = ws;

    ws.loadBlob(f);

    ws.on("ready", () => {
      setLoading(false);
      setDuration(ws.getDuration());
      onFileReady?.(f);
    });

    ws.on("audioprocess", () => setCurrentTime(ws.getCurrentTime()));
    ws.on("seek", () => setCurrentTime(ws.getCurrentTime()));
    ws.on("finish", () => setPlaying(false));
    ws.on("error", () => {
      setError("❌  Could not decode audio. Try a different file.");
      setLoading(false);
    });
  }, [onFileReady]);

  // ── Drag & drop ───────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Play / Pause ──────────────────────────
  const togglePlay = () => {
    if (!surferRef.current) return;
    surferRef.current.playPause();
    setPlaying((p) => !p);
  };

  // ── Format seconds → m:ss ─────────────────
  const fmt = (s) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  // ── Cleanup on unmount ────────────────────
  useEffect(() => () => surferRef.current?.destroy(), []);

  return (
    <div className="w-full max-w-2xl mx-auto font-sans">

      {/* ── Upload Box ── */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current.click()}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
          flex flex-col items-center justify-center gap-4 p-10
          ${dragging
            ? "border-purple-400 bg-purple-500/10 shadow-[0_0_32px_rgba(123,95,255,0.4)]"
            : file
            ? "border-purple-600/40 bg-[#13131e] cursor-default"
            : "border-[#353550] bg-[#13131e] hover:border-purple-500 hover:shadow-[0_0_24px_rgba(123,95,255,0.25)]"
          }
        `}
      >
        {!file ? (
          <>
            {/* Upload icon */}
            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30
              flex items-center justify-center text-3xl transition-transform duration-300
              group-hover:scale-110">
              🎵
            </div>

            <div className="text-center">
              <p className="text-white text-lg font-semibold mb-1">Drop your track here</p>
              <p className="text-[#888899] text-sm">Supports .mp3 and .wav only • Max 100 MB</p>
            </div>

            {/* Upload button */}
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
              className="
                px-8 py-3 rounded-xl font-bold text-white text-sm tracking-widest uppercase
                bg-gradient-to-r from-purple-600 to-purple-500
                hover:from-purple-500 hover:to-pink-500
                shadow-[0_0_20px_rgba(123,95,255,0.4)]
                hover:shadow-[0_0_32px_rgba(123,95,255,0.7)]
                transition-all duration-300 active:scale-95
              "
            >
              Upload Your Track
            </button>
          </>
        ) : (
          <>
            {/* File info row */}
            <div className="w-full flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-xl flex-shrink-0">
                  🎵
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{file.name}</p>
                  <p className="text-[#888899] text-xs">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                    {duration > 0 && ` • ${fmt(duration)}`}
                  </p>
                </div>
              </div>

              {/* Change file button */}
              <button
                onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
                className="text-xs text-purple-400 border border-purple-500/30 px-3 py-1.5
                  rounded-lg hover:bg-purple-500/10 transition-all flex-shrink-0"
              >
                Change
              </button>
            </div>

            {/* Waveform */}
            <div className="w-full rounded-xl overflow-hidden bg-[#0d0d14] p-3">
              {loading && (
                <div className="h-20 flex items-center justify-center">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-purple-500 rounded-full animate-bounce"
                        style={{ height: "32px", animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={waveRef} className={loading ? "hidden" : "block"} />
            </div>

            {/* Playback controls */}
            {!loading && (
              <div className="w-full flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="
                    w-10 h-10 rounded-full flex items-center justify-center
                    bg-purple-600 hover:bg-purple-500
                    shadow-[0_0_12px_rgba(123,95,255,0.5)]
                    transition-all active:scale-95 text-white text-sm
                  "
                >
                  {playing ? "⏸" : "▶"}
                </button>
                <div className="flex-1 h-1 bg-[#2a2a40] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-[#888899] text-xs font-mono tabular-nums">
                  {fmt(currentTime)} / {fmt(duration)}
                </span>
              </div>
            )}
          </>
        )}

        {/* Loading overlay */}
        {loading && (
          <p className="text-purple-400 text-xs animate-pulse">Loading waveform...</p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
