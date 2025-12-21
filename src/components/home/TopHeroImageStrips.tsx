import { useEffect, useState } from "react";

import lifestyleImg1 from "@/assets/lifestyle-shopping-1.jpg";
import lifestyleImg2 from "@/assets/lifestyle-shopping-2.jpg";
import shoppingBags1 from "@/assets/shopping-bags-1.jpg";
import giftBoxes1 from "@/assets/gift-boxes-1.jpg";
import deliveryBoxes1 from "@/assets/delivery-boxes-1.jpg";
import shoppingCart1 from "@/assets/shopping-cart-1.jpg";
import premiumBags1 from "@/assets/premium-bags-1.jpg";

const LIFESTYLE_BANNER_IMAGES = [lifestyleImg1, shoppingBags1, deliveryBoxes1, shoppingCart1];
const OFFERS_BANNER_IMAGES = [lifestyleImg2, giftBoxes1, premiumBags1];

function BannerCarousel({ images, interval = 4500 }: { images: string[]; interval?: number }) {
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
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out"
          style={{ opacity: i === currentIndex ? 1 : 0 }}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}

function ImageStripCard({
  title,
  subtitle,
  images,
  interval,
}: {
  title: string;
  subtitle: string;
  images: string[];
  interval?: number;
}) {
  return (
    <article className="rounded-2xl overflow-hidden border border-border/40 bg-card" aria-label={title}>
      <div className="relative h-[240px] md:h-[280px] overflow-hidden rounded-2xl"> 
        <BannerCarousel images={images} interval={interval} />
      </div>
      <footer className="p-5 md:p-6">
        <h2 className="font-display italic uppercase text-foreground text-xl md:text-2xl leading-tight">
          {title}
        </h2>
        <p className="text-foreground/70 text-sm mt-1">{subtitle}</p>
      </footer>
    </article>
  );
}

export function TopHeroImageStrips() {
  return (
    <section className="container mx-auto px-4 mb-10" aria-label="Imágenes destacadas">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageStripCard
          title="Ideas de Navidad"
          subtitle="Imágenes y packs para regalar"
          images={LIFESTYLE_BANNER_IMAGES}
          interval={5200}
        />
        <ImageStripCard
          title="Ofertas & Descuentos"
          subtitle="Selección de regalos con rebaja"
          images={OFFERS_BANNER_IMAGES}
          interval={4400}
        />
      </div>
    </section>
  );
}
