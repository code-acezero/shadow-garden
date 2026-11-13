/**
 * Unified Anime Character & Vampire Companion Engine
 * Complete Inverse Kinematics, Secondary Spring Physics, Gestures, Dances, Expressions, Locomotion
 */
(function() {
  var T = THREE;
  var $ = function(id) { return document.getElementById(id); };
  var stage = $('stage') || document.body;

  // --- WebGL Renderer & Scene ---
  var canvas = $('c');
  var ren = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  ren.outputEncoding = T.sRGBEncoding;
  ren.toneMapping = T.ACESFilmicToneMapping;
  ren.toneMappingExposure = 1.05;
  ren.shadowMap.enabled = true;
  ren.shadowMap.type = T.PCFSoftShadowMap;

  var scene = new T.Scene();
  scene.background = new T.Color(0x07050e);

  var cam = new T.PerspectiveCamera(32, 1, 0.05, 50);
  cam.position.set(0, 1.25, 2.6);

  var ctl = new T.OrbitControls(cam, ren.domElement);
  ctl.enableDamping = true;
  ctl.dampingFactor = 0.08;
  ctl.target.set(0, 1.15, 0);
  ctl.maxDistance = 6.0;
  ctl.minDistance = 0.35;
  ctl.maxPolarAngle = Math.PI * 0.52;

  function size() {
    var w = stage.clientWidth || window.innerWidth;
    var h = stage.clientHeight || window.innerHeight;
    ren.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(stage);
  window.addEventListener('resize', size);
  size();

  // --- Lighting: Anime Studio 5-Point Chiaroscuro Rig ---
  var headTarget = new T.Object3D();
  headTarget.position.set(0, 1.35, 0);
  scene.add(headTarget);

  var hemiLight = new T.HemisphereLight(0x56486c, 0x38222a, 0.85);
  scene.add(hemiLight);

  var keyLight = new T.DirectionalLight(0xfff8f2, 1.30);
  keyLight.position.set(0.85, 1.68, 1.60);
  keyLight.target = headTarget;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 8.0;
  keyLight.shadow.camera.left = -0.9;
  keyLight.shadow.camera.right = 0.9;
  keyLight.shadow.camera.top = 1.9;
  keyLight.shadow.camera.bottom = -0.1;
  keyLight.shadow.bias = -0.00010;
  keyLight.shadow.normalBias = 0.008;
  keyLight.shadow.radius = 2.2;
  scene.add(keyLight);

  var faceFill = new T.DirectionalLight(0xfff4ee, 0.35);
  faceFill.position.set(0, 1.45, 1.80);
  faceFill.target = headTarget;
  scene.add(faceFill);

  var fillLight = new T.DirectionalLight(0xffd1dc, 0.48);
  fillLight.position.set(-1.10, 1.25, 1.20);
  fillLight.target = headTarget;
  scene.add(fillLight);

  var rimLight = new T.DirectionalLight(0xe9d5ff, 1.75);
  rimLight.position.set(0, 2.10, -1.80);
  rimLight.target = headTarget;
  scene.add(rimLight);

  // --- Reflective Obsidian Stage Dais ---
  var floorGeo = new T.CircleGeometry(3.8, 64);
  var floorCanvas = document.createElement('canvas');
  floorCanvas.width = floorCanvas.height = 1024;
  var fctx = floorCanvas.getContext('2d');
  fctx.fillStyle = '#080611';
  fctx.fillRect(0, 0, 1024, 1024);
  fctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
  fctx.lineWidth = 3;
  fctx.beginPath(); fctx.arc(512, 512, 470, 0, Math.PI * 2); fctx.stroke();
  fctx.beginPath(); fctx.arc(512, 512, 450, 0, Math.PI * 2); fctx.stroke();
  fctx.strokeStyle = 'rgba(225, 29, 72, 0.28)';
  fctx.lineWidth = 2;
  fctx.beginPath(); fctx.arc(512, 512, 380, 0, Math.PI * 2); fctx.stroke();
  fctx.beginPath(); fctx.arc(512, 512, 260, 0, Math.PI * 2); fctx.stroke();
  var floorTex = new T.CanvasTexture(floorCanvas);
  var floorMat = new T.MeshStandardMaterial({
    map: floorTex,
    color: 0x141022,
    roughness: 0.28,
    metalness: 0.60
  });
  var floorMesh = new T.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI * 0.5;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // --- Catalogs & Rigs from Standalone Companion ---
  var N={},bones=[],rest={},hairMats=[],model=null,hipsRest=null,head=null,skinMesh=null,F={},mx=0,my=0,S={},ops=[];
  var Q=new T.Quaternion(),Qi=new T.Quaternion(),DQ=new T.Quaternion(),v1=new T.Vector3(),v2=new T.Vector3(),E3=new T.Euler(0,0,0,'YXZ');
  var now=function(){return performance.now()/1000},pk=function(a){return a[Math.floor(Math.random()*a.length)]};
  var currentModelKey = 'seraphina';

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



  // --- Secondary Springs Configuration ---
  var SPR=[],GRAV=1,WIND=.3,wv=new T.Vector3(),sh=new T.Vector3(),sd=new T.Vector3(),sn2=new T.Vector3(),sv=new T.Vector3();
  var SECRX=/^(Hair_|Skirt_|Wing|Tail|Front_Ribon|Hand_Ribon|J_Sec_|J_Opt_)/;
  function sgrp(k){
    if(/Skirt|CoatSkirt/i.test(k))return 'skirt';
    if(/Hair/i.test(k))return 'hair';
    if(/Wing/i.test(k))return 'wing';
    if(/Tail/i.test(k))return 'tail';
    if(/CatEar/i.test(k))return 'ear';
    if(/Bust/i.test(k))return 'bust';
    return 'rib';
  }
  var GP={
    skirt:{s:1.1,d:.35,g:.25,h:.014},
    hair:{s:.75,d:.28,g:.38,h:.008},
    wing:{s:1.8,d:.55,g:.08,h:0},
    tail:{s:.5,d:.2,g:.2,h:.01},
    ear:{s:1.4,d:.4,g:.05,h:0},
    bust:{s:1.2,d:.35,g:.2,h:0},
    rib:{s:.65,d:.3,g:.25,h:.005}
  };

  function buildSprings(){
    SPR.length=0;
    if(!model)return;
    model.updateMatrixWorld(true);
    Object.keys(N).forEach(function(k){
      if(!SECRX.test(k))return;
      var b=N[k];if(!b)return;
      var wp=new T.Vector3(),t0=new T.Vector3(),wq=new T.Quaternion();
      b.getWorldPosition(wp);b.getWorldQuaternion(wq);
      var len=0.08,ld=new T.Vector3(0,-1,0);
      var c=b.children.find(function(x){return x.isBone;});
      if(c){c.getWorldPosition(t0);len=Math.max(0.02,wp.distanceTo(t0));ld=c.position.clone().normalize();}
      var gp=sgrp(k);
      SPR.push({b:b,len:len,ld:ld,gp:gp,p:GP[gp]||GP.rib,col:[],init:false});
    });
    SPR.sort(function(a,b){return (a.b.userData.i||0)-(b.b.userData.i||0);});
  }

  function springs(dt,t){
    if(!SPR.length)return;
    dt=Math.min(dt,0.033);if(dt<=0)return;
    wv.set(sn(t*.7)*.5+sn(t*2.3)*.25,0,sn(t*.9+1)*.3).multiplyScalar(WIND);
    SPR.forEach(function(s){
      var b=s.b,p=s.p;b.updateWorldMatrix(true,false);
      b.getWorldPosition(sh);b.getWorldQuaternion(Q);
      sd.copy(s.ld).applyQuaternion(Q);
      if(!s.init){s.cur=sh.clone().addScaledVector(sd,s.len);s.prev=s.cur.clone();s.init=true;}
      var nt=sn2.copy(s.cur).sub(s.prev).multiplyScalar(1-p.d).add(s.cur).addScaledVector(sd,p.s*dt);
      nt.y-=p.g*GRAV*dt;nt.addScaledVector(wv,p.g*dt);
      nt.sub(sh).setLength(s.len).add(sh);
      s.prev.copy(s.cur);s.cur.copy(nt);
      sv.copy(nt).sub(sh).normalize();
      DQ.setFromUnitVectors(sd,sv);apply(b,DQ);
      b.updateMatrixWorld(true);
    });
  }

  // --- Real Blinking & Facial Deformations ---
  var nextBlink=now()+2,blinkS=-1,dbl=false;
  function faceUpdate(t,dt){
    if(t>nextBlink){
      blinkS=t;
      if(Math.random()<0.25&&!dbl){dbl=true;nextBlink=t+0.3;}
      else{dbl=false;nextBlink=t+2.5+Math.random()*3.5;}
    }
    var bt=t-blinkS;
    var ba=bt<0.045?bt/0.045:bt<0.13?1-(bt-0.045)/0.085:0;
    var blinkAmount=Math.max(ES.lid[0]||0,ba);

    if(window._seraphinaMeshLash&&window._seraphinaMeshLash.userData.origPositions){
      var pos=window._seraphinaMeshLash.geometry.attributes.position;
      var orig=window._seraphinaMeshLash.userData.origPositions;
      for(var i=0;i<pos.count;i++){
        pos.array[i*3+1]=orig[i*3+1]-blinkAmount*0.026;
      }
      pos.needsUpdate=true;
    }
    if(window._seraphinaMeshMouth&&window._seraphinaMeshMouth.userData.origPositions){
      var posM=window._seraphinaMeshMouth.geometry.attributes.position;
      var origM=window._seraphinaMeshMouth.userData.origPositions;
      var smk=ES.sk||0,sml=ES.sm||0;
      for(var j=0;j<posM.count;j++){
        var ox=origM[j*3],oy=origM[j*3+1];
        var lift=(ox>0?smk*0.006:0)+sml*0.004;
        posM.array[j*3+1]=oy+lift;
      }
      posM.needsUpdate=true;
    }
  }

  // --- Director: Idle Life Autonomy ---
  function director(n){
    if(!idleOn||loco||curG||dance||n-lastAct<4||n<nextIdle)return;
    nextIdle=n+6+Math.random()*7;
    var r=Math.random();
    if(r<0.45){
      var gestKeys=["wave","arms_cross","stretch","tuck_hair","sway","hands_behind","shy_pose","think","tease_pose"];
      var chosen=pk(gestKeys);
      if(G[chosen])act(chosen);
    }else if(r<0.85){
      var microMoods=["happy","curious","smug","tease","wink_left","wink_right"];
      setEx(pk(microMoods),1.5+Math.random());
    }
  }

  // --- Universal Bone Mapper ---
  function mapBone(name,o){
    var cleanName=name.replace(/_\d+$/,"");
    N[cleanName]=o;
    N[name]=o;

    if(/Hips/i.test(name))N.Hips=o;
    else if(/Spine/i.test(name))N.Spine=o;
    else if(/UpperChest/i.test(name))N.UpperChest=o;
    else if(/Chest/i.test(name))N.Chest=o;
    else if(/Neck/i.test(name))N.Neck=o;
    else if(/Head/i.test(name))N.Head=o;

    else if(/L.*Shoulder|Left_shoulder/i.test(name))N.Left_shoulder=o;
    else if(/R.*Shoulder|Right_shoulder/i.test(name))N.Right_shoulder=o;
    else if(/L.*UpperArm|Left_arm/i.test(name))N.Left_arm=o;
    else if(/R.*UpperArm|Right_arm/i.test(name))N.Right_arm=o;
    else if(/L.*LowerArm|Left_elbow/i.test(name))N.Left_elbow=o;
    else if(/R.*LowerArm|Right_elbow/i.test(name))N.Right_elbow=o;
    else if(/L.*Hand|Left_wrist/i.test(name))N.Left_wrist=o;
    else if(/R.*Hand|Right_wrist/i.test(name))N.Right_wrist=o;

    else if(/L.*UpperLeg|Left_leg/i.test(name))N.Left_leg=o;
    else if(/R.*UpperLeg|Right_leg/i.test(name))N.Right_leg=o;
    else if(/L.*LowerLeg|Left_knee/i.test(name))N.Left_knee=o;
    else if(/R.*LowerLeg|Right_knee/i.test(name))N.Right_knee=o;
    else if(/L.*Foot|Left_ankle/i.test(name))N.Left_ankle=o;
    else if(/R.*Foot|Right_ankle/i.test(name))N.Right_ankle=o;
    else if(/L.*Toe/i.test(name))N.Left_toe=o;
    else if(/R.*Toe/i.test(name))N.Right_toe=o;

    else if(/Eye.*L|FaceEye.*L/i.test(name))N.Eye_L=o;
    else if(/Eye.*R|FaceEye.*R/i.test(name))N.Eye_R=o;

    var fNames=['Index','Middle','Ring','Little','Thumb'];
    for(var f=0;f<fNames.length;f++){
      var fn=fNames[f];
      for(var num=1;num<=3;num++){
        if(name.includes('L_'+fn+num)||name.includes('L_'+fn+'_'+num)||name.includes(fn+num+'_L')){
          N[fn+'Finger'+num+'_L']=o;
        }
        if(name.includes('R_'+fn+num)||name.includes('R_'+fn+'_'+num)||name.includes(fn+num+'_R')){
          N[fn+'Finger'+num+'_R']=o;
        }
      }
    }
  }

  function loadModel(modelPath,isCompanion){
    if(model)scene.remove(model);
    N={};bones=[];rest={};S={};ops=[];

    var loader=new T.GLTFLoader();
    loader.load(modelPath,function(g){
      model=g.scene;
      scene.add(model);

      if(!isCompanion){
        model.rotation.y=Math.PI; // Seraphina faces front
      }

      model.traverse(function(o){
        if(o.isMesh){
          o.frustumCulled=false;
          o.castShadow=true;
          o.receiveShadow=true;

          if(o.material){
            o.material.emissiveMap=null;
            if(/skin|face|body/i.test(o.material.name)){
              o.material.roughness=0.68;
              o.material.emissive=new T.Color(0x32161c);
              o.material.emissiveIntensity=0.20;
            }else if(/hair/i.test(o.material.name)){
              o.material.roughness=0.46;
            }
          }

          if(o.name==='Object_20'){
            window._seraphinaMeshMouth=o;
            o.userData.origPositions=new Float32Array(o.geometry.attributes.position.array);
          }else if(o.name==='Object_22'||o.name==='Object_26'){
            window._seraphinaMeshLash=o;
            o.userData.origPositions=new Float32Array(o.geometry.attributes.position.array);
          }else if(o.name==='Object_25'){
            window._seraphinaMeshBrow=o;
            o.userData.origPositions=new Float32Array(o.geometry.attributes.position.array);
          }
        }

        if(o.isBone){
          o.userData.i=bones.length;
          bones.push(o);
          mapBone(o.name,o);
          rest[o.uuid]=o.quaternion.clone();
        }
      });

      if(N.Hips)hipsRest=N.Hips.position.clone();
      head=N.Head;

      try{buildBody();}catch(e){console.warn('buildBody',e);}
      try{buildSprings();}catch(e){console.warn('buildSprings',e);}

      var tag=$('model-tag');
      if(tag)tag.textContent=isCompanion?"Model: Vampire Companion":"Model: Seraphina Vampire Queen";
      setEx("happy",3);
      act("wave");
    });
  }

  // --- Camera Views ---
  var VIEWS={
    full:{t:[0,1.15,0],d:2.6},
    face:{t:[0,1.45,0],d:0.75},
    hands:{t:[0,1.0,0],d:1.2},
    legs:{t:[0,0.45,0],d:1.6}
  };
  var FA=null;
  function focusView(name){
    var v=VIEWS[name];if(!v)return;
    var tg=new T.Vector3().fromArray(v.t);
    var dir=new T.Vector3(0,0.05,1).normalize();
    FA={t0:now(),dur:0.75,ft:ctl.target.clone(),fp:cam.position.clone(),tt:tg,tp:tg.clone().addScaledVector(dir,v.d)};
  }
  function focusTick(){
    if(!FA)return;
    var u=Math.min(1,(now()-FA.t0)/FA.dur);
    var e=u*u*(3-2*u);
    ctl.target.lerpVectors(FA.ft,FA.tt,e);
    cam.position.lerpVectors(FA.fp,FA.tp,e);
    if(u>=1)FA=null;
  }

  // --- Animation Tick ---
  var clk=new T.Clock();
  function tick(){
    requestAnimationFrame(tick);
    var dt=Math.min(clk.getDelta(),0.05);
    var t=clk.elapsedTime;
    focusTick();
    ctl.update();
    if(model){
      try{pose(t,dt);}catch(e){}
      try{springs(dt,t);}catch(e){}
      try{faceUpdate(t,dt);}catch(e){}
      director(now());
    }
    ren.render(scene,cam);
  }
  tick();

  // --- Pointer Move ---
  window.addEventListener('pointermove',function(e){
    var r=stage.getBoundingClientRect();
    mx=((e.clientX-r.left)/r.width)*2-1;
    my=-(((e.clientY-r.top)/r.height)*2-1);
  });

  // --- UI Controls ---
  var selG=$('sel-all-gestures');
  if(selG){
    Object.keys(G).sort().forEach(function(k){
      var opt=document.createElement('option');
      opt.value=k;
      opt.textContent=k.replace(/_/g,' ');
      selG.appendChild(opt);
    });
    selG.addEventListener('change',function(){
      if(this.value){act(this.value);this.value='';}
    });
  }

  var selD=$('sel-all-dances');
  if(selD){
    Object.keys(DANCE).sort().forEach(function(k){
      var opt=document.createElement('option');
      opt.value=k;
      opt.textContent=k.replace(/_/g,' ');
      selD.appendChild(opt);
    });
    selD.addEventListener('change',function(){
      if(this.value){startDance(this.value);this.value='';}
    });
  }

  var selE=$('sel-all-expr');
  if(selE){
    Object.keys(EXPR).sort().forEach(function(k){
      var opt=document.createElement('option');
      opt.value=k;
      opt.textContent=k.replace(/_/g,' ');
      selE.appendChild(opt);
    });
    selE.addEventListener('change',function(){
      if(this.value){setEx(this.value,6);this.value='';}
    });
  }

  document.querySelectorAll('[data-g]').forEach(function(b){
    b.addEventListener('click',function(){act(this.dataset.g);});
  });
  document.querySelectorAll('[data-d]').forEach(function(b){
    b.addEventListener('click',function(){startDance(this.dataset.d);});
  });
  document.querySelectorAll('[data-ex]').forEach(function(b){
    b.addEventListener('click',function(){setEx(this.dataset.ex,5);});
  });
  document.querySelectorAll('[data-loco]').forEach(function(b){
    b.addEventListener('click',function(){startLoco(this.dataset.loco);});
  });

  var stopBtn=$('btn-stop-all');
  if(stopBtn){
    stopBtn.addEventListener('click',function(){
      curG=null;dance=null;loco=null;setEx('neutral',3);
      if(model){model.position.set(0,0,0);model.rotation.y=(currentModelKey==='seraphina'?Math.PI:0);}
      var bubble=$('bubble');
      if(bubble)bubble.textContent="Seraphina: Standing relaxed in royal idle poise.";
    });
  }

  var btnFace=$('btn-view-face');
  if(btnFace)btnFace.addEventListener('click',function(){focusView('face');});
  var btnFull=$('btn-view-full');
  if(btnFull)btnFull.addEventListener('click',function(){focusView('full');});
  var btnHands=$('btn-view-hands');
  if(btnHands)btnHands.addEventListener('click',function(){focusView('hands');});

  var btnIdle=$('btn-idle-life');
  if(btnIdle){
    btnIdle.addEventListener('click',function(){
      idleOn=!idleOn;
      this.textContent="Idle Life: "+(idleOn?"ON":"OFF");
      this.classList.toggle('active',idleOn);
    });
  }

  var btnSwitch=$('btn-switch-model');
  if(btnSwitch){
    btnSwitch.addEventListener('click',function(){
      if(currentModelKey==='seraphina'){
        currentModelKey='companion';
        loadModel('/models/companion.glb',true);
      }else{
        currentModelKey='seraphina';
        loadModel('/models/seraphina.glb',false);
      }
    });
  }

  // Load Seraphina
  loadModel('/models/seraphina.glb',false);

  window.Companion={
    act:act,
    dance:startDance,
    loco:startLoco,
    setEx:setEx,
    focusView:focusView,
    loadModel:loadModel
  };
})();
