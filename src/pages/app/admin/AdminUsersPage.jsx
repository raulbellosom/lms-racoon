import React from "react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Avatar } from "../../../shared/ui/Avatar";
import { Badge } from "../../../shared/ui/Badge";
import { APPWRITE } from "../../../shared/appwrite/ids";
import { db, functions } from "../../../shared/appwrite/client";
import { ProfileService } from "../../../shared/data/profiles";
import { useToast } from "../../../app/providers/ToastProvider";
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from "../../../shared/ui/Dropdown";
import { Pagination } from "../../../shared/ui/Pagination";
import { DataHeader } from "../../../shared/ui/DataHeader";
import { TableSkeleton } from "../../../shared/ui/Skeleton";
import { Query } from "appwrite";
import { Modal, ModalFooter } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import {
  MoreVertical,
  Shield,
  User,
  GraduationCap,
  Edit,
  Loader2,
  Copy,
  Ban,
  CheckCircle,
  Lock,
  Unlock,
  Mail,
} from "lucide-react";

export function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const { showToast } = useToast();

  // Pagination & Search
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const limit = 10;

  // Edit Mode State
  const [editingUser, setEditingUser] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({});

  // Create Mode State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createData, setCreateData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [creating, setCreating] = React.useState(false);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadUsers(1, search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Load on page change
  React.useEffect(() => {
    loadUsers(page, search);
  }, [page]);

  const loadUsers = async (pageNum, searchQuery) => {
    setLoading(true);
    try {
      const queries = [
        Query.orderDesc("$createdAt"), // Show newest first
        Query.limit(limit),
        Query.offset((pageNum - 1) * limit),
      ];

      if (searchQuery) {
        // Appwrite supports search on string attributes if configured as index
        // Assuming "name" or "email" is searchable, or use simplified filtering if not indexed
        // For now, let's try searching 'firstName' which is likely indexed or searchable
        // or combined search.
        // NOTE: "search" requires FullText index. If not present, we need it.
        // Assuming "firstName" and "email" have indexes.
        queries.push(Query.search("email", searchQuery)); // Most reliable unique search
        // OR filtering by multiple fields is harder in one query without creating a combined attribute.
      }

      const res = await db.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.profiles,
        queries,
      );
      setUsers(res.documents);
      setTotal(res.total);
    } catch (error) {
      console.error("Failed to list users", error);
      showToast("Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await ProfileService.update(userId, { role: newRole });
      setUsers(
        users.map((u) => (u.$id === userId ? { ...u, role: newRole } : u)),
      );
      showToast(`Rol actualizado a ${newRole}`, "success");
    } catch (error) {
      console.error("Failed to update role", error);
      showToast("Error al actualizar rol", "error");
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.enabled;
    try {
      // Logic for "logical" delete/disable in profiles collection
      await ProfileService.update(user.$id, { enabled: newStatus });
      setUsers(
        users.map((u) =>
          u.$id === user.$id ? { ...u, enabled: newStatus } : u,
        ),
      );
      showToast(
        `Usuario ${newStatus ? "habilitado" : "deshabilitado (borrado lógico)"}`,
        newStatus ? "success" : "warning",
      );
    } catch (error) {
      console.error("Failed to toggle status", error);
      showToast("Error al cambiar estado", "error");
    }
  };

  const handleToggleSuspend = async (user) => {
    const newSuspendStatus = !user.suspended;
    try {
      await ProfileService.update(user.$id, { suspended: newSuspendStatus });
      setUsers(
        users.map((u) =>
          u.$id === user.$id ? { ...u, suspended: newSuspendStatus } : u,
        ),
      );
      showToast(
        `Acceso ${newSuspendStatus ? "suspendido" : "restaurado"}`,
        newSuspendStatus ? "warning" : "success",
      );
    } catch (error) {
      console.error("Failed to toggle suspend", error);
      showToast("Error al cambiar estado de suspensión", "error");
    }
  };

  const [resetCooldowns, setResetCooldowns] = React.useState({});

  const handleSendPasswordReset = async (user) => {
    const now = Date.now();
    const lastSent = resetCooldowns[user.$id] || 0;
    const cooldownMs = 3 * 60 * 1000; // 3 minutes

    if (now - lastSent < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
      showToast(`Espera ${remaining}s para reenviar correo`, "error");
      return;
    }

    if (!user.email) {
      showToast("El usuario no tiene email registrado", "error");
      return;
    }

    try {
      showToast("Enviando correo...", "info");
      await functions.createExecution(
        APPWRITE.functions.authHandler,
        JSON.stringify({ action: "request_recovery", email: user.email }),
      );
      setResetCooldowns((prev) => ({ ...prev, [user.$id]: now }));
      showToast("Correo de recuperación enviado", "success");
    } catch (error) {
      console.error("Failed to send reset email", error);
      showToast("Error al enviar correo", "error");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      bio: user.bio || "",
    });
  };

  const handleSaveUser = async () => {
    if (!formData.firstName || !formData.lastName) {
      showToast("Nombre y Apellidos requeridos", "error");
      return;
    }

    setSaving(true);
    try {
      // Uses the syncUserProfile functionality via backend logic or client wrapper
      // If ProfileService.syncUpdate relies on the Cloud Function, it will update Auth too.
      await ProfileService.syncUpdate(editingUser.$id, formData);

      // Reload or optimistically update
      setUsers(
        users.map((u) =>
          u.$id === editingUser.$id
            ? { ...u, ...formData } // Optimistic merge
            : u,
        ),
      );

      showToast("Usuario actualizado correctamente", "success");
      setEditingUser(null);
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar usuario", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (
      !createData.firstName ||
      !createData.lastName ||
      !createData.email ||
      !createData.password
    ) {
      showToast("Faltan campos obligatorios", "error");
      return;
    }

    if (createData.password.length < 8) {
      showToast("La contraseña debe tener al menos 8 caracteres", "error");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        action: "create_user",
        email: createData.email,
        password: createData.password,
        name: `${createData.firstName} ${createData.lastName}`,
        phone: createData.phone || undefined,
      };

      const execution = await functions.createExecution(
        APPWRITE.functions.authHandler,
        JSON.stringify(payload),
      );

      const response = JSON.parse(execution.responseBody);

      if (!response.success) {
        throw new Error(response.message || "Error al crear usuario");
      }

      showToast("Usuario creado correctamente", "success");
      setIsCreateOpen(false);
      setCreateData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
      });
      // Delay slightly to allow onUserCreated to run?
      setTimeout(() => loadUsers(page, search), 1500);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Error al crear usuario", "error");
    } finally {
      setCreating(false);
    }
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    showToast("ID copiado al portapapeles", "success");
  };

  return (
    <PageLayout
      title="Gestión de Usuarios"
      subtitle="Administra los usuarios y sus roles en la plataforma"
    >
      <DataHeader
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar usuarios por email..."
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <User className="mr-2 h-4 w-4" /> Nuevo Usuario
        </Button>
      </DataHeader>

      <Card className="">
        {/* Header - Hidden on mobile, Grid on desktop */}
        <div className="hidden rounded-t-xl border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] px-6 py-4 font-bold text-[rgb(var(--text-primary))] md:grid md:grid-cols-12 md:gap-4">
          <div className="md:col-span-4 lg:col-span-3">Usuario</div>
          <div className="md:col-span-3 lg:col-span-3">Contacto</div>
          <div className="md:col-span-2 lg:col-span-2">Rol</div>
          <div className="md:col-span-2 lg:col-span-2">Fecha Registro</div>
          <div className="text-right md:col-span-1 lg:col-span-2">Acciones</div>
        </div>

        {/* List */}
        <div className="divide-y divide-[rgb(var(--border-base))]">
          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={10} columns={5} />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-[rgb(var(--text-secondary))]">
              No se encontraron usuarios.
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.$id}
                className={`flex flex-col gap-4 p-4 transition-colors hover:bg-[rgb(var(--bg-surface-hover))] last:rounded-b-xl md:grid md:grid-cols-12 md:items-center md:gap-4 md:px-6 ${
                  !user.enabled
                    ? "opacity-50 bg-red-900/10 grayscale"
                    : user.suspended
                      ? "bg-amber-500/10"
                      : ""
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3 md:col-span-4 lg:col-span-3">
                  <Avatar
                    name={
                      user.firstName
                        ? `${user.firstName} ${user.lastName || ""}`
                        : "User"
                    }
                    src={ProfileService.getAvatarUrl(user.avatarFileId)}
                    size="md" // Slightly larger on mobile
                    className="md:h-10 md:w-10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-[rgb(var(--text-primary))]">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="truncate text-xs text-[rgb(var(--text-secondary))]">
                      ID: {user.$id}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col justify-center text-sm md:col-span-3 lg:col-span-3">
                  <div className="truncate text-[rgb(var(--text-primary))]">
                    {user.email || (
                      <span className="text-[rgb(var(--text-muted))] italic">
                        No email
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-[rgb(var(--text-secondary))]">
                    {user.phone || (
                      <span className="text-[rgb(var(--text-muted))] italic">
                        No teléfono
                      </span>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-center justify-between md:col-span-2 md:block lg:col-span-2">
                  <span className="text-sm font-semibold text-[rgb(var(--text-secondary))] md:hidden">
                    Rol:
                  </span>
                  <Badge
                    variant={
                      user.role === "admin"
                        ? "default"
                        : user.role === "teacher"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {user.role}
                  </Badge>
                </div>

                {/* Date */}
                <div className="flex items-center justify-between md:col-span-2 md:block lg:col-span-2">
                  <span className="text-sm font-semibold text-[rgb(var(--text-secondary))] md:hidden">
                    Registrado:
                  </span>
                  <div className="text-sm text-[rgb(var(--text-secondary))]">
                    {new Date(user.$createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-2 flex justify-end gap-2 border-t border-[rgb(var(--border-base))] pt-2 md:col-span-1 md:mt-0 md:border-0 md:pt-0 lg:col-span-2">
                  <Dropdown
                    align="end"
                    trigger={
                      <button className="rounded-full p-2 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    }
                  >
                    <div className="px-2 py-1.5 text-xs font-semibold text-[rgb(var(--text-muted))]">
                      Acciones
                    </div>
                    <DropdownItem
                      icon={Edit}
                      onClick={() => handleEditClick(user)}
                    >
                      Editar Detalles
                    </DropdownItem>
                    <DropdownItem icon={Copy} onClick={() => copyId(user.$id)}>
                      Copiar ID
                    </DropdownItem>

                    <DropdownItem
                      icon={Mail}
                      onClick={() => handleSendPasswordReset(user)}
                    >
                      Enviar Reset Password
                    </DropdownItem>

                    <DropdownItem
                      icon={user.suspended ? Unlock : Lock}
                      onClick={() => handleToggleSuspend(user)}
                      danger={!user.suspended}
                    >
                      {user.suspended
                        ? "Quitar Suspensión"
                        : "Suspender Acceso"}
                    </DropdownItem>

                    <DropdownDivider />

                    <DropdownItem
                      icon={user.enabled ? Ban : CheckCircle}
                      onClick={() => handleToggleStatus(user)}
                      danger={user.enabled}
                    >
                      {user.enabled ? "Deshabilitar (Borrar)" : "Habilitar"}
                    </DropdownItem>

                    <DropdownDivider />
                    <div className="px-2 py-1.5 text-xs font-semibold text-[rgb(var(--text-muted))]">
                      Cambiar Rol
                    </div>
                    <DropdownItem
                      icon={User}
                      onClick={() => handleRoleChange(user.$id, "student")}
                      disabled={user.role === "student"}
                    >
                      Estudiante
                    </DropdownItem>
                    <DropdownItem
                      icon={GraduationCap}
                      onClick={() => handleRoleChange(user.$id, "teacher")}
                      disabled={user.role === "teacher"}
                    >
                      Profesor
                    </DropdownItem>
                    <DropdownItem
                      icon={Shield}
                      onClick={() => handleRoleChange(user.$id, "admin")}
                      danger
                      disabled={user.role === "admin"}
                    >
                      Administrador
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(total / limit)}
          onPageChange={setPage}
          totalItems={total}
          itemsPerPage={limit}
          disabled={loading}
        />
      </Card>

      {/* Edit User Modal */}
      <Modal
        open={!!editingUser}
        onClose={() => !saving && setEditingUser(null)}
        title="Editar Usuario"
        description="Actualiza la información personal del usuario."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                Nombre
              </label>
              <Input
                value={formData.firstName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                disabled={saving}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                Apellidos
              </label>
              <Input
                value={formData.lastName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              Email (Login)
            </label>
            <Input
              type="email"
              placeholder="nuevo@email.com (Dejar vacío para no cambiar)"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={saving}
            />
            <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
              Si cambias el email, el usuario deberá usar el nuevo para iniciar
              sesión.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              Teléfono
            </label>
            <Input
              placeholder="+52 123 456 7890"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={saving}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              Biografía
            </label>
            <textarea
              className="w-full rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-[rgb(var(--brand-primary))]"
              rows={3}
              value={formData.bio || ""}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              disabled={saving}
            />
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setEditingUser(null)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSaveUser} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </ModalFooter>
      </Modal>

      {/* Create User Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => !creating && setIsCreateOpen(false)}
        title="Nuevo Usuario"
        description="Registra un nuevo usuario en la plataforma."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                Nombre *
              </label>
              <Input
                value={createData.firstName}
                onChange={(e) =>
                  setCreateData({ ...createData, firstName: e.target.value })
                }
                disabled={creating}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                Apellidos *
              </label>
              <Input
                value={createData.lastName}
                onChange={(e) =>
                  setCreateData({ ...createData, lastName: e.target.value })
                }
                disabled={creating}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              Email *
            </label>
            <Input
              type="email"
              value={createData.email}
              onChange={(e) =>
                setCreateData({ ...createData, email: e.target.value })
              }
              disabled={creating}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              Contraseña *
            </label>
            <Input
              type="password"
              value={createData.password}
              onChange={(e) =>
                setCreateData({ ...createData, password: e.target.value })
              }
              disabled={creating}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              Teléfono
            </label>
            <Input
              placeholder="+52 123 456 7890"
              value={createData.phone}
              onChange={(e) =>
                setCreateData({ ...createData, phone: e.target.value })
              }
              disabled={creating}
            />
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setIsCreateOpen(false)}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreateUser} disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Usuario
          </Button>
        </ModalFooter>
      </Modal>
    </PageLayout>
  );
}
