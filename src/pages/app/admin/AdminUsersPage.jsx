import React from "react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Avatar } from "../../../shared/ui/Avatar";
import { Badge } from "../../../shared/ui/Badge";
import { APPWRITE } from "../../../shared/appwrite/ids";
import { db } from "../../../shared/appwrite/client";
import { ProfileService } from "../../../shared/data/profiles";
import { useToast } from "../../../app/providers/ToastProvider";
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from "../../../shared/ui/Dropdown";
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
} from "lucide-react";

export function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const { showToast } = useToast();

  // Edit Mode State
  const [editingUser, setEditingUser] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({});

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await db.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.profiles,
      );
      setUsers(res.documents);
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

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: "", // We don't have the email in profile doc usually unless synced.
      // If profiles.email exists, use it. But in previous step ProfileView.jsx we allowed editing it.
      // Ideally we should have email in profile doc if we want to show it here easily.
      // However, the 'users' list from DB might not have email if it's not in the schema or synced yet.
      // If the user hasn't been synced, this might be empty.
      // Let's assume we want to allow setting it.
      // For now, let's leave valid email blank if not present, enforcing user to enter it if they want to change it.
      // Actually, if we want to SHOW the current email, we need to fetch it or rely on it being in the doc.
      // The cloud function syncs it to the doc (if my memory of syncUserProfile is correct, I added it to patch? No, I added phone/bios to patch,
      // let me check the function code again...
      // Wait, in syncUserProfile I added phone to patch, but email?
      // I checked the function code: "const email = safeStr(body.email, 100);" and "Updates ... email ... in Appwrite Auth".
      // But did I add email to the Document Patch?
      // "const patch = { firstName, lastName, phone, bio, ... }" -> I did NOT add email to the profile document in the function.
      // So the profile document does NOT store the email.
      // This means Admin Table won't show email unless I fetch it from Auth API (which I can't do easily from client).
      // So, for now, Admin can only SET a new email, but not see the old one easily unless I add 'email' field to profiles collection.
      // The user requirement said "validar el input de email... y ya los demas valores de profiles pues se actualizan en la tabla de profiles ... asi como lo tenemos en la base de datos".
      // The DB schema in documentation/appwrite_db_racoon_lms.md does NOT have an email field in profiles.
      // So I cannot show the current email here comfortably. I will add a note or just leave it empty.

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
      const updatedData = await ProfileService.syncUpdate(
        editingUser.$id,
        formData,
      );

      // Update local list
      setUsers(
        users.map((u) =>
          u.$id === editingUser.$id
            ? { ...u, ...formData } // Optimistic / simple merge
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

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return Shield;
      case "teacher":
        return GraduationCap;
      default:
        return User;
    }
  };

  return (
    <PageLayout
      title="Gestión de Usuarios"
      subtitle="Administra los usuarios y sus roles en la plataforma"
    >
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))]">
                <th className="px-6 py-4 font-bold text-[rgb(var(--text-primary))]">
                  Usuario
                </th>
                <th className="px-6 py-4 font-bold text-[rgb(var(--text-primary))]">
                  Rol Actual
                </th>
                <th className="px-6 py-4 font-bold text-[rgb(var(--text-primary))]">
                  ID
                </th>
                <th className="px-6 py-4 font-bold text-[rgb(var(--text-primary))]">
                  Fecha Registro
                </th>
                <th className="px-6 py-4 font-bold text-[rgb(var(--text-primary))] text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-[rgb(var(--text-secondary))]"
                  >
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-[rgb(var(--text-secondary))]"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.$id}
                    className="border-b border-[rgb(var(--border-base))] hover:bg-[rgb(var(--bg-surface-hover))]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={
                            user.firstName
                              ? `${user.firstName} ${user.lastName || ""}`
                              : "User"
                          }
                          src={ProfileService.getAvatarUrl(user.avatarFileId)}
                          size="sm"
                        />
                        <div>
                          <div className="font-bold text-[rgb(var(--text-primary))]">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-[rgb(var(--text-secondary))]">
                            {user.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[rgb(var(--text-secondary))]">
                      {user.$id}
                    </td>
                    <td className="px-6 py-4 text-[rgb(var(--text-secondary))]">
                      {new Date(user.$createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Dropdown
                        align="end"
                        trigger={
                          <button className="rounded-full p-2 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]">
                            <MoreVertical className="h-4 w-4" />
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
    </PageLayout>
  );
}
