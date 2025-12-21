import { Link } from "react-router-dom";

import bannerAsterohype from "@/assets/banner-asterohype.png";
import bannerFelicesFiestas from "@/assets/banner-felices-fiestas-2.png";

export function ProductPageBanners() {
  return (
    <section className="w-full mb-6" aria-label="Banners promocionales">
      <div className="flex flex-col gap-0">
        <Link to="/products?tag=nuevos" className="block w-full">
          <img
            src={bannerAsterohype}
            alt="Asterohype - Novedades"
            className="w-full h-auto object-cover"
            loading="eager"
            decoding="async"
          />
        </Link>
        <Link to="/products?tag=ofertas" className="block w-full">
          <img
            src={bannerFelicesFiestas}
            alt="Felices Fiestas - Descuentos"
            className="w-full h-auto object-cover"
            loading="eager"
            decoding="async"
          />
        </Link>
      </div>
    </section>
  );
}
