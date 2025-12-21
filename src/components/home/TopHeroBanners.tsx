import { Link } from "react-router-dom";

import bannerHypeBlue from "@/assets/banner-asterohype-blue.png";
import bannerHypePink from "@/assets/banner-asterohype-pink.png";

function BannerCard({ 
  src, 
  title, 
  subtitle, 
  linkTo, 
  buttonText,
  buttonVariant = "hero"
}: { 
  src: string; 
  title: string;
  subtitle: string;
  linkTo: string;
  buttonText: string;
  buttonVariant?: "hero" | "hero-outline";
}) {
  return (
    <article className="relative rounded-2xl overflow-hidden" aria-label={title}>
      <Link to={linkTo} className="block">
        <img
          src={src}
          alt={title}
          className="w-full h-auto object-cover"
          loading="eager"
          decoding="async"
        />
      </Link>
    </article>
  );
}

export function TopHeroBanners() {
  return (
    <section className="container mx-auto px-4 mb-6" aria-label="Banners principales">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BannerCard
          src={bannerHypeBlue}
          title="Felices Fiestas"
          subtitle="Regalos y novedades en AsteroHype"
          linkTo="/products?tag=nuevos"
          buttonText="Ver novedades"
        />
        <BannerCard
          src={bannerHypePink}
          title="Ofertas Navideñas"
          subtitle="Productos de calidad con descuentos especiales"
          linkTo="/products?tag=ofertas"
          buttonText="Ver ofertas"
          buttonVariant="hero-outline"
        />
      </div>
    </section>
  );
}
