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
  "server/chunks/src_lib_786e3acc._.js",
  "server/chunks/node_modules__pnpm_c77264ec._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/src/lib/oracle-runner.ts [instrumentation] (ecmascript)");
    });
});
}),
];