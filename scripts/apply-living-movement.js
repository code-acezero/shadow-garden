const fs = require('fs');

const filePath = 'public/experiments/seraphina-engine.js';
let code = fs.readFileSync(filePath, 'utf8');

// Replace evaluateProceduralPose with the verified bone coordinate axes
const poseRegex = /\/\/ --- Organic Procedural Skeletal Poses with Fluid Human Dynamics ---[\s\S]*?return targetPose;\s*\}/;

const newPoseMethod = `// --- Organic Procedural Skeletal Poses with Fluid Human Dynamics ---
  evaluateProceduralPose(motionId, t) {
    const targetPose = new Map();
    for (const [name, rest] of this.restTransforms.entries()) {
      targetPose.set(name, {
        position: rest.position.clone(),
        quaternion: rest.quaternion.clone()
      });
    }

    const setQ = (bName, eulerX, eulerY, eulerZ) => {
      const rest = this.restTransforms.get(bName);
      if (!rest) return;
      const q = rest.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(eulerX, eulerY, eulerZ, 'XYZ')));
      targetPose.set(bName, { position: rest.position.clone(), quaternion: q });
    };

    const addPos = (bName, dx, dy, dz) => {
      const rest = this.restTransforms.get(bName);
      if (!rest) return;
      const p = rest.position.clone().add(new THREE.Vector3(dx, dy, dz));
      const entry = targetPose.get(bName) || { quaternion: rest.quaternion.clone() };
      entry.position = p;
      targetPose.set(bName, entry);
    };

    // --- WHOLE-BODY ORGANIC LIVING IDLE SYSTEM ---
    // Smooth 3.8s respiratory cycle with diaphragm & chest expansion
    const breathRate = 1.65;
    const breathSin = Math.sin(t * breathRate);
    const breathTorso = breathSin * 0.028;

    // Slow, natural weight shift between hips (Lissajous figure-8 curve)
    const swayRate = 0.45;
    const hipShift = Math.sin(t * swayRate) * 0.045;
    const hipSwayZ = Math.cos(t * swayRate * 0.5) * 0.020;

    // Continuous alive pelvis drift
    addPos('J_Bip_C_Hips_200', hipShift * 0.008, breathSin * 0.003, hipSwayZ * 0.005);

    // Subtle rhythmic shoulder breathing expansion
    setQ('J_Bip_L_Shoulder_115', 0, 0, breathSin * 0.020 - hipShift * 0.12);
    setQ('J_Bip_R_Shoulder_142', 0, 0, -breathSin * 0.020 - hipShift * 0.12);

    // Default expression reset
    this.targetExpr.browArchL = 0;
    this.targetExpr.browArchR = 0;
    this.targetExpr.browFurrow = 0;
    this.targetExpr.browTilt = 0;
    this.targetExpr.mouthSmile = 0;
    this.targetExpr.mouthSmirk = 0;
    this.targetExpr.mouthOpen = 0;
    this.targetExpr.mouthPout = 0;
    this.targetExpr.eyeSquint = 0;
    this.targetExpr.winkL = 0;
    this.targetExpr.winkR = 0;

    switch (motionId) {
      case 'queen_idle': {
        // --- VAMPIRE QUEEN REGAL CONTRAPPOSTO STANCE ---
        // Cocked hips, graceful spine S-curve, relaxed arms along body, confident head poise
        setQ('J_Bip_C_Hips_200', 0, hipShift * 0.6, -0.05 - hipShift * 0.25);
        setQ('J_Bip_C_Spine_145', breathTorso * 0.4, -hipShift * 0.4, 0.035 + hipShift * 0.18);
        setQ('J_Bip_C_Chest_144', breathTorso * 0.8, 0, 0.015);
        setQ('J_Bip_C_UpperChest_143', breathTorso * 0.6, 0, 0);
        setQ('J_Bip_C_Neck_88', -breathTorso * 0.25, hipShift * 0.35, -0.015);

        // Left Arm: Gracefully draped down along left thigh with loose, relaxed fingers
        const lBreathe = breathSin * 0.012;
        setQ('J_Bip_L_UpperArm_114', -1.35, 0.05, -0.10 + lBreathe);
        setQ('J_Bip_L_LowerArm_113', -0.15, 0.05, -0.22);
        setQ('J_Bip_L_Hand_112', 0.08, 0, -0.12);
        // Relaxed natural finger cascade (not flat sticks)
        setQ('J_Bip_L_Index1_95', -0.18, 0, 0);
        setQ('J_Bip_L_Middle1_101', -0.28, 0, 0);
        setQ('J_Bip_L_Ring1_104', -0.38, 0, 0);
        setQ('J_Bip_L_Little1_98', -0.48, 0, 0);
        setQ('J_Bip_L_Thumb1_107', -0.12, 0, 0);

        // Right Arm: Hand resting regally on cocked right hip
        setQ('J_Bip_R_UpperArm_141', -1.15, -0.25, -0.22);
        setQ('J_Bip_R_LowerArm_140', -0.42, 0.15, 0.95);
        setQ('J_Bip_R_Hand_139', -0.15, 0, 0.20);
        setQ('J_Bip_R_Index1_122', -0.15, 0, 0);
        setQ('J_Bip_R_Middle1_128', -0.24, 0, 0);
        setQ('J_Bip_R_Ring1_131', -0.32, 0, 0);
        setQ('J_Bip_R_Little1_125', -0.40, 0, 0);

        // Stance: Weight firm on left leg, right knee bent softly forward
        setQ('J_Bip_L_UpperLeg_172', -0.02, 0.04, 0.05);
        setQ('J_Bip_L_LowerLeg_171', 0.04, 0, 0);
        setQ('J_Bip_R_UpperLeg_199', 0.14, -0.05, -0.06);
        setQ('J_Bip_R_LowerLeg_198', -0.16, 0, 0);

        // Expression: Aristocratic subtle smirk & half-lidded sultry gaze
        this.targetExpr.browArchR = 0.08;
        this.targetExpr.browArchL = 0.03;
        this.targetExpr.mouthSmirk = 0.08;
        this.targetExpr.eyeSquint = 0.14;
        break;
      }

      case 'smug_crossed': {
        // --- SMUG ARMS CROSSED OVER CHEST ---
        setQ('J_Bip_C_Hips_200', -0.04, 0.10, -0.04);
        setQ('J_Bip_C_Spine_145', breathTorso * 0.4, -0.06, 0.025);
        setQ('J_Bip_C_Chest_144', 0.08 + breathTorso * 0.7, 0, 0);
        setQ('J_Bip_C_Neck_88', -0.04, 0.10, 0.04);

        // Left arm crossed horizontally over right arm
        setQ('J_Bip_L_UpperArm_114', -0.85, 0.45, -0.65);
        setQ('J_Bip_L_LowerArm_113', -0.35, 0.20, -1.35);
        setQ('J_Bip_L_Hand_112', -0.15, 0.12, -0.12);
        setQ('J_Bip_L_Index1_95', -0.22, 0, 0);
        setQ('J_Bip_L_Middle1_101', -0.32, 0, 0);

        // Right arm folded under left arm
        setQ('J_Bip_R_UpperArm_141', -0.85, -0.45, 0.65);
        setQ('J_Bip_R_LowerArm_140', -0.35, -0.20, 1.35);
        setQ('J_Bip_R_Hand_139', -0.15, -0.12, 0.12);
        setQ('J_Bip_R_Index1_122', -0.22, 0, 0);
        setQ('J_Bip_R_Middle1_128', -0.32, 0, 0);

        // Stance: Weight leaning slightly back, feet stable
        setQ('J_Bip_L_UpperLeg_172', 0.05, 0.03, 0.03);
        setQ('J_Bip_R_UpperLeg_199', 0.03, -0.03, -0.03);

        // Expression: Signature anime smug smirk with one raised eyebrow!
        this.targetExpr.browArchR = 0.16;
        this.targetExpr.browArchL = -0.02;
        this.targetExpr.mouthSmirk = 0.18;
        this.targetExpr.eyeSquint = 0.18;
        break;
      }

      case 'kneel_command': {
        // --- COMMAND: KNEEL BEFORE ME ---
        setQ('J_Bip_C_Chest_144', 0.14 + breathTorso, -0.10, 0);
        setQ('J_Bip_C_Neck_88', -0.08, 0.08, 0);

        // Right arm extended forward-down pointing directly at user!
        setQ('J_Bip_R_UpperArm_141', -0.45, -0.10, 0.25);
        setQ('J_Bip_R_LowerArm_140', 0, 0, 0.15);
        setQ('J_Bip_R_Hand_139', 0.20, 0, 0.10);
        // Pointing index finger, other fingers tightly curled in fist
        setQ('J_Bip_R_Index1_122', 0.05, 0, 0);
        setQ('J_Bip_R_Middle1_128', -0.85, 0, 0);
        setQ('J_Bip_R_Ring1_131', -0.92, 0, 0);
        setQ('J_Bip_R_Little1_125', -0.98, 0, 0);
        setQ('J_Bip_R_Thumb1_134', -0.45, 0, 0);

        // Left hand placed firmly on left hip
        setQ('J_Bip_L_UpperArm_114', -1.15, 0.25, 0.22);
        setQ('J_Bip_L_LowerArm_113', -0.42, -0.15, -0.95);
        setQ('J_Bip_L_Hand_112', -0.15, 0, -0.20);

        // Expression: Sharp, imperious brow furrow & parted lips showing fangs
        this.targetExpr.browFurrow = 0.12;
        this.targetExpr.browArchL = -0.04;
        this.targetExpr.browArchR = -0.04;
        this.targetExpr.mouthOpen = 0.10;
        this.targetExpr.eyeSquint = -0.05; // wide, domineering glare
        break;
      }

      case 'nyaa_paws': {
        // --- NYAA~ CAT PAW DANCE ---
        const pawBounce = Math.abs(Math.sin(t * 4.5)) * 0.035;
        const pawAlt = Math.sin(t * 4.5);
        addPos('J_Bip_C_Hips_200', 0, pawBounce * 0.015, 0);
        setQ('J_Bip_C_Hips_200', 0, pawAlt * 0.05, pawAlt * 0.035);
        setQ('J_Bip_C_Spine_145', -0.03, -pawAlt * 0.03, 0);
        setQ('J_Bip_C_Chest_144', 0.05, 0, 0);
        setQ('J_Bip_C_Neck_88', 0.03, 0, pawAlt * 0.045);

        // Both arms bent up with cute cat paws beside cheeks!
        setQ('J_Bip_L_UpperArm_114', -0.45 + pawAlt * 0.08, 0.25, -0.35);
        setQ('J_Bip_L_LowerArm_113', -0.25, 0, -1.55);
        setQ('J_Bip_L_Hand_112', 0.45, 0, 0);
        // Soft curled cat fingers
        setQ('J_Bip_L_Index1_95', -0.55, 0, 0);
        setQ('J_Bip_L_Middle1_101', -0.65, 0, 0);
        setQ('J_Bip_L_Ring1_104', -0.75, 0, 0);
        setQ('J_Bip_L_Little1_98', -0.85, 0, 0);

        setQ('J_Bip_R_UpperArm_141', -0.45 - pawAlt * 0.08, -0.25, 0.35);
        setQ('J_Bip_R_LowerArm_140', -0.25, 0, 1.55);
        setQ('J_Bip_R_Hand_139', 0.45, 0, 0);
        setQ('J_Bip_R_Index1_122', -0.55, 0, 0);
        setQ('J_Bip_R_Middle1_128', -0.65, 0, 0);
        setQ('J_Bip_R_Ring1_131', -0.75, 0, 0);
        setQ('J_Bip_R_Little1_125', -0.85, 0, 0);

        // Expression: Cute cat smile ":3" and sparkling eyes!
        this.targetExpr.browArchL = 0.06;
        this.targetExpr.browArchR = 0.06;
        this.targetExpr.browTilt = 0.08;
        this.targetExpr.mouthSmile = 0.20;
        this.targetExpr.mouthOpen = 0.06;
        break;
      }

      case 'double_peace': {
        // --- IDOL DOUBLE PEACE (V-SIGN & WINK) ---
        setQ('J_Bip_C_Hips_200', 0, 0.08, -0.06);
        setQ('J_Bip_C_Spine_145', -0.02, -0.04, 0.04);
        setQ('J_Bip_C_Neck_88', 0.06, 0.04, 0.08); // playful head tilt

        // Both hands up beside eyes in crisp V-signs!
        setQ('J_Bip_L_UpperArm_114', -0.40, 0.35, -0.40);
        setQ('J_Bip_L_LowerArm_113', -0.25, 0, -1.65);
        setQ('J_Bip_L_Hand_112', 0.20, 0, -0.20);
        // V-sign: Index & Middle outstretched, Ring & Little curled!
        setQ('J_Bip_L_Index1_95', 0.05, 0, 0.12);
        setQ('J_Bip_L_Middle1_101', 0.05, 0, -0.12);
        setQ('J_Bip_L_Ring1_104', -0.85, 0, 0);
        setQ('J_Bip_L_Little1_98', -0.92, 0, 0);

        setQ('J_Bip_R_UpperArm_141', -0.40, -0.35, 0.40);
        setQ('J_Bip_R_LowerArm_140', -0.25, 0, 1.65);
        setQ('J_Bip_R_Hand_139', 0.20, 0, 0.20);
        setQ('J_Bip_R_Index1_122', 0.05, 0, -0.12);
        setQ('J_Bip_R_Middle1_128', 0.05, 0, 0.12);
        setQ('J_Bip_R_Ring1_131', -0.85, 0, 0);
        setQ('J_Bip_R_Little1_125', -0.92, 0, 0);

        // Expression: Bright idol smile and playful left wink!
        this.targetExpr.browArchL = 0.08;
        this.targetExpr.browArchR = 0.08;
        this.targetExpr.mouthSmile = 0.24;
        this.targetExpr.mouthOpen = 0.08;
        this.targetExpr.winkL = 1.0; // WINK!
        break;
      }

      case 'tsundere_pout': {
        // --- TSUNDERE POUT ("HMPH!") ---
        setQ('J_Bip_C_Hips_200', 0, -0.32, -0.04);
        setQ('J_Bip_C_Spine_145', -0.02, -0.12, 0.02);
        setQ('J_Bip_C_Chest_144', 0.06, 0, 0);
        setQ('J_Bip_C_Neck_88', -0.06, -0.40, 0.08); // chin up, looking away

        // Arms tightly folded under bust
        setQ('J_Bip_L_UpperArm_114', -0.85, 0.45, -0.65);
        setQ('J_Bip_L_LowerArm_113', -0.35, 0.20, -1.35);
        setQ('J_Bip_R_UpperArm_141', -0.85, -0.45, 0.65);
        setQ('J_Bip_R_LowerArm_140', -0.35, -0.20, 1.35);

        // Expression: Furrowed cute brows, puffed pout, eyes looking sideways back!
        this.targetExpr.browFurrow = 0.16;
        this.targetExpr.browTilt = -0.12;
        this.targetExpr.mouthPout = 0.15;
        this.targetExpr.eyeSquint = 0.20;
        break;
      }

      case 'morning_stretch': {
        // --- FELINE MORNING STRETCH ---
        const stretchCycle = (Math.sin(t * 1.2) + 1.0) * 0.5;
        setQ('J_Bip_C_Hips_200', 0.08 * stretchCycle, 0, 0);
        setQ('J_Bip_C_Spine_145', -0.18 * stretchCycle, 0, 0);
        setQ('J_Bip_C_Chest_144', -0.22 * stretchCycle, 0, 0);
        setQ('J_Bip_C_Neck_88', -0.15 * stretchCycle, 0, 0); // head tilted back

        // Arms stretched gracefully overhead!
        setQ('J_Bip_L_UpperArm_114', -2.75 * stretchCycle - 1.35 * (1 - stretchCycle), 0, 0);
        setQ('J_Bip_L_LowerArm_113', 0, 0, 0);
        setQ('J_Bip_R_UpperArm_141', -2.75 * stretchCycle - 1.35 * (1 - stretchCycle), 0, 0);
        setQ('J_Bip_R_LowerArm_140', 0, 0, 0);

        this.targetExpr.eyeSquint = 0.65 * stretchCycle;
        this.targetExpr.mouthSmile = 0.15 * stretchCycle;
        break;
      }

      case 'blood_orb': {
        // --- SUMMON CRIMSON MANA ORB ---
        const orbPulse = Math.sin(t * 3.5) * 0.025;
        setQ('J_Bip_C_Chest_144', 0.06 + breathTorso, 0.14, 0);
        // Right hand holding floating orb palm-up
        setQ('J_Bip_R_UpperArm_141', -0.45, -0.30, 0.25);
        setQ('J_Bip_R_LowerArm_140', -0.35, 0.25, 0.85);
        setQ('J_Bip_R_Hand_139', 0.35 + orbPulse, 0, 0.15);
        // Cupped fingers
        setQ('J_Bip_R_Index1_122', -0.25, 0, 0);
        setQ('J_Bip_R_Middle1_128', -0.32, 0, 0);
        setQ('J_Bip_R_Ring1_131', -0.38, 0, 0);

        // Left arm balanced gracefully back
        setQ('J_Bip_L_UpperArm_114', -1.35, 0.10, -0.15);
        setQ('J_Bip_L_LowerArm_113', -0.15, 0, -0.25);

        this.targetExpr.browArchL = 0.08;
        this.targetExpr.mouthSmirk = 0.12;
        this.targetExpr.eyeSquint = 0.12;
        break;
      }

      default: {
        // Fallback smooth feminine stance (queen idle baseline)
        setQ('J_Bip_L_UpperArm_114', -1.35, 0.05, -0.10);
        setQ('J_Bip_L_LowerArm_113', -0.15, 0.05, -0.22);
        setQ('J_Bip_R_UpperArm_141', -1.35, -0.05, 0.10);
        setQ('J_Bip_R_LowerArm_140', -0.15, -0.05, 0.22);
        break;
      }
    }

    return targetPose;
  }`;

code = code.replace(poseRegex, newPoseMethod);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated pose mechanics in seraphina-engine.js!');
