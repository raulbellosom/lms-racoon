import React from "react";
import {
  Star,
  Users,
  BarChart,
  BookOpen,
  Eye,
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../shared/ui/Card";
import { Button } from "../../shared/ui/Button";
import { FileService } from "../../shared/data/files";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../app/providers/AuthProvider";

export function CourseCard({ course, className = "" }) {
  const { isInCart, addToCart, removeFromCart } = useCart();
  const { auth } = useAuth();

  const {
    $id,
    title,
    subtitle,
    coverUrl, // Optional pre-calculated URL
    coverFileId, // File ID from DB
    rating,
    studentsCount,
    priceCents = 0,
    currency = "MXN",
    category, // string or object
    level,
    isPublished, // for instructor view
    teacherId,
  } = course;

  const isOwner = auth.user?.$id === teacherId;
  const inCart = isInCart($id);

  // 1. Compute Image URL
  const displayCoverUrl = React.useMemo(() => {
    if (coverUrl) return coverUrl;
    if (coverFileId) return FileService.getCourseCoverUrl(coverFileId);
    return null;
  }, [coverUrl, coverFileId]);

  // 2. Normalize Category Name
  const categoryName = typeof category === "object" ? category?.name : category;

  // 3. Determine Route Path
  const coursePath = auth.user ? `/app/courses/${$id}` : `/courses/${$id}`;

  return (
    <Card
      className={`group relative flex h-[340px] flex-col overflow-hidden border-0 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      {/* Background Image / Gradient */}
      <Link
        to={coursePath}
        className="absolute inset-0 z-0 block bg-[rgb(var(--bg-muted))]"
      >
        {displayCoverUrl ? (
          <img
            src={displayCoverUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-80">
            <BookOpen className="h-12 w-12 text-white/50" />
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/60 to-transparent" />
      </Link>

      {/* Badges Overlay */}
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        {/* Draft Badge (Instructor) */}
        {isPublished === false && (
          <span className="rounded-full bg-black/50 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            Borrador
          </span>
        )}
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 mt-auto flex flex-col p-5 text-white">
        <div className="mb-2">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
            {categoryName || "General"}
          </span>
        </div>

        <Link
          to={coursePath}
          className="group-hover:text-indigo-300 transition-colors"
        >
          <h3
            className="mb-1 line-clamp-2 text-xl font-bold leading-tight text-white drop-shadow-sm"
            title={title}
          >
            {title}
          </h3>
        </Link>

        {subtitle && (
          <p className="mb-4 line-clamp-2 text-xs font-medium text-gray-300">
            {subtitle}
          </p>
        )}

        {/* Metadata Footer */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-3">
              {studentsCount > 0 && (
                <span className="flex items-center gap-1" title="Alumnos">
                  <Users className="h-3.5 w-3.5 text-blue-300" />
                  <span className="font-semibold">{studentsCount}</span>
                </span>
              )}
              {rating > 0 && (
                <span className="flex items-center gap-1" title="Rating">
                  <Star
                    className="h-3.5 w-3.5 text-yellow-400"
                    fill="currentColor"
                  />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {priceCents === 0 ? (
                <span className="font-bold text-emerald-300">Gratis</span>
              ) : (
                <span className="font-bold text-amber-300">
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency,
                  }).format(priceCents / 100)}
                </span>
              )}
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <BarChart className="h-3 w-3" />
              <span className="capitalize">{level || "General"}</span>
            </span>

            <div className="flex gap-2">
              {!isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-7 px-2 text-xs border border-white/10 ${
                    inCart
                      ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (inCart) {
                      removeFromCart($id);
                    } else {
                      addToCart(course);
                    }
                  }}
                  title={inCart ? "Quitar del carrito" : "Añadir al carrito"}
                >
                  {inCart ? (
                    <ShoppingCart className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <ShoppingCart className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}

              <Link to={coursePath}>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs bg-indigo-600/90 text-white hover:bg-indigo-500 shadow-sm border border-transparent"
                >
                  Ver Curso
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
