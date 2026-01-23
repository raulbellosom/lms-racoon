import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthProvider";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Avatar } from "../../../shared/ui/Avatar";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Edit } from "lucide-react";

export function ProfileView() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const user = auth.user;
  const profile = auth.profile;

  const displayName = profile?.firstName || user?.name || t("student.welcome");

  return (
    <PageLayout
      title={t("nav.profile", "Mi Perfil")}
      subtitle="Gestiona tu información personal"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="p-6 md:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar
              src={profile?.avatarFileId}
              name={displayName}
              size="xl"
              ring
              className="mb-4"
            />
            <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
              {displayName}
            </h2>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              {user?.email}
            </p>
            <div className="mt-4 rounded-full bg-[rgb(var(--bg-muted))] px-3 py-1 text-xs font-medium uppercase tracking-wide">
              {profile?.role || "Student"}
            </div>
          </div>
        </Card>

        {/* Details Card */}
        <Card className="p-6 md:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">
              Información Personal
            </h3>
            <Button variant="secondary" size="sm">
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  Nombre
                </label>
                <div className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                  {profile?.firstName || "-"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  Apellidos
                </label>
                <div className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                  {profile?.lastName || "-"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  Email
                </label>
                <div className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                  {user?.email || "-"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  Teléfono
                </label>
                <div className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                  {profile?.phone || "-"}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                Bio
              </label>
              <div className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                {profile?.bio || "Sin biografía."}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
