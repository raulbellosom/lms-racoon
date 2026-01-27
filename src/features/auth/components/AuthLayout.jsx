import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import appIcon from "../../../resources/icon.svg";

/**
 * Premium Split-Screen Layout for Auth Pages
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The form content
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle
 * @param {string} props.image - Optional background image for the side panel
 * @param {string} props.sideTitle - Title displayed on the branding side
 * @param {string} props.sideDescription - Description on the branding side
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  sideTitle = "Aprende sin límites",
  sideDescription = "La plataforma educativa definitiva para estudiantes y profesores.",
}) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem-var(--safe-top,0px))] w-full overflow-hidden bg-[rgb(var(--bg-base))]">
      {/* LEFT SIDE - BRANDING (Hidden on mobile) */}
      <div className="relative hidden w-0 flex-col justify-between overflow-hidden bg-[rgb(var(--brand-primary))] text-white lg:flex lg:w-5/12 xl:w-1/2">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-20 -top-20 h-[600px] w-[600px] rounded-full bg-white opacity-10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[800px] w-[800px] translate-x-1/3 translate-y-1/3 rounded-full bg-[rgb(var(--brand-accent))] opacity-40 blur-[100px]" />
          {/* Grid Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-20 contrast-125 brightness-100"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgb(255 255 255 / 0.1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Branding Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          {/* Top Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <img
                src={appIcon}
                alt="Logo"
                className="h-6 w-6 brightness-0 invert"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">Racoon LMS</span>
          </div>

          {/* Middle Hero Text */}
          <div className="max-w-md space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl font-black leading-tight tracking-tight lg:text-5xl"
            >
              {sideTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg font-medium text-white/80 leading-relaxed"
            >
              {sideDescription}
            </motion.p>
          </div>

          {/* Bottom Footer */}
          <div className="flex items-center gap-6 text-sm font-medium text-white/60">
            <span>© {new Date().getFullYear()} Racoon Devs</span>
            <div className="h-1 w-1 rounded-full bg-white/40" />
            <span>v1.0.0</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="relative flex w-full flex-col items-center justify-center p-4 lg:w-7/12 xl:w-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          {/* Header */}
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-[rgb(var(--text-secondary))]">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Container */}
          {children}
        </motion.div>

        {/* Mobile Footer Decor */}
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-[rgb(var(--brand-primary)/0.05)] blur-3xl lg:hidden" />
      </div>
    </div>
  );
}
