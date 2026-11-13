const fs = require('fs');

// Read seraphina.glb
const buf = fs.readFileSync('public/models/seraphina.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
const seraphinaNodes = gltf.nodes.map(n => n.name).filter(Boolean);

console.log('Seraphina total nodes:', seraphinaNodes.length);

const BONE_ALIASES = {
  Hips: ['Hips', 'J_Bip_C_Hips_200'],
  Spine: ['Spine', 'J_Bip_C_Spine_145'],
  Chest: ['Chest', 'J_Bip_C_Chest_144'],
  UpperChest: ['UpperChest', 'J_Bip_C_UpperChest_143'],
  Neck: ['Neck', 'J_Bip_C_Neck_88'],
  Head: ['Head', 'J_Bip_C_Head_87'],
  Eye_L: ['Eye_L', 'J_Adj_L_FaceEye_20'],
  Eye_R: ['Eye_R', 'J_Adj_R_FaceEye_21'],
  
  Left_shoulder: ['Left_shoulder', 'Left shoulder', 'J_Bip_L_Shoulder_115'],
  Left_arm: ['Left_arm', 'Left arm', 'J_Bip_L_UpperArm_114'],
  Left_elbow: ['Left_elbow', 'Left elbow', 'J_Bip_L_LowerArm_113'],
  Left_wrist: ['Left_wrist', 'Left wrist', 'J_Bip_L_Hand_112'],
  
  Right_shoulder: ['Right_shoulder', 'Right shoulder', 'J_Bip_R_Shoulder_142'],
  Right_arm: ['Right_arm', 'Right arm', 'J_Bip_R_UpperArm_141'],
  Right_elbow: ['Right_elbow', 'Right elbow', 'J_Bip_R_LowerArm_140'],
  Right_wrist: ['Right_wrist', 'Right wrist', 'J_Bip_R_Hand_139'],
  
  Left_leg: ['Left_leg', 'Left leg', 'J_Bip_L_UpperLeg_172'],
  Left_knee: ['Left_knee', 'Left knee', 'J_Bip_L_LowerLeg_171'],
  Left_ankle: ['Left_ankle', 'Left ankle', 'J_Bip_L_Foot_170'],
  Left_toe: ['Left_toe', 'Left toe', 'J_Bip_L_ToeBase_169'],
  
  Right_leg: ['Right_leg', 'Right leg', 'J_Bip_R_UpperLeg_199'],
  Right_knee: ['Right_knee', 'Right knee', 'J_Bip_R_LowerLeg_198'],
  Right_ankle: ['Right_ankle', 'Right ankle', 'J_Bip_R_Foot_197'],
  Right_toe: ['Right_toe', 'Right toe', 'J_Bip_R_ToeBase_196']
};

for (const [canonical, aliases] of Object.entries(BONE_ALIASES)) {
  const match = seraphinaNodes.find(name => aliases.some(a => name.startsWith(a) || name.includes(a)));
  console.log(`${canonical} -> ${match ? match : 'MISSING'}`);
}

