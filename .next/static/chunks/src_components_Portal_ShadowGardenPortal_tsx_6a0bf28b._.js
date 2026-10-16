(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/Portal/ShadowGardenPortal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ShadowGardenPortal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@swc+helpers@0.5.15/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * SHADOW GARDEN: ETERNAL ENGINE (VER 76.2 - TYPESCRIPT FIX FINAL)
 * =============================================================================
 * [UPDATES]
 * - Fixed TypeScript error with conditional rendering (changed && to ternary with null)
 * - All performance optimizations preserved
 * - All functions, features, logic, and designs maintained
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.21_@babel+core@7._81b24c4c8084276f47854f01706fcc93/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$react$2d$three$2d$fiber$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+fiber@9.6.1_@t_d3a4f9d95c93a885c520db7df717159f/node_modules/@react-three/fiber/dist/react-three-fiber.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+fiber@9.6.1_@t_d3a4f9d95c93a885c520db7df717159f/node_modules/@react-three/fiber/dist/events-b389eeca.esm.js [app-client] (ecmascript) <export D as useFrame>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__e__as__extend$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+fiber@9.6.1_@t_d3a4f9d95c93a885c520db7df717159f/node_modules/@react-three/fiber/dist/events-b389eeca.esm.js [app-client] (ecmascript) <export e as extend>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__C__as__useThree$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+fiber@9.6.1_@t_d3a4f9d95c93a885c520db7df717159f/node_modules/@react-three/fiber/dist/events-b389eeca.esm.js [app-client] (ecmascript) <export C as useThree>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/three@0.182.0/node_modules/three/build/three.core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$PerspectiveCamera$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+drei@10.7.7_@r_381ef0bd84716b7038846e161d73cb90/node_modules/@react-three/drei/core/PerspectiveCamera.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Stars$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+drei@10.7.7_@r_381ef0bd84716b7038846e161d73cb90/node_modules/@react-three/drei/core/Stars.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+drei@10.7.7_@r_381ef0bd84716b7038846e161d73cb90/node_modules/@react-three/drei/core/Sparkles.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$CameraShake$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+drei@10.7.7_@r_381ef0bd84716b7038846e161d73cb90/node_modules/@react-three/drei/core/CameraShake.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shapes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+drei@10.7.7_@r_381ef0bd84716b7038846e161d73cb90/node_modules/@react-three/drei/core/shapes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shaderMaterial$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+drei@10.7.7_@r_381ef0bd84716b7038846e161d73cb90/node_modules/@react-three/drei/core/shaderMaterial.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Sky$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+drei@10.7.7_@r_381ef0bd84716b7038846e161d73cb90/node_modules/@react-three/drei/core/Sky.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Billboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+drei@10.7.7_@r_381ef0bd84716b7038846e161d73cb90/node_modules/@react-three/drei/core/Billboard.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Instances$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+drei@10.7.7_@r_381ef0bd84716b7038846e161d73cb90/node_modules/@react-three/drei/core/Instances.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Float$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+drei@10.7.7_@r_381ef0bd84716b7038846e161d73cb90/node_modules/@react-three/drei/core/Float.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$postprocessing_3da87f7da575ec7860ff76998984d9bf$2f$node_modules$2f40$react$2d$three$2f$postprocessing$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-three+postprocessing_3da87f7da575ec7860ff76998984d9bf/node_modules/@react-three/postprocessing/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$postprocessing$40$6$2e$39$2e$3_three$40$0$2e$182$2e$0$2f$node_modules$2f$postprocessing$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/postprocessing@6.39.3_three@0.182.0/node_modules/postprocessing/build/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/framer-motion@11.18.2_react_cce3d889a93a74b971da0f2788960b34/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/framer-motion@11.18.2_react_cce3d889a93a74b971da0f2788960b34/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$fingerprint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Fingerprint$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.400.0_react@18.3.1/node_modules/lucide-react/dist/esm/icons/fingerprint.js [app-client] (ecmascript) <export default as Fingerprint>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$power$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Power$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.400.0_react@18.3.1/node_modules/lucide-react/dist/esm/icons/power.js [app-client] (ecmascript) <export default as Power>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.400.0_react@18.3.1/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$fast$2d$forward$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FastForward$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.400.0_react@18.3.1/node_modules/lucide-react/dist/esm/icons/fast-forward.js [app-client] (ecmascript) <export default as FastForward>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlayCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.400.0_react@18.3.1/node_modules/lucide-react/dist/esm/icons/circle-play.js [app-client] (ecmascript) <export default as PlayCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.400.0_react@18.3.1/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/checkbox.tsx [app-client] (ecmascript)");
// =============================================================================
// OPTIMIZED SHADERS (SIMPLIFIED)
// =============================================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/audioManager.ts [app-client] (ecmascript)");
;
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature(), _s5 = __turbopack_context__.k.signature(), _s6 = __turbopack_context__.k.signature(), _s7 = __turbopack_context__.k.signature(), _s8 = __turbopack_context__.k.signature(), _s9 = __turbopack_context__.k.signature(), _s10 = __turbopack_context__.k.signature(), _s11 = __turbopack_context__.k.signature(), _s12 = __turbopack_context__.k.signature(), _s13 = __turbopack_context__.k.signature(), _s14 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
// =============================================================================
// PERFORMANCE DETECTION (ENHANCED)
// =============================================================================
const detectPerformanceTier = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isLowEndMobile = isMobile && (/Android [1-7]/.test(navigator.userAgent) || /iPhone OS [1-11]_/.test(navigator.userAgent));
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 2;
    if (isLowEndMobile || isAndroid && cores <= 4 || memory < 3) {
        return 'potato';
    }
    if (isMobile || cores <= 2 || memory < 4) {
        return 'low';
    }
    if (cores <= 4 || memory < 8) {
        return 'medium';
    }
    return 'high';
};
// Frame rate monitor for dynamic quality adjustment
class PerformanceMonitor {
    update() {
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
        return this.fps;
    }
    shouldDowngrade() {
        return this.fps < 25;
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "frameCount", 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "lastTime", performance.now());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$swc$2b$helpers$40$0$2e$5$2e$15$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "fps", 60);
    }
}
const perfMonitor = new PerformanceMonitor();
;
const MagmaShader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shaderMaterial$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shaderMaterial"])({
    uTime: 0,
    uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ff3300"),
    uIntensity: 2.5
}, "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}", "varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uIntensity;void main(){float noise=sin(vUv.y*8.0-uTime*1.2)+cos(vUv.x*15.0);float vein=0.03/abs(vUv.x-0.5+noise*0.04);float pulse=sin(uTime*1.5)*0.25+0.75;vec3 finalColor=uColor*vein*uIntensity;float alpha=smoothstep(0.0,1.0,vein)*pulse*0.8;gl_FragColor=vec4(finalColor,alpha);}");
const TunnelShader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shaderMaterial$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shaderMaterial"])({
    uTime: 0,
    uProgress: 0,
    speed: 1.0,
    ring: 1.0,
    swirl: 1.0
}, "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}", "varying vec2 vUv;\n    uniform float uTime;\n    uniform float uProgress;\n    uniform float speed;\n    \n    float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }\n    \n    float noise(vec2 p){\n        vec2 ip = floor(p);\n        vec2 u = fract(p);\n        u = u*u*(3.0-2.0*u);\n        return mix(\n            mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),\n            mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);\n    }\n    \n    void main() {\n        float time = uTime * speed * 0.6;\n        vec2 uv = vec2(vUv.x * 20.0 - time, vUv.y * 12.0 + vUv.x * 5.0 + time * 0.3);\n        \n        float n1 = noise(uv * 1.5);\n        float n2 = noise(uv * 3.0 + vec2(time * 0.5, 0.0));\n        float nebula = (n1 + n2 * 0.5) * 0.7;\n        \n        float streak = pow(noise(vec2(vUv.x * 60.0 - time * 6.0, vUv.y * 100.0)), 12.0) * 4.0;\n        \n        vec3 col = mix(vec3(0.01, 0.0, 0.03), vec3(0.1, 0.0, 0.3), nebula);\n        vec3 highlight = mix(vec3(0.0, 0.6, 1.0), vec3(1.0, 0.0, 0.6), sin(vUv.y * 6.28 + time)*0.5+0.5);\n        \n        col += highlight * pow(nebula, 2.5) * 2.0;\n        col += vec3(0.7, 0.9, 1.0) * streak;\n        \n        float startDark = smoothstep(0.0, 0.1, vUv.x);\n        float endWhite = smoothstep(0.85, 1.0, vUv.x);\n        float fadeOut = smoothstep(0.7, 0.95, uProgress);\n        \n        col *= startDark;\n        col = mix(col, vec3(1.0), endWhite + fadeOut);\n        \n        gl_FragColor = vec4(col, 1.0);\n    }");
const RuneShader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shaderMaterial$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shaderMaterial"])({
    uTime: 0,
    uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ff3300"),
    uIntensity: 1.0
}, "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}", "varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uIntensity;\nfloat rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}\nvoid main(){\n    vec2 gUv=vUv*vec2(4.0,8.0);vec2 id=floor(gUv);vec2 f=fract(gUv);\n    float r=rand(id);\n    float pulse=sin(uTime*2.0+r*6.28)*0.5+0.5;\n    float rune1=step(0.4,f.x)*step(f.x,0.6)*step(0.2,f.y)*step(f.y,0.8);\n    float rune2=step(0.2,f.x)*step(f.x,0.8)*step(0.4,f.y)*step(f.y,0.6);\n    float symbol=mix(rune1,max(rune1,rune2),step(0.5,r));\n    float fade=smoothstep(0.0,0.2,vUv.x)*smoothstep(1.0,0.8,vUv.x)*smoothstep(0.0,0.1,vUv.y)*smoothstep(1.0,0.9,vUv.y);\n    float alpha=symbol*pulse*fade*uIntensity;\n    gl_FragColor=vec4(uColor,alpha);\n}");
const TUNNEL_CURVE = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CatmullRomCurve3"]([
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 0, 0),
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](10, 10, -50),
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](-30, -20, -120),
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](40, 30, -220),
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](-50, -40, -320),
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 0, -450)
], false, 'catmullrom', 0.8);
const PortalVortexShader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shaderMaterial$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shaderMaterial"])({
    uTime: 0,
    uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#d8b4fe"),
    uOpen: 0,
    uSuction: 0
}, "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}", "varying vec2 vUv;\n    uniform float uTime;\n    uniform vec3 uColor;\n    uniform float uOpen;\n    uniform float uSuction;\n    void main(){\n        vec2 center = vUv - 0.5;\n        center.x *= (11.5 / 22.0);\n        \n        float dist = length(center);\n        float angle = atan(center.y, center.x);\n        \n        float spiral = sin(angle*12.0 + dist*30.0 - uTime*(5.0 + uSuction*6.0));\n        float rings = sin(dist*50.0 - uTime*(6.0 + uSuction*8.0));\n        \n        vec3 coreColor = vec3(1.0, 1.0, 1.0);\n        vec3 outerColor = uColor;\n        vec3 baseColor = mix(outerColor, coreColor, smoothstep(0.4, 0.0, dist));\n        \n        float spikes = sin(angle * 5.0 - uTime * 2.0) * 0.5 + 0.5;\n        baseColor += outerColor * spikes * smoothstep(0.5, 0.2, dist);\n        \n        vec3 finalColor = baseColor + vec3(spiral * 0.5 + rings * 0.5);\n        \n        float edgeFade = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x) * \n                         smoothstep(0.0, 0.02, vUv.y) * smoothstep(1.0, 0.98, vUv.y);\n        \n        float intensity = uOpen * (2.0 + uSuction * 2.0) * edgeFade;\n        float alpha = clamp(intensity * (1.0 - dist*1.5 + rings*0.5 + spiral*0.5), 0.0, 1.0);\n        \n        gl_FragColor = vec4(finalColor, alpha);\n    }");
const CloudShader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shaderMaterial$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shaderMaterial"])({
    uTime: 0,
    uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#552222"),
    uDensity: 0.5
}, "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}", "varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uDensity;float rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}float noise(vec2 p){vec2 ip=floor(p);vec2 u=fract(p);u=u*u*(3.0-2.0*u);return mix(mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);}void main(){float n=noise(vUv*10.0+uTime*0.04)*0.7;n+=noise(vUv*20.0+uTime*0.02)*0.3;float dist=distance(vUv,vec2(0.5));float alpha=(1.0-smoothstep(0.0,0.5,dist))*n*uDensity;gl_FragColor=vec4(uColor,alpha);}");
const WarpShader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shaderMaterial$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shaderMaterial"])({
    uTime: 0,
    uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ffffff"),
    uSpeed: 20.0
}, "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}", "uniform float uTime;uniform vec3 uColor;uniform float uSpeed;varying vec2 vUv;void main(){float streak=sin(vUv.y*80.0+uTime*uSpeed);float opacity=smoothstep(0.92,1.0,streak);opacity*=smoothstep(0.0,0.15,vUv.x)*smoothstep(1.0,0.85,vUv.x);gl_FragColor=vec4(uColor,opacity*0.7);}");
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__e__as__extend$3e$__["extend"])({
    MagmaShader,
    PortalVortexShader,
    CloudShader,
    WarpShader,
    TunnelShader,
    RuneShader
});
// =============================================================================
// PLAYER RIG (OPTIMIZED)
// =============================================================================
const WormholeTunnel = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s((param)=>{
    let { stage, tunnelProgress } = param;
    _s();
    const matRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const groupRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isActive = stage === 'suction' || stage === 'tunnel' || stage === 'tunnel_end';
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "WormholeTunnel.useFrame": (state)=>{
            if (!matRef.current) return;
            matRef.current.uTime = state.clock.elapsedTime;
            matRef.current.uProgress = tunnelProgress;
        }
    }["WormholeTunnel.useFrame"]);
    if (!isActive) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
        ref: groupRef,
        position: [
            0,
            0,
            -50
        ],
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tubeGeometry", {
                        args: [
                            TUNNEL_CURVE,
                            128,
                            14,
                            24,
                            false
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 349,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tunnelShader", {
                        ref: matRef,
                        uProgress: tunnelProgress,
                        side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BackSide"],
                        depthWrite: false,
                        transparent: true
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 350,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 348,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                position: [
                    0,
                    0,
                    -450
                ],
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("sphereGeometry", {
                        args: [
                            20,
                            16,
                            16
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 354,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshBasicMaterial", {
                        color: "#ffffff",
                        transparent: true,
                        opacity: tunnelProgress > 0.85 ? (tunnelProgress - 0.85) / 0.15 : 0
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 355,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 353,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("sphereGeometry", {
                        args: [
                            500,
                            8,
                            8
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 359,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshBasicMaterial", {
                        color: "#000000",
                        side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BackSide"]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 360,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 358,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 347,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "xUGXlRaEwNskAXrfq2cisJnjkZ4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
}));
_c = WormholeTunnel;
const PlayerRig = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s1((param)=>{
    let { stage } = param;
    _s1();
    const legsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "PlayerRig.useFrame": (state)=>{
            if (!legsRef.current) return;
            const t = state.clock.elapsedTime;
            if (stage === 'walk') {
                legsRef.current.position.y = -1.7 + Math.sin(t * 12) * 0.05;
            } else if (stage === 'crouch') {
                legsRef.current.position.y = -0.8;
            } else {
                legsRef.current.position.y = -1.7;
            }
        }
    }["PlayerRig.useFrame"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
        position: [
            0,
            1.7,
            0
        ],
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
            ref: legsRef,
            position: [
                0,
                -1.7,
                0.2
            ],
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shapes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Capsule"], {
                    args: [
                        0.18,
                        1.4
                    ],
                    position: [
                        0.25,
                        0,
                        0
                    ],
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                        color: "#050505",
                        metalness: 0.3,
                        roughness: 0.7
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 386,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 385,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shapes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Capsule"], {
                    args: [
                        0.18,
                        1.4
                    ],
                    position: [
                        -0.25,
                        0,
                        0
                    ],
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                        color: "#050505",
                        metalness: 0.3,
                        roughness: 0.7
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 389,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 388,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
            lineNumber: 384,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 383,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "L3I3XFbzjW7OrK1lApFH3e2C1jQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
}));
_c1 = PlayerRig;
PlayerRig.displayName = 'PlayerRig';
// =============================================================================
// SCENE COMPONENTS (OPTIMIZED)
// =============================================================================
const PortalCoreLight = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s2((param)=>{
    let { stage } = param;
    _s2();
    const lightRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const strobeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "PortalCoreLight.useFrame": (state, delta)=>{
            if (!lightRef.current) return;
            const t = state.clock.elapsedTime;
            let targetInt = 0;
            if (stage === 'push') {
                targetInt = 150;
            } else if (stage === 'suction' || stage === 'tunnel') {
                targetInt = 350;
            }
            lightRef.current.intensity = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MathUtils"].lerp(lightRef.current.intensity, targetInt, delta * 2.5);
            if (strobeRef.current) {
                if (stage === 'suction' || stage === 'tunnel') {
                    const isFlickerOn = Math.sin(t * 70) + Math.cos(t * 110) > 0.2;
                    strobeRef.current.intensity = isFlickerOn ? 600 : 0;
                } else {
                    strobeRef.current.intensity = 0;
                }
            }
        }
    }["PortalCoreLight.useFrame"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
        position: [
            0,
            9,
            -1.0
        ],
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pointLight", {
                ref: lightRef,
                color: "#ffffff",
                intensity: 0,
                distance: 40,
                decay: 2
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 435,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pointLight", {
                ref: strobeRef,
                color: "#00ffff",
                intensity: 0,
                distance: 65,
                decay: 1.2
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 442,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 434,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "Q0sMwMEZDMlsMDxLXWSHm9rHFV4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
}));
_c2 = PortalCoreLight;
PortalCoreLight.displayName = 'PortalCoreLight';
const PortalVortex = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s3((param)=>{
    let { stage } = param;
    _s3();
    const matRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const meshRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "PortalVortex.useFrame": (state, delta)=>{
            if (!matRef.current || !meshRef.current) return;
            matRef.current.uTime = state.clock.elapsedTime;
            let targetOpen = 0;
            let targetSuction = 0;
            if (stage === 'push') {
                targetOpen = 1.0;
                targetSuction = 0.5;
            } else if (stage === 'suction') {
                targetOpen = 1.0;
                targetSuction = 1.0;
            }
            matRef.current.uOpen = targetOpen;
            matRef.current.uSuction = targetSuction;
        // We do not rotate the mesh if it's rectangular, the shader should handle the swirling.
        // meshRef.current.rotation.z += delta * (0.4 + matRef.current.uSuction * 1.5);
        }
    }["PortalVortex.useFrame"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
        ref: meshRef,
        position: [
            0,
            11,
            -1.0
        ],
        rotation: [
            0,
            0,
            0
        ],
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("planeGeometry", {
                args: [
                    11.5,
                    22
                ]
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 484,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("portalVortexShader", {
                ref: matRef,
                uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ff0000"),
                uOpen: 0,
                uSuction: 0,
                transparent: true,
                side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DoubleSide"],
                blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"],
                depthWrite: false
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 485,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 483,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "h0KyiCCOXTbGUux75Jnk6kbxKXM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
}));
_c3 = PortalVortex;
PortalVortex.displayName = 'PortalVortex';
const WarpTunnel = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s4((param)=>{
    let { active, quality, stage, glitchIntensity } = param;
    _s4();
    const tunnelRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const matRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const segments = quality === 'potato' ? 12 : quality === 'low' ? 16 : quality === 'medium' ? 20 : 24;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "WarpTunnel.useFrame": (state, delta)=>{
            if (!active || !tunnelRef.current) return;
            tunnelRef.current.rotation.z += delta * 4;
            if (matRef.current) matRef.current.uTime = state.clock.elapsedTime;
        }
    }["WarpTunnel.useFrame"]);
    const isVisible = active || stage === 'tunnel';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
        ref: tunnelRef,
        position: [
            0,
            11,
            -1.5
        ],
        visible: isVisible,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                rotation: [
                    Math.PI / 2,
                    0,
                    0
                ],
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("cylinderGeometry", {
                        args: [
                            12,
                            4,
                            80,
                            segments,
                            1,
                            true
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 517,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("warpShader", {
                        ref: matRef,
                        uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ccffff"),
                        uSpeed: 25.0,
                        transparent: true,
                        side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BackSide"],
                        blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 518,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 516,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            stage !== 'tunnel' && stage !== 'tunnel_end' && stage !== 'arrival' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {}, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 528,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 515,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "1zV1Kt+04ELWLECXwZuXsw1KZ1Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
}));
_c4 = WarpTunnel;
WarpTunnel.displayName = 'WarpTunnel';
const ConstructedGate = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s5((param)=>{
    let { isOpen, quality } = param;
    _s5();
    const frameBricks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ConstructedGate.useMemo[frameBricks]": ()=>{
            const b = [];
            const verticalCount = quality === 'potato' ? 10 : quality === 'low' ? 12 : 15;
            const archCount = quality === 'potato' ? 12 : quality === 'low' ? 16 : 20;
            for(let y = 0; y < verticalCount; y++){
                b.push({
                    pos: [
                        -7.2,
                        y,
                        0
                    ],
                    scale: [
                        2.9,
                        0.9,
                        2.9
                    ],
                    rot: [
                        0,
                        0,
                        0
                    ]
                });
                b.push({
                    pos: [
                        7.2,
                        y,
                        0
                    ],
                    scale: [
                        2.9,
                        0.9,
                        2.9
                    ],
                    rot: [
                        0,
                        0,
                        0
                    ]
                });
            }
            b.push({
                pos: [
                    -7.2,
                    -1,
                    0
                ],
                scale: [
                    3.9,
                    1.5,
                    3.9
                ],
                rot: [
                    0,
                    0,
                    0
                ]
            });
            b.push({
                pos: [
                    7.2,
                    -1,
                    0
                ],
                scale: [
                    3.9,
                    1.5,
                    3.9
                ],
                rot: [
                    0,
                    0,
                    0
                ]
            });
            for(let i = 0; i < archCount; i++){
                const angle = i / (archCount - 1) * Math.PI;
                const x = Math.cos(angle) * 7;
                const y = Math.sin(angle) * 7 + 18;
                b.push({
                    pos: [
                        x,
                        y,
                        0
                    ],
                    scale: [
                        2,
                        0.8,
                        2
                    ],
                    rot: [
                        0,
                        0,
                        angle
                    ]
                });
            }
            b.push({
                pos: [
                    0,
                    25.5,
                    0
                ],
                scale: [
                    3,
                    1.5,
                    3
                ],
                rot: [
                    0,
                    0,
                    0.78
                ]
            });
            return b;
        }
    }["ConstructedGate.useMemo[frameBricks]"], [
        quality
    ]);
    const leftDoor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const rightDoor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const magmaRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "ConstructedGate.useFrame": (state, delta)=>{
            if (!leftDoor.current || !rightDoor.current) return;
            const targetRot = isOpen ? -2.2 : 0;
            leftDoor.current.rotation.y = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MathUtils"].lerp(leftDoor.current.rotation.y, targetRot, delta * 0.35);
            rightDoor.current.rotation.y = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MathUtils"].lerp(rightDoor.current.rotation.y, -targetRot, delta * 0.35);
            magmaRefs.current.forEach({
                "ConstructedGate.useFrame": (mat)=>{
                    if (mat) mat.uTime = state.clock.elapsedTime;
                }
            }["ConstructedGate.useFrame"]);
        }
    }["ConstructedGate.useFrame"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Instances$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Instances"], {
                range: frameBricks.length,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("boxGeometry", {
                        args: [
                            1,
                            1,
                            1
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 585,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                        color: "#0a0a0a",
                        roughness: 0.9,
                        metalness: 0.1
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 586,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    frameBricks.map((d, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Instances$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Instance"], {
                            position: d.pos,
                            scale: d.scale,
                            rotation: d.rot
                        }, i, false, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 592,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 584,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
                position: [
                    -5.75,
                    0,
                    0
                ],
                ref: leftDoor,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                        position: [
                            2.875,
                            11,
                            0
                        ],
                        castShadow: true,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("boxGeometry", {
                                args: [
                                    5.75,
                                    22,
                                    1.2
                                ]
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 603,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                                color: "#0f0505",
                                roughness: 0.35,
                                metalness: 0.65,
                                emissive: "#330000",
                                emissiveIntensity: 0.3
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 604,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 602,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                        position: [
                            2.875,
                            11,
                            0.65
                        ],
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("planeGeometry", {
                                args: [
                                    5.5,
                                    21
                                ]
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 607,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("runeShader", {
                                ref: (el)=>{
                                    magmaRefs.current[0] = el;
                                },
                                uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ff2200"),
                                uIntensity: 1.5,
                                transparent: true
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 608,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 606,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 601,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
                position: [
                    5.75,
                    0,
                    0
                ],
                ref: rightDoor,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                        position: [
                            -2.875,
                            11,
                            0
                        ],
                        castShadow: true,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("boxGeometry", {
                                args: [
                                    5.75,
                                    22,
                                    1.2
                                ]
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 613,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                                color: "#0f0505",
                                roughness: 0.35,
                                metalness: 0.65,
                                emissive: "#330000",
                                emissiveIntensity: 0.3
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 614,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 612,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                        position: [
                            -2.875,
                            11,
                            0.65
                        ],
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("planeGeometry", {
                                args: [
                                    5.5,
                                    21
                                ]
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 617,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("runeShader", {
                                ref: (el)=>{
                                    magmaRefs.current[1] = el;
                                },
                                uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ff2200"),
                                uIntensity: 1.5,
                                transparent: true
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 618,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 616,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 611,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 583,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "73cgNgF0Q0zQo1s/157giqIZ+xc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
}));
_c5 = ConstructedGate;
ConstructedGate.displayName = 'ConstructedGate';
const CobblestoneRoad = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s6((param)=>{
    let { quality, whiteout } = param;
    _s6();
    const stones = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CobblestoneRoad.useMemo[stones]": ()=>{
            const count = quality === 'potato' ? 60 : quality === 'low' ? 80 : quality === 'medium' ? 120 : 150;
            const arr = [];
            for(let i = 0; i < count; i++){
                const z = i * 0.5 - 10;
                const x = (Math.random() - 0.5) * 10;
                arr.push({
                    pos: [
                        x,
                        0.05,
                        z
                    ],
                    scale: 0.5 + Math.random() * 0.5,
                    rot: Math.random() * Math.PI
                });
            }
            return arr;
        }
    }["CobblestoneRoad.useMemo[stones]"], [
        quality
    ]);
    const sphereSegments = quality === 'potato' ? 24 : quality === 'low' ? 32 : quality === 'medium' ? 40 : 48;
    const baseColor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#050303");
    const whiteColor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ffffff");
    const currentColor = baseColor.clone().lerp(whiteColor, whiteout);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                position: [
                    0,
                    -120,
                    0
                ],
                rotation: [
                    -Math.PI / 2,
                    0,
                    0
                ],
                receiveShadow: true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("sphereGeometry", {
                        args: [
                            120,
                            sphereSegments,
                            sphereSegments
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 652,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                        color: currentColor,
                        roughness: 0.9,
                        metalness: 0.1,
                        emissive: whiteColor,
                        emissiveIntensity: whiteout * 2
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 653,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 651,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Instances$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Instances"], {
                range: stones.length,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("cylinderGeometry", {
                        args: [
                            0.6,
                            0.7,
                            0.1,
                            6
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 662,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                        color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#1a1a1a").lerp(whiteColor, whiteout),
                        roughness: 0.8,
                        metalness: 0.2,
                        emissive: whiteColor,
                        emissiveIntensity: whiteout
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 663,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    stones.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Instances$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Instance"], {
                            position: s.pos,
                            scale: [
                                s.scale,
                                1,
                                s.scale
                            ],
                            rotation: [
                                0,
                                s.rot,
                                0
                            ]
                        }, i, false, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 671,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 661,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 650,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "C4QEUgKuKSbrGHPt/ARSofhI/Sk="));
_c6 = CobblestoneRoad;
CobblestoneRoad.displayName = 'CobblestoneRoad';
const Fireflies = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s7((param)=>{
    let { quality } = param;
    _s7();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])();
    const count = quality === 'potato' ? 40 : quality === 'low' ? 60 : quality === 'medium' ? 100 : 140;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "Fireflies.useFrame": (state)=>{
            if (ref.current) {
                ref.current.rotation.y += 0.0008;
                ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 1.5;
            }
        }
    }["Fireflies.useFrame"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
        ref: ref,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sparkles"], {
            count: count,
            scale: [
                30,
                10,
                30
            ],
            size: 3,
            speed: 0.15,
            opacity: 0.7,
            color: "#ffaa00",
            position: [
                0,
                5,
                20
            ]
        }, void 0, false, {
            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
            lineNumber: 698,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 697,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "8QVLrcMdYxPUkj6ry5zpyt6J6X8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
}));
_c7 = Fireflies;
Fireflies.displayName = 'Fireflies';
const GuardianLamps = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s8((param)=>{
    let { whiteout } = param;
    _s8();
    const magmaRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "GuardianLamps.useFrame": (state)=>{
            magmaRefs.current.forEach({
                "GuardianLamps.useFrame": (mat)=>{
                    if (mat) mat.uTime = state.clock.elapsedTime;
                }
            }["GuardianLamps.useFrame"]);
        }
    }["GuardianLamps.useFrame"]);
    const whiteColor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ffffff");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
        children: [
            -9,
            9
        ].map((x, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
                position: [
                    x,
                    0,
                    6
                ],
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shapes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cylinder"], {
                        args: [
                            0.5,
                            0.8,
                            5,
                            8
                        ],
                        position: [
                            0,
                            2.5,
                            0
                        ],
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                            color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#050505").lerp(whiteColor, whiteout),
                            roughness: 0.8,
                            metalness: 0.3,
                            emissive: whiteColor,
                            emissiveIntensity: whiteout
                        }, void 0, false, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 729,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 728,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                        position: [
                            0,
                            6.5,
                            0
                        ],
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("planeGeometry", {
                                args: [
                                    2.5,
                                    6
                                ]
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 738,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("magmaShader", {
                                ref: (el)=>magmaRefs.current[idx] = el,
                                uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ff5500").lerp(whiteColor, whiteout),
                                uIntensity: 2.5 + whiteout * 4,
                                transparent: true,
                                side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DoubleSide"]
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 739,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 737,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pointLight", {
                        position: [
                            0,
                            6,
                            0
                        ],
                        color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ff5500").lerp(whiteColor, whiteout),
                        intensity: 20 + whiteout * 60,
                        distance: 20,
                        decay: 2,
                        castShadow: true
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 747,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, x, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 727,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)))
    }, void 0, false, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 725,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "+AlPx8H3rbMN8O6RnVLwY7WPiCA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
}));
_c8 = GuardianLamps;
GuardianLamps.displayName = 'GuardianLamps';
const EveningStar = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo((param)=>{
    let { quality } = param;
    const sparkleCount = quality === 'potato' ? 3 : quality === 'low' ? 5 : 8;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
        position: [
            -30,
            40,
            -80
        ],
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("sphereGeometry", {
                        args: [
                            1.5,
                            12,
                            12
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 769,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshBasicMaterial", {
                        color: "#ffffff"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 770,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 768,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pointLight", {
                intensity: 4,
                color: "#ffffff",
                distance: 80
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 772,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sparkles"], {
                count: sparkleCount,
                scale: 5,
                size: 12,
                speed: 0,
                opacity: 0.7,
                color: "#ffffff"
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 773,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 767,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
});
_c9 = EveningStar;
EveningStar.displayName = 'EveningStar';
const VolumetricClouds = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s9((param)=>{
    let { quality, whiteout } = param;
    _s9();
    const cloudRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const cloudCount = quality === 'potato' ? 3 : quality === 'low' ? 4 : quality === 'medium' ? 5 : 6;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "VolumetricClouds.useFrame": (state)=>{
            cloudRefs.current.forEach({
                "VolumetricClouds.useFrame": (mat)=>{
                    if (mat) mat.uTime = state.clock.elapsedTime;
                }
            }["VolumetricClouds.useFrame"]);
        }
    }["VolumetricClouds.useFrame"]);
    const whiteColor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ffffff");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
        children: [
            ...Array(cloudCount)
        ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                position: [
                    Math.random() * 80 - 40,
                    25 + Math.random() * 10,
                    -50
                ],
                rotation: [
                    0,
                    0,
                    0.1
                ],
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("planeGeometry", {
                        args: [
                            40,
                            20
                        ]
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 811,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("cloudShader", {
                        ref: (el)=>cloudRefs.current[i] = el,
                        transparent: true,
                        depthWrite: false,
                        uColor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#552222").lerp(whiteColor, whiteout),
                        uDensity: 0.4 + whiteout * 0.8
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 812,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Billboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Billboard"], {}, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 819,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, i, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 802,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)))
    }, void 0, false, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 800,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "u1lODHsq0IVuqqA7WIR00Y0rwPQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
}));
_c10 = VolumetricClouds;
VolumetricClouds.displayName = 'VolumetricClouds';
const FloatingIsland = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo((param)=>{
    let { position, scale = 1, whiteout } = param;
    const whiteColor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#ffffff");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Float$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Float"], {
        speed: 1.5,
        rotationIntensity: 0.15,
        floatIntensity: 0.8,
        position: position,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
            scale: scale,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shapes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cone"], {
                    args: [
                        4,
                        5,
                        6
                    ],
                    rotation: [
                        Math.PI,
                        0,
                        0
                    ],
                    position: [
                        0,
                        -2.5,
                        0
                    ],
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                        color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#2d2d2d").lerp(whiteColor, whiteout),
                        roughness: 0.8,
                        metalness: 0.2,
                        emissive: whiteColor,
                        emissiveIntensity: whiteout
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 843,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 842,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mesh", {
                    position: [
                        0,
                        0,
                        0
                    ],
                    rotation: [
                        -Math.PI / 2,
                        0,
                        0
                    ],
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circleGeometry", {
                            args: [
                                4,
                                24
                            ]
                        }, void 0, false, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 852,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                            color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#1a2e1a").lerp(whiteColor, whiteout),
                            roughness: 0.7,
                            emissive: whiteColor,
                            emissiveIntensity: whiteout
                        }, void 0, false, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 853,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 851,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$shapes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Cylinder"], {
                    args: [
                        0.2,
                        0.4,
                        1.5
                    ],
                    position: [
                        1,
                        0.75,
                        1
                    ],
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meshStandardMaterial", {
                        color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]("#3d2817").lerp(whiteColor, whiteout),
                        roughness: 0.9,
                        emissive: whiteColor,
                        emissiveIntensity: whiteout
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 861,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 860,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
            lineNumber: 841,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 840,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
});
_c11 = FloatingIsland;
FloatingIsland.displayName = 'FloatingIsland';
// =============================================================================
// SCENE CONTENT (OPTIMIZED)
// =============================================================================
const SceneContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo((param)=>{
    let { stage, quality, whiteoutProgress, tunnelProgress, onReachDoor } = param;
    const isOpen = stage === 'push' || stage === 'suction';
    const isWarp = stage === 'suction';
    const starCount = quality === 'potato' ? 1500 : quality === 'low' ? 2500 : quality === 'medium' ? 4000 : 6000;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CameraDirector, {
                stage: stage,
                tunnelProgress: tunnelProgress,
                onReachDoor: onReachDoor
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 898,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PlayerRig, {
                stage: stage
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 899,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("fog", {
                attach: "fog",
                args: [
                    '#1a0505',
                    20,
                    100
                ]
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 901,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Sky$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sky"], {
                sunPosition: [
                    -5,
                    -0.02,
                    -10
                ],
                inclination: 0.6,
                azimuth: 0.25,
                turbidity: 10,
                rayleigh: 2.5,
                mieCoefficient: 0.005
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 902,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$Stars$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Stars"], {
                radius: 100,
                count: starCount,
                fade: true,
                factor: 3.5
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 910,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EveningStar, {
                quality: quality
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 911,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(VolumetricClouds, {
                quality: quality,
                whiteout: whiteoutProgress
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 912,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Fireflies, {
                quality: quality
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 913,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ambientLight", {
                intensity: 0.1 + whiteoutProgress * 1.5,
                color: "#2a1a1a"
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 915,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("directionalLight", {
                position: [
                    0,
                    10,
                    -50
                ],
                intensity: 2.5 + whiteoutProgress * 8,
                color: "#ff3300"
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 916,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("directionalLight", {
                position: [
                    -20,
                    40,
                    20
                ],
                intensity: 0.4 + whiteoutProgress * 4,
                color: "#4444ff",
                castShadow: true,
                "shadow-mapSize": [
                    512,
                    512
                ]
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 921,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("directionalLight", {
                position: [
                    5,
                    3,
                    10
                ],
                intensity: 1.2 + whiteoutProgress * 8,
                color: "#88ccff"
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 928,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pointLight", {
                position: [
                    0,
                    9,
                    -5
                ],
                intensity: isOpen ? 200 + whiteoutProgress * 400 : 4,
                color: "#ff0000",
                distance: 50,
                decay: 2
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 933,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("group", {
                position: [
                    0,
                    -2,
                    0
                ],
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ConstructedGate, {
                        isOpen: isOpen,
                        quality: quality
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 942,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CobblestoneRoad, {
                        quality: quality,
                        whiteout: whiteoutProgress
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 943,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GuardianLamps, {
                        whiteout: whiteoutProgress
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 944,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PortalCoreLight, {
                        stage: stage
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 945,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PortalVortex, {
                        stage: stage
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 946,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 941,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WarpTunnel, {
                active: isOpen,
                quality: quality,
                stage: stage,
                glitchIntensity: 0
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 949,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WormholeTunnel, {
                stage: stage,
                tunnelProgress: tunnelProgress
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 950,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FloatingIsland, {
                position: [
                    -25,
                    5,
                    20
                ],
                scale: 1.5,
                whiteout: whiteoutProgress
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 951,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FloatingIsland, {
                position: [
                    30,
                    8,
                    10
                ],
                scale: 2,
                whiteout: whiteoutProgress
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 952,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$postprocessing_3da87f7da575ec7860ff76998984d9bf$2f$node_modules$2f40$react$2d$three$2f$postprocessing$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EffectComposer"], {
                enableNormalPass: false,
                multisampling: 0,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$postprocessing_3da87f7da575ec7860ff76998984d9bf$2f$node_modules$2f40$react$2d$three$2f$postprocessing$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bloom"], {
                        luminanceThreshold: 0.25,
                        mipmapBlur: true,
                        intensity: isOpen ? 3.5 + whiteoutProgress * 4 : 1.5,
                        radius: 0.5,
                        levels: quality === 'potato' ? 5 : quality === 'low' ? 6 : 7
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 955,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$postprocessing_3da87f7da575ec7860ff76998984d9bf$2f$node_modules$2f40$react$2d$three$2f$postprocessing$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChromaticAberration"], {
                        offset: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector2"](isWarp ? 0.2 : 0.0008, isWarp ? 0.2 : 0.0008),
                        radialModulation: false,
                        modulationOffset: 0
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 962,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    isWarp ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$postprocessing_3da87f7da575ec7860ff76998984d9bf$2f$node_modules$2f40$react$2d$three$2f$postprocessing$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Glitch"], {
                        delay: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector2"](0.05, 0.15),
                        duration: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector2"](0.2, 0.6),
                        strength: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector2"](0.8, 1.5),
                        active: true,
                        ratio: 0.95
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 971,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {}, void 0, false),
                    quality !== 'potato' && quality !== 'low' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$postprocessing_3da87f7da575ec7860ff76998984d9bf$2f$node_modules$2f40$react$2d$three$2f$postprocessing$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DepthOfField"], {
                        focusDistance: 0.02,
                        focalLength: 0.5,
                        bokehScale: 1.5,
                        height: 360
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 980,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {}, void 0, false),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$postprocessing_3da87f7da575ec7860ff76998984d9bf$2f$node_modules$2f40$react$2d$three$2f$postprocessing$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vignette"], {
                        offset: 0.3 - whiteoutProgress * 0.3,
                        darkness: 0.5 - whiteoutProgress * 0.5,
                        eskil: false,
                        blendFunction: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$postprocessing$40$6$2e$39$2e$3_three$40$0$2e$182$2e$0$2f$node_modules$2f$postprocessing$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BlendFunction"].NORMAL
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 987,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$postprocessing_3da87f7da575ec7860ff76998984d9bf$2f$node_modules$2f40$react$2d$three$2f$postprocessing$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToneMapping"], {
                        mode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$postprocessing$40$6$2e$39$2e$3_three$40$0$2e$182$2e$0$2f$node_modules$2f$postprocessing$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToneMappingMode"].ACES_FILMIC
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 993,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 954,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
});
_c12 = SceneContent;
SceneContent.displayName = 'SceneContent';
// =============================================================================
// CAMERA DIRECTOR (OPTIMIZED)
// =============================================================================
const CameraDirector = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s10((param)=>{
    let { stage, tunnelProgress, onReachDoor } = param;
    _s10();
    const { camera } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__C__as__useThree$3e$__["useThree"])();
    const currentTargetPos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 80, 80));
    const currentLookAt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 9, 0));
    const currentFov = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(60);
    const walkStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const tunnelStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const introStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const introStartPos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]());
    const lookSway = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const orbitOffset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"])({
        "CameraDirector.useFrame": (state, delta)=>{
            perfMonitor.update();
            const t = state.clock.elapsedTime;
            const desiredPos = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
            const desiredLook = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
            let targetFov = 60;
            let targetRoll = 0;
            let posAccel = 1.3;
            let drag = 1.0;
            desiredPos.copy(currentTargetPos.current);
            desiredLook.copy(currentLookAt.current);
            switch(stage){
                case 'loading':
                    {
                        desiredPos.set(0, 80, 80);
                        desiredLook.set(0, 9, 0);
                        break;
                    }
                case 'intro':
                    {
                        if (introStart.current === null) {
                            introStart.current = t;
                            const r = Math.random();
                            if (r < 0.1) introStartPos.current.set(0, -150, 0); // underground (rare)
                            else if (r < 0.28) introStartPos.current.set(0, 300, 0); // top of sky
                            else if (r < 0.46) introStartPos.current.set(300, 20, 0); // east
                            else if (r < 0.64) introStartPos.current.set(-300, 20, 0); // west
                            else if (r < 0.82) introStartPos.current.set(0, 20, -300); // north
                            else introStartPos.current.set(0, 20, 300); // south
                        }
                        const ft = t - introStart.current;
                        const flyDuration = 12.0; // 12 seconds of cinematic entry
                        const p = Math.min(ft / flyDuration, 1.0);
                        const easeOut = 1 - Math.pow(1 - p, 3);
                        const angle = easeOut * 4 * Math.PI; // 2 laps
                        const radius = 300 * (1 - easeOut) + 42 * easeOut;
                        const sx = introStartPos.current.x;
                        const sy = introStartPos.current.y;
                        const sz = introStartPos.current.z;
                        const targetX = Math.sin(angle) * radius;
                        const targetZ = Math.cos(angle) * radius;
                        const targetY = sy * (1 - easeOut) + 10 * easeOut;
                        desiredPos.set(sx * (1 - easeOut) + targetX, targetY, sz * (1 - easeOut) + targetZ);
                        desiredLook.set(0, 9 * easeOut, 0);
                        targetFov = 90 - easeOut * 30;
                        targetRoll = Math.sin(easeOut * Math.PI) * 0.5;
                        posAccel = 5.0;
                        drag = 0.8;
                        // End intro stage automatically after duration
                        if (p === 1.0) {
                            orbitOffset.current = t;
                        }
                        break;
                    }
                case 'tunnel':
                    {
                        if (tunnelStart.current === null) tunnelStart.current = t;
                        const tt = t - tunnelStart.current;
                        const p1 = TUNNEL_CURVE.getPointAt(Math.min(1.0, tunnelProgress));
                        const p2 = TUNNEL_CURVE.getPointAt(Math.min(1.0, tunnelProgress + 0.05));
                        desiredPos.set(p1.x, p1.y, p1.z - 50);
                        desiredPos.x += Math.sin(tt * 25) * 0.8 + Math.sin(tt * 3) * 3;
                        desiredPos.y += Math.cos(tt * 22) * 0.8 + Math.cos(tt * 3.5) * 3;
                        desiredLook.set(p2.x, p2.y, p2.z - 50);
                        targetFov = 90 + tunnelProgress * 40;
                        targetRoll = Math.sin(tt * 4.0) * 1.5 + tt * 2.5;
                        posAccel = 25;
                        drag = 0.5;
                        break;
                    }
                case 'idle':
                    {
                        const relTime = t - orbitOffset.current;
                        const r = 42;
                        desiredPos.x = Math.sin(relTime * 0.04) * r;
                        desiredPos.z = Math.cos(relTime * 0.04) * r;
                        desiredPos.y = 9 + Math.cos(relTime * 0.12) * 1.5;
                        desiredLook.set(0, 10, 0);
                        break;
                    }
                case 'drop':
                    {
                        desiredPos.set(0, 0.8, 35);
                        desiredLook.set(0, -5, 10);
                        break;
                    }
                case 'crouch':
                    {
                        desiredPos.set(0, 0.5, 35);
                        desiredLook.set(0, 0, 30);
                        break;
                    }
                case 'stand':
                    {
                        desiredPos.set(0, 1.8, 35);
                        desiredLook.set(0, 7, 0);
                        break;
                    }
                case 'confusion':
                    {
                        desiredPos.set(0, 1.8, 35);
                        desiredLook.set(0.5, 1.5, 34.5);
                        lookSway.current += delta * 2.5;
                        desiredLook.x += Math.sin(lookSway.current) * 0.8;
                        break;
                    }
                case 'walk':
                case 'brace_popup':
                    {
                        if (walkStart.current === null && stage === 'walk') walkStart.current = t;
                        const wt = walkStart.current !== null ? t - walkStart.current : 0;
                        const walkSpeed = 5.2;
                        const forwardZ = Math.max(10.5, 48 - wt * walkSpeed);
                        const headBob = stage === 'walk' ? Math.sin(wt * 6.0) * 0.08 : 0;
                        const headSway = stage === 'walk' ? Math.sin(wt * 3.0) * 0.06 : 0;
                        desiredPos.set(headSway, 1.8 + headBob, forwardZ);
                        desiredLook.set(0, 7, 0);
                        if (stage === 'walk' && forwardZ <= 10.6) {
                            onReachDoor();
                        }
                        break;
                    }
                case 'push':
                    {
                        desiredPos.set(0, 1.8, 6);
                        desiredLook.set(0, 1.8, -10);
                        break;
                    }
                case 'suction':
                    {
                        desiredPos.set(0, 0, -45);
                        desiredLook.set(0, 0, -100);
                        targetFov = 105;
                        posAccel = 4.0;
                        break;
                    }
            }
            const smoothSpeed = posAccel;
            currentTargetPos.current.lerp(desiredPos, delta * smoothSpeed);
            currentLookAt.current.lerp(desiredLook, delta * (smoothSpeed * 0.75));
            currentFov.current = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MathUtils"].lerp(currentFov.current, targetFov, delta * 1.8);
            camera.position.copy(currentTargetPos.current);
            camera.lookAt(currentLookAt.current);
            if (camera instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$three$40$0$2e$182$2e$0$2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerspectiveCamera"]) {
                camera.fov = currentFov.current;
                camera.updateProjectionMatrix();
            }
        }
    }["CameraDirector.useFrame"]);
    return null;
}, "JE0dn6UqNdumlu4l8Py9ptiUHWE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__C__as__useThree$3e$__["useThree"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$events$2d$b389eeca$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__useFrame$3e$__["useFrame"]
    ];
}));
_c13 = CameraDirector;
CameraDirector.displayName = 'CameraDirector';
// =============================================================================
// UI COMPONENTS
// =============================================================================
const CinematicTitleIntro = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s11((param)=>{
    let { onComplete } = param;
    _s11();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CinematicTitleIntro.useEffect": ()=>{
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].init();
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('title', 0.8);
            const timer = setTimeout({
                "CinematicTitleIntro.useEffect.timer": ()=>{
                    onComplete();
                }
            }["CinematicTitleIntro.useEffect.timer"], 4800);
            return ({
                "CinematicTitleIntro.useEffect": ()=>{
                    document.body.style.overflow = originalOverflow;
                    clearTimeout(timer);
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].stop('title', 300);
                }
            })["CinematicTitleIntro.useEffect"];
        }
    }["CinematicTitleIntro.useEffect"], [
        onComplete
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        onClick: ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('glass', 0.6);
            onComplete();
        },
        onMouseEnter: ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('crystal', 0.3);
        },
        className: "fixed inset-0 z-[99999] bg-[#000000] flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none touch-none pointer-events-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-[#020205]"
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 1224,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute w-[600px] h-[600px] rounded-full bg-primary-950/20 blur-[120px] pointer-events-none"
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 1225,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    scale: 0.94
                },
                animate: {
                    opacity: 1,
                    scale: 1
                },
                exit: {
                    opacity: 0,
                    scale: 1.04
                },
                transition: {
                    duration: 3.5,
                    ease: "easeOut"
                },
                className: "relative z-10 text-center flex flex-col items-center justify-center w-full px-4 max-w-5xl",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative w-full flex flex-col items-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-4xl sm:text-6xl md:text-8xl font-normal font-gradvis text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-zinc-400 tracking-[0.25em] sm:tracking-[0.45em] ml-[0.25em] sm:ml-[0.45em] uppercase drop-shadow-[0_0_35px_rgba(220,38,38,0.5)]",
                            style: {
                                fontFamily: 'var(--font-gradvis), serif'
                            },
                            children: "SHADOW GARDEN"
                        }, void 0, false, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 1235,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative w-full max-w-3xl h-10 mt-3 overflow-visible flex items-center justify-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent -translate-y-1/2"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                    lineNumber: 1243,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        x: "-100%",
                                        opacity: 0,
                                        scale: 0.3
                                    },
                                    animate: {
                                        x: [
                                            "-100%",
                                            "-30%",
                                            "20%",
                                            "45%",
                                            "50%"
                                        ],
                                        opacity: [
                                            0,
                                            1,
                                            1,
                                            1,
                                            0.95
                                        ],
                                        scale: [
                                            0.3,
                                            1.2,
                                            1.0,
                                            1.1,
                                            1.0
                                        ]
                                    },
                                    transition: {
                                        duration: 4.2,
                                        ease: [
                                            0.1,
                                            0.9,
                                            0.2,
                                            1
                                        ],
                                        times: [
                                            0,
                                            0.25,
                                            0.6,
                                            0.85,
                                            1
                                        ]
                                    },
                                    className: "absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute w-24 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent blur-[0.3px]"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                            lineNumber: 1259,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute w-8 h-8 rounded-full bg-red-600/40 blur-md"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                            lineNumber: 1260,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute right-full w-32 h-[1px] bg-gradient-to-l from-red-400 via-transparent to-transparent opacity-60"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                            lineNumber: 1261,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                    lineNumber: 1245,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 1242,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 1234,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 1227,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 1212,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "OD7bBpZva5O2jO+Puf00hKivP7c="));
_c14 = CinematicTitleIntro;
CinematicTitleIntro.displayName = 'CinematicTitleIntro';
const AudioPermissionModal = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s12((param)=>{
    let { onGrant } = param;
    _s12();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AudioPermissionModal.useEffect": ()=>{
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return ({
                "AudioPermissionModal.useEffect": ()=>{
                    document.body.style.overflow = originalOverflow;
                }
            })["AudioPermissionModal.useEffect"];
        }
    }["AudioPermissionModal.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[99999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 overflow-hidden touch-none select-none pointer-events-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
            initial: {
                opacity: 0,
                scale: 0.95
            },
            animate: {
                opacity: 1,
                scale: 1
            },
            className: "relative max-w-sm sm:max-w-md w-full mx-auto bg-[#0a0505]/95 border border-red-500/40 p-6 sm:p-8 rounded-3xl shadow-[0_0_60px_rgba(220,38,38,0.4)] text-center overflow-hidden",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 1289,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-14 h-14 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$fingerprint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Fingerprint$3e$__["Fingerprint"], {
                        className: "w-7 h-7 animate-pulse"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 1292,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 1291,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    className: "text-lg sm:text-xl text-white font-bold tracking-[0.2em] font-mono uppercase mb-2",
                    children: "AUDIO PERMISSION"
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 1295,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-300 text-xs sm:text-sm font-mono mb-6 leading-relaxed",
                    children: "Enable audio for cinematic portal soundscapes, telepathy voices, and spatial effects."
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 1299,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                    onMouseEnter: ()=>{
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('crystal', 0.4);
                    },
                    onClick: ()=>{
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('glass', 0.6);
                        onGrant();
                    },
                    className: "w-full bg-red-600 hover:bg-red-500 text-white font-mono font-bold tracking-widest uppercase py-3 rounded-xl shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all active:scale-95 cursor-pointer",
                    children: "ENABLE AUDIO & ENTER"
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 1303,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
            lineNumber: 1284,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 1283,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "OD7bBpZva5O2jO+Puf00hKivP7c="));
_c15 = AudioPermissionModal;
AudioPermissionModal.displayName = 'AudioPermissionModal';
const BracePopup = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo((param)=>{
    let { onReady, gender } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden touch-none pointer-events-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
            initial: {
                opacity: 0,
                scale: 0.95
            },
            animate: {
                opacity: 1,
                scale: 1
            },
            className: "relative max-w-sm sm:max-w-md w-full mx-auto bg-[#0a0505]/95 border border-primary-900/60 p-5 sm:p-6 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-center gap-3 mb-4 border-b border-primary-900/30 pb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-2 bg-primary-950/60 rounded-full border border-primary-500/40",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                className: "w-5 h-5 text-primary-500 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 1327,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 1326,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-left",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-base sm:text-lg text-white font-bold tracking-[0.15em] font-mono uppercase",
                                children: "DIMENSION ALERT"
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 1330,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 1329,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 1325,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-300 text-sm mb-5 leading-relaxed font-mono text-left",
                    children: "We are not going beyond Shadow Garden, we are going beyond our reality and going to a place known as Otakuverse which has the guild Shadow Garden where we will operate everything. Brace yourself and push the door."
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 1336,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                    onMouseEnter: ()=>{
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('crystal', 0.4);
                    },
                    onClick: ()=>{
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('glass', 0.6);
                        onReady();
                    },
                    className: "w-full bg-primary-900/80 hover:bg-primary-800 text-white border border-primary-500/50 uppercase tracking-widest font-mono pointer-events-auto cursor-pointer",
                    children: "OK, I'm ready"
                }, void 0, false, {
                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                    lineNumber: 1340,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
            lineNumber: 1320,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 1319,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
});
_c16 = BracePopup;
BracePopup.displayName = 'BracePopup';
const AnimationPreferencePopup = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].memo(_s13((param)=>{
    let { onChoice } = param;
    _s13();
    const [pause7, setPause7] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [never, setNever] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnimationPreferencePopup.useEffect": ()=>{
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return ({
                "AnimationPreferencePopup.useEffect": ()=>{
                    document.body.style.overflow = originalOverflow;
                }
            })["AnimationPreferencePopup.useEffect"];
        }
    }["AnimationPreferencePopup.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden touch-none pointer-events-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-gradient-to-t from-primary-950/20 via-black to-black pointer-events-none"
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 1376,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    scale: 0.95
                },
                animate: {
                    opacity: 1,
                    scale: 1
                },
                transition: {
                    duration: 0.3,
                    ease: "easeOut"
                },
                className: "relative max-w-sm sm:max-w-md w-full mx-auto bg-[#0a0505]/95 border border-primary-900/60 p-5 sm:p-6 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-pulse"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 1384,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-center gap-3 mb-4 border-b border-primary-900/30 pb-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-2 bg-primary-950/60 rounded-full border border-primary-500/40 shadow-[0_0_15px_rgba(220,38,38,0.3)]",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$power$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Power$3e$__["Power"], {
                                    className: "w-5 h-5 text-primary-500 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                    lineNumber: 1388,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 1387,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-left",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-base sm:text-lg text-white font-bold tracking-[0.15em] font-mono uppercase",
                                        children: "SYSTEM DETECTED"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                        lineNumber: 1391,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] text-primary-400/80 uppercase tracking-widest font-mono",
                                        children: "ANIMATION SETTINGS"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                        lineNumber: 1394,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 1390,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 1386,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-300 text-xs mb-5 leading-relaxed font-mono",
                        children: "Play the cinematic portal intro?"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 1400,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-2.5 mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                onMouseEnter: ()=>{
                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('crystal', 0.4);
                                },
                                onClick: ()=>{
                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('glass', 0.6);
                                    onChoice(true, never ? 9999 : pause7 ? 7 : 0);
                                },
                                className: "group relative overflow-hidden bg-primary-900/50 hover:bg-primary-700 border border-primary-500/60 hover:border-primary-400 transition-all duration-300 h-10 rounded-xl shadow-md cursor-pointer",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-center gap-2.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlayCircle$3e$__["PlayCircle"], {
                                            className: "w-4 h-4 text-primary-400 group-hover:text-white"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                            lineNumber: 1415,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white font-bold tracking-widest text-xs font-mono",
                                            children: "PLAY"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                            lineNumber: 1416,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                    lineNumber: 1414,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 1405,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                onMouseEnter: ()=>{
                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('crystal', 0.4);
                                },
                                onClick: ()=>{
                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('glass', 0.6);
                                    onChoice(false, never ? 9999 : pause7 ? 7 : 0);
                                },
                                variant: "outline",
                                className: "bg-transparent border-white/10 hover:bg-white/10 hover:border-white/20 h-10 rounded-xl cursor-pointer",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-center gap-2.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$fast$2d$forward$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FastForward$3e$__["FastForward"], {
                                            className: "w-3.5 h-3.5 text-gray-400"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                            lineNumber: 1431,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-gray-300 group-hover:text-white transition-colors tracking-widest text-xs font-mono",
                                            children: "SKIP"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                            lineNumber: 1432,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                    lineNumber: 1430,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 1420,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 1404,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-black/60 rounded-xl p-3 border border-white/10 flex flex-row items-center justify-between text-left gap-2 flex-nowrap whitespace-nowrap overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-1 sm:space-x-2 flex-shrink-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"], {
                                        id: "pause",
                                        checked: pause7,
                                        className: "border-primary-900/50 data-[state=checked]:bg-primary-900 data-[state=checked]:text-white flex-shrink-0",
                                        onCheckedChange: (c)=>{
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('glass', 0.5);
                                            setPause7(!!c);
                                            if (c) setNever(false);
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                        lineNumber: 1439,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "pause",
                                        onMouseEnter: ()=>{
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('crystal', 0.3);
                                        },
                                        className: "text-[10px] sm:text-xs text-gray-400 font-mono cursor-pointer hover:text-primary-400 transition-colors flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$400$2e$0_react$40$18$2e$3$2e$1$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                className: "w-3 h-3 text-primary-500 hidden sm:block"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                                lineNumber: 1455,
                                                columnNumber: 29
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            " Skip 7 days"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                        lineNumber: 1450,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 1438,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-1 sm:space-x-2 flex-shrink-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"], {
                                        id: "never",
                                        checked: never,
                                        className: "border-primary-900/50 data-[state=checked]:bg-primary-900 data-[state=checked]:text-white flex-shrink-0",
                                        onCheckedChange: (c)=>{
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('glass', 0.5);
                                            setNever(!!c);
                                            if (c) setPause7(false);
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                        lineNumber: 1459,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "never",
                                        onMouseEnter: ()=>{
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('crystal', 0.3);
                                        },
                                        className: "text-[10px] sm:text-xs text-gray-400 font-mono cursor-pointer hover:text-primary-400 transition-colors",
                                        children: "Always skip"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                        lineNumber: 1470,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 1458,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 1437,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 1378,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
        lineNumber: 1375,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "QV4o/lvcCSWG9mzVpgv/JdqUANc="));
_c17 = AnimationPreferencePopup;
AnimationPreferencePopup.displayName = 'AnimationPreferencePopup';
function ShadowGardenPortal(param) {
    let { startTransition, onComplete, onSceneReady } = param;
    _s14();
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [appState, setAppState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('checking');
    const [gender, setGender] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [stage, setStage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('loading');
    const [whiteout, setWhiteout] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [whiteoutOpacity, setWhiteoutOpacity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0.45);
    const [whiteoutProgress, setWhiteoutProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [tunnelProgress, setTunnelProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [showBracePopup, setShowBracePopup] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [shake, setShake] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [skipped, setSkipped] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShadowGardenPortal.useEffect": ()=>{
            setMounted(true);
        }
    }["ShadowGardenPortal.useEffect"], []);
    const [quality, setQuality] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "ShadowGardenPortal.useState": ()=>{
            if ("TURBOPACK compile-time truthy", 1) return detectPerformanceTier();
            //TURBOPACK unreachable
            ;
        }
    }["ShadowGardenPortal.useState"]);
    const onSceneReadyRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(onSceneReady);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShadowGardenPortal.useEffect": ()=>{
            onSceneReadyRef.current = onSceneReady;
        }
    }["ShadowGardenPortal.useEffect"], [
        onSceneReady
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShadowGardenPortal.useEffect": ()=>{
            setQuality(detectPerformanceTier());
            return ({
                "ShadowGardenPortal.useEffect": ()=>{
                    const sfxObj = window.shadowAudio || window.sfx || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"];
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stopLoop) {
                        sfxObj.stopLoop('tunnelWind');
                        sfxObj.stopLoop('bhHum');
                        sfxObj.stopLoop('droneWind');
                    }
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stopAll) sfxObj.stopAll(300);
                }
            })["ShadowGardenPortal.useEffect"];
        }
    }["ShadowGardenPortal.useEffect"], []);
    const triggerSkip = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ShadowGardenPortal.useCallback[triggerSkip]": ()=>{
            var _onSceneReadyRef_current;
            const sfxObj = window.shadowAudio || window.sfx || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"];
            if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stopLoop) {
                sfxObj.stopLoop('tunnelWind');
                sfxObj.stopLoop('bhHum');
                sfxObj.stopLoop('droneWind');
            }
            if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stopAll) sfxObj.stopAll();
            setSkipped(true);
            (_onSceneReadyRef_current = onSceneReadyRef.current) === null || _onSceneReadyRef_current === void 0 ? void 0 : _onSceneReadyRef_current.call(onSceneReadyRef);
        }
    }["ShadowGardenPortal.useCallback[triggerSkip]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShadowGardenPortal.useEffect": ()=>{
            const hasAudioPermit = localStorage.getItem('shadow_audio_permitted') === 'true' || localStorage.getItem('guild_audio_permit') === 'true';
            const neverAsk = localStorage.getItem('anim_never_ask');
            const pauseUntil = localStorage.getItem('anim_pause_until');
            const now = new Date().getTime();
            const isSkipActive = neverAsk === 'true' || pauseUntil && parseInt(pauseUntil) > now;
            if (!hasAudioPermit) {
                setAppState('audio_permit');
            } else if (isSkipActive) {
                triggerSkip();
            } else {
                setAppState('anim_choice');
            }
        }
    }["ShadowGardenPortal.useEffect"], [
        triggerSkip
    ]);
    const handleGrantAudio = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ShadowGardenPortal.useCallback[handleGrantAudio]": ()=>{
            localStorage.setItem('shadow_audio_permitted', 'true');
            localStorage.setItem('guild_audio_permit', 'true');
            localStorage.setItem('guest_gender', 'boy');
            localStorage.setItem('shadow_traveller_gender', 'boy');
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
            setAppState('cinematic_intro');
        }
    }["ShadowGardenPortal.useCallback[handleGrantAudio]"], []);
    const handleCinematicIntroComplete = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ShadowGardenPortal.useCallback[handleCinematicIntroComplete]": ()=>{
            setAppState('loading');
        }
    }["ShadowGardenPortal.useCallback[handleCinematicIntroComplete]"], []);
    const handleAnimChoice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ShadowGardenPortal.useCallback[handleAnimChoice]": (play, days)=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].unlock();
            localStorage.setItem('anim_preference', play ? 'play' : 'skip');
            if (days > 0) {
                if (days === 9999) {
                    localStorage.setItem('anim_never_ask', 'true');
                } else {
                    localStorage.setItem('anim_pause_until', (new Date().getTime() + days * 86400000).toString());
                }
            }
            if (play) {
                setAppState('cinematic_intro');
            } else {
                triggerSkip();
            }
        }
    }["ShadowGardenPortal.useCallback[handleAnimChoice]"], [
        triggerSkip
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShadowGardenPortal.useEffect": ()=>{
            if (appState !== 'loading') return;
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].init();
            setAppState('running');
            setStage('intro');
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].playRandomBGM();
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('drone', 0.6, true);
        }
    }["ShadowGardenPortal.useEffect"], [
        appState
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShadowGardenPortal.useEffect": ()=>{
            if (appState === 'running' && stage === 'intro') {
                const timeout = setTimeout({
                    "ShadowGardenPortal.useEffect.timeout": ()=>{
                        var _onSceneReadyRef_current;
                        setStage('idle');
                        (_onSceneReadyRef_current = onSceneReadyRef.current) === null || _onSceneReadyRef_current === void 0 ? void 0 : _onSceneReadyRef_current.call(onSceneReadyRef);
                    }
                }["ShadowGardenPortal.useEffect.timeout"], 12500); // Wait for the 12s cinematic flyover + 0.5s buffer
                return ({
                    "ShadowGardenPortal.useEffect": ()=>clearTimeout(timeout)
                })["ShadowGardenPortal.useEffect"];
            }
        }
    }["ShadowGardenPortal.useEffect"], [
        appState,
        stage
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShadowGardenPortal.useEffect": ()=>{
            if (stage === 'push') {
                const interval = setInterval({
                    "ShadowGardenPortal.useEffect.interval": ()=>{
                        setWhiteoutProgress({
                            "ShadowGardenPortal.useEffect.interval": (prev)=>Math.min(prev + 0.015, 1)
                        }["ShadowGardenPortal.useEffect.interval"]);
                    }
                }["ShadowGardenPortal.useEffect.interval"], 50);
                return ({
                    "ShadowGardenPortal.useEffect": ()=>clearInterval(interval)
                })["ShadowGardenPortal.useEffect"];
            }
        }
    }["ShadowGardenPortal.useEffect"], [
        stage
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShadowGardenPortal.useEffect": ()=>{
            if (stage === 'tunnel') {
                const interval = setInterval({
                    "ShadowGardenPortal.useEffect.interval": ()=>{
                        setTunnelProgress({
                            "ShadowGardenPortal.useEffect.interval": (prev)=>Math.min(prev + 0.005, 1.2)
                        }["ShadowGardenPortal.useEffect.interval"]);
                    }
                }["ShadowGardenPortal.useEffect.interval"], 30);
                return ({
                    "ShadowGardenPortal.useEffect": ()=>clearInterval(interval)
                })["ShadowGardenPortal.useEffect"];
            }
        }
    }["ShadowGardenPortal.useEffect"], [
        stage
    ]);
    const handleReachDoor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ShadowGardenPortal.useCallback[handleReachDoor]": ()=>{
            setStage('brace_popup');
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].stop('step');
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].stop('drone', 500);
            setShowBracePopup(true);
        }
    }["ShadowGardenPortal.useCallback[handleReachDoor]"], []);
    const performEntrySequence = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ShadowGardenPortal.useCallback[performEntrySequence]": ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].init();
            setStage('drop');
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('drone', 0.6, true);
            setTimeout({
                "ShadowGardenPortal.useCallback[performEntrySequence]": ()=>{
                    setStage('crouch');
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('drop', 0.5);
                    setShake(3.5);
                }
            }["ShadowGardenPortal.useCallback[performEntrySequence]"], 1500);
            setTimeout({
                "ShadowGardenPortal.useCallback[performEntrySequence]": ()=>{
                    setStage('stand');
                    setShake(0);
                }
            }["ShadowGardenPortal.useCallback[performEntrySequence]"], 2500);
            setTimeout({
                "ShadowGardenPortal.useCallback[performEntrySequence]": ()=>{
                    setStage('confusion');
                }
            }["ShadowGardenPortal.useCallback[performEntrySequence]"], 3500);
            setTimeout({
                "ShadowGardenPortal.useCallback[performEntrySequence]": ()=>{
                    setStage('walk');
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"].play('step', 0.4, true);
                }
            }["ShadowGardenPortal.useCallback[performEntrySequence]"], 5500);
        }
    }["ShadowGardenPortal.useCallback[performEntrySequence]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShadowGardenPortal.useEffect": ()=>{
            if (startTransition) {
                if (skipped || stage === 'loading') {
                    onComplete();
                } else if (stage === 'idle' || stage === 'intro') {
                    performEntrySequence();
                } else {
                    // If in any other stage, complete smoothly
                    onComplete();
                }
            }
        }
    }["ShadowGardenPortal.useEffect"], [
        startTransition,
        stage,
        skipped,
        onComplete,
        performEntrySequence
    ]);
    const handleBraceReady = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ShadowGardenPortal.useCallback[handleBraceReady]": ()=>{
            const sfxObj = window.shadowAudio || window.sfx || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$audioManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sfx"];
            setShowBracePopup(false);
            setStage('push');
            if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.play) {
                sfxObj.play('door', 0.8);
                sfxObj.play('portal', 0.8, true);
                sfxObj.play('grind', 0.5);
                sfxObj.play('boom', 0.5);
            }
            setShake(0.8);
            setTimeout({
                "ShadowGardenPortal.useCallback[handleBraceReady]": ()=>{
                    setStage('suction');
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.play) {
                        sfxObj.play('suction', 0.7);
                        sfxObj.play('glitch', 0.8, true); // Glitch sound starts right from portal suction!
                    }
                    setShake(8.0);
                }
            }["ShadowGardenPortal.useCallback[handleBraceReady]"], 2000);
            setTimeout({
                "ShadowGardenPortal.useCallback[handleBraceReady]": ()=>{
                    setWhiteoutOpacity(0.45); // Reduced opacity for white flash when entering tunnel
                    setWhiteout(true);
                }
            }["ShadowGardenPortal.useCallback[handleBraceReady]"], 2300);
            setTimeout({
                "ShadowGardenPortal.useCallback[handleBraceReady]": ()=>{
                    setStage('tunnel');
                    setTunnelProgress(0);
                    setWhiteout(false); // Fade out the whiteout for the tunnel
                    setShake(0); // Remove camera shake in tunnel
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stop) {
                        sfxObj.stop('portal', 500);
                    }
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.play) {
                        sfxObj.play('tunnel', 0.8, true);
                        sfxObj.play('bh_hum', 0.35);
                    }
                }
            }["ShadowGardenPortal.useCallback[handleBraceReady]"], 5000);
            setTimeout({
                "ShadowGardenPortal.useCallback[handleBraceReady]": ()=>{
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.play) sfxObj.play('tunnel_end', 0.7);
                }
            }["ShadowGardenPortal.useCallback[handleBraceReady]"], 9500);
            // Fade back to white smoothly over 1.5s right before tunnel ends
            setTimeout({
                "ShadowGardenPortal.useCallback[handleBraceReady]": ()=>{
                    setWhiteoutOpacity(0.85);
                    setWhiteout(true);
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stop) {
                        sfxObj.stop('glitch', 500); // Stop glitch sound before destination!
                    }
                }
            }["ShadowGardenPortal.useCallback[handleBraceReady]"], 10500);
            setTimeout({
                "ShadowGardenPortal.useCallback[handleBraceReady]": ()=>{
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stop) {
                        sfxObj.stop('tunnel', 500);
                        sfxObj.stop('glitch', 300);
                    }
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stopLoop) {
                        sfxObj.stopLoop('tunnelWind', 300);
                        sfxObj.stopLoop('bhHum', 300);
                        sfxObj.stopLoop('droneWind', 300);
                    }
                    setWhiteoutOpacity(1);
                    setWhiteout(true);
                    setStage('arrival');
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.play) {
                        sfxObj.play('destination', 0.9);
                    }
                }
            }["ShadowGardenPortal.useCallback[handleBraceReady]"], 12000); // End of tunnel
            setTimeout({
                "ShadowGardenPortal.useCallback[handleBraceReady]": ()=>{
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stop) {
                        sfxObj.stop('tunnel', 100);
                        sfxObj.stop('portal', 100);
                        sfxObj.stop('drone', 100);
                        sfxObj.stop('glitch', 100);
                    }
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stopLoop) {
                        sfxObj.stopLoop('tunnelWind', 100);
                        sfxObj.stopLoop('bhHum', 100);
                        sfxObj.stopLoop('droneWind', 100);
                    }
                    if (sfxObj === null || sfxObj === void 0 ? void 0 : sfxObj.stopAll) sfxObj.stopAll(100);
                    onComplete();
                }
            }["ShadowGardenPortal.useCallback[handleBraceReady]"], 13500); // Complete after 1.5 seconds
        }
    }["ShadowGardenPortal.useCallback[handleBraceReady]"], [
        onComplete
    ]);
    if (!mounted || skipped || appState === 'checking') return null;
    if (appState === 'audio_permit') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AudioPermissionModal, {
            onGrant: handleGrantAudio
        }, void 0, false, {
            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
            lineNumber: 1772,
            columnNumber: 16
        }, this);
    }
    if (appState === 'anim_choice') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AnimationPreferencePopup, {
            onChoice: handleAnimChoice
        }, void 0, false, {
            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
            lineNumber: 1776,
            columnNumber: 16
        }, this);
    }
    const dpr = quality === 'potato' ? [
        0.4,
        0.7
    ] : quality === 'low' ? [
        0.5,
        0.9
    ] : quality === 'medium' ? [
        0.7,
        1
    ] : [
        1,
        1.25
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-0 bg-black pointer-events-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                        children: appState === 'cinematic_intro' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CinematicTitleIntro, {
                            onComplete: handleCinematicIntroComplete
                        }, void 0, false, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 1787,
                            columnNumber: 21
                        }, this) : null
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 1785,
                        columnNumber: 13
                    }, this),
                    appState === 'running' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0
                        },
                        animate: {
                            opacity: 1
                        },
                        transition: {
                            duration: 2,
                            ease: "easeInOut"
                        },
                        className: "absolute inset-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$fiber$40$9$2e$6$2e$1_$40$t_d3a4f9d95c93a885c520db7df717159f$2f$node_modules$2f40$react$2d$three$2f$fiber$2f$dist$2f$react$2d$three$2d$fiber$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Canvas"], {
                            shadows: true,
                            dpr: dpr,
                            gl: {
                                antialias: quality === 'high',
                                powerPreference: "high-performance",
                                alpha: false,
                                stencil: false,
                                depth: true,
                                logarithmicDepthBuffer: false
                            },
                            performance: {
                                min: 0.3
                            },
                            frameloop: "always",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: null,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$PerspectiveCamera$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerspectiveCamera"], {
                                        makeDefault: true,
                                        position: [
                                            0,
                                            60,
                                            60
                                        ],
                                        fov: 60
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                        lineNumber: 1813,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$three$2b$drei$40$10$2e$7$2e$7_$40$r_381ef0bd84716b7038846e161d73cb90$2f$node_modules$2f40$react$2d$three$2f$drei$2f$core$2f$CameraShake$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CameraShake"], {
                                        maxYaw: 0.04,
                                        maxPitch: 0.04,
                                        maxRoll: 0.04,
                                        yawFrequency: shake,
                                        pitchFrequency: shake,
                                        rollFrequency: shake,
                                        intensity: shake
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                        lineNumber: 1814,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SceneContent, {
                                        stage: stage,
                                        quality: quality,
                                        whiteoutProgress: whiteoutProgress,
                                        tunnelProgress: tunnelProgress,
                                        onReachDoor: handleReachDoor
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                        lineNumber: 1823,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                lineNumber: 1812,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 1798,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 1792,
                        columnNumber: 17
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                        children: stage === 'arrival' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            initial: {
                                opacity: 0,
                                scale: 0.95
                            },
                            animate: {
                                opacity: 1,
                                scale: 1
                            },
                            exit: {
                                opacity: 0
                            },
                            transition: {
                                duration: 0.5,
                                ease: "easeOut"
                            },
                            className: "absolute inset-0 z-[11000] flex flex-col items-center justify-center pointer-events-none",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-3xl md:text-5xl font-extrabold font-mono text-black tracking-[0.25em] mb-4",
                                    children: "DESTINATION REACHED"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                    lineNumber: 1838,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-red-600 font-mono font-bold tracking-widest text-sm md:text-base drop-shadow-[0_0_10px_rgba(239,68,68,0.6)] uppercase",
                                    children: "GOOD LUCK, ADVENTURER"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                                    lineNumber: 1841,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                            lineNumber: 1831,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 1829,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$framer$2d$motion$40$11$2e$18$2e$2_react_cce3d889a93a74b971da0f2788960b34$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0
                        },
                        animate: whiteout ? {
                            opacity: whiteoutOpacity
                        } : {
                            opacity: 0
                        },
                        transition: {
                            duration: 1.5
                        },
                        className: "absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-white to-red-600/30 shadow-[inset_0_0_120px_rgba(239,68,68,0.4)] z-[10000] pointer-events-none"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                        lineNumber: 1848,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 1783,
                columnNumber: 13
            }, this),
            showBracePopup && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_$40$babel$2b$core$40$7$2e$_81b24c4c8084276f47854f01706fcc93$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BracePopup, {
                onReady: handleBraceReady,
                gender: gender
            }, void 0, false, {
                fileName: "[project]/src/components/Portal/ShadowGardenPortal.tsx",
                lineNumber: 1857,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true);
}
_s14(ShadowGardenPortal, "G72EbQL1pMSCv3EjzKr27Dg1Fkw=");
_c18 = ShadowGardenPortal;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11, _c12, _c13, _c14, _c15, _c16, _c17, _c18;
__turbopack_context__.k.register(_c, "WormholeTunnel");
__turbopack_context__.k.register(_c1, "PlayerRig");
__turbopack_context__.k.register(_c2, "PortalCoreLight");
__turbopack_context__.k.register(_c3, "PortalVortex");
__turbopack_context__.k.register(_c4, "WarpTunnel");
__turbopack_context__.k.register(_c5, "ConstructedGate");
__turbopack_context__.k.register(_c6, "CobblestoneRoad");
__turbopack_context__.k.register(_c7, "Fireflies");
__turbopack_context__.k.register(_c8, "GuardianLamps");
__turbopack_context__.k.register(_c9, "EveningStar");
__turbopack_context__.k.register(_c10, "VolumetricClouds");
__turbopack_context__.k.register(_c11, "FloatingIsland");
__turbopack_context__.k.register(_c12, "SceneContent");
__turbopack_context__.k.register(_c13, "CameraDirector");
__turbopack_context__.k.register(_c14, "CinematicTitleIntro");
__turbopack_context__.k.register(_c15, "AudioPermissionModal");
__turbopack_context__.k.register(_c16, "BracePopup");
__turbopack_context__.k.register(_c17, "AnimationPreferencePopup");
__turbopack_context__.k.register(_c18, "ShadowGardenPortal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/Portal/ShadowGardenPortal.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/Portal/ShadowGardenPortal.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_components_Portal_ShadowGardenPortal_tsx_6a0bf28b._.js.map