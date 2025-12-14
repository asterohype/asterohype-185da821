import logoCiolinks from "@/assets/logo-ciolinks.png";
import logoLinksrz from "@/assets/logo-linksrz.png";
import { Send, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sponsors() {
  const sponsors = [
    {
      name: "CioLinks",
      logo: logoCiolinks,
      telegram: "https://t.me/Ciolinks",
      tiktok: "https://www.tiktok.com/@ciolinks",
    },
    {
      name: "LinksRZ",
      logo: logoLinksrz,
      telegram: "https://t.me/linksrzofficial",
      tiktok: "https://www.tiktok.com/@linksrz1",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-foreground mb-4">
            Nuestros Dueños
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Las marcas detrás de AsteroHype
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.name}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden bg-background/50 backdrop-blur-sm border border-border/30 transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                <img
                  src={sponsor.logo}
                  alt={`Logo de ${sponsor.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg font-medium text-foreground">{sponsor.name}</h3>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  asChild
                >
                  <a href={sponsor.telegram} target="_blank" rel="noopener noreferrer">
                    <Send className="h-4 w-4" />
                    Telegram
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  asChild
                >
                  <a href={sponsor.tiktok} target="_blank" rel="noopener noreferrer">
                    <Music2 className="h-4 w-4" />
                    TikTok
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
