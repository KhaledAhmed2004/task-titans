import { z } from 'zod';

export const createBannerZodSchema = z.object({
  imageUrl: z.string().url({
    message: 'Image URL must be a valid URL',
  }),
});

// ✅ Update Banner Validation (all fields optional, since you may update partially)
export const updateBannerZodSchema = z.object({
  imageUrl: z.string().url().optional(),
});
