import React from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../../../shared/ui/PageLayout";

import { useAuth } from "../../../app/providers/AuthProvider";
import { Card } from "../../../shared/ui/Card";
import { listMyEnrollments } from "../../../shared/data/enrollments";

/**
 * Progress view - shows student learning stats
 */
export function ProgressView() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [enrollmentCount, setEnrollmentCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const displayName =
    auth.profile?.firstName || auth.user?.name?.split(" ")[0] || "Estudiante";

  React.useEffect(() => {
    if (!auth.user?.$id) return;

    listMyEnrollments({ userId: auth.user.$id })
      .then((docs) => setEnrollmentCount(docs.length))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [auth.user?.$id]);

  return (
    <PageLayout
      title={t("nav.progress")}
      subtitle={`${displayName}, aquí está tu resumen`}
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
                <BookOpen className="h-6 w-6 text-[rgb(var(--brand-primary))]" />
              </div>
              <div>
                <div className="text-2xl font-extrabold">
                  {loading ? "-" : enrollmentCount}
                </div>
                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  Cursos Inscritos
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="mt-8 text-center text-[rgb(var(--text-muted))]">
        <p>Más estadísticas estarán disponibles pronto.</p>
      </div>
    </PageLayout>
  );
}
