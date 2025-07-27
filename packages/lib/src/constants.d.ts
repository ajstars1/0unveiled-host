export declare const APP_NAME = "0Unveiled";
export declare const APP_DESCRIPTION = "AI-Powered Platform for the Future";
export declare const CONTACT_EMAIL = "hello@0unveiled.com";
export declare const SOCIAL_LINKS: {
    readonly twitter: "https://twitter.com/0unveiled";
    readonly github: "https://github.com/0unveiled";
    readonly linkedin: "https://linkedin.com/company/0unveiled";
};
export declare const API_ROUTES: {
    readonly auth: {
        readonly signIn: "/api/auth/signin";
        readonly signUp: "/api/auth/signup";
        readonly signOut: "/api/auth/signout";
        readonly resetPassword: "/api/auth/reset-password";
    };
    readonly user: {
        readonly profile: "/api/user/profile";
        readonly preferences: "/api/user/preferences";
    };
    readonly ai: {
        readonly generate: "/api/ai/generate";
        readonly summarize: "/api/ai/summarize";
        readonly analyze: "/api/ai/analyze";
    };
};
export declare const STORAGE_KEYS: {
    readonly authToken: "0unveiled_auth_token";
    readonly userPreferences: "0unveiled_user_preferences";
    readonly theme: "0unveiled_theme";
};
export declare const ROUTES: {
    readonly home: "/";
    readonly dashboard: "/dashboard";
    readonly profile: "/profile";
    readonly settings: "/settings";
    readonly pricing: "/pricing";
    readonly about: "/about";
    readonly contact: "/contact";
    readonly auth: {
        readonly signIn: "/auth/signin";
        readonly signUp: "/auth/signup";
        readonly resetPassword: "/auth/reset-password";
    };
};
export declare const LIMITS: {
    readonly maxFileSize: number;
    readonly maxFiles: 10;
    readonly maxTextLength: 10000;
};
//# sourceMappingURL=constants.d.ts.map