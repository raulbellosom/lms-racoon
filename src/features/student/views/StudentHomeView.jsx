import React from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { listMyEnrollments } from "../../../shared/data/enrollments";
import { WelcomeBanner, RecommendedCourses } from "../components/Home";
import { PageLayout } from "../../../shared/ui/PageLayout";

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
    <PageLayout
    /* The WelcomeBanner often has its own title, so we might not need a PageLayout title here.
       However, for consistency, we could add one or let the banner do it.
       The user request asked for a responsive layout with title/subtitle/actions.
       The Home view usually just has the banner. Let's wrap it for the footer + padding validation.
    */
    >
      <WelcomeBanner
        enrolledCount={enrolledCount}
        streakDays={3}
        todayMinutes={22}
      />
      <RecommendedCourses />
    </PageLayout>
  );
}
