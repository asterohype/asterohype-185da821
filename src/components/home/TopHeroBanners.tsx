import { useEffect, useRef, useState } from "react";
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

function BannerCarousel({ images, interval = 4000 }: { images: string[]; interval?: number }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {images.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[1500ms] ease-in-out group-hover:scale-105"
          style={{
            opacity: i === currentIndex ? 1 : 0,
            filter: i === currentIndex ? "blur(0px)" : "blur(12px)",
            transform: i === currentIndex ? "scale(1)" : "scale(1.02)",
          }}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}

function HolidayStripCard({
  title,
  subtitle,
  cta,
  variant,
}: {
  title: string;
  subtitle: string;
  cta: { label: string; to: string };
  variant: "primary" | "outline";
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-card">
      <div className="absolute inset-0 bg-gradient-to-r from-price-yellow/10 via-transparent to-price-yellow/10" />
      <div className="relative p-6 md:p-8">
        <h2 className="font-display italic uppercase text-foreground text-2xl md:text-3xl leading-tight">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm md:text-base mt-1">{subtitle}</p>
        <Link to={cta.to}>
          <Button
            variant={variant === "primary" ? "hero" : "hero-outline"}
            size="lg"
            className="mt-4 rounded-full"
          >
            {cta.label}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function TopHeroBanners() {
  return (
    <section className="container mx-auto px-4 mb-8" aria-label="Banners principales">
      {/* Dos banners principales (mismas imágenes), con el texto navideño ENCIMA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px] md:h-[400px]">
        <div className="relative rounded-2xl overflow-hidden group">
          <BannerCarousel images={LIFESTYLE_BANNER_IMAGES} interval={5000} />
          <div className="absolute inset-0 bg-gradient-to-t from-overlay/70 via-overlay/15 to-transparent z-10" />

          <div className="absolute top-5 left-5 right-5 z-20">
            <div className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl p-5 md:p-6">
              <h2 className="font-display italic uppercase text-foreground text-2xl md:text-3xl leading-tight">
                Felices Fiestas
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                Regalos y novedades en AsteroHype
              </p>
              <Link to="/products?tag=nuevos">
                <Button variant="hero" size="lg" className="mt-4 rounded-full">
                  Ver novedades
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden group">
          <BannerCarousel images={OFFERS_BANNER_IMAGES} interval={4000} />
          <div className="absolute inset-0 bg-gradient-to-t from-overlay/70 via-overlay/15 to-transparent z-10" />

          <div className="absolute top-5 left-5 right-5 z-20">
            <div className="rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl p-5 md:p-6">
              <h2 className="font-display italic uppercase text-foreground text-2xl md:text-3xl leading-tight">
                Ofertas Navideñas
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                Productos de calidad con descuentos especiales
              </p>
              <Link to="/products?tag=ofertas">
                <Button variant="hero-outline" size="lg" className="mt-4 rounded-full">
                  Ver ofertas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
