import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  BookOpen,
  Users,
  DollarSign,
  ArrowRight,
  Clock,
  Edit2,
  TrendingUp,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { FileService } from "../../../shared/data/files";
import { StatsService } from "../../../shared/data/stats";

function StatCard({ icon: Icon, label, value, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-lg transition-transform hover:scale-[1.02] ${gradient}`}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <h3 className="mt-2 text-3xl font-black text-white">{value}</h3>
        </div>
        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {/* Decorative background elements */}
      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -top-4 -left-4 h-20 w-20 rounded-full bg-white/10 blur-xl" />
    </motion.div>
  );
}

export function TeachHomePage() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    courses: 0,
    students: 0,
    revenue: 0,
  });

  React.useEffect(() => {
    if (auth.user?.$id) {
      loadDashboardData();
    }
  }, [auth.user?.$id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const myCourses = await TeacherCoursesService.listByTeacher(
        auth.user.$id,
      );
      setCourses(myCourses);

      let totalStudents = 0;
      const courseIds = myCourses.map((c) => c.$id);
      if (courseIds.length > 0) {
        const statsMap = await StatsService.getStatsForCourses(courseIds);
        Object.values(statsMap).forEach((s) => {
          totalStudents += s.totalStudents || 0;
        });
      }

      setStats({
        courses: myCourses.length,
        students: totalStudents,
        revenue: 0,
      });
    } catch (error) {
      console.error("Failed to load dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const recentCourses = courses.slice(0, 5);

  return (
    <PageLayout
      title={t("teacher.panelTitle")}
      subtitle={t("teacher.dashboard.welcome", {
        name: auth.profile?.firstName || "Teacher",
      })}
      actions={
        <Link to="/app/teach/courses/new">
          <Button
            size="lg"
            className="w-full sm:w-auto shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-shadow"
          >
            <Plus className="mr-2 h-5 w-5" /> {t("teacher.createCourse")}
          </Button>
        </Link>
      }
    >
      {/* Stats Grid */}
      <div className="mb-10 grid gap-6 sm:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label={t("teacher.dashboard.totalCourses")}
          value={stats.courses}
          gradient="bg-linear-to-br from-blue-500 to-indigo-600"
          delay={0.1}
        />
        <StatCard
          icon={Users}
          label={t("teacher.dashboard.activeStudents")}
          value={stats.students}
          gradient="bg-linear-to-br from-emerald-500 to-teal-600"
          delay={0.2}
        />
        <StatCard
          icon={DollarSign}
          label={t("teacher.dashboard.totalRevenue")}
          value="$0.00"
          gradient="bg-linear-to-br from-violet-500 to-purple-600"
          delay={0.3}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Courses Column */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-primary" />
              {t("teacher.dashboard.recentCourses")}
            </h2>
            <Link
              to="/app/teach/courses"
              className="text-sm font-semibold text-brand-primary hover:text-brand-primary-light transition-colors flex items-center gap-1"
            >
              {t("teacher.dashboard.viewAll")}{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-bg-surface-strong"
                />
              ))}
            </div>
          ) : recentCourses.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2 bg-transparent shadow-none">
              <div className="mb-4 rounded-full bg-bg-surface-strong p-4">
                <BookOpen className="h-8 w-8 text-text-muted" />
              </div>
              <p className="font-medium text-lg">
                {t("teacher.dashboard.noActivity")}
              </p>
              <p className="text-sm text-text-secondary mb-6">
                {t("teacher.dashboard.noActivityDesc")}
              </p>
              <Link to="/app/teach/courses/new">
                <Button variant="outline">
                  {t("teacher.dashboard.startCourse")}
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentCourses.map((course, index) => (
                <motion.div
                  key={course.$id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="group relative overflow-hidden p-3 sm:p-4 transition-all hover:border-brand-primary/30 hover:shadow-md hover:bg-bg-surface-soft">
                    <div className="flex items-center gap-3 sm:gap-5">
                      {/* Thumbnail */}
                      <div className="h-16 w-24 sm:h-20 sm:w-32 shrink-0 overflow-hidden rounded-lg bg-bg-surface-strong shadow-sm relative group-hover:shadow-md transition-shadow">
                        {course.coverFileId ? (
                          <img
                            src={FileService.getCourseCoverUrl(
                              course.coverFileId,
                              {
                                width: 200,
                              },
                            )}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            alt=""
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-800 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                      </div>

                      <div className="flex-1 min-w-0 py-1">
                        <div className="mb-1 sm:mb-2 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              course.isPublished
                                ? "bg-green-500/10 text-green-500"
                                : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            <span
                              className={`mr-1 h-1.5 w-1.5 rounded-full ${course.isPublished ? "bg-green-500" : "bg-amber-500"}`}
                            />
                            {course.isPublished
                              ? t("teacher.dashboard.published")
                              : t("teacher.dashboard.draft")}
                          </span>
                          <span className="hidden sm:flex items-center gap-1 text-xs text-text-muted">
                            <Clock className="h-3 w-3" />
                            {new Date(course.$updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-base sm:text-lg truncate text-text-primary group-hover:text-brand-primary transition-colors pr-8 sm:pr-0">
                          <Link
                            to={`/app/teach/courses/${course.$id}`}
                            className="focus:outline-none stretch-link"
                          >
                            {course.title}
                          </Link>
                        </h4>
                        {/* Mobile-only date below title */}
                        <div className="sm:hidden mt-0.5 text-[10px] text-text-muted">
                          {new Date(course.$updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Desktop Actions (Hover) */}
                      <div className="hidden sm:flex items-center gap-2 opacity-0 transform translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 relative z-10">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-9 w-9 p-0 rounded-full"
                          title={t("common.edit")}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/app/teach/courses/${course.$id}`);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 p-0 rounded-full hover:bg-bg-surface-strong"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`/app/courses/${course.$id}`, "_blank");
                          }}
                        >
                          <ArrowRight className="h-4 w-4 -rotate-45" />
                        </Button>
                      </div>

                      {/* Mobile Actions (Always visible, compact) */}
                      <div className="sm:hidden flex flex-col gap-1 relative z-10">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-text-muted hover:text-brand-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/app/teach/courses/${course.$id}`);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-primary" />
            {t("teacher.dashboard.quickActions")}
          </h2>
          <Card className="overflow-hidden p-0 border border-gray-200 dark:border-gray-800 bg-bg-surface shadow-sm">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <Link
                to="/app/teach/courses"
                className="group flex w-full items-center justify-between p-4 transition-colors hover:bg-bg-surface-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-text-primary">
                    {t("teacher.myCourses")}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/app/profile"
                className="group flex w-full items-center justify-between p-4 transition-colors hover:bg-bg-surface-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500 transition-colors group-hover:bg-purple-500 group-hover:text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-text-primary">
                    {t("teacher.dashboard.editProfile")}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
