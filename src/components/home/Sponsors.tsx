import logoCiolinks from "@/assets/logo-ciolinks.png";
import logoLinksrz from "@/assets/logo-linksrz.png";

export function Sponsors() {
  const sponsors = [
    {
      name: "CioLinks",
      logo: logoCiolinks,
    },
    {
      name: "LinksRZ",
      logo: logoLinksrz,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-foreground mb-4">
            Patrocinado por
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Respaldados por las mejores marcas del sector
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.name}
              className="group relative w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden bg-background/50 backdrop-blur-sm border border-border/30 transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
            >
              <img
                src={sponsor.logo}
                alt={`Logo de ${sponsor.name}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                <span className="text-foreground font-medium">{sponsor.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
