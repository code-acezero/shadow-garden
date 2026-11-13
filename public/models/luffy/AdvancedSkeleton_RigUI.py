frame_change_post.append(_frame_update)
DATA
_solve()
DATA
_update_shortcut_shapes()
DATA
TX
TXAdvancedSkeleton_RigUI.py
DATA
import bpy
DATA
DATA
DATA
def _advanced_skeleton_rig():
DATA
    return next(
DATA
DATA
            obj for obj in bpy.data.objects
DATA
            if obj.type == "ARMATURE"
DATA
            and obj.get("advanced_skeleton_role") == "RIG"
DATA
DATA
        None,
DATA
DATA
DATA
DATA
def _bone_collection(armature, name):
DATA
    def walk(collection):
DATA
        if collection.name == name:
DATA
            return collection
DATA
        for child in collection.children:
DATA
            found = walk(child)
DATA
            if found is not None:
DATA
                return found
DATA
        return None
DATA
DATA
    for collection in armature.collections:
DATA
        found = walk(collection)
DATA
        if found is not None:
DATA
            return found
DATA
    return None
DATA
DATA
DATA
def _reset_custom_properties(rig):
DATA
    for pose_bone in rig.pose.bones:
DATA
        for name in tuple(pose_bone.keys()):
DATA
            if str(name).startswith("_"):
DATA
                continue
DATA
            try:
DATA
                default = pose_bone.id_properties_ui(name).as_dict().get("default")
DATA
            except (AttributeError, TypeError):
DATA
                default = None
DATA
            if default is not None:
DATA
                pose_bone[name] = default
DATA
DATA
DATA
class ADVANCEDSKELETON_RIG_PT_settings(bpy.types.Panel):
DATA
    bl_label = "Rig Settings"
DATA
    bl_idname = "ADVANCEDSKELETON_RIG_PT_settings"
DATA
    bl_space_type = "VIEW_3D"
DATA
    bl_region_type = "UI"
DATA
    bl_category = "Rig Settings"
DATA
DATA
    def draw(self, context):
DATA
        layout = self.layout
DATA
        rig = _advanced_skeleton_rig()
DATA
        controls = _bone_collection(rig.data, "Controls") if rig else None
DATA
        main = rig.pose.bones.get("Main") if rig else None
DATA
        if controls is None or main is None or "ctrlVis" not in main:
DATA
            layout.label(text="No AdvancedSkeleton controls found.", icon="INFO")
DATA
            return
DATA
        layout.label(text="Visibility")
DATA
        # This is the exact Custom Property on Main, not a duplicate UI state.
DATA
        layout.prop(main, '["ctrlVis"]', text="Controls", toggle=True)
DATA
        if "geoVis" in main:
DATA
            layout.prop(main, '["geoVis"]', text="Geometry", toggle=True)
DATA
        active = context.active_pose_bone
DATA
        if active is not None:
DATA
            properties = [
DATA
                name for name in active.keys()
DATA
                if not str(name).startswith("_")
DATA
                and name not in {"ctrlVis", "geoVis", "version", "pluginVersion"}
DATA
DATA
            if properties:
DATA
                layout.separator()
DATA
                layout.label(text=active.name)
DATA
                for name in sorted(properties):
DATA
                    layout.prop(active, f'["{name}"]', text=name)
DATA
        layout.separator()
DATA
        layout.operator("advanced_skeleton_rig.go_to_build_pose", text="Go to Build Pose", icon="LOOP_BACK")
DATA
DATA
DATA
class ADVANCEDSKELETON_RIG_OT_go_to_build_pose(bpy.types.Operator):
DATA
    bl_idname = "advanced_skeleton_rig.go_to_build_pose"
DATA
    bl_label = "Go to Build Pose"
DATA
DATA
    def execute(self, context):
DATA
        rig = _advanced_skeleton_rig()
DATA
        if rig is None:
DATA
            return {"CANCELLED"}
DATA
        if context.mode != "OBJECT":
DATA
            bpy.ops.object.mode_set(mode="OBJECT")
DATA
        bpy.ops.object.select_all(action="DESELECT")
DATA
        rig.select_set(True)
DATA
        context.view_layer.objects.active = rig
DATA
        bpy.ops.object.mode_set(mode="POSE")
DATA
        _reset_custom_properties(rig)
DATA
        bpy.ops.pose.select_all(action="SELECT")
DATA
        bpy.ops.pose.transforms_clear()
DATA
        bpy.ops.pose.select_all(action="DESELECT")
DATA
        return {"FINISHED"}
DATA
DATA
DATA
def register():
DATA
    for existing_name in (
DATA
        "ADVANCEDSKELETON_RIG_PT_settings",
DATA
        "ADVANCEDSKELETON_RIG_OT_go_to_build_pose",
DATA
DATA
        existing = getattr(bpy.types, existing_name, None)
DATA
        if existing is None:
DATA
            continue
DATA
        try:
DATA
            bpy.utils.unregister_class(existing)
DATA
        except RuntimeError:
DATA
            pass
DATA
    bpy.utils.register_class(ADVANCEDSKELETON_RIG_OT_go_to_build_pose)
DATA
    bpy.utils.register_class(ADVANCEDSKELETON_RIG_PT_settings)
DATA
DATA
DATA
def unregister():
DATA
    for cls in (ADVANCEDSKELETON_RIG_PT_settings, ADVANCEDSKELETON_RIG_OT_go_to_build_pose):
DATA
        try:
DATA
            bpy.utils.unregister_class(cls)
DATA
        except RuntimeError:
DATA
            pass
DATA
DATA
DATA
register()
DATA
AC
ACTake 001
OB
DATA
DATA
Root_M
RootPart1_M
RootPart2_M
Spine1_M
Spine1Part1_M
Spine1Part2_M
Chest_M
Scapula_R
Shoulder_R
ShoulderPart1_R
ShoulderPart2_R
Elbow_R
ElbowPart1_R
ElbowPart2_R
Wrist_R
MiddleFinger1_R
MiddleFinger2_R
MiddleFinger3_R
MiddleFinger4_R
ThumbFinger1_R
ThumbFinger2_R
ThumbFinger3_R
ThumbFinger4_R
IndexFinger1_R
IndexFinger2_R
IndexFinger3_R
IndexFinger4_R
Cup_R
PinkyFinger1_R
PinkyFinger2_R
PinkyFinger3_R
PinkyFinger4_R
RingFinger1_R
RingFinger2_R
RingFinger3_R
RingFinger4_R
WristendSlider0_R
WristendSlider1_R
WristendSlider2_R
WristendSlider3_R
WristPartial_R
WristmiddleSlider0_R
WristmiddleSlider1_R
WristmiddleSlider2_R
WristmiddleSlider3_R
WriststartSlider0_R
WriststartSlider1_R
WriststartSlider2_R
WriststartSlider3_R
ElbowendSlider0_R
ElbowendSlider2_R
ElbowPartial_R
ElbowmiddleSlider0_R
ElbowmiddleSlider2_R
ElbowstartSlider0_R
ElbowstartSlider2_R
ShoulderendSlider0_R
ShoulderendSlider1_R
ShoulderendSlider2_R
ShoulderendSlider3_R
ShoulderPartial_R
ShouldermiddleSlider0_R
ShouldermiddleSlider1_R
ShouldermiddleSlider2_R
ShouldermiddleSlider3_R
ShoulderstartSlider0_R
ShoulderstartSlider1_R
ShoulderstartSlider2_R
ShoulderstartSlider3_R
Neck_M
NeckPart1_M
NeckPart2_M
Head_M
Hat_M
HatEnd_M
JointHair1_L
JointHair2_R
JointHair3_L
JointHair4_L
JointHair5_L
JointHair6_L
JointHair7_L
JointHair8_R
JointHair9_R
JointHair10_R
JointHair11_R
JointHair12_R
JointHair13_L
JointHair14_L
JointHair15_R
JointHair16_R
JointHair17_R
JointHair18_R
JointHair19_R
JointHair20_R
JointHair21_L
JointHair22_L
JointHair23_L
JointHair24_L
JointHair25_R
JointHair26_L
JointHair27_L
JointHair28_R
JointHair29_R
JointHair30_L
JointHair31_L
JointHair32_L
JointHair33_L
JointHair34_L
JointHair35_R
JointHair36_R
EyeJoint_R
IrisJoint_R
PupilJoint_R
Jointglint_R
EyeJoint_L
IrisJoint_L
PupilJoint_L
Jointglint_L
upperLidMain0_R
upperLidMain1_R
upperLidMain2_R
upperLidMain3_R
upperLidMain4_R
upperLidMain5_R
upperLidMain6_R
upperLidMain7_R
upperLidMain8_R
upperLidMain9_R
upperLidMain10_R
upperLidMain11_R
upperLidMain12_R
upperLidMain13_R
upperLidOuter0_R
upperLidOuter1_R
upperLidOuter2_R
upperLidOuter3_R
upperLidOuter4_R
upperLidOuter5_R
upperLidOuter6_R
upperLidOuter7_R
upperLidOuter8_R
upperLidOuter9_R
upperLidOuter10_R
upperLidOuter11_R
upperLidOuter12_R
upperLidOuter13_R
lowerLidMain1_R
lowerLidMain2_R
lowerLidMain3_R
lowerLidMain4_R
lowerLidMain5_R
lowerLidMain6_R
lowerLidMain7_R
lowerLidMain8_R
lowerLidMain9_R
lowerLidMain10_R
lowerLidMain11_R
lowerLidMain12_R
lowerLidOuter1_R
lowerLidOuter2_R
lowerLidOuter3_R
lowerLidOuter4_R
lowerLidOuter5_R
lowerLidOuter6_R
lowerLidOuter7_R
lowerLidOuter8_R
lowerLidOuter9_R
lowerLidOuter10_R
lowerLidOuter11_R
lowerLidOuter12_R
upperLidMain0_L
upperLidMain1_L
upperLidMain2_L
upperLidMain3_L
upperLidMain4_L
upperLidMain5_L
upperLidMain6_L
upperLidMain7_L
upperLidMain8_L
upperLidMain9_L
upperLidMain10_L
upperLidMain11_L
upperLidMain12_L
upperLidMain13_L
upperLidOuter0_L
upperLidOuter1_L
upperLidOuter2_L
upperLidOuter3_L
upperLidOuter4_L
upperLidOuter5_L
upperLidOuter6_L
upperLidOuter7_L
upperLidOuter8_L
upperLidOuter9_L
upperLidOuter10_L
upperLidOuter11_L
upperLidOuter12_L
upperLidOuter13_L
lowerLidMain1_L
lowerLidMain2_L
lowerLidMain3_L
lowerLidMain4_L
lowerLidMain5_L
lowerLidMain6_L
lowerLidMain7_L
lowerLidMain8_L
lowerLidMain9_L
lowerLidMain10_L
lowerLidMain11_L
lowerLidMain12_L
lowerLidOuter1_L
lowerLidOuter2_L
lowerLidOuter3_L
lowerLidOuter4_L
lowerLidOuter5_L
lowerLidOuter6_L
lowerLidOuter7_L
lowerLidOuter8_L
lowerLidOuter9_L
lowerLidOuter10_L
lowerLidOuter11_L
lowerLidOuter12_L
upperLipJoint0_M
upperLip