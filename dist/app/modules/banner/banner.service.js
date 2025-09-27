"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannerService = void 0;
const banner_model_1 = require("./banner.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_codes_1 = require("http-status-codes");
// ======== CREATE ==============
const createBanner = (banner) => __awaiter(void 0, void 0, void 0, function* () {
    const newBanner = yield banner_model_1.BannerModel.create(banner);
    return newBanner;
});
// ======== READ ==============
const getAllBanners = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    // 1️⃣ Build query with filters, pagination, sorting etc.
    const queryBuilder = new QueryBuilder_1.default(banner_model_1.BannerModel.find(), query)
        .search(['imageUrl'])
        .filter()
        .dateFilter()
        .sort()
        .paginate()
        .fields();
    // 2️⃣ Execute query
    const { data, pagination } = yield queryBuilder.getFilteredResults();
    return { data, pagination };
});
const getBannerById = (bannerId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Validate ID
    if (!mongoose_1.default.isValidObjectId(bannerId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid bannerId');
    }
    // 2️⃣ Find banner
    const banner = yield banner_model_1.BannerModel.findById(bannerId);
    if (!banner) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Banner not found');
    }
    return banner;
});
// ======== UPDATE ==============
const updateBanner = (bannerId, bannerUpdate) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Validate ID
    if (!mongoose_1.default.isValidObjectId(bannerId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid bannerId');
    }
    // 2️⃣ Update
    const updatedBanner = yield banner_model_1.BannerModel.findByIdAndUpdate(bannerId, bannerUpdate, { new: true, runValidators: true });
    if (!updatedBanner) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Banner not found');
    }
    return updatedBanner;
});
// ========= DELETE =============
const deleteBanner = (bannerId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Validate ID
    if (!mongoose_1.default.isValidObjectId(bannerId)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid bannerId');
    }
    // 2️⃣ Delete
    const deletedBanner = yield banner_model_1.BannerModel.findByIdAndDelete(bannerId);
    if (!deletedBanner) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Banner not found');
    }
    return { message: 'Banner deleted successfully' };
});
exports.BannerService = {
    createBanner,
    getAllBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
};
