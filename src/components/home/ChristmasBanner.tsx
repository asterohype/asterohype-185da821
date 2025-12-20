import { useEffect, useRef, useMemo } from "react";

interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobble: number;
}

export function ChristmasBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const animationRef = useRef<number>();

  // Initialize snowflakes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const createSnowflakes = () => {
      const flakes: Snowflake[] = [];
      const count = 80;
      for (let i = 0; i < count; i++) {
        flakes.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 4 + 2,
          speed: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.7 + 0.3,
          wobble: Math.random() * 2 - 1,
        });
      }
      snowflakesRef.current = flakes;
    };

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      createSnowflakes();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakesRef.current.forEach((flake) => {
        // Update position
        flake.y += flake.speed;
        flake.x += Math.sin(flake.y * 0.01) * flake.wobble;

        // Reset if off screen
        if (flake.y > canvas.height) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width) flake.x = 0;
        if (flake.x < 0) flake.x = canvas.width;

        // Draw snowflake
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-[180px] md:h-[220px] lg:h-[260px] overflow-hidden rounded-2xl mx-auto my-8 bg-gradient-to-r from-red-900 via-green-900 to-red-900">
      {/* Christmas background pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 5 L35 20 L25 20 Z' fill='%23ffd700' opacity='0.3'/%3E%3Ccircle cx='10' cy='50' r='5' fill='%23ff0000' opacity='0.3'/%3E%3Ccircle cx='50' cy='50' r='5' fill='%23ff0000' opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />

      {/* Snowflakes canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Christmas decorations */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-8">
        <div className="text-4xl opacity-60">🎄</div>
        <div className="text-3xl opacity-60">⭐</div>
        <div className="text-4xl opacity-60">🎄</div>
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {/* ASTEROHYPE text */}
        <h2 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase italic text-price-yellow tracking-[0.2em] drop-shadow-[0_4px_20px_rgba(255,215,0,0.5)]">
          ASTEROHYPE
        </h2>
        
        {/* Subtitle */}
        <p className="text-white/80 text-sm md:text-base mt-3 tracking-widest uppercase">
          🎁 Felices Fiestas 🎁
        </p>

        {/* Christmas lights effect */}
        <div className="flex gap-3 mt-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                backgroundColor: ["#ff0000", "#00ff00", "#ffd700", "#ff0000", "#00ff00", "#ffd700", "#ff0000"][i],
                animationDelay: `${i * 0.2}s`,
                boxShadow: `0 0 10px ${["#ff0000", "#00ff00", "#ffd700", "#ff0000", "#00ff00", "#ffd700", "#ff0000"][i]}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom decorations */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4 text-2xl opacity-70">
        <span>🎅</span>
        <span>🦌</span>
        <span>🎁</span>
        <span>🦌</span>
        <span>🎅</span>
      </div>
    </div>
  );
}
