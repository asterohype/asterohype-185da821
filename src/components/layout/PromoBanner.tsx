import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";

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

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-4 text-sm md:text-base">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 fill-white" />
          <span className="font-bold uppercase tracking-wide">Rebajas y Descuentos</span>
        </div>

        {/* Use fixed widths + tabular numbers to prevent layout shift / “jitter” */}
        <div className="flex items-center gap-2 font-mono tabular-nums">
          <div className="flex items-center gap-1">
            <span className="bg-white/20 w-9 text-center px-2 py-0.5 rounded font-bold inline-block">
              {formatNumber(timeLeft.days)}
            </span>
            <span className="text-xs text-white/80">Días</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-white/20 w-9 text-center px-2 py-0.5 rounded font-bold inline-block">
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="text-xs text-white/80">Horas</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-white/20 w-9 text-center px-2 py-0.5 rounded font-bold inline-block">
              {formatNumber(timeLeft.minutes)}
            </span>
            <span className="text-xs text-white/80">Min</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-white/20 w-9 text-center px-2 py-0.5 rounded font-bold inline-block">
              {formatNumber(timeLeft.seconds)}
            </span>
            <span className="text-xs text-white/80">Seg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
