import { Link } from "react-router-dom";

export function ChristmasBanner() {
  return (
    <section className="w-full mb-6" aria-label="Banner Asterohype">
      <Link to="/products?tag=nuevos" className="block w-full">
        <img 
          src="/banner_asterohype.png" 
          alt="Banner AsteroHype" 
          className="w-full h-auto object-cover rounded-xl"
        />
      </Link>
    </section>
  );
}
