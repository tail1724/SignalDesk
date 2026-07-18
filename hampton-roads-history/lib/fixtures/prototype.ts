import type { Article, City } from "@/lib/supabase/types";
import type { AdCreativeData } from "@/components/ads/AdCreative";

// Deterministic fixture content lifted verbatim from
// redesign/vapornet/index.html so the visual-regression fixtures render the
// exact copy in the approved reference screenshots (pixel-perfect plan §6.1).
// These are prototype strings, not live CMS data.

type ArticleOverride = Partial<Omit<Article, "hr_categories" | "hr_authors">> & {
  id: string;
  title: string;
  hr_categories?: { id: string; name: string; slug: string };
  hr_authors?: { id: string; name: string; slug: string };
};

function makeArticle(over: ArticleOverride): Article {
  const { hr_categories, hr_authors, ...rest } = over;
  return {
    short_id: over.id,
    slug: "prototype-story",
    dek: null,
    kicker: null,
    section_id: "civic",
    author_id: "maya",
    hero_image_url: null,
    hero_image_alt: null,
    hero_media: null,
    status: "published",
    publish_at: "2026-07-16T19:48:00.000Z",
    published_at: "2026-07-16T19:48:00.000Z",
    event_date: null,
    read_time_min: null,
    is_pro: false,
    body_lexical: null,
    ...rest,
    hr_categories: {
      order: 0,
      accent_hex: null,
      ...(hr_categories ?? { id: "civic", name: "Civic", slug: "norfolk" }),
    },
    hr_authors: {
      bio: null,
      avatar_url: null,
      ...(hr_authors ?? { id: "maya", name: "Maya Carter", slug: "maya-carter" }),
    },
  };
}

export const HOME_HERO = makeArticle({
  id: "hero-1",
  kicker: "Prototype story",
  title: "The bridge, the budget and the next ten years",
  dek: "A clear guide to the decisions that will shape how Hampton Roads moves, builds and grows.",
  read_time_min: 7,
  hr_categories: { id: "civic", name: "Civic life", slug: "norfolk" },
});

export const HOME_FEATURE = makeArticle({
  id: "feat-1",
  kicker: "Defense & port",
  title: "A shipyard expansion promises jobs. The training pipeline will decide who gets them.",
  dek: "Employers, colleges and unions are racing to close a skills gap before new contracts arrive.",
  read_time_min: 5,
  published_at: "2026-07-16T19:42:00.000Z",
  hr_authors: { id: "lena", name: "Lena Brooks", slug: "lena-brooks" },
  hr_categories: { id: "port", name: "Portsmouth", slug: "portsmouth" },
});

export const HOME_TWO_UP: Article[] = [
  makeArticle({
    id: "two-1",
    kicker: "Business",
    title: "Downtown’s next office tower may look more like a neighborhood",
    dek: "Housing, retail and public space move into a plan once built around cubicles.",
    read_time_min: 4,
    hr_categories: { id: "biz", name: "Norfolk", slug: "norfolk" },
  }),
  makeArticle({
    id: "two-2",
    kicker: "Civic",
    title: "Your plain-language guide to this week’s public meetings",
    dek: "Transit funding, school construction and flood resilience — what to watch.",
    hr_categories: { id: "civic", name: "All cities", slug: "norfolk" },
  }),
];

export const HOME_ROWS: Article[] = [
  makeArticle({
    id: "row-3",
    kicker: "Culture",
    title: "The kitchens carrying Filipino family recipes into a new generation",
    dek: "Three cooks explain what changes, what never does and why the story belongs here.",
    read_time_min: 8,
    hr_categories: { id: "cul", name: "Virginia Beach", slug: "virginia-beach" },
  }),
  makeArticle({
    id: "row-4",
    kicker: "History",
    title: "Fort Monroe’s freedom story is still changing the national record",
    dek: "New archival work sharpens our understanding of the people behind the decision.",
    read_time_min: 11,
    hr_categories: { id: "his", name: "Hampton", slug: "hampton" },
  }),
];

export const CATCH_UP: Article[] = [
  makeArticle({ id: "cu-1", title: "What changed at city hall today" }),
  makeArticle({ id: "cu-2", title: "The port number worth watching" }),
  makeArticle({ id: "cu-3", title: "Tonight’s weather and traffic" }),
  makeArticle({ id: "cu-4", title: "One great thing to do" }),
];

export const CITIES: City[] = [
  "Norfolk",
  "Virginia Beach",
  "Hampton",
  "Newport News",
  "Chesapeake",
  "Portsmouth",
  "Suffolk",
].map((name, i) => ({
  id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  order: i,
  accent_hex: null,
}));

// Ad creatives — exact copy from the prototype's mock ad units.
export const AD_LEADER: AdCreativeData = {
  advertiser: "HR",
  headline: "Ideas built here travel everywhere.",
  destUrl: "#",
};
export const AD_NATIVE: AdCreativeData = {
  advertiser: "Coastal Virginia Commerce Council",
  headline: "Meet five founders building their companies on the waterfront",
  body: "Partner-produced profiles, clearly separated from newsroom coverage.",
  destUrl: "#",
};
export const AD_RAIL: AdCreativeData = {
  advertiser: "Regional partner",
  headline: "Big water. Bold ideas.",
  body: "A year-long series on the people building the coastal economy.",
  destUrl: "#",
};
export const AD_EXTRA: AdCreativeData = {
  advertiser: "Regional",
  headline: "Build your next chapter in Hampton Roads.",
  destUrl: "#",
};
export const AD_INLINE_757: AdCreativeData = {
  advertiser: "757",
  headline: "Built here. Ready for what’s next.",
  destUrl: "#",
};
export const AD_ARTICLE_RAIL: AdCreativeData = {
  advertiser: "Direct sponsor",
  headline: "Move with confidence.",
  body: "Regional service, clearly labeled and independently reviewed.",
  destUrl: "#",
};
export const AD_SECTION: AdCreativeData = {
  advertiser: "Norfolk",
  headline: "Norfolk moves business forward.",
  destUrl: "#",
};
export const AD_CITY_RAIL: AdCreativeData = {
  advertiser: "Local partner",
  headline: "Made for the coast.",
  body: "Support a new generation of regional businesses.",
  destUrl: "#",
};

// Article body as a minimal Lexical editorState (paragraphs + h2 + quote is
// rendered separately in the fixture; body here matches the reference).
export const ARTICLE = makeArticle({
  id: "article-1",
  kicker: "Prototype article",
  title: "The bridge, the budget and the next ten years",
  dek: "A plain-language guide to the transportation decisions that could reshape how Hampton Roads moves, builds and grows.",
  read_time_min: 8,
  hr_categories: { id: "civic", name: "Civic life", slug: "norfolk" },
  hr_authors: { id: "maya", name: "Maya Carter", slug: "maya-carter" },
});
