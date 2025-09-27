import { z } from 'zod';

const createBannerZodSchema = z.object({
  body: z.object({
    imageUrl: z.string({
      required_error: 'Image URL is required',
    }),
    title: z.string({
      required_error: 'Title is required',
    }),
  }),
});

const updateBannerZodSchema = z.object({
  body: z.object({
    imageUrl: z
      .string()
      .optional(),
    title: z
      .string()
      .optional(),
  }),
});

export const BannerValidation = {
  createBannerZodSchema,
  updateBannerZodSchema,
};
