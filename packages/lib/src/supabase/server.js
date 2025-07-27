"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseServerClient = createSupabaseServerClient;
const ssr_1 = require("@supabase/ssr");
const headers_1 = require("next/headers");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function createSupabaseServerClient() {
    const cookieStore = await (0, headers_1.cookies)();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables");
    }
    // Create a server client with the cookies object using the new methods
    return (0, ssr_1.createServerClient)(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                }
                catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
    });
}
