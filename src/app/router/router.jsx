import { createBrowserRouter, redirect } from "react-router-dom";
import { RootLayout } from "../ui/layouts/RootLayout";
import { PublicLayout } from "../ui/layouts/PublicLayout";
import { AppLayout } from "../ui/layouts/AppLayout";

import { LandingView } from "../../features/public";
import { CatalogPage } from "../../pages/public/CatalogPage";
import { CoursePublicPage } from "../../pages/public/CoursePublicPage";
import { LoginView, RegisterView } from "../../features/auth";

import { StudentHomePage } from "../../pages/app/student/StudentHomePage";
import { MyCoursesPage } from "../../pages/app/student/MyCoursesPage";
import { LearnPage } from "../../pages/app/student/LearnPage";
import { ProgressPage } from "../../pages/app/student/ProgressPage";

import { TeachHomePage } from "../../pages/app/teacher/TeachHomePage";
import { TeacherCoursesPage } from "../../pages/app/teacher/TeacherCoursesPage";
import { TeacherCourseEditorPage } from "../../pages/app/teacher/TeacherCourseEditorPage";

import { requireAuthLoader, requireRoleLoader } from "./routeGuards";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <LandingView /> },
          { path: "/catalog", element: <CatalogPage /> },
          { path: "/courses/:courseId", element: <CoursePublicPage /> },
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
          { path: "home", element: <StudentHomePage /> },
          { path: "my-courses", element: <MyCoursesPage /> },
          { path: "progress", element: <ProgressPage /> },
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
