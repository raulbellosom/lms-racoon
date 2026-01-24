import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthProvider";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Avatar } from "../../../shared/ui/Avatar";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Edit, Save, X, Camera, Mail, Shield, KeyRound } from "lucide-react";
import { ProfileService } from "../../../shared/data/profiles";
import { useToast } from "../../../app/providers/ToastProvider";
import { functions } from "../../../shared/appwrite/client";
import { APPWRITE } from "../../../shared/appwrite/ids";

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
      showToast(t("profile.errors.nameRequired"), "error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast(t("profile.errors.invalidEmail"), "error");
      return false;
    }

    // Basic length check for phone, function handles formatting
    if (formData.phone && formData.phone.length < 10) {
      showToast(t("profile.errors.phoneTooShort"), "error");
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
      showToast(t("profile.success.updated"), "success");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      showToast(error.message || t("profile.errors.updateFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Validate file size/type
    if (file.size > 5 * 1024 * 1024) {
      showToast(t("profile.errors.imageTooLarge"), "error");
      return;
    }

    setLoading(true);
    try {
      const fileDoc = await ProfileService.uploadAvatar(file);
      await ProfileService.update(profile.$id, { avatarFileId: fileDoc.$id });
      await refreshProfile();
      showToast(t("profile.success.photoUpdated"), "success");
    } catch (error) {
      console.error(error);
      showToast(t("profile.errors.uploadFailed"), "error");
    } finally {
      setLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [resetCooldown, setResetCooldown] = React.useState(0);
  const [sendingReset, setSendingReset] = React.useState(false);

  const handleSendReset = async () => {
    const now = Date.now();
    const cooldownMs = 3 * 60 * 1000; // 3 minutes

    if (now - resetCooldown < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - resetCooldown)) / 1000);
      showToast(t("profile.resetCooldown", { seconds: remaining }), "error");
      return;
    }

    if (!user?.email) {
      showToast(t("profile.noEmail"), "error");
      return;
    }

    setSendingReset(true);
    try {
      showToast(t("profile.sendingEmail"), "info");
      await functions.createExecution(
        APPWRITE.functions.authHandler,
        JSON.stringify({ action: "request_recovery", email: user.email }),
      );
      setResetCooldown(now);
      showToast(t("profile.emailSent"), "success");
    } catch (error) {
      console.error(error);
      showToast(t("profile.errors.resetFailed"), "error");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <PageLayout title={t("profile.title")} subtitle={t("profile.subtitle")}>
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Profile Card */}
        <Card className="p-6 xl:col-span-1">
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
                title={t("profile.changePhoto")}
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
              {t(`roles.${profile?.role || "student"}`)}
            </div>
          </div>
        </Card>

        {/* Details Card */}
        <Card className="p-6 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">
              {t("profile.personalInfo")}
            </h3>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  <X className="mr-2 h-4 w-4" /> {t("common.cancel")}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" /> {t("common.save")}
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="mr-2 h-4 w-4" /> {t("common.edit")}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Grid Change: 1 col for default/tablet, 2 cols for very large screens */}
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  {t("profile.firstName")}
                </label>
                {isEditing ? (
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder={t("profile.firstName")}
                  />
                ) : (
                  <div className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {profile?.firstName || "-"}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  {t("profile.lastName")}
                </label>
                {isEditing ? (
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder={t("profile.lastName")}
                  />
                ) : (
                  <div className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {profile?.lastName || "-"}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  {t("profile.email")}
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
                  <div className="mt-1 flex min-h-10 items-center text-sm font-medium text-[rgb(var(--text-secondary))] opacity-60">
                    {user?.email || "-"}
                    {profile?.role === "admin" && (
                      <span className="ml-2 shrink-0 text-[10px] text-amber-500">
                        (Admin)
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  {t("profile.phone")}
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
                {t("profile.bio")}
              </label>
              {isEditing ? (
                <textarea
                  className="mt-1 w-full rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-[rgb(var(--brand-primary))]"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder={t("profile.bioPlaceholder")}
                  rows={4}
                />
              ) : (
                <div className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  {profile?.bio || t("profile.noBio")}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Security Card - Full width on xl */}
        <Card className="p-6 xl:col-span-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500/20 to-orange-500/20 text-amber-500">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">
                {t("profile.security")}
              </h3>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                {t("profile.securityDesc")}
              </p>

              {/* Reset Password Section */}
              <div className="mt-6 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))]">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[rgb(var(--text-primary))]">
                        {t("profile.resetPassword")}
                      </h4>
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        {t("profile.resetPasswordDesc")}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendReset}
                    disabled={sendingReset || loading}
                    className="w-full sm:w-auto"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {t("profile.sendResetEmail")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
