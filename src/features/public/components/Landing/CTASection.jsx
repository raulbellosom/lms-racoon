import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../../shared/ui/Button";

/**
 * Call-to-action section with premium styling
 */
export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))] p-8 sm:p-12"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-4 inline-flex rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
            <Zap className="h-8 w-8 text-white" />
          </div>

          {/* Text */}
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {t("auth.registerSubtitle")}
          </h2>

          <p className="mt-3 max-w-lg text-sm text-white/80 sm:text-base">
            {t("landing.heroDescription")}
          </p>

          {/* CTA Button */}
          <Link to="/auth/register" className="mt-6">
            <Button
              size="lg"
              className="bg-white text-[rgb(var(--brand-primary))] hover:bg-white/90 min-w-[200px]"
            >
              {t("landing.createAccountFree")}{" "}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
