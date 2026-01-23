import {
  HeroSection,
  FeaturesGrid,
  FeaturedCourses,
  CTASection,
} from "../components/Landing";

/**
 * Landing page view - Premium homepage
 */
export function LandingView() {
  return (
    <div className="min-h-dvh">
      <HeroSection />
      <FeaturesGrid />
      <FeaturedCourses />
      <CTASection />
    </div>
  );
}
