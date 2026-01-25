import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CourseCard } from "../../../../components/courses/CourseCard";
import { CourseGridSkeleton } from "../../../../shared/ui/Skeleton";
import { listPublishedCourses } from "../../../../shared/data/courses";

/**
 * Featured courses showcase with animated cards
 */
export function FeaturedCourses() {
  const { t } = useTranslation();
  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    listPublishedCourses({ limit: 6 })
      .then(({ documents }) => setCourses(documents))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {/* Section header */}
      <div className="flex items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            {t("landing.featuredCourses")}
          </h2>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            {t("landing.featuredCoursesDesc")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/catalog"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-[rgb(var(--brand-primary))] transition hover:text-[rgb(var(--brand-secondary))]"
          >
            {t("common.viewAll")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="mt-6">
          <CourseGridSkeleton count={6} />
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-12 text-center">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {t("courses.noCoursesFound")}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => (
            <motion.div
              key={course.$id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <CourseCard course={course} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
