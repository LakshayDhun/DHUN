import { useState, useCallback } from "react";
import AudioUploader from "./components/AudioUploader";
import KnobPanel from "./components/KnobPanel";

export default function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [knobValues, setKnobValues] = useState({
    clarity: 50, loudness: 50, space: 30, noiseClean: 20,
  });
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState("");

  const handleFileReady = useCallback((file) => {
    setAudioFile(file);
    setDownloadUrl(null);
    setError("");
  }, []);

  const handleKnobChange = useCallback((values) => {
    setKnobValues(values);
  }, []);

  // ── Send to backend ───────────────────────
  const handleProcess = async () => {
    if (!audioFile) return;
    setProcessing(true);
    setError("");
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("clarity",    knobValues.clarity);
      formData.append("loudness",   knobValues.loudness);
      formData.append("space",      knobValues.space);
      formData.append("noiseClean", knobValues.noiseClean);

      const res = await fetch("http://localhost:3001/process", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Processing failed");
      }

      // Get the processed file as a blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

    } catch (err) {
      setError("❌ " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white font-sans px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-[0.2em] text-white"
            style={{ textShadow: "0 0 40px rgba(123,95,255,0.5)" }}>
            DHUN
          </h1>
          <p className="text-[#888899] text-sm mt-2 tracking-widest uppercase">
            AI Mix & Master Studio
          </p>
        </div>

        {/* Step 1 — Upload */}
        <section>
          <p className="text-xs text-[#888899] uppercase tracking-widest mb-3">
            Step 1 — Upload Your Track
          </p>
          <AudioUploader onFileReady={handleFileReady} />
        </section>

        {/* Step 2 — Controls */}
        <section className={!audioFile ? "opacity-40 pointer-events-none" : ""}>
          <p className="text-xs text-[#888899] uppercase tracking-widest mb-3">
            Step 2 — Adjust Settings
          </p>
          <KnobPanel onChange={handleKnobChange} />
        </section>

        {/* Step 3 — Process */}
        <section className={!audioFile ? "opacity-40 pointer-events-none" : ""}>
          <p className="text-xs text-[#888899] uppercase tracking-widest mb-3">
            Step 3 — Process & Export
          </p>

          <button
            onClick={handleProcess}
            disabled={!audioFile || processing}
            className="
              w-full py-4 rounded-2xl font-bold text-white text-base tracking-widest uppercase
              bg-gradient-to-r from-purple-600 to-pink-600
              hover:from-purple-500 hover:to-pink-500
              disabled:opacity-40 disabled:cursor-not-allowed
              shadow-[0_0_30px_rgba(123,95,255,0.4)]
              hover:shadow-[0_0_40px_rgba(123,95,255,0.6)]
              transition-all duration-300 active:scale-[0.98]
            "
          >
            {processing ? (
              <span className="flex items-center justify-center gap-3">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white
                  rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              "⚡ Process & Master"
            )}
          </button>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30
              text-red-400 text-sm">
              {error}
            </div>
          )}

          {downloadUrl && (
            <a
              href={downloadUrl}
              download="DHUN-processed.wav"
              className="
                mt-4 flex items-center justify-center gap-3
                w-full py-4 rounded-2xl font-bold text-white text-base tracking-widest uppercase
                bg-gradient-to-r from-green-600 to-teal-600
                hover:from-green-500 hover:to-teal-500
                shadow-[0_0_30px_rgba(67,224,151,0.4)]
                transition-all duration-300 active:scale-[0.98]
              "
            >
              ⬇ Download Processed Track
            </a>
          )}
        </section>
      </div>
    </div>
  );
}
