"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = exports.createSupabaseServerClient = void 0;
var server_1 = require("./server");
Object.defineProperty(exports, "createSupabaseServerClient", { enumerable: true, get: function () { return server_1.createSupabaseServerClient; } });
var client_1 = require("./client");
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return client_1.createClient; } });
