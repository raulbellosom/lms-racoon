import React from "react";
import { Star, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function CatalogCourseCard({ course }) {
  const {
    $id,
    title,
    subtitle, // or category name fallback
    coverUrl, // assumption: computed or passed
    rating = 4.8,
    studentsCount = 120,
    priceCents = 0,
    currency = "MXN",
    category,
    level,
  } = course;

  const formattedPrice =
    priceCents === 0
      ? "Gratis"
      : new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency,
        }).format(priceCents / 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-[rgb(var(--bg-surface))] shadow-sm transition-shadow hover:shadow-xl border border-[rgb(var(--border-base))]"
    >
      <Link to={`/catalog/${$id}`} className="block h-48 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-black/10 transition-colors group-hover:bg-black/0" />
        <img
          src={
            coverUrl || "https://placehold.co/600x400/2a2a2a/FFF?text=Course"
          }
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {category && (
          <span className="absolute left-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black backdrop-blur-md">
            {category}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between text-xs text-[rgb(var(--text-muted))]">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {studentsCount}
          </span>
          <span className="capitalize">{level}</span>
        </div>

        <Link to={`/catalog/${$id}`} className="block flex-1">
          <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--brand-primary))] transition-colors">
            {title}
          </h3>
          <p className="line-clamp-2 text-sm text-[rgb(var(--text-secondary))]">
            {subtitle ||
              "Aprende las habilidades más demandadas con este curso completo y práctico."}
          </p>
        </Link>

        <div className="mt-4 flex items-center justify-between border-t border-[rgb(var(--border-base))] pt-4">
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-bold text-[rgb(var(--text-primary))]">
              {rating}
            </span>
          </div>
          <div className="text-lg font-bold text-[rgb(var(--brand-primary))]">
            {formattedPrice}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
