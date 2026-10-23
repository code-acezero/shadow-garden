(()=>{var a={};a.id=5994,a.ids=[5994],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},5335:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>I,patchFetch:()=>H,routeModule:()=>D,serverHooks:()=>G,workAsyncStorage:()=>E,workUnitAsyncStorage:()=>F});var d={};c.r(d),c.d(d,{POST:()=>C,dynamic:()=>x,runtime:()=>w});var e=c(47970),f=c(30715),g=c(10842),h=c(44444),i=c(63522),j=c(261),k=c(38900),l=c(79806),m=c(88118),n=c(47717),o=c(68947),p=c(46537),q=c(37375),r=c(40568),s=c(86439),t=c(63686),u=c(58627),v=c(44869);let w="nodejs",x="force-dynamic",y=(0,v.UU)("https://kacgsuabfdqcskjonzkl.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY||"sb_publishable_UOBkqQdOw4XFiO2CMmrmyw_kALwbMGw");function z(a){switch(a){case"watching":default:return"CURRENT";case"completed":return"COMPLETED";case"plan_to_watch":return"PLANNING";case"on_hold":return"PAUSED";case"dropped":return"DROPPED"}}function A(a){switch(a){case"CURRENT":case"REPEATING":return"watching";case"COMPLETED":return"completed";case"PAUSED":return"on_hold";case"DROPPED":return"dropped";default:return"plan_to_watch"}}async function B(a,b){let c=parseInt(b||"",10);if(!isNaN(c)&&c>0&&String(c)===b){let a=`
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { english romaji native userPreferred }
          coverImage { extraLarge large medium }
          bannerImage
          format
          status
          episodes
          averageScore
        }
      }
    `,b=await fetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:a,variables:{id:c}})}),d=await b.json();if(d?.data?.Media)return d.data.Media}let d=[a?a.replace(/-[a-f0-9]{4,6}$/i,"").replace(/season\s+(\d+)/i,"Season $1").replace(/2nd Season/i,"Season 2").replace(/3rd Season/i,"Season 3").replace(/4th Season/i,"Season 4").replace(/\s*\(TV\)/gi,"").replace(/\s*\(Dub\)/gi,"").replace(/\s*\(Sub\)/gi,"").trim():"",a];a.toLowerCase().includes("war of the three")&&d.unshift("Tokyo Revengers: War of the Three Titans Arc");let e=`
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title { english romaji native userPreferred }
        coverImage { extraLarge large medium }
        bannerImage
        format
        status
        episodes
        averageScore
      }
    }
  `;for(let a of d)if(a&&!(a.length<2))try{let b=await fetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,variables:{search:a}})}),c=await b.json();if(c?.data?.Media)return c.data.Media}catch{}return null}async function C(a){try{let{action:b,userId:c,username:d,token:e}=await a.json();if(!c)return u.NextResponse.json({error:"User ID is required"},{status:400});let f=e,g=d;if(!f||!g){let{data:a}=await y.from("profiles").select("settings").eq("id",c).single();a?.settings&&(!f&&a.settings.anilist_token&&(f=a.settings.anilist_token),!g&&a.settings.anilist_username&&(g=a.settings.anilist_username))}if(g||(g="codeacezero"),"pull"===b){let a=`
        query ($userName: String) {
          MediaListCollection(userName: $userName, type: ANIME) {
            lists {
              name
              status
              entries {
                id
                mediaId
                status
                progress
                score(format: POINT_10)
                updatedAt
                media {
                  id
                  title { english romaji userPreferred }
                  coverImage { extraLarge large medium }
                  bannerImage
                  status
                  episodes
                  averageScore
                }
              }
            }
          }
        }
      `,b=await fetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:a,variables:{userName:g}})}),d=await b.json();if(d.errors)return u.NextResponse.json({error:d.errors[0]?.message||"Failed to fetch AniList data"},{status:400});let e=d?.data?.MediaListCollection?.lists||[],f=0,h=0;for(let a of e)for(let b of a.entries){h++;let a=b.media,d=String(a.id),e=a.title?.english||a.title?.romaji||a.title?.userPreferred||"Unknown Title",g=a.coverImage?.extraLarge||a.coverImage?.large||a.coverImage?.medium,i=A(b.status),{error:j}=await y.from("watchlist").upsert({user_id:c,anime_id:d,anime_title:e,anime_image:g,banner_image:a.bannerImage||null,status:i,last_episode_number:b.progress||0,total_episodes:a.episodes||null,score:b.score||(a.averageScore?Math.round(a.averageScore/10):null),media_type:"anime",updated_at:new Date(b.updatedAt?1e3*b.updatedAt:Date.now()).toISOString()},{onConflict:"user_id,anime_id"});!j&&f++}return u.NextResponse.json({success:!0,action:"pull",totalFound:h,importedCount:f})}if("push"===b){if(!f)return u.NextResponse.json({error:"AniList OAuth token is required to push changes. Connect your AniList account first.",requiresAuth:!0},{status:401});let{data:a,error:b}=await y.from("watchlist").select("*").eq("user_id",c);if(b||!a)return u.NextResponse.json({error:b?.message||"Failed to fetch watchlist"},{status:500});let d=`
        mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $score: Float) {
          SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress, score: $score) {
            id
            mediaId
            status
            progress
          }
        }
      `,e=0,g=0,h=[];for(let b of a)try{let a=await B(b.anime_title,b.anime_id);if(!a||!a.id){g++,h.push({title:b.anime_title,status:"unresolved"});continue}let c=z(b.status),i=b.last_episode_number||0,j=b.score?Number(b.score):void 0,k=await fetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${f}`},body:JSON.stringify({query:d,variables:{mediaId:a.id,status:c,progress:i,score:j}})}),l=await k.json();l?.data?.SaveMediaListEntry?(e++,h.push({title:b.anime_title,mediaId:a.id,status:"pushed",progress:i})):(g++,h.push({title:b.anime_title,status:"error",reason:l.errors?.[0]?.message})),await new Promise(a=>setTimeout(a,200))}catch(a){g++,h.push({title:b.anime_title,status:"exception",reason:a.message})}return u.NextResponse.json({success:!0,action:"push",totalItems:a.length,pushedCount:e,failedCount:g,details:h})}if("two-way"===b){let a=0,b=`
        query ($userName: String) {
          MediaListCollection(userName: $userName, type: ANIME) {
            lists {
              name
              status
              entries {
                id
                mediaId
                status
                progress
                score(format: POINT_10)
                updatedAt
                media {
                  id
                  title { english romaji userPreferred }
                  coverImage { extraLarge large medium }
                  bannerImage
                  status
                  episodes
                  averageScore
                }
              }
            }
          }
        }
      `,d=await fetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:b,variables:{userName:g}})}),e=await d.json();for(let b of e?.data?.MediaListCollection?.lists||[])for(let d of b.entries){let b=d.media,e=String(b.id),f=b.title?.english||b.title?.romaji||b.title?.userPreferred||"Unknown Title",g=b.coverImage?.extraLarge||b.coverImage?.large||b.coverImage?.medium,h=A(d.status),{error:i}=await y.from("watchlist").upsert({user_id:c,anime_id:e,anime_title:f,anime_image:g,banner_image:b.bannerImage||null,status:h,last_episode_number:d.progress||0,total_episodes:b.episodes||null,score:d.score||(b.averageScore?Math.round(b.averageScore/10):null),media_type:"anime",updated_at:new Date(d.updatedAt?1e3*d.updatedAt:Date.now()).toISOString()},{onConflict:"user_id,anime_id"});!i&&a++}let h=0;if(f){let{data:a}=await y.from("watchlist").select("*").eq("user_id",c);if(a){let b=`
            mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $score: Float) {
              SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress, score: $score) {
                id
                mediaId
                status
                progress
              }
            }
          `;for(let c of a)try{let a=await B(c.anime_title,c.anime_id);a?.id&&(await fetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${f}`},body:JSON.stringify({query:b,variables:{mediaId:a.id,status:z(c.status),progress:c.last_episode_number||0,score:c.score?Number(c.score):void 0}})}),h++,await new Promise(a=>setTimeout(a,200)))}catch{}}}return u.NextResponse.json({success:!0,action:"two-way",pulledCount:a,pushedCount:h,hasPushToken:!!f})}return u.NextResponse.json({error:`Unknown action: ${b}`},{status:400})}catch(a){return console.error("AniList Sync Error:",a),u.NextResponse.json({error:a.message||"Internal sync error"},{status:500})}}let D=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/anilist/sync/route",pathname:"/api/anilist/sync",filename:"route",bundlePath:"app/api/anilist/sync/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"D:\\ACE ZERO\\My web Project Data\\Ace Web Project\\shadow-garden-v2\\src\\app\\api\\anilist\\sync\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:E,workUnitAsyncStorage:F,serverHooks:G}=D;function H(){return(0,g.patchFetch)({workAsyncStorage:E,workUnitAsyncStorage:F})}async function I(a,b,c){var d;let e="/api/anilist/sync/route";"/index"===e&&(e="/");let g=await D.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,resolvedPathname:C}=g,E=(0,j.normalizeAppPath)(e),F=!!(y.dynamicRoutes[E]||y.routes[C]);if(F&&!x){let a=!!y.routes[C],b=y.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||D.isDev||x||(G="/index"===(G=C)?"/":G);let H=!0===D.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>D.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>D.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&A&&B&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await D.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})},z),b}},l=await D.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",A?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await D.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},7961:()=>{},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},94809:()=>{}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[8051,4869,1982],()=>b(b.s=5335));module.exports=c})();