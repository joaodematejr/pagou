/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as abacatepay from "../abacatepay.js";
import type * as clientes from "../clientes.js";
import type * as cobrancas from "../cobrancas.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_datas from "../lib/datas.js";
import type * as lib_pix from "../lib/pix.js";
import type * as pix from "../pix.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  abacatepay: typeof abacatepay;
  clientes: typeof clientes;
  cobrancas: typeof cobrancas;
  crons: typeof crons;
  http: typeof http;
  "lib/datas": typeof lib_datas;
  "lib/pix": typeof lib_pix;
  pix: typeof pix;
  webhooks: typeof webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
