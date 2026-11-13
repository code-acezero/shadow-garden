
(function(){
var T=THREE,$=function(i){return document.getElementById(i)},stage=$("stage");var QS=new URLSearchParams(location.search);if(QS.get("ui")==="0")document.body.classList.add("embed");if(QS.get("bg")==="transparent")document.body.classList.add("clear");
var ren=new T.WebGLRenderer({canvas:$("c"),antialias:true,alpha:true});ren.outputEncoding=T.sRGBEncoding;ren.localClippingEnabled=true;ren.setPixelRatio(Math.min(devicePixelRatio,2));
var scene=new T.Scene(),cam=new T.PerspectiveCamera(30,1,.05,50),ctl=new T.OrbitControls(cam,ren.domElement);ctl.enablePan=true;ctl.screenSpacePanning=true;ctl.minDistance=.25;ctl.maxDistance=9;ctl.minPolarAngle=0;ctl.maxPolarAngle=Math.PI;ctl.enableDamping=true;
function size(){var w=stage.clientWidth,h=stage.clientHeight;ren.setSize(w,h,false);cam.aspect=w/h;cam.position.set(0,1.1,w/h<.8?3.6:2.3);ctl.target.set(0,1.0,0);cam.updateProjectionMatrix();ctl.update()}
new ResizeObserver(size).observe(stage);size();
var N={},bones=[],rest={},hairMats=[],model,hipsRest,head,skinMesh,F={},mx=0,my=0,S={},ops=[];
var Q=new T.Quaternion(),Qi=new T.Quaternion(),DQ=new T.Quaternion(),v1=new T.Vector3(),v2=new T.Vector3(),up=new T.Vector3(),E3=new T.Euler();
var now=function(){return performance.now()/1000},pk=function(a){return a[Math.floor(Math.random()*a.length)]},rnd=function(a,b){return a+Math.random()*(b-a)};
function sb(s){var r=new Uint8Array(s.length),b=atob(s);for(var i=0;i<b.length;i++)r[i]=b.charCodeAt(i);return r.buffer}
/* ===== catalogs ===== */
var D={lid:[0,0],sq:[0,0],sm:.15,op:0,wd:1,bl:0,gz:[0,0],hd:[0,0,0],tg:0,rd:0,sk:0,w3:0,te:0,ar:-.5,tl:0,ps:1,fg:0,sw:0,tr:0};
var EXPR={neutral:{},happy:{lid:.15,sm:.8,bl:.15,sq:.35},joy:{lid:.9,sm:1,op:.45,bl:.4,wd:1.3,hd:[-.08,0,.1]},smug:{lid:.5,sm:.7,hd:[.05,.2,.12]},sleepy:{lid:.75,sm:0,hd:[.25,0,.1],fx:"💤"},surprised:{op:.85,sm:0,wd:.7,hd:[-.15,0,0]},shy:{bl:1,gz:[-.5,.4],sm:.3,lid:.25,hd:[.25,-.25,.08],fx:"💦"},embarrassed:{bl:1,lid:.45,sm:-.15,hd:[.3,.2,0],gz:[.5,.3]},sly:{lid:.5,sm:.6,hd:[0,-.2,-.15],gz:[.4,0]},wink_left:{lid:[.94,0],sm:.9,bl:.2,hd:[0,0,.1]},wink_right:{lid:[0,.94],sm:.9,bl:.2,hd:[0,0,-.1]},pout:{op:.15,wd:.45,bl:.45,sm:-.3,lid:.1,hd:[.05,.2,0]},sad:{lid:.35,sm:-.7,hd:[.2,0,0],fx:"💧"},angry:{lid:.3,sm:-.55,hd:[.05,0,0],fx:"💢"},thinking:{gz:[.6,-.6],sm:0,hd:[0,.15,.12]},love:{bl:1,lid:.6,sq:.4,sm:.95,fx:"💜"},tease:{sm:.9,op:.35,tg:1,lid:[.94,0],bl:.2,hd:[0,0,.18]},yawn:{op:1,lid:.9,wd:1.2,sm:0,hd:[-.15,0,0]},kiss:{op:.3,wd:.4,lid:.9,bl:.6,sm:0,fx:"💜"},pleased:{lid:.55,sm:.7,sq:.2},determined:{lid:.3,sm:.2,hd:[-.05,0,0]},bored:{lid:.55,sm:-.2,gz:[.6,.1],hd:[0,.1,.1]},mischievous:{lid:[.3,.5],sm:1,wd:1.2,hd:[0,0,.2],bl:.2},giggle:{lid:.8,sm:1,op:.3,bl:.3,wd:1.2,shake:1},nervous:{gz:[.4,.1],sm:-.1,fx:"💦",bl:.2},proud:{lid:.35,sm:.9,hd:[-.12,0,0],bl:.1},curious:{op:.12,wd:.5,hd:[0,.1,.2],gz:[.2,.3]},dazed:{lid:.5,op:.2,sm:0,hd:[.1,0,.2]}};
Object.assign(EXPR.happy,{te:.3});Object.assign(EXPR.joy,{te:1});Object.assign(EXPR.smug,{sk:.9,sm:.45});Object.assign(EXPR.sly,{sk:-.8});Object.assign(EXPR.surprised,{rd:1});Object.assign(EXPR.kiss,{rd:1});Object.assign(EXPR.pout,{rd:.6});Object.assign(EXPR.giggle,{te:.7});Object.assign(EXPR.tease,{sk:.6});Object.assign(EXPR.mischievous,{sk:.7,te:.5});Object.assign(EXPR.love,{te:.2});Object.assign(EXPR.curious,{rd:.7});Object.assign(EXPR.dazed,{rd:.5});Object.assign(EXPR.yawn,{rd:.3});
EXPR.cat={lid:.25,sm:.2,w3:1,bl:.5,hd:[0,0,.12]};EXPR.smirk={sm:.4,sk:1,lid:.35,hd:[0,.15,.1]};EXPR.grin={lid:.2,sm:1,op:.4,te:1,wd:1.25,bl:.2};EXPR.pensive={lid:.4,sm:-.25,hd:[.15,0,.05],gz:[-.2,-.3]};EXPR.cheeky={sm:.7,op:.3,tg:1,sk:.5,lid:[.2,.3],hd:[0,0,.15]};
Object.assign(EXPR.happy,{ar:.8,sq:.45});Object.assign(EXPR.joy,{ar:1});Object.assign(EXPR.giggle,{ar:1});Object.assign(EXPR.love,{ar:.9,ps:1.2});Object.assign(EXPR.pleased,{ar:.7});Object.assign(EXPR.proud,{ar:.3});Object.assign(EXPR.sleepy,{ar:-.6});Object.assign(EXPR.surprised,{ps:.55});Object.assign(EXPR.angry,{tl:-.9,ps:.8});Object.assign(EXPR.determined,{tl:-.5});Object.assign(EXPR.sad,{tl:.8,ps:1.15,tr:.6});Object.assign(EXPR.embarrassed,{sw:.6});Object.assign(EXPR.nervous,{sw:1,ps:.8});Object.assign(EXPR.smug,{tl:-.35});Object.assign(EXPR.sly,{tl:-.5});Object.assign(EXPR.bored,{tl:.15});Object.assign(EXPR.mischievous,{fg:1,tl:-.3,op:.12});Object.assign(EXPR.cheeky,{fg:.8});Object.assign(EXPR.dazed,{ef:"spiral",ps:.9});Object.assign(EXPR.yawn,{ar:-.5});
EXPR.heart_eyes={ef:"heart",bl:1,sm:.95,op:.3,te:.3,ps:1.2};EXPR.star_eyes={ef:"star",sm:1,op:.5,te:1,bl:.3};EXPR.spiral_eyes={ef:"spiral",sm:0,op:.2};EXPR.teary={tr:1,ps:1.2,sm:-.4,lid:.2,tl:.5,bl:.3};EXPR.shocked={ps:.4,op:.6,rd:.5,sm:-.2,sw:.8,hd:[-.1,0,0]};
var A=function(x,y,z){return[x,y,z]},sn=Math.sin,ab=function(x){return Math.abs(Math.sin(x))};
function arms(Lu,Lf,Ru,Rf,o){o=o||{};o.L=[Lu,Lf];o.R=[Ru,Rf];return o}
var G={
 wave:{d:3,ex:"happy",f:function(u){return{R:[A(-.75,.65,0),A(-.2+sn(u*10)*.7,.95,.1)],hd:[0,0,.08]}}},
 raise_hand:{d:2.5,ex:"curious",f:function(){return{R:[A(-.6,.8,.3),A(-.1,1,.3)]}}},
 clap:{d:3,ex:"joy",f:function(u){var c=ab(u*9);return arms(A(.3,-.6,.55),A(-.7+c*.4,.3,.9),A(-.3,-.6,.55),A(.7-c*.4,.3,.9))}},
 shrug:{d:2.2,ex:"nervous",f:function(){return arms(A(.7,-.6,.1),A(.5,.6,.2),A(-.7,-.6,.1),A(-.5,.6,.2),{hd:[0,0,.1],sp:[0,0,.05]})}},
 stretch:{d:4,ex:"yawn",f:function(u,p){var s=sn(Math.PI*p);return arms(A(.35,1,0),A(.1,1,0),A(-.35,1,0),A(-.1,1,0),{sp:[-.15*s,0,0],hd:[-.2*s,0,0]})}},
 tuck_hair:{d:2.5,ex:"shy",f:function(){return{R:[A(-.5,.1,.5),A(.3,.9,.5)],hd:[0,-.1,.1]}}},
 hands_behind:{d:5,ex:"pleased",f:function(){return arms(A(.15,-.9,-.5),A(-.3,-.3,-.9),A(-.15,-.9,-.5),A(.3,-.3,-.9),{sp:[-.05,0,0]})}},
 arms_cross:{d:4,ex:"pout",f:function(){return arms(A(.15,-.8,.5),A(-.9,.1,.5),A(-.15,-.8,.5),A(.9,.1,.5))}},
 think:{d:4,ex:"thinking",f:function(){return{R:[A(-.3,-.5,.6),A(.2,.9,.4)],hd:[.05,.2,.15]}}},
 shy_pose:{d:3.5,ex:"shy",f:function(){return arms(A(.2,-.85,.45),A(-.55,.35,.8),A(-.2,-.85,.45),A(.55,.35,.8),{hd:[.3,-.2,0]})}},
 tease_pose:{d:3,ex:"tease",f:function(){return{R:[A(-.2,-.75,.55),A(.2,.9,.45)],hd:[0,.15,.2],sp:[0,0,.06]}}},
 bow:{d:2.5,ex:"pleased",f:function(u,p){var s=sn(Math.PI*p);return{sp:[.5*s,0,0],hd:[.2*s,0,0]}}},
 lean_in:{d:3,ex:"curious",f:function(u,p){var s=sn(Math.PI*p);return{sp:[.3*s,0,0],hd:[-.1*s,0,.15*s]}}},
 nod:{d:1.6,ex:"happy",f:function(u){return{hd:[sn(u*8)*.15+.05,0,0]}}},
 shake_head:{d:1.6,ex:"pout",f:function(u){return{hd:[0,sn(u*9)*.35,0]}}},
 facepalm:{d:3,ex:"embarrassed",f:function(){return{R:[A(-.3,.1,.5),A(.5,.9,.6)],hd:[.3,0,0]}}},
 cheer:{d:3,ex:"joy",f:function(u){return arms(A(.5,1,0),A(.3,1,0),A(-.5,1,0),A(-.3,1,0),{hp:[0,ab(u*8)*.08,0]})}},
 point:{d:2.5,ex:"determined",f:function(){return{R:[A(-.1,.1,1),A(-.05,.1,1)]}}},
 hop:{d:1.6,ex:"joy",f:function(u){return arms(A(.55,-.7,.1),A(.08,-1,.28),A(-.55,-.7,.1),A(-.08,-1,.28),{hp:[0,ab(u*9)*.12,0]})}},
 spin:{d:1.4,ex:"giggle",f:function(u,p){return arms(A(.8,-.3,0),A(.5,-.8,0),A(-.8,-.3,0),A(-.5,-.8,0),{ry:p*Math.PI*2})}},
 blow_kiss:{d:3,ex:"kiss",f:function(u,p){return{R:p<.5?[A(-.3,.2,.6),A(.4,.9,.5)]:[A(-.3,.2,.8),A(-.3,.1,1)]}}},
 salute:{d:2.5,ex:"proud",f:function(){return{R:[A(-.5,.2,.2),A(.4,.9,.3)]}}},
 sway:{d:4,ex:"pleased",f:function(u){return{hp:[sn(u*2)*.02,0,0],sp:[0,0,sn(u*2)*.08],hd:[0,0,-sn(u*2)*.06]}}},
 peek:{d:3,ex:"mischievous",f:function(){return{sp:[.2,0,0],hd:[-.1,0,.25]}}},
 curtsy:{d:3,ex:"pleased",f:function(u,p){var s=sn(Math.PI*p);return arms(A(.3,-.8,.4),A(.1,-.9,.4),A(-.3,-.8,.4),A(-.1,-.9,.4),{hp:[0,-.06*s,0],hd:[.15*s,0,0]})}},
 dizzy:{d:3,ex:"dazed",f:function(u){return{hp:[sn(u*3)*.03,0,0],sp:[sn(u*2.2)*.1,0,sn(u*3)*.1],hd:[sn(u*2)*.15,sn(u*3)*.3,0]}}},
 giggle_shake:{d:2.2,ex:"giggle",f:function(u){return{sp:[0,0,sn(u*22)*.03],hp:[0,ab(u*11)*.01,0]}}},
 sneak:{d:3,ex:"sly",f:function(u,p){return{hd:[0,.35,-.15],sp:[.1,.2,0],hp:[sn(u*3)*.03,0,0]}}},
 weight_shift:{d:4,ex:"pleased",f:function(u){var s=sn(u*1.1)*.5+.5;return{hp:[.02*s,-.01*s,0],sp:[0,0,-.04*s],lg:[[A(.02,-1,0),A(0,-1,0)],[A(-.03,-1+.05*s,.1*s),A(0,-1+.15*s,-.3*s)]]}}},
 foot_tap:{d:3,ex:"bored",f:function(u){var k=Math.max(0,sn(u*12))*.8;return{lg:[[A(.02,-1,0),A(0,-1,0)],[A(-.02,-1,.08),A(0,-1+k*.15,-k*.6)]]}}},
 march:{d:4,ex:"determined",f:function(u){var s=sn(u*6.5),l=Math.max(0,s),r=Math.max(0,-s);return arms(A(.25,-.9,s*.5),A(.2,-.9,.2+s*.4),A(-.25,-.9,-s*.5),A(-.2,-.9,.2-s*.4),{hp:[0,ab(u*6.5)*.015,0],lg:[[A(.03,-1+l*.5,l*.8),A(0,-1+l*.3,-l*.7)],[A(-.03,-1+r*.5,r*.8),A(0,-1+r*.3,-r*.7)]]})}},
 stomp:{d:2.5,ex:"angry",f:function(u){var s=Math.max(0,sn(u*5));return arms(A(.25,-.9,.2),A(.1,-.9,.5),A(-.25,-.9,.2),A(-.1,-.9,.5),{hp:[0,-s*.01,0],lg:[[A(0,-1+s*.4,s*.5),A(0,-1+s*.2,-s*.2)],[A(-.02,-1,0),A(0,-1,0)]]})}},
 kick:{d:2,ex:"mischievous",f:function(u,p){var s=sn(Math.PI*p);return{sp:[-.1*s,0,0],lg:[[A(.03,-1,0),A(0,-1,0)],[A(-.05,-1+.45*s,.85*s),A(0,-1+.9*s,.4*s)]]}}},
 squat:{d:3,ex:"curious",f:function(u,p){var s=sn(Math.PI*p);return arms(A(.25,-.7,.5*s),A(.1,-.9,.4*s),A(-.25,-.7,.5*s),A(-.1,-.9,.4*s),{hp:[0,-.17*s,0],sp:[.35*s,0,0],lg:[[A(.15,-1+.45*s,.7*s),A(0,-1+.1*s,-.5*s)],[A(-.15,-1+.45*s,.7*s),A(0,-1+.1*s,-.5*s)]]})}},
 tiptoe:{d:3,ex:"happy",f:function(u,p){var s=sn(Math.PI*p);return{hp:[0,.04*s,0],lg:[[A(.03,-1,0),A(0,-1,0),A(0,-1,.2)],[A(-.03,-1,0),A(0,-1,0),A(0,-1,.2)]]}}},
 toe_in:{d:3.5,ex:"shy",f:function(){return arms(A(.2,-.85,.45),A(-.55,.35,.8),A(-.2,-.85,.45),A(.55,.35,.8),{hd:[.3,-.2,0],lg:[[A(-.1,-1,.04),A(.04,-1,0)],[A(.1,-1,.04),A(-.04,-1,0)]]})}},
 jump:{d:1.7,ex:"joy",f:function(u,p){var h=0,c=0,x;if(p<.22){c=sn(Math.PI/2*p/.22);h=-.08*c}else if(p<.72){x=(p-.22)/.5;h=1.2*x*(1-x);c=-1}else{x=(p-.72)/.28;c=sn(Math.PI/2*(1-x))*.8;h=-.08*c}
  var air=c<0,k=Math.abs(c);return arms(A(.5,air?.9:-.5,0),A(.3,air?.9:-.8,0),A(-.5,air?.9:-.5,0),A(-.3,air?.9:-.8,0),{hp:[0,h,0],sp:[air?-.1:.25*k,0,0],lg:air?[[A(.05,-.8,.5),A(0,-.8,-.6)],[A(-.05,-.8,.5),A(0,-.8,-.6)]]:[[A(.1,-1+k*.4,.6*k),A(0,-1+k*.2,-.6*k)],[A(-.1,-1+k*.4,.6*k),A(0,-1+k*.2,-.6*k)]]})}},
 roll_sleeves:{d:2.6,ex:"pleased",f:function(u){if(u>1.1)setTK(1);return arms(A(.25,-.6,.55),A(-.5,.3,.9),A(-.25,-.6,.55),A(.5,.3,.9),{hd:[.25,0,0]})}},
 unroll_sleeves:{d:2.4,ex:"pleased",f:function(u){if(u>1)setTK(0);return arms(A(.25,-.6,.55),A(-.5,.3,.9),A(-.25,-.6,.55),A(.5,.3,.9),{hd:[.25,0,0]})}}
};
var DANCE={
 sway:function(t){var s=sn(t*2);return arms(A(.4+s*.3,-.5,.1),A(.3,-.9,.1),A(-.4+s*.3,-.5,.1),A(-.3,-.9,.1),{hp:[s*.03,ab(t*2)*.02,0],sp:[0,s*.2,s*.1],hd:[0,0,-s*.1]})},
 bounce:function(t){var s=ab(t*5);return arms(A(.6,-.5,.2),A(.3,-.8,.3),A(-.6,-.5,.2),A(-.3,-.8,.3),{hp:[0,s*.07,0],hd:[s*.1,0,0]})},
 disco:function(t){var p=sn(t*4);return arms(A(.7,p>0?1:-.2,0),A(.4,p>0?.8:-.8,0),A(-.7,p>0?-.2:1,0),A(-.4,p>0?-.8:.8,0),{sp:[0,p*.25,0],hp:[p*.03,0,0]})},
 shimmy:function(t){var s=sn(t*14);return arms(A(.5,-.4,.5),A(-.3,-.5,.8),A(-.5,-.4,.5),A(.3,-.5,.8),{sp:[0,s*.2,0],hp:[s*.025,0,0],hd:[0,0,s*.05]})},
 robot:function(t){var q=Math.floor(t*3)%4,Z=[[A(.9,0,0),A(.9,1,0)],[A(.9,1,0),A(.9,0,0)],[A(.2,.9,.5),A(.5,.9,.9)],[A(.9,-.2,0),A(.9,.8,0)]][q];return{L:Z,R:[A(-Z[0][0],Z[0][1],Z[0][2]),A(-Z[1][0],Z[1][1],Z[1][2])],hd:[0,[0,.4,0,-.4][q],0],sp:[0,[0,.2,0,-.2][q],0]}},
 spin:function(t){return arms(A(.8,-.3,0),A(.5,-.8,0),A(-.8,-.3,0),A(-.5,-.8,0),{ry:t*3,hp:[0,ab(t*3)*.03,0]})},
 sidestep:function(t){var s=sn(t*3);return arms(A(.5,-.4,.3),A(.4,-.9,.3),A(-.5,-.4,.3),A(-.4,-.9,.3),{hp:[s*.07,ab(t*3)*.02,0],lg:[[A(.1,-1,s>0?.4:0),A(0,-1,s>0?-.4:0)],[A(-.1,-1,s<0?.4:0),A(0,-1,s<0?-.4:0)]],sp:[0,0,-s*.1]})},
 clap_dance:function(t){var c=ab(t*4.5);return arms(A(.3,-.5,.6),A(-.7+c*.4,.3,.9),A(-.3,-.5,.6),A(.7-c*.4,.3,.9),{hp:[0,ab(t*4.5)*.04,0],hd:[ab(t*4.5)*.08,0,0]})},
 twist:function(t){var s=sn(t*4);return arms(A(.7,-.2,0),A(.3,-.9,0),A(-.7,-.2,0),A(-.3,-.9,0),{sp:[0,s*.35,0],hp:[0,ab(t*4)*.02,0],ry:s*.5})},
 wave_arms:function(t){var s=sn(t*3);return arms(A(.8,.4+s*.6,0),A(.5,.7+s*.3,0),A(-.8,.4-s*.6,0),A(-.5,.7-s*.3,0),{sp:[0,0,s*.1],hp:[s*.02,0,0]})},
 step_dance:function(t){var s=sn(t*6),l=Math.max(0,s),r=Math.max(0,-s);return arms(A(.6,-.3+l*.8,.2),A(.4,-.5+l*.8,.3),A(-.6,-.3+r*.8,.2),A(-.4,-.5+r*.8,.3),{lg:[[A(.03,-1+l*.45,l*.7),A(0,-1+l*.2,-l*.6)],[A(-.03,-1+r*.45,r*.7),A(0,-1+r*.2,-r*.6)]],hp:[s*.02,ab(t*6)*.025,0],sp:[0,s*.2,0]})},
 knee_pop:function(t){var s=ab(t*4);return arms(A(.7,.3,0),A(.4,.8,0),A(-.7,.3,0),A(-.4,.8,0),{hp:[0,-s*.05,0],lg:[[A(.1,-1+s*.3,s*.5),A(0,-1+s*.1,-s*.4)],[A(-.1,-1+s*.3,s*.5),A(0,-1+s*.1,-s*.4)]]})}
};
var DEXP={sway:"pleased",bounce:"joy",disco:"smug",shimmy:"mischievous",robot:"determined",spin:"giggle",sidestep:"happy",clap_dance:"joy",twist:"happy",wave_arms:"love",step_dance:"happy",knee_pop:"mischievous"};
var IDLE=[["weight_shift"],["foot_tap"],["toe_in"],["stretch"],["tuck_hair"],["sway"],["hands_behind"],["shrug"],["think"],["peek"],["curtsy"],["sneak"],["giggle_shake"],["lean_in"],["bow"],["arms_cross"],["nod"]];
var MICRO=["happy","curious","pleased","smug","sly","wink_left","wink_right","tease","mischievous","giggle","thinking","bored","proud","kiss"];
var REACT={tail:[["surprised","shrug","Eep! Not the tail!","puff","spread_wide"],["shy","shy_pose","H-hey, that’s sensitive…","curl","wrap"],["giggle","sway","Hehe, stop, it tickles!","wag_fast","flutter"],["pout","arms_cross","Mou, don’t grab it!","lash","fold"],["mischievous","tease_pose","Careful, it bites back~","flick","half_spread"]],wing:[["surprised","shrug","Ah! My wings!","tremble","spread_wide"],["shy","shy_pose","Don’t ruffle my feathers…","curl","wrap"],["happy","stretch","Ahh, that feels nice.","sway","stretch"],["giggle","sway","Hehe, tickly!","wag","flutter"],["pout","shake_head","Hands off the feathers~","lash","fold"]],head:[["joy","sway","Headpats accepted. 💜"],["love","tuck_hair","Mmm, again, again!"],["giggle","shy_pose","Hehe, that tickles!"],["pleased","sway","You’re spoiling me~"],["shy","shy_pose","H-hey, my hair!"]],
 face:[["shy","shy_pose","Boop! Hey, that’s my nose!"],["embarrassed","shy_pose","My cheeks are warm now…"],["sly","tease_pose","You’re being sneaky."],["pout","shake_head","Mou, stop that~"]],
 hand:[["shy","shy_pose","H-holding hands? Okay…"],["happy","sway","Your hands are warm."],["love","hop","Eep! Hand-holding!?"]],
 arm:[["surprised","shrug","Ooh, what was that for?"],["mischievous","tease_pose","Careful, I might poke back."],["giggle","sway","Hehe, that tickles!"]],
 body:[["pout","arms_cross","Hey! Hands to yourself, cheeky~"],["mischievous","tease_pose","Somebody’s feeling bold today."],["angry","shake_head","Hmph! No poking!"],["embarrassed","shy_pose","S-stop it~"]]};
/* ===== state ===== */
var EX=null,ES=null,exEnd=0,curG=null,dance=null,lastAct=now(),nextIdle=now()+8,idleOn=true,blinkS=-9,nextBlink=2,dbl=false,sac=[0,0],nextSac=1,talkUntil=0,clicks=[];
function resolve(n){var e=Object.assign({},D,EXPR[n]||{});["lid","sq"].forEach(function(k){if(typeof e[k]==="number")e[k]=[e[k],e[k]]});return JSON.parse(JSON.stringify(e))}
function setEx(n,sec){EX=resolve(n);exEnd=now()+(sec||3);if(EXPR[n].fx)fx(EXPR[n].fx);var tm=TAILBY[n],wm=WINGBY[n];if(tm)setTail(tm,(sec||3));if(wm)setWing(wm,(sec||3))}
function act(g,ex,sec){lastAct=now();dance=null;loco=null;var o=G[g];curG={f:o.f,t0:now(),d:sec||o.d,n:g};setEx(ex||o.ex,curG.d+1)}
function startDance(n){n=n||pk(Object.keys(DANCE));lastAct=now();curG=null;loco=null;dance={n:n,end:now()+9};setEx(DEXP[n],10)}
EX=resolve("neutral");ES=resolve("neutral");
/* ===== load ===== */
function skinColor(m){try{var c=document.createElement("canvas");c.width=c.height=8;var x=c.getContext("2d");x.drawImage(m.map.image,330,770,16,16,0,0,8,8);var d=x.getImageData(0,0,8,8).data,k=new T.Color(d[0]/255,d[1]/255,d[2]/255);return k.convertSRGBToLinear()}catch(e){return new T.Color(1,.78,.75)}}
new T.GLTFLoader().parse(sb(GLB),"",function(g){
 model=g.scene;scene.add(model);
 model.traverse(function(o){if(o.isMesh){o.frustumCulled=false;if(o.material.name==="glasses")skinMesh=o;if(/hair/.test(o.material.name)){o.material.color.set(0xa070ff);hairMats.push(o.material)}}
  if(o.isBone){o.userData.i=bones.length;bones.push(o);N[o.name.replace(/_\d+$/,"")]=o;rest[o.uuid]=o.quaternion.clone()}});
 hipsRest=N.Hips.position.clone();head=N.Head;
 try{buildFace()}catch(e){console.error(e)}try{buildBody()}catch(e){console.error(e)}try{buildSprings()}catch(e){console.error(e)}try{buildSleeves()}catch(e){console.error(e)}try{buildSkirt()}catch(e){console.error(e)}try{buildHands()}catch(e){console.error(e)}
 $("bubble").textContent="Hi! Click my head, face or hands, or type “list”.";say("Hi! Try clicking me, or type “help”.");act("wave");API.ready=true;emit("ready",{})},
 function(){$("bubble").textContent="Could not read the model."});
var LI={"L":[2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2070,2071,2072,2073,2074,2075,2076,2077,2078,2079,2080,2081,2082,2083,2084,2085,2086,2087,2088,2089,2090,2091,2092,2093,2094,2095,2096,2097,2098,2099,2100,2101,2102,2103,2104,2105,2106,2107,2108,2109,2110,2111,2112,2113,2114,2115,2116,2117,2118,2119,2120,2121,2122,2123,2124,2125,2126,2127,2128,2129,2130,2131,2132,2133,2134,2135,2136,2137,2138,2139,2140,2141,2142,2143,2144,2145,2146,2147,2148,2149,2150,2151,2152,2153,2154,2155,2156,2157,2158,2159,2160,2161,2162,2163,2164,2165,2166,2167,2168,2169,2170,2171,2172,2173,2174,2175,2176,2177,2178,2179,2180,2181,2182,2183,2184,2185,2186,2187,2188,2189,2190,2191,2192,2193,2194,2195,2196,2197,2198,2199,2200,2201,2202,2203,2204,2205,2206,2207,2208,2209,2210,2211,2212,2213,2214,2215,2216,2217,2218,2219,2220,2221,2222,2223,2224,2225,2226,2227,2228,2229,2230,2231,2232,2233,2234,2238,2239,2240,2244,2245,2246,2257,2259,2271,2276,2283,2286,2287,2288,2293,2294,2295,2296,2297,2311,2312,2316,2317,2318,2349,2350,2354,2355,2356,2364,2365,2366,2367,2372,2379,2382,2387,2388,2389,2390,2392,2394,2398,2401,2403,2404,2405,2410,4832,4853,4854,4865,4870,4874,4875,4881,4890,4891,4895,4901,4902,4903,4904,4905,4906,4907,4908,4909,4910,4911,4912,4917,4918,4919,4920,4928,4929,4930,4931,4932,4933,4934,4935,4936,4937,4944,4945,4946,4953,4954,4956,4959,4960,4961,4962,4963,4964,4965,4966,4967,4968,4969,4970,4971,4972,4973,4974,4975,4976,4977,4978,4979,4980,4982,4983,4984,4985,4991,4992,4993,4994,4995,4996,4997,4998,4999,5000,5002,5004,5005,5011,5012,5013,5014,5015,5016,5017,5018,5019,5020,5026,5027,5028,5029,5030,5031,5032,5038,5039,5040,5041,5042,5043,5044,5045,5046,5047,5048,5049,5050,5051,5052,5053,5054,5055,5056,5057,5142,5144,5145,5146,5147,5152,5153,5154,5155,5156,5157,5165,5166,5167,5168,5183,5185,5186,5187,5188,5189,5193,5194,5195,5199,5200,5205,5206,5207,5208,5209,5210,5211,5224,5225,5226,5227,5228,5229,5235,5236,5237,5238,5239,5240,5241,5242,5243,5244,5245,5246,5247,5248,5249,5250,5251,5252,5253,5254,5255,5256,5257,5258,5259,5260,5261,5262,5263,5264,5265,5275,5276,5280,5281,5282,5283,5284,5285,5286,5287,5288,5289,5290,5291,5292,5293,5294,5295,5296,5299,5301,5305,5306,5307,5308,5309,5310,5311,5312,5313,5314,5315,5316,5333,5335,5336,5337,5919,5920,5926,5943,5944,5945,5946,5951,5953,5954,5955,5956,5957,5958,5959,5960,5961,5962,5963,5964,5965,5966,5967,5968,5969,5970,5971,5972,5973,5974,5975,5976,5977,5978,5979,5980,5981,5982,5983,5984,5985,5986,5987,5988,5989,5990,5991,5992,5993,5994,5995,5996,5997,5998,5999,6000,6001,6002,6003,6004,6005,6006,6007,6008,6009,6010,6011,6012,6013,6014,6015,6016,6017,6018,6019,6020,6021,6022,6023,6024,6025,6026,6027,6028,6029,6030,6031,6032,6033,6034,6035,6036,6037,6038,6039,6040,6041,6042,6043,6044,6045,6046,6047,6048,6049,6050,6051,6052,6053,6054,6055,6056,6057,6058,6059,6060,6061,6062,6063,6064,6065,6066,6067,6068,6069,6070,6071,6072,6073,6074,6075,6076,6077,6078,6088,6089,6090,6117,6118,6123,6136,6155,6157,6158,6162,6163,6164,6165,6171,6173,6174,6175,6176,6177,6178,6179,6180,6181,6182,6185,6186,6187,6188,6189,6190,6191,6193,6198,6199,6200,6201,6202,6203,6204,6205,6206,6207,6208,6209,6210,6212,6213,6214,6215,6216,6217,6218,6220,6221,6222,6223,6225,6226,6227,6228,6229,6230,6231,6232,6233,6234,6235,6236,6237,6238,6239,6240,6241,6242,6243,6244,6245,6246,6247,6248,6249,6250,6251,6252,6253,6254,6255,6256,6257,6258,6259,6260,6261,6262,6263,6264,6265,6266,6267,6268,6269,6270,6271,6272,6273,6274,6275,6276,6277,6278,6279,6280,6281,6282,6283,6284,6285,6286,6287,6288,6289,6290,6292,6293,6294,6295,6296,6297,6298,6299,6300,6301,6302,6303,6304,6305,6306,6307,6308,6309,6310,6311,6312,6313,6314,6315,6316,6317,6318,6319,6320,6321,6322,6323,6324,6325,6326,6327,6328,6329,6330,6331,6332,6333,6334,6335,6336,6337,6338,6339,6340,6341,6342,6343,6344,6345,6346,6348,6350,6351,6352,6353,6354,6355,6356,6357,6358,6359,6361,6362,6363,6364,6365,6367,6368,6369,6370,6372,6373,6374,6375,6376,6377,6378,6379,6380,6381,6382,6383,6384,6385,6386,6387,6388,6389,6390,6391,6392,6393,6394,6395,6396,6397,6398,6399,6400,6401,6402,6403,6404,6405,6406,6407,6408,6409,6410,6411,6412,6413,6414,6415,6416,6417,6418,6419,6420,6421,6422,6423,6424,6425,6426,6427,6428,6429,6430,6431,6432,6433,6434,6435,6436,6437,6438,6439,6440,6441,6442,6443,6444,6445,6446,6447,6448,6449,6450,6451,6452,6453,6454,6455,6456,6457,6458,6459,6460,6461,6462,6463,6464,6465,6466,6467,6468,6469,6470,6471,6472,6473,6474,6475,6476,6477,6478,6479,6480,6481,6482,6483,6484,6485,6486,6487,6488,6489,6490,6491,6492,6493,6494,6495,6496,6497,6498,6499,6500,6501,6502,6503,6504,6505,6506,6507,6508,6509,6510,6511,6512,6513,6514,6515,6516,6517,6518,6519,6520,6521,6522,6523,6524,6525,6526,6527,6528,6529,6530,6531,6532,6533,6534,6535,6536,6537,6538,6539,6540,6541,6542,6543,6544,6545,6546,6547,6548,6549,6550,6551,6552,6553,6554,6555,6556,6557,6558,6559,6563,6564,6565,6566,6567,6568,6575,6576,6577,6579,6582,6583,6585,6586,6587,6588,6591,6592,6593,6594,6595,6596,6597,6599,6600,6601,6602,6604,6606,6608,6609,6610,6611,6612,6613,6614,6615,6616,6617,6618,6619,6620,6621,6622,6623,6624,6625,6626,6627,6628,6629,6630,6631,6632,6633,6634,6635,6636,6637,6638,6639,6640,6641,6642,6643,6644,6645,6646,6647,6648,6649,6650,6651,6754,6755,6756,6757,6758,6759,6760,6761,6762,6763,6764,6765,6766,6767,6768,6769,6770,6771,6772,6773,6774,6775,6776,6777,6778,6779,6780,6781,6782,6783,6784,6785,6786,6787,6788,6789,6790,6791,6796,6797,6798,6799,6800,6801,6802,6803,6804,6805,6809,6810,6811,6812,6813,6814,6817,6818,6819,6820,6821,6823,6825,6826,6827,6828,6829,6833,6834,6837,6838,6839,6841,6842,6843,6844,6845,6846,6852,6853,6855,6856,6858,6864,6865,6866,6867,6871,6872,6873,6874,6877,6878,6880,6883,6884,6887,6913,6914,6915,6936,6944,6945,6946,6947,6948,6949,6950,6951,6952,6953,6954,6955,6956,6957,6958,6959,6960,6961,6962,6977,6978,6979,6980,6981,6982,6983,6984,6985,6986,6987,6988,6989,6990,6991,6992,6993,6994,6995,6996,6997,6998,6999,7000,7001,7002,7003,7004,7005,7006,7007,7008,7009,7010,7011,7012,7013,7014,7015,7016,7017,7018,7019,7020,7021,7022,7023,7024,7025,7026,7027,7028,7029,7030,7031,7032,7033,7034,7035,7036,7037,7038,7039,7040,7041,7042,7043,7044,7045,7046,7047,7048,7049,7050,7051,7052,7053,7054,7055,7056,7057,7058,7059,7060,7061,7062,7063,7064,7065,7066,7067,7068,7069,7070,7071,7072,7073,7074,7075,7076,7077,7078,7079,7080,7081,7082,7083,7095,7099,7100,7101,7102,7103,7104,7105,7106,7122,7123,7124,7125,7126,7127,7128,7129,7130,7131,7132,7133,7134,7135,7136,7137,7138,7139,7140,7141,7142,7143,7144,7145,7146,7147,7148,7149,7150,7159,7160,7161,7162,7163,7164,7165,7166,7167,7168,7169,7170,7171,7172,7173,7174,7175,7176,7177,7178,7179,7180,7181,7182,7183,7184,7185,7186,7187,7188,7189,7190,7191,7192,7193,7194,7196,7204,7205,7206,7207,7208,7209,7210,7222,7223,7224,7225,7226,7227,7228,7229,7230,7231,7232,7233,7234,7235,7236,7237,7238,7239,7240,7241,7242,7243,7244,7245,7246,7247,7248,7249,7250,7252,7254,7255,7257,7258,7259,7260,7261],"R":[2062,2063,2064,2068,2069,2070,2081,2083,2085,2091,2093,2101,2103,2108,2110,2111,2112,2117,2118,2119,2120,2121,2122,2136,2137,2143,2153,2173,2179,2180,2184,2185,2186,2193,2194,2195,2196,2200,2201,2208,2209,2219,2220,2221,2223,2226,2228,2231,2235,2236,2237,2238,2239,2240,2241,2242,2243,2244,2245,2246,2247,2248,2249,2250,2251,2252,2253,2254,2255,2256,2257,2258,2259,2260,2261,2262,2263,2264,2265,2266,2267,2268,2269,2270,2271,2272,2273,2274,2275,2276,2277,2278,2279,2280,2281,2282,2283,2284,2285,2286,2287,2288,2289,2290,2291,2292,2293,2294,2295,2296,2297,2298,2299,2300,2301,2302,2303,2304,2305,2306,2307,2308,2309,2310,2311,2312,2313,2314,2315,2316,2317,2318,2319,2320,2321,2322,2323,2324,2325,2326,2327,2328,2329,2330,2331,2332,2333,2334,2335,2336,2337,2338,2339,2340,2341,2342,2343,2344,2345,2346,2347,2348,2349,2350,2351,2352,2353,2354,2355,2356,2357,2358,2359,2360,2361,2362,2363,2364,2365,2366,2367,2368,2369,2370,2371,2372,2373,2374,2375,2376,2377,2378,2379,2380,2381,2382,2383,2384,2385,2386,2387,2388,2389,2390,2391,2392,2393,2394,2395,2396,2397,2398,2399,2400,2401,2402,2403,2404,2405,2406,2407,2408,2409,2410,4820,4832,4837,4838,4841,4842,4849,4865,4886,4887,4888,4889,4890,4891,4892,4893,4894,4895,4896,4897,4898,4899,4900,4905,4906,4912,4913,4914,4915,4916,4919,4920,4921,4922,4923,4924,4925,4926,4927,4928,4930,4934,4938,4939,4940,4941,4942,4943,4944,4945,4946,4947,4948,4949,4950,4951,4952,4953,4954,4955,4956,4957,4958,4965,4966,4967,4968,4977,4978,4979,4981,4982,4983,4984,4985,4986,4987,4988,4989,4990,4992,4994,4995,5001,5002,5003,5004,5005,5006,5007,5008,5009,5010,5012,5013,5014,5015,5021,5022,5023,5024,5025,5026,5027,5028,5029,5030,5031,5032,5033,5034,5035,5036,5037,5043,5045,5046,5047,5048,5049,5050,5051,5052,5068,5071,5072,5073,5074,5078,5079,5080,5081,5082,5088,5089,5090,5091,5096,5107,5109,5110,5111,5112,5113,5117,5118,5119,5125,5126,5127,5206,5207,5208,5209,5210,5211,5212,5213,5214,5215,5216,5217,5218,5219,5220,5221,5222,5223,5224,5225,5226,5227,5228,5229,5230,5231,5232,5233,5234,5235,5236,5237,5238,5239,5240,5241,5255,5256,5257,5258,5259,5260,5264,5265,5266,5267,5268,5269,5270,5271,5272,5273,5274,5275,5276,5277,5278,5279,5283,5290,5291,5297,5298,5299,5300,5301,5302,5303,5304,5306,5311,5312,5314,5333,5334,5336,5907,5908,5909,5910,5911,5912,5913,5914,5915,5916,5917,5918,5919,5920,5921,5922,5923,5924,5925,5926,5927,5928,5929,5930,5931,5932,5933,5934,5935,5936,5937,5938,5939,5940,5941,5942,5943,5944,5945,5946,5947,5948,5949,5950,5951,5952,5965,5971,5985,5986,5988,5993,6004,6005,6006,6013,6036,6045,6046,6063,6064,6077,6078,6079,6080,6081,6082,6083,6084,6085,6086,6087,6088,6089,6090,6091,6092,6093,6094,6095,6096,6097,6098,6099,6100,6101,6102,6103,6104,6105,6106,6107,6108,6109,6110,6111,6112,6113,6114,6115,6116,6117,6118,6119,6120,6121,6122,6123,6124,6125,6126,6127,6128,6129,6130,6131,6132,6133,6134,6135,6136,6137,6138,6139,6140,6141,6142,6143,6144,6145,6146,6147,6148,6149,6150,6151,6152,6153,6154,6155,6156,6157,6158,6159,6160,6161,6162,6163,6164,6165,6166,6167,6168,6169,6170,6171,6172,6173,6174,6175,6176,6177,6178,6179,6180,6181,6182,6183,6184,6185,6186,6187,6188,6189,6190,6191,6192,6193,6194,6195,6196,6197,6198,6199,6200,6201,6202,6203,6204,6205,6206,6207,6208,6209,6210,6211,6212,6213,6214,6215,6216,6217,6218,6219,6220,6221,6222,6223,6224,6225,6226,6227,6228,6229,6230,6231,6234,6240,6242,6243,6244,6245,6246,6247,6248,6249,6250,6253,6255,6256,6257,6261,6262,6263,6264,6265,6266,6267,6268,6269,6270,6271,6273,6274,6275,6276,6277,6278,6279,6280,6281,6282,6283,6285,6286,6287,6288,6290,6291,6292,6293,6294,6295,6296,6297,6298,6299,6300,6301,6302,6303,6304,6305,6306,6307,6308,6309,6310,6311,6312,6313,6314,6315,6316,6317,6318,6319,6320,6321,6322,6323,6324,6325,6326,6327,6328,6329,6330,6331,6332,6333,6334,6335,6336,6337,6338,6339,6340,6341,6342,6343,6344,6345,6346,6347,6348,6349,6350,6351,6352,6353,6354,6355,6356,6357,6358,6359,6360,6361,6362,6363,6364,6365,6366,6367,6368,6369,6370,6371,6372,6373,6374,6375,6376,6377,6378,6379,6380,6381,6382,6383,6384,6385,6386,6387,6388,6389,6390,6391,6392,6393,6395,6396,6397,6398,6399,6400,6401,6402,6403,6404,6405,6406,6407,6408,6409,6410,6411,6412,6413,6414,6415,6416,6417,6418,6419,6420,6421,6422,6423,6424,6425,6426,6427,6428,6430,6431,6432,6433,6434,6435,6436,6437,6438,6439,6440,6441,6442,6444,6445,6446,6447,6448,6450,6451,6452,6453,6454,6455,6457,6458,6459,6460,6461,6462,6463,6464,6465,6466,6467,6468,6469,6470,6471,6472,6473,6474,6475,6476,6477,6478,6479,6480,6481,6482,6483,6484,6485,6486,6487,6488,6489,6490,6491,6492,6493,6494,6495,6496,6497,6498,6499,6500,6501,6502,6503,6504,6505,6506,6507,6508,6509,6510,6511,6512,6513,6514,6515,6516,6517,6518,6519,6520,6521,6522,6523,6524,6525,6526,6527,6528,6529,6530,6531,6532,6533,6534,6535,6536,6537,6538,6539,6540,6541,6542,6543,6544,6545,6546,6547,6548,6549,6550,6551,6552,6553,6554,6555,6556,6557,6558,6559,6560,6561,6562,6563,6564,6565,6566,6567,6568,6569,6570,6571,6572,6573,6574,6575,6576,6577,6578,6579,6580,6581,6582,6583,6584,6585,6586,6587,6588,6589,6590,6591,6592,6593,6594,6595,6596,6597,6598,6599,6600,6601,6602,6603,6604,6605,6606,6607,6608,6611,6612,6613,6614,6621,6622,6623,6624,6628,6629,6630,6631,6632,6635,6638,6639,6640,6641,6642,6644,6645,6647,6649,6650,6720,6721,6722,6723,6724,6725,6726,6727,6728,6729,6730,6731,6732,6733,6734,6735,6736,6737,6738,6739,6740,6741,6742,6743,6744,6745,6746,6747,6748,6749,6750,6751,6752,6753,6792,6793,6794,6795,6796,6797,6798,6799,6800,6801,6802,6803,6804,6805,6806,6807,6808,6809,6810,6811,6812,6813,6814,6815,6816,6817,6818,6819,6820,6821,6822,6823,6824,6825,6826,6827,6828,6829,6830,6831,6832,6833,6834,6835,6836,6837,6838,6839,6840,6841,6842,6843,6844,6845,6846,6847,6848,6849,6850,6851,6852,6853,6854,6855,6856,6857,6858,6859,6860,6861,6862,6863,6864,6865,6866,6867,6868,6869,6870,6871,6872,6873,6874,6875,6876,6877,6878,6879,6880,6881,6882,6883,6884,6885,6886,6887,6888,6889,6890,6891,6892,6893,6894,6895,6896,6897,6913,6914,6915,6916,6917,6918,6919,6920,6932,6936,6937,6938,6939,6940,6941,6942,6943,6944,6945,6946,6947,6948,6949,6950,6951,6952,6953,6954,6955,6956,6957,6958,6959,6960,6961,6962,6963,6964,6965,6966,6967,6968,6977,6978,6979,6980,6981,6982,6983,6984,6985,6986,6987,6988,6989,6990,6991,6992,6993,6997,6998,6999,7000,7001,7002,7005,7006,7009,7010,7011,7012,7013,7014,7018,7019,7022,7023,7024,7025,7027,7028,7029,7030,7031,7037,7038,7040,7041,7043,7049,7050,7051,7052,7054,7057,7058,7061,7062,7064,7065,7067,7068,7069,7073,7099,7100,7101,7122,7129,7130,7131,7132,7133,7134,7135,7136,7137,7138,7139,7140,7141,7142,7143,7144,7145,7159,7160,7161,7162,7163,7164,7165,7166,7167,7168,7169,7170,7171,7172,7173,7174,7175,7176,7177,7178,7179,7180,7181,7182,7183,7184,7185,7186,7187,7188,7189,7190,7191,7192,7193,7194,7195,7197,7198,7199,7200,7201,7202,7203,7211,7212,7213,7214,7215,7216,7217,7218,7219,7220,7221,7234,7235,7236,7237,7238,7239,7240,7241,7242,7243,7244,7245,7246,7247,7248,7249,7250,7252,7253,7255,7257,7258,7260,7261]},LASH=[null,null],EYE=[null,null],EYEPOS=null,NS=16,MP={},HEADC=null,FXW={heart:0,star:0,spiral:0,tear:0,sweat:0};
function cl01(v){return v<0?0:v>1?1:v}
function mkRib(par,col,po){var g=new T.BufferGeometry(),p=new Float32Array((NS+1)*6),ix=[];for(var i=0;i<NS;i++){var a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2)}
 g.setAttribute("position",new T.BufferAttribute(p,3));g.setIndex(ix);var m=new T.Mesh(g,new T.MeshBasicMaterial({color:col,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-po,polygonOffsetUnits:-po}));m.frustumCulled=false;par.add(m);return m}
function cleanFace(){var m=skinMesh.material,im=m.map.image,c=document.createElement("canvas");c.width=im.width;c.height=im.height;var x=c.getContext("2d"),s=im.width/1024;x.drawImage(im,0,0);
 var smp=function(px,py){var d=x.getImageData(Math.round(px*s),Math.round(py*s),8,4).data;return d[0]+","+d[1]+","+d[2]};
 var soft=function(cx,cy,rx,ry,col){x.save();x.translate(cx*s,cy*s);x.scale(rx*s,ry*s);var g=x.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,"rgba("+col+",1)");g.addColorStop(.72,"rgba("+col+",.97)");g.addColorStop(1,"rgba("+col+",0)");x.fillStyle=g;x.fillRect(-1,-1,2,2);x.restore()};
 soft(400,796,30,22,smp(396,770));soft(325,902,44,16,smp(325,920));soft(479,902,40,16,smp(479,920));
 var tx=new T.CanvasTexture(c);tx.flipY=false;tx.encoding=T.sRGBEncoding;tx.anisotropy=4;m.map=tx;m.needsUpdate=true}
function fxTex(draw){var c=document.createElement("canvas");c.width=c.height=128;draw(c.getContext("2d"));var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t}
var FXD={
 heart:function(x){x.fillStyle="#ff4f86";x.beginPath();x.moveTo(64,108);x.bezierCurveTo(8,70,18,18,64,44);x.bezierCurveTo(110,18,120,70,64,108);x.fill();x.fillStyle="rgba(255,255,255,.85)";x.beginPath();x.ellipse(38,46,9,6,-.7,0,6.3);x.fill()},
 star:function(x){var g=x.createRadialGradient(64,64,4,64,64,60);g.addColorStop(0,"rgba(255,246,170,1)");g.addColorStop(.5,"rgba(255,214,90,.9)");g.addColorStop(1,"rgba(255,214,90,0)");x.fillStyle=g;x.beginPath();x.moveTo(64,2);x.quadraticCurveTo(70,58,126,64);x.quadraticCurveTo(70,70,64,126);x.quadraticCurveTo(58,70,2,64);x.quadraticCurveTo(58,58,64,2);x.fill()},
 spiral:function(x){x.strokeStyle="#33204a";x.lineWidth=7;x.lineCap="round";x.beginPath();for(var a=0;a<12.6;a+=.15){var r=a*4.4,px=64+Math.cos(a)*r,py=64+Math.sin(a)*r;a?x.lineTo(px,py):x.moveTo(px,py)}x.stroke()},
 tear:function(x){var g=x.createLinearGradient(0,10,0,118);g.addColorStop(0,"rgba(190,235,255,.95)");g.addColorStop(1,"rgba(110,190,245,.95)");x.fillStyle=g;x.beginPath();x.moveTo(64,6);x.bezierCurveTo(112,64,104,116,64,118);x.bezierCurveTo(24,116,16,64,64,6);x.fill();x.fillStyle="rgba(255,255,255,.9)";x.beginPath();x.ellipse(48,84,7,15,.3,0,6.3);x.fill()},
 sweat:function(x){x.fillStyle="rgba(120,200,255,.95)";x.strokeStyle="rgba(60,130,210,.9)";x.lineWidth=4;x.beginPath();x.moveTo(64,6);x.bezierCurveTo(108,64,100,118,64,118);x.bezierCurveTo(28,118,20,64,64,6);x.fill();x.stroke();x.fillStyle="rgba(255,255,255,.85)";x.beginPath();x.ellipse(48,86,6,14,.3,0,6.3);x.fill()},
 hatch:function(x){x.strokeStyle="rgba(255,80,110,.9)";x.lineWidth=7;x.lineCap="round";for(var i=0;i<3;i++){x.beginPath();x.moveTo(26+i*34,98);x.lineTo(50+i*34,30);x.stroke()}}};
function buildFace(){
 model.updateMatrixWorld(true);var rc=new T.Raycaster(),hq=new T.Quaternion();head.getWorldQuaternion(hq);var hqi=hq.clone().invert();
 function anchor(px,py,off,any){rc.set(new T.Vector3(px,py,.6),new T.Vector3(0,0,-1));var hs=rc.intersectObject(skinMesh),h=null,uvA=skinMesh.geometry.attributes.uv;for(var q=0;q<hs.length;q++){var f_=hs[q].face;if(any||(uvA.getY(f_.a)+uvA.getY(f_.b)+uvA.getY(f_.c))/3>.5){h=hs[q];break}}if(!h)return null;
  var n=h.face.normal.clone().transformDirection(skinMesh.matrixWorld);if(n.z<0)n.negate();
  var a=new T.Object3D();a.position.copy(head.worldToLocal(h.point.clone().addScaledVector(n,off||.0015)));
  a.quaternion.copy(hqi).multiply(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),n));head.add(a);return a}
 var pos=skinMesh.geometry.attributes.position,si=skinMesh.geometry.attributes.skinIndex.array,sw=skinMesh.geometry.attributes.skinWeight.array,bn=skinMesh.skeleton.bones;
 ["Eye_L","Eye_R"].forEach(function(nm,k){var ids=[],o=[],c=new T.Vector3(),mn=1e9,mxv=-1e9;
  for(var i=0;i<pos.count;i++){var w=0;for(var j=0;j<4;j++)if(sw[i*4+j]>0&&bn[si[i*4+j]].name.replace(/_\d+$/,"")===nm)w+=sw[i*4+j];
   if(w>.5){var v=new T.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));ids.push(i);o.push(v);c.add(v);mn=Math.min(mn,v.y);mxv=Math.max(mxv,v.y)}}
  if(ids.length)EYE[k]={ids:ids,o:o,c:c.multiplyScalar(1/ids.length),by:mn,ty:mxv,pl:-1,ps:-1,pt:9,pp:9}});
 EYEPOS=pos;
 LASH=[LI.L,LI.R].map(function(ids){var ok=ids.filter(function(i){return i<pos.count});return{ids:ok,o:ok.map(function(i){return new T.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i))})}});
 try{cleanFace()}catch(e){console.error(e)}
 F.lash=[];[[.0485,1.3,1],[-.0546,1.3005,-1]].forEach(function(q,k){var a=anchor(q[0],q[1],.0018);if(!a){F.lash[k]=null;return}var m=mkRib(a,0x34182c,6);m.visible=false;F.lash[k]={m:m,out:q[2]}});
 var mg=anchor(0,1.2338,.0014);
 if(mg){MP.fill=mkRib(mg,0x4a0f22,2);MP.teeth=mkRib(mg,0xffffff,3);MP.lu=mkRib(mg,0x8f3d56,5);MP.ll=mkRib(mg,0xa04b63,4);
  MP.tg=new T.Mesh(new T.SphereGeometry(1,10,8),new T.MeshBasicMaterial({color:0xff7f9d,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));MP.tg.visible=false;mg.add(MP.tg);
  var fg=new T.BufferGeometry();fg.setAttribute("position",new T.BufferAttribute(new Float32Array(9),3));MP.fg=new T.Mesh(fg,new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-7,polygonOffsetUnits:-7}));MP.fg.frustumCulled=false;MP.fg.visible=false;mg.add(MP.fg);MP.mg=mg}
 var cv=document.createElement("canvas");cv.width=cv.height=64;var cx=cv.getContext("2d"),gr=cx.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,"rgba(255,90,120,.9)");gr.addColorStop(1,"rgba(255,90,120,0)");cx.fillStyle=gr;cx.fillRect(0,0,64,64);
 var tx=new T.CanvasTexture(cv);tx.encoding=T.sRGBEncoding;var th=fxTex(FXD.hatch);F.bl=[];F.bh=[];
 var plane=function(w,h,tex,a,po){var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:0,polygonOffset:true,polygonOffsetFactor:-po,polygonOffsetUnits:-po}));m.frustumCulled=false;a.add(m);return m};
 [-.058,.056].forEach(function(px){var a=anchor(px,1.243);if(!a)return;F.bl.push(plane(.065,.05,tx,a,2));F.bh.push(plane(.04,.03,th,a,3))});
 F.fx={};var ex=[[.0541,1],[-.0541,-1]];
 ["heart","star","spiral"].forEach(function(nm){var tex=fxTex(FXD[nm]);F.fx[nm]=ex.map(function(q){var a=anchor(q[0],1.2795,.004,true);return a?plane(nm==="star"?.05:.036,nm==="star"?.05:.036,tex,a,8):null})});
 var tt=fxTex(FXD.tear);F.fx.tear=ex.map(function(q){var a=anchor(q[0],1.252,.003,true);return a?plane(.016,.024,tt,a,8):null});
 var st=fxTex(FXD.sweat),sa=anchor(.092,1.322,.003,true);F.fx.sweat=[sa?plane(.02,.03,st,sa,8):null]}
function setRib(m,fn){var a=m.geometry.attributes.position.array;for(var i=0;i<=NS;i++){var r=fn(i);a[i*6]=r[0];a[i*6+1]=r[1];a[i*6+2]=0;a[i*6+3]=r[0];a[i*6+4]=r[2];a[i*6+5]=0}m.geometry.attributes.position.needsUpdate=true}
function mouthUpdate(P){if(!MP.mg)return;var W=.0085*P.wd*(1-.5*P.rd),u_=[],lo=[],i;
 for(i=0;i<=NS;i++){var u=i/NS*2-1,yc=P.sm*.0042*(u*u-.55)+P.sk*.0032*u+P.w3*.0034*(.45-Math.abs(Math.sin(Math.PI*u))),e=Math.max(0,1-Math.pow(Math.abs(u),2.2-1.1*P.rd)),o=P.op*.012*e;u_.push(yc+o*.22);lo.push(yc-o*.78-.0005)}
 setRib(MP.fill,function(i){return[(i/NS*2-1)*W,u_[i],lo[i]]});
 setRib(MP.teeth,function(i){var u=i/NS*2-1,h=Math.min(.0028,(u_[i]-lo[i])*.55)*P.te*(Math.abs(u)<.75?1:0);return[u*W*.9,u_[i]-.0002,u_[i]-.0002-h]});
 setRib(MP.lu,function(i){return[(i/NS*2-1)*W,u_[i]+.0006,u_[i]-.0002]});
 setRib(MP.ll,function(i){return[(i/NS*2-1)*W,lo[i]+.0003,lo[i]-.0006]});
 MP.fill.visible=P.op>.04;MP.teeth.visible=P.op>.1&&P.te>.05;
 MP.tg.visible=P.tg>.5&&P.op>.15;MP.tg.position.set(0,lo[NS>>1]+.0026,0);MP.tg.scale.set(W*.45,.0026+.002*P.op,.002);
 var fv=P.fg>.15,fa=MP.fg.geometry.attributes.position.array,iF=Math.round((.58+1)/2*NS),fx=(iF/NS*2-1)*W,fy=u_[iF]-.0002;MP.fg.visible=fv;
 if(fv){var fl=.0036*P.fg;fa[0]=fx-.0013;fa[1]=fy;fa[2]=0;fa[3]=fx+.0013;fa[4]=fy;fa[5]=0;fa[6]=fx;fa[7]=fy-fl;fa[8]=0;MP.fg.geometry.attributes.position.needsUpdate=true}}
function lashUpdate(L,c){var m=L.m,a=m.geometry.attributes.position.array,hw=.0175;
 for(var i=0;i<=NS;i++){var u=i/NS*2-1,env=1-u*u,y=c*.0046*env+.0022*(u>.55?(u-.55)/.45:0),th=.0011+.0013*((u+1)/2)+.0008*env,x=L.out*u*hw;
  a[i*6]=x;a[i*6+1]=y+th*.6;a[i*6+2]=0;a[i*6+3]=x;a[i*6+4]=y-th*.4;a[i*6+5]=0}m.geometry.attributes.position.needsUpdate=true}
function eyeUpdate(k,lid,sq,tl,ps){var E=EYE[k];if(!E)return false;lid=cl01(lid);sq=cl01(sq);
 if(Math.abs(lid-E.pl)<.004&&Math.abs(sq-E.ps)<.004&&Math.abs(tl-E.pt)<.01&&Math.abs(ps-E.pp)<.01)return lid>.86;
 E.pl=lid;E.ps=sq;E.pt=tl;E.pp=ps;var hide=lid>.86,p=EYEPOS,os=k===0?1:-1,hw=.045,by=E.by,h=E.ty-E.by,i,v,x,y,z,l2,ty2,y0;
 for(i=0;i<E.ids.length;i++){v=E.o[i];x=v.x;y=v.y;z=v.z;
  if(hide){x=E.c.x;y=E.c.y;z=E.c.z-.025}else{x=E.c.x+(x-E.c.x)*ps;y0=E.c.y+(y-E.c.y)*ps;l2=cl01(lid+tl*((v.x-E.c.x)/hw)*os*.5);ty2=by+h*(1-l2);y=by+(y0-by)*(1-l2);y=ty2+(y-ty2)*(1-sq*.45)}
  p.setXYZ(E.ids[i],x,y,z)}
 var LS=LASH[k];if(LS)for(var m=0;m<LS.ids.length;m++){var q=LS.o[m],lx=q.x,ly=q.y,lz=q.z;
  if(hide){lx=E.c.x;ly=E.c.y;lz=E.c.z-.03}else{l2=cl01(lid+tl*((q.x-E.c.x)/hw)*os*.5);ly=by+(ly-by)*(1-l2)}
  p.setXYZ(LS.ids[m],lx,ly,lz)}
 p.needsUpdate=true;return hide}
function faceUpdate(t,dt){
 if(!MP.mg&&!EYE[0])return;dt=dt||.016;
 if(t>nextBlink){blinkS=t;if(Math.random()<.18&&!dbl){dbl=true;nextBlink=t+.3}else{dbl=false;nextBlink=t+rnd(2.2,6)}}
 var bt=t-blinkS,ba=bt<.045?bt/.045:bt<.13?1-(bt-.045)/.085:0,cls=[false,false];
 for(var k=0;k<2;k++){cls[k]=eyeUpdate(k,ES.lid[k]>.8?ES.lid[k]:Math.max(ES.lid[k],ba),ES.sq[k],ES.tl,ES.ps);var L=F.lash&&F.lash[k];if(L){L.m.visible=cls[k];if(cls[k])lashUpdate(L,cl01((ES.ar+1)/2)*2-1)}}
 var talk=now()<talkUntil?.1+.28*ab(t*13)+.12*ab(t*7.3):0;
 mouthUpdate({sm:ES.sm,op:Math.min(1,ES.op+talk),wd:ES.wd,rd:ES.rd,sk:ES.sk,w3:ES.w3,te:ES.te,tg:ES.tg,fg:ES.fg});
 if(F.bl)F.bl.forEach(function(m){m.material.opacity=Math.min(1,ES.bl)*.75});
 if(F.bh)F.bh.forEach(function(m){m.material.opacity=cl01((ES.bl-.55)*2.2)*.85});
 if(F.fx){var tg={heart:EX.ef==="heart"?1:0,star:EX.ef==="star"?1:0,spiral:EX.ef==="spiral"?1:0,tear:cl01(ES.tr),sweat:cl01(ES.sw)},kk=Math.min(1,dt*6);
  for(var nm in tg){FXW[nm]+=(tg[nm]-FXW[nm])*kk;var w=FXW[nm];F.fx[nm].forEach(function(m,i){if(!m)return;var vis=nm==="sweat"?1:(cls[i]?0:1),o=w*vis;m.material.opacity=o;m.visible=o>.01;var s=.7+.3*w;m.scale.set(s,s,1);if(nm==="spiral")m.rotation.z+=dt*(i?-4:4);if(nm==="tear")m.position.y=-.004*(.5+.5*Math.sin(t*.9+i))})}}}

/* ===== skeleton helpers (deltas in world axes, so local rig axes don't matter) ===== */
var Q2=new T.Quaternion(),ax1=new T.Vector3(),v3=new T.Vector3(),SPD={},FING={L:null,R:null};
function apply(b,dq){b.parent.getWorldQuaternion(Q);Qi.copy(Q).invert();b.quaternion.premultiply(Q).premultiply(dq).premultiply(Qi)}
function sm(k,tv,r){var s=S[k]||(S[k]=tv.clone());s.lerp(tv,r);return s}
function spd(k,tv,K,C,dt){var s=SPD[k];if(!s)s=SPD[k]={x:tv.clone(),v:new T.Vector3()};var h=Math.min(dt,.033)/2;
 for(var i=0;i<2;i++){var a=v3.copy(tv).sub(s.x).multiplyScalar(K).addScaledVector(s.v,-C);a.y-=GRAV*4;s.v.addScaledVector(a,h);s.x.addScaledVector(s.v,h)}return s.x}
function aim(b,c,d,K,C){if(b&&c&&d)ops.push({b:b,c:c,d:d,k:b.uuid,K:K,C:C})}
function rot(b,x,y,z,r){if(b)ops.push({b:b,e:[x,y,z],k:b.uuid+"r",r:r})}
function fnop(b,f){if(b)ops.push({b:b,fn:f})}
var HP={relaxed:[[.18,.28,.15],[.22,.32,.18],[.26,.38,.2],[.3,.42,.22],[.12,.18]],open:[[0,.03,0],[0,.03,0],[0,.03,0],[0,.03,0],[0,0]],fist:[[1.25,1.45,1],[1.3,1.5,1.05],[1.3,1.5,1.05],[1.3,1.45,1],[.5,.7]],point:[[.04,.04,.02],[1.3,1.5,1],[1.3,1.5,1],[1.3,1.45,1],[.5,.7]],peace:[[.04,.04,0],[.04,.04,0],[1.3,1.5,1],[1.3,1.45,1],[.5,.7]],flat:[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0]],paw:[[.7,.9,.5],[.75,.95,.55],[.8,1,.6],[.85,1,.6],[.4,.5]]};
var HANDBY={wave:{r:"open"},raise_hand:{r:"open"},clap:{l:"flat",r:"flat"},point:{r:"point"},cheer:{l:"fist",r:"fist"},salute:{r:"flat"},blow_kiss:{r:"open"},tease_pose:{r:"peace"},shrug:{l:"open",r:"open"},stretch:{l:"open",r:"open"},facepalm:{r:"flat"},shy_pose:{l:"paw",r:"paw"},clap_dance:{l:"flat",r:"flat"},disco:{l:"point",r:"point"},wave_arms:{l:"open",r:"open"},shimmy:{l:"open",r:"open"},think:{r:"paw"},toe_in:{l:"paw",r:"paw"}};
function buildBody(){
 model.updateMatrixWorld(true);
 ["L","R"].forEach(function(sd_){var sx=sd_==="L"?1:-1,wr=N[sd_==="L"?"Left_wrist":"Right_wrist"];if(!wr)return;wr.getWorldQuaternion(Q);var qi=Q.clone().invert();
  var chains=["IndexFinger","MiddleFinger","RingFinger","LittleFinger","Thumb"].map(function(a){return[1,2,3].map(function(s){return N[a+s+"_"+sd_]}).filter(Boolean)});
  FING[sd_]={wr:wr,fa:{},ch:chains.map(function(ch){if(ch.length<2)return{b:ch,al:new T.Vector3(1,0,0)};
   ch[0].getWorldPosition(v1);ch[ch.length-1].getWorldPosition(v2);var f=v2.clone().sub(v1).normalize(),nin=new T.Vector3(-sx,0,0);nin.addScaledVector(f,-nin.dot(f)).normalize();
   return{b:ch,al:f.clone().cross(nin).normalize().applyQuaternion(qi)}})}});
 fitBody()}
function handOps(sd_,spec,t,dt){var H=FING[sd_];if(!H)return;var pz=HP[spec]||HP.relaxed;
 H.ch.forEach(function(c,fi){c.b.forEach(function(b,ji){var key=fi+"_"+ji,row=pz[fi],base=row[ji]!==undefined?row[ji]:row[row.length-1],tg=base+.05*sn(t*.9+fi*1.7+ji+(sd_==="L"?0:2))*(spec==="relaxed"?1:.2),pr=H.fa[key]===undefined?tg:H.fa[key],ang=pr+(tg-pr)*Math.min(1,dt*14);H.fa[key]=ang;
  fnop(b,function(){H.wr.getWorldQuaternion(Q2);ax1.copy(c.al).applyQuaternion(Q2);DQ.setFromAxisAngle(ax1,ang);apply(b,DQ)})})})}
function pose(t,dt){
 bones.forEach(function(b){b.quaternion.copy(rest[b.uuid])});ops=[];var n=now();
 var hv=head.getWorldPosition(v1).clone().project(cam),sw_=stage.clientWidth,sh_=stage.clientHeight,hx=(hv.x*.5+.5)*sw_,hy=(-hv.y*.5+.5)*sh_,dist=cam.position.distanceTo(v1.copy(head.getWorldPosition(v2))),fR=.13*sh_/(2*Math.tan(cam.fov*.0087266)*dist),Rr=Math.max(90,fR*3.2),dd0=Math.hypot(PXs-hx,PYs-hy),tw0=(n-PT<6&&PIN)?1-sstep(Rr*.55,Rr*1.25,dd0):0;FW+=(tw0-FW)*Math.min(1,dt*5);
 var gx_=LOOK?LOOK[0]:Math.max(-1,Math.min(1,(PXs-hx)/(Rr*1.1)))*FW,gy_=LOOK?LOOK[1]:Math.max(-1,Math.min(1,(PYs-hy)/(Rr*1.1)))*FW;
 if(n>exEnd&&EX.__n!==1){EX=resolve(idleOn&&n-lastAct>70?"sleepy":"neutral");exEnd=1e12}
 var k=Math.min(1,dt*9);for(var key in EX){var a=EX[key];if(Array.isArray(a))for(var i=0;i<a.length;i++)ES[key][i]+=(a[i]-ES[key][i])*k;else if(typeof a==="number")ES[key]+=(a-ES[key])*k}
 var g={},gn=null;if(loco){g=locoPose(t,dt);gn="loco"}else if(dance){if(n>dance.end){dance=null;EX=resolve("neutral");exEnd=1e12}else{g=DANCE[dance.n](t);gn=dance.n}}
 else if(curG){var u=n-curG.t0;if(u>curG.d)curG=null;else{g=curG.f(u,u/curG.d);gn=curG.n}}
 var b1=sn(t*1.3),br=.5+.5*b1,cl=function(v,lo,hi){return Math.max(lo,Math.min(hi,v))};
 var L=g.L||[A(.36,-1,-.06+b1*.02),A(.3,-1,-.04)],R=g.R||[A(-.36,-1,-.06+b1*.02),A(-.3,-1,-.04)];
 aim(N.Left_arm,N.Left_elbow,jt(L[0],0,t),80,10);aim(N.Left_elbow,N.Left_wrist,jt(L[1],2,t),60,8.5);aim(N.Right_arm,N.Right_elbow,jt(R[0],4,t),80,10);aim(N.Right_elbow,N.Right_wrist,jt(R[1],6,t),60,8.5);wristLag();
 rot(N.Left_shoulder,0,0,Math.min(.4,Math.max(0,L[0][1])*.3)+b1*.01,8);rot(N.Right_shoulder,0,0,-(Math.min(.4,Math.max(0,R[0][1])*.3)+b1*.01),8);
 var hb=HANDBY[gn]||{};handOps("L",hb.l||"relaxed",t,dt);handOps("R",hb.r||"relaxed",t,dt);
 if(!g.lg&&!loco&&!dance){var il=idleLegs(t);g.lg=il.lg;if(!g.hp)g.hp=il.hp;if(g.hr===undefined)g.hr=il.hr;if(!g.sp)g.sp=il.sp}
 if(g.lg){aim(N.Left_leg,N.Left_knee,g.lg[0][0],110,14);aim(N.Left_knee,N.Left_ankle,g.lg[0][1],110,14);aim(N.Right_leg,N.Right_knee,g.lg[1][0],110,14);aim(N.Right_knee,N.Right_ankle,g.lg[1][1],110,14);aim(N.Left_ankle,N.Left_toe,g.lg[0][2],120,15);aim(N.Right_ankle,N.Right_toe,g.lg[1][2],120,15)}
 if(n>nextSac){sac=[rnd(-.4,.4),rnd(-.25,.25)];nextSac=n+rnd(1.2,4)}
 var h=g.hd||[0,0,0],sp=g.sp||[0,0,0],sh2=EX.shake?sn(t*25)*.04:0;
 var pit=cl(gy_*.22+.03+ES.hd[0]+h[0],-.55,.65),yaw=cl(gx_*.45+ES.hd[1]+h[1]+sn(t*.5)*.05,-1.1,1.1),rl=cl(ES.hd[2]+h[2]+sh2,-.5,.5);
 rotS(N.Head,pit*.7+.012*nz(t,.5),yaw*.6+.02*nz(t+4,.4),rl*.7+.012*nz(t+9,.45),55,9.5);rotS(N.Neck,pit*.3,yaw*.4,rl*.3,35,8);
 rotS(N.Spine,.02+sp[0]*.55,sp[1]*.55,sp[2]*.55,30,7);rotS(N.Chest,b1*.02+sp[0]*.45,sp[1]*.45,sp[2]*.45,30,7);
 var gy=cl(gx_*.25+ES.gz[0]*.3+sac[0]*.1,-.45,.45),gp=cl(gy_*.15-ES.gz[1]*.25+sac[1]*.08,-.35,.35);rot(N.Eye_L,gp,gy,0,28);rot(N.Eye_R,gp,gy,0,28);
 rot(N.Hips,0,g.hy||0,g.hr||0,8);tailWing(t,dt);
 ops.sort(function(p,q){return p.b.userData.i-q.b.userData.i});
 ops.forEach(function(o){var d;
  if(o.fn){o.fn();return}
  if(o.c){o.b.getWorldPosition(v1);o.c.getWorldPosition(v2);v2.sub(v1).normalize();var tv=new T.Vector3().fromArray(o.d).normalize();
   d=(o.K?spd(o.k,tv,o.K,o.C,dt):sm(o.k,tv,Math.min(1,dt*10))).clone().normalize();DQ.setFromUnitVectors(v2,d)}
  else{var ev=new T.Vector3(o.e[0],o.e[1],o.e[2]);d=o.K?spe(o.k,ev,o.K,o.C,dt):sm(o.k,ev,Math.min(1,dt*(o.r||9)));E3.set(d.x,d.y,d.z);DQ.setFromEuler(E3)}apply(o.b,DQ)});
 var hp=g.hp||[0,0,0];if(g.px!==undefined){model.position.x=g.px;model.position.z=g.pz}else if(!loco){var kk=Math.min(1,dt*3);model.position.x-=model.position.x*kk;model.position.z-=model.position.z*kk}
 model.rotation.y=Math.atan2(sn(model.rotation.y),Math.cos(model.rotation.y));model.rotation.y+=((g.ry||0)-model.rotation.y)*(g.ry!==undefined?1:Math.min(1,dt*6));
 N.Hips.position.copy(hipsRest);N.Hips.parent.getWorldQuaternion(Q);v1.set(hp[0]+.006*sn(t*.31)+.004*sn(t*.77),hp[1]-.004*br,hp[2]).applyQuaternion(Q.invert());N.Hips.position.add(v1)}

/* ===== body colliders (fitted to her real mesh), IK push-out, ground, cloth/hair springs, sleeves ===== */
var SECRX=/^(Hair_|Skirt_|Wing|Tail|Front_Ribon|Hand_Ribon)/,SPR=[],GRAV=1,WIND=.3,wv=new T.Vector3(),sh=new T.Vector3(),sd=new T.Vector3(),sv=new T.Vector3(),sn2=new T.Vector3(),SEG=[],SI={},SA=[],SB=[],HC=new T.Vector3(),toeRest=0,cw=new T.Vector3(),chm=new T.Vector3(),A1=new T.Vector3(),A2=new T.Vector3(),A3=new T.Vector3(),ia=new T.Vector3(),ib=new T.Vector3(),ic=new T.Vector3(),idr=new T.Vector3(),ipl=new T.Vector3(),iE=new T.Vector3(),TK={k:[0,0],v:[0,0],tgt:0,L:null,pos:null};
function setTK(v){TK.tgt=v;var b=$("slv");if(b)b.textContent="Sleeves: "+(v?"tucked":"down")}
var SEGDEF=[["hips","Hips","Spine"],["spine","Spine","Chest"],["chest","Chest","Neck"],["neck","Neck","Head"],["thighL","Left_leg","Left_knee"],["shinL","Left_knee","Left_ankle"],["footL","Left_ankle","Left_toe"],["thighR","Right_leg","Right_knee"],["shinR","Right_knee","Right_ankle"],["footR","Right_ankle","Right_toe"],["upL","Left_arm","Left_elbow"],["foreL","Left_elbow","Left_wrist"],["upR","Right_arm","Right_elbow"],["foreR","Right_elbow","Right_wrist"]];
var DOM={Hips:"hips",Spine:"spine",Chest:"chest",Neck:"neck",Left_leg:"thighL",Left_knee:"shinL",Left_ankle:"footL",Left_toe:"footL",Right_leg:"thighR",Right_knee:"shinR",Right_ankle:"footR",Right_toe:"footR",Left_arm:"upL",zArmTwist_L:"upL",Left_elbow:"foreL",zHandTwist_L:"foreL",Right_arm:"upR",zArmTwist_R:"upR",Right_elbow:"foreR",zHandTwist_R:"foreR"};
function fitBody(){
 var meshes=[],P={},HP2=[],wa=new T.Vector3(),wb=new T.Vector3();model.traverse(function(o){if(o.isSkinnedMesh&&(o.material.name==="glasses"||o.material.name==="material_3"))meshes.push(o)});
 var PS={};SEGDEF.forEach(function(d){P[d[0]]=[];PS[d[0]]=[]});
 meshes.forEach(function(m){var pos=m.geometry.attributes.position,si=m.geometry.attributes.skinIndex.array,sw=m.geometry.attributes.skinWeight.array,bn=m.skeleton.bones;
  for(var i=0;i<pos.count;i++){var bi=0,bw=0;for(var j=0;j<4;j++)if(sw[i*4+j]>bw){bw=sw[i*4+j];bi=si[i*4+j]}
   if(bw<.55)continue;var nm=bn[bi].name.replace(/_\d+$/,""),sg=DOM[nm],p=new T.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));if(sg){P[sg].push(p);if(m.material.name==="glasses")PS[sg].push(p)}else if(nm==="Head"&&m.material.name==="glasses")HP2.push(p)}});
 SEG=[];SI={};
 SEGDEF.forEach(function(d){var a=N[d[1]],b=N[d[2]];if(!a||!b)return;a.getWorldPosition(wa);b.getWorldPosition(wb);var ax=wb.clone().sub(wa),L=ax.length();ax.normalize();
  var ds=P[d[0]].map(function(p){var r=p.clone().sub(wa),t=r.dot(ax);if(t<-.03||t>L+.03)return-1;return r.addScaledVector(ax,-t).length()}).filter(function(x){return x>=0}).sort(function(x,y){return x-y});
  var rr=ds.length>8?ds[Math.floor(ds.length*.85)]:.04;var d3=PS[d[0]].map(function(p){var r=p.clone().sub(wa),t=r.dot(ax);if(t<-.03||t>L+.03)return-1;return r.addScaledVector(ax,-t).length()}).filter(function(x){return x>=0}).sort(function(x,y){return x-y}),rs=d3.length>8?d3[Math.floor(d3.length*.7)]:rr;SI[d[0]]=SEG.length;SEG.push({k:d[0],a:a,b:b,r:Math.max(.025,Math.min(.2,rr)),rs:Math.max(.02,Math.min(rr,rs))})});
 if(HP2.length>8){var c=new T.Vector3();HP2.forEach(function(p){c.add(p)});c.multiplyScalar(1/HP2.length);var d2=HP2.map(function(p){return p.distanceTo(c)}).sort(function(x,y){return x-y});HEADC={c:head.worldToLocal(c.clone()),r:Math.min(.2,d2[Math.floor(d2.length*.85)])}}
 var lt=1e9;["Left_toe","Right_toe"].forEach(function(k){if(N[k]){N[k].getWorldPosition(wa);lt=Math.min(lt,wa.y)}});toeRest=lt;if(N.Left_ankle){N.Left_ankle.getWorldPosition(wa);ANKY=wa.y}}
function segPos(){for(var i=0;i<SEG.length;i++){var s=SEG[i];SA[i]=SA[i]||new T.Vector3();SB[i]=SB[i]||new T.Vector3();s.a.getWorldPosition(SA[i]);s.b.getWorldPosition(SB[i])}if(HEADC)head.localToWorld(HC.copy(HEADC.c))}
function pushSeg(p,i,margin,tight){var a=SA[i],b=SB[i],r=(tight?SEG[i].rs:SEG[i].r)+margin;A1.copy(b).sub(a);var l2=A1.lengthSq(),t=l2>1e-9?Math.max(0,Math.min(1,A2.copy(p).sub(a).dot(A1)/l2)):0;
 A3.copy(a).addScaledVector(A1,t);A2.copy(p).sub(A3);var d=A2.length();if(d>=r)return false;if(d<1e-6)A2.set(0,0,1);else A2.multiplyScalar(1/d);p.copy(A3).addScaledVector(A2,r);return true}
function rotateToward(b,c,target){b.getWorldPosition(A1);c.getWorldPosition(A2);A2.sub(A1).normalize();A3.copy(target).sub(A1).normalize();DQ.setFromUnitVectors(A2,A3);apply(b,DQ);b.updateMatrixWorld(true)}
function ikArm(u_,el,wr,Tg){u_.getWorldPosition(ia);el.getWorldPosition(ib);wr.getWorldPosition(ic);
 var l1=ia.distanceTo(ib),l2=ib.distanceTo(ic);idr.copy(Tg).sub(ia);var d=Math.min(idr.length(),l1+l2-1e-4);if(d<1e-4)return;idr.normalize();
 ipl.copy(ib).sub(ia);ipl.addScaledVector(idr,-ipl.dot(idr));if(ipl.lengthSq()<1e-8)ipl.set(0,0,-1);ipl.normalize();
 var x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));iE.copy(ia).addScaledVector(idr,x).addScaledVector(ipl,h);
 rotateToward(u_,el,iE);rotateToward(el,wr,Tg)}
var ARMS=[["Left_arm","Left_elbow","Left_wrist","MiddleFinger2_L"],["Right_arm","Right_elbow","Right_wrist","MiddleFinger2_R"]],ARMHIT=["hips","spine","chest","thighL","thighR"];
function collide(dt){if(!SEG.length||!model)return;segPos();
 var idx=ARMHIT.map(function(k){return SI[k]}).filter(function(x){return x!==undefined});
 ARMS.forEach(function(a){var u_=N[a[0]],el=N[a[1]],wr=N[a[2]],hd=N[a[3]]||wr;if(!u_||!el||!wr)return;
  for(var it=0;it<2;it++){wr.getWorldPosition(cw);hd.getWorldPosition(chm);var p1=chm.clone(),p2=cw.clone(),m1=false,m2=false;
   idx.forEach(function(i){if(pushSeg(p1,i,.03))m1=true;if(pushSeg(p2,i,.032))m2=true});if(!m1&&!m2)break;
   var d1=p1.sub(chm),d2=p2.sub(cw),dd=d1.lengthSq()>d2.lengthSq()?d1:d2;ikArm(u_,el,wr,cw.clone().add(dd))}});
 var lo=1e9;["Left_toe","Right_toe"].forEach(function(k){if(N[k]){N[k].getWorldPosition(cw);lo=Math.min(lo,cw.y)}});
 var cur=model.position.y,off=Math.max(0,toeRest-(lo-cur));model.position.y+=(off-cur)*Math.min(1,dt*18)}
var GC={skirt:["thighL","shinL","thighR","shinR","upL","foreL","upR","foreR"],hair:["neck","chest","upL","upR"],tail:["thighL","shinL","thighR","shinR","upL","foreL","upR","foreR"],rib:["chest","upL","foreL","upR","foreR"],wing:[]};
function sgrp(k){return /^Skirt/.test(k)?"skirt":/^Hair_/.test(k)?"hair":/^Wing/.test(k)?"wing":/^Tail/.test(k)?"tail":"rib"}
var GP={skirt:{s:1.1,d:.35,g:.25,h:.014},hair:{s:.7,d:.28,g:.38,h:.008},wing:{s:1.8,d:.55,g:.08,h:0},tail:{s:.5,d:.2,g:.2,h:.01},rib:{s:.65,d:.3,g:.3,h:.008}};
function leafPts(){var map={};model.traverse(function(o){if(!o.isSkinnedMesh)return;var pos=o.geometry.attributes.position,si=o.geometry.attributes.skinIndex.array,sw=o.geometry.attributes.skinWeight.array,bn=o.skeleton.bones;
 for(var i=0;i<pos.count;i++){var bi=0,bw=0;for(var j=0;j<4;j++)if(sw[i*4+j]>bw){bw=sw[i*4+j];bi=si[i*4+j]}if(bw<.4)continue;var k=bn[bi].name.replace(/_\d+$/,"");if(!SECRX.test(k))continue;(map[k]=map[k]||[]).push(new T.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i)))}});return map}
function buildSprings(){model.updateMatrixWorld(true);segPos();var lv=leafPts(),hc=HEADC?head.localToWorld(HEADC.c.clone()):null,wq=new T.Quaternion(),wp=new T.Vector3();
 Object.keys(N).forEach(function(k){if(!SECRX.test(k))return;var b=N[k],c=b.children.filter(function(x){return x.isBone&&SECRX.test(x.name.replace(/_\d+$/,""))})[0],gp=sgrp(k),len,ld,t0=new T.Vector3();
  b.getWorldPosition(wp);b.getWorldQuaternion(wq);
  if(c){c.getWorldPosition(t0);len=wp.distanceTo(t0);ld=c.position.clone().normalize()}
  else{var pts=lv[k];if(!pts||pts.length<6)return;var cen=new T.Vector3();pts.forEach(function(p){cen.add(p)});cen.multiplyScalar(1/pts.length);var dir=cen.sub(wp);if(dir.length()<.004)dir.set(0,-1,0);dir.normalize();
   var ds=pts.map(function(p){return p.clone().sub(wp).dot(dir)}).sort(function(x,y){return x-y});len=Math.max(.035,Math.min(.4,ds[Math.floor(ds.length*.95)]));
   ld=dir.clone().applyQuaternion(wq.clone().invert());t0.copy(wp).addScaledVector(dir,len)}
  var p=GP[gp],col=GC[gp].map(function(x){return SI[x]}).filter(function(x){return x!==undefined}).filter(function(q){var tt=t0.clone();return!pushSeg(tt,q,p.h,gp==="skirt")});
  SPR.push({b:b,len:len,ld:ld,gp:gp,p:p,col:col,ch:!!(hc&&gp==="hair"&&t0.distanceTo(hc)>HEADC.r+.01),init:false})});
 SPR.sort(function(a,b){return a.b.userData.i-b.b.userData.i})}
function springs(dt,t){if(!SPR.length)return;dt=Math.min(dt,.033);if(dt<=0)return;
 wv.set(sn(t*.7)*.5+sn(t*2.3)*.25,0,sn(t*.9+1)*.3).multiplyScalar(WIND);
 SPR.forEach(function(s){var b=s.b,p=s.p;b.updateWorldMatrix(true,false);b.getWorldPosition(sh);b.getWorldQuaternion(Q);sd.copy(s.ld).applyQuaternion(Q);
  if(!s.init){s.cur=sh.clone().addScaledVector(sd,s.len);s.prev=s.cur.clone();s.init=true}
  var nt=sn2.copy(s.cur).sub(s.prev).multiplyScalar(1-p.d).add(s.cur).addScaledVector(sd,p.s*dt);nt.y-=p.g*GRAV*dt;nt.addScaledVector(wv,p.g*dt*3);
  nt.sub(sh).setLength(s.len).add(sh);
  var mv=false;for(var q=0;q<s.col.length;q++)if(pushSeg(nt,s.col[q],p.h,s.gp==="skirt"))mv=true;
  if(s.ch&&nt.distanceTo(HC)<HEADC.r+.006){nt.sub(HC).setLength(HEADC.r+.006).add(HC);mv=true}
  if(mv)nt.sub(sh).setLength(s.len).add(sh);
  s.prev.copy(s.cur);s.cur.copy(nt);sv.copy(nt).sub(sh).normalize();DQ.setFromUnitVectors(sd,sv);apply(b,DQ);b.updateMatrixWorld(true)})}
/* sleeves: tuck + gravity slide + free-hanging overhang (hand inside the sleeve).
   Cloth model: a chain of particles pinned at the wrist; the part around the hand is supported (stiff),
   the fabric beyond the fingertips is unsupported, so gravity pulls it down, it lags/swings with the hand's motion,
   and it is kept outside the arm/body colliders. The chain displaces the cuff vertices. */
var NC=5,CQ=new T.Quaternion(),CQi=new T.Quaternion(),CR=new T.Quaternion(),cv1=new T.Vector3();
var CCOL=[["foreL","upL","hips","spine","chest","thighL","thighR"],["foreR","upR","hips","spine","chest","thighL","thighR"]];
function buildSleeves(){var mesh;model.traverse(function(o){if(o.isSkinnedMesh&&o.material.name==="material_3")mesh=o});if(!mesh)return;
 var pos=mesh.geometry.attributes.position,si=mesh.geometry.attributes.skinIndex.array,sw=mesh.geometry.attributes.skinWeight.array,bn=mesh.skeleton.bones,L=[],arms=[];model.updateMatrixWorld(true);
 [["Left_elbow","Left_wrist",/^(Left_wrist|Hand_Ribon_0\d_L)$/,0,"MiddleFinger3_L"],["Right_elbow","Right_wrist",/^(Right_wrist|Hand_Ribon_0\d_R)$/,1,"MiddleFinger3_R"]].forEach(function(a){
  var e=N[a[0]].getWorldPosition(new T.Vector3()),w=N[a[1]].getWorldPosition(new T.Vector3()),ax=w.clone().sub(e).normalize(),mine=[],Lo=0;
  for(var i=0;i<pos.count;i++){var wt=0;for(var j=0;j<4;j++)if(sw[i*4+j]>0&&a[2].test(bn[si[i*4+j]].name.replace(/_\d+$/,"")))wt+=sw[i*4+j];
   if(wt<.5)continue;var o=new T.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i)),tt=o.clone().sub(w).dot(ax);if(tt<-.04)continue;var r=o.clone().sub(w);r.addScaledVector(ax,-r.dot(ax));mine.push({i:i,o:o,r:r,ax:ax,wt:wt,ai:a[3],t:tt});Lo=Math.max(Lo,tt)}
  Lo=Math.max(.06,Math.min(.35,Lo));mine.forEach(function(q){q.s=Math.max(0,q.t)/Lo;L.push(q)});
  var fb=N[a[4]],dh=.09;if(fb){fb.getWorldPosition(v1);dh=v1.distanceTo(w)}
  N[a[1]].getWorldQuaternion(CQ);arms[a[3]]={wb:N[a[1]],ax:ax,Lo:Lo,dh:dh,qr:CQ.clone(),P:null,Pv:null,DB:[]}});
 TK.L=L;TK.pos=pos;TK.arm=arms}
function cuffSim(i,dt){var A=TK.arm&&TK.arm[i];if(!A)return;var h=Math.min(dt,.033),n=NC,seg=A.Lo/n,j,Pr=[];
 A.wb.getWorldPosition(cv1);A.wb.getWorldQuaternion(CQ);CR.copy(CQ).multiply(CQi.copy(A.qr).invert());
 for(j=0;j<=n;j++)Pr.push(new T.Vector3().copy(A.ax).applyQuaternion(CR).multiplyScalar(A.Lo*j/n).add(cv1));
 if(!A.P){A.P=Pr.map(function(p){return p.clone()});A.Pv=Pr.map(function(p){return p.clone()})}
 var P=A.P,Pv=A.Pv;P[0].copy(cv1);Pv[0].copy(cv1);
 for(j=1;j<=n;j++){var p=P[j],pv=Pv[j],tj=A.Lo*j/n,kk=tj<A.dh*.7?40:Math.max(2,40*Math.exp(-(tj-A.dh*.7)/.05)),k=Math.min(1,kk*h),ox=p.x,oy=p.y,oz=p.z;
  p.x+=(p.x-pv.x)*.94+(Pr[j].x-p.x)*k;p.y+=(p.y-pv.y)*.94+(Pr[j].y-p.y)*k-9.8*GRAV*1.5*h*h;p.z+=(p.z-pv.z)*.94+(Pr[j].z-p.z)*k;pv.set(ox,oy,oz)}
 var idx=CCOL[i].map(function(q){return SI[q]}).filter(function(x){return x!==undefined});
 for(var it=0;it<2;it++){for(j=2;j<=n;j++)for(var q=0;q<idx.length;q++)pushSeg(P[j],idx[q],.012);
  for(j=1;j<=n;j++){A1.copy(P[j]).sub(P[j-1]).setLength(seg);P[j].copy(P[j-1]).add(A1)}}
 CQi.copy(CQ).invert();var Rinv=CR.copy(A.qr).multiply(CQi),fade=1-Math.max(0,Math.min(1,TK.k[i]));
 for(j=0;j<=n;j++){var d=(A.DB[j]=A.DB[j]||new T.Vector3()).copy(P[j]).sub(Pr[j]).applyQuaternion(Rinv).multiplyScalar(fade);if(d.length()>.07)d.setLength(.07)}}
function tuckUpdate(dt,t){if(!TK.L||!TK.L.length||!TK.arm)return;var h=Math.min(dt,.033),fa=[["Left_elbow","Left_wrist"],["Right_elbow","Right_wrist"]];up.set(0,1,0);
 for(var i=0;i<2;i++){var e=N[fa[i][0]],w=N[fa[i][1]];if(!e||!w)continue;e.getWorldPosition(v1);w.getWorldPosition(v2);v2.sub(v1).normalize();
  var target=Math.min(1,TK.tgt+GRAV*.55*Math.max(0,v2.dot(up))),a=(target-TK.k[i])*45-TK.v[i]*7;TK.v[i]+=a*h;TK.k[i]=Math.max(0,Math.min(1.1,TK.k[i]+TK.v[i]*h));cuffSim(i,dt)}
 TK.L.forEach(function(e){var k=TK.k[e.ai],a=.11*k*e.wt,b=.16*k*e.wt,A=TK.arm[e.ai];if(!A||!A.DB[NC])return;
  var f=e.s*NC,j=Math.min(NC-1,Math.floor(f)),u=f-j,D0=A.DB[j],D1=A.DB[j+1],w=e.wt;
  TK.pos.setXYZ(e.i,e.o.x-e.ax.x*a+e.r.x*b+(D0.x+(D1.x-D0.x)*u)*w,e.o.y-e.ax.y*a+e.r.y*b+(D0.y+(D1.y-D0.y)*u)*w,e.o.z-e.ax.z*a+e.r.z*b+(D0.z+(D1.z-D0.z)*u)*w)});TK.pos.needsUpdate=true}

/* ===== skirt surface collision: every skirt vertex is skinned on the CPU, pushed out of the leg/arm colliders, and written back ===== */
var SK=[],SKC=["thighL","shinL","thighR","shinR","upL","foreL","upR","foreR"],skP=new T.Vector3(),skS=new T.Vector3(),skQ=new T.Quaternion();
function buildSkirt(){SK=[];var cidx=SKC.map(function(k){return SI[k]}).filter(function(x){return x!==undefined});if(!cidx.length)return;model.updateMatrixWorld(true);segPos();
 model.traverse(function(o){if(!o.isSkinnedMesh||!o.boneTransform||/hair|glasses/.test(o.material.name))return;
  var pos=o.geometry.attributes.position,si=o.geometry.attributes.skinIndex.array,sw=o.geometry.attributes.skinWeight.array,bn=o.skeleton.bones,ids=[],orig=[],dom=[],mask=[];
  for(var i=0;i<pos.count;i++){var bi=0,bw=0;for(var j=0;j<4;j++)if(sw[i*4+j]>bw){bw=sw[i*4+j];bi=si[i*4+j]}if(bw<.5||!/^Skirt_/.test(bn[bi].name.replace(/_\d+$/,"")))continue;ids.push(i);orig.push(pos.getX(i),pos.getY(i),pos.getZ(i));dom.push(bi)}
  if(!ids.length)return;
  for(var n=0;n<ids.length;n++){o.boneTransform(ids[n],skP).applyMatrix4(o.matrixWorld);var m=0;for(var c=0;c<cidx.length;c++){skS.copy(skP);if(pushSeg(skS,cidx[c],.008,true))m|=1<<c}mask.push(m)}
  var iq=o.skeleton.boneInverses.map(function(M){var p_=new T.Vector3(),q=new T.Quaternion(),s_=new T.Vector3();M.decompose(p_,q,s_);return q});
  SK.push({m:o,pos:pos,ids:ids,orig:new Float32Array(orig),dom:dom,mask:mask,cidx:cidx,bn:bn,iq:iq})})}
function skirtCollide(){if(!SK.length)return;model.updateMatrixWorld(true);segPos();
 SK.forEach(function(g){var pos=g.pos,n=g.ids.length,i,RQ={};
  for(i=0;i<n;i++)pos.setXYZ(g.ids[i],g.orig[i*3],g.orig[i*3+1],g.orig[i*3+2]);
  for(i=0;i<n;i++){var d=g.dom[i];if(!RQ[d]){g.bn[d].getWorldQuaternion(skQ);RQ[d]=skQ.clone().multiply(g.iq[d]).invert()}
   g.m.boneTransform(g.ids[i],skP).applyMatrix4(g.m.matrixWorld);skS.copy(skP);var mv=false,mk=g.mask[i];
   for(var c=0;c<g.cidx.length;c++){if(mk&(1<<c))continue;if(pushSeg(skP,g.cidx[c],.008,true))mv=true}
   if(mv){skP.sub(skS);if(skP.length()>.15)skP.setLength(.15);skP.applyQuaternion(RQ[d]);pos.setXYZ(g.ids[i],g.orig[i*3]+skP.x,g.orig[i*3+1]+skP.y,g.orig[i*3+2]+skP.z)}}
  pos.needsUpdate=true})}
/* ===== procedural hands: the model has fingers only as invisible bones, so real hand geometry is added on those bones ===== */
var PXs=0,PYs=0,PT=-99,PIN=false,FW=0,LOOK=null,twS=-9,swS=-9,nextTwitch=4,nextSweep=12;
function sstep(a,b,x){var u=Math.max(0,Math.min(1,(x-a)/(b-a)));return u*u*(3-2*u)}
function buildHands(){var col=skinColor(skinMesh.material),mat=new T.MeshBasicMaterial({color:col});model.updateMatrixWorld(true);
 ["L","R"].forEach(function(sd_){var H=FING[sd_];if(!H)return;var wr=H.wr,wq=new T.Quaternion(),wp=new T.Vector3();wr.getWorldQuaternion(wq);var wqi=wq.clone().invert();wr.getWorldPosition(wp);
  var pos=function(b){return b.getWorldPosition(new T.Vector3())},i1=N["IndexFinger1_"+sd_],m1=N["MiddleFinger1_"+sd_],l1=N["LittleFinger1_"+sd_];
  if(i1&&m1&&l1){var pi=pos(i1),pm=pos(m1),pl=pos(l1),f=pm.clone().sub(wp),len=f.length(),fz=f.clone().normalize(),sx=pl.clone().sub(pi),wd=sx.length();sx.addScaledVector(fz,-sx.dot(fz)).normalize();
   var ny=fz.clone().cross(sx).normalize(),q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(sx,ny,fz)),cen=wp.clone().addScaledVector(fz,len*.52);
   var palm=new T.Mesh(new T.SphereGeometry(1,16,12),mat);palm.scale.set(wd*.62+.012,.016,len*.62);palm.position.copy(wr.worldToLocal(cen.clone()));palm.quaternion.copy(wqi).multiply(q);wr.add(palm)}
  H.ch.forEach(function(c,fi){var bs=c.b,th=fi===4?.0105:[.0085,.009,.0085,.0075][fi];
   bs.forEach(function(b,ji){var next=bs[ji+1],vec;
    if(next)vec=next.position.clone();
    else{var prev=bs[ji-1]||wr,pw=pos(b).sub(pos(prev)).normalize(),bq=new T.Quaternion();b.getWorldQuaternion(bq);vec=pw.multiplyScalar(Math.max(.012,(ji>0?b.position.length():.02)*.9)).applyQuaternion(bq.invert())}
    var L=vec.length();if(L<1e-4)return;var cyl=new T.Mesh(new T.CylinderGeometry(th,th*.92,L,10),mat);cyl.position.copy(vec).multiplyScalar(.5);cyl.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vec.clone().normalize());b.add(cyl);
    var sph=new T.Mesh(new T.SphereGeometry(th*1.04,10,8),mat);if(!next)sph.position.copy(vec);b.add(sph)})})})}
/* ===== tail & wings ===== */
var TAIL={idle:{ay:.12,az:.1,w:1.3,ph:.5,cu:0},sway:{ay:.2,az:.15,w:1.8,ph:.55,cu:0},sway_slow:{ay:.22,az:.12,w:.9,ph:.6,cu:.02},wag:{ay:.6,az:.2,w:7,ph:.35,cu:.03},wag_fast:{ay:.75,az:.25,w:12,ph:.3,cu:.04},droop:{ay:.04,az:.04,w:.6,ph:.5,cu:-.07},lash:{ay:.55,az:.35,w:9,ph:.25,cu:.01},flick:{ay:.9,az:.2,w:14,ph:.2,cu:.02},curl:{ay:.05,az:.05,w:1,ph:.5,cu:.13},curl_front:{ay:.04,az:.04,w:1,ph:.5,cu:.1,yb:-.12},raise:{ay:.08,az:.06,w:1.5,ph:.5,cu:.09},question:{ay:.05,az:.05,w:1,ph:.5,cu:.14,q:1},tremble:{ay:.07,az:.07,w:32,ph:.2,cu:0},stiff:{ay:.03,az:.03,w:2,ph:.5,cu:.04},flop:{ay:.05,az:.05,w:.5,ph:.5,cu:-.1},loose:{ay:.3,az:.3,w:.7,ph:1.2,cu:0},puff:{ay:.05,az:.05,w:3,ph:.5,cu:.11},heart:{ay:.35,az:.2,w:2.5,ph:.45,cu:.05},circle:{ay:.4,az:.4,w:4,ph:.35,cu:.03,po:1.57}};
Object.assign(TAIL,{idle:{ay:.42,az:.26,w:1.25,ph:.6,cu:.07,yb:-.04,tp:1.2},succubus:{ay:.55,az:.32,w:1.5,ph:.55,cu:.08,yb:-.05,tp:1.4},hook:{ay:.3,az:.2,w:1.1,ph:.5,cu:.1,q:1,tp:1},point:{ay:.12,az:.1,w:1.2,ph:.5,cu:.1,pt:1,tp:.4},coil:{ay:.28,az:.28,w:.9,ph:.4,cu:.16,yb:-.14,po:1.57,tp:.6}});
var WING={idle:{lf:0,yw:0,ar:.04,w:1.6,ph:.3},flutter_soft:{lf:.05,yw:0,ar:.12,w:9,ph:.25},flutter:{lf:.1,yw:0,ar:.28,w:16,ph:.2},flap:{lf:.15,yw:0,ar:.6,w:6,ph:.3},stretch:{lf:.55,yw:-.25,ar:.06,w:2,ph:.3},spread:{lf:.3,yw:-.1,ar:.05,w:1.6,ph:.3},spread_wide:{lf:.6,yw:-.3,ar:.08,w:3,ph:.3},half_spread:{lf:.15,yw:-.05,ar:.04,w:1.6,ph:.3},fold:{lf:-.2,yw:.95,ar:.03,w:1.2,ph:.3},wrap:{lf:-.25,yw:-.9,ar:.03,w:1.2,ph:.3},droop:{lf:-.5,yw:.2,ar:.02,w:.8,ph:.3},tremble:{lf:.05,yw:0,ar:.06,w:35,ph:.2},shake:{lf:.1,yw:0,ar:.3,w:22,ph:.15}};
var TAILBY={happy:"wag",joy:"wag_fast",smug:"succubus",sleepy:"droop",surprised:"puff",shy:"curl_front",embarrassed:"curl_front",sly:"hook",sad:"droop",angry:"lash",thinking:"question",love:"heart",tease:"point",yawn:"droop",kiss:"curl",pleased:"sway",determined:"stiff",bored:"flop",mischievous:"succubus",giggle:"wag_fast",nervous:"tremble",proud:"raise",curious:"question",dazed:"loose",wink_left:"sway",wink_right:"sway"};
var WINGBY={happy:"flutter_soft",joy:"flutter",smug:"spread",sleepy:"droop",surprised:"spread_wide",shy:"wrap",embarrassed:"wrap",sly:"half_spread",sad:"droop",angry:"spread_wide",thinking:"half_spread",love:"flutter_soft",tease:"half_spread",yawn:"stretch",kiss:"flutter_soft",pleased:"half_spread",determined:"spread",bored:"droop",mischievous:"flutter_soft",giggle:"flutter",nervous:"tremble",proud:"spread",curious:"half_spread",dazed:"droop"};
var TAILACT=["succubus","hook","point","coil","succubus","wag","sway","sway_slow","flick","curl","question","tremble","circle","raise","heart"],WINGACT=["flutter_soft","flutter","stretch","spread","fold","wrap","flap","shake","half_spread"];
var TS=Object.assign({},TAIL.idle,{yb:0,q:0,po:1.1,pt:0,ct:1}),WS=Object.assign({},WING.idle),tMode="idle",wMode="idle",tUntil=0,wUntil=0,tPh=0,wPh=0,nextTW=now()+6,TB=null,WB=null;
function setTail(m,s){if(!TAIL[m])return;tMode=m;tUntil=now()+(s||3)}
function setWing(m,s){if(!WING[m])return;wMode=m;wUntil=now()+(s||3)}
function nz(x,s){return(sn(x*s)+.55*sn(x*s*2.37+1.7)+.3*sn(x*s*4.1+.4))/1.85}
var ptT=new T.Vector3(),flickS=-9,nextFlick=3;
function tailWing(t,dt){
 if(!TB){TB=["Tail_02","Tail_03","Tail_04","Tail_05","Tail_06","Tail_07","Tail_08","Tail_09","Tail_10","Tail_011"].map(function(k){return N[k]}).filter(Boolean);
  WB=[["_L",1],["_R",-1]].map(function(s){return{sg:s[1],b:["Wing02","Wing03","Wing04","Wing05","Wing06","Wing07"].map(function(k){return N[k+s[0]]}).filter(Boolean),f:Object.keys(N).filter(function(k){return new RegExp("^Wing07_0\\d_0\\d"+s[0]+"$").test(k)}).map(function(k){return N[k]})}})}
 var n=now();
 if(idleOn&&n>nextTW&&n-lastAct>3&&tMode==="idle"&&wMode==="idle"){nextTW=n+rnd(5,11);if(Math.random()<.55)setTail(pk(TAILACT),rnd(2,4));else setWing(pk(WINGACT),rnd(1.5,3))}
 if(n>tUntil)tMode="idle";if(n>wUntil)wMode="idle";
 var tp=TAIL[tMode],wp=WING[wMode],k=Math.min(1,dt*2.6);
 ["ay","az","w","ph","cu"].forEach(function(a){TS[a]+=(tp[a]-TS[a])*k});TS.yb+=((tp.yb||0)-TS.yb)*k;TS.po+=((tp.po||1.1)-TS.po)*k;TS.q+=((tp.q?1:0)-TS.q)*k;TS.tp+=((tp.tp||0)-TS.tp)*k;TS.pt+=((tp.pt||0)-TS.pt)*k;
 ["lf","yw","ar","w","ph"].forEach(function(a){WS[a]+=(wp[a]-WS[a])*k});
 tPh+=TS.w*dt;wPh+=WS.w*dt;
 if(n>nextFlick){if(tMode==="idle"||tMode==="succubus"||tMode==="hook")flickS=n;nextFlick=n+rnd(4,9)}
 var fu=n-flickS,fl=fu<.9?Math.exp(-fu*4.2)*sn(fu*24):0,nb=TB.length;
 var ctw=(tMode==="idle")?1:0;TS.ct+=(ctw-TS.ct)*Math.min(1,dt*1.6);
 if(n>nextTwitch){twS=n;nextTwitch=n+rnd(5,13)}if(n>nextSweep){swS=n;nextSweep=n+rnd(14,30)}
 var twv=n-twS<1.2?Math.exp(-(n-twS)*4)*sn((n-twS)*28):0,swp=n-swS<3.5?sn(Math.PI*(n-swS)/3.5):0;
 TB.forEach(function(b,i){var u=i/(nb-1),em=1+TS.tp*(u-.3),ph=tPh-i*TS.ph,s=.7*sn(ph)+.3*sn(tPh*.41-i*TS.ph*.6+1.3)+.35*nz(t+i*.35,.23),tipf=i>=nb-4?fl*.5*(i-nb+5)/4:0;
  var my_=TS.yb+TS.ay*.22*s*em+tipf,mr_=TS.cu*(1+TS.q*((i<5?1:-1.4)-1))+TS.az*.22*sn(ph+TS.po)*em;
  var am=.35+u*1.15,cy=am*.11*(.6*sn(2.1*t-.42*i)+.3*sn(3.7*t-.3*i+1.3)+.1*sn(5.3*t-.22*i+.4))*(1+swp*1.6)+(i>=nb-3?.2*twv*(i-nb+4)/3:0),
   cr=.055+am*.085*(.6*sn(1.7*t-.5*i+.8)+.4*sn(2.9*t-.35*i+2.1))+(i>=nb-4?.1*(i-nb+5)/4:0)+swp*.05;
  rotS(b,.04*nz(t+i*.5,.31),my_*(1-TS.ct)+cy*TS.ct,mr_*(1-TS.ct)+cr*TS.ct,24,5.5)});
 if(TS.pt>.02&&nb>6){ptT.set(mx,-my,.5).unproject(cam).sub(cam.position).normalize().multiplyScalar(1.6).add(cam.position);
  for(var i=nb-6;i<nb-1;i++){(function(b,c,w){fnop(b,function(){b.getWorldPosition(A1);c.getWorldPosition(A2);A2.sub(A1).normalize();A3.copy(ptT).sub(A1).normalize();A3.lerp(A2,1-w).normalize();DQ.setFromUnitVectors(A2,A3);apply(b,DQ)})})(TB[i],TB[i+1],Math.min(1,TS.pt*(.35+.13*(i-(nb-6)))))}}
 WB.forEach(function(W){var g=W.sg;W.b.forEach(function(b,i){var x=wPh-i*WS.ph,fl2=sn(x)+.28*sn(2*x+1.05),bias=i<3?1/3:0,br2=.02*nz(t+i*.4+(g>0?0:3),.17);
   rot(b,0,g*WS.yw*bias,g*(WS.lf*bias+WS.ar*.33*fl2*(.6+.15*i)+br2),14)});
  W.f.forEach(function(b,j){rot(b,0,0,g*(WS.ar*.28*sn(wPh*1.25-j*.5)+.02*nz(t+j,.4)),14)})})}

/* ===== camera presets (free orbit/pan/zoom is always available) ===== */
var VIEWS={full:{t:[0,1,0],d:2.3},face:{t:[0,1.27,.05],d:.5},hands:{t:[0,.9,.1],d:1.0},legs:{t:[0,.35,0],d:1.5},back:{t:[0,1,-.1],d:2.3,dir:[0,.05,-1]},tail:{t:[.2,.5,-.15],d:.9,dir:[.5,.1,-1]},wings:{t:[0,1,-.15],d:1.3,dir:[0,.1,-1]}},FA2=null;
function focusView(name,dirOv){var v=VIEWS[name];if(!v)return;var dir=(dirOv||v.dir)?new T.Vector3().fromArray(dirOv||v.dir).normalize():cam.position.clone().sub(ctl.target).normalize(),tg=new T.Vector3().fromArray(v.t);
 FA2={t0:now(),dur:.7,ft:ctl.target.clone(),fp:cam.position.clone(),tt:tg,tp:tg.clone().addScaledVector(dir,v.d)}}
function focusTick(){if(!FA2)return;var u=Math.min(1,(now()-FA2.t0)/FA2.dur),e=u*u*(3-2*u);ctl.target.lerpVectors(FA2.ft,FA2.tt,e);cam.position.lerpVectors(FA2.fp,FA2.tp,e);if(u>=1)FA2=null}

/* ===== public API (window.Companion, CustomEvents, postMessage) ===== */
var LST={},API={ready:false};
function emit(e,d){(LST[e]||[]).forEach(function(f){try{f(d)}catch(x){}});try{window.dispatchEvent(new CustomEvent("companion:"+e,{detail:d}))}catch(x){}if(window.parent&&window.parent!==window)window.parent.postMessage({source:"companion",event:e,data:d},"*")}
Object.assign(API,{
 say:function(t){say(String(t))},command:function(t){handle(String(t))},
 expression:function(n,s){if(EXPR[n]){lastAct=now();setEx(n,s||4)}},gesture:function(n){if(G[n])act(n)},dance:function(n){startDance(DANCE[n]?n:undefined)},
 tail:function(n,s){setTail(n,s||4)},wings:function(n,s){setWing(n,s||4)},tuckSleeves:function(v){setTK(v?1:0)},
 gravity:function(v){GRAV=+v},wind:function(v){WIND=+v},idle:function(on){idleOn=!!on},lookAt:function(x,y){LOOK=(x===null||x===undefined)?null:[+x||0,+y||0]},
 hairColor:function(c){try{var k=new T.Color(c);hairMats.forEach(function(x){x.color.copy(k)})}catch(e){}},
 view:function(n){focusView(n)},move:function(k){startLoco(k)},list:function(){return{expressions:Object.keys(EXPR),gestures:Object.keys(G),dances:Object.keys(DANCE),tail:Object.keys(TAIL),wings:Object.keys(WING)}},
 on:function(e,f){(LST[e]=LST[e]||[]).push(f)}});
window.Companion=API;
addEventListener("message",function(e){var d=e.data;if(!d||d.target!=="companion")return;var f=API[d.method];if(typeof f==="function"){var r=f.apply(API,d.args||[]);if(e.source&&d.id!==undefined)e.source.postMessage({source:"companion",id:d.id,result:r},"*")}});
/* ===== emotes, dances, game emotes and locomotion ===== */
var GRID=new T.GridHelper(24,48,0x9a8cff,0x6f64d8);GRID.material.transparent=true;GRID.material.opacity=.12;GRID.material.depthWrite=false;scene.add(GRID);
VIEWS.far={t:[0,.9,0],d:4.2};
Object.assign(HP,{thumbs:[[1.25,1.45,1],[1.3,1.5,1.05],[1.3,1.5,1.05],[1.3,1.45,1],[0,0]],ell:[[.04,.04,.02],[1.3,1.5,1],[1.3,1.5,1],[1.3,1.45,1],[0,0]]});
Object.assign(HANDBY,{thumbs_up:{r:"thumbs"},peace_sign:{r:"peace"},take_the_l:{r:"ell"},finger_guns:{l:"ell",r:"ell"},flex:{l:"fist",r:"fist"},heroic_pose:{l:"fist",r:"fist"},victory:{l:"fist",r:"fist"},heart_hands:{l:"paw",r:"paw"},rage_quit:{l:"fist",r:"fist"},gg:{r:"flat"},t_pose:{l:"flat",r:"flat"},floss:{l:"fist",r:"fist"},dab:{l:"flat",r:"flat"},hype:{l:"fist",r:"fist"},default_dance:{l:"fist",r:"fist"},orange_justice:{l:"fist",r:"fist"},macarena:{l:"flat",r:"flat"},ymca:{l:"flat",r:"flat"},gangnam:{l:"fist",r:"fist"},running_man:{l:"fist",r:"fist"},griddy:{l:"open",r:"open"},chicken:{l:"flat",r:"flat"},carlton:{l:"open",r:"open"},shuffle:{l:"fist",r:"fist"},moonwalk:{l:"open",r:"open"}});
var MX=Math.max;
Object.assign(G,{
 t_pose:{d:4,ex:"neutral",f:function(){return arms(A(1,0,0),A(1,0,0),A(-1,0,0),A(-1,0,0),{lg:[[A(.03,-1,0),A(0,-1,0)],[A(-.03,-1,0),A(0,-1,0)]]})}},
 take_the_l:{d:3,ex:"smug",f:function(u){return{R:[A(-.3,.3,.7),A(.35,1,.35)],L:[A(.4,-.5,.2),A(.2,-.9,.2)],hd:[-.05,.2,.18],sp:[0,0,sn(u*4)*.05]}}},
 victory:{d:2.6,ex:"joy",f:function(u){return arms(A(.45,1,.1),A(.3,1,.1),A(-.45,1,.1),A(-.3,1,.1),{hp:[0,ab(u*6)*.1,0],hd:[-.2,0,0],sp:[-.15,0,0]})}},
 gg:{d:2.8,ex:"pleased",f:function(u,p){var s=sn(Math.PI*p);return{R:[A(-.3,-.45,.55),A(.85,.25,.55)],sp:[.45*s,0,0],hd:[.2*s,0,0]}}},
 heroic_pose:{d:4,ex:"proud",f:function(){return arms(A(.6,-.6,-.2),A(-.6,-.5,.45),A(-.6,-.6,-.2),A(.6,-.5,.45),{sp:[-.1,0,0],hd:[-.15,0,0],lg:[[A(.18,-1,0),A(0,-1,0)],[A(-.18,-1,0),A(0,-1,0)]]})}},
 thumbs_up:{d:2.6,ex:"wink_right",f:function(){return{R:[A(-.15,-.25,.7),A(-.1,.55,.8)],hd:[0,-.1,-.08]}}},
 peace_sign:{d:3,ex:"cheeky",f:function(){return{R:[A(-.45,.1,.5),A(.2,1,.4)],hd:[0,-.1,.2]}}},
 heart_hands:{d:3,ex:"love",f:function(u){var s=1+.04*sn(u*6);return arms(A(.4,-.4,.6),A(-.6*s,.5,.8),A(-.4,-.4,.6),A(.6*s,.5,.8),{hd:[.05,0,.08]})}},
 finger_guns:{d:3,ex:"cheeky",f:function(u){var r=MX(0,sn(u*7))*.25;return arms(A(.25,-.1,.9),A(.2,.1+r,1),A(-.25,-.1,.9),A(-.2,.1+r,1),{hd:[-.05,0,.1]})}},
 flex:{d:3,ex:"proud",f:function(u){return arms(A(.95,0,.05),A(.15,1,.25),A(-.95,0,.05),A(-.15,1,.25),{sp:[-.05,0,0],hp:[0,sn(u*5)*.005,0]})}},
 laugh:{d:3,ex:"giggle",f:function(u){return arms(A(.3,-.7,.4),A(-.4,-.3,.7),A(-.3,-.7,.4),A(.4,-.3,.7),{sp:[.35+sn(u*18)*.05,0,0],hd:[-.1,0,sn(u*16)*.05],hp:[0,ab(u*9)*.01,0]})}},
 rage_quit:{d:3,ex:"angry",f:function(u){var s=MX(0,sn(u*5));return arms(A(.25,-.8,.3),A(.1,.2,.9),A(-.25,-.8,.3),A(-.1,.2,.9),{hd:[.05,sn(u*14)*.2,0],sp:[.1,0,sn(u*22)*.03],lg:[[A(0,-1+s*.4,s*.5),A(0,-1,-.2)],[A(0,-1,0),A(0,-1,0)]]})}}
});
var MAC=[[[.2,-.9,.1],[.1,-.9,.2],[-.2,-.2,.95],[-.1,-.1,1]],[[.2,-.2,.95],[.1,-.1,1],[-.2,-.2,.95],[-.1,-.1,1]],[[.2,-.2,.95],[.1,.3,1],[-.2,-.2,.95],[-.1,.3,1]],[[.2,-.2,.95],[.1,.3,1],[-.2,-.2,.95],[-.1,.3,1]],[[.2,-.2,.95],[.1,-.1,1],[-.3,-.1,.8],[.9,.4,.3]],[[.3,-.1,.8],[-.9,.4,.3],[-.3,-.1,.8],[.9,.4,.3]],[[.7,.6,-.1],[-.6,.9,-.2],[-.7,.6,-.1],[.6,.9,-.2]],[[.6,-.6,-.2],[-.6,-.5,.45],[-.6,-.6,-.2],[.6,-.5,.45]]];
var YM=[[[.6,1,0],[.6,1,0],[-.6,1,0],[-.6,1,0]],[[.8,.4,.2],[-.7,.8,.3],[-.8,.4,.2],[.7,.8,.3]],[[.7,.6,.2],[.2,.9,.4],[-.2,.3,.8],[.3,-.2,.9]],[[.5,1,.1],[-.4,1,.1],[-.5,1,.1],[.4,1,.1]]];
function seq(S,i){var s=S[i];return arms(A(s[0][0],s[0][1],s[0][2]),A(s[1][0],s[1][1],s[1][2]),A(s[2][0],s[2][1],s[2][2]),A(s[3][0],s[3][1],s[3][2]))}
Object.assign(DANCE,{
 floss:function(t){var s=sn(t*7);return arms(A(.7*s,-.6,.5*s),A(.7*s,-.6,.5*s),A(.7*s,-.6,-.5*s),A(.7*s,-.6,-.5*s),{hp:[-s*.07,ab(t*7)*.015,0],sp:[0,0,s*.1],lg:[[A(.1,-1,0),A(0,-1,0)],[A(-.1,-1,0),A(0,-1,0)]]})},
 dab:function(t){var sd=Math.floor(t/1.2)%2?1:-1,ph=(t%1.2)/1.2,e=Math.min(1,ph*6)*(ph>.8?(1-ph)/.2:1),M=function(a,b){return[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e,a[2]+(b[2]-a[2])*e]},ld=sd>0,bu=A(sd*.3,.4,.7),bf=A(-sd*.7,.7,.4),su=A(-sd*.8,.7,.15);
  return arms(M(A(.36,-1,-.06),ld?bu:su),M(A(.3,-1,-.04),ld?bf:su),M(A(-.36,-1,-.06),ld?su:bu),M(A(-.3,-1,-.04),ld?su:bf),{hd:[.35*e,sd*.5*e,-sd*.15*e],sp:[.1*e,0,0]})},
 default_dance:function(t){var s=sn(t*6);return arms(A(.65,-.2,.2),A(-.2+s*.8,.7,.6),A(-.65,-.2,.2),A(.2+s*.8,.7,.6),{hp:[s*.03,ab(t*6)*.03,0],sp:[0,s*.2,0],lg:[[A(.15,-1,s*.2),A(0,-1,0)],[A(-.15,-1,-s*.2),A(0,-1,0)]],hd:[0,0,s*.06]})},
 orange_justice:function(t){var s=sn(t*7)*1.1;return arms(A(.3,-Math.cos(s),Math.sin(s)),A(.2,-Math.cos(s+1.2),Math.sin(s+1.2)),A(-.3,-Math.cos(-s),Math.sin(-s)),A(-.2,-Math.cos(-s+1.2),Math.sin(-s+1.2)),{hp:[s*.03,0,0],sp:[0,s*.3,0],lg:[[A(.1+s*.2,-1,0),A(0,-1,0)],[A(-.1+s*.2,-1,0),A(0,-1,0)]]})},
 macarena:function(t){var o=seq(MAC,Math.floor(t/.55)%8);o.hp=[sn(t*5)*.03,ab(t*5)*.01,0];return o},
 ymca:function(t){return seq(YM,Math.floor(t/.9)%4)},
 gangnam:function(t){var s=sn(t*7),a=MX(0,s),b=MX(0,-s);return arms(A(.3,-.5,.7),A(-.3,.3+s*.3,.9),A(-.3,-.5,.7),A(.3,.3-s*.3,.9),{hp:[0,ab(t*7)*.045,0],lg:[[A(.05,-1+a*.5,a*.7),A(0,-1+a*.3,-a*.5)],[A(-.05,-1+b*.5,b*.7),A(0,-1+b*.3,-b*.5)]],hd:[0,0,s*.05]})},
 moonwalk:function(t){var s=sn(t*3.2),a=MX(0,s),b=MX(0,-s);return{L:[A(.4,-.7,.2),A(.3,-.9,.3)],R:[A(-.5,-.2,.6),A(-.1,.6,.8)],hp:[0,ab(t*3.2)*.01,0],hd:[-.08,0,0],lg:[[A(.03,-1,-.28*s),A(0,-1,-.1*s),A(0,-.4-a*.6,1)],[A(-.03,-1,.28*s),A(0,-1,.1*s),A(0,-.4-b*.6,1)]]}},
 running_man:function(t){var o=gait(LK.run.k,t*7.5,1);o.hp=[0,ab(t*7.5)*.03,0];o.sp=[.15,0,0];return o},
 griddy:function(t){var s=sn(t*6),c=sn(t*6+1.5),a=MX(0,s),b=MX(0,-s);return arms(A(.9,.2+.5*c,0),A(.7,.6*c,.2),A(-.9,.2-.5*c,0),A(-.7,-.6*c,.2),{hp:[0,ab(t*6)*.02,0],lg:[[A(-.25*a+.1,-1,.3*a),A(0,-1,0)],[A(.25*b-.1,-1,.3*b),A(0,-1,0)]]})},
 hype:function(t){var p=sn(t*8),a=MX(0,p),b=MX(0,-p);return arms(A(.5,.2+.8*a,.2),A(.3,.5+.5*a,.5),A(-.5,.2+.8*b,.2),A(-.3,.5+.5*b,.5),{hp:[0,ab(t*8)*.06,0],sp:[-.1,0,p*.08],hd:[-.1,0,0],lg:[[A(.1,-1+ab(t*8)*.2,ab(t*8)*.3),A(0,-1,-.2*ab(t*8))],[A(-.1,-1+ab(t*8)*.2,ab(t*8)*.3),A(0,-1,-.2*ab(t*8))]]})},
 chicken:function(t){var u=sn(t*9);return arms(A(.9,-.1+.4*u,0),A(-.3,1,.3),A(-.9,-.1-.4*u,0),A(.3,1,.3),{hp:[0,ab(t*4.5)*.04,0],hd:[ab(t*9)*.12,0,0],lg:[[A(.1,-.9,.2),A(0,-.9,-.3)],[A(-.1,-.9,.2),A(0,-.9,-.3)]]})},
 carlton:function(t){var s=sn(t*3);return arms(A(.6,.3+.5*s,.3),A(.2,.4+.4*s,.7),A(-.6,.3-.5*s,.3),A(-.2,.4-.4*s,.7),{hp:[sn(t*1.5)*.04,ab(t*3)*.02,0],sp:[0,s*.2,0],hd:[0,0,s*.08]})},
 shuffle:function(t){var s=sn(t*8),a=MX(0,s),b=MX(0,-s);return arms(A(.5,-.4,.3),A(.2,.6+.3*s,.6),A(-.5,-.4,.3),A(-.2,.6-.3*s,.6),{hp:[0,ab(t*8)*.03,0],lg:[[A(.1+.3*a,-1,0),A(0,-1,0)],[A(-.1-.3*b,-1,0),A(0,-1,0)]]})}
});
Object.assign(DEXP,{floss:"smug",dab:"smug",default_dance:"joy",orange_justice:"happy",macarena:"cheeky",ymca:"joy",gangnam:"mischievous",moonwalk:"smug",running_man:"determined",griddy:"proud",hype:"joy",chicken:"giggle",carlton:"happy",shuffle:"cheeky"});
var GM={};["t_pose","take_the_l","victory","gg","heroic_pose","thumbs_up","peace_sign","heart_hands","finger_guns","flex","laugh","rage_quit"].forEach(function(k){GM[k]=1});
/* ---- locomotion: gait cycle + waypoint steering (position, heading, speed ramp) ---- */
var loco=null,LK={walk:{v:1,cyc:1.1,ex:"pleased",k:{A:.45,F:.7,F0:.12,AA:.4,EF:.3,bob:.015,sway:.012,twist:.12,cross:.03}},run:{v:2.6,cyc:2,ex:"determined",k:{A:.8,F:1.35,F0:.15,AA:.7,EF:1.2,bob:.03,sway:.01,twist:.2,cross:.02,lean:.22}},catwalk:{v:.85,cyc:1.3,ex:"smug",k:{A:.5,F:.55,F0:.1,AA:.25,EF:.2,bob:.01,sway:.05,twist:.2,cross:.1,cat:1}},sneak:{v:.5,cyc:.8,ex:"sly",k:{A:.3,F:.8,F0:.5,AA:.2,EF:.3,bob:.01,sway:.01,twist:.05,cross:.03,crouch:.07,lean:.25}},skip:{v:1.4,cyc:1,ex:"joy",k:{A:.5,F:1,F0:.1,AA:.6,EF:.6,bob:.05,sway:.01,twist:.1,cross:.02}}};
function gait(k,ph,sp){var o={lg:[null,null]};
 [0,1].forEach(function(s){var p=ph+s*Math.PI,at=k.A*sp*sn(p),fl=(k.F*Math.pow(MX(0,Math.cos(p)),2)+k.F0)*sp,as=at-fl,cx=(s?-1:1)*k.cross*sp;
  o.lg[s]=[A(cx,-Math.cos(at),Math.sin(at)),A(cx*.6,-Math.cos(as),Math.sin(as)),A(0,-.2+.35*MX(0,as),1)];
  var aa=-k.AA*sp*sn(p),af=aa+(k.EF*sp+.12),sx=s?-1:1,bx=sx*(.36-.18*sp);
  o[s?"R":"L"]=[A(bx,-Math.cos(aa),Math.sin(aa)),A(sx*.1,-Math.cos(af),Math.sin(af))]});return o}
function angd(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
function startLoco(kind){if(!LK[kind])return;lastAct=now();curG=null;dance=null;var R=1,wps=[],i;
 if(kind==="catwalk")wps=[{x:0,z:1.1,act:"pose"},{x:0,z:-1.1,act:"pose"},{x:0,z:0}];
 else{for(i=0;i<=24;i++){var a=i/24*Math.PI*4;wps.push({x:R*Math.sin(a),z:R*Math.cos(a)})}wps.push({x:0,z:0})}
 loco={kind:kind,wps:wps,i:0,ph:0,v:0,h:model?model.rotation.y:0,wait:0,F:[],I:{freq:0,v:0,stand:true}};setEx(LK[kind].ex,120);
 if(cam.position.distanceTo(ctl.target)<3)focusView("far")}
/* ===== realistic locomotion: planted-foot gait + two-bone leg IK, hips reach/bob, pelvis/spine counter-rotation ===== */
var ANKY=.042,LKI={walk:{ds:.62,S:1.15,w:.04,sway:.022,yaw:.12,aa:.42,ef0:.22,ef1:.5,lean:.02,lift:.06,low:.02},run:{ds:.36,S:2.4,w:0,sway:.012,yaw:.2,aa:.75,ef0:1.15,ef1:.35,lean:.2,lift:.14,low:.06},catwalk:{ds:.6,S:1.3,w:-.12,sway:.05,yaw:.24,aa:.2,ef0:.2,ef1:.2,lean:-.02,lift:.05,low:.025},sneak:{ds:.7,S:.8,w:.06,sway:.015,yaw:.06,aa:.2,ef0:.4,ef1:.2,lean:.25,lift:.04,low:.09},skip:{ds:.45,S:1.6,w:.05,sway:.015,yaw:.1,aa:.65,ef0:.7,ef1:.6,lean:.05,lift:.12,low:.04}};
var idr0=new T.Vector3(),ipl0=new T.Vector3(),ic2=new T.Vector3();
function planFeet(P,K,dt,root,fwd,lft,stand){var F=P.F,kk=Math.min(1,dt*6);
 for(var j=0;j<2;j++){var ph=((P.ph+(j?.5:0))%1+1)%1,side=(j===0?1:-1)*(.075+K.w/2),f=F[j]||(F[j]={st:true,pl:null,from:null,pos:null,pit:0});
  var at=function(off){return[root[0]+fwd[0]*off+lft[0]*side,ANKY,root[2]+fwd[2]*off+lft[2]*side]};
  if(!f.pl){f.pl=at(0);f.pos=f.pl.slice()}
  if(stand){var tg=at(0);f.pl=[f.pl[0]+(tg[0]-f.pl[0])*kk,ANKY,f.pl[2]+(tg[2]-f.pl[2])*kk];f.pos=f.pl.slice();f.st=true;f.pit*=1-kk;continue}
  if(f.force!==undefined){f.force+=dt;var u=Math.min(1,f.force/.25),e2=u*u*(3-2*u),tg3=at(P.I.v*MX(0,.25-f.force)+K.S*K.ds/2);
   f.pos=[f.from[0]+(tg3[0]-f.from[0])*e2,ANKY+K.lift*.7*Math.sin(Math.PI*u),f.from[2]+(tg3[2]-f.from[2])*e2];f.pit=-.3*(1-u)+.1*u;
   if(u>=1){f.pl=at(K.S*K.ds/2);f.pos=f.pl.slice();f.st=true;delete f.force}continue}
  var st=ph<K.ds;
  if(st&&f.st&&P.I.v>.3){var rb=(f.pl[0]-root[0])*fwd[0]+(f.pl[2]-root[2])*fwd[2];if(rb<-K.S*K.ds*.62){f.force=0;f.from=f.pos.slice();f.st=false;continue}}
  if(st&&!f.st)f.pl=at(K.S*K.ds/2);
  if(!st&&f.st)f.from=f.pos.slice();
  f.st=st;
  if(st){f.pos=f.pl.slice();var s=ph/K.ds;f.pit=s<.12?.14*(1-s/.12):(s>.72?-.6*Math.min(1,(s-.72)/.28):0)}
  else{var s2=(ph-K.ds)/(1-K.ds),tRem=(1-ph)/Math.max(.05,P.I.freq),tg2=at(P.I.v*tRem+K.S*K.ds/2),e=s2*s2*(3-2*s2);
   f.pos=[f.from[0]+(tg2[0]-f.from[0])*e,ANKY+K.lift*Math.sin(Math.PI*s2),f.from[2]+(tg2[2]-f.from[2])*e];f.pit=-.45*(1-s2)*(1-s2)+.12*s2*s2}}
 return F}
function ikLimb(u_,el,wr,Tg,pole){u_.getWorldPosition(ia);el.getWorldPosition(ib);wr.getWorldPosition(ic);
 var l1=ia.distanceTo(ib),l2=ib.distanceTo(ic);idr.copy(Tg).sub(ia);var d=Math.min(idr.length(),(l1+l2)*.999);if(d<1e-4)return;idr.normalize();
 ipl.copy(pole);ipl.addScaledVector(idr,-ipl.dot(idr));if(ipl.lengthSq()<1e-8)ipl.set(0,0,1);ipl.normalize();
 var x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));iE.copy(ia).addScaledVector(idr,x).addScaledVector(ipl,h);
 var tf=new T.Vector3().copy(ia).addScaledVector(idr,d);rotateToward(u_,el,iE);rotateToward(el,wr,tf)}
function legLen(){var a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();N.Left_leg.getWorldPosition(a);N.Left_knee.getWorldPosition(b);N.Left_ankle.getWorldPosition(c);return a.distanceTo(b)+b.distanceTo(c)}
function legIK(dt){var P=loco;if(!P||!P.I||!model||!N.Left_leg||!N.Right_leg||!N.Left_toe||!N.Right_toe)return;var K=LKI[P.kind],cs=Math.cos(P.h),sn_=Math.sin(P.h),root=[model.position.x,0,model.position.z],fwd=[sn_,0,cs],lft=[cs,0,-sn_];
 var F=planFeet(P,K,dt,root,fwd,lft,P.I.stand),legs=[[N.Left_leg,N.Left_knee,N.Left_ankle,N.Left_toe],[N.Right_leg,N.Right_knee,N.Right_ankle,N.Right_toe]],L=P.L||(P.L=legLen()),need=0,any=false,j;
 for(j=0;j<2;j++){if(!F[j].st)continue;legs[j][0].getWorldPosition(ia);var dh=Math.hypot(ia.x-F[j].pos[0],ia.z-F[j].pos[2]),req=F[j].pos[1]+Math.sqrt(Math.max(.0004,L*L*.98-dh*dh)),dy=req-ia.y;if(!any||dy<need)need=dy;any=true}
 var tgt=any?Math.min(-K.low,need):0;P.dy=(P.dy===undefined?tgt:P.dy)+(tgt-P.dy)*Math.min(1,dt*30);
 N.Hips.parent.getWorldQuaternion(Q);v1.set(0,P.dy,0).applyQuaternion(Q.invert());N.Hips.position.add(v1);model.updateMatrixWorld(true);
 for(j=0;j<2;j++){var Fj=F[j];idr0.set(Fj.pos[0],Fj.pos[1],Fj.pos[2]);var sg=j?-1:1;ipl0.set(fwd[0]+lft[0]*sg*.15,0,fwd[2]+lft[2]*sg*.15);
  ikLimb(legs[j][0],legs[j][1],legs[j][2],idr0,ipl0);
  var pc=Math.cos(Fj.pit),ps=Math.sin(Fj.pit);legs[j][2].getWorldPosition(ia);ic2.set(ia.x+fwd[0]*pc,ia.y+ps,ia.z+fwd[2]*pc);rotateToward(legs[j][2],legs[j][3],ic2)}}
function locoPose(t,dt){var P=loco,K=LK[P.kind],G2=LKI[P.kind],g={},posing=false,cat=P.kind==="catwalk",TP=6.2832;
 if(P.wait>0){P.wait-=dt;posing=true;P.v+=(0-P.v)*Math.min(1,dt*6)}
 else{var wp=P.wps[P.i];
  if(!wp){var h0=angd(0,P.h);P.h+=Math.sign(h0)*Math.min(Math.abs(h0),dt*4);P.v+=(0-P.v)*Math.min(1,dt*6);if(Math.abs(h0)<.03&&P.v<.05){loco=null;exEnd=now()+.4;return{ry:0,px:model.position.x,pz:model.position.z}}}
  else{var dx=wp.x-model.position.x,dz=wp.z-model.position.z;
   if(Math.hypot(dx,dz)<.12){if(wp.act==="pose")P.wait=2.4;P.i++}
   else{var he=angd(Math.atan2(dx,dz),P.h);P.h+=Math.sign(he)*Math.min(Math.abs(he),dt*4.5);P.v+=(K.v*MX(0,1-Math.abs(he)/.9)-P.v)*Math.min(1,dt*4);
    model.position.x+=Math.sin(P.h)*P.v*dt;model.position.z+=Math.cos(P.h)*P.v*dt}}}
 var sp=Math.min(1,P.v/K.v),freq=P.v/G2.S;P.ph=(P.ph+freq*dt)%1;P.I={freq:freq,v:P.v,stand:P.v<.15||posing};
 var ph=P.ph,c0=Math.cos(TP*ph),s0=Math.sin(TP*ph),lf=[Math.cos(P.h),0,-Math.sin(P.h)],sw=G2.sway*sp*s0;
 [0,1].forEach(function(s){var pl=ph+(s?.5:0),aa=-G2.aa*sp*sn(TP*pl),el=G2.ef0*sp+G2.ef1*sp*MX(0,sn(TP*pl+.6))+.1,sx=s?-1:1,bx=sx*(.36-.2*sp);
  g[s?"R":"L"]=[A(bx,-Math.cos(aa),Math.sin(aa)),A(sx*.1,-Math.cos(aa+el),Math.sin(aa+el))]});
 g.px=model.position.x;g.pz=model.position.z;g.ry=P.h;
 g.hp=[lf[0]*sw,0,lf[2]*sw];g.hy=-G2.yaw*sp*c0;g.hr=.035*sp*s0;
 g.sp=[G2.lean*sp+.015*sp*Math.cos(2*TP*ph),G2.yaw*sp*c0*.9,-.03*sp*s0];g.hd=[(cat?-.08:0)-.02*sp*Math.cos(2*TP*ph),-G2.yaw*sp*c0*.5,.03*sp*s0];
 if(cat)g.L=[A(.55,-.7,-.2),A(-.5,-.4,.3)];
 if(posing&&cat){g.L=[A(.6,-.65,-.2),A(-.55,-.45,.35)];g.R=[A(-.6,-.65,-.2),A(.55,-.45,.35)];g.hp=[.05,0,0];g.sp=[0,0,.12];g.hy=-.15;g.hr=0;g.hd=[-.1,.2,.1]}
 return g}
/* ===== organic motion helpers: springy head/spine, arm jitter, wrist follow-through, idle weight shift ===== */
function spe(k,tv,K,C,dt){var s=SPD[k+"e"];if(!s)s=SPD[k+"e"]={x:tv.clone(),v:new T.Vector3()};var h=Math.min(dt,.033)/2;for(var i=0;i<2;i++){var a=v3.copy(tv).sub(s.x).multiplyScalar(K).addScaledVector(s.v,-C);s.v.addScaledVector(a,h);s.x.addScaledVector(s.v,h)}return s.x}
function rotS(b,x,y,z,K,C){if(b)ops.push({b:b,e:[x,y,z],k:b.uuid+"s",K:K,C:C})}
function jt(a,s,t){return[a[0]+.03*nz(t+s,.4),a[1]+.02*nz(t+s+3,.35),a[2]+.03*nz(t+s+6,.45)]}
function wristLag(){["Left","Right"].forEach(function(sd_){var el=N[sd_+"_elbow"],wr=N[sd_+"_wrist"];if(!el||!wr)return;
 fnop(wr,function(){var s=SPD[el.uuid];if(!s)return;var sp_=s.v.length();if(sp_<.02)return;ax1.copy(s.x).cross(s.v);if(ax1.lengthSq()<1e-8)return;ax1.normalize();DQ.setFromAxisAngle(ax1,-Math.min(.55,sp_*.07));apply(wr,DQ)})})}
function idleLegs(t){var k=sn(t*.33+.5),sh=Math.tanh(2.2*k),a=MX(0,sh),b=MX(0,-sh);
 return{lg:[[A(.02+.04*b,-1+.04*b,.09*b),A(0,-1+.1*b,-.18*b)],[A(-.02-.04*a,-1+.04*a,.09*a),A(0,-1+.1*a,-.18*a)]],hp:[.018*sh,0,0],hr:-.035*sh,sp:[0,0,-.03*sh]}}

/* ===== director: idle life ===== */
function director(n){if(!idleOn||loco||curG||dance||n-lastAct<4||n<nextIdle)return;nextIdle=n+rnd(6,13);var r=Math.random();
 if(n-lastAct>70&&r<.5){setEx("sleepy",8);return}
 if(r<.45){var i=pk(IDLE);var o=G[i[0]];curG={f:o.f,t0:n,d:o.d,n:i[0]};setEx(o.ex,o.d+.5)}
 else if(r<.85)setEx(pk(MICRO),rnd(1.2,2.4));else{nextSac=n;sac=[rnd(-.8,.8),rnd(-.4,.4)];nextSac=n+2}}
var WE=0;function we(e){if(WE++<3)console.error(e)}var clk=new T.Clock();
(function tick(){var dt=Math.min(clk.getDelta(),.05),t=clk.elapsedTime;focusTick();ctl.update();
 if(model){try{pose(t,dt)}catch(e){we(e)}try{legIK(dt)}catch(e){we(e)}try{collide(dt)}catch(e){we(e)}try{springs(dt,t)}catch(e){we(e)}try{skirtCollide()}catch(e){we(e)}try{tuckUpdate(dt,t)}catch(e){we(e)}try{faceUpdate(t,dt)}catch(e){we(e)}director(now())}
 ren.render(scene,cam);requestAnimationFrame(tick)})();
addEventListener("pointermove",function(e){var r=stage.getBoundingClientRect();mx=((e.clientX-r.left)/r.width)*2-1;my=((e.clientY-r.top)/r.height)*2-1;PXs=e.clientX-r.left;PYs=e.clientY-r.top;PT=now();PIN=true});
function fx(ch){return;head.getWorldPosition(v1);v1.y+=.2;var p=v1.clone().project(cam),r=stage.getBoundingClientRect();
 for(var i=0;i<2;i++){var s=document.createElement("span");s.textContent=ch;s.style.cssText="position:absolute;pointer-events:none;font-size:22px;transition:transform 1.6s ease-out,opacity 1.6s;opacity:1;left:"+((p.x*.5+.5)*r.width+rnd(-35,35))+"px;top:"+((-p.y*.5+.5)*r.height)+"px";stage.appendChild(s);
  setTimeout(function(s){return function(){s.style.transform="translateY(-60px)";s.style.opacity=0}}(s),30);setTimeout(function(s){return function(){s.remove()}}(s),1700)}}
/* ===== touch ===== */
var ray=new T.Raycaster(),down=null;
ren.domElement.addEventListener("pointerdown",function(e){down={x:e.clientX,y:e.clientY}});
ren.domElement.addEventListener("pointerup",function(e){if(!down||!model)return;var far=Math.hypot(e.clientX-down.x,e.clientY-down.y)>6;down=null;if(far)return;
 var r=stage.getBoundingClientRect();ray.setFromCamera(new T.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1),cam);
 var h=ray.intersectObject(model,true)[0];if(!h)return;
 var best="",bd=9,w=new T.Vector3();["Head","Neck","Chest","Spine","Hips","Left_wrist","Right_wrist","Left_arm","Right_arm","Left_elbow","Right_elbow","Left_leg","Right_leg","Tail_02","Tail_05","Tail_08","Tail_011","Wing04_L","Wing04_R","Wing07_L","Wing07_R"].forEach(function(k){if(!N[k])return;N[k].getWorldPosition(w);var d=w.distanceTo(h.point);if(d<bd){bd=d;best=k}});
 var reg="body";if(/^Tail/.test(best)&&bd<.1)reg="tail";else if(/^Wing/.test(best)&&bd<.12)reg="wing";else if(best==="Head"||best==="Neck"){N.Head.getWorldPosition(w);reg=(h.point.z-w.z>.05&&h.point.y<w.y+.1)?"face":"head"}else if(/wrist/.test(best))reg="hand";else if(/arm|elbow/.test(best))reg="arm";
 var t=now();clicks=clicks.filter(function(c){return t-c<3});clicks.push(t);
 if(clicks.length>=5){clicks=[];act("shake_head","angry");return say("Okay okay, that’s enough poking!")}
 var c=pk(REACT[reg]);act(c[1],c[0]);if(c[3])setTail(c[3],3);if(c[4])setWing(c[4],3);emit("touch",{region:reg});say(c[2])});
/* ===== chat, tasks, games ===== */
var voice=false,log=$("log"),bub=$("bubble");
$("vox").onclick=function(e){voice=!voice;e.target.textContent="Voice: "+(voice?"on":"off")};
$("idl").onclick=function(e){idleOn=!idleOn;e.target.textContent="Idle life: "+(idleOn?"on":"off")};$("rGr").oninput=function(){GRAV=+this.value};$("rWi").oninput=function(){WIND=+this.value};$("slv").onclick=function(){setTK(TK.tgt?0:1)};
function add(m,t){var d=document.createElement("div");d.textContent=t;d.style.textAlign=m?"right":"left";d.style.opacity=m?.7:1;log.appendChild(d);log.scrollTop=1e5}
function say(t){bub.textContent=t;add(0,"Her: "+t);emit("say",{text:t});talkUntil=now()+Math.min(4,t.length*.06);if(voice&&window.speechSynthesis){speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.onstart=function(){talkUntil=now()+30};u.onend=function(){talkUntil=0};speechSynthesis.speak(u)}}
function fill(id,obj,fn){var s=$(id);Object.keys(obj).forEach(function(k){var o=document.createElement("option");o.value=k;o.textContent=k.replace(/_/g," ");s.appendChild(o)});s.onchange=function(){if(s.value){fn(s.value);s.selectedIndex=0}}}
fill("sEx",EXPR,function(k){lastAct=now();setEx(k,5)});fill("sGe",G,function(k){act(k)});fill("sDa",DANCE,function(k){startDance(k)});fill("sTa",TAIL,function(k){lastAct=now();setTail(k,5)});fill("sWi",WING,function(k){lastAct=now();setWing(k,5)});fill("sMv",LK,function(k){startLoco(k)});fill("sGm",GM,function(k){act(k)});
var rules={},timers=[],sc={w:0,l:0,d:0},game=null,nE=Object.keys(EXPR).length,nG=Object.keys(G).length,nD=Object.keys(DANCE).length;
var HELP="Pick moods, gestures and dances from the menus, or type: walk · run · catwalk · sneak · skip · floss · dab · t_pose · tail wag · wings flutter · any mood/gesture name (e.g. blush → shy, sleepy, wink_left, bow, curtsy) · dance disco · list · calc 12*(3+4) · remind me in 20s to stretch · timer 30 · every 15s say drink water · stop · teach ping => pong · hair color #ff66aa · play rps · play guess";
function handle(raw){var s=raw.trim();if(!s)return;add(1,"You: "+s);lastAct=now();var l=s.toLowerCase().replace(/\s+/g,"_"),ls=s.toLowerCase(),m;
 if(rules[ls])return say(rules[ls]);
 if(m=s.match(/^teach\s+(.+?)\s*=>\s*(.+)$/i)){rules[m[1].toLowerCase()]=m[2];return say("Learned it!")}
 if(m=ls.match(/^remind me in (\d+)\s*(s|sec|m|min)\w*\s*(?:to\s+)?(.+)$/)){var ms=+m[1]*(m[2][0]==="m"?6e4:1e3),w=s.replace(/^remind me in \d+\s*\w+\s*(to\s+)?/i,"");timers.push(setTimeout(function(){say("Reminder: "+w+"!");act("wave","surprised")},ms));return say("Okay, I’ll remind you.")}
 if(m=ls.match(/^timer (\d+)/)){var n=+m[1];timers.push(setTimeout(function(){say("Time’s up!");startDance()},n*1e3));return say("Timer set for "+n+"s.")}
 if(m=s.match(/^every (\d+)\s*s\w*\s+say\s+(.+)$/i)){timers.push(setInterval(function(){say(m[2]);setEx("happy",2)},+m[1]*1e3));return say("Okay! Say “stop” to cancel.")}
 if(ls==="stop"){timers.splice(0).forEach(function(t){clearTimeout(t);clearInterval(t)});game=null;dance=null;curG=null;loco=null;return say("All tasks and games stopped.")}
 if(m=ls.match(/^calc (.+)$/)){if(!/^[\d+\-*/().%\s]+$/.test(m[1]))return say("Numbers and + - * / ( ) % only.");try{return say("= "+Function('"use strict";return ('+m[1]+')')())}catch(e){return say("That doesn’t parse.")}}
 if(m=ls.match(/^hair color (\S+)$/)){try{var c=new T.Color(m[1]);hairMats.forEach(function(x){x.color.copy(c)});return say("New hair color!")}catch(e){return say("Try a name or #rrggbb.")}}
 if(/untuck|unroll|sleeves down/.test(ls)){act("unroll_sleeves");return say("Sleeves down again.")}if(/(tuck|roll).*sleeve|sleeves up/.test(ls)){act("roll_sleeves");return say("Let me tuck these up~")}if(m=ls.match(/^tail(?:\s+(.+))?$/)){var tk=(m[1]||"").replace(/\s+/g,"_");if(TAIL[tk]){setTail(tk,5);return say("*tail "+tk.replace(/_/g," ")+"*")}return say("Tail moves: "+Object.keys(TAIL).join(", "))}if(m=ls.match(/^wings?(?:\s+(.+))?$/)){var wk=(m[1]||"").replace(/\s+/g,"_");if(WING[wk]){setWing(wk,5);return say("*wings "+wk.replace(/_/g," ")+"*")}return say("Wing moves: "+Object.keys(WING).join(", "))}if(m=l.match(/^(walk|run|cat_?walk|sneak|skip)$/)){var mk2=m[1].replace("_","");startLoco(mk2);return say("*"+mk2+"*")}if(DANCE[l]){startDance(l);return say("*"+l.replace(/_/g," ")+"*")}if(ls==="list")return say(nE+" expressions: "+Object.keys(EXPR).join(", ")+" · "+nG+" gestures: "+Object.keys(G).join(", ")+" · "+nD+" dances: "+Object.keys(DANCE).join(", ")+" · tail: "+Object.keys(TAIL).join(", ")+" · wings: "+Object.keys(WING).join(", "));
 if(ls==="help")return say(HELP);
 if(/^dance(_|$)/.test(l)){var d=l.replace(/^dance_?/,"");if(d&&!DANCE[d])return say("Dances: "+Object.keys(DANCE).join(", "));startDance(d);return say("Watch this!")}
 if(l.replace(/^mood_/,"")in EXPR){setEx(l.replace(/^mood_/,""),5);return say("*"+l.replace(/^mood_/,"").replace(/_/g," ")+"*")}
 if(G[l]){act(l);return say("*"+l.replace(/_/g," ")+"*")}
 if(l==="blush"){setEx("shy",5);return say("D-don’t look at me like that…")}
 if(/^(hi|hello|hey)\b/.test(ls)){act("wave");return say("Hello! Want to play something?")}
 if(ls==="time")return say("It’s "+new Date().toLocaleTimeString()+".");
 if(ls==="joke"){setEx("giggle",3);return say(pk(["I told my code a joke. It threw an exception.","Why do programmers prefer dark mode? Light attracts bugs."]))}
 if(ls==="play rps"){game="rps";return say("Rock, paper, scissors! Your move.")}
 if(ls==="play guess"){game={n:1+Math.floor(Math.random()*50),t:0};return say("Guess my number, 1 to 50.")}
 if(game==="rps"&&/^(rock|paper|scissors)$/.test(ls)){var o=["rock","paper","scissors"],me=pk(o),r=(o.indexOf(ls)-o.indexOf(me)+3)%3,res=["draw","win","lose"][r];sc[res==="win"?"w":res==="lose"?"l":"d"]++;
  if(res==="lose")act("cheer","smug");else if(res==="win")setEx("pout",3);else setEx("curious",2);return say("I pick "+me+". You "+res+"! (W"+sc.w+" L"+sc.l+" D"+sc.d+")")}
 if(game&&game.n&&/^\d+$/.test(ls)){var g=+ls;game.t++;if(g===game.n){var k=game.t;game=null;act("cheer");return say("Yes! "+g+" in "+k+" tries.")}setEx(g<game.n?"curious":"thinking",2);return say(g<game.n?"Higher!":"Lower!")}
 setEx("curious",2);say(pk(["Not sure about that. Type “help”.","You can teach me: teach X => Y"]))}
$("f").onsubmit=function(e){e.preventDefault();handle($("in").value);$("in").value=""};
document.querySelectorAll("[data-c]").forEach(function(b){b.onclick=function(){handle(b.dataset.c)}});
document.querySelectorAll("[data-v]").forEach(function(b){b.onclick=function(){focusView(b.dataset.v)}});
$("info").onclick=function(){$("cr").hidden=!$("cr").hidden};$("hu").onclick=function(){document.body.classList.toggle("embed");size()};
ctl.addEventListener("start",function(){FA2=null});ren.domElement.addEventListener("dblclick",function(){focusView("full",[0,.08,1])});
})();
