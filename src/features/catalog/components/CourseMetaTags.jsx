import React from "react";
import { FileService } from "../../../shared/data/files";

export function CourseMetaTags({ course }) {
  React.useEffect(() => {
    if (!course) return;

    const coverUrl = course.coverFileId
      ? FileService.getCourseCoverUrl(course.coverFileId)
      : null;

    const pageUrl = window.location.href;
    const siteTitle = "Racoon LMS";
    const pageTitle = `${course.title} | ${siteTitle}`;
    const description =
      course.subtitle ||
      course.description?.substring(0, 160) ||
      "Aprende con Racoon LMS";

    // Set document title
    const previousTitle = document.title;
    document.title = pageTitle;

    // Create or update meta tags
    const metaTags = [
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: pageUrl },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: description },
      { property: "og:site_name", content: siteTitle },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:url", content: pageUrl },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: description },
    ];

    if (coverUrl) {
      metaTags.push(
        { property: "og:image", content: coverUrl },
        { name: "twitter:image", content: coverUrl },
      );
    }

    const createdElements = [];

    metaTags.forEach(({ name, property, content }) => {
      const selector = name
        ? `meta[name="${name}"]`
        : `meta[property="${property}"]`;
      let element = document.querySelector(selector);

      if (!element) {
        element = document.createElement("meta");
        if (name) element.setAttribute("name", name);
        if (property) element.setAttribute("property", property);
        document.head.appendChild(element);
        createdElements.push(element);
      }

      element.setAttribute("content", content);
    });

    // Cleanup function
    return () => {
      document.title = previousTitle;
      createdElements.forEach((el) => el.remove());
    };
  }, [course]);

  return null;
}
