import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../../shared/ui/Button";

/**
 * Premium hero section with animated background and CTAs
 */
export function HeroSection() {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top gradient glow */}
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgb(var(--brand-primary)/0.2),transparent_60%)] blur-3xl" />
        {/* Side accents */}
        <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-secondary)/0.15),transparent_70%)] blur-2xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-accent)/0.1),transparent_70%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))/0.8] px-4 py-2 text-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
            <span className="text-[rgb(var(--text-secondary))]">
              {t("landing.features.tasksQaReviews")}
            </span>
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
        >
          {t("landing.heroTitle")}
          <br />
          <span className="text-gradient">{t("landing.heroHighlight")}</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-[rgb(var(--text-secondary))] sm:text-lg"
        >
          {t("landing.heroDescription")}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link to="/catalog">
            <Button size="lg" className="min-w-[200px] btn-shimmer">
              {t("landing.exploreCourses")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth/register">
            <Button size="lg" variant="secondary" className="min-w-[200px]">
              {t("landing.createAccountFree")}
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
