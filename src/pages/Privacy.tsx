import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-display uppercase italic text-foreground tracking-wide mb-8 animate-fade-up">
              Política de Privacidad
            </h1>

            <div className="space-y-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Responsable del Tratamiento</h2>
                <p className="text-muted-foreground leading-relaxed">
                  AsteroHype es el responsable del tratamiento de los datos personales recogidos 
                  a través de este sitio web. Nos comprometemos a proteger tu privacidad y a 
                  tratar tus datos de acuerdo con la normativa vigente en materia de protección 
                  de datos personales.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Datos que Recogemos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Podemos recoger los siguientes tipos de datos personales:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Datos de identificación: nombre, apellidos, email</li>
                  <li>Datos de envío: dirección postal, teléfono</li>
                  <li>Datos de navegación: cookies y tecnologías similares</li>
                  <li>Datos de compra: historial de pedidos, preferencias</li>
                </ul>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Finalidad del Tratamiento</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Tus datos serán tratados para las siguientes finalidades:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Gestionar y procesar tus pedidos</li>
                  <li>Enviarte comunicaciones relacionadas con tu compra</li>
                  <li>Atender tus consultas y solicitudes</li>
                  <li>Enviarte información comercial (con tu consentimiento)</li>
                  <li>Mejorar nuestros servicios y tu experiencia de usuario</li>
                </ul>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Tus Derechos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Puedes ejercer los siguientes derechos:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Derecho de acceso a tus datos personales</li>
                  <li>Derecho de rectificación de datos inexactos</li>
                  <li>Derecho de supresión (derecho al olvido)</li>
                  <li>Derecho a la limitación del tratamiento</li>
                  <li>Derecho a la portabilidad de los datos</li>
                  <li>Derecho de oposición</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Para ejercer estos derechos, contacta con nosotros a través de la página de contacto.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Seguridad</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Implementamos medidas de seguridad técnicas y organizativas apropiadas para 
                  proteger tus datos personales contra el acceso no autorizado, la alteración, 
                  divulgación o destrucción.
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

export default Privacy;
