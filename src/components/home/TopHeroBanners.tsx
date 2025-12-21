import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import bannerFelices from "@/assets/banner-felices-fiestas.png";
import bannerOfertas from "@/assets/banner-ofertas-navidenas.png";

function BannerBg({ src }: { src: string }) {
  return (
    <div className="absolute inset-0">
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/55 to-foreground/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/20" />
    </div>
  );
}

export function TopHeroBanners() {
  return (
    <section className="container mx-auto px-4 mb-6" aria-label="Banners principales">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="relative rounded-2xl overflow-hidden border border-border/40 bg-card" aria-label="Felices Fiestas">
          <header className="relative p-6 md:p-8 min-h-[190px]">
            <BannerBg src={bannerFelices} />
            <div className="relative">
              <h2 className="font-display italic uppercase text-background text-2xl md:text-3xl leading-tight">
                Felices Fiestas
              </h2>
              <p className="text-background/70 text-sm md:text-base mt-1">Regalos y novedades en AsteroHype</p>
              <Link to="/products?tag=nuevos">
                <Button variant="hero" size="lg" className="mt-4 rounded-full">
                  Ver novedades
                </Button>
              </Link>
            </div>
          </header>
        </article>

        <article className="relative rounded-2xl overflow-hidden border border-border/40 bg-card" aria-label="Ofertas Navideñas">
          <header className="relative p-6 md:p-8 min-h-[190px]">
            <BannerBg src={bannerOfertas} />
            <div className="relative">
              <h2 className="font-display italic uppercase text-background text-2xl md:text-3xl leading-tight">
                Ofertas Navideñas
              </h2>
              <p className="text-background/70 text-sm md:text-base mt-1">Productos de calidad con descuentos especiales</p>
              <Link to="/products?tag=ofertas">
                <Button variant="hero-outline" size="lg" className="mt-4 rounded-full">
                  Ver ofertas
                </Button>
              </Link>
            </div>
          </header>
        </article>
      </div>
    </section>
  );
}


