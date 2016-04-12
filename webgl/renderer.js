const CLEAR_COLOUR = 0xffffff;
const GROUND_COLOUR = 0xffffff;

const SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 1024;

let scene, camera, renderer, terrain, clock, time, timedelta, robot;


let canvas_mouse_info = {
    last_mouse_position: new THREE.Vector2(0, 0),
    current_mouse_position: new THREE.Vector2(0, 0),
    delta_position: new THREE.Vector2(0, 0),
    left_button_pressed: false,
    right_button_pressed: false
};

function init_WebGL(container) {
    let CUBE_GEOMETRY = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(1, 1, 1));

    // basic setup
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 1, 5000);
    scene.fog.color.setHSL(0.6, 0, 1);

    terrain = new Terrain(50, new THREE.Vector2(31, 31));

    clock = new THREE.Clock();
    time = clock.getElapsedTime();
    timedelta = clock.getDelta();

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setClearColor(CLEAR_COLOUR);
    renderer.setSize(container.innerWidth(), container.innerHeight());
    renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container[0].appendChild(renderer.domElement);

    var geometry = new THREE.BoxGeometry(40, 40, 40);
    robot = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 0xff0000 }));
    robot.position.y = 50;
    robot.receiveShadow = true;
    robot.castShadow = true;
    scene.add(robot);

    camera = new THREE.PerspectiveCamera(60, app_settings.canvas_ratio, 1, 10000);
    camera.matrixAutoUpdate = false;
    camera.userData.robot = robot;
    camera_init(camera, 0, 40, 600, 0);

    // grid & ground
    geometry = new THREE.BufferGeometry();
    let line_material = new THREE.LineBasicMaterial({
        color: 0xbbbbbb,
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

    let ground_material = new THREE.MeshLambertMaterial({
        color: GROUND_COLOUR
    });
    let ground_mesh = new THREE.Mesh(CUBE_GEOMETRY, ground_material);
    ground_mesh.matrixAutoUpdate = false;
    ground_mesh.scale.set(1.5 * terrain.dimensions.x, 20, 1.5 * terrain.dimensions.y);
    ground_mesh.position.y -= ground_mesh.scale.y * 0.5;
    ground_mesh.updateMatrix();
    ground_mesh.castShadow = false;
	ground_mesh.receiveShadow = true;
    scene.add(ground_mesh);

    // lights
    let ambient = new THREE.AmbientLight(0x444444);
    scene.add(ambient);

    let directional_light = new THREE.DirectionalLight(0xffffff);
    directional_light.position.x = 1;
    directional_light.position.y = 1;
    directional_light.position.z = 0.75;
    directional_light.position.normalize();
    directional_light.castShadow = true;
	directional_light.shadowCameraNear = 700;
    console.log(camera.far);
	directional_light.shadowCameraFar = camera.far;
	directional_light.shadowCameraFov = 50;
	directional_light.shadowCameraVisible = true;
	directional_light.shadowBias = 0.0001;
	directional_light.shadowMapWidth = SHADOW_MAP_WIDTH;
	directional_light.shadowMapHeight = SHADOW_MAP_HEIGHT;
    scene.add(directional_light);

    animate();
}

function add_mesh() {}

function resize_WebGL(width, height) {
    renderer.setSize(width, height);
}

function update() {
    time = clock.getElapsedTime();
    timedelta = clock.getDelta();
    camera_move(camera, canvas_mouse_info);
}

function render() {
    renderer.render(scene, camera);
}

function animate(mouseinfo) {
    requestAnimationFrame(animate);
    update();
    render();
}
