const fs = require('fs');

const raw = fs.readFileSync('scripts/anime-companion-engine.js', 'utf8');

const dStart = raw.indexOf('var D={lid:');
const dEnd = raw.indexOf('/* ===== body colliders');
const catalogsBlock = raw.slice(dStart, dEnd);

const fullEngine = `/**
 * Seraphina Nocturne & Anime Princess Unified 3D Lab Engine
 * Multi-Model Support: Princess Anime Girl, Seraphina Vampire Queen, Anime Vampire Companion
 * Complete Kinematics Rig, Secondary Springs, 45+ Gestures, 20+ Dances, 35+ Expressions, Locomotion
 */
(function() {
  var T = THREE;
  window.THREE = THREE;
  var $ = function(id) { return document.getElementById(id); };
  var stage = $('canvas-container') || $('stage') || document.body;

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

  var cam = new T.PerspectiveCamera(30, 1, 0.05, 50);
  cam.position.set(0, 1.25, 2.7);

  var ctl = new T.OrbitControls(cam, ren.domElement);
  ctl.enableDamping = true;
  ctl.dampingFactor = 0.08;
  ctl.target.set(0, 1.15, 0);
  ctl.maxDistance = 6.0;
  ctl.minDistance = 0.35;
  ctl.maxPolarAngle = Math.PI * 0.52;

  function resizeViewport() {
    var w = stage.clientWidth || window.innerWidth;
    var h = stage.clientHeight || window.innerHeight;
    ren.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(resizeViewport).observe(stage);
  window.addEventListener('resize', resizeViewport);
  resizeViewport();

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
  var currentModelKey = 'princess'; // 'princess' | 'seraphina' | 'companion'

  ` + catalogsBlock + `

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

    if(window._currentMeshLash&&window._currentMeshLash.userData.origPositions){
      var pos=window._currentMeshLash.geometry.attributes.position;
      var orig=window._currentMeshLash.userData.origPositions;
      for(var i=0;i<pos.count;i++){
        pos.array[i*3+1]=orig[i*3+1]-blinkAmount*0.026;
      }
      pos.needsUpdate=true;
    }
    if(window._currentMeshMouth&&window._currentMeshMouth.userData.origPositions){
      var posM=window._currentMeshMouth.geometry.attributes.position;
      var origM=window._currentMeshMouth.userData.origPositions;
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
    var cleanName=name.replace(/_\\d+$/,"");
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

  function loadModel(modelPath,modelKey){
    currentModelKey = modelKey;
    if(model)scene.remove(model);
    N={};bones=[];rest={};S={};ops=[];
    window._currentMeshLash = null;
    window._currentMeshMouth = null;
    window._currentMeshBrow = null;

    var loader=new T.GLTFLoader();
    loader.load(modelPath,function(g){
      model=g.scene;
      scene.add(model);

      if(modelKey !== 'companion'){
        model.rotation.y=Math.PI; // Seraphina & Princess face front
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

          if(o.name==='Object_20'||/FaceMouth/i.test(o.name)){
            window._currentMeshMouth=o;
            o.userData.origPositions=new Float32Array(o.geometry.attributes.position.array);
          }else if(o.name==='Object_22'||o.name==='Object_26'||/FaceEyeline|Eyelash/i.test(o.name)){
            window._currentMeshLash=o;
            o.userData.origPositions=new Float32Array(o.geometry.attributes.position.array);
          }else if(o.name==='Object_25'||/FaceBrow/i.test(o.name)){
            window._currentMeshBrow=o;
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

      var displayName = modelKey === 'princess' ? "Princess Anime Girl" : (modelKey === 'seraphina' ? "Seraphina Vampire Queen" : "Vampire Companion");
      var tag=$('cur-model-label');
      if(tag)tag.textContent=displayName;
      var bubble=$('bubble');
      if(bubble)bubble.textContent=displayName + " loaded with complete fluid living rigs & physics!";
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

  // --- UI Controls Integration ---
  function initUI() {
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
        if(model){model.position.set(0,0,0);model.rotation.y=(currentModelKey==='companion'?0:Math.PI);}
        var bubble=$('bubble');
        if(bubble)bubble.textContent="Standing relaxed in fluid living idle poise.";
      });
    }

    var btnFace=$('btn-view-face');
    if(btnFace)btnFace.addEventListener('click',function(){focusView('face');});
    var btnFull=$('btn-view-full');
    if(btnFull)btnFull.addEventListener('click',function(){focusView('full');});
    var btnHands=$('btn-view-hands');
    if(btnHands)btnHands.addEventListener('click',function(){focusView('hands');});
    var btnLegs=$('btn-view-legs');
    if(btnLegs)btnLegs.addEventListener('click',function(){focusView('legs');});

    var btnIdle=$('btn-idle-life');
    if(btnIdle){
      btnIdle.addEventListener('click',function(){
        idleOn=!idleOn;
        this.textContent="Idle Life: "+(idleOn?"ON":"OFF");
        this.classList.toggle('active',idleOn);
      });
    }

    // Model Selector Buttons
    document.querySelectorAll('[data-model]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('[data-model]').forEach(function(b){ b.classList.remove('active'); });
        this.classList.add('active');
        var mKey = this.dataset.model;
        if (mKey === 'princess') loadModel('/models/princess.glb', 'princess');
        else if (mKey === 'seraphina') loadModel('/models/seraphina.glb', 'seraphina');
        else if (mKey === 'companion') loadModel('/models/companion.glb', 'companion');
      });
    });

    // Gravity & Wind Sliders
    var sGrav = $('slider-gravity');
    if (sGrav) {
      sGrav.addEventListener('input', function() {
        GRAV = parseFloat(this.value);
        var lbl = $('val-gravity'); if (lbl) lbl.textContent = GRAV.toFixed(1);
      });
    }
    var sWind = $('slider-wind');
    if (sWind) {
      sWind.addEventListener('input', function() {
        WIND = parseFloat(this.value);
        var lbl = $('val-wind'); if (lbl) lbl.textContent = WIND.toFixed(1);
      });
    }

    // Layout Switcher (Toggle panel dock: Right vs Left)
    var btnLayout = $('btn-toggle-layout');
    var appContainer = $('app-layout');
    if (btnLayout && appContainer) {
      btnLayout.addEventListener('click', function() {
        var isLeft = appContainer.classList.toggle('layout-panel-left');
        btnLayout.textContent = isLeft ? "Panel: Left" : "Panel: Right";
        resizeViewport();
      });
    }
  }

  // Load Princess Model Initially
  loadModel('/models/princess.glb', 'princess');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

  window.Companion = {
    act: act,
    dance: startDance,
    loco: startLoco,
    setEx: setEx,
    focusView: focusView,
    loadModel: loadModel
  };
})();
`;

fs.writeFileSync('public/experiments/seraphina-engine.js', fullEngine, 'utf8');
console.log('Saved public/experiments/seraphina-engine.js! Length:', fullEngine.length);
