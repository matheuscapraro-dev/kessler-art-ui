import { api } from "@/lib/api-client";
import type { AboutPhoto, SiteContent } from "@/types/content";

export interface UpdateContentPayload {
  whatsApp?: string;
  instagramUrl?: string;
  aboutTitle?: string;
  aboutIntro?: string;
  aboutStoryTitle?: string;
  aboutStory?: string;
}

export const contentService = {
  get: (options?: RequestInit): Promise<SiteContent> =>
    api.get<SiteContent>("/api/content", options),

  update: (payload: UpdateContentPayload): Promise<SiteContent> =>
    api.put<SiteContent>("/api/content", payload),

  uploadAboutPhoto: (file: File, caption?: string): Promise<AboutPhoto> => {
    const fd = new FormData();
    fd.append("file", file);
    if (caption) fd.append("caption", caption);
    return api.upload<AboutPhoto>("/api/content/about-photos", fd);
  },

  removeAboutPhoto: (photoId: string): Promise<void> =>
    api.del<void>(`/api/content/about-photos/${photoId}`),
};
