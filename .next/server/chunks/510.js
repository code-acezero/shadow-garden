"use strict";exports.id=510,exports.ids=[510],exports.modules={30510:(a,b,c)=>{c.d(b,{s:()=>i});let d=new Map;async function e(a,b={}){let c=JSON.stringify({query:a,variables:b}),f=d.get(c);if(f&&Date.now()<f.expires)return f.data;let g=new AbortController,h=setTimeout(()=>g.abort(),12e3),i={method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query:a,variables:b}),signal:g.signal};try{let a=await fetch("https://graphql.anilist.co",i);if(clearTimeout(h),!a.ok)return console.warn(`[AniList] GraphQL request failed with status: ${a.status}`),null;let b=await a.json();if(b.errors)return console.warn("[AniList] GraphQL errors:",b.errors),null;let e=b.data;return d.set(c,{data:e,expires:Date.now()+3e5}),e}catch(a){return console.error("[AniList] Fetch error:",a),null}}let f=`
  id
  idMal
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
  }
  bannerImage
  format
  status
  episodes
  duration
  genres
  averageScore
  countryOfOrigin
  isAdult
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
`;function g(a){return a?a.replace(/<br\s*[\/]?>/gi,"\n").replace(/<[^>]*>?/gm,"").trim():""}function h(a,b){let c=a.title?.english||a.title?.romaji||a.title?.native||"Unknown Title",d=a.title?.romaji||a.title?.native||"",e=a.coverImage?.extraLarge||a.coverImage?.large||a.coverImage?.medium||"",f=b||0;if(!f){let b=Math.floor(Date.now()/1e3);a.nextAiringEpisode?.episode?f=a.nextAiringEpisode.airingAt&&a.nextAiringEpisode.airingAt<=b?a.nextAiringEpisode.episode:Math.max(1,a.nextAiringEpisode.episode-1):(a.status,f=a.episodes||1)}let g=!!a.isAdult,h=(a.genres||[]).some(a=>"string"==typeof a&&("ecchi"===a.toLowerCase()||"erotica"===a.toLowerCase())),i=g?"18+":h?"R-17":"PG-13",j=a.averageScore?(a.averageScore/10).toFixed(1):void 0;return{id:String(a.id),title:c,jname:d,poster:e,type:a.format||"TV",duration:a.duration?`${a.duration}m`:void 0,episodes:{sub:f,dub:f,eps:"FINISHED"===a.status&&a.episodes||f},rank:a.averageScore,isAdult:g,rating:i,ageRating:i,score:j,malId:a.idMal||void 0}}class i{static async getRecentEpisodes(a=1,b=24){let c=`
      query ($page: Int, $perPage: Int, $airingAt_lesser: Int) {
        Page(page: $page, perPage: $perPage) {
          airingSchedules(
            airingAt_lesser: $airingAt_lesser, 
            sort: TIME_DESC
          ) {
            id
            airingAt
            episode
            media {
              ${f}
            }
          }
        }
      }
    `,d=Math.floor(Date.now()/1e3),g=await e(c,{page:a,perPage:2*b,airingAt_lesser:d}),i=g?.Page?.airingSchedules||[],j=new Set,k=[];for(let a of i){let c=a.media;if(!c||c.countryOfOrigin&&"JP"!==c.countryOfOrigin||j.has(c.id))continue;j.add(c.id);let d=h(c,a.episode);if(d.episode=a.episode,d.airingAt=a.airingAt,k.push(d),k.length>=b)break}return k}static async getSpotlight(){let a=`
      query {
        Page(page: 1, perPage: 10) {
          media(
            type: ANIME, 
            sort: TRENDING_DESC, 
            countryOfOrigin: "JP",
            isAdult: false
          ) {
            ${f}
            description(asHtml: false)
          }
        }
      }
    `,b=await e(a);return(b?.Page?.media||[]).map(a=>({...h(a),description:g(a.description),banner:a.bannerImage||a.coverImage?.extraLarge||a.coverImage?.large}))}static async getHomeSections(){let[a,b,c,d,e]=await Promise.all([this.getSpotlight().catch(()=>[]),this.getRecentEpisodes(1,24).catch(()=>[]),this.getMostPopular(1,16).catch(()=>[]),this.getTopAiring(1,16).catch(()=>[]),this.getTopUpcoming(1,16).catch(()=>[])]);return{spotlight:a,recent:b,trending:c,topAiring:d,upcoming:e}}static async getTopAiring(a=1,b=24){let c=`
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            status: RELEASING, 
            sort: POPULARITY_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${f}
          }
        }
      }
    `,d=await e(c,{page:a,perPage:b});return(d?.Page?.media||[]).map(a=>h(a))}static async getMostPopular(a=1,b=24){let c=`
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            sort: POPULARITY_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${f}
          }
        }
      }
    `,d=await e(c,{page:a,perPage:b});return(d?.Page?.media||[]).map(a=>h(a))}static async getTopUpcoming(a=1,b=24){let c=`
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            status: NOT_YET_RELEASED, 
            sort: POPULARITY_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${f}
          }
        }
      }
    `,d=await e(c,{page:a,perPage:b});return(d?.Page?.media||[]).map(a=>h(a))}static async getCompleted(a=1,b=24){let c=`
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            status: FINISHED, 
            sort: POPULARITY_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${f}
          }
        }
      }
    `,d=await e(c,{page:a,perPage:b});return(d?.Page?.media||[]).map(a=>h(a))}static async getMostFavorite(a=1,b=24){let c=`
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            sort: FAVOURITES_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${f}
          }
        }
      }
    `,d=await e(c,{page:a,perPage:b});return(d?.Page?.media||[]).map(a=>h(a))}static async getMovies(a=1,b=24){let c=`
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            format: MOVIE, 
            sort: [POPULARITY_DESC, SCORE_DESC], 
            countryOfOrigin: "JP"
          ) {
            ${f}
          }
        }
      }
    `,d=await e(c,{page:a,perPage:b});return(d?.Page?.media||[]).map(a=>h(a))}static async getDonghua(a=1,b=24){let c=`
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            countryOfOrigin: "CN", 
            sort: [TRENDING_DESC, POPULARITY_DESC]
          ) {
            ${f}
          }
        }
      }
    `,d=await e(c,{page:a,perPage:b});return(d?.Page?.media||[]).map(a=>{let b=h(a);return b.isDonghua=!0,b.targetRoute=`/donghua-watch/${a.id}`,b})}static async getEnglishDubbed(a=1,b=24){let c=`
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            type: ANIME, 
            countryOfOrigin: "JP", 
            sort: [TRENDING_DESC, POPULARITY_DESC],
            status_in: [RELEASING, FINISHED]
          ) {
            ${f}
          }
        }
      }
    `,d=await e(c,{page:a,perPage:b});return(d?.Page?.media||[]).map(a=>{let b=h(a),c=b.episodes?.sub||a.episodes||1;return b.isDub=!0,b.targetRoute=`/watch/${a.id}?ep=${c}&type=dub`,b})}static async search(a,b=1,c=24){let d=`
      query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
            lastPage
          }
          media(
            search: $search, 
            type: ANIME, 
            countryOfOrigin: "JP"
          ) {
            ${f}
          }
        }
      }
    `,g=await e(d,{search:a,page:b,perPage:c}),i=g?.Page?.pageInfo;return{results:(g?.Page?.media||[]).map(a=>h(a)),currentPage:i?.currentPage??b,hasNextPage:!!i?.hasNextPage,hasPreviousPage:b>1,maxPage:i?.lastPage||(i?.hasNextPage?b+1:b),minPage:1}}static async getSearchSuggestions(a){let b=`
      query ($search: String) {
        Page(page: 1, perPage: 8) {
          media(
            search: $search, 
            type: ANIME, 
            countryOfOrigin: "JP"
          ) {
            id
            title {
              english
              romaji
            }
            coverImage {
              medium
            }
            format
            duration
          }
        }
      }
    `,c=await e(b,{search:a});return(c?.Page?.media||[]).map(a=>({id:String(a.id),title:a.title?.english||a.title?.romaji||"Unknown Title",poster:a.coverImage?.medium||"",type:a.format||"TV",duration:a.duration?`${a.duration}m`:"?"}))}static async getByGenre(a,b=1,c=24){let d=`
      query ($genre: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(
            genre: $genre, 
            type: ANIME, 
            sort: POPULARITY_DESC, 
            countryOfOrigin: "JP"
          ) {
            ${f}
          }
        }
      }
    `,g=await e(d,{genre:a,page:b,perPage:c});return(g?.Page?.media||[]).map(a=>h(a))}static async filter(a){let b={page:Number(a.page)||1,perPage:Number(a.perPage)||24};if(a.keyword?.trim()&&(b.search=a.keyword.trim()),a.genres||a.genre){let c=a.genres||a.genre,d=(Array.isArray(c)?c:String(c).split(",")).map(a=>a.trim()).filter(Boolean);d.length>0&&(b.genre_in=d)}if(a.genre_exclude||a.excluded_genres){let c=a.genre_exclude||a.excluded_genres,d=(Array.isArray(c)?c:String(c).split(",")).map(a=>a.trim()).filter(Boolean);d.length>0&&(b.genre_not_in=d)}if(a.type){let c=String(a.type).toUpperCase().replace(/[\s-]/g,"_");["TV","TV_SHORT","MOVIE","SPECIAL","OVA","ONA","MUSIC"].includes(c)&&(b.format=c)}if(a.status){let c=String(a.status).toLowerCase();c.includes("finish")||c.includes("complete")?b.status="FINISHED":c.includes("air")||c.includes("ongoing")?b.status="RELEASING":(c.includes("not")||c.includes("upcoming"))&&(b.status="NOT_YET_RELEASED")}if(a.season){let c=String(a.season).toUpperCase();["WINTER","SPRING","SUMMER","FALL"].includes(c)&&(b.season=c)}if(a.year){let c=parseInt(String(a.year),10);isNaN(c)||(b.seasonYear=c)}let c=["POPULARITY_DESC"];if(a.sort){let b=String(a.sort).toLowerCase();"score"===b||"top-score"===b?c=["SCORE_DESC","POPULARITY_DESC"]:"name-az"===b?c=["TITLE_ROMAJI"]:"release-date"===b?c=["START_DATE_DESC"]:"latest-updated"===b||"recent"===b?c=["UPDATED_AT_DESC"]:"latest-added"===b?c=["ID_DESC"]:"number_of_episodes"===b?c=["EPISODES_DESC"]:"trending"===b&&(c=["TRENDING_DESC"])}b.sort=c;let d=`
      query ($page: Int, $perPage: Int, $search: String, $genre_in: [String], $genre_not_in: [String], $format: MediaFormat, $status: MediaStatus, $season: MediaSeason, $seasonYear: Int, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
          media(
            search: $search,
            genre_in: $genre_in,
            genre_not_in: $genre_not_in,
            format: $format,
            status: $status,
            season: $season,
            seasonYear: $seasonYear,
            sort: $sort,
            type: ANIME,
            countryOfOrigin: "JP"
          ) {
            ${f}
          }
        }
      }
    `,g=await e(d,b);return(g?.Page?.media||[]).map(a=>h(a))}static async getAnimeInfo(a){let b=(a||"").trim(),c=b.match(/^(\d+)(?:-.*)?$/),d=b.match(/^(?:.*-)?(\d+)$/),f=c?c[1]:d?d[1]:null,h=!!f,i=`
      query (${h?"$id: Int":"$search: String"}) {
        Media(${h?"id: $id":"search: $search"}, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          description(asHtml: false)
          bannerImage
          coverImage {
            extraLarge
            large
            medium
          }
          format
          status
          episodes
          duration
          season
          seasonYear
          startDate {
            year
            month
            day
          }
          genres
          synonyms
          averageScore
          countryOfOrigin
          isAdult
          studios {
            edges {
              isMain
              node {
                id
                name
              }
            }
          }
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
          characters(sort: ROLE, perPage: 24) {
            edges {
              role
              node {
                id
                name {
                  full
                  native
                }
                image {
                  large
                  medium
                }
                favourites
              }
              voiceActors(language: JAPANESE) {
                id
                name {
                  full
                  native
                }
                image {
                  large
                  medium
                }
                language
              }
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                idMal
                title {
                  english
                  romaji
                  native
                }
                coverImage {
                  large
                  medium
                }
                bannerImage
                format
                type
                status
                episodes
                seasonYear
                startDate {
                  year
                }
                averageScore
              }
            }
          }
          recommendations(perPage: 12, sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                id
                idMal
                title {
                  english
                  romaji
                }
                coverImage {
                  medium
                }
                averageScore
                format
              }
            }
          }
          streamingEpisodes {
            title
            thumbnail
            url
            site
          }
        }
      }
    `,j={};h&&f?j.id=parseInt(f,10):j.search=b.replace(/-/g," ");let k=await e(i,j),l=k?.Media;if(!l&&h){let a=b.replace(/^(\d+)-?/,"").replace(/-?(\d+)$/,"").replace(/-/g," ").trim();if(a&&a.length>2){let b=`
          query ($search: String) {
            Media(search: $search, type: ANIME) {
              id
              idMal
              title {
                romaji
                english
                native
              }
              description(asHtml: false)
              bannerImage
              coverImage {
                extraLarge
                large
                medium
              }
              format
              status
              episodes
              duration
              season
              seasonYear
              startDate {
                year
                month
                day
              }
              genres
              synonyms
              averageScore
              countryOfOrigin
              isAdult
              studios {
                edges {
                  isMain
                  node {
                    id
                    name
                  }
                }
              }
              nextAiringEpisode {
                airingAt
                timeUntilAiring
                episode
              }
              characters(sort: ROLE, perPage: 24) {
                edges {
                  role
                  node {
                    id
                    name {
                      full
                      native
                    }
                    image {
                      large
                      medium
                    }
                    favourites
                  }
                  voiceActors(language: JAPANESE) {
                    id
                    name {
                      full
                      native
                    }
                    image {
                      large
                      medium
                    }
                    language
                  }
                }
              }
              relations {
                edges {
                  relationType
                  node {
                    id
                    idMal
                    title {
                      english
                      romaji
                      native
                    }
                    coverImage {
                      large
                      medium
                    }
                    bannerImage
                    format
                    type
                    status
                    episodes
                    seasonYear
                    startDate {
                      year
                    }
                    averageScore
                  }
                }
              }
              recommendations(perPage: 12, sort: RATING_DESC) {
                nodes {
                  mediaRecommendation {
                    id
                    idMal
                    title {
                      english
                      romaji
                    }
                    coverImage {
                      medium
                    }
                    averageScore
                    format
                  }
                }
              }
              streamingEpisodes {
                title
                thumbnail
                url
                site
              }
            }
          }
        `,c=await e(b,{search:a});l=c?.Media}}if(!l)return null;let m=String(l.id),n=l.title?.english||l.title?.romaji||l.title?.native||"Unknown Title",o=l.title?.native||l.title?.romaji||"",p=l.coverImage?.extraLarge||l.coverImage?.large||l.coverImage?.medium||"",q=l.bannerImage||p,r=g(l.description),s=l.episodes||0,t=Math.floor(Date.now()/1e3);l.nextAiringEpisode?.episode?s=l.nextAiringEpisode.airingAt&&l.nextAiringEpisode.airingAt<=t?l.nextAiringEpisode.episode:Math.max(1,l.nextAiringEpisode.episode-1):l.streamingEpisodes&&l.streamingEpisodes.length>0&&(s=Math.max(s,l.streamingEpisodes.length)),0===s&&"RELEASING"===l.status&&(s=1);let u=[],v=new Map;Array.isArray(l.streamingEpisodes)&&l.streamingEpisodes.forEach(a=>{let b=a.title?.match(/Episode\s+(\d+)/i)||a.url?.match(/episode-(\d+)/i);if(b){let c=parseInt(b[1],10);v.has(c)||v.set(c,a)}});let w="FINISHED"===l.status?Math.max(s,l.episodes||0):s>0?s:l.episodes||1;for(let a=1;a<=w;a++){let b=v.get(a);u.push({id:`${m}::${a}`,number:a,title:b?.title||`Episode ${a}`,isFiller:!1,isDub:!0,isSub:!0,hasDub:!0,hasSub:!0,malId:l.idMal||void 0})}let x=[];Array.isArray(l.characters?.edges)&&l.characters.edges.forEach(a=>{let b=a.node,c=a.voiceActors?.[0];b&&x.push({id:String(b.id),name:b.name?.full||"Unknown",poster:b.image?.large||b.image?.medium||"",role:a.role||"MAIN",favorites:b.favourites||void 0,voiceActor:c?{id:String(c.id),name:c.name?.full||"",poster:c.image?.large||c.image?.medium||"",language:c.language||"Japanese"}:void 0})});let y=[];Array.isArray(l.relations?.edges)&&l.relations.edges.forEach(a=>{let b=a.node;if(b&&"ANIME"===b.type){let c=b.seasonYear||b.startDate?.year||"";y.push({id:String(b.id),title:b.title?.english||b.title?.romaji||b.title?.native||"Unknown",jname:b.title?.native||b.title?.romaji||"",poster:b.coverImage?.large||b.coverImage?.medium||"",banner:b.bannerImage||"",type:b.format||"ANIME",relationType:a.relationType||"RELATION",status:b.status||"",year:c,seasonYear:b.seasonYear||(b.startDate?.year?Number(b.startDate.year):void 0),episodesCount:b.episodes||void 0,score:b.averageScore?(b.averageScore/10).toFixed(1):void 0})}});let z=[];Array.isArray(l.recommendations?.nodes)&&l.recommendations.nodes.forEach(a=>{let b=a.mediaRecommendation;b&&z.push({id:String(b.id),title:b.title?.english||b.title?.romaji||"Unknown",poster:b.coverImage?.medium||"",type:b.format||"TV",rank:b.averageScore})});let A=!!l.isAdult,B=(l.genres||[]).some(a=>"string"==typeof a&&("ecchi"===a.toLowerCase()||"erotica"===a.toLowerCase()||"hentai"===a.toLowerCase())),C=Array.isArray(l.studios?.edges)?l.studios.edges:[],D=C.filter(a=>a.isMain&&a.node?.name).map(a=>a.node.name),E=C.filter(a=>!a.isMain&&a.node?.name).map(a=>a.node.name),F=D.length>0?D:C[0]?.node?.name?[C[0].node.name]:[],G=l.nextAiringEpisode?{airingAt:l.nextAiringEpisode.airingAt,timeUntilAiring:l.nextAiringEpisode.timeUntilAiring,episode:l.nextAiringEpisode.episode,airingISOTimestamp:new Date(1e3*l.nextAiringEpisode.airingAt).toISOString()}:null;return{id:m,title:n,jname:o,poster:p,banner:q,description:r,isAdult:A,malId:l.idMal||void 0,countryOfOrigin:l.countryOfOrigin||"JP",nextAiringEpisode:G,stats:{rating:A?"18+":B?"R-17":"PG-13",quality:"HD",duration:l.duration?`${l.duration}m`:"24m",type:l.format||"TV",malScore:l.averageScore?(l.averageScore/10).toFixed(1):"?",episodes:{sub:s,dub:s}},info:{status:l.status||"Finished",genres:l.genres||[],studios:F,producers:E,aired:l.startDate?.year?`${l.startDate.year}`:"?",premiered:l.season&&l.seasonYear?`${l.season} ${l.seasonYear}`:"?",japanese:o,synonyms:(l.synonyms||[]).join(", "),nextAiringEpisode:G},episodes:u,characters:x,recommendations:z,related:y,seasons:[],trailers:[]}}static async getEpisodes(a){let b=await this.getAnimeInfo(a);return b?.episodes||[]}static async getSchedule(a,b=0){try{let c=new Date(a),d=isNaN(c.getTime())?new Date:c,f=Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0).getTime()/1e3)-3600*b,g=`
        query ($airingAt_greater: Int, $airingAt_lesser: Int) {
          Page(page: 1, perPage: 50) {
            airingSchedules(
              airingAt_greater: $airingAt_greater,
              airingAt_lesser: $airingAt_lesser,
              sort: TIME
            ) {
              id
              airingAt
              timeUntilAiring
              episode
              media {
                id
                title {
                  english
                  romaji
                  native
                }
                countryOfOrigin
              }
            }
          }
        }
      `,h=await e(g,{airingAt_greater:f,airingAt_lesser:f+86400});return{scheduledAnimes:(h?.Page?.airingSchedules||[]).filter(a=>a.media&&(!a.media.countryOfOrigin||"JP"===a.media.countryOfOrigin)).map(a=>{let b=new Date(1e3*a.airingAt).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0});return{id:String(a.media.id),time:b,name:a.media.title?.english||a.media.title?.romaji||"Unknown Title",jname:a.media.title?.romaji||a.media.title?.native||"",timestamp:a.airingAt,secondsUntilAiring:a.timeUntilAiring,episode:a.episode}})}}catch(a){return console.error("[AniList.getSchedule] Error:",a),{scheduledAnimes:[]}}}static async getAiringToday(a=1,b=24,c=!0){try{let d=new Date,g=Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0).getTime()/1e3),i=Math.floor(d.getTime()/1e3),j=`
        query ($start: Int, $end: Int, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              currentPage
              hasNextPage
              lastPage
            }
            airingSchedules(
              airingAt_greater: $start, 
              airingAt_lesser: $end, 
              sort: ${c?"TIME_DESC":"TIME"}
            ) {
              id
              airingAt
              episode
              timeUntilAiring
              media {
                ${f}
              }
            }
          }
        }
      `,k=await e(j,{start:g,end:c?i:g+86400,page:a,perPage:b}),l=k?.Page?.pageInfo;return{items:(k?.Page?.airingSchedules||[]).map(a=>{let b=h(a.media,a.episode);return b.airingAt=a.airingAt,b.timeUntilAiring=a.timeUntilAiring,b.airingTimeStr=new Date(1e3*a.airingAt).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0}),b.episode=a.episode,b.targetRoute=`/watch/${a.media?.id}?ep=${a.episode}`,b}),pageInfo:{currentPage:l?.currentPage||a,hasNextPage:!!l?.hasNextPage,totalPages:l?.lastPage||(l?.hasNextPage?a+1:a)}}}catch(a){return console.error("[AniList.getAiringToday] Error:",a),{items:[],pageInfo:{currentPage:1,hasNextPage:!1,totalPages:1}}}}static async getTooltip(a){let b=await this.getAnimeInfo(a);return b?{id:b.id,title:b.title,jname:b.jname,poster:b.poster,description:b.description,rating:b.stats?.rating,quality:b.stats?.quality,duration:b.stats?.duration,type:b.stats?.type,genres:b.info?.genres,studios:b.info?.studios?.join(", "),isAdult:b.isAdult}:null}}}};