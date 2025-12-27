import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/50" />
      
      {/* Subtle glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10 flex-1 flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-8 animate-fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="w-2 h-2 rounded-full bg-price-yellow animate-pulse" />
            <span className="text-sm text-muted-foreground">Nueva Colección Disponible</span>
          </div>

          {/* Headline */}
          <h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-foreground mb-6 animate-fade-up"
            style={{ animationDelay: '0.2s' }}
          >
            Live Simple.
            <br />
            <span className="font-normal">Live Smart.</span>
          </h1>

          {/* Subtitle */}
          <p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up"
            style={{ animationDelay: '0.3s' }}
          >
            Elegancia en cada detalle. Accesorios y gadgets modernos diseñados para quienes aprecian la simplicidad.
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up"
            style={{ animationDelay: '0.4s' }}
          >
            <Button asChild variant="hero" size="xl">
              <Link to="/products">
                Explorar Colección
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="hero-outline" size="xl">
              <Link to="/products">
                Ver Más
              </Link>
            </Button>
          </div>

          {/* Scroll indicator - Now below buttons */}
          <div 
            className="animate-fade-up"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="flex flex-col items-center gap-2 animate-bounce">
              <span className="text-xs text-muted-foreground/50 uppercase tracking-widest">Scroll</span>
              <div className="w-8 h-12 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
                <div className="w-1.5 h-3 rounded-full bg-price-yellow animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
