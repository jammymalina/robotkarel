const CLEAR_COLOUR = 0xffffff;
const GROUND_COLOUR = 0xffffff;

const DEG_TO_RAD = Math.PI / 180.0;
const RAD_TO_DEG = 180.0 / Math.PI;

function mod(n, m) {
	return ((n % m) + m) % m;
}

let scene, camera, renderer, terrain, clock, time, timedelta, robot_box;

let canvas_mouse_info = {
    last_mouse_position: new THREE.Vector2(0.0, 0.0),
    current_mouse_position: new THREE.Vector2(0.0, 0.0),
    delta_position: new THREE.Vector2(0.0, 0.0),
    left_button_pressed: false,
    right_button_pressed: false
};

function init_WebGL(container) {
    //let CUBE_GEOMETRY = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(1, 1, 1));

    // basic setup
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 1, 5000);
    scene.fog.color.setHSL(0.6, 0, 1);

    terrain = new Terrain(BLOCK_SIZE, new THREE.Vector2(21, 21));

    clock = new THREE.Clock();
    time = clock.getElapsedTime();
    timedelta = clock.getDelta();

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(CLEAR_COLOUR);
    renderer.setSize(container.innerWidth(), container.innerHeight());

    container[0].appendChild(renderer.domElement);

	let transparent_box_material = new THREE.MeshBasicMaterial({
		transparent: true,
		opacity: 0.8,
		color: 0x45b0e6
	});
    let geometry = new THREE.BoxGeometry(terrain.block_size, BLOCK_HEIGHT, terrain.block_size);
	robot_box = new THREE.Mesh(geometry, transparent_box_material);
	robot_box.matrixAutoUpdate = false;
	scene.add(robot_box);

    camera = new THREE.PerspectiveCamera(60, 16.0 / 9.0, 1, 10000);
	//camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
    camera.matrixAutoUpdate = false;
    camera_init(camera, 800, 60, 45);

    // grid & ground
    geometry = new THREE.BufferGeometry();
    let line_material = new THREE.LineBasicMaterial({
        color: 0x999999,
    });

    let positions = new Float32Array((terrain.grid_size.x + 1) * 6 + (terrain.grid_size.y + 1) * 6);
    let pos_index = 0;
    for (var x = 0; x <= terrain.grid_size.x; x++) {
        positions[pos_index + 0] = (x * terrain.block_size) - terrain.dimensions.x * 0.5;
        positions[pos_index + 1] = 0;
        positions[pos_index + 2] = -0.5 * terrain.dimensions.y - terrain.line_offset;

        positions[pos_index + 3] = (x * terrain.block_size) - terrain.dimensions.x * 0.5;
        positions[pos_index + 4] = 0;
        positions[pos_index + 5] = 0.5 * terrain.dimensions.y + terrain.line_offset;
        pos_index += 6;
    }

    for (var z = 0; z <= terrain.grid_size.y; z++) {
        positions[pos_index + 0] = -0.5 * terrain.dimensions.x - terrain.line_offset;
        positions[pos_index + 1] = 0;
        positions[pos_index + 2] = (z * terrain.block_size) - terrain.dimensions.y * 0.5;

        positions[pos_index + 3] = 0.5 * terrain.dimensions.x + terrain.line_offset;
        positions[pos_index + 4] = 0;
        positions[pos_index + 5] = (z * terrain.block_size) - terrain.dimensions.y * 0.5;
        pos_index += 6;
    }
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();

    let grid_mesh = new THREE.LineSegments(geometry, line_material);
    scene.add(grid_mesh);

    /*let ground_material = new THREE.MeshLambertMaterial({
        color: GROUND_COLOUR
    });
    let ground_mesh = new THREE.Mesh(CUBE_GEOMETRY, ground_material);
    ground_mesh.matrixAutoUpdate = false;
    ground_mesh.scale.set(1.5 * terrain.dimensions.x, 20, 1.5 * terrain.dimensions.y);
    ground_mesh.position.y -= ground_mesh.scale.y * 0.5;
    ground_mesh.updateMatrix();
    scene.add(ground_mesh);*/

    load_model(['robot'], 'models/robot/robot3.obj', 'models/robot/robot3.png',
        new THREE.Vector3(0, 50, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(ROBOT_MESH.SCALE, ROBOT_MESH.SCALE, ROBOT_MESH.SCALE), scene);
    //load_model(['left_prop'], 'models/robot/prop2.obj', 'models/robot/prop2.png',
        //new THREE.Vector3(0, 50, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(ROBOT_MESH.SCALE, ROBOT_MESH.SCALE, ROBOT_MESH.SCALE), scene);

    // lights
    let ambient = new THREE.AmbientLight(0x444444);
    scene.add(ambient);

    let directional_light = new THREE.DirectionalLight(0xffffff);
    directional_light.position.x = 1;
    directional_light.position.y = 1;
    directional_light.position.z = 0.75;
    directional_light.position.normalize();
    scene.add(directional_light);

    animate();
}

function resize_WebGL(width, height) {
	if (!renderer || !camera) return;
    renderer.setSize(width, height);
	camera_resize(camera, width, height);
}

function update() {
    time = clock.getElapsedTime();
    timedelta = clock.getDelta();

    if (models_3d['robot']) {
		let sum_height = terrain_height(robot.x, robot.y);
		let real_coords = terrain_transform_robot_coords(robot.x, robot.y);
        models_3d['robot'].rotation.y = ROBOT_ANGLES[robot.direction] !== undefined ? ROBOT_ANGLES[robot.direction] : 0;
        models_3d['robot'].position.x = real_coords.x;
		models_3d['robot'].position.y = sum_height + ROBOT_MESH.DELTA_HEIGHT;
		models_3d['robot'].position.z = real_coords.y;
        models_3d['robot'].updateMatrix();

		robot_box.position.set(models_3d['robot'].position.x, sum_height + BLOCK_HEIGHT * 0.5, models_3d['robot'].position.z);
		robot_box.updateMatrix();
    }

    if (models_3d['robot'] && models_3d['left_prop'] && models_3d['right_prop']) {
        models_3d['left_prop'].rotation.y += ROBOT_MESH.PROP_SPEED * timedelta;
        if (robot.direction == ROBOT_DIRECTION.NORTH) {
            models_3d['left_prop'].position.x = models_3d['robot'].position.x - ROBOT_MESH.PROP_DIST.LEFT * ROBOT_MESH.SCALE;
            models_3d['left_prop'].position.y = models_3d['robot'].position.y + ROBOT_MESH.PROP_DIST.TOP * ROBOT_MESH.SCALE;
        }
        models_3d['left_prop'].updateMatrix();
    }
}

function render() {
	if (!renderer) return;
    renderer.render(scene, camera);
}

function animate(mouseinfo) {
    requestAnimationFrame(animate);
    update();
    render();
}
