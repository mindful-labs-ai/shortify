import { useEffect, useRef } from "react";

type Props = {
  src: string; // file:// URL
  onClose?: () => void;
};

export default function VideoPlayer({ src, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => undefined);
  }, [src]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <video
        ref={videoRef}
        src={src}
        controls
        className="aspect-[9/16] h-full max-h-[90vh] rounded-xl bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur transition hover:bg-white/20"
        >
          Close
        </button>
      ) : null}
    </div>
  );
}
