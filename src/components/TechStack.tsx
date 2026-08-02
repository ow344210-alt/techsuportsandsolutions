import { createElement, useEffect, useState } from "react";
import type { ComponentType } from "react";
import { FaAws, FaLinkedin, FaMicrosoft } from "react-icons/fa";
import {
  SiAndroid,
  SiAngular,
  SiAnsible,
  SiAntdesign,
  SiApachekafka,
  SiApple,
  SiAppwrite,
  SiAsana,
  SiAstro,
  SiAuth0,
  SiBabel,
  SiBitbucket,
  SiBlender,
  SiBootstrap,
  SiBun,
  SiCakephp,
  SiChakraui,
  SiCircleci,
  SiClickup,
  SiCloudflare,
  SiCodeigniter,
  SiComposer,
  SiContentful,
  SiCplusplus,
  SiCss,
  SiCypress,
  SiDart,
  SiDatadog,
  SiDeno,
  SiDjango,
  SiDigitalocean,
  SiDirectus,
  SiDocker,
  SiDotnet,
  SiDrizzle,
  SiDrupal,
  SiElastic,
  SiElasticsearch,
  SiElectron,
  SiElementor,
  SiEslint,
  SiEsbuild,
  SiExpo,
  SiExpress,
  SiFacebook,
  SiFastapi,
  SiFigma,
  SiFirebase,
  SiFlask,
  SiFlutter,
  SiFramer,
  SiGatsby,
  SiGhost,
  SiGit,
  SiGithub,
  SiGithubactions,
  SiGitlab,
  SiGmail,
  SiGo,
  SiGoogle,
  SiGoogleads,
  SiGoogleanalytics,
  SiGooglecloud,
  SiGooglemeet,
  SiGrafana,
  SiGraphql,
  SiHasura,
  SiHtml5,
  SiHubspot,
  SiHuggingface,
  SiInstagram,
  SiIos,
  SiJavascript,
  SiJenkins,
  SiJest,
  SiJira,
  SiJoomla,
  SiJquery,
  SiKeycloak,
  SiKotlin,
  SiKubernetes,
  SiLangchain,
  SiLaravel,
  SiLinear,
  SiLinux,
  SiMailchimp,
  SiMake,
  SiMongodb,
  SiMui,
  SiMysql,
  SiN8N,
  SiNestjs,
  SiNetlify,
  SiNextdotjs,
  SiNginx,
  SiNodedotjs,
  SiNotion,
  SiNpm,
  SiNuxt,
  SiOkta,
  SiPayloadcms,
  SiPhp,
  SiPinterest,
  SiPnpm,
  SiPostgresql,
  SiPostman,
  SiPrettier,
  SiPrisma,
  SiPrometheus,
  SiPuppeteer,
  SiPython,
  SiPytorch,
  SiRadixui,
  SiRabbitmq,
  SiReact,
  SiRedis,
  SiRedux,
  SiRemix,
  SiRubyonrails,
  SiRuby,
  SiRust,
  SiSanity,
  SiSass,
  SiSelenium,
  SiSentry,
  SiShadcnui,
  SiShopify,
  SiShopware,
  SiSketch,
  SiSplunk,
  SiSquarespace,
  SiStorybook,
  SiStrapi,
  SiStripe,
  SiSupabase,
  SiSvelte,
  SiSwagger,
  SiSwift,
  SiSymfony,
  SiTailwindcss,
  SiTensorflow,
  SiTerraform,
  SiTiktok,
  SiTrello,
  SiTypescript,
  SiUbuntu,
  SiUnity,
  SiUnrealengine,
  SiVercel,
  SiVite,
  SiVitest,
  SiVuedotjs,
  SiWebflow,
  SiWebpack,
  SiWix,
  SiWoocommerce,
  SiWordpress,
  SiX,
  SiYarn,
  SiYii,
  SiYoutube,
  SiZapier,
  SiZendesk,
  SiZoom,
} from "react-icons/si";
import { fetchActiveTech } from "../lib/techStack";
import type { TechItem } from "../lib/techStack";
import Section from "./ui/Section";
import { BackgroundDecorations } from "./background";

// Honest capability fallback shown only when no tech is published yet.
// CMS content always takes priority over this list.
const FALLBACK_TECH: Array<{ name: string; category: string }> = [
  { name: "React", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "TypeScript", category: "Language" },
  { name: "Flutter", category: "Mobile" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Supabase", category: "Backend" },
  { name: "Docker", category: "DevOps" },
  { name: "AWS", category: "Cloud" },
  { name: "Figma", category: "Design" },
  { name: "WordPress", category: "CMS" },
];

type TechIcon = ComponentType<{ size?: number | string; className?: string; color?: string }>;

// Branded icon lookup. Keys are normalised technology names (lowercase,
// spaces/dots/slashes/hyphens stripped), so "Node.js", "Node JS" and "NodeJS"
// all resolve to the same icon. Unknown names fall through to a neutral icon.
const CATEGORY_ICON_MAP: Record<string, TechIcon> = {
  frontend: SiReact,
  backend: SiNodedotjs,
  development: SiTypescript,
  language: SiJavascript,
  mobile: SiFlutter,
  database: SiPostgresql,
  cloud: FaAws,
  devops: SiDocker,
  design: SiFigma,
  security: SiCloudflare,
  ai: SiTensorflow,
  cms: SiWordpress,
  ecommerce: SiShopify,
  testing: SiVitest,
  support: SiGithubactions,
};

const TECH_BRAND_COLORS: Record<string, string> = {
  react: "#61DAFB",
  reactjs: "#61DAFB",
  reactnative: "#61DAFB",
  next: "#FFFFFF",
  nextjs: "#FFFFFF",
  gatsby: "#663399",
  astro: "#FF5D01",
  remix: "#F8E05C",
  vite: "#646CFF",
  expo: "#000000",
  vue: "#42B883",
  vuejs: "#42B883",
  vuedotjs: "#42B883",
  nuxt: "#00DC82",
  nuxtjs: "#00DC82",
  svelte: "#FF3E00",
  sveltekit: "#FF3E00",
  angular: "#DD0031",
  angularjs: "#DD0031",
  node: "#339933",
  nodejs: "#339933",
  express: "#FFFFFF",
  expressjs: "#FFFFFF",
  nest: "#E0234E",
  nestjs: "#E0234E",
  electron: "#000000",
  deno: "#FF6C37",
  bun: "#FFBF2B",
  javascript: "#F7DF1E",
  js: "#F7DF1E",
  es6: "#F7DF1E",
  ecmascript: "#F7DF1E",
  typescript: "#3178C6",
  ts: "#3178C6",
  python: "#3776AB",
  django: "#092E20",
  flask: "#000000",
  fastapi: "#009485",
  php: "#777BB4",
  composer: "#885630",
  laravel: "#FF2D20",
  cakephp: "#00647C",
  codeigniter: "#E74F17",
  symfony: "#000000",
  yii: "#1B6FA7",
  ruby: "#CC342D",
  rubyonrails: "#CC342D",
  rails: "#CC342D",
  golang: "#00ADD8",
  go: "#00ADD8",
  rust: "#DEA584",
  kotlin: "#7F52FF",
  swift: "#FA7343",
  dart: "#0175C2",
  flutter: "#02569B",
  dotnet: "#512BD4",
  net: "#512BD4",
  cplusplus: "#00599C",
  cpp: "#00599C",
  mongodb: "#47A248",
  mongo: "#47A248",
  postgresql: "#4169E1",
  postgres: "#4169E1",
  mysql: "#4479A1",
  redis: "#DC382D",
  elasticsearch: "#005571",
  elastic: "#005571",
  graphql: "#E10098",
  prisma: "#2D3748",
  drizzle: "#FF5833",
  kafka: "#231F20",
  apachekafka: "#231F20",
  rabbitmq: "#FF6600",
  supabase: "#3ECF8E",
  firebase: "#FFCA28",
  appwrite: "#F29120",
  auth0: "#EB5424",
  aws: "#FF9900",
  amazon: "#FF9900",
  amazonwebservices: "#FF9900",
  amazonaws: "#FF9900",
  s3: "#FF9900",
  ec2: "#FF9900",
  lambda: "#FF9900",
  dynamodb: "#FF9900",
  azure: "#0078D4",
  microsoftazure: "#0078D4",
  microsoft: "#0078D4",
  googlecloud: "#4285F4",
  gcp: "#4285F4",
  vercel: "#000000",
  netlify: "#00C7B7",
  cloudflare: "#F38020",
  digitalocean: "#0080FF",
  linux: "#FCC624",
  ubuntu: "#E95420",
  nginx: "#009639",
  docker: "#2496ED",
  kubernetes: "#326CE5",
  k8s: "#326CE5",
  terraform: "#7B42BC",
  ansible: "#EE0000",
  jenkins: "#D24A3A",
  githubactions: "#2088FF",
  circleci: "#343434",
  prometheus: "#E6522C",
  grafana: "#F46800",
  keycloak: "#7952B3",
  okta: "#0060D1",
  github: "#FFFFFF",
  git: "#F05032",
  gitlab: "#FC6D26",
  bitbucket: "#0052CC",
  npm: "#CB3837",
  yarn: "#2C8EBB",
  pnpm: "#F69220",
  html: "#E34F26",
  html5: "#E34F26",
  css: "#1572B6",
  css3: "#1572B6",
  sass: "#CF649A",
  scss: "#CF649A",
  tailwind: "#06B6D4",
  tailwindcss: "#06B6D4",
  bootstrap: "#7952B3",
  jquery: "#0769AD",
  redux: "#764ABC",
  mui: "#007FFF",
  materialui: "#007FFF",
  material: "#007FFF",
  antdesign: "#08979C",
  antd: "#08979C",
  chakra: "#319795",
  chakraui: "#319795",
  radixui: "#7C3AED",
  shadcn: "#000000",
  shadcnui: "#000000",
  framer: "#0055FF",
  webpack: "#8DD6F9",
  esbuild: "#FFD000",
  babel: "#F2DC12",
  jest: "#C21325",
  vitest: "#6E9F18",
  cypress: "#17202C",
  selenium: "#007A33",
  puppeteer: "#F3F3F3",
  storybook: "#FF4785",
  eslint: "#4B32C3",
  prettier: "#F7B93E",
  postman: "#FF6C37",
  swagger: "#85EA2D",
  android: "#3DDC84",
  ios: "#000000",
  apple: "#000000",
  wordpress: "#21759B",
  wp: "#21759B",
  woocommerce: "#96588A",
  woo: "#96588A",
  elementor: "#6972C0",
  shopify: "#96BF48",
  shopware: "#7A5CFF",
  wix: "#000000",
  webflow: "#FF5E3A",
  squarespace: "#000000",
  drupal: "#0675CE",
  joomla: "#0072B6",
  ghost: "#151515",
  strapi: "#692D8B",
  sanity: "#F7931A",
  contentful: "#00B4A0",
  directus: "#7C3AED",
  payload: "#F4A020",
  payloadcms: "#F4A020",
  hasura: "#00B4A0",
  figma: "#F24E1E",
  sketch: "#F7B500",
  blender: "#E87D0D",
  unity: "#222C37",
  unreal: "#000000",
  unrealengine: "#000000",
  tensorflow: "#FF6F00",
  pytorch: "#EE4C2C",
  huggingface: "#FF587B",
  langchain: "#00A67E",
  google: "#4285F4",
  googleads: "#34A853",
  googleanalytics: "#E37400",
  analytics: "#E37400",
  facebook: "#1877F2",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  x: "#000000",
  twitter: "#1DA1F2",
  tiktok: "#000000",
  youtube: "#FF0000",
  pinterest: "#E60023",
  mailchimp: "#FFE01B",
  hubspot: "#FF7A59",
  zapier: "#FF4A00",
  n8n: "#EA0FFA",
  make: "#FF5C01",
  stripe: "#635BFF",
  jira: "#0052CC",
  notion: "#000000",
  trello: "#0079BF",
  asana: "#000000",
  clickup: "#6561F6",
  linear: "#5E6AD2",
  zoom: "#2D8CFF",
  googlemeet: "#00897B",
  gmail: "#EA4335",
  zendesk: "#03363D",
  sentry: "#FB4242",
  datadog: "#632CA6",
  splunk: "#FF6F00",
};

function normalizeTechName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/#/g, "sharp")
    .replace(/\.net/g, "dotnet")
    .replace(/[^a-z0-9]/g, "");
}

const KNOWN_ALIASES: Record<string, TechIcon> = {
  react: SiReact,
  reactjs: SiReact,
  reactnative: SiReact,
  next: SiNextdotjs,
  nextjs: SiNextdotjs,
  gatsby: SiGatsby,
  astro: SiAstro,
  remix: SiRemix,
  vite: SiVite,
  expo: SiExpo,
  vue: SiVuedotjs,
  vuejs: SiVuedotjs,
  vuedotjs: SiVuedotjs,
  nuxt: SiNuxt,
  nuxtjs: SiNuxt,
  svelte: SiSvelte,
  sveltekit: SiSvelte,
  angular: SiAngular,
  angularjs: SiAngular,
  node: SiNodedotjs,
  nodejs: SiNodedotjs,
  express: SiExpress,
  expressjs: SiExpress,
  nest: SiNestjs,
  nestjs: SiNestjs,
  electron: SiElectron,
  deno: SiDeno,
  bun: SiBun,
  javascript: SiJavascript,
  js: SiJavascript,
  es6: SiJavascript,
  ecmascript: SiJavascript,
  typescript: SiTypescript,
  ts: SiTypescript,
  python: SiPython,
  django: SiDjango,
  flask: SiFlask,
  fastapi: SiFastapi,
  php: SiPhp,
  composer: SiComposer,
  laravel: SiLaravel,
  cakephp: SiCakephp,
  codeigniter: SiCodeigniter,
  symfony: SiSymfony,
  yii: SiYii,
  ruby: SiRuby,
  rubyonrails: SiRubyonrails,
  rails: SiRubyonrails,
  golang: SiGo,
  go: SiGo,
  rust: SiRust,
  kotlin: SiKotlin,
  swift: SiSwift,
  dart: SiDart,
  flutter: SiFlutter,
  dotnet: SiDotnet,
  net: SiDotnet,
  cplusplus: SiCplusplus,
  cpp: SiCplusplus,
  mongodb: SiMongodb,
  mongo: SiMongodb,
  postgresql: SiPostgresql,
  postgres: SiPostgresql,
  mysql: SiMysql,
  redis: SiRedis,
  elasticsearch: SiElasticsearch,
  elastic: SiElastic,
  graphql: SiGraphql,
  prisma: SiPrisma,
  drizzle: SiDrizzle,
  kafka: SiApachekafka,
  apachekafka: SiApachekafka,
  rabbitmq: SiRabbitmq,
  supabase: SiSupabase,
  firebase: SiFirebase,
  appwrite: SiAppwrite,
  auth0: SiAuth0,
  aws: FaAws,
  amazon: FaAws,
  amazonwebservices: FaAws,
  amazonaws: FaAws,
  s3: FaAws,
  ec2: FaAws,
  lambda: FaAws,
  dynamodb: FaAws,
  azure: FaMicrosoft,
  microsoftazure: FaMicrosoft,
  microsoft: FaMicrosoft,
  googlecloud: SiGooglecloud,
  gcp: SiGooglecloud,
  vercel: SiVercel,
  netlify: SiNetlify,
  cloudflare: SiCloudflare,
  digitalocean: SiDigitalocean,
  linux: SiLinux,
  ubuntu: SiUbuntu,
  nginx: SiNginx,
  docker: SiDocker,
  kubernetes: SiKubernetes,
  k8s: SiKubernetes,
  terraform: SiTerraform,
  ansible: SiAnsible,
  jenkins: SiJenkins,
  githubactions: SiGithubactions,
  circleci: SiCircleci,
  prometheus: SiPrometheus,
  grafana: SiGrafana,
  keycloak: SiKeycloak,
  okta: SiOkta,
  github: SiGithub,
  git: SiGit,
  gitlab: SiGitlab,
  bitbucket: SiBitbucket,
  npm: SiNpm,
  yarn: SiYarn,
  pnpm: SiPnpm,
  html: SiHtml5,
  html5: SiHtml5,
  css: SiCss,
  css3: SiCss,
  sass: SiSass,
  scss: SiSass,
  tailwind: SiTailwindcss,
  tailwindcss: SiTailwindcss,
  bootstrap: SiBootstrap,
  jquery: SiJquery,
  redux: SiRedux,
  mui: SiMui,
  materialui: SiMui,
  material: SiMui,
  antdesign: SiAntdesign,
  antd: SiAntdesign,
  chakra: SiChakraui,
  chakraui: SiChakraui,
  radixui: SiRadixui,
  shadcn: SiShadcnui,
  shadcnui: SiShadcnui,
  framer: SiFramer,
  webpack: SiWebpack,
  esbuild: SiEsbuild,
  babel: SiBabel,
  jest: SiJest,
  vitest: SiVitest,
  cypress: SiCypress,
  selenium: SiSelenium,
  puppeteer: SiPuppeteer,
  storybook: SiStorybook,
  eslint: SiEslint,
  prettier: SiPrettier,
  postman: SiPostman,
  swagger: SiSwagger,
  android: SiAndroid,
  ios: SiIos,
  apple: SiApple,
  wordpress: SiWordpress,
  wp: SiWordpress,
  woocommerce: SiWoocommerce,
  woo: SiWoocommerce,
  elementor: SiElementor,
  shopify: SiShopify,
  shopware: SiShopware,
  wix: SiWix,
  webflow: SiWebflow,
  squarespace: SiSquarespace,
  drupal: SiDrupal,
  joomla: SiJoomla,
  ghost: SiGhost,
  strapi: SiStrapi,
  sanity: SiSanity,
  contentful: SiContentful,
  directus: SiDirectus,
  payload: SiPayloadcms,
  payloadcms: SiPayloadcms,
  hasura: SiHasura,
  figma: SiFigma,
  sketch: SiSketch,
  blender: SiBlender,
  unity: SiUnity,
  unreal: SiUnrealengine,
  unrealengine: SiUnrealengine,
  tensorflow: SiTensorflow,
  pytorch: SiPytorch,
  huggingface: SiHuggingface,
  langchain: SiLangchain,
  google: SiGoogle,
  googleads: SiGoogleads,
  googleanalytics: SiGoogleanalytics,
  analytics: SiGoogleanalytics,
  facebook: SiFacebook,
  instagram: SiInstagram,
  linkedin: FaLinkedin,
  x: SiX,
  twitter: SiX,
  tiktok: SiTiktok,
  youtube: SiYoutube,
  pinterest: SiPinterest,
  mailchimp: SiMailchimp,
  hubspot: SiHubspot,
  zapier: SiZapier,
  n8n: SiN8N,
  make: SiMake,
  stripe: SiStripe,
  jira: SiJira,
  notion: SiNotion,
  trello: SiTrello,
  asana: SiAsana,
  clickup: SiClickup,
  linear: SiLinear,
  zoom: SiZoom,
  googlemeet: SiGooglemeet,
  gmail: SiGmail,
  zendesk: SiZendesk,
  sentry: SiSentry,
  datadog: SiDatadog,
  splunk: SiSplunk,
};

function getTechIcon(name: string, category: string): TechIcon {
  const normalized = normalizeTechName(name);

  const exact = KNOWN_ALIASES[normalized];
  if (exact) return exact;

  const matchedAlias = Object.keys(KNOWN_ALIASES)
    .sort((a, b) => b.length - a.length)
    .find((alias) => alias.length > 2 && normalized.includes(alias));

  if (matchedAlias) return KNOWN_ALIASES[matchedAlias];

  const normalizedCategory = normalizeTechName(category);
  return CATEGORY_ICON_MAP[normalizedCategory] ?? SiGithub;
}

function TechIconGlyph({
  name,
  category,
  size,
  className,
}: {
  name: string;
  category: string;
  size: number;
  className?: string;
}) {
  const Icon = getTechIcon(name, category);
  const normalized = normalizeTechName(name);
  const color = TECH_BRAND_COLORS[normalized] ?? undefined;

  return createElement(Icon, {
    size,
    color,
    className,
  });
}

function TechItemDisplay({ name, category }: { name: string; category: string }) {
  return (
    <div className="group flex w-32 shrink-0 flex-col items-center justify-center gap-3 px-3 py-4 text-center sm:w-36">
      <div className="flex h-20 w-20 items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-110">
        <TechIconGlyph
          name={name}
          category={category}
          size={52}
          className="shrink-0 drop-shadow-[0_10px_24px_rgba(255,255,255,0.12)] transition-all duration-300"
        />
      </div>

      <div className="min-h-10">
        <span className="line-clamp-2 text-sm font-semibold leading-snug text-gray-200 transition-colors duration-300 group-hover:text-white">
          {name}
        </span>
      </div>

      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500 transition-colors duration-300 group-hover:text-purple-300">
        {category}
      </span>

      <span className="h-px w-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 group-hover:w-12" />
    </div>
  );
}

function TechStack() {
  const [items, setItems] = useState<TechItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchActiveTech()
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch(() => {
        // Silently ignore
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayed =
    items.length > 0 ? items.map((item) => ({ name: item.name, category: item.category })) : FALLBACK_TECH;

  return (
    <Section
      spacing="tight"
      className="bg-[#091426] text-white pb-10! md:pb-12!"
      decoration={<BackgroundDecorations preset="grid" density="subtle" />}
    >
      <div className="mb-12 flex justify-center" data-aos="fade-up">
        <span className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
          TECHNOLOGIES WE BUILD
        </span>
      </div>
      {loading ? (
        <div className="flex flex-wrap items-center justify-center gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex w-32 flex-col items-center gap-3 px-3 py-4 sm:w-36"><div className="h-20 w-20 animate-pulse rounded-full bg-white/10" /><div className="h-4 w-20 animate-pulse bg-white/10" /><div className="h-3 w-14 animate-pulse bg-white/10" /></div>
          ))}
        </div>
      ) : (
        <div className="marquee-hover marquee-viewport" data-aos="fade-up">
          <div className="marquee-track-left">
            <div className="flex shrink-0 gap-8 pr-8">
              {displayed.map((tech, index) => (
                <TechItemDisplay key={index} name={tech.name} category={tech.category} />
              ))}
            </div>
            <div className="marquee-copy flex shrink-0 gap-8 pr-8" aria-hidden="true" inert>
              {displayed.map((tech, index) => (
                <TechItemDisplay key={`copy-${index}`} name={tech.name} category={tech.category} />
              ))}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

export default TechStack;