// Central reference for the site's design system. Not consumed directly by
// components (Tailwind classes are still used inline for performance), but
// documents the values every component should follow for consistency.
//
// SPACING SCALE (vertical rhythm between sections):
//   Section padding:      py-20 md:py-28   (use <Section /> wrapper)
//   Tight section padding: py-14 md:py-16   (use <Section spacing="tight" />)
//   Card padding:          p-6 to p-8
//   Card gap in grids:     gap-6 to gap-8
//   Heading margin-bottom: mb-16 to mb-20 (before section content)
//
// CONTAINER WIDTH:
//   max-w-7xl for full-width sections
//   max-w-4xl for text-focused sections (FAQ, blog-style content)
//   max-w-6xl for contact/forms
//
// TYPOGRAPHY HIERARCHY:
//   Eyebrow/badge:  text-sm tracking-[3px] uppercase
//   H1 (hero only): text-5xl sm:text-6xl lg:text-7xl font-extrabold
//   H2 (section):   text-4xl md:text-5xl font-bold
//   H3 (card):      text-xl md:text-2xl font-bold
//   Body:           text-base md:text-lg leading-7 md:leading-8 text-gray-400
//
// BUTTONS: use <Button /> from src/components/ui/Button.tsx — never write
// one-off button classNames in a page component.

export const SPACING = {
  section: "py-20 md:py-28",
  sectionTight: "py-14 md:py-16",
  headingBottom: "mb-16 md:mb-20",
} as const;

export const CONTAINERS = {
  wide: "max-w-7xl",
  text: "max-w-4xl",
  form: "max-w-6xl",
} as const;