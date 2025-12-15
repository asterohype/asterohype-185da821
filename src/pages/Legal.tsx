import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-display uppercase italic text-foreground tracking-wide mb-8 animate-fade-up">
              Aviso Legal
            </h1>

            <div className="prose prose-invert max-w-none space-y-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Identificación del Titular</h2>
                <p className="text-muted-foreground leading-relaxed">
                  AsteroHype es una tienda online operada bajo las marcas CioLinks y LinksRZ. 
                  La presente información se proporciona en cumplimiento de la normativa vigente 
                  sobre comercio electrónico y protección de datos.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Objeto y Ámbito de Aplicación</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Este aviso legal regula el uso del sitio web www.asterohype.com. El acceso al 
                  sitio web atribuye la condición de usuario e implica la aceptación plena y sin 
                  reservas de todas las disposiciones incluidas en este Aviso Legal.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Propiedad Intelectual</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Todos los contenidos del sitio web, incluyendo textos, fotografías, gráficos, 
                  imágenes, iconos, tecnología, software, así como su diseño gráfico y códigos 
                  fuente, constituyen una obra cuya propiedad pertenece a AsteroHype, sin que 
                  puedan entenderse cedidos al usuario ninguno de los derechos de explotación.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Exclusión de Responsabilidad</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  AsteroHype no se hace responsable de:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Los daños que pudieran ocasionarse por el uso inadecuado de la web</li>
                  <li>Los contenidos de las páginas enlazadas desde este sitio web</li>
                  <li>La falta de disponibilidad del sitio web por mantenimiento u otras causas</li>
                </ul>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Legislación Aplicable</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Las relaciones establecidas entre AsteroHype y el Usuario se regirán por la 
                  normativa española vigente. Para cualquier controversia que pudiera derivarse 
                  del acceso o uso de este sitio web, las partes se someten a los Juzgados y 
                  Tribunales correspondientes.
                </p>
              </section>

              <p className="text-sm text-muted-foreground pt-4">
                Última actualización: Diciembre 2024
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Legal;
