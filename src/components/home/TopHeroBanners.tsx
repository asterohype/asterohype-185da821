import { Link } from "react-router-dom";

import bannerAsterohype from "@/assets/banner-asterohype.png";

export function TopHeroBanners() {
  return (
    <section className="w-full mb-8" aria-label="Banner Asterohype">
      <Link to="/products?tag=nuevos" className="block">
        <img
          src={bannerAsterohype}
          alt="Asterohype - Novedades y productos exclusivos"
          className="w-full h-auto object-cover"
          loading="eager"
          decoding="async"
        />
      </Link>
    </section>
  );
}
