import { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────
//  Single Knob Component
// ─────────────────────────────────────────
function Knob({ label, value, onChange, color = "#7b5fff", description }) {
  const knobRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  // Convert value (0-100) → rotation degrees (-135 to +135)
  const rotation = -135 + (value / 100) * 270;

  // ── Mouse drag ────────────────────────────
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;

    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      // Moving mouse UP = increase value
      const delta = (startY.current - e.clientY) * 0.8;
      const newVal = Math.max(0, Math.min(100, Math.round(startValue.current + delta)));
      onChange(newVal);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [value, onChange]);

  // ── Touch drag (mobile) ───────────────────
  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    isDragging.current = true;
    startY.current = touch.clientY;
    startValue.current = value;

    const onTouchMove = (e) => {
      if (!isDragging.current) return;
      const touch = e.touches[0];
      const delta = (startY.current - touch.clientY) * 0.8;
      const newVal = Math.max(0, Math.min(100, Math.round(startValue.current + delta)));
      onChange(newVal);
    };

    const onTouchEnd = () => {
      isDragging.current = false;
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  }, [value, onChange]);

  // ── Scroll wheel support ──────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -2 : 2;
    onChange(Math.max(0, Math.min(100, value + delta)));
  }, [value, onChange]);

  useEffect(() => {
    const el = knobRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const isActive = value > 0;
  const glowColor = color;

  return (
    <div className="flex flex-col items-center gap-3 select-none">

      {/* Knob dial */}
      <div
        ref={knobRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="relative cursor-ns-resize touch-none"
        style={{ width: 80, height: 80 }}
        title="Drag up/down or scroll to adjust"
      >
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            boxShadow: isActive
              ? `0 0 20px ${glowColor}66, 0 0 40px ${glowColor}33`
              : "none",
          }}
        />

        {/* Track arc background */}
        <svg
          className="absolute inset-0"
          viewBox="0 0 80 80"
          style={{ transform: "rotate(0deg)" }}
        >
          {/* Background track */}
          <circle
            cx="40" cy="40" r="30"
            fill="none"
            stroke="#2a2a40"
            strokeWidth="4"
            strokeDasharray="188.5"
            strokeDashoffset="47"
            strokeLinecap="round"
            style={{ transform: "rotate(135deg)", transformOrigin: "40px 40px" }}
          />
          {/* Active fill */}
          <circle
            cx="40" cy="40" r="30"
            fill="none"
            stroke={glowColor}
            strokeWidth="4"
            strokeDasharray="188.5"
            strokeDashoffset={188.5 - (value / 100) * 141.4}
            strokeLinecap="round"
            style={{
              transform: "rotate(135deg)",
              transformOrigin: "40px 40px",
              transition: "stroke-dashoffset 0.05s",
              filter: isActive ? `drop-shadow(0 0 4px ${glowColor})` : "none",
            }}
          />
        </svg>

        {/* Knob body */}
        <div
          className="absolute rounded-full border-2 transition-all duration-150"
          style={{
            inset: 10,
            background: "radial-gradient(circle at 35% 35%, #2a2a40, #0d0d14)",
            borderColor: isActive ? glowColor : "#353550",
            boxShadow: isActive
              ? `inset 0 0 8px rgba(0,0,0,0.8), 0 0 8px ${glowColor}44`
              : "inset 0 0 8px rgba(0,0,0,0.8)",
          }}
        >
          {/* Indicator dot */}
          <div
            className="absolute w-2 h-2 rounded-full left-1/2 -translate-x-1/2"
            style={{
              top: 4,
              background: isActive ? glowColor : "#555568",
              boxShadow: isActive ? `0 0 6px ${glowColor}` : "none",
              transformOrigin: "center 24px",
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              transition: "transform 0.05s",
            }}
          />
        </div>
      </div>

      {/* Value display */}
      <div
        className="w-12 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono transition-all duration-200"
        style={{
          background: isActive ? `${glowColor}22` : "#1a1a28",
          border: `1px solid ${isActive ? glowColor + "66" : "#2a2a40"}`,
          color: isActive ? glowColor : "#888899",
          boxShadow: isActive ? `0 0 8px ${glowColor}33` : "none",
        }}
      >
        {value}
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-white text-sm font-semibold tracking-wide">{label}</p>
        <p className="text-[#888899] text-xs mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  Knob Panel — 4 knobs
// ─────────────────────────────────────────
export default function KnobPanel({ onChange }) {
  const [values, setValues] = useState({
    clarity: 50,
    loudness: 50,
    space: 30,
    noiseClean: 20,
  });

  const update = useCallback((key, val) => {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      // Tell parent (and eventually backend) about the change
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  const knobs = [
    {
      key: "clarity",
      label: "Clarity",
      description: "EQ boost",
      color: "#7b5fff",
      // What this sends to backend:
      // clarity → high-frequency EQ shelf boost
    },
    {
      key: "loudness",
      label: "Loudness",
      description: "Compression",
      color: "#ff5f7b",
      // loudness → compressor threshold + limiter ceiling
    },
    {
      key: "space",
      label: "Space",
      description: "Reverb + delay",
      color: "#43e097",
      // space → reverb wet mix + delay feedback
    },
    {
      key: "noiseClean",
      label: "Noise Clean",
      description: "Noise reduction",
      color: "#f5d020",
      // noiseClean → noise gate threshold
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-[#13131e] border border-[#2a2a40] rounded-2xl p-6 md:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-white font-bold text-lg tracking-widest uppercase">
              Processing Controls
            </h2>
            <p className="text-[#888899] text-xs mt-1">
              Drag knobs up/down — or scroll on them
            </p>
          </div>
          {/* Reset button */}
          <button
            onClick={() => {
              const reset = { clarity: 50, loudness: 50, space: 30, noiseClean: 20 };
              setValues(reset);
              onChange?.(reset);
            }}
            className="text-xs text-[#888899] border border-[#2a2a40] px-3 py-1.5
              rounded-lg hover:border-purple-500/50 hover:text-purple-400 transition-all"
          >
            Reset
          </button>
        </div>

        {/* Knobs grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 justify-items-center">
          {knobs.map(({ key, label, description, color }) => (
            <Knob
              key={key}
              label={label}
              description={description}
              color={color}
              value={values[key]}
              onChange={(val) => update(key, val)}
            />
          ))}
        </div>

        {/* Parameter mapping display */}
        <div className="mt-8 grid grid-cols-2 gap-3 text-xs">
          {[
            { label: "Clarity", val: values.clarity, map: `EQ +${Math.round(values.clarity * 0.12)}dB @ 8kHz`, color: "#7b5fff" },
            { label: "Loudness", val: values.loudness, map: `Threshold ${-60 + Math.round(values.loudness * 0.42)}dB`, color: "#ff5f7b" },
            { label: "Space", val: values.space, map: `Reverb wet ${values.space}%`, color: "#43e097" },
            { label: "Noise Clean", val: values.noiseClean, map: `Gate ${-80 + Math.round(values.noiseClean * 0.5)}dB`, color: "#f5d020" },
          ].map(({ label, map, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#2a2a40]"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[#888899]">{label}:</span>
              <span className="text-white font-mono">{map}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
