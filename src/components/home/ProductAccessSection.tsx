import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ProductAccessSection() {
  return (
    <section className="container mx-auto px-4 py-12 text-center bg-secondary/10 my-8 rounded-3xl">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <h2 className="text-2xl md:text-3xl font-display uppercase italic text-foreground">
          Accede a Nuestros Productos
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Explora nuestra colección completa de productos de alta calidad seleccionados especialmente para ti.
        </p>
        <Link to="/products">
          <Button className="px-12 py-6 text-lg rounded-full bg-price-yellow hover:bg-price-yellow/90 text-background font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105">
            Productos
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
