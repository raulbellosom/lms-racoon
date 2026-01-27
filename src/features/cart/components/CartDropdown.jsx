import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Trash2, X } from "lucide-react";

import { FileService } from "../../../shared/data/files";
import { useCart } from "../../../context/CartContext";
import { Button } from "../../../shared/ui/Button";
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from "../../../shared/ui/Dropdown";

export function CartDropdown() {
  const { t } = useTranslation();
  const { cartItems, removeFromCart, clearCart, getCartTotal } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const total = getCartTotal();

  // Limited items for preview
  const previewItems = cartItems.slice(0, 5);
  const remainingCount = Math.max(0, cartItems.length - 5);

  return (
    <Dropdown
      align="end"
      side="bottom"
      sideOffset={12}
      className="w-80"
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <button className="relative rounded-lg p-2 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--brand-primary))] transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))/0.2]">
          <ShoppingCart className="h-5 w-5" />
          {cartItems.length > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[rgb(var(--bg-surface))]">
              {cartItems.length}
            </span>
          )}
        </button>
      }
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-[rgb(var(--text-primary))]">
            {t("cart.yourCart", "Tu Carrito")} ({cartItems.length})
          </h3>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              {t("cart.clear", "Vaciar")}
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-6 text-sm text-[rgb(var(--text-secondary))]">
            <p className="mb-2">{t("cart.empty", "Tu carrito está vacío")}</p>
            <Link to="/app/explore" onClick={() => setIsOpen(false)}>
              <span className="text-[rgb(var(--brand-primary))] hover:underline cursor-pointer">
                {t("nav.explore", "Explorar cursos")}
              </span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-[220px] overflow-y-auto space-y-3 scrollbar-thin pr-1">
              {previewItems.map((item) => (
                <div key={item.$id} className="flex gap-3 relative group">
                  <div className="h-12 w-16 bg-[rgb(var(--bg-muted))] rounded overflow-hidden shrink-0">
                    {/* Placeholder or tiny image if available */}
                    <img
                      src={
                        item.coverUrl ||
                        (item.coverFileId
                          ? FileService.getCourseCoverUrl(item.coverFileId)
                          : null) ||
                        // Fallback placeholder (local or specific service, avoid via.placeholder if down)
                        "https://placehold.co/64"
                      }
                      alt=""
                      className="h-full w-full object-cover opacity-80"
                      onError={(e) => {
                        e.target.style.display = "none"; // Hide if fails
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate leading-tight">
                      {item.title}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5 font-semibold">
                      {item.priceCents === 0
                        ? "Gratis"
                        : new Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          }).format(item.priceCents / 100)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.$id)}
                    className="absolute right-0 top-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50 rounded"
                    title={t("common.remove")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {remainingCount > 0 && (
                <p className="text-xs text-center text-[rgb(var(--text-tertiary))] italic pt-1">
                  +{remainingCount} cursos más...
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-[rgb(var(--border-base))]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-[rgb(var(--text-secondary))]">
                  Total
                </span>
                <span className="text-lg font-bold text-[rgb(var(--text-primary))]">
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(total / 100)}
                </span>
              </div>

              <Link
                to="/app/cart"
                className="block"
                onClick={() => setIsOpen(false)}
              >
                <Button className="w-full" size="sm">
                  {t("cart.checkout", "Ir al Carrito")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Dropdown>
  );
}
