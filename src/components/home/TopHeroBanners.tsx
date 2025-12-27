import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobble: number;
}
export function TopHeroBanners() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const animationRef = useRef<number>();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const createSnowflakes = () => {
      const flakes: Snowflake[] = [];
      const count = 60;
      for (let i = 0; i < count; i++) {
        flakes.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1.5,
          speed: Math.random() * 1.2 + 0.4,
          opacity: Math.random() * 0.6 + 0.2,
          wobble: Math.random() * 1.5 - 0.75
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
      snowflakesRef.current.forEach(flake => {
        flake.y += flake.speed;
        flake.x += Math.sin(flake.y * 0.01) * flake.wobble;
        if (flake.y > canvas.height) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width) flake.x = 0;
        if (flake.x < 0) flake.x = canvas.width;
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
  return <section className="container mx-auto px-4 mb-6" aria-label="Banner Asterohype">
      <Link to="/products?tag=nuevos" className="block">
        
      </Link>
    </section>;
}