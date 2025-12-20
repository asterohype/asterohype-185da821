import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import lifestyleImg1 from "@/assets/lifestyle-shopping-1.jpg";
import lifestyleImg2 from "@/assets/lifestyle-shopping-2.jpg";
import shoppingBags1 from "@/assets/shopping-bags-1.jpg";
import giftBoxes1 from "@/assets/gift-boxes-1.jpg";
import deliveryBoxes1 from "@/assets/delivery-boxes-1.jpg";
import shoppingCart1 from "@/assets/shopping-cart-1.jpg";
import premiumBags1 from "@/assets/premium-bags-1.jpg";

const LIFESTYLE_BANNER_IMAGES = [
  lifestyleImg1,
  shoppingBags1,
  deliveryBoxes1,
  shoppingCart1,
];

const OFFERS_BANNER_IMAGES = [lifestyleImg2, giftBoxes1, premiumBags1];

function useSnowCanvas(canvasRef: React.RefObject<HTMLCanvasElement>, density = 80) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let raf = 0;

    const flakes = Array.from({ length: density }).map((_, i) => ({
      id: i,
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 2.6 + 0.8,
      s: Math.random() * 0.35 + 0.15,
      o: Math.random() * 0.55 + 0.25,
      w: Math.random() * 1.2 + 0.4,
    }));

    const resize = () => {
      const { offsetWidth, offsetHeight } = canvas;
      canvas.width = Math.max(1, Math.floor(offsetWidth * dpr));
      canvas.height = Math.max(1, Math.floor(offsetHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const f of flakes) {
        f.y += f.s;
        f.x += Math.sin((f.y * 10 + f.id) * 0.02) * 0.002 * f.w;

        if (f.y > 1.05) {
          f.y = -0.05;
          f.x = Math.random();
        }

        const px = f.x * w;
        const py = f.y * h;

        ctx.beginPath();
        ctx.arc(px, py, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0, 0%, 100%, ${f.o})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [canvasRef, density]);
}

function BannerCarousel({ images, interval = 4500 }: { images: string[]; interval?: number }) {
  const idxRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    const el = containerRef.current;
    if (!el) return;

    const imgs = Array.from(el.querySelectorAll("img"));
    const set = (active: number) => {
      imgs.forEach((img, i) => {
        img.style.opacity = i === active ? "1" : "0";
        img.style.filter = i === active ? "blur(0px)" : "blur(12px)";
        img.style.transform = i === active ? "scale(1)" : "scale(1.02)";
      });
    };

    set(0);

    const t = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % images.length;
      set(idxRef.current);
    }, interval);

    return () => clearInterval(t);
  }, [images, interval]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden">
      {images.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[1500ms] ease-in-out"
          style={{ opacity: i === 0 ? 1 : 0, filter: i === 0 ? "blur(0px)" : "blur(12px)" }}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}

function HolidayCard({
  title,
  subtitle,
  cta,
  variant,
  images,
}: {
  title: string;
  subtitle: string;
  cta: { label: string; to: string };
  variant: "primary" | "outline";
  images: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useSnowCanvas(canvasRef, 90);

  return (
    <div className="relative rounded-2xl overflow-hidden group h-[180px] md:h-[220px] lg:h-[260px]">
      <BannerCarousel images={images} />
      <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/15 via-transparent to-background/15" />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-sm text-muted-foreground">
        <span className="tracking-widest uppercase">Navidad</span>
        <span className="opacity-80">🎅 ❄️ 🎄</span>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-10">
        <h2 className="font-display italic uppercase text-foreground text-2xl md:text-3xl leading-tight">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm md:text-base mt-1">{subtitle}</p>
        <Link to={cta.to}>
          <Button variant={variant === "primary" ? "hero" : "hero-outline"} size="lg" className="mt-4 rounded-full">
            {cta.label}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function HolidayTopBanners() {
  return (
    <section className="container mx-auto px-4 mb-8" aria-label="Banners navideños">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HolidayCard
          title="Felices Fiestas"
          subtitle="Regalos, sorpresas y vibra navideña en AsteroHype"
          cta={{ label: "Ver novedades", to: "/products?tag=nuevos" }}
          variant="primary"
          images={LIFESTYLE_BANNER_IMAGES}
        />
        <HolidayCard
          title="Ofertas Navideñas"
          subtitle="Productos de calidad con descuentos especiales"
          cta={{ label: "Ver ofertas", to: "/products?tag=ofertas" }}
          variant="outline"
          images={OFFERS_BANNER_IMAGES}
        />
      </div>
    </section>
  );
}
