export const DEFAULT_BANNERS = [
  {
    id: "pattern-1",
    name: "Geometric Shapes",
    svg: `<svg width="100%" height="100%" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
<defs>
<pattern id="pattern1" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
<path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.1"/>
</pattern>
</defs>
<rect width="100%" height="100%" fill="url(#pattern1)"/>
</svg>`,
  },
  {
    id: "pattern-2",
    name: "Waves",
    svg: `<svg width="100%" height="100%" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
<path d="M0 100 Q 200 50 400 100 T 800 100 V 400 H 0 Z" fill="#ffffff" opacity="0.05"/>
<path d="M0 150 Q 200 100 400 150 T 800 150 V 400 H 0 Z" fill="#ffffff" opacity="0.05"/>
</svg>`,
  },
  {
    id: "pattern-3",
    name: "Dots",
    svg: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
<defs>
<pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
<circle cx="2" cy="2" r="1" fill="#ffffff" opacity="0.2" />
</pattern>
</defs>
<rect width="100%" height="100%" fill="url(#dotPattern)"/>
</svg>`,
  },
].map((b) => ({
  ...b,
  // Create a data URI for the SVG to be used in img tags
  url: `data:image/svg+xml;base64,${btoa(b.svg)}`,
}));

export const getRandomBanner = () => {
  return DEFAULT_BANNERS[Math.floor(Math.random() * DEFAULT_BANNERS.length)];
};

export const getBannerById = (id) => {
  return DEFAULT_BANNERS.find((b) => b.id === id);
};
