module.exports = [
"[externals]/node:dns [external] (node:dns, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[externals]_node:dns_608f408c._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/node:dns [external] (node:dns, cjs)");
    });
});
}),
"[project]/src/lib/oracle-runner.ts [instrumentation] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[root-of-the-server]__bbc71c27._.js",
  "server/chunks/25143_@supabase_auth-js_dist_module_db73ec18._.js",
  "server/chunks/c976d_undici_lib_dispatcher_ac0c904b._.js",
  "server/chunks/c976d_undici_lib_llhttp_ca091ae6._.js",
  "server/chunks/c976d_undici_lib_web_d5d492e1._.js",
  "server/chunks/c976d_undici_lib_2e4a15e8._.js",
  "server/chunks/c976d_undici_index_b4f620d8.js",
  "server/chunks/node_modules__pnpm_fe786d0e._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/src/lib/oracle-runner.ts [instrumentation] (ecmascript)");
    });
});
}),
];