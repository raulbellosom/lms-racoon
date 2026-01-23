import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../../app/providers/AuthProvider";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { ListItemSkeleton } from "../../../shared/ui/Skeleton";
import { listMyEnrollments } from "../../../shared/data/enrollments";
import { getCourseById } from "../../../shared/data/courses";

/**
 * My Courses view - shows enrolled courses with progress
 */
export function MyCoursesView() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth.user?.$id) return;

    setLoading(true);
    listMyEnrollments({ userId: auth.user.$id })
      .then(async (enrollments) => {
        const coursePromises = enrollments.map((e) =>
          getCourseById(e.courseId).catch(() => null),
        );
        const courseList = await Promise.all(coursePromises);
        setCourses(courseList.filter(Boolean));
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [auth.user?.$id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("nav.myCourses")}
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
          {t("student.continueLearning")}
        </p>
      </motion.div>

      {/* Course list */}
      <div className="mt-6 space-y-4">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 4 }).map((_, i) => <ListItemSkeleton key={i} />)
        ) : courses.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-dashed border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-8 text-center"
          >
            <BookOpen className="mx-auto h-12 w-12 text-[rgb(var(--text-muted))]" />
            <h3 className="mt-4 text-lg font-bold">{t("student.noCourses")}</h3>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              {t("student.browseCatalog")}
            </p>
            <Link to="/catalog" className="mt-4 inline-block">
              <Button>{t("nav.explore")}</Button>
            </Link>
          </motion.div>
        ) : (
          // Course cards
          courses.map((course, index) => (
            <motion.div
              key={course.$id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                <div className="flex gap-4 p-4">
                  {/* Course thumbnail */}
                  <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl">
                    {course.coverUrl ? (
                      <img
                        src={course.coverUrl}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[rgb(var(--bg-muted))]">
                        <BookOpen className="h-8 w-8 text-[rgb(var(--text-muted))]" />
                      </div>
                    )}
                  </div>

                  {/* Course info */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-bold leading-tight">
                        {course.title}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-[rgb(var(--text-secondary))]">
                        {course.teacherName}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-2 flex gap-2">
                      <Link to={`/app/learn/${course.$id}`}>
                        <Button size="sm">
                          <PlayCircle className="h-4 w-4" />
                          {t("student.continue")}
                        </Button>
                      </Link>
                      <Link to={`/courses/${course.$id}`}>
                        <Button size="sm" variant="ghost">
                          <BookOpen className="h-4 w-4" />
                          {t("common.view")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
