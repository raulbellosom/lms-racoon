import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../../../shared/ui/PageLayout";

import { useAuth } from "../../../app/providers/AuthProvider";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { ListItemSkeleton } from "../../../shared/ui/Skeleton";
import { listMyEnrollments } from "../../../shared/data/enrollments";
import { getCourseById } from "../../../shared/data/courses";
import { CourseCard } from "../../../components/courses/CourseCard";

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
    <PageLayout
      title={t("nav.myCourses")}
      subtitle={t("student.continueLearning")}
    >
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <motion.div
                key={course.$id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="relative group">
                  {/* 
                         CourseCard links to public view by default.
                         For 'My Courses', we usually want to go to 'Continue Learning' or Learn Page.
                         The User said "usarlo en todas partes", implying consistency is key.
                         
                         If we use CourseCard, clicking title goes to /courses/:id.
                         The previous implementation had "Continue" button -> /app/learn/:id
                         
                         Let's wrap CourseCard or overlay the "Continue" button.
                         Similar to Teacher view, we can overlay action buttons.
                     */}
                  <CourseCard course={course} />

                  <div className="absolute top-3 right-3 z-20 flex gap-2">
                    <Link to={`/app/learn/${course.$id}`}>
                      <Button
                        size="sm"
                        className="shadow-lg backdrop-blur-md bg-white/90 hover:bg-white text-black"
                      >
                        <PlayCircle className="h-4 w-4 mr-1" /> Continuar
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
