import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Star,
  BarChart,
  Eye,
} from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { StatsService } from "../../../shared/data/stats";
import { FileService } from "../../../shared/data/files";
import { Card } from "../../../shared/ui/Card";
import { CourseCard } from "../../../components/courses/CourseCard";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { CourseGridSkeleton } from "../../../shared/ui/Skeleton";

export function TeacherCoursesPage() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [courses, setCourses] = React.useState([]);
  const [stats, setStats] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (auth.user?.$id) {
      loadCourses();
    }
  }, [auth.user?.$id]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await TeacherCoursesService.listByTeacher(auth.user.$id);
      setCourses(data);

      // Fetch stats
      const courseIds = data.map((c) => c.$id);
      const statsData = await StatsService.getStatsForCourses(courseIds);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load courses", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[rgb(var(--text-primary))]">
            {t("teacher.myCourses")}
          </h1>
          <p className="mt-1 text-[rgb(var(--text-secondary))]">
            {t("teacher.myCoursesDescription")}
          </p>
        </div>
        <Link to="/app/teach/courses/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> {t("teacher.newCourse")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      {courses.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <Input
              placeholder={t("common.searchPlaceholder")}
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <CourseGridSkeleton count={6} />
      ) : filteredCourses.length === 0 ? (
        <Card className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 rounded-full bg-[rgb(var(--bg-muted))] p-6">
            <BookOpen className="h-10 w-10 text-[rgb(var(--text-muted))]" />
          </div>
          <h3 className="text-xl font-bold">{t("teacher.noCoursesYet")}</h3>
          <p className="mt-2 max-w-sm text-[rgb(var(--text-secondary))]">
            {t("teacher.noCoursesDescription")}
          </p>
          <Link to="/app/teach/courses/new" className="mt-6">
            <Button>{t("teacher.createFirstCourse")}</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const coverUrl = course.coverFileId
              ? FileService.getCourseCoverUrl(course.coverFileId)
              : null;
            const courseStats = stats[course.$id] || {};

            return (
              <div key={course.$id} className="relative group">
                <CourseCard course={course} />
                <div className="absolute top-3 left-3 z-20 flex gap-2">
                  <Link to={`/app/teach/courses/${course.$id}`}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shadow-lg backdrop-blur-md bg-white/90 hover:bg-white text-black"
                    >
                      {t("common.edit")}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
