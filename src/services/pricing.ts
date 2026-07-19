import { api } from "@/lib/api-client";
import type { PricingSettings } from "@/types/pricing";

export const pricingService = {
  getSettings: (options?: RequestInit): Promise<PricingSettings> =>
    api.get<PricingSettings>("/api/pricing/settings", options),

  updateSettings: (payload: PricingSettings): Promise<PricingSettings> =>
    api.put<PricingSettings>("/api/pricing/settings", payload),
};
