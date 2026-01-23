import { motion } from "framer-motion";
import { PlayCircle, ShieldCheck, Award, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const features = [
  {
    icon: PlayCircle,
    titleKey: "landing.features.videoCourses",
    descKey: "landing.features.videoCoursesDesc",
  },
  {
    icon: ShieldCheck,
    titleKey: "landing.features.realProgress",
    descKey: "landing.features.realProgressDesc",
  },
  {
    icon: Award,
    titleKey: "courses.includes",
    descKey: "student.certificatesEarned",
  },
  {
    icon: Users,
    titleKey: "teacher.students",
    descKey: "student.browseCatalog",
  },
];

/**
 * Features grid showing key platform benefits
 */
export function FeaturesGrid() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.titleKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group relative rounded-2xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-5 transition-all hover:border-[rgb(var(--brand-primary)/0.3)] hover:shadow-lg"
          >
            {/* Glow effect on hover */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[rgb(var(--brand-primary)/0.1)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative">
              <div className="mb-3 inline-flex rounded-xl bg-[rgb(var(--brand-soft))] p-2.5">
                <feature.icon className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
              </div>

              <h3 className="text-sm font-bold">{t(feature.titleKey)}</h3>

              <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
                {t(feature.descKey)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
