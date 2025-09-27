"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bid_interface_1 = require("./bid.interface");
const BidSchema = new mongoose_1.default.Schema({
    taskId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
    taskerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: { type: Number, required: true },
    message: { type: String, required: false },
    status: { type: String, enum: Object.values(bid_interface_1.BidStatus), required: true },
}, {
    timestamps: true,
});
exports.BidModel = mongoose_1.default.model('Bid', BidSchema);
