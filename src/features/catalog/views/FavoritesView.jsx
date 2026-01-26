import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { FavoritesService } from "../../../shared/data/favorites";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { Button } from "../../../shared/ui/Button";
import { Heart, Loader } from "lucide-react";
import { CourseCard } from "../../../components/courses/CourseCard";

export function FavoritesView() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (auth.user) {
      loadFavorites();
    }
  }, [auth.user]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // 1. Get List of Course IDs
      const courseIds = await FavoritesService.listByUser(auth.user.$id);

      if (courseIds.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Course Details (Ideally backend would support "getByIds" or filter, but for now loop/parallel)
      // Note: Appwrite listDocuments supports Query.equal('attr', [array])? Yes, usually.
      // But TeacherCoursesService might not expose it easily. Let's try list with query if possible or fetch individually.
      // Fetching individually for stability now.

      const coursesData = await Promise.all(
        courseIds.map(async (id) => {
          try {
            return await TeacherCoursesService.getById(id);
            // Note: TeacherCoursesService.getById might return course even if not published?
            // We should filter published ones theoretically, unless student enrolled.
          } catch (e) {
            return null;
          }
        }),
      );

      setCourses(coursesData.filter((c) => c !== null));
    } catch (error) {
      console.error("Failed to load favorites", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-[rgb(var(--brand-primary))]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500 fill-current" />
          {t("courses.myFavorites") || "Mis Favoritos"}
        </h1>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]">
          <Heart className="h-12 w-12 mx-auto mb-4 text-[rgb(var(--text-muted))]" />
          <h3 className="text-lg font-semibold mb-2">
            {t("courses.noFavorites") || "No tienes favoritos aún"}
          </h3>
          <p className="text-[rgb(var(--text-secondary))] mb-6">
            {t("courses.browseToFavorite") ||
              "Explora el catálogo y guarda los cursos que te interesen."}
          </p>
          <Button onClick={() => navigate("/app/explore")}>
            {t("courses.exploreCourses")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.$id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
