"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannerRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const banner_controller_1 = require("./banner.controller");
const banner_validation_1 = require("./banner.validation");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const router = (0, express_1.Router)();
// ======== CREATE ==============
// Create a new banner (Admin only)
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(banner_validation_1.BannerValidation.createBannerZodSchema), banner_controller_1.BannerController.createBanner);
// ======== READ ==============
// Get all banners (Public)
router.get('/', banner_controller_1.BannerController.getAllBanners);
// Get a single banner by ID (Public)
router.get('/:bannerId', banner_controller_1.BannerController.getBannerById);
// ======== UPDATE ==============
// Update banner by ID (Admin only)
router.put('/:bannerId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(banner_validation_1.BannerValidation.updateBannerZodSchema), banner_controller_1.BannerController.updateBanner);
// ========= DELETE =============
// Delete banner by ID (Admin only)
router.delete('/:bannerId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), banner_controller_1.BannerController.deleteBanner);
exports.BannerRoutes = router;
