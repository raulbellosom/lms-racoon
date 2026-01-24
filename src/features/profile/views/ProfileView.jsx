import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthProvider";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Avatar } from "../../../shared/ui/Avatar";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Edit, Save, X, Camera } from "lucide-react";
import { ProfileService } from "../../../shared/data/profiles";
import { useToast } from "../../../app/providers/ToastProvider";

export function ProfileView() {
  const { t } = useTranslation();
  const { auth, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const user = auth.user;
  const profile = auth.profile;

  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({});
  const fileInputRef = React.useRef(null);

  // Initialize form data when editing starts or profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        email: user?.email || "", // From auth user
      });
    }
  }, [profile, user]);

  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ""}`.trim()
    : user?.name || t("student.welcome");

  const validate = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showToast("Nombre y Apellidos son requeridos", "error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast("Email inválido", "error");
      return false;
    }

    // Basic length check for phone, function handles formatting
    if (formData.phone && formData.phone.length < 10) {
      showToast("El teléfono debe tener al menos 10 dígitos", "error");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Use syncUpdate to handle Auth sync
      await ProfileService.syncUpdate(user.$id, formData);
      await refreshProfile(); // Reload profile in AuthContext
      showToast("Perfil actualizado correctamente", "success");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Error al actualizar el perfil", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Validate file size/type
    if (file.size > 5 * 1024 * 1024) {
      showToast("La imagen debe ser menor a 5MB", "error");
      return;
    }

    setLoading(true);
    try {
      const fileDoc = await ProfileService.uploadAvatar(file);
      // Update profile with new avatar ID (sync not strictly needed for just avatar but good for consistency,
      // though avatar doesn't affect Auth. Using standard update for avatar to be faster/simpler or sync?
      // Let's use standard update for avatar to avoid overhead unless we want to sync something else later.
      // Actually, if we use syncUpdate it updates everything passed.
      // For just avatar, we can use simple update or sync. Let's stick to simple update for avatar as it is independent.)
      await ProfileService.update(profile.$id, { avatarFileId: fileDoc.$id });
      await refreshProfile();
      showToast("Foto de perfil actualizada", "success");
    } catch (error) {
      console.error(error);
      showToast("Error al subir la imagen", "error");
    } finally {
      setLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <PageLayout
      title={t("nav.profile", "Mi Perfil")}
      subtitle="Gestiona tu información personal"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="p-6 md:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative group">
              <Avatar
                src={ProfileService.getAvatarUrl(profile?.avatarFileId)}
                name={displayName}
                size="xl"
                ring
                className="mb-4"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute bottom-4 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--brand-primary))] text-white shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                title="Cambiar foto"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>

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
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" /> Guardar
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  Nombre
                </label>
                {isEditing ? (
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Tu nombre"
                  />
                ) : (
                  <div className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {profile?.firstName || "-"}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  Apellidos
                </label>
                {isEditing ? (
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Tus apellidos"
                  />
                ) : (
                  <div className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {profile?.lastName || "-"}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  Email
                </label>
                {isEditing ? (
                  <Input
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="tucorreo@ejemplo.com"
                  />
                ) : (
                  <div className="mt-1 flex h-10 items-center text-sm font-medium text-[rgb(var(--text-secondary))] opacity-60">
                    {user?.email || "-"}
                    {profile?.role === "admin" && (
                      <span className="ml-2 text-[10px] text-amber-500">
                        (Admin)
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  Teléfono
                </label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+52 123 456 7890"
                  />
                ) : (
                  <div className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {profile?.phone || "-"}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  className="mt-1 w-full rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-[rgb(var(--brand-primary))]"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Cuéntanos un poco sobre ti..."
                  rows={4}
                />
              ) : (
                <div className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  {profile?.bio || "Sin biografía."}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
