'use client';

interface Props {
  onClose: () => void;
}

export function GoScoreInfoModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        data-testid="goscore-modal-panel"
        className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-lg animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="font-playfair text-lg font-bold text-[#1C1008]">What is Go Score?</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#B5A898] text-xl leading-none flex-shrink-0"
          >
            &times;
          </button>
        </div>
        <p className="text-sm text-[#8B7355]">
          Go Score (0–10) rates how good each park is to visit right now. The higher the
          score, the better the visit. It factors in live wait times, crowd levels,
          how much time is left to enjoy the park, and a few park-specific quirks we&apos;ve
          baked in from local knowledge.
        </p>
      </div>
    </div>
  );
}
