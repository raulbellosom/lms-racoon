import React from "react";
import { motion } from "framer-motion";
import { Trophy, Clock, TrendingUp, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../../../shared/ui/PageLayout";

import { useAuth } from "../../../app/providers/AuthProvider";
import { Card } from "../../../shared/ui/Card";
import { ProgressBar } from "../../../shared/ui/ProgressBar";

/**
 * Progress view - shows student learning stats and achievements
 */
export function ProgressView() {
  const { t } = useTranslation();
  const { auth } = useAuth();

  const displayName =
    auth.profile?.firstName || auth.user?.name?.split(" ")[0] || "Estudiante";

  // Mock data - in production this would come from a stats API
  const stats = {
    coursesCompleted: 2,
    coursesInProgress: 3,
    totalTimeMinutes: 1250,
    streakDays: 7,
    pointsEarned: 850,
    certificatesEarned: 1,
  };

  const achievements = [
    { icon: Trophy, label: "Primer curso", earned: true },
    { icon: TrendingUp, label: "7 días seguidos", earned: true },
    { icon: Clock, label: "10 horas de estudio", earned: false },
    { icon: Award, label: "Certificado obtenido", earned: true },
  ];

  return (
    <PageLayout
      title={t("nav.progress")}
      subtitle={`${displayName}, aquí está tu progreso de aprendizaje`}
    >
      {/* Stats grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--brand-soft))]">
                <Trophy className="h-6 w-6 text-[rgb(var(--brand-primary))]" />
              </div>
              <div>
                <div className="text-2xl font-extrabold">
                  {stats.coursesCompleted}
                </div>
                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  Cursos completados
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--success-soft))]">
                <TrendingUp className="h-6 w-6 text-[rgb(var(--success))]" />
              </div>
              <div>
                <div className="text-2xl font-extrabold">
                  {stats.streakDays}
                </div>
                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  Días de racha
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--info-soft))]">
                <Clock className="h-6 w-6 text-[rgb(var(--info))]" />
              </div>
              <div>
                <div className="text-2xl font-extrabold">
                  {Math.floor(stats.totalTimeMinutes / 60)}h
                </div>
                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  Tiempo total
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--warning-soft))]">
                <Award className="h-6 w-6 text-[rgb(var(--warning))]" />
              </div>
              <div>
                <div className="text-2xl font-extrabold">
                  {stats.pointsEarned}
                </div>
                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  Puntos ganados
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8"
      >
        <h2 className="text-lg font-bold">Logros</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((achievement, i) => (
            <Card
              key={i}
              className={[
                "flex items-center gap-3 p-4 transition",
                achievement.earned ? "" : "opacity-50 grayscale",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  achievement.earned
                    ? "bg-[rgb(var(--brand-soft))]"
                    : "bg-[rgb(var(--bg-muted))]",
                ].join(" ")}
              >
                <achievement.icon
                  className={[
                    "h-5 w-5",
                    achievement.earned
                      ? "text-[rgb(var(--brand-primary))]"
                      : "text-[rgb(var(--text-muted))]",
                  ].join(" ")}
                />
              </div>
              <span className="text-sm font-medium">{achievement.label}</span>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Course progress */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <h2 className="text-lg font-bold">Cursos en progreso</h2>
        <div className="mt-4 space-y-3">
          {/* Mock course progress */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">React Avanzado</span>
              <span className="text-xs text-[rgb(var(--text-secondary))]">
                75%
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={75} />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Node.js Backend</span>
              <span className="text-xs text-[rgb(var(--text-secondary))]">
                40%
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={40} />
            </div>
          </Card>
        </div>
      </motion.div>
    </PageLayout>
  );
}
