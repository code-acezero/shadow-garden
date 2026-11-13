def _evaluate(keys, value, extrapolation="linear"):
    if not keys:
        return 0.0
    if len(keys) == 1:
        return keys[0][1]
    if value <= keys[0][0]:
        if extrapolation == "constant":
            return keys[0][1]
        a, b = keys[0], keys[1]
    elif value >= keys[-1][0]:
        if extrapolation == "constant":
            return keys[-1][1]
        a, b = keys[-2], keys[-1]
    else:
        a, b = keys[0], keys[-1]
        for index in range(len(keys) - 1):
            if keys[index][0] <= value <= keys[index + 1][0]:
                a, b = keys[index], keys[index + 1]
                break
    width = b[0] - a[0]
    return a[1] if abs(width) < 0.0000001 else a[1] + (b[1] - a[1]) * ((value - a[0]) / width)
def _evaluate_quaternion(keys, value, extrapolation="linear"):
    """Evaluate v2 Face JSON quaternion keys with shortest-path slerp."""
    if not keys:
        return Quaternion((1.0, 0.0, 0.0, 0.0))
    if len(keys) == 1:
        x, y, z, w = keys[0][1]
        return Quaternion((w, x, y, z)).normalized()
    if value <= keys[0][0]:
        if extrapolation == "constant":
            x, y, z, w = keys[0][1]
            return Quaternion((w, x, y, z)).normalized()
        a, b = keys[0], keys[1]
    elif value >= keys[-1][0]:
        if extrapolation == "constant":
            x, y, z, w = keys[-1][1]
            return Quaternion((w, x, y, z)).normalized()
        a, b = keys[-2], keys[-1]
    else:
        a, b = keys[0], keys[-1]
        for index in range(len(keys) - 1):
            if keys[index][0] <= value <= keys[index + 1][0]:
                a, b = keys[index], keys[index + 1]
                break
    width = b[0] - a[0]
    factor = 0.0 if abs(width) < 0.0000001 else (value - a[0]) / width
    ax, ay, az, aw = a[1]
    bx, by, bz, bw = b[1]
    qa = Quaternion((aw, ax, ay, az)).normalized()
    qb = Quaternion((bw, bx, by, bz)).normalized()
    # ``Quaternion.slerp`` clamps outside 0..1 in Blender.  Face SDK curves
    # deliberately continue past their displayed slider range, just like the
    # scalar evaluator above, so extend the shortest angular arc ourselves.
0
    # This preserves smooth interpolation inside the key interval and yields
P
    # the same useful overdrive behaviour beyond it.
p
    arc = qa.rotation_difference(qb)
    return (qa @ Quaternion(arc.axis, arc.angle * factor)).normalized()
def _rig():
    bound = globals().get("_BOUND_RIG")
    if bound is not None:
        try:
            return bound if bound.name in bpy.data.objects else None
        except ReferenceError:
            return None
    return bpy.data.objects.get(FACE_SDK_DATA["rig"])
def _write_pose(rig, values):
    for bone_name, result in values.items():
        bone = rig.pose.bones.get(bone_name)
        if bone is None:
            continue
        bone.location = result["location"]
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = result["rotation"]
        bone.scale = result["scale"]
def _update_on_face_helpers():
    """Run after depsgraph evaluation without forcing another evaluation."""
    global _RUNNING, _FOLLOW_TIMER_SCHEDULED, _PENDING_FOLLOW_DATA
    _FOLLOW_TIMER_SCHEDULED = False
    pending = _PENDING_FOLLOW_DATA
    _PENDING_FOLLOW_DATA = None
    rig = _rig()
    if not pending or rig is None or rig.type != "ARMATURE":
        return None
    _RUNNING = True
    try:
        final_accum, follow_accums = pending
        def pose_matrix_from_sdk(name, values, cache):
            """Evaluate an unconstrained facial PoseBone from its local SDK pose.
            This is Blender's rest/parent/basis composition written directly
            in mathutils.  It replaces the previous nine temporary scene
            evaluations per mouse move, which was correct but far too slow.
            """
            if name in cache:
                return cache[name]
            bone = rig.pose.bones.get(name)
            if bone is None:
                return Matrix.Identity(4)
            result = values.get(name)
            if result is None:
                cache[name] = bone.matrix.copy()
                return cache[name]
            basis = Matrix.LocRotScale(
                Vector(result["location"]), Euler(result["rotation"], "XYZ"),
                Vector(result["scale"]),
            )
            rest = bone.bone.matrix_local
            if bone.parent is None:
                cache[name] = rest @ basis
            else:
                parent = pose_matrix_from_sdk(bone.parent.name, values, cache)
                parent_rest_inverse = bone.parent.bone.matrix_local.inverted_safe()
                cache[name] = parent @ parent_rest_inverse @ rest @ basis
            return cache[name]
        for item in FACE_SDK_DATA.get("on_face_follows", ()):
            helper = rig.pose.bones.get(item["helper"])
            values = follow_accums.get(item["helper"])
            if helper is None or values is None:
                continue
            target_sdk_matrix = pose_matrix_from_sdk(
                item["target"], values, {}
            ).normalized()
            target_initial = Matrix(item["target_initial"]).normalized()
            helper_initial = Matrix(item["helper_initial"]).normalized()
            helper.matrix = (
                target_sdk_matrix @ target_initial.inverted_safe() @ helper_initial
            )
            helper.scale = item.get("scale", (1.0, 1.0, 1.0))
    finally:
        _RUNNING = False
    return None
def _solve(*_args):
    global _RUNNING, _FOLLOW_TIMER_SCHEDULED, _PENDING_FOLLOW_DATA, _LAST_SOLVE_SIGNATURE
    if _RUNNING:
        return
    rig = _rig()
    if rig is None or rig.type != "ARMATURE":
        return
    _RUNNING = True
    try:
        # `depsgraph_update_post` also fires for the face joints and follow
        # helpers *we* write.  Sampling the raw animator inputs first lets us
        # ignore those self-generated updates rather than starting an endless
        # solve/timer/evaluate loop (which feels like 1 FPS in the viewport).
        raw_values = {}
        signature = []
        for row in FACE_SDK_DATA["rows"]:
            source = rig.pose.bones.get(row["source_bone"])
            if source is None:
                continue
            key = (
                row["source_bone"], row["source_kind"], row["source_axis"],
                row.get("source_property", ""),
            )
            if key not in raw_values:
                if row["source_kind"] == "LOCATION":
                    value = float(source.location[row["source_axis"]])
                elif row["source_kind"] == "ROTATION":
                    value = float(source.rotation_euler[row["source_axis"]])
                elif row["source_kind"] == "SCALE":
                    value = float(source.scale[row["source_axis"]])
                else:
                    value = float(source.get(row["source_property"], 0.0))
                raw_values[key] = value
                signature.append((key, value))
        # directTransform controls have no sampled driver rows, so include
        # their native transform channels explicitly in the solve signature.
        for item in (*FACE_SDK_DATA.get("direct_controls", ()), *FACE_SDK_DATA.get("region_controls", ())):
            control = rig.pose.bones.get(item["control"])
            if control is None:
                continue
            signature.extend((
                ((item["control"], "DIRECT_LOCATION", axis, ""), float(control.location[axis]))
                for axis in range(3)
            ))
            signature.extend((
                ((item["control"], "DIRECT_ROTATION", axis, ""), float(control.rotation_euler[axis]))
                for axis in range(3)
            ))
            signature.extend((
                ((item["control"], "DIRECT_SCALE", axis, ""), float(control.scale[axis]))
                for axis in range(3)
            ))
        signature = tuple(sorted(signature))
        if signature == _LAST_SOLVE_SIGNATURE:
            return
        _LAST_SOLVE_SIGNATURE = signature
        accum = {}
        for bone_name, record in FACE_SDK_DATA["bones"].items():
            accum[bone_name] = {
                "location": list(record["base_location"]),
                "rotation": list(record["base_rotation"]),
                "scale": list(record["base_scale"]),
            }
        def _add_result(targets, row, result):
            target = targets.get(row["bone"])
            if target is None:
                return
            if row["kind"] == "Translation":
                vector = row["vector"]
                for axis in range(3):
                    target["location"][axis] += result * vector[axis]
            elif row["kind"] == "Rotation":
                target["rotation"][row["axis"]] += math.radians(result)
            elif row["kind"] == "Scale":
                target["scale"][row["axis"]] *= 1.0 + result
        # Every follow helper is solved from the SDK pose *without* its own
        # control's contribution.  This is the crucial distinction between a
        # handle sticking to the face and a feedback/double-transform loop.
        follow_accums = {}
        quaternion_deltas = {}
        follow_quaternion_deltas = {}
        for item in FACE_SDK_DATA.get("on_face_follows", ()):
            follow_accums[item["helper"]] = {
                bone_name: {
                    "location": list(record["base_location"]),
                    "rotation": list(record["base_rotation"]),
                    "scale": list(record["base_scale"]),
                }
                for bone_name, record in FACE_SDK_DATA["bones"].items()
            }
            follow_quaternion_deltas[item["helper"]] = {}
        for row in FACE_SDK_DATA["rows"]:
            key = (
                row["source_bone"], row["source_kind"], row["source_axis"],
                row.get("source_property", ""),
            )
            if key not in raw_values:
                continue
            value = raw_values[key]
            remap = row.get("input_remap")
            if remap is not None:
                source_min, source_max, target_min, target_max = (
                    float(remap[index]) for index in range(4)
                )
                source_width = source_max - source_min
                if abs(source_width) < 0.0000001:
                    value = target_min
                else:
                    factor = max(0.0, min(1.0, (value - source_min) / source_width))
                    value = target_min + factor * (target_max - target_min)
            # Declarative clampMin/clampMax mappings and legacy compatibility
            # mappings share these independent, one-sided input bounds.
            if row.get("input_min") is not None:
                value = max(value, float(row["input_min"]))
            if row.get("input_max") is not None:
                value = min(value, float(row["input_max"]))
            value *= float(row.get("input_scale", 1.0))
            if row["kind"] == "Quaternion":
                delta = _evaluate_quaternion(
                    row["keys"], value, row.get("extrapolation", "linear")
                )
                if row.get("tongue_root_bend_compat", False):
                    # Blender's imported Tongue0 bends on local Z; X twists
                    # and Y swings the root sideways.
                    angle = 2.0 * math.atan2(delta.x, delta.w)
                    delta = Quaternion((0.0, 0.0, 1.0), -angle)
                else:
                    basis = Quaternion(row.get("quaternion_basis", (1.0, 0.0, 0.0, 0.0)))
                    delta = basis @ delta @ basis.inverted()
                previous = quaternion_deltas.get(row["bone"])
                quaternion_deltas[row["bone"]] = (
                    delta if previous is None else previous @ delta
                )
                for item in FACE_SDK_DATA.get("on_face_follows", ()):
                    if row["source_bone"] != item["control"]:
                        deltas = follow_quaternion_deltas[item["helper"]]
                        previous = deltas.get(row["bone"])
                        deltas[row["bone"]] = (
                            delta if previous is None else previous @ delta
                        )
                continue
            result = _evaluate(
                row["keys"], value, row.get("extrapolation", "linear")
            ) * row["multiplier"]
            _add_result(accum, row, result)
            for item in FACE_SDK_DATA.get("on_face_follows", ()):
                # Do include other SDK controls.  Only this exact handle's
                # response is excluded from the surface-follow pose.
                if row["source_bone"] != item["control"]:
                    _add_result(follow_accums[item["helper"]], row, result)
        def _apply_quaternion_deltas(values, deltas):
            for bone_name, delta in deltas.items():
                target = values.get(bone_name)
                if target is None:
                    continue
                rest_rotation = Euler(target["rotation"], "XYZ").to_quaternion()
                target["rotation"] = list((rest_rotation @ delta).to_euler("XYZ"))
        _apply_quaternion_deltas(accum, quaternion_deltas)
        for helper_name, values in follow_accums.items():
            _apply_quaternion_deltas(
                values, follow_quaternion_deltas.get(helper_name, {})
            )
        # directTransform controls are not sampled SDK drivers.  Find their
        # maintain-offset parent-constraint result, then add its delta from
        # the bind pose to the regular SDK accumulation.  Assigning the full
        # result here would wrongly erase any DrivingSystem / sampled-driver
        # contribution to the same joint.
        for item in FACE_SDK_DATA.get("direct_controls", ()):
            control = rig.pose.bones.get(item["control"])
            target_bone = rig.pose.bones.get(item["bone"])
            target = accum.get(item["bone"])
            if control is None or target_bone is None or target is None:
                continue
            if item.get("joint_fk"):
                def add_fk(values):
                    result = values[item["bone"]]
                    # The helper follows SDK rotation; translate in that same
                    # frame so the visible pivot and driven joint agree.
                    result["location"] = list(Vector(result["location"]) + Euler(result["rotation"], "XYZ").to_matrix() @ control.location)
                    result["rotation"] = list((Euler(result["rotation"], "XYZ").to_quaternion() @ control.rotation_euler.to_quaternion()).to_euler("XYZ"))
                    result["scale"] = list(Vector(result["scale"]) * control.scale)
                add_fk(accum)
                for follow in FACE_SDK_DATA.get("on_face_follows", ()):
                    if follow["control"] != control.name:
                        add_fk(follow_accums[follow["helper"]])
                continue
            desired_world = control.matrix @ Matrix(item["maintain_offset"])
            if target_bone.parent is None:
                basis = target_bone.bone.matrix_local.inverted_safe() @ desired_world
            else:
                basis = (
                    target_bone.bone.matrix_local.inverted_safe()
                    @ target_bone.parent.bone.matrix_local
                    @ target_bone.parent.matrix.inverted_safe()
                    @ desired_world
                )
            location, rotation, scale = basis.decompose()
            base_location = Vector(item["base_location"])
            base_rotation = Euler(item["base_rotation"], "XYZ")
            base_scale = Vector(item["base_scale"])
            target["location"] = list(
                Vector(target["location"]) + location - base_location
            )
            direct_rotation_delta = (
                base_rotation.to_matrix().inverted_safe() @ rotation.to_matrix()
            )
            target_rotation = Euler(target["rotation"], "XYZ").to_matrix()
            target["rotation"] = list(
                (target_rotation @ direct_rotation_delta).to_euler("XYZ")
            )
            direct_scale_ratio = Vector(
                scale[index] / base_scale[index] if abs(base_scale[index]) > 1e-8 else 1.0
                for index in range(3)
            )
            target["scale"] = list(
                Vector(target["scale"]) * direct_scale_ratio
            )
        def _apply_regions(values):
            # Snapshot completed SDK/direct globals. Convert back through the
            # final parent globals so nested members get the delta once.
            cache = {}
            def global_matrix(name):
                if name in cache:
                    return cache[name]
                bone = rig.pose.bones[name]
                result = values.get(name)
                if result is None:
                    cache[name] = bone.matrix.copy()
                else:
                    basis = Matrix.LocRotScale(Vector(result["location"]), Euler(result["rotation"], "XYZ"), Vector(result["scale"]))
                    kwargs = {}
                    if bone.parent:
                        kwargs = {"parent_matrix": global_matrix(bone.parent.name), "parent_matrix_local": bone.parent.bone.matrix_local}
                    cache[name] = bone.bone.convert_local_to_pose(basis, bone.bone.matrix_local, **kwargs)
                return cache[name]
            for item in FACE_SDK_DATA.get("region_controls", ()):
                control = rig.pose.bones.get(item["control"])
                if control is None:
                    continue
                if all(abs(control.matrix_basis[i][j] - float(i == j)) < 1e-10 for i in range(4) for j in range(4)):
                    continue
                # Rest frame below the current head, including body motion.
                rest = control.bone.matrix_local
                base = (control.parent.matrix @ control.parent.bone.matrix_local.inverted_safe() @ rest) if control.parent else rest
                delta = base @ control.matrix_basis @ base.inverted_safe()
                targets = {name: delta @ global_matrix(name) for name in item["bones"] if name in values}
                def depth(name):
                    return len(rig.pose.bones[name].parent_recursive)
                for name in sorted(targets, key=depth):
                    bone = rig.pose.bones[name]
                    # Recompute parents from the updated local values; cached
                    # child globals belong to the pre-region snapshot.
                    cache.clear()
                    kwargs = {}
                    if bone.parent:
                        kwargs = {"parent_matrix": global_matrix(bone.parent.name), "parent_matrix_local": bone.parent.bone.matrix_local}
                    basis = bone.bone.convert_local_to_pose(targets[name], bone.bone.matrix_local, invert=True, **kwargs)
                    location, rotation, scale = basis.decompose()
                    values[name] = {"location": list(location), "rotation": list(rotation.to_euler("XYZ")), "scale": list(scale)}
                cache.clear()
        _apply_regions(accum)
        for values in follow_accums.values():
            _apply_regions(values)
        _write_pose(rig, accum)
        if FACE_SDK_DATA.get("on_face_follows"):
            _PENDING_FOLLOW_DATA = (accum, follow_accums)
            if not _FOLLOW_TIMER_SCHEDULED:
                _FOLLOW_TIMER_SCHEDULED = True
                bpy.app.timers.register(_update_on_face_helpers, first_interval=0.0)
        # On-face controls are attached to facial joints so their displayed
        # shapes follow the skin.  Their *raw* Pose-Bone location is also the
        # SDK input, however.  Without cancelling that raw location in the
        # display offset, a dragged shape moves once as animator input and a
        # second time when its follow helper updates.  Preserve the authored
        # surface/pick offset and cancel only the entered local translation;
        # the SDK continues to read the unmodified pose channel above.
        for bone_name, display in FACE_SDK_DATA.get("on_face_display_controls", {}).items():
            bone = rig.pose.bones.get(bone_name)
            if bone is None:
                continue
            base = display.get("shape_translation", (0.0, 0.0, 0.0))
            bone.custom_shape_translation = tuple(
                float(base[index]) - float(bone.location[index])
                for index in range(3)
            )
    finally:
        _RUNNING = False
def _update_shortcut_shapes(*args):
    """Keep extra picking outlines fixed in the panel, on the original bone."""
    rig = _rig()
    if rig is None or rig.mode == "EDIT":
        return
    graph = args[-1] if args and isinstance(args[-1], bpy.types.Depsgraph) else bpy.context.evaluated_depsgraph_get()
    evaluated = rig.evaluated_get(graph)
    for item in FACE_SDK_DATA.get("shortcuts", ()):
        control = rig.pose.bones.get(item["control"])
        panel = evaluated.pose.bones.get(item["panel"])
        if control is None or panel is None or control.custom_shape is None:
            continue
        widget = control.custom_shape
        if widget.type != "MESH":
            continue
        pose = evaluated.pose.bones[control.name]
        # A shortcut must remain pickable when RegionsCtrlVis hides the
        # on-face outline. Both outlines still select this one Pose Bone.
        owner = rig.pose.bones.get("ctrlBox")
        show_original = bool(owner.get(item.get("visibility", "RegionsCtrlVis"), True)) if owner else True
        for point, authored in zip(widget.data.vertices, item.get("original_points", ())):
            target = Vector((authored if show_original else item["original_points"][0])[:3])
            if (point.co - target).length > 1e-6:
                point.co = target
                widget.data.update_tag()
        display = pose.matrix @ Matrix.LocRotScale(
            pose.custom_shape_translation,
            Euler(pose.custom_shape_rotation_euler, "XYZ"),
            pose.custom_shape_scale_xyz,
        )
        transform = display.inverted_safe() @ panel.matrix
        positions = [transform @ Vector(point) for point in item["points"]]
        vertices = list(widget.data.vertices)[item["vertex_start"]:]
        if any((point.co - position).length > 1e-6 for point, position in zip(vertices, positions)):
            for point, position in zip(vertices, positions):
                point.co = position
            widget.data.update_tag()
def _frame_update(scene, graph=None):
    """Animation evaluation needs an explicit solve after keyed inputs update."""
    _solve()
    if _PENDING_FOLLOW_DATA:
        if bpy.app.timers.is_registered(_update_on_face_helpers):
            bpy.app.timers.unregister(_update_on_face_helpers)
        _update_on_face_helpers()
    # Let Blender finish its frame evaluation normally. Forcing a nested
    # depsgraph update here is unsafe with several independently animated rigs.
for handlers in (bpy.app.handlers.depsgraph_update_post, bpy.app.handlers.frame_change_post):
    for handler in tuple(handlers):
        if (getattr(handler, "_advanced_skeleton_face_solver", False)
                and getattr(handler, "_as_face_rig", None) == _rig()):
            handlers.remove(handler)
_solve._advanced_skeleton_face_solver = True
_solve._as_face_runtime_version = 2
_solve._as_face_rig = _rig()
bpy.app.handlers.depsgraph_update_post.append(_solve)
_update_shortcut_shapes._advanced_skeleton_face_solver = True
_update_shortcut_shapes._as_face_rig = _rig()
bpy.app.handlers.depsgraph_update_post.append(_update_shortcut_shapes)
_frame_update._advanced_skeleton_face_solver = True
_frame_update._as_face_rig = _rig()