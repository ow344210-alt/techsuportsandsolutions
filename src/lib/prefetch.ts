// Kicks off every public homepage data query in parallel the moment the app
// boots, instead of waiting for each section component to mount. Because the
// lib fetchers share a promise cache, the components' own calls reuse these
// requests instead of firing duplicates — so the first paint needs only the
// fastest single batch of round trips and navigations reuse warm results.
import { fetchActiveSlides } from "./heroSlides";
import { fetchActiveServices } from "./services";
import { fetchActiveIndustries } from "./industries";
import { fetchActiveTech } from "./techStack";
import { fetchActiveSteps } from "./processSteps";
import { fetchActiveTestimonials } from "./testimonials";
import { fetchActiveFooterLinks } from "./footerLinks";

let prefetched = false;

export function prefetchPublicData(): void {
  if (prefetched) return;
  prefetched = true;

  void Promise.allSettled([
    fetchActiveSlides(),
    fetchActiveServices(),
    fetchActiveIndustries(),
    fetchActiveTech(),
    fetchActiveSteps(),
    fetchActiveTestimonials(),
    fetchActiveFooterLinks(),
  ]);
}
