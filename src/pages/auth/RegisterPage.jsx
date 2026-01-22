import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Mail, User2 } from "lucide-react";
import { Card } from "../../shared/ui/Card";
import { Input } from "../../shared/ui/Input";
import { Button } from "../../shared/ui/Button";
import { register } from "../../shared/services/auth";
import { authStore } from "../../app/stores/authStore";
import { useToast } from "../../app/providers/ToastProvider";

export function RegisterPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { user, profile } = await register({ email, password, name });
      authStore.setState({ session: { ok: true }, user, profile });
      toast.push({ title: "Cuenta creada", message: "¡Bienvenido!", variant: "success" });
      nav("/app/home");
    } catch (err) {
      toast.push({ title: "Error", message: err?.message || "No se pudo registrar.", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card className="p-5">
        <div className="text-xl font-black tracking-tight">Crear cuenta</div>
        <div className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
          En 30 segundos estás dentro.
        </div>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
              Nombre
            </div>
            <div className="relative">
              <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--text-muted))]" />
              <Input className="pl-9" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
              Email
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--text-muted))]" />
              <Input className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
              Contraseña
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--text-muted))]" />
              <Input className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} />
            </div>
            <div className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              Mínimo 8 caracteres.
            </div>
          </label>

          <Button className="w-full" disabled={busy}>
            {busy ? "Creando..." : "Crear cuenta"}
          </Button>

          <div className="text-center text-sm text-[rgb(var(--text-secondary))]">
            ¿Ya tienes cuenta?{" "}
            <Link to="/auth/login" className="font-semibold text-[rgb(var(--brand-primary))]">
              Inicia sesión
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
