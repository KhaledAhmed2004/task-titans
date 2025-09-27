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
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const index_1 = __importDefault(require("./index"));
const user_model_1 = require("../app/modules/user/user.model");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: index_1.default.google_client_id,
    clientSecret: index_1.default.google_client_secret,
    callbackURL: index_1.default.google_redirect_uri,
}, (_accessToken, _refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('Google OAuth Profile:', profile);
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        if (!email) {
            console.error('No email found in Google profile');
            return done(new Error('No email found in Google profile'), undefined);
        }
        let user = yield user_model_1.User.findOne({ email });
        if (!user) {
            try {
                // Create new user with Google OAuth data - no password needed
                user = yield user_model_1.User.create({
                    name: profile.displayName || 'Google User',
                    email,
                    verified: true,
                    googleId: profile.id,
                    location: '', // default empty location
                    gender: 'male', // default gender, can be updated later
                    dateOfBirth: '', // default empty date of birth
                    phone: '', // default empty phone
                });
            }
            catch (createError) {
                console.error('❌ Error creating user:', createError);
                return done(createError, undefined);
            }
        }
        else if (!user.googleId) {
            console.log('Linking existing user with Google account');
            // Link existing user with Google account
            user.googleId = profile.id;
            user.verified = true;
            yield user.save();
            console.log('User linked with Google account:', user._id);
        }
        else {
            console.log('Existing Google user found:', user._id);
        }
        return done(null, user);
    }
    catch (err) {
        console.error('Google OAuth Strategy Error:', err);
        return done(err);
    }
})));
exports.default = passport_1.default;
