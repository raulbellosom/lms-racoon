import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, KeyRound, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { functions } from "../../shared/appwrite/client";
import { APPWRITE } from "../../shared/appwrite/ids";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { LanguageSelector } from "../../shared/ui/LanguageSelector";
import { useToast } from "../../app/providers/ToastProvider";
import { LoadingSpinner } from "../../shared/ui/LoadingScreen";
import { authStore } from "../../app/stores/authStore";
import { PasswordInput } from "../../features/auth/components/PasswordInput";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");
  const { showToast } = useToast();

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Check if user is logged in
  const isLoggedIn = authStore.getState().session;

  React.useEffect(() => {
    if (!userId || !token) {
      showToast(t("auth.resetPassword.invalidLinkMessage"), "error");
    }
  }, [userId, token, showToast, t]);

  const isValid = () => {
    if (!password || password.length < 8) return false;
    if (password !== confirmPassword) return false;
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !token || !isValid()) return;

    setIsLoading(true);
    try {
      const execution = await functions.createExecution(
        APPWRITE.functions.authHandler,
        JSON.stringify({
          action: "update_password",
          userId,
          token,
          newPassword: password,
        }),
        false,
      );

      const response = JSON.parse(execution.responseBody);
      if (response.success) {
        setIsSuccess(true);
        showToast(t("auth.resetPassword.success"), "success");

        // Redirect based on login status
        setTimeout(() => {
          if (isLoggedIn) {
            navigate("/app/home");
          } else {
            navigate("/auth/login");
          }
        }, 3000);
      } else {
        showToast(response.message || t("auth.errors.registerFailed"), "error");
      }
    } catch (error) {
      console.error(error);
      showToast(t("auth.errors.loginFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-main))] p-4">
        {/* Language selector */}
        <div className="fixed right-4 top-4">
          <LanguageSelector side="bottom" align="end" />
        </div>

        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-xl font-bold text-red-500">
            {t("auth.resetPassword.invalidLink")}
          </h2>
          <p className="mt-2 text-[rgb(var(--text-secondary))]">
            {t("auth.resetPassword.invalidLinkMessage")}
          </p>
          <div className="mt-6">
            <Link to="/forgot-password">
              <Button>{t("auth.resetPassword.requestNewLink")}</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-main))] p-4">
      {/* Language selector */}
      <div className="fixed right-4 top-4">
        <LanguageSelector side="bottom" align="end" />
      </div>

      <Card className="w-full max-w-md p-8">
        {isSuccess ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
              {t("auth.resetPassword.success")}
            </h2>
            <p className="mb-6 text-[rgb(var(--text-secondary))]">
              {t("auth.resetPassword.successMessage")}
              <br />
              <span className="text-sm italic">
                {t("auth.resetPassword.redirecting")}
              </span>
            </p>
            {isLoggedIn ? (
              <Link to="/app/home">
                <Button className="w-full">
                  {t("auth.resetPassword.goToDashboard")}
                </Button>
              </Link>
            ) : (
              <Link to="/auth/login">
                <Button className="w-full">
                  {t("auth.resetPassword.goToLogin")}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--bg-muted))] text-[rgb(var(--brand-primary))]">
                <KeyRound className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                {t("auth.resetPassword.title")}
              </h1>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                {t("auth.resetPassword.subtitle")}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <PasswordInput
                label={t("auth.resetPassword.newPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showStrength={true}
                error={
                  password && password.length < 8
                    ? t("auth.errors.passwordMin")
                    : undefined
                }
              />

              <PasswordInput
                label={t("auth.resetPassword.confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isConfirm={true}
                confirmValue={password}
              />

              <Button
                className="w-full"
                type="submit"
                disabled={isLoading || !isValid()}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {t("auth.resetPassword.updating")}
                  </>
                ) : (
                  t("auth.resetPassword.submit")
                )}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
