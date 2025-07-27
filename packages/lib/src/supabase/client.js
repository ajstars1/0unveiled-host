"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const ssr_1 = require("@supabase/ssr");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables");
    }
    // Create a supabase client on the browser with project's credentials
    return (0, ssr_1.createBrowserClient)(supabaseUrl, supabaseAnonKey);
}
