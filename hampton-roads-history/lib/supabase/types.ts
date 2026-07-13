export type City = {
  id: string;
  name: string;
  slug: string;
  order: number;
  accent_hex: string | null;
};

export type Author = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
};

export type Article = {
  id: string;
  short_id: string;
  title: string;
  dek: string | null;
  slug: string;
  kicker: string | null;
  section_id: string | null;
  author_id: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  status: string;
  publish_at: string | null;
  published_at: string | null;
  read_time_min: number | null;
  is_pro: boolean;
  hr_categories?: City | null;
  hr_authors?: Author | null;
  // Payload Lexical rich-text JSON — only present on the detail-view select.
  body_lexical?: unknown | null;
};
