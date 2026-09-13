"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6418],{2434:(e,t,r)=>{r.d(t,{A:()=>n});let n=(0,r(55113).A)("Fingerprint",[["path",{d:"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",key:"1nerag"}],["path",{d:"M14 13.12c0 2.38 0 6.38-1 8.88",key:"o46ks0"}],["path",{d:"M17.29 21.02c.12-.6.43-2.3.5-3.02",key:"ptglia"}],["path",{d:"M2 12a10 10 0 0 1 18-6",key:"ydlgp0"}],["path",{d:"M2 16h.01",key:"1gqxmh"}],["path",{d:"M21.8 16c.2-2 .131-5.354 0-6",key:"drycrb"}],["path",{d:"M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",key:"1tidbn"}],["path",{d:"M8.65 22c.21-.66.45-1.32.57-2",key:"13wd9y"}],["path",{d:"M9 6.8a6 6 0 0 1 9 5.2v2",key:"1fr1j5"}]])},3346:(e,t,r)=>{r.d(t,{Sd:()=>a,T:()=>l,wn:()=>s});var n=r(55887),i=r(30373);function o(e,t){let r=e+"Geometry";return i.forwardRef(({args:e,children:o,...a},l)=>{let s=i.useRef(null);return i.useImperativeHandle(l,()=>s.current),i.useLayoutEffect(()=>void(null==t||t(s.current))),i.createElement("mesh",(0,n.A)({ref:s},a),i.createElement(r,{attach:"geometry",args:e}),o)})}let a=o("cone"),l=o("cylinder"),s=o("capsule")},11921:(e,t,r)=>{e.exports=r(27777)},13168:(e,t,r)=>{r.d(t,{Hl:()=>f});var n=r(5338),i=r(30373),o=r(73925);function a(e,t){let r;return(...n)=>{window.clearTimeout(r),r=window.setTimeout(()=>e(...n),t)}}let l=["x","y","top","bottom","left","right","width","height"];var s=r(79003),u=r(55521);function c({ref:e,children:t,fallback:r,resize:s,style:c,gl:f,events:d=n.f,eventSource:m,eventPrefix:p,shadows:h,linear:v,flat:g,legacy:y,orthographic:b,frameloop:w,dpr:x,performance:E,raycaster:M,camera:P,scene:S,onPointerMissed:A,onCreated:C,...R}){i.useMemo(()=>(0,n.e)(o),[]);let k=(0,n.u)(),[_,T]=function({debounce:e,scroll:t,polyfill:r,offsetSize:n}={debounce:0,scroll:!1,offsetSize:!1}){var o,s,u;let c=r||("undefined"==typeof window?class{}:window.ResizeObserver);if(!c)throw Error("This browser does not support ResizeObserver out of the box. See: https://github.com/react-spring/react-use-measure/#resize-observer-polyfills");let[f,d]=(0,i.useState)({left:0,top:0,width:0,height:0,bottom:0,right:0,x:0,y:0}),m=(0,i.useRef)({element:null,scrollContainers:null,resizeObserver:null,lastBounds:f,orientationHandler:null}),p=e?"number"==typeof e?e:e.scroll:null,h=e?"number"==typeof e?e:e.resize:null,v=(0,i.useRef)(!1);(0,i.useEffect)(()=>(v.current=!0,()=>void(v.current=!1)));let[g,y,b]=(0,i.useMemo)(()=>{let e=()=>{let e,t;if(!m.current.element)return;let{left:r,top:i,width:o,height:a,bottom:s,right:u,x:c,y:f}=m.current.element.getBoundingClientRect(),p={left:r,top:i,width:o,height:a,bottom:s,right:u,x:c,y:f};m.current.element instanceof HTMLElement&&n&&(p.height=m.current.element.offsetHeight,p.width=m.current.element.offsetWidth),Object.freeze(p),v.current&&(e=m.current.lastBounds,t=p,!l.every(r=>e[r]===t[r]))&&d(m.current.lastBounds=p)};return[e,h?a(e,h):e,p?a(e,p):e]},[d,n,p,h]);function w(){m.current.scrollContainers&&(m.current.scrollContainers.forEach(e=>e.removeEventListener("scroll",b,!0)),m.current.scrollContainers=null),m.current.resizeObserver&&(m.current.resizeObserver.disconnect(),m.current.resizeObserver=null),m.current.orientationHandler&&("orientation"in screen&&"removeEventListener"in screen.orientation?screen.orientation.removeEventListener("change",m.current.orientationHandler):"onorientationchange"in window&&window.removeEventListener("orientationchange",m.current.orientationHandler))}function x(){m.current.element&&(m.current.resizeObserver=new c(b),m.current.resizeObserver.observe(m.current.element),t&&m.current.scrollContainers&&m.current.scrollContainers.forEach(e=>e.addEventListener("scroll",b,{capture:!0,passive:!0})),m.current.orientationHandler=()=>{b()},"orientation"in screen&&"addEventListener"in screen.orientation?screen.orientation.addEventListener("change",m.current.orientationHandler):"onorientationchange"in window&&window.addEventListener("orientationchange",m.current.orientationHandler))}return o=b,s=!!t,(0,i.useEffect)(()=>{if(s)return window.addEventListener("scroll",o,{capture:!0,passive:!0}),()=>void window.removeEventListener("scroll",o,!0)},[o,s]),u=y,(0,i.useEffect)(()=>(window.addEventListener("resize",u),()=>void window.removeEventListener("resize",u)),[u]),(0,i.useEffect)(()=>{w(),x()},[t,b,y]),(0,i.useEffect)(()=>w,[]),[e=>{e&&e!==m.current.element&&(w(),m.current.element=e,m.current.scrollContainers=function e(t){let r=[];if(!t||t===document.body)return r;let{overflow:n,overflowX:i,overflowY:o}=window.getComputedStyle(t);return[n,i,o].some(e=>"auto"===e||"scroll"===e)&&r.push(t),[...r,...e(t.parentElement)]}(e),x())},f,g]}({scroll:!0,debounce:{scroll:50,resize:0},...s}),z=i.useRef(null),j=i.useRef(null);i.useImperativeHandle(e,()=>z.current);let I=(0,n.a)(A),[L,O]=i.useState(!1),[F,D]=i.useState(!1);if(L)throw L;if(F)throw F;let B=i.useRef(null);(0,n.b)(()=>{let e=z.current;T.width>0&&T.height>0&&e&&(B.current||(B.current=(0,n.c)(e)),async function(){await B.current.configure({gl:f,scene:S,events:d,shadows:h,linear:v,flat:g,legacy:y,orthographic:b,frameloop:w,dpr:x,performance:E,raycaster:M,camera:P,size:T,onPointerMissed:(...e)=>null==I.current?void 0:I.current(...e),onCreated:e=>{null==e.events.connect||e.events.connect(m?(0,n.i)(m)?m.current:m:j.current),p&&e.setEvents({compute:(e,t)=>{let r=e[p+"X"],n=e[p+"Y"];t.pointer.set(r/t.size.width*2-1,-(2*(n/t.size.height))+1),t.raycaster.setFromCamera(t.pointer,t.camera)}}),null==C||C(e)}}),B.current.render((0,u.jsx)(k,{children:(0,u.jsx)(n.E,{set:D,children:(0,u.jsx)(i.Suspense,{fallback:(0,u.jsx)(n.B,{set:O}),children:null!=t?t:null})})}))}())}),i.useEffect(()=>{let e=z.current;if(e)return()=>(0,n.d)(e)},[]);let H=m?"none":"auto";return(0,u.jsx)("div",{ref:j,style:{position:"relative",width:"100%",height:"100%",overflow:"hidden",pointerEvents:H,...c},...R,children:(0,u.jsx)("div",{ref:_,style:{width:"100%",height:"100%"},children:(0,u.jsx)("canvas",{ref:z,style:{display:"block"},children:r})})})}function f(e){return(0,u.jsx)(s.Af,{children:(0,u.jsx)(c,{...e})})}r(19638)},14754:(e,t,r)=>{var n=r(30373),i="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},o=n.useState,a=n.useEffect,l=n.useLayoutEffect,s=n.useDebugValue;function u(e){var t=e.getSnapshot;e=e.value;try{var r=t();return!i(e,r)}catch(e){return!0}}var c="undefined"==typeof window||void 0===window.document||void 0===window.document.createElement?function(e,t){return t()}:function(e,t){var r=t(),n=o({inst:{value:r,getSnapshot:t}}),i=n[0].inst,c=n[1];return l(function(){i.value=r,i.getSnapshot=t,u(i)&&c({inst:i})},[e,r,t]),a(function(){return u(i)&&c({inst:i}),e(function(){u(i)&&c({inst:i})})},[e]),s(r),r};t.useSyncExternalStore=void 0!==n.useSyncExternalStore?n.useSyncExternalStore:c},16164:(e,t,r)=>{r.d(t,{o:()=>i});var n=r(17390);class i{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}new n.qUd(-1,1,1,-1,0,1);class o extends n.LoY{constructor(){super(),this.setAttribute("position",new n.qtW([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new n.qtW([0,2,0,0,2,0],2))}}new o},19638:(e,t,r)=>{e.exports=r(98775)},21109:(e,t,r)=>{r.d(t,{A:()=>n});let n=(0,r(55113).A)("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]])},27777:(e,t,r)=>{var n=r(30373),i=r(56711),o="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},a=i.useSyncExternalStore,l=n.useRef,s=n.useEffect,u=n.useMemo,c=n.useDebugValue;t.useSyncExternalStoreWithSelector=function(e,t,r,n,i){var f=l(null);if(null===f.current){var d={hasValue:!1,value:null};f.current=d}else d=f.current;var m=a(e,(f=u(function(){function e(e){if(!s){if(s=!0,a=e,e=n(e),void 0!==i&&d.hasValue){var t=d.value;if(i(t,e))return l=t}return l=e}if(t=l,o(a,e))return t;var r=n(e);return void 0!==i&&i(t,r)?(a=e,t):(a=e,l=r)}var a,l,s=!1,u=void 0===r?null:r;return[function(){return e(t())},null===u?void 0:function(){return e(u())}]},[t,r,n,i]))[0],f[1]);return s(function(){d.hasValue=!0,d.value=m},[m]),c(m),m}},29752:(e,t,r)=>{r.d(t,{A:()=>n});let n=(0,r(55113).A)("FastForward",[["polygon",{points:"13 19 22 12 13 5 13 19",key:"587y9g"}],["polygon",{points:"2 19 11 12 2 5 2 19",key:"3pweh0"}]])},39925:(e,t,r)=>{r.d(t,{mK:()=>P,E8:()=>S,b1:()=>M,s0:()=>y,yO:()=>A,bt:()=>R,fE:()=>k});var n=r(55521),i=r(30373),o=r(17390),a=r(5338),l=r(65493);function s(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}new o.I9Y,new o.I9Y;function u(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}var c=function e(t,r,n){var i=this;u(this,e),s(this,"dot2",function(e,t){return i.x*e+i.y*t}),s(this,"dot3",function(e,t,r){return i.x*e+i.y*t+i.z*r}),this.x=t,this.y=r,this.z=n},f=[new c(1,1,0),new c(-1,1,0),new c(1,-1,0),new c(-1,-1,0),new c(1,0,1),new c(-1,0,1),new c(1,0,-1),new c(-1,0,-1),new c(0,1,1),new c(0,-1,1),new c(0,1,-1),new c(0,-1,-1)],d=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180],m=Array(512),p=Array(512);!function(e){e>0&&e<1&&(e*=65536),(e=Math.floor(e))<256&&(e|=e<<8);for(var t,r=0;r<256;r++)t=1&r?d[r]^255&e:d[r]^e>>8&255,m[r]=m[r+256]=t,p[r]=p[r+256]=f[t%12]}(0);function h(e){var t=function(e){if("number"==typeof e)e=Math.abs(e);else if("string"==typeof e){var t=e;e=0;for(var r=0;r<t.length;r++)e=(e+(r+1)*(t.charCodeAt(r)%96))%0x7fffffff}return 0===e&&(e=311),e}(e);return function(){var e=48271*t%0x7fffffff;return t=e,e/0x7fffffff}}new function e(t){var r=this;u(this,e),s(this,"seed",0),s(this,"init",function(e){r.seed=e,r.value=h(e)}),s(this,"value",h(this.seed)),this.init(t)}(Math.random());o.LoY;r(48990);let v=(0,i.createContext)(null),g=e=>(2&e.getAttributes())==2,y=(0,i.memo)((0,i.forwardRef)(({children:e,camera:t,scene:r,resolutionScale:s,enabled:u=!0,renderPriority:c=1,autoClear:f=!0,depthBuffer:d,enableNormalPass:m,stencilBuffer:p,multisampling:h=8,frameBufferType:y=o.ix0},b)=>{let{gl:w,scene:x,camera:E,size:M}=(0,a.C)(),P=r||x,S=t||E,[A,C,R]=(0,i.useMemo)(()=>{let e=new l.s0(w,{depthBuffer:d,stencilBuffer:p,multisampling:h,frameBufferType:y});e.addPass(new l.AH(P,S));let t=null,r=null;return m&&((r=new l.Xe(P,S)).enabled=!1,e.addPass(r),void 0!==s&&((t=new l.SP({normalBuffer:r.texture,resolutionScale:s})).enabled=!1,e.addPass(t))),[e,r,t]},[S,w,d,p,h,y,P,m,s]);(0,i.useEffect)(()=>A?.setSize(M.width,M.height),[A,M]),(0,a.D)((e,t)=>{if(u){let e=w.autoClear;w.autoClear=f,p&&!f&&w.clearStencil(),A.render(t),w.autoClear=e}},u?c:0);let k=(0,i.useRef)(null);(0,i.useLayoutEffect)(()=>{let e=[],t=k.current.__r3f;if(t&&A){let r=t.children;for(let t=0;t<r.length;t++){let n=r[t].object;if(n instanceof l.Mj){let i=[n];if(!g(n)){let e=null;for(;(e=r[t+1]?.object)instanceof l.Mj&&!g(e);)i.push(e),t++}let o=new l.Vu(S,...i);e.push(o)}else n instanceof l.oF&&e.push(n)}for(let t of e)A?.addPass(t);C&&(C.enabled=!0),R&&(R.enabled=!0)}return()=>{for(let t of e)A?.removePass(t);C&&(C.enabled=!1),R&&(R.enabled=!1)}},[A,e,S,C,R]),(0,i.useEffect)(()=>{let e=w.toneMapping;return w.toneMapping=o.y_p,()=>{w.toneMapping=e}},[w]);let _=(0,i.useMemo)(()=>({composer:A,normalPass:C,downSamplingPass:R,resolutionScale:s,camera:S,scene:P}),[A,C,R,s,S,P]);return(0,i.useImperativeHandle)(b,()=>A,[A]),(0,n.jsx)(v.Provider,{value:_,children:(0,n.jsx)("group",{ref:k,children:e})})})),b=0,w=new WeakMap,x=(e,t)=>function({blendFunction:r=t?.blendFunction,opacity:o=t?.opacity,...l}){let s=w.get(e);if(!s){let t=`@react-three/postprocessing/${e.name}-${b++}`;(0,a.e)({[t]:e}),w.set(e,s=t)}let u=(0,a.C)(e=>e.camera),c=i.useMemo(()=>[...t?.args??[],...l.args??[{...t,...l}]],[JSON.stringify(l)]);return(0,n.jsx)(s,{camera:u,"blendMode-blendFunction":r,"blendMode-opacity-value":o,...l,args:c})},E=(e,t)=>{let r=e[t];return i.useMemo(()=>"number"==typeof r?new o.I9Y(r,r):r?new o.I9Y(...r):new o.I9Y,[r])},M=(0,i.forwardRef)(function({blendFunction:e,worldFocusDistance:t,worldFocusRange:r,focusDistance:a,focusRange:s,focalLength:u,bokehScale:c,resolutionScale:f,resolutionX:d,resolutionY:m,width:p,height:h,target:g,depthTexture:y,...b},w){let{camera:x}=(0,i.useContext)(v),E=null!=g,M=(0,i.useMemo)(()=>{let n=new l.kt(x,{blendFunction:e,worldFocusDistance:t,worldFocusRange:r,focusDistance:a,focusRange:s,focalLength:u,bokehScale:c,resolutionScale:f,resolutionX:d,resolutionY:m,width:p,height:h});return E&&(n.target=new o.Pq0),y&&n.setDepthTexture(y.texture,y.packing),n.maskPass.maskFunction=l.qM.MULTIPLY_RGB_SET_ALPHA,n},[x,e,t,r,a,s,u,c,f,d,m,p,h,E,y]);return(0,i.useEffect)(()=>()=>{M.dispose()},[M]),(0,n.jsx)("primitive",{...b,ref:w,object:M,target:g})});l.Mj;let P=x(l.bv,{blendFunction:0}),S=x(l.t$),A=(0,i.forwardRef)(function({active:e=!0,...t},r){let o=(0,a.C)(e=>e.invalidate),s=E(t,"delay"),u=E(t,"duration"),c=E(t,"strength"),f=E(t,"chromaticAberrationOffset"),d=(0,i.useMemo)(()=>new l.nn({...t,delay:s,duration:u,strength:c,chromaticAberrationOffset:f}),[s,u,t,c,f]);return(0,i.useLayoutEffect)(()=>{d.mode=e?t.mode||l.Tg.SPORADIC:l.Tg.DISABLED,o()},[e,d,o,t.mode]),(0,i.useEffect)(()=>()=>{d.dispose?.()},[d]),(0,n.jsx)("primitive",{ref:r,object:d,dispose:null})});l.i,l.hH;var C=(e=>(e[e.Linear=0]="Linear",e[e.Radial=1]="Radial",e[e.MirroredLinear=2]="MirroredLinear",e))(C||{});l.Mj;let R=x(l.i4),k=x(l.K1),_=(l.To,{fragmentShader:`

    // original shader by Evan Wallace

    #define MAX_ITERATIONS 100

    uniform float blur;
    uniform float taper;
    uniform vec2 start;
    uniform vec2 end;
    uniform vec2 direction;
    uniform int samples;

    float random(vec3 scale, float seed) {
        /* use the fragment position for a different seed per-pixel */
        return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 color = vec4(0.0);
        float total = 0.0;
        vec2 startPixel = vec2(start.x * resolution.x, start.y * resolution.y);
        vec2 endPixel = vec2(end.x * resolution.x, end.y * resolution.y);
        float f_samples = float(samples);
        float half_samples = f_samples / 2.0;

        // use screen diagonal to normalize blur radii
        float maxScreenDistance = distance(vec2(0.0), resolution); // diagonal distance
        float gradientRadius = taper * (maxScreenDistance);
        float blurRadius = blur * (maxScreenDistance / 16.0);

        /* randomize the lookup values to hide the fixed number of samples */
        float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
        vec2 normal = normalize(vec2(startPixel.y - endPixel.y, endPixel.x - startPixel.x));
        float radius = smoothstep(0.0, 1.0, abs(dot(uv * resolution - startPixel, normal)) / gradientRadius) * blurRadius;

        #pragma unroll_loop_start
        for (int i = 0; i <= MAX_ITERATIONS; i++) {
            if (i >= samples) { break; } // return early if over sample count
            float f_i = float(i);
            float s_i = -half_samples + f_i;
            float percent = (s_i + offset - 0.5) / half_samples;
            float weight = 1.0 - abs(percent);
            vec4 sample_i = texture2D(inputBuffer, uv + normalize(direction) / resolution * percent * radius);
            /* switch to pre-multiplied alpha to correctly blur transparent images */
            sample_i.rgb *= sample_i.a;
            color += sample_i * weight;
            total += weight;
        }
        #pragma unroll_loop_end

        outputColor = color / total;

        /* switch back from pre-multiplied alpha */
        outputColor.rgb /= outputColor.a + 0.00001;
    }
    `});l.Mj;l.Mj;l.Mj},39942:(e,t,r)=>{r.d(t,{n:()=>a});var n=r(30373),i=r(5338),o=r(17390);let a=n.forwardRef(({children:e,enabled:t=!0,speed:r=1,rotationIntensity:a=1,floatIntensity:l=1,floatingRange:s=[-.1,.1],autoInvalidate:u=!1,...c},f)=>{let d=n.useRef(null);n.useImperativeHandle(f,()=>d.current,[]);let m=n.useRef(1e4*Math.random());return(0,i.D)(e=>{var n,i;if(!t||0===r)return;u&&e.invalidate();let c=m.current+e.clock.elapsedTime;d.current.rotation.x=Math.cos(c/4*r)/8*a,d.current.rotation.y=Math.sin(c/4*r)/8*a,d.current.rotation.z=Math.sin(c/4*r)/20*a;let f=Math.sin(c/4*r)/10;f=o.cj9.mapLinear(f,-.1,.1,null!=(n=null==s?void 0:s[0])?n:-.1,null!=(i=null==s?void 0:s[1])?i:.1),d.current.position.y=f*l,d.current.updateMatrix()}),n.createElement("group",c,n.createElement("group",{ref:d,matrixAutoUpdate:!1},e))})},44091:(e,t,r)=>{r.d(t,{r:()=>n});let n=parseInt(r(17390).sPf.replace(/\D+/g,""))},52091:(e,t,r)=>{r.d(t,{A:()=>n});let n=(0,r(55113).A)("Power",[["path",{d:"M12 2v10",key:"mnfbl"}],["path",{d:"M18.4 6.6a9 9 0 1 1-12.77.04",key:"obofu9"}]])},55225:(e,t,r)=>{r.d(t,{u:()=>l});var n=r(55887),i=r(30373),o=r(5338),a=r(17390);let l=i.forwardRef(({envMap:e,resolution:t=256,frames:r=1/0,makeDefault:l,children:s,...u},c)=>{let f=(0,o.C)(({set:e})=>e),d=(0,o.C)(({camera:e})=>e),m=(0,o.C)(({size:e})=>e),p=i.useRef(null);i.useImperativeHandle(c,()=>p.current,[]);let h=i.useRef(null),v=function(e,t,r){let n=(0,o.C)(e=>e.size),l=(0,o.C)(e=>e.viewport),s="number"==typeof e?e:n.width*l.dpr,u=n.height*l.dpr,c=("number"==typeof e?void 0:e)||{},{samples:f=0,depth:d,...m}=c,p=null!=d?d:c.depthBuffer,h=i.useMemo(()=>{let e=new a.nWS(s,u,{minFilter:a.k6q,magFilter:a.k6q,type:a.ix0,...m});return p&&(e.depthTexture=new a.VCu(s,u,a.RQf)),e.samples=f,e},[]);return i.useLayoutEffect(()=>{h.setSize(s,u),f&&(h.samples=f)},[f,h,s,u]),i.useEffect(()=>()=>h.dispose(),[]),h}(t);i.useLayoutEffect(()=>{u.manual||(p.current.aspect=m.width/m.height)},[m,u]),i.useLayoutEffect(()=>{p.current.updateProjectionMatrix()});let g=0,y=null,b="function"==typeof s;return(0,o.D)(t=>{b&&(r===1/0||g<r)&&(h.current.visible=!1,t.gl.setRenderTarget(v),y=t.scene.background,e&&(t.scene.background=e),t.gl.render(t.scene,p.current),t.scene.background=y,t.gl.setRenderTarget(null),h.current.visible=!0,g++)}),i.useLayoutEffect(()=>{if(l)return f(()=>({camera:p.current})),()=>f(()=>({camera:d}))},[p,l,f]),i.createElement(i.Fragment,null,i.createElement("perspectiveCamera",(0,n.A)({ref:p},u),!b&&s),i.createElement("group",{ref:h},b&&s(v.texture)))})},55887:(e,t,r)=>{r.d(t,{A:()=>n});function n(){return(n=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)({}).hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(null,arguments)}},56711:(e,t,r)=>{e.exports=r(14754)},57852:(e,t,r)=>{r.d(t,{b:()=>i});var n=r(17390);function i(e,t,r,i){var o;return(o=class extends n.BKk{constructor(o){for(let i in super({vertexShader:t,fragmentShader:r,...o}),e)this.uniforms[i]=new n.nc$(e[i]),Object.defineProperty(this,i,{get(){return this.uniforms[i].value},set(e){this.uniforms[i].value=e}});this.uniforms=n.LlO.clone(this.uniforms),null==i||i(this)}}).key=n.cj9.generateUUID(),o}},58974:(e,t,r)=>{r.d(t,{h:()=>s});var n=r(30373),i=r(11921);let o=e=>{let t,r=new Set,n=(e,n)=>{let i="function"==typeof e?e(t):e;if(!Object.is(i,t)){let e=t;t=(null!=n?n:"object"!=typeof i||null===i)?i:Object.assign({},t,i),r.forEach(r=>r(t,e))}},i=()=>t,o={setState:n,getState:i,getInitialState:()=>a,subscribe:e=>(r.add(e),()=>r.delete(e))},a=t=e(n,i,o);return o},{useSyncExternalStoreWithSelector:a}=i,l=(e,t)=>{let r=(e=>e?o(e):o)(e),i=(e,i=t)=>(function(e,t=e=>e,r){let i=a(e.subscribe,e.getState,e.getInitialState,t,r);return n.useDebugValue(i),i})(r,e,i);return Object.assign(i,r),i},s=(e,t)=>e?l(e,t):l},61011:(e,t,r)=>{r.d(t,{Q:()=>l});var n=r(55887),i=r(30373),o=r(17390),a=r(5338);let l=i.forwardRef(function({children:e,follow:t=!0,lockX:r=!1,lockY:l=!1,lockZ:s=!1,...u},c){let f=i.useRef(null),d=i.useRef(null),m=new o.PTz;return(0,a.D)(({camera:e})=>{if(!t||!d.current)return;let n=f.current.rotation.clone();d.current.updateMatrix(),d.current.updateWorldMatrix(!1,!1),d.current.getWorldQuaternion(m),e.getWorldQuaternion(f.current.quaternion).premultiply(m.invert()),r&&(f.current.rotation.x=n.x),l&&(f.current.rotation.y=n.y),s&&(f.current.rotation.z=n.z)}),i.useImperativeHandle(c,()=>d.current,[]),i.createElement("group",(0,n.A)({ref:d},u),i.createElement("group",{ref:f},e))})},62850:(e,t,r)=>{r.d(t,{cw:()=>w,X8:()=>x});var n=r(55887),i=r(17390),o=r(30373),a=r(5338);let l=(e,t)=>{e.updateRanges[0]=t},s=new i.kn4,u=new i.kn4,c=[],f=new i.eaF;class d extends i.YJl{constructor(){super(),this.color=new i.Q1f("white"),this.instance={current:void 0},this.instanceKey={current:void 0}}get geometry(){var e;return null==(e=this.instance.current)?void 0:e.geometry}raycast(e,t){let r=this.instance.current;if(!r||!r.geometry||!r.material)return;f.geometry=r.geometry;let n=r.matrixWorld,o=r.userData.instances.indexOf(this.instanceKey);if(-1!==o&&!(o>r.count)){r.getMatrixAt(o,s),u.multiplyMatrices(n,s),f.matrixWorld=u,r.material instanceof i.imn?f.material.side=r.material.side:f.material.side=r.material[0].side,f.raycast(e,c);for(let e=0,r=c.length;e<r;e++){let r=c[e];r.instanceId=o,r.object=this,t.push(r)}c.length=0}}}let m=o.createContext(null),p=new i.kn4,h=new i.kn4,v=new i.kn4,g=new i.Pq0,y=new i.PTz,b=new i.Pq0,w=o.forwardRef(({context:e,children:t,...r},i)=>{o.useMemo(()=>(0,a.e)({PositionMesh:d}),[]);let l=o.useRef(null);o.useImperativeHandle(i,()=>l.current,[]);let{subscribe:s,getParent:u}=o.useContext(e||m);return o.useLayoutEffect(()=>s(l),[]),o.createElement("positionMesh",(0,n.A)({instance:u(),instanceKey:l,ref:l},r),t)}),x=o.forwardRef(({context:e,children:t,range:r,limit:s=1e3,frames:u=1/0,...c},f)=>{let[{localContext:d,instance:x}]=o.useState(()=>{let e=o.createContext(null);return{localContext:e,instance:o.forwardRef((t,r)=>o.createElement(w,(0,n.A)({context:e},t,{ref:r})))}}),E=o.useRef(null);o.useImperativeHandle(f,()=>E.current,[]);let[M,P]=o.useState([]),[[S,A]]=o.useState(()=>{let e=new Float32Array(16*s);for(let t=0;t<s;t++)v.identity().toArray(e,16*t);return[e,new Float32Array([...Array(3*s)].map(()=>1))]});o.useEffect(()=>{E.current.instanceMatrix.needsUpdate=!0});let C=0,R=0,k=o.useRef([]);o.useLayoutEffect(()=>{k.current=Object.entries(E.current.geometry.attributes).filter(([e,t])=>t.isInstancedBufferAttribute)}),(0,a.D)(()=>{if(u===1/0||C<u){E.current.updateMatrix(),E.current.updateMatrixWorld(),p.copy(E.current.matrixWorld).invert(),R=Math.min(s,void 0!==r?r:s,M.length),E.current.count=R,l(E.current.instanceMatrix,{start:0,count:16*R}),l(E.current.instanceColor,{start:0,count:3*R});for(let e=0;e<M.length;e++){let t=M[e].current;t.matrixWorld.decompose(g,y,b),h.compose(g,y,b).premultiply(p),h.toArray(S,16*e),E.current.instanceMatrix.needsUpdate=!0,t.color.toArray(A,3*e),E.current.instanceColor.needsUpdate=!0}C++}});let _=o.useMemo(()=>({getParent:()=>E,subscribe:e=>(P(t=>[...t,e]),()=>P(t=>t.filter(t=>t.current!==e.current)))}),[]);return o.createElement("instancedMesh",(0,n.A)({userData:{instances:M,limit:s,frames:u},matrixAutoUpdate:!1,ref:E,args:[null,null,0],raycast:()=>null},c),o.createElement("instancedBufferAttribute",{attach:"instanceMatrix",args:[S,16],usage:i.Vnu}),o.createElement("instancedBufferAttribute",{attach:"instanceColor",args:[A,3],usage:i.Vnu}),"function"==typeof t?o.createElement(d.Provider,{value:_},t(x)):e?o.createElement(e.Provider,{value:_},t):o.createElement(m.Provider,{value:_},t))})},71628:(e,t,r)=>{r.d(t,{DY:()=>a,IU:()=>s,uv:()=>l});let n=[];function i(e,t,r=(e,t)=>e===t){if(e===t)return!0;if(!e||!t)return!1;let n=e.length;if(t.length!==n)return!1;for(let i=0;i<n;i++)if(!r(e[i],t[i]))return!1;return!0}function o(e,t=null,r=!1,a={}){for(let o of(null===t&&(t=[e]),n))if(i(t,o.keys,o.equal)){if(r)return;if(Object.prototype.hasOwnProperty.call(o,"error"))throw o.error;if(Object.prototype.hasOwnProperty.call(o,"response"))return a.lifespan&&a.lifespan>0&&(o.timeout&&clearTimeout(o.timeout),o.timeout=setTimeout(o.remove,a.lifespan)),o.response;if(!r)throw o.promise}let l={keys:t,equal:a.equal,remove:()=>{let e=n.indexOf(l);-1!==e&&n.splice(e,1)},promise:("object"==typeof e&&"function"==typeof e.then?e:e(...t)).then(e=>{l.response=e,a.lifespan&&a.lifespan>0&&(l.timeout=setTimeout(l.remove,a.lifespan))}).catch(e=>l.error=e)};if(n.push(l),!r)throw l.promise}let a=(e,t,r)=>o(e,t,!1,r),l=(e,t,r)=>void o(e,t,!0,r),s=e=>{if(void 0===e||0===e.length)n.splice(0,n.length);else{let t=n.find(t=>i(e,t.keys,t.equal));t&&t.remove()}}},76175:(e,t,r)=>{r.d(t,{s:()=>m});var n=r(55887),i=r(30373),o=r(17390),a=r(5338),l=r(44091);class s extends o.BKk{constructor(){super({uniforms:{time:{value:0},pixelRatio:{value:1}},vertexShader:`
        uniform float pixelRatio;
        uniform float time;
        attribute float size;  
        attribute float speed;  
        attribute float opacity;
        attribute vec3 noise;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
          modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2;
          modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2;
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectionPostion = projectionMatrix * viewPosition;
          gl_Position = projectionPostion;
          gl_PointSize = size * 25. * pixelRatio;
          gl_PointSize *= (1.0 / - viewPosition.z);
          vColor = color;
          vOpacity = opacity;
        }
      `,fragmentShader:`
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float strength = 0.05 / distanceToCenter - 0.1;
          gl_FragColor = vec4(vColor, strength * vOpacity);
          #include <tonemapping_fragment>
          #include <${l.r>=154?"colorspace_fragment":"encodings_fragment"}>
        }
      `})}get time(){return this.uniforms.time.value}set time(e){this.uniforms.time.value=e}get pixelRatio(){return this.uniforms.pixelRatio.value}set pixelRatio(e){this.uniforms.pixelRatio.value=e}}let u=e=>e&&e.constructor===Float32Array,c=e=>e instanceof o.I9Y||e instanceof o.Pq0||e instanceof o.IUQ,f=e=>Array.isArray(e)?e:c(e)?e.toArray():[e,e,e];function d(e,t,r){return i.useMemo(()=>{if(void 0!==t)if(u(t))return t;else{if(t instanceof o.Q1f){let r=Array.from({length:3*e},()=>[t.r,t.g,t.b]).flat();return Float32Array.from(r)}if(c(t)||Array.isArray(t)){let r=Array.from({length:3*e},()=>f(t)).flat();return Float32Array.from(r)}return Float32Array.from({length:e},()=>t)}return Float32Array.from({length:e},r)},[t])}let m=i.forwardRef(({noise:e=1,count:t=100,speed:r=1,opacity:l=1,scale:c=1,size:m,color:p,children:h,...v},g)=>{i.useMemo(()=>(0,a.e)({SparklesImplMaterial:s}),[]);let y=i.useRef(null),b=(0,a.C)(e=>e.viewport.dpr),w=f(c),x=i.useMemo(()=>Float32Array.from(Array.from({length:t},()=>w.map(o.cj9.randFloatSpread)).flat()),[t,...w]),E=d(t,m,Math.random),M=d(t,l),P=d(t,r),S=d(3*t,e),A=d(void 0===p?3*t:t,u(p)?p:new o.Q1f(p),()=>1);return(0,a.D)(e=>{y.current&&y.current.material&&(y.current.material.time=e.clock.elapsedTime)}),i.useImperativeHandle(g,()=>y.current,[]),i.createElement("points",(0,n.A)({key:`particle-${t}-${JSON.stringify(c)}`},v,{ref:y}),i.createElement("bufferGeometry",null,i.createElement("bufferAttribute",{attach:"attributes-position",args:[x,3]}),i.createElement("bufferAttribute",{attach:"attributes-size",args:[E,1]}),i.createElement("bufferAttribute",{attach:"attributes-opacity",args:[M,1]}),i.createElement("bufferAttribute",{attach:"attributes-speed",args:[P,1]}),i.createElement("bufferAttribute",{attach:"attributes-color",args:[A,3]}),i.createElement("bufferAttribute",{attach:"attributes-noise",args:[S,3]})),h||i.createElement("sparklesImplMaterial",{transparent:!0,pixelRatio:b,depthWrite:!1}))})},79003:(e,t,r)=>{r.d(t,{Af:()=>l,Nz:()=>i,u5:()=>s,y3:()=>f});var n=r(30373);function i(e,t,r){if(!e)return;if(!0===r(e))return e;let n=t?e.return:e.child;for(;n;){let e=i(n,t,r);if(e)return e;n=t?null:n.sibling}}function o(e){try{return Object.defineProperties(e,{_currentRenderer:{get:()=>null,set(){}},_currentRenderer2:{get:()=>null,set(){}}})}catch(t){return e}}(()=>{var e,t;return"undefined"!=typeof window&&((null==(e=window.document)?void 0:e.createElement)||(null==(t=window.navigator)?void 0:t.product)==="ReactNative")})()?n.useLayoutEffect:n.useEffect;let a=o(n.createContext(null));class l extends n.Component{render(){return n.createElement(a.Provider,{value:this._reactInternals},this.props.children)}}function s(){let e=n.useContext(a);if(null===e)throw Error("its-fine: useFiber must be called within a <FiberProvider />!");let t=n.useId();return n.useMemo(()=>{for(let r of[e,null==e?void 0:e.alternate]){if(!r)continue;let e=i(r,!1,e=>{let r=e.memoizedState;for(;r;){if(r.memoizedState===t)return!0;r=r.next}});if(e)return e}},[e,t])}let u=Symbol.for("react.context"),c=e=>null!==e&&"object"==typeof e&&"$$typeof"in e&&e.$$typeof===u;function f(){let e=function(){let e=s(),[t]=n.useState(()=>new Map);t.clear();let r=e;for(;r;){let e=r.type;c(e)&&e!==a&&!t.has(e)&&t.set(e,n.use(o(e))),r=r.return}return t}();return n.useMemo(()=>Array.from(e.keys()).reduce((t,r)=>i=>n.createElement(t,null,n.createElement(r.Provider,{...i,value:e.get(r)})),e=>n.createElement(l,{...e})),[e])}},84777:(e,t,r)=>{r.d(t,{m:()=>f});var n=r(55887),i=r(30373),o=r(17390);let a=parseInt(o.sPf.replace(/\D+/g,""));var l=Object.defineProperty,s=(e,t,r)=>(((e,t,r)=>t in e?l(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r)(e,"symbol"!=typeof t?t+"":t,r),r);let u=(()=>{let e={uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new o.Pq0},up:{value:new o.Pq0(0,1,0)}},vertexShader:`
      uniform vec3 sunPosition;
      uniform float rayleigh;
      uniform float turbidity;
      uniform float mieCoefficient;
      uniform vec3 up;

      varying vec3 vWorldPosition;
      varying vec3 vSunDirection;
      varying float vSunfade;
      varying vec3 vBetaR;
      varying vec3 vBetaM;
      varying float vSunE;

      // constants for atmospheric scattering
      const float e = 2.71828182845904523536028747135266249775724709369995957;
      const float pi = 3.141592653589793238462643383279502884197169;

      // wavelength of used primaries, according to preetham
      const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
      // this pre-calcuation replaces older TotalRayleigh(vec3 lambda) function:
      // (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
      const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

      // mie stuff
      // K coefficient for the primaries
      const float v = 4.0;
      const vec3 K = vec3( 0.686, 0.678, 0.666 );
      // MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
      const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

      // earth shadow hack
      // cutoffAngle = pi / 1.95;
      const float cutoffAngle = 1.6110731556870734;
      const float steepness = 1.5;
      const float EE = 1000.0;

      float sunIntensity( float zenithAngleCos ) {
        zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
        return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
      }

      vec3 totalMie( float T ) {
        float c = ( 0.2 * T ) * 10E-18;
        return 0.434 * c * MieConst;
      }

      void main() {

        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        gl_Position.z = gl_Position.w; // set z to camera.far

        vSunDirection = normalize( sunPosition );

        vSunE = sunIntensity( dot( vSunDirection, up ) );

        vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

        float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

      // extinction (absorbtion + out scattering)
      // rayleigh coefficients
        vBetaR = totalRayleigh * rayleighCoefficient;

      // mie coefficients
        vBetaM = totalMie( turbidity ) * mieCoefficient;

      }
    `,fragmentShader:`
      varying vec3 vWorldPosition;
      varying vec3 vSunDirection;
      varying float vSunfade;
      varying vec3 vBetaR;
      varying vec3 vBetaM;
      varying float vSunE;

      uniform float mieDirectionalG;
      uniform vec3 up;

      const vec3 cameraPos = vec3( 0.0, 0.0, 0.0 );

      // constants for atmospheric scattering
      const float pi = 3.141592653589793238462643383279502884197169;

      const float n = 1.0003; // refractive index of air
      const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

      // optical length at zenith for molecules
      const float rayleighZenithLength = 8.4E3;
      const float mieZenithLength = 1.25E3;
      // 66 arc seconds -> degrees, and the cosine of that
      const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

      // 3.0 / ( 16.0 * pi )
      const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
      // 1.0 / ( 4.0 * pi )
      const float ONE_OVER_FOURPI = 0.07957747154594767;

      float rayleighPhase( float cosTheta ) {
        return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
      }

      float hgPhase( float cosTheta, float g ) {
        float g2 = pow( g, 2.0 );
        float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
        return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
      }

      void main() {

        vec3 direction = normalize( vWorldPosition - cameraPos );

      // optical length
      // cutoff angle at 90 to avoid singularity in next formula.
        float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
        float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
        float sR = rayleighZenithLength * inverse;
        float sM = mieZenithLength * inverse;

      // combined extinction factor
        vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

      // in scattering
        float cosTheta = dot( direction, vSunDirection );

        float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
        vec3 betaRTheta = vBetaR * rPhase;

        float mPhase = hgPhase( cosTheta, mieDirectionalG );
        vec3 betaMTheta = vBetaM * mPhase;

        vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
        Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

      // nightsky
        float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
        float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
        vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
        vec3 L0 = vec3( 0.1 ) * Fex;

      // composition + solar disc
        float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
        L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

        vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

        vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

        gl_FragColor = vec4( retColor, 1.0 );

      #include <tonemapping_fragment>
      #include <${a>=154?"colorspace_fragment":"encodings_fragment"}>

      }
    `},t=new o.BKk({name:"SkyShader",fragmentShader:e.fragmentShader,vertexShader:e.vertexShader,uniforms:o.LlO.clone(e.uniforms),side:o.hsX,depthWrite:!1});class r extends o.eaF{constructor(){super(new o.iNn(1,1,1),t)}}return s(r,"SkyShader",e),s(r,"material",t),r})();function c(e,t,r=new o.Pq0){let n=Math.PI*(e-.5),i=2*Math.PI*(t-.5);return r.x=Math.cos(i),r.y=Math.sin(n),r.z=Math.sin(i),r}let f=i.forwardRef(({inclination:e=.6,azimuth:t=.1,distance:r=1e3,mieCoefficient:a=.005,mieDirectionalG:l=.8,rayleigh:s=.5,turbidity:f=10,sunPosition:d=c(e,t),...m},p)=>{let h=i.useMemo(()=>new o.Pq0().setScalar(r),[r]),[v]=i.useState(()=>new u);return i.createElement("primitive",(0,n.A)({object:v,ref:p,"material-uniforms-mieCoefficient-value":a,"material-uniforms-mieDirectionalG-value":l,"material-uniforms-rayleigh-value":s,"material-uniforms-sunPosition-value":d,"material-uniforms-turbidity-value":f,scale:h},m))})},97097:(e,t,r)=>{r.d(t,{A:()=>u});var n=r(30373),i=r(5338),o=r(17390),a=r(44091);class l extends o.BKk{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
      uniform float time;
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
        gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
        gl_Position = projectionMatrix * mvPosition;
      }`,fragmentShader:`
      uniform sampler2D pointTexture;
      uniform float fade;
      varying vec3 vColor;
      void main() {
        float opacity = 1.0;
        if (fade == 1.0) {
          float d = distance(gl_PointCoord, vec2(0.5, 0.5));
          opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
        }
        gl_FragColor = vec4(vColor, opacity);

        #include <tonemapping_fragment>
	      #include <${a.r>=154?"colorspace_fragment":"encodings_fragment"}>
      }`})}}let s=e=>new o.Pq0().setFromSpherical(new o.YHV(e,Math.acos(1-2*Math.random()),2*Math.random()*Math.PI)),u=n.forwardRef(({radius:e=100,depth:t=50,count:r=5e3,saturation:a=0,factor:u=4,fade:c=!1,speed:f=1},d)=>{let m=n.useRef(null),[p,h,v]=n.useMemo(()=>{let n=[],i=[],l=Array.from({length:r},()=>(.5+.5*Math.random())*u),c=new o.Q1f,f=e+t,d=t/r;for(let e=0;e<r;e++)f-=d*Math.random(),n.push(...s(f).toArray()),c.setHSL(e/r,a,.9),i.push(c.r,c.g,c.b);return[new Float32Array(n),new Float32Array(i),new Float32Array(l)]},[r,t,u,e,a]);(0,i.D)(e=>m.current&&(m.current.uniforms.time.value=e.clock.elapsedTime*f));let[g]=n.useState(()=>new l);return n.createElement("points",{ref:d},n.createElement("bufferGeometry",null,n.createElement("bufferAttribute",{attach:"attributes-position",args:[p,3]}),n.createElement("bufferAttribute",{attach:"attributes-color",args:[h,3]}),n.createElement("bufferAttribute",{attach:"attributes-size",args:[v,1]})),n.createElement("primitive",{ref:m,object:g,attach:"material",blending:o.EZo,"uniforms-fade-value":c,depthWrite:!1,transparent:!0,vertexColors:!0}))})},97414:(e,t,r)=>{r.d(t,{k:()=>s});var n=r(30373),i=r(5338),o=Object.defineProperty,a=(e,t,r)=>(((e,t,r)=>t in e?o(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r)(e,"symbol"!=typeof t?t+"":t,r),r);class l{constructor(e=Math){a(this,"grad3",[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]]),a(this,"grad4",[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]]),a(this,"p",[]),a(this,"perm",[]),a(this,"simplex",[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]),a(this,"dot",(e,t,r)=>e[0]*t+e[1]*r),a(this,"dot3",(e,t,r,n)=>e[0]*t+e[1]*r+e[2]*n),a(this,"dot4",(e,t,r,n,i)=>e[0]*t+e[1]*r+e[2]*n+e[3]*i),a(this,"noise",(e,t)=>{let r,n,i,o=.5*(Math.sqrt(3)-1)*(e+t),a=Math.floor(e+o),l=Math.floor(t+o),s=(3-Math.sqrt(3))/6,u=(a+l)*s,c=e-(a-u),f=t-(l-u),d=0,m=1;c>f&&(d=1,m=0);let p=c-d+s,h=f-m+s,v=c-1+2*s,g=f-1+2*s,y=255&a,b=255&l,w=this.perm[y+this.perm[b]]%12,x=this.perm[y+d+this.perm[b+m]]%12,E=this.perm[y+1+this.perm[b+1]]%12,M=.5-c*c-f*f;M<0?r=0:(M*=M,r=M*M*this.dot(this.grad3[w],c,f));let P=.5-p*p-h*h;P<0?n=0:(P*=P,n=P*P*this.dot(this.grad3[x],p,h));let S=.5-v*v-g*g;return S<0?i=0:(S*=S,i=S*S*this.dot(this.grad3[E],v,g)),70*(r+n+i)}),a(this,"noise3d",(e,t,r)=>{let n,i,o,a,l,s,u,c,f,d,m=1/3*(e+t+r),p=Math.floor(e+m),h=Math.floor(t+m),v=Math.floor(r+m),g=1/6*(p+h+v),y=e-(p-g),b=t-(h-g),w=r-(v-g);y>=b?b>=w?(l=1,s=0,u=0,c=1,f=1,d=0):(y>=w?(l=1,s=0,u=0):(l=0,s=0,u=1),c=1,f=0,d=1):b<w?(l=0,s=0,u=1,c=0,f=1,d=1):y<w?(l=0,s=1,u=0,c=0,f=1,d=1):(l=0,s=1,u=0,c=1,f=1,d=0);let x=y-l+1/6,E=b-s+1/6,M=w-u+1/6,P=y-c+1/6*2,S=b-f+1/6*2,A=w-d+1/6*2,C=y-1+1/6*3,R=b-1+1/6*3,k=w-1+1/6*3,_=255&p,T=255&h,z=255&v,j=this.perm[_+this.perm[T+this.perm[z]]]%12,I=this.perm[_+l+this.perm[T+s+this.perm[z+u]]]%12,L=this.perm[_+c+this.perm[T+f+this.perm[z+d]]]%12,O=this.perm[_+1+this.perm[T+1+this.perm[z+1]]]%12,F=.6-y*y-b*b-w*w;F<0?n=0:(F*=F,n=F*F*this.dot3(this.grad3[j],y,b,w));let D=.6-x*x-E*E-M*M;D<0?i=0:(D*=D,i=D*D*this.dot3(this.grad3[I],x,E,M));let B=.6-P*P-S*S-A*A;B<0?o=0:(B*=B,o=B*B*this.dot3(this.grad3[L],P,S,A));let H=.6-C*C-R*R-k*k;return H<0?a=0:(H*=H,a=H*H*this.dot3(this.grad3[O],C,R,k)),32*(n+i+o+a)}),a(this,"noise4d",(e,t,r,n)=>{let i,o,a,l,s,u,c,f,d,m,p,h,v,g,y,b,w,x=this.grad4,E=this.simplex,M=this.perm,P=(5-Math.sqrt(5))/20,S=(Math.sqrt(5)-1)/4*(e+t+r+n),A=Math.floor(e+S),C=Math.floor(t+S),R=Math.floor(r+S),k=Math.floor(n+S),_=(A+C+R+k)*P,T=e-(A-_),z=t-(C-_),j=r-(R-_),I=n-(k-_),L=32*(T>z)+16*(T>j)+8*(z>j)+4*(T>I)+2*(z>I)+ +(j>I);u=+(E[L][0]>=3),c=+(E[L][1]>=3),f=+(E[L][2]>=3),d=+(E[L][3]>=3),m=+(E[L][0]>=2),p=+(E[L][1]>=2),h=+(E[L][2]>=2),v=+(E[L][3]>=2),g=+(E[L][0]>=1),y=+(E[L][1]>=1),b=+(E[L][2]>=1),w=+(E[L][3]>=1);let O=T-u+P,F=z-c+P,D=j-f+P,B=I-d+P,H=T-m+2*P,q=z-p+2*P,W=j-h+2*P,N=I-v+2*P,V=T-g+3*P,Y=z-y+3*P,U=j-b+3*P,K=I-w+3*P,$=T-1+4*P,X=z-1+4*P,Q=j-1+4*P,G=I-1+4*P,Z=255&A,J=255&C,ee=255&R,et=255&k,er=M[Z+M[J+M[ee+M[et]]]]%32,en=M[Z+u+M[J+c+M[ee+f+M[et+d]]]]%32,ei=M[Z+m+M[J+p+M[ee+h+M[et+v]]]]%32,eo=M[Z+g+M[J+y+M[ee+b+M[et+w]]]]%32,ea=M[Z+1+M[J+1+M[ee+1+M[et+1]]]]%32,el=.6-T*T-z*z-j*j-I*I;el<0?i=0:(el*=el,i=el*el*this.dot4(x[er],T,z,j,I));let es=.6-O*O-F*F-D*D-B*B;es<0?o=0:(es*=es,o=es*es*this.dot4(x[en],O,F,D,B));let eu=.6-H*H-q*q-W*W-N*N;eu<0?a=0:(eu*=eu,a=eu*eu*this.dot4(x[ei],H,q,W,N));let ec=.6-V*V-Y*Y-U*U-K*K;ec<0?l=0:(ec*=ec,l=ec*ec*this.dot4(x[eo],V,Y,U,K));let ef=.6-$*$-X*X-Q*Q-G*G;return ef<0?s=0:(ef*=ef,s=ef*ef*this.dot4(x[ea],$,X,Q,G)),27*(i+o+a+l+s)});for(let t=0;t<256;t++)this.p[t]=Math.floor(256*e.random());for(let e=0;e<512;e++)this.perm[e]=this.p[255&e]}}let s=n.forwardRef(({intensity:e=1,decay:t,decayRate:r=.65,maxYaw:o=.1,maxPitch:a=.1,maxRoll:s=.1,yawFrequency:u=.1,pitchFrequency:c=.1,rollFrequency:f=.1},d)=>{let m=(0,i.C)(e=>e.camera),p=(0,i.C)(e=>e.controls),h=n.useRef(e),v=n.useRef(m.rotation.clone()),[g]=n.useState(()=>new l),[y]=n.useState(()=>new l),[b]=n.useState(()=>new l),w=()=>{(h.current<0||h.current>1)&&(h.current=h.current<0?0:1)};return n.useImperativeHandle(d,()=>({getIntensity:()=>h.current,setIntensity:e=>{h.current=e,w()}}),[]),n.useEffect(()=>{if(p){let e=()=>void(v.current=m.rotation.clone());return p.addEventListener("change",e),e(),()=>void p.removeEventListener("change",e)}},[m,p]),(0,i.D)((e,n)=>{let i=Math.pow(h.current,2),l=o*i*g.noise(e.clock.elapsedTime*u,1),d=a*i*y.noise(e.clock.elapsedTime*c,1),p=s*i*b.noise(e.clock.elapsedTime*f,1);m.rotation.set(v.current.x+d,v.current.y+l,v.current.z+p),t&&h.current>0&&(h.current-=r*n,w())}),null})},98775:(e,t)=>{function r(e,t){var r=e.length;for(e.push(t);0<r;){var n=r-1>>>1,i=e[n];if(0<o(i,t))e[n]=t,e[r]=i,r=n;else break}}function n(e){return 0===e.length?null:e[0]}function i(e){if(0===e.length)return null;var t=e[0],r=e.pop();if(r!==t){e[0]=r;for(var n=0,i=e.length,a=i>>>1;n<a;){var l=2*(n+1)-1,s=e[l],u=l+1,c=e[u];if(0>o(s,r))u<i&&0>o(c,s)?(e[n]=c,e[u]=r,n=u):(e[n]=s,e[l]=r,n=l);else if(u<i&&0>o(c,r))e[n]=c,e[u]=r,n=u;else break}}return t}function o(e,t){var r=e.sortIndex-t.sortIndex;return 0!==r?r:e.id-t.id}if(t.unstable_now=void 0,"object"==typeof performance&&"function"==typeof performance.now){var a,l=performance;t.unstable_now=function(){return l.now()}}else{var s=Date,u=s.now();t.unstable_now=function(){return s.now()-u}}var c=[],f=[],d=1,m=null,p=3,h=!1,v=!1,g=!1,y=!1,b="function"==typeof setTimeout?setTimeout:null,w="function"==typeof clearTimeout?clearTimeout:null,x="undefined"!=typeof setImmediate?setImmediate:null;function E(e){for(var t=n(f);null!==t;){if(null===t.callback)i(f);else if(t.startTime<=e)i(f),t.sortIndex=t.expirationTime,r(c,t);else break;t=n(f)}}function M(e){if(g=!1,E(e),!v)if(null!==n(c))v=!0,P||(P=!0,a());else{var t=n(f);null!==t&&z(M,t.startTime-e)}}var P=!1,S=-1,A=5,C=-1;function R(){return!!y||!(t.unstable_now()-C<A)}function k(){if(y=!1,P){var e=t.unstable_now();C=e;var r=!0;try{e:{v=!1,g&&(g=!1,w(S),S=-1),h=!0;var o=p;try{t:{for(E(e),m=n(c);null!==m&&!(m.expirationTime>e&&R());){var l=m.callback;if("function"==typeof l){m.callback=null,p=m.priorityLevel;var s=l(m.expirationTime<=e);if(e=t.unstable_now(),"function"==typeof s){m.callback=s,E(e),r=!0;break t}m===n(c)&&i(c),E(e)}else i(c);m=n(c)}if(null!==m)r=!0;else{var u=n(f);null!==u&&z(M,u.startTime-e),r=!1}}break e}finally{m=null,p=o,h=!1}}}finally{r?a():P=!1}}}if("function"==typeof x)a=function(){x(k)};else if("undefined"!=typeof MessageChannel){var _=new MessageChannel,T=_.port2;_.port1.onmessage=k,a=function(){T.postMessage(null)}}else a=function(){b(k,0)};function z(e,r){S=b(function(){e(t.unstable_now())},r)}t.unstable_IdlePriority=5,t.unstable_ImmediatePriority=1,t.unstable_LowPriority=4,t.unstable_NormalPriority=3,t.unstable_Profiling=null,t.unstable_UserBlockingPriority=2,t.unstable_cancelCallback=function(e){e.callback=null},t.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):A=0<e?Math.floor(1e3/e):5},t.unstable_getCurrentPriorityLevel=function(){return p},t.unstable_next=function(e){switch(p){case 1:case 2:case 3:var t=3;break;default:t=p}var r=p;p=t;try{return e()}finally{p=r}},t.unstable_requestPaint=function(){y=!0},t.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var r=p;p=e;try{return t()}finally{p=r}},t.unstable_scheduleCallback=function(e,i,o){var l=t.unstable_now();switch(o="object"==typeof o&&null!==o&&"number"==typeof(o=o.delay)&&0<o?l+o:l,e){case 1:var s=-1;break;case 2:s=250;break;case 5:s=0x3fffffff;break;case 4:s=1e4;break;default:s=5e3}return s=o+s,e={id:d++,callback:i,priorityLevel:e,startTime:o,expirationTime:s,sortIndex:-1},o>l?(e.sortIndex=o,r(f,e),null===n(c)&&e===n(f)&&(g?(w(S),S=-1):g=!0,z(M,o-l))):(e.sortIndex=s,r(c,e),v||h||(v=!0,P||(P=!0,a()))),e},t.unstable_shouldYield=R,t.unstable_wrapCallback=function(e){var t=p;return function(){var r=p;p=t;try{return e.apply(this,arguments)}finally{p=r}}}}}]);