export interface AboutPhoto {
  id: string;
  url: string;
  caption?: string | null;
  displayOrder: number;
}

export interface SiteContent {
  whatsApp?: string | null;
  instagramUrl?: string | null;
  aboutTitle?: string | null;
  aboutIntro?: string | null;
  aboutStoryTitle?: string | null;
  aboutStory?: string | null;
  aboutPhotos: AboutPhoto[];
}
