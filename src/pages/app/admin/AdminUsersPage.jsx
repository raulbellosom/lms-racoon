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
import { MoreVertical, Shield, User, GraduationCap } from "lucide-react";

export function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const { showToast } = useToast();

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
                          Cambiar Rol
                        </div>
                        <DropdownDivider />
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
    </PageLayout>
  );
}
