import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Newsletter } from "@/components/home/Newsletter";
import { Sponsors } from "@/components/home/Sponsors";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <FeaturedProducts />
        <Sponsors />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
