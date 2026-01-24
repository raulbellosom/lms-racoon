import {
  HeroSection,
  FeaturesGrid,
  FeaturedCourses,
  CTASection,
  PublicNavbar,
} from "../components/Landing";

/**
 * Landing page view - Premium homepage
 */
export function LandingView() {
  return (
    <div className="min-h-dvh pt-16">
      <PublicNavbar />
      <HeroSection />
      <FeaturesGrid />
      <FeaturedCourses />
      <CTASection />
    </div>
  );
}
