import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-display uppercase italic text-foreground tracking-wide mb-8 animate-fade-up">
              Términos y Condiciones
            </h1>

            <div className="space-y-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Condiciones Generales</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Al acceder y realizar una compra en AsteroHype, confirmas que aceptas y te 
                  comprometes a cumplir los términos de servicio, todas las leyes y regulaciones 
                  aplicables, y reconoces que eres responsable del cumplimiento de las leyes locales.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Productos y Precios</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Nos reservamos el derecho de:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Modificar los precios de nuestros productos sin previo aviso</li>
                  <li>Limitar las cantidades de productos disponibles</li>
                  <li>Descontinuar cualquier producto en cualquier momento</li>
                  <li>Rechazar o cancelar pedidos por cualquier motivo</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Todos los precios incluyen IVA y están expresados en EUR.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Proceso de Compra</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Una vez realizado el pedido, recibirás un email de confirmación. El contrato 
                  se perfecciona cuando recibas la confirmación del envío de tu pedido. Nos 
                  reservamos el derecho de rechazar cualquier pedido si detectamos irregularidades 
                  o si el producto se ha agotado.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Envíos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Información sobre nuestros envíos:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Los plazos de entrega son estimados y no garantizados</li>
                  <li>El riesgo de pérdida y daño pasa al cliente una vez entregado el producto</li>
                  <li>Los gastos de envío se calcularán y mostrarán antes de finalizar la compra</li>
                </ul>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Devoluciones y Reembolsos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Tienes derecho a desistir del contrato en un plazo de 14 días naturales desde 
                  la recepción del producto. Para ejercer el derecho de devolución:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>El producto debe estar sin usar y en su embalaje original</li>
                  <li>Los gastos de devolución corren a cargo del cliente</li>
                  <li>El reembolso se realizará en un plazo máximo de 14 días</li>
                </ul>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Garantía</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Todos nuestros productos cuentan con la garantía legal de conformidad de 2 años 
                  desde la fecha de entrega. En caso de producto defectuoso, contacta con nosotros 
                  a través de la página de contacto.
                </p>
              </section>

              <section className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Modificaciones</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                  Las modificaciones entrarán en vigor inmediatamente después de su publicación 
                  en el sitio web.
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

export default Terms;
