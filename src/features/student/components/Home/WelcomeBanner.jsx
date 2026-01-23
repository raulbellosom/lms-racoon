import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Clock, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../../app/providers/AuthProvider";
import { Button } from "../../../../shared/ui/Button";

/**
 * Welcome banner with greeting and quick stats
 */
export function WelcomeBanner({
  enrolledCount = 0,
  streakDays = 0,
  todayMinutes = 0,
}) {
  const { t } = useTranslation();
  const { auth } = useAuth();

  // Get display name from firstName or fallback
  const displayName =
    auth.profile?.firstName ||
    auth.user?.name?.split(" ")[0] ||
    t("student.welcome");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-[rgb(var(--border-base)/0.5)] bg-[rgb(var(--bg-surface))] p-6"
    >
      {/* Background glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-primary)/0.15),transparent_70%)] blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--brand-primary))]">
              {t("student.homeTitle")}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("student.welcome")}, {displayName}! 👋
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            {t("student.continueLearning")}
          </p>
        </div>

        <Link to="/catalog">
          <Button variant="secondary" className="whitespace-nowrap">
            {t("nav.explore")} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 rounded-xl bg-[rgb(var(--bg-muted))] p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--brand-soft))]">
            <Trophy className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
          </div>
          <div>
            <div className="text-xs text-[rgb(var(--text-muted))]">
              {t("nav.myCourses")}
            </div>
            <div className="text-xl font-extrabold">{enrolledCount}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 rounded-xl bg-[rgb(var(--bg-muted))] p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--success-soft))]">
            <TrendingUp className="h-5 w-5 text-[rgb(var(--success))]" />
          </div>
          <div>
            <div className="text-xs text-[rgb(var(--text-muted))]">Racha</div>
            <div className="text-xl font-extrabold">{streakDays} días</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 rounded-xl bg-[rgb(var(--bg-muted))] p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--info-soft))]">
            <Clock className="h-5 w-5 text-[rgb(var(--info))]" />
          </div>
          <div>
            <div className="text-xs text-[rgb(var(--text-muted))]">Hoy</div>
            <div className="text-xl font-extrabold">{todayMinutes} min</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
