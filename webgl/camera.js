const MOUSE_SENSITIVITY = new THREE.Vector3(0.5, 0.5, 10.0);
const DEG_TO_RAD_2 = Math.PI / 360.0;

let camera_user_data;

function camera_init(camera, radius, theta, phi) {
    camera_user_data = {};
    camera_user_data.is_perspective = true;
    camera_user_data.radius = radius;
    camera_user_data.theta = theta;
    camera_user_data.on_mousedown_theta = theta;
    camera_user_data.phi = phi;
    camera_user_data.on_mousedown_phi = phi;
    camera_user_data.on_mousedown_x = 0;
    camera_user_data.on_mousedown_y = 0;
    camera_user_data.aspect = 16.0 / 9.0;
    camera_user_data.left =  -200;
	camera_user_data.right = 200;
	camera_user_data.top = 200;
	camera_user_data.bottom = -200;
    camera_set_position(camera);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.updateMatrix();
}

function camera_set_position(camera, update_matrix) {
    camera.position.x = camera_user_data.radius * Math.sin(camera_user_data.theta * DEG_TO_RAD_2) * Math.cos(camera_user_data.phi * DEG_TO_RAD_2);
    camera.position.y = camera_user_data.radius * Math.sin(camera_user_data.phi * DEG_TO_RAD_2);
    camera.position.z = camera_user_data.radius * Math.cos(camera_user_data.theta * DEG_TO_RAD_2) * Math.cos(camera_user_data.phi * DEG_TO_RAD_2);
    if (update_matrix) {
        camera.updateMatrix();
    }
}

function camera_mouse_down(camera, x, y) {
    camera_user_data.on_mousedown_theta = camera_user_data.theta;
    camera_user_data.on_mousedown_phi = camera_user_data.phi;
    camera_user_data.on_mousedown_x = x;
    camera_user_data.on_mousedown_y = y;
}

function camera_zoom(camera, mouse_wheel_delta) {
    let zoom_level = mouse_wheel_delta * MOUSE_SENSITIVITY.z;
    camera_user_data.radius -= zoom_level;
    camera_set_position(camera);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.updateMatrix();
}

function camera_update(camera) {
    camera_set_position(camera);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.updateMatrix();
}


function camera_move(camera, mouseinfo) {
    if (mouseinfo.left_button_pressed) {
        camera_user_data.theta = -((mouseinfo.current_mouse_position.x - camera_user_data.on_mousedown_x) * MOUSE_SENSITIVITY.x) + camera_user_data.on_mousedown_theta;
        camera_user_data.phi = ((mouseinfo.current_mouse_position.y - camera_user_data.on_mousedown_y) * MOUSE_SENSITIVITY.y) + camera_user_data.on_mousedown_phi;
        camera_user_data.phi = Math.min(180, Math.max(0, camera_user_data.phi));
        camera_set_position(camera);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        camera.updateMatrix();
    }
}

function camera_resize(camera, width, height) {
    camera_user_data.left = width / - 2.0;
	camera_user_data.right = width / 2.0;
	camera_user_data.top = height / 2.0;
	camera_user_data.bottom = height / -2.0;
    camera_user_data.aspect = width / height;

    if (camera_user_data.is_perspective) {
        camera.aspect = camera_user_data.aspect;
    } else {
        camera.left = camera_user_data.left;
        camera.right = camera_user_data.right;
        camera.top = camera_user_data.top;
        camera.bottom = camera_user_data.bottom;
    }
    camera.updateProjectionMatrix();
}

function camera_to_perspective() {
    camera_user_data.is_perspective = true;
    camera = new THREE.PerspectiveCamera(60, camera_user_data.aspect, 1, 10000);
    camera_update(camera);
    camera.updateProjectionMatrix();
}

function camera_to_ortho() {
    camera_user_data.is_perspective = false;
    camera = new THREE.OrthographicCamera(camera_user_data.left, camera_user_data.right, camera_user_data.top, camera_user_data.bottom, 1, 10000);
    camera_update(camera);
    camera.updateProjectionMatrix();
}

function camera_top(camera) {
    camera_user_data.phi = 180;
    camera_user_data.theta = 0;
    camera_update(camera);
}

function camera_front(camera) {
    camera_user_data.phi = 0;
    camera_user_data.theta = 360;
    camera_update(camera);
}

function camera_back(camera) {
    camera_user_data.phi = 0;
    camera_user_data.theta = 0;
    camera_update(camera);
}

function camera_right(camera) {
    camera_user_data.phi = 0;
    camera_user_data.theta = 180;
    camera_update(camera);
}

function camera_left(camera) {
    camera_user_data.phi = 0;
    camera_user_data.theta = -180;
    camera_update(camera);
}
