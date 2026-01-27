import React, { useState, useEffect } from "react";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { ArrowRight, Tag, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CouponsService } from "../../../shared/data/coupons";
import { useToast } from "../../../app/providers/ToastProvider";
import { LoadingSpinner } from "../../../shared/ui/LoadingScreen";

export function CartSummary({ cartItems, total, onCheckout }) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validating, setValidating] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    recalculateDiscount();
  }, [appliedCoupon, cartItems, total]);

  const recalculateDiscount = () => {
    if (!appliedCoupon) {
      setDiscountAmount(0);
      return;
    }

    let calculatedDiscount = 0;

    if (appliedCoupon.courseId) {
      // Course-specific coupon
      const targetItem = cartItems.find(
        (item) => item.$id === appliedCoupon.courseId,
      );
      if (targetItem) {
        if (appliedCoupon.type === "percent") {
          calculatedDiscount =
            (targetItem.priceCents * appliedCoupon.value) / 100;
        } else {
          // Fixed amount is in currency units (dollars/pesos), priceCents is in cents
          calculatedDiscount = appliedCoupon.value * 100; // Convert to cents
        }
        // Cap discount at item price
        if (calculatedDiscount > targetItem.priceCents) {
          calculatedDiscount = targetItem.priceCents;
        }
      } else {
        // Item removed?
        setAppliedCoupon(null);
        setDiscountAmount(0);
        showToast(
          t(
            "cart.couponRemoved",
            "Cupón removido: El curso ya no está en el carrito",
          ),
          "info",
        );
        return;
      }
    } else {
      // Global coupon
      if (appliedCoupon.type === "percent") {
        calculatedDiscount = (total * appliedCoupon.value) / 100;
      } else {
        calculatedDiscount = appliedCoupon.value * 100;
      }
      // Cap at total
      if (calculatedDiscount > total) {
        calculatedDiscount = total;
      }
    }

    setDiscountAmount(calculatedDiscount);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidating(true);
    try {
      // Validate coupon via service
      const coupon = await CouponsService.validateCoupon(couponCode);

      // Check if the coupon is valid for the current cart
      if (coupon.courseId) {
        const hasCourse = cartItems.some(
          (item) => item.$id === coupon.courseId,
        );
        if (!hasCourse) {
          showToast(
            t(
              "cart.couponInvalidCourse",
              "Este cupón no es válido para los cursos en tu carrito",
            ),
            "error",
          );
          return;
        }
      }

      setAppliedCoupon(coupon);
      showToast(
        t("cart.couponApplied", "Cupón aplicado correctamente"),
        "success",
      );
      setCouponCode("");
    } catch (e) {
      console.error(e);
      showToast(
        e.message || t("cart.couponInvalid", "Cupón inválido"),
        "error",
      );
    } finally {
      setValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const finalTotal = total - discountAmount;

  return (
    <Card className="p-6 sticky top-24 space-y-6">
      <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">
        {t("cart.summary", "Resumen del pedido")}
      </h3>

      {/* Coupon Input */}
      <div className="space-y-2">
        {!appliedCoupon ? (
          <div className="flex gap-2">
            <Input
              placeholder={t("cart.couponPlaceholder", "Código de cupón")}
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={validating}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
            />
            <Button
              variant="outline"
              onClick={handleApplyCoupon}
              disabled={!couponCode || validating}
            >
              {validating ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Tag className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/20 rounded-md">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-600" />
              <div>
                <span className="text-sm font-bold text-green-700 block">
                  {appliedCoupon.code}
                </span>
                <span className="text-xs text-green-600 block leading-none">
                  {appliedCoupon.type === "percent"
                    ? `-${appliedCoupon.value}%`
                    : `-$${appliedCoupon.value}`}
                  {appliedCoupon.courseId ? " (Curso específico)" : ""}
                </span>
              </div>
            </div>
            <button
              onClick={removeCoupon}
              className="text-gray-400 hover:text-red-500 ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-[rgb(var(--text-secondary))]">
          <span>
            {t("cart.subtotal", "Subtotal")} ({cartItems.length}{" "}
            {t("common.courses", "cursos")})
          </span>
          <span>
            {new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: "MXN",
            }).format(total / 100)}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>{t("cart.discount", "Descuento")}</span>
            <span>
              -
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(discountAmount / 100)}
            </span>
          </div>
        )}

        <div className="border-t border-[rgb(var(--border-base))] pt-3 flex justify-between font-bold text-lg text-[rgb(var(--text-primary))]">
          <span>{t("cart.total", "Total")}</span>
          <span>
            {new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: "MXN",
            }).format(finalTotal / 100)}
          </span>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={() => onCheckout({ total: finalTotal, coupon: appliedCoupon })}
      >
        {t("cart.checkout", "Proceder al Pago")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <p className="text-xs text-center text-[rgb(var(--text-tertiary))]">
        {t(
          "cart.securityNote",
          "30 días de garantía de devolución. Compra segura.",
        )}
      </p>
    </Card>
  );
}
