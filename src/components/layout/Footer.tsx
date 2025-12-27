import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    shop: [
      { name: "Todos los Productos", href: "/products" },
      { name: "Tecnología", href: "/products" },
      { name: "Accesorios", href: "/products" },
    ],
    support: [
      { name: "Contacto", href: "/contact" },
      { name: "Aviso Legal", href: "/legal" },
      { name: "Envíos y Devoluciones", href: "/terms" },
    ],
    company: [
      { name: "Sobre Nosotros", href: "/" },
      { name: "Política de Privacidad", href: "/privacy" },
      { name: "Términos y Condiciones", href: "/terms" },
    ],
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-2xl font-display uppercase italic tracking-wide text-foreground">
              AsteroHype
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Tu destino para tecnología, accesorios y moda. Calidad y estilo en cada producto.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Tienda</h3>
            <ul className="space-y-3">
              {links.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Soporte</h3>
            <ul className="space-y-3">
              {links.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} AsteroHype. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300">
              Privacidad
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-price-yellow transition-colors duration-300">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
