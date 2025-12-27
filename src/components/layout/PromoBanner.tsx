import { useEffect, useRef, useState } from "react";
import { Zap, Maximize, Minimize } from "lucide-react";
import screenfull from "screenfull";
import { toast } from "sonner";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function clampToNonNegativeInt(n: number) {
  return Math.max(0, Math.floor(n));
}

function secondsToTimeLeft(totalSeconds: number): TimeLeft {
  const clamped = clampToNonNegativeInt(totalSeconds);
  const days = Math.floor(clamped / (24 * 3600));
  const hours = Math.floor((clamped % (24 * 3600)) / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return { days, hours, minutes, seconds };
}

export function PromoBanner() {
  // Static demo countdown (keeps UI stable and avoids “looping” at 0).
  // You can later swap this for a real campaign end date.
  const endAtRef = useRef<number>(Date.now() + 21 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 20 * 60 * 1000 + 23 * 1000);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => {
    const diffSeconds = Math.ceil((endAtRef.current - Date.now()) / 1000);
    return secondsToTimeLeft(diffSeconds);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const diffSeconds = Math.ceil((endAtRef.current - Date.now()) / 1000);
      setTimeLeft((prev) => {
        const next = secondsToTimeLeft(diffSeconds);
        // Avoid useless state updates once the countdown reaches 0.
        const isSame =
          prev.days === next.days &&
          prev.hours === next.hours &&
          prev.minutes === next.minutes &&
          prev.seconds === next.seconds;
        return isSame ? prev : next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (screenfull.isEnabled) {
      const handleChange = () => {
        setIsFullscreen(screenfull.isFullscreen);
      };
      screenfull.on("change", handleChange);
      return () => screenfull.off("change", handleChange);
    }
  }, []);

  const toggleFullscreen = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    } else {
      toast.info("Pantalla completa no soportada en este dispositivo. Añade la web a tu pantalla de inicio.");
    }
  };

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-1.5 md:py-2 px-4 shadow-sm relative z-[201]">
      <div className="container mx-auto flex flex-row items-center justify-center gap-3 md:gap-4 text-xs md:text-base relative">
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <Zap className="h-3 w-3 md:h-4 md:w-4 fill-white" />
          <span className="font-bold uppercase tracking-wide">REBAJAS</span>
        </div>

        {/* Use fixed widths + tabular numbers to prevent layout shift / “jitter” */}
        <div className="flex items-center gap-1 md:gap-2 font-mono tabular-nums scale-90 md:scale-100 origin-left">
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="bg-white/20 min-w-[1.5rem] md:min-w-[2.25rem] text-center px-1 py-0.5 rounded font-bold inline-block">
              {formatNumber(timeLeft.days)}
            </span>
            <span className="text-[10px] md:text-xs text-white/80">d</span>
          </div>
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="bg-white/20 min-w-[1.5rem] md:min-w-[2.25rem] text-center px-1 py-0.5 rounded font-bold inline-block">
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="text-[10px] md:text-xs text-white/80">h</span>
          </div>
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="bg-white/20 min-w-[1.5rem] md:min-w-[2.25rem] text-center px-1 py-0.5 rounded font-bold inline-block">
              {formatNumber(timeLeft.minutes)}
            </span>
            <span className="text-[10px] md:text-xs text-white/80">m</span>
          </div>
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="bg-white/20 min-w-[1.5rem] md:min-w-[2.25rem] text-center px-1 py-0.5 rounded font-bold inline-block">
              {formatNumber(timeLeft.seconds)}
            </span>
            <span className="text-[10px] md:text-xs text-white/80">s</span>
          </div>
        </div>

        <button 
          onClick={toggleFullscreen}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 transition-colors z-20 rounded-md"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          type="button"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <Maximize className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
