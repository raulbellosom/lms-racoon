import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../app/providers/AuthProvider";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { useTranslation } from "react-i18next";
import { FileService } from "../../shared/data/files";

export function CartPage() {
  const { cartItems, removeFromCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const total = getCartTotal();

  // Redirect authenticated users to the app view of the cart
  React.useEffect(() => {
    if (user) {
      navigate("/app/cart", { replace: true });
    }
  }, [user, navigate]);

  const handleCheckout = () => {
    if (!user) {
      // Redirect to login with return url
      navigate(`/auth/login?redirect=/cart`);
    } else {
      // Proceed to checkout (placeholder for now)
      // Maybe navigate to a payment page or show a modal
      alert("Procesando compra... (Integración de pagos pendiente)");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-4">
            Tu carrito está vacío
          </h2>
          <p className="text-[rgb(var(--text-secondary))] mb-8">
            Parece que aún no has agregado ningún curso.
          </p>
          <Link to="/catalog">
            <Button
              size="lg"
              className="bg-[rgb(var(--brand-primary))] text-white hover:bg-[rgb(var(--brand-secondary))]"
            >
              Explorar Cursos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8">
        Carrito de Compras
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card
              key={item.$id}
              className="p-4 flex flex-col sm:flex-row gap-4"
            >
              <div className="w-full sm:w-32 h-20 bg-gray-200 rounded-md overflow-hidden shrink-0">
                <img
                  src={
                    item.coverUrl ||
                    (item.coverFileId
                      ? FileService.getCourseCoverUrl(item.coverFileId)
                      : null) ||
                    "https://via.placeholder.com/150"
                  }
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grow">
                <Link to={`/courses/${item.$id}`} className="hover:underline">
                  <h3 className="font-semibold text-lg text-[rgb(var(--text-primary))]">
                    {item.title}
                  </h3>
                </Link>
                <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-1">
                  {item.subtitle}
                </p>
              </div>
              <div className="flex flex-row sm:flex-col justify-between items-end min-w-[100px]">
                <span className="font-bold text-lg text-[rgb(var(--brand-primary))]">
                  {item.priceCents === 0
                    ? "Gratis"
                    : new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: item.currency || "MXN",
                      }).format(item.priceCents / 100)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromCart(item.$id)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Resumen del pedido
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[rgb(var(--text-secondary))]">
                <span>Subtotal ({cartItems.length} cursos)</span>
                <span>
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(total / 100)}
                </span>
              </div>
              <div className="border-t border-[rgb(var(--border-base))] pt-3 flex justify-between font-bold text-lg text-[rgb(var(--text-primary))]">
                <span>Total</span>
                <span>
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(total / 100)}
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-[rgb(var(--brand-primary))] text-white hover:bg-[rgb(var(--brand-secondary))]"
              size="lg"
              onClick={handleCheckout}
            >
              Proceder al Pago
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="mt-4 text-xs text-center text-[rgb(var(--text-tertiary))]">
              30 días de garantía de devolución. Compra segura.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
