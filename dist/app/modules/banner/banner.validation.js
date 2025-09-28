"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannerValidation = void 0;
const zod_1 = require("zod");
const createBannerZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        imageUrl: zod_1.z.string({
            required_error: 'Image URL is required',
        }),
        title: zod_1.z.string({
            required_error: 'Title is required',
        }),
    }),
});
const updateBannerZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        imageUrl: zod_1.z
            .string()
            .optional(),
        title: zod_1.z
            .string()
            .optional(),
    }),
});
exports.BannerValidation = {
    createBannerZodSchema,
    updateBannerZodSchema,
};
