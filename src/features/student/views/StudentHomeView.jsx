import React from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { listMyEnrollments } from "../../../shared/data/enrollments";
import { WelcomeBanner, RecommendedCourses } from "../components/Home";

/**
 * Student home view with welcome banner and recommended courses
 */
export function StudentHomeView() {
  const { auth } = useAuth();
  const [enrolledCount, setEnrolledCount] = React.useState(0);

  React.useEffect(() => {
    if (auth.user?.$id) {
      listMyEnrollments({ userId: auth.user.$id })
        .then((docs) => setEnrolledCount(docs.length))
        .catch(() => setEnrolledCount(0));
    }
  }, [auth.user?.$id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <WelcomeBanner
        enrolledCount={enrolledCount}
        streakDays={3}
        todayMinutes={22}
      />
      <RecommendedCourses />
    </div>
  );
}
