var MOUSE_SENSITIVITY = new THREE.Vector3(0.4, 0.8, 5.0);
var PI_2 = 2 * Math.PI;

function camera_init(camera, yaw, pitch, distance_from_robot, angle_around_robot, rad) {
    camera_set_yaw(camera, yaw, rad);
    camera_set_pitch(camera, pitch, rad);
    camera_set_angle_around_robot(camera, angle_around_robot, rad);
    camera.userData.distance_from_robot = distance_from_robot;
    camera.updateMatrix();
}

function camera_calculate_pitch(camera, mouseinfo) {
    if (mouseinfo.right_button_pressed) {
		var pitch_change = mouseinfo.delta_position.y * MOUSE_SENSITIVITY.x;
		camera_increase_pitch(camera, THREE.Math.degToRad(-pitch_change), true);
	}
}

function camera_calculate_angle_around_robot(camera, mouseinfo) {
    if (mouseinfo.left_button_pressed) {
        var angle_change = mouseinfo.delta_position.x * MOUSE_SENSITIVITY.y;
        camera_increase_angle_around_robot(camera, THREE.Math.degToRad(-angle_change), true);
    }
}

function camera_calculate_distance(camera) {
    return new THREE.Vector2(
        camera.userData.distance_from_robot * Math.cos(camera.rotation.x),
        camera.userData.distance_from_robot * Math.sin(camera.rotation.x)
    );
}

function camera_calculate_position(camera, dist) {
    var theta = camera.userData.robot.rotation.y + camera.userData.angle_around_robot;
    var offsetX = dist.x * Math.sin(theta);
    var offsetZ = dist.x * Math.cos(theta);
    camera.position.set(
        camera.userData.robot.position.x - offsetX,
        camera.userData.robot.position.y + dist.y,
        camera.userData.robot.position.z - offsetZ
    );
}

function camera_zoom(camera, mouse_wheel_delta) {
    var zoom_level = mouse_wheel_delta * MOUSE_SENSITIVITY.z;
    camera.userData.distance_from_robot -= zoom_level;
}

function camera_increase_pitch(camera, val, rad) {
    var rx = val;
    if (!rad) {
        rx = THREE.Math.degToRad(rx);
    }
	camera_set_pitch(camera, camera.rotation.x + rx, true);
}

function camera_increase_yaw(camera, val, rad) {
    var ry = val;
    if (!rad) {
        ry = THREE.Math.degToRad(ry);
    }
	camera_set_yaw(camera, camera.rotation.y + ry, true);
}

function camera_increase_angle_around_robot(camera, val, rad) {
    var rr = val;
    if (!rad) {
        rr = THREE.Math.degToRad(rr);
    }
    camera_set_angle_around_robot(camera, camera.userData.angle_around_robot + rr, true);
}

function camera_set_pitch(camera, val, rad) {
    var angle = val;
    if (!rad) {
        angle = THREE.Math.degToRad(angle);
    }
    while (angle < 0)
		angle += PI_2;
	while (angle > PI_2)
		angle -= PI_2;
    camera.rotation.x = angle;
}

function camera_set_yaw(camera, val, rad) {
    var angle = val;
    if (!rad) {
        angle = THREE.Math.degToRad(angle);
    }
    while (angle < 0)
		angle += PI_2;
	while (angle > PI_2)
		angle -= PI_2;
    camera.rotation.y = angle;
}

function camera_set_angle_around_robot(camera, val, rad) {
    var angle = val;
    if (!rad) {
        angle = THREE.Math.degToRad(angle);
    }
    while (angle < 0)
		angle += PI_2;
	while (angle > PI_2)
		angle -= PI_2;
    camera.userData.angle_around_robot = angle;
}

function camera_move(camera, mouseinfo) {
    camera_calculate_pitch(camera, mouseinfo);
    camera_calculate_angle_around_robot(camera, mouseinfo);
    var dist = camera_calculate_distance(camera);
    camera_calculate_position(camera, dist);
    camera_set_yaw(camera, Math.PI - (camera.userData.robot.rotation.y + camera.userData.angle_around_robot), true);
    camera.updateMatrix();
}
