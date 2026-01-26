import { createBrowserRouter, redirect } from "react-router-dom";
import { LoadingScreen } from "../../shared/ui/LoadingScreen";
import { RootLayout } from "../ui/layouts/RootLayout";
import { RouteErrorBoundary } from "../../shared/ui/ErrorPage";
import { PublicLayout } from "../ui/layouts/PublicLayout";
import { AppLayout } from "../ui/layouts/AppLayout";

import { LandingView } from "../../features/public";
import {
  CatalogView,
  CourseDetailView,
  FavoritesView,
} from "../../features/catalog";
import { LoginView, RegisterView } from "../../features/auth";
import {
  StudentHomeView,
  MyCoursesView,
  ProgressView,
  ExploreCoursesView,
} from "../../features/student";
import { LearnPage } from "../../pages/app/student/LearnPage";
import { ProfileView, SettingsView } from "../../features/profile";
import { TeachHomePage } from "../../pages/app/teacher/TeachHomePage";
import { TeacherCoursesPage } from "../../pages/app/teacher/TeacherCoursesPage";
import { TeacherCourseEditorPage } from "../../pages/app/teacher/TeacherCourseEditorPage";
import { AdminUsersPage } from "../../pages/app/admin/AdminUsersPage";
import { AdminCategoriesPage } from "../../pages/app/admin/AdminCategoriesPage";

import {
  requireAuthLoader,
  requireRoleLoader,
  requireGuestLoader,
} from "./routeGuards";

import { ForgotPasswordPage } from "../../pages/public/ForgotPasswordPage";
import { ResetPasswordPage } from "../../pages/public/ResetPasswordPage";
import { CartPage } from "../../pages/public/CartPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <LoadingScreen />,
    children: [
      // Password reset routes - accessible to BOTH logged-in and guest users
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },

      {
        element: <PublicLayout />,
        loader: requireGuestLoader,
        children: [
          { index: true, element: <LandingView /> },
          { path: "/catalog", element: <CatalogView /> },
          { path: "/catalog/:id", element: <CourseDetailView /> },
          // Legacy route redirect or keep
          { path: "/courses/:id", element: <CourseDetailView /> },
          {
            path: "/auth/login",
            element: <LoginView />,
          },
          {
            path: "/auth/register",
            element: <RegisterView />,
          },
          { path: "/cart", element: <CartPage /> },
        ],
      },
      {
        path: "/app",
        element: <AppLayout />,
        loader: requireAuthLoader,
        children: [
          { index: true, loader: () => redirect("/app/home") },
          { path: "home", element: <StudentHomeView /> },
          { path: "explore", element: <ExploreCoursesView /> },
          { path: "courses/:id", element: <CourseDetailView /> },
          { path: "my-courses", element: <MyCoursesView /> },
          { path: "progress", element: <ProgressView /> },
          { path: "cart", element: <CartPage /> },
          { path: "learn/:courseId/:lessonId?", element: <LearnPage /> },
          { path: "profile", element: <ProfileView /> },
          { path: "settings", element: <SettingsView /> },
          { path: "favorites", element: <FavoritesView /> },

          {
            path: "teach",
            loader: requireRoleLoader(["teacher", "admin"]),
            children: [
              { index: true, element: <TeachHomePage /> },
              { path: "courses", element: <TeacherCoursesPage /> },
              {
                path: "courses/:courseId",
                element: <TeacherCourseEditorPage />,
              },
            ],
          },
          {
            path: "admin",
            loader: requireRoleLoader(["admin"]),
            children: [
              { path: "users", element: <AdminUsersPage /> },
              { path: "categories", element: <AdminCategoriesPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
