import { createBrowserRouter, redirect } from "react-router-dom";
import { RootLayout } from "../ui/layouts/RootLayout";
import { RouteErrorBoundary } from "../../shared/ui/ErrorPage";
import { PublicLayout } from "../ui/layouts/PublicLayout";
import { AppLayout } from "../ui/layouts/AppLayout";

import { LandingView } from "../../features/public";
import { CatalogView, CourseDetailView } from "../../features/catalog";
import { LoginView, RegisterView } from "../../features/auth";
import {
  StudentHomeView,
  MyCoursesView,
  ProgressView,
} from "../../features/student";

import { LearnPage } from "../../pages/app/student/LearnPage";

import { TeachHomePage } from "../../pages/app/teacher/TeachHomePage";
import { TeacherCoursesPage } from "../../pages/app/teacher/TeacherCoursesPage";
import { TeacherCourseEditorPage } from "../../pages/app/teacher/TeacherCourseEditorPage";

import { requireAuthLoader, requireRoleLoader } from "./routeGuards";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <LandingView /> },
          { path: "/catalog", element: <CatalogView /> },
          { path: "/catalog/:id", element: <CourseDetailView /> },
          // Legacy route redirect or keep
          { path: "/courses/:courseId", element: <CourseDetailView /> },
          { path: "/auth/login", element: <LoginView /> },
          { path: "/auth/register", element: <RegisterView /> },
        ],
      },
      {
        path: "/app",
        element: <AppLayout />,
        loader: requireAuthLoader,
        children: [
          { index: true, loader: () => redirect("/app/home") },
          { path: "home", element: <StudentHomeView /> },
          { path: "my-courses", element: <MyCoursesView /> },
          { path: "progress", element: <ProgressView /> },
          { path: "learn/:courseId/:lessonId?", element: <LearnPage /> },

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
        ],
      },
    ],
  },
]);
