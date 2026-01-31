// Shared UI Components Index
// Re-export all atomic UI components for easy imports

export { Button } from "./Button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";
export { Input } from "./Input";
export { Textarea } from "./Textarea";
export { Badge } from "./Badge";
export { ProgressBar } from "./ProgressBar";
export { Tabs, Tab } from "./Tabs";

// New premium components
export { Modal, ModalFooter } from "./Modal";
export {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  CourseGridSkeleton,
} from "./Skeleton";
export { Avatar, AvatarGroup } from "./Avatar";
export { Drawer, DrawerSection } from "./Drawer";
export {
  Dropdown,
  DropdownItem,
  DropdownDivider,
  DropdownLabel,
  Select,
} from "./Dropdown";
export { LoadingScreen, LoadingSpinner } from "./LoadingScreen";
export {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  ScaleIn,
  HoverScale,
} from "./PageTransition";

// Error Pages
export {
  ErrorPage,
  RouteErrorBoundary,
  NotFoundPage,
  ForbiddenPage,
  UnauthorizedPage,
} from "./ErrorPage";

// Form Components
export { Combobox } from "./Combobox";

// Utility
export { cn } from "./cn";

// Language
export { LanguageSelector } from "./LanguageSelector";

// Media viewers
export { ImageViewerModal } from "./ImageViewerModal";
export { VideoPlayer } from "./VideoPlayer";
