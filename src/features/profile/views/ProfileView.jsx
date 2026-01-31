import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthProvider";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Avatar } from "../../../shared/ui/Avatar";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Edit, Save, X, Camera, Mail, Shield, KeyRound } from "lucide-react";
import { ProfileService } from "../../../shared/data/profiles";
import { useToast } from "../../../app/providers/ToastProvider";
import { functions } from "../../../shared/appwrite/client";
import { APPWRITE } from "../../../shared/appwrite/ids";
import { Combobox } from "../../../shared/ui/Combobox";
import {
  Plus,
  Trash2,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Phone,
  Mail as MailIcon,
  MessageCircle,
  Users as UsersIcon,
} from "lucide-react";

const SOCIAL_NETWORKS = [
  {
    id: "website",
    icon: Globe,
    label: "profile.socials.networks.website",
    placeholder: "https://mysite.com",
  },
  {
    id: "facebook",
    icon: Facebook,
    label: "profile.socials.networks.facebook",
    placeholder: "https://facebook.com/username",
  },
  {
    id: "twitter",
    icon: Twitter,
    label: "profile.socials.networks.twitter",
    placeholder: "https://twitter.com/username",
  },
  {
    id: "instagram",
    icon: Instagram,
    label: "profile.socials.networks.instagram",
    placeholder: "https://instagram.com/username",
  },
  {
    id: "linkedin",
    icon: Linkedin,
    label: "profile.socials.networks.linkedin",
    placeholder: "https://linkedin.com/in/username",
  },
  {
    id: "youtube",
    icon: Youtube,
    label: "profile.socials.networks.youtube",
    placeholder: "https://youtube.com/@channel",
  },
  {
    id: "github",
    icon: Github,
    label: "profile.socials.networks.github",
    placeholder: "https://github.com/username",
  },
  {
    id: "tiktok",
    icon: Globe,
    label: "profile.socials.networks.tiktok",
    placeholder: "https://tiktok.com/@username",
  },
  {
    id: "discord",
    icon: Globe,
    label: "profile.socials.networks.discord",
    placeholder: "Discord Username / Invite",
  },
  {
    id: "phone",
    icon: Phone,
    label: "profile.socials.networks.phone",
    placeholder: "+52 123 456 7890",
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    label: "profile.socials.networks.whatsapp",
    placeholder: "https://wa.me/1234567890",
  },
  {
    id: "whatsappGroup",
    icon: UsersIcon,
    label: "profile.socials.networks.whatsappGroup",
    placeholder: "https://chat.whatsapp.com/...",
  },
  {
    id: "email",
    icon: MailIcon,
    label: "profile.socials.networks.email",
    placeholder: "public@email.com",
  },
  {
    id: "other",
    icon: Globe,
    label: "profile.socials.networks.other",
    placeholder: "profile.socials.networks.otherValuePlaceholder",
    isMultiple: true,
  },
];

export function ProfileView() {
  const { t } = useTranslation();
  const { auth, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const user = auth.user;
  const profile = auth.profile;

  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({});
  const [avatarViewerOpen, setAvatarViewerOpen] = React.useState(false);
  const fileInputRef = React.useRef(null);

  // Initialize form data when editing starts or profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        socials: profile.socials ? JSON.parse(profile.socials) : {},
        email: user?.email || "", // From auth user
      });
    }
  }, [profile, user]);

  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ""}`.trim()
    : user?.name || t("student.welcome");

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return (
        profile.firstName.charAt(0) + profile.lastName.charAt(0)
      ).toUpperCase();
    }
    return undefined; // Fallback to name-based generation in Avatar
  };

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
      const payload = { ...formData };
      if (typeof payload.socials === "object") {
        payload.socials = JSON.stringify(payload.socials);
      }
      await ProfileService.syncUpdate(user.$id, payload);
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

  const SecurityCard = (
    <Card className="p-8 bg-linear-to-br from-[rgb(var(--bg-surface))] to-[rgb(var(--bg-muted))]/20">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-8 w-1 bg-violet-500 rounded-full"></div>
        <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">
          {t("profile.security")}
        </h3>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t("profile.resetPasswordDesc")}
        </p>
        <Button
          onClick={handleSendReset}
          disabled={sendingReset || loading}
          variant="secondary"
          className="w-full rounded-2xl h-12 border-2! hover:bg-white hover:border-[rgb(var(--brand-primary))] hover:text-[rgb(var(--brand-primary))] transition-all group"
        >
          <Mail className="mr-2 h-4 w-4 group-hover:scale-125 transition-transform" />
          {t("profile.sendResetEmail")}
        </Button>
      </div>
    </Card>
  );

  return (
    <PageLayout title={t("profile.title")} subtitle={t("profile.subtitle")}>
      <div className="flex flex-col gap-8">
        {/* Unified Profile Header Card */}
        <Card className="overflow-hidden border-none bg-[rgb(var(--bg-surface))] shadow-xl!">
          {/* Decorative Banner */}
          <div className="relative h-32 w-full bg-linear-to-r from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-secondary))] opacity-90 sm:h-48">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          </div>

          {/* Profile Basic Info Area */}
          <div className="relative px-6 pb-8">
            <div className="flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
              {/* Avatar Overlap */}
              <div className="relative -mt-16 group sm:-mt-20">
                <Avatar
                  src={ProfileService.getAvatarUrl(profile?.avatarFileId)}
                  name={displayName}
                  initials={getInitials()}
                  size="xl"
                  shape="square"
                  ring={false}
                  className="size-32 border-2 border-[rgb(var(--bg-surface))] shadow-xl sm:size-40 cursor-pointer transition-transform hover:scale-105"
                  onClick={() => {
                    if (profile?.avatarFileId) {
                      setAvatarViewerOpen(true);
                    }
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--brand-primary))] text-white shadow-md transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                  title={t("profile.changePhoto")}
                >
                  <Camera className="h-5 w-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Name and Role */}
              <div className="mt-4 flex-1 text-center sm:mt-0 sm:pb-2 sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-baseline sm:gap-4">
                  <h2 className="text-2xl font-black tracking-tight text-[rgb(var(--text-primary))] sm:text-3xl">
                    {displayName}
                  </h2>
                  <div className="rounded-full bg-[rgb(var(--brand-primary))]/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--brand-primary))]">
                    {t(`roles.${profile?.role || "student"}`)}
                  </div>
                </div>
                <p className="mt-1 text-base font-medium text-[rgb(var(--text-secondary))]">
                  {profile?.headline || ""}
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm text-[rgb(var(--text-muted))] sm:justify-start">
                  <div className="flex items-center gap-1.5">
                    <MailIcon className="h-4 w-4" />
                    {user?.email}
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-2 sm:mt-0 sm:pb-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                      className="rounded-full px-6"
                    >
                      <X className="mr-2 h-4 w-4" /> {t("common.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={loading}
                      className="rounded-full px-6 shadow-md!"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          {t("common.saving")}
                        </span>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> {t("common.save")}
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full px-8 shadow-md!"
                  >
                    <Edit className="mr-2 h-4 w-4" /> {t("common.edit")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Detailed Info Section */}
          <div className="space-y-8 lg:col-span-2">
            <Card className="p-8">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-8 w-1 bg-[rgb(var(--brand-primary))] rounded-full"></div>
                <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">
                  {t("profile.personalInfo")}
                </h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                    {t("profile.headline")}
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.headline}
                      onChange={(e) =>
                        setFormData({ ...formData, headline: e.target.value })
                      }
                      className="transition-all focus:ring-2!"
                      placeholder={t("profile.headlinePlaceholder")}
                    />
                  ) : (
                    <div className="rounded-xl bg-[rgb(var(--bg-muted))]/50 p-3 text-sm font-medium text-[rgb(var(--text-primary))]">
                      {profile?.headline || "-"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                    {t("profile.firstName")}
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="transition-all focus:ring-2!"
                    />
                  ) : (
                    <div className="rounded-xl bg-[rgb(var(--bg-muted))]/50 p-3 text-sm font-medium text-[rgb(var(--text-primary))]">
                      {profile?.firstName || "-"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                    {t("profile.lastName")}
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="transition-all focus:ring-2!"
                    />
                  ) : (
                    <div className="rounded-xl bg-[rgb(var(--bg-muted))]/50 p-3 text-sm font-medium text-[rgb(var(--text-primary))]">
                      {profile?.lastName || "-"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                    {t("profile.email")}
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="transition-all focus:ring-2!"
                    />
                  ) : (
                    <div className="flex h-10 items-center rounded-xl bg-[rgb(var(--bg-muted))]/20 px-3 text-sm font-medium text-[rgb(var(--text-muted))]">
                      {user?.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                    {t("profile.phone")}
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="transition-all focus:ring-2!"
                      placeholder="+52 123 456 7890"
                    />
                  ) : (
                    <div className="rounded-xl bg-[rgb(var(--bg-muted))]/50 p-3 text-sm font-medium text-[rgb(var(--text-primary))]">
                      {profile?.phone || "-"}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                    {t("profile.bio")}
                  </label>
                  {isEditing ? (
                    <textarea
                      className="min-h-32 w-full rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4 text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-[rgb(var(--brand-primary))]"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder={t("profile.bioPlaceholder")}
                    />
                  ) : (
                    <div className="rounded-xl bg-[rgb(var(--bg-muted))]/50 p-4 text-sm leading-relaxed text-[rgb(var(--text-secondary))] whitespace-pre-wrap">
                      {profile?.bio || t("profile.noBio")}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Desktop Security Section */}
            <div className="hidden lg:block">{SecurityCard}</div>
          </div>

          {/* Socials & Security Side Column */}
          <div className="space-y-8">
            {/* Socials Section */}
            <Card className="p-8">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-8 w-1 bg-amber-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">
                  {t("profile.socials.title")}
                </h3>
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Standard Socials */}
                    {Object.entries(formData.socials || {})
                      .filter(([key]) => key !== "others")
                      .map(([key, value]) => {
                        const network = SOCIAL_NETWORKS.find(
                          (n) => n.id === key,
                        ) || { icon: Globe, label: key };
                        const Icon = network.icon;
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-2 group anim-fade-in"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))] shrink-0">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <Input
                                value={value}
                                onChange={(e) => {
                                  const newSocials = { ...formData.socials };
                                  newSocials[key] = e.target.value;
                                  setFormData({
                                    ...formData,
                                    socials: newSocials,
                                  });
                                }}
                                className="h-10 text-xs"
                                placeholder={t(
                                  network.placeholder || "https://...",
                                )}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newSocials = { ...formData.socials };
                                delete newSocials[key];
                                setFormData({
                                  ...formData,
                                  socials: newSocials,
                                });
                              }}
                              className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}

                    {/* Custom Socials (Others) */}
                    {(formData.socials?.others || []).map((item, index) => (
                      <div
                        key={`other-${index}`}
                        className="p-3 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))]/10 space-y-3 anim-fade-in"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                            <Globe className="h-3 w-3" />
                            {t("profile.socials.networks.other")}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newSocials = { ...formData.socials };
                              newSocials.others = [
                                ...newSocials.others.slice(0, index),
                                ...newSocials.others.slice(index + 1),
                              ];
                              setFormData({ ...formData, socials: newSocials });
                            }}
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          <Input
                            value={item.label}
                            onChange={(e) => {
                              const newSocials = { ...formData.socials };
                              const newOthers = [...newSocials.others];
                              newOthers[index] = {
                                ...newOthers[index],
                                label: e.target.value.substring(0, 20),
                              };
                              newSocials.others = newOthers;
                              setFormData({ ...formData, socials: newSocials });
                            }}
                            className="h-8 text-xs"
                            placeholder={t(
                              "profile.socials.networks.otherLabelPlaceholder",
                            )}
                          />
                          <Input
                            value={item.value}
                            onChange={(e) => {
                              const newSocials = { ...formData.socials };
                              const newOthers = [...newSocials.others];
                              newOthers[index] = {
                                ...newOthers[index],
                                value: e.target.value,
                              };
                              newSocials.others = newOthers;
                              setFormData({ ...formData, socials: newSocials });
                            }}
                            className="h-8 text-xs font-mono"
                            placeholder={t(
                              "profile.socials.networks.otherValuePlaceholder",
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    <Combobox
                      options={SOCIAL_NETWORKS.filter(
                        (n) => n.isMultiple || !formData.socials?.[n.id],
                      ).map((n) => ({
                        value: n.id,
                        label: t(n.label),
                        icon: n.icon,
                      }))}
                      value={null}
                      onChange={(value) => {
                        if (!value) return;
                        const key = value;
                        const newSocials = { ...formData.socials };

                        if (key === "other") {
                          if (!newSocials.others) newSocials.others = [];
                          newSocials.others.push({ label: "", value: "" });
                        } else if (!newSocials[key]) {
                          newSocials[key] = "";
                        }
                        setFormData({ ...formData, socials: newSocials });
                      }}
                      placeholder={t("profile.socials.add")}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {profile?.socials &&
                    Object.keys(JSON.parse(profile.socials)).length > 0 ? (
                      (() => {
                        const parsedSocials = JSON.parse(profile.socials);
                        const items = [];

                        // Add standard socials
                        Object.entries(parsedSocials).forEach(
                          ([key, value]) => {
                            if (key === "others" || !value) return;
                            const network = SOCIAL_NETWORKS.find(
                              (n) => n.id === key,
                            );
                            if (network) {
                              items.push({
                                ...network,
                                value,
                                key,
                              });
                            }
                          },
                        );

                        // Add others
                        if (Array.isArray(parsedSocials.others)) {
                          parsedSocials.others.forEach((other, idx) => {
                            if (!other.value) return;
                            items.push({
                              id: `other-${idx}`,
                              icon: Globe,
                              label: other.label || "Other",
                              value: other.value,
                              isOther: true,
                            });
                          });
                        }

                        return items.map((item) => {
                          const Icon = item.icon;
                          const href =
                            item.key === "email"
                              ? `mailto:${item.value}`
                              : item.key === "phone"
                                ? `tel:${item.value}`
                                : item.value.startsWith("http")
                                  ? item.value
                                  : `https://${item.value}`;

                          return (
                            <a
                              key={item.id}
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-center gap-4 p-3 rounded-2xl bg-[rgb(var(--bg-muted))]/30 hover:bg-[rgb(var(--bg-muted))]/60 transition-all border border-transparent hover:border-[rgb(var(--border-base))]"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs group-hover:scale-110 transition-transform">
                                <Icon className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-black uppercase tracking-widest text-[rgb(var(--text-muted))]">
                                  {item.isOther ? item.label : t(item.label)}
                                </div>
                                <div className="text-sm font-bold truncate text-[rgb(var(--text-primary))]">
                                  {item.value.replace(/^https?:\/\//, "")}
                                </div>
                              </div>
                            </a>
                          );
                        });
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-[rgb(var(--bg-muted))]/20 border border-dashed border-[rgb(var(--border-base))]">
                        <Globe className="h-8 w-8 text-[rgb(var(--text-muted))] mb-2 opacity-20" />
                        <p className="text-xs font-medium text-[rgb(var(--text-muted))] italic">
                          No social links added.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Security Section (Mobile only) */}
            <div className="lg:hidden">{SecurityCard}</div>
          </div>
        </div>
      </div>

      {/* Profile Avatar Viewer Modal */}
      <ImageViewerModal
        isOpen={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
        src={ProfileService.getAvatarUrl(profile?.avatarFileId)}
        alt={displayName}
        showDownload={true}
      />
    </PageLayout>
  );
}
