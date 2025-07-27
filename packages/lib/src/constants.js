"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIMITS = exports.ROUTES = exports.STORAGE_KEYS = exports.API_ROUTES = exports.SOCIAL_LINKS = exports.CONTACT_EMAIL = exports.APP_DESCRIPTION = exports.APP_NAME = void 0;
exports.APP_NAME = "0Unveiled";
exports.APP_DESCRIPTION = "AI-Powered Platform for the Future";
exports.CONTACT_EMAIL = "hello@0unveiled.com";
exports.SOCIAL_LINKS = {
    twitter: "https://twitter.com/0unveiled",
    github: "https://github.com/0unveiled",
    linkedin: "https://linkedin.com/company/0unveiled",
};
exports.API_ROUTES = {
    auth: {
        signIn: "/api/auth/signin",
        signUp: "/api/auth/signup",
        signOut: "/api/auth/signout",
        resetPassword: "/api/auth/reset-password",
    },
    user: {
        profile: "/api/user/profile",
        preferences: "/api/user/preferences",
    },
    ai: {
        generate: "/api/ai/generate",
        summarize: "/api/ai/summarize",
        analyze: "/api/ai/analyze",
    },
};
exports.STORAGE_KEYS = {
    authToken: "0unveiled_auth_token",
    userPreferences: "0unveiled_user_preferences",
    theme: "0unveiled_theme",
};
exports.ROUTES = {
    home: "/",
    dashboard: "/dashboard",
    profile: "/profile",
    settings: "/settings",
    pricing: "/pricing",
    about: "/about",
    contact: "/contact",
    auth: {
        signIn: "/auth/signin",
        signUp: "/auth/signup",
        resetPassword: "/auth/reset-password",
    },
};
exports.LIMITS = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    maxTextLength: 10000,
};
