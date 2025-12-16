import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

export function PromoBanner() {
  const [timeLeft, setTimeLeft] = useState({
    days: 21,
    hours: 2,
    minutes: 20,
    seconds: 23,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              }
            }
          }
        }
        
        return { days, hours, minutes, seconds };
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
        
        <div className="flex items-center gap-2 font-mono">
          <div className="flex items-center gap-1">
            <span className="bg-white/20 px-2 py-0.5 rounded font-bold">{formatNumber(timeLeft.days)}</span>
            <span className="text-xs text-white/80">Días</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-white/20 px-2 py-0.5 rounded font-bold">{formatNumber(timeLeft.hours)}</span>
            <span className="text-xs text-white/80">Horas</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-white/20 px-2 py-0.5 rounded font-bold">{formatNumber(timeLeft.minutes)}</span>
            <span className="text-xs text-white/80">Min</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-white/20 px-2 py-0.5 rounded font-bold">{formatNumber(timeLeft.seconds)}</span>
            <span className="text-xs text-white/80">Seg</span>
          </div>
        </div>
      </div>
    </div>
  );
}