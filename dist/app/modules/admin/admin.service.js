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
exports.DashboardService = void 0;
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const payment_model_1 = require("../payment/payment.model");
const user_model_1 = require("../user/user.model");
const task_model_1 = require("../task/task.model");
const http_status_1 = __importDefault(require("http-status"));
const AggregationBuilder_1 = require("../../builder/AggregationBuilder");
const getDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate models exist
        if (!user_model_1.User || !task_model_1.TaskModel || !payment_model_1.PaymentModel) {
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Required models are not available');
        }
        // Use dynamic growth calculation for different models
        const [allUsersStats, postsStats, revenueStats] = yield Promise.all([
            (0, AggregationBuilder_1.calculateGrowthDynamic)(user_model_1.User, { period: 'month' }),
            (0, AggregationBuilder_1.calculateGrowthDynamic)(task_model_1.TaskModel, { period: 'month' }),
            (0, AggregationBuilder_1.calculateGrowthDynamic)(payment_model_1.PaymentModel, {
                period: 'month',
                sumField: 'platformFee',
            }),
        ]);
        // Pick only total, formattedGrowth & growthType
        const pickStats = (stats) => ({
            total: stats.total,
            formattedGrowth: stats.formattedGrowth,
            growthType: stats.growthType,
        });
        return {
            allUsers: pickStats(allUsersStats),
            posts: pickStats(postsStats),
            revenue: pickStats(revenueStats),
        };
    }
    catch (error) {
        if (error instanceof ApiError_1.default) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, `Failed to fetch dashboard statistics: ${errorMessage}`);
    }
});
exports.DashboardService = {
    getDashboardStats,
};
