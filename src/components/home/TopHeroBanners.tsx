import { Link } from "react-router-dom";

import bannerAsterohype from "@/assets/banner-asterohype.png";

export function TopHeroBanners() {
  return (
    <section className="container mx-auto px-4 mb-6" aria-label="Banner Asterohype">
      <Link to="/products?tag=nuevos" className="block">
        <img
          src={bannerAsterohype}
          alt="Asterohype - Novedades y productos exclusivos"
          className="w-full h-auto object-cover rounded-2xl"
          loading="eager"
          decoding="async"
        />
      </Link>
    </section>
  );
}
