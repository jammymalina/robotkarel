const BLOCK_SIZE = 50;
const BLOCK_HEIGHT = 15;

function Terrain(block_size, grid_size) {
    let self = this;
    this.list_of_block_names = [];
    this.block_size = block_size;
    this.grid_size = grid_size;
    this.dimensions = new THREE.Vector2(block_size * grid_size.x, block_size * grid_size.y);
    this.line_offset = 0;
    this.grid_middle = new THREE.Vector2(
        Math.round(self.grid_size.x / 2),
        Math.round(self.grid_size.y / 2)
    );
    this.origin_offset = new THREE.Vector2(
        -0.5 * self.dimensions.x,
        0.5 * self.dimensions.y
    );
    this.blocks = new Array(grid_size.x * grid_size.y);
    for (let i = 0; i < this.blocks.length; i++) {
        this.blocks[i] = null;
    }
    this.num_blocks = 0;
}

function generate_random_block_name() {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 13; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function terrain_valid_index(gx, gy) {
    if (gx < 0 || gx >= terrain.grid_size.x) return false;
    if (gy < 0 || gy >= terrain.grid_size.y) return false;
    return true;
}

function terrain_index(gx, gy) {
    return gx + terrain.grid_size.x * gy;
}

function resize_terrain(grid_size) {
}

function terrain_height(gx, gy) {
    if (!terrain_valid_index(gx, gy)) return;
    let index = terrain_index(gx, gy);
    if (index >= terrain.blocks.length) {
        console.log('Invalid terrain index.');
        return;
    }
    if (!terrain.blocks[index] || !(terrain.blocks[index] instanceof Array)) {
        return 0;
    }
    let sum_height = 0;
    for (let i = 0; i < terrain.blocks[index].length; i++) {
        sum_height += terrain.blocks[index][i].block_height;
    }
    return sum_height;
}

function terrain_transform_robot_coords(gx, gy) {
    return new THREE.Vector2(
        (gx * terrain.block_size + 0.5 * terrain.block_size) + terrain.origin_offset.x,
        (-robot.y * terrain.block_size - 0.5 * terrain.block_size) + terrain.origin_offset.y
    );
}

function terrain_add_block(gx, gy, block, scene) {
    if (!terrain_valid_index(gx, gy)) return;
    let index = terrain_index(gx, gy);
    if (index >= terrain.blocks.length) {
        console.log('Invalid terrain index.');
        return;
    }
    if (!terrain.blocks[index] || !(terrain.blocks[index] instanceof Array)) {
        terrain.blocks[index] = [];
    }

    let sum_height = 0;
    for (let i = 0; i < terrain.blocks[index].length; i++) {
        sum_height += terrain.blocks[index][i].block_height;
    }

    let block_name = generate_random_block_name();
    while (terrain.list_of_block_names.indexOf(block_name) != -1) {
        block_name = generate_random_block_name();
    }
    terrain.list_of_block_names.push(block_name);

    block.block_name = block_name;
    block.center_y = sum_height + block.block_height * 0.5;
    terrain.blocks[index].push(block);
    terrain.num_blocks++;
    let geometry = new THREE.BoxGeometry(terrain.block_size, block.block_height, terrain.block_size);
    let material = new THREE.MeshLambertMaterial({
        color: block.block_colour
    });
    let cube = new THREE.Mesh(geometry, material);
    cube.matrixAutoUpdate = false;
    let real_coords = terrain_transform_robot_coords(gx, gy);
    cube.position.set(real_coords.x, block.center_y, real_coords.y);
    cube.updateMatrix();
    cube.name = block.block_name;
    scene.add(cube);
}

function terrain_remove_block(gx, gy, scene) {
    if (!terrain_valid_index(gx, gy)) return;
    let index = terrain_index(gx, gy);
    if (index >= terrain.blocks.length) {
        console.log('Invalid terrain index.');
        return;
    }
    if (!terrain.blocks[index] || !(terrain.blocks[index] instanceof Array)) {
        return;
    }
    if (terrain.blocks[index].length <= 0) {
        return;
    }

    let block_name = terrain.blocks[index][terrain.blocks[index].length - 1].block_name;
    terrain.blocks[index].pop();
    index = terrain.list_of_block_names.indexOf(block_name);
    if (index !== -1) {
        terrain.list_of_block_names.splice(index, 1);
    }
    let selectedObject = scene.getObjectByName(block_name);
    scene.remove(selectedObject);
}

function terrain_clear() {
    for (let i = 0; i < terrain.list_of_block_names.length; i++) {
        let block_name = terrain.list_of_block_names[i];
        let selectedObject = scene.getObjectByName(block_name);
        scene.remove(selectedObject);
    }
    terrain.list_of_block_names = [];
    for (i = 0; i < terrain.blocks.length; i++) {
        terrain.blocks[i] = null;
    }
}

function terrain_get_count(index) {
    if (index > terrain.blocks.length) return 0;
    if (!terrain.blocks[index] || !(terrain.blocks[index] instanceof Array)) {
        return 0;
    }
    return Math.max(0, terrain.blocks[index].length);
}

function is_wall(old_x, old_y, new_x, new_y) {
    if (!terrain_valid_index(old_x, old_y)) return false;
    if (!terrain_valid_index(new_x, new_y)) return false;
    let old_index = terrain_index(old_x, old_y);
    let new_index = terrain_index(new_x, new_y);
    if (old_index >= terrain.blocks.length || new_index >= terrain.blocks.length) {
        console.log('Invalid terrain index.');
        return true;
    }
    let old_height = terrain_get_count(old_index);
    let new_height = terrain_get_count(new_index);
    return (new_height - old_height) >= 2;
}

function is_pit(old_x, old_y, new_x, new_y) {
    if (!terrain_valid_index(old_x, old_y)) return true;
    if (!terrain_valid_index(new_x, new_y)) return true;
    let old_index = terrain_index(old_x, old_y);
    let new_index = terrain_index(new_x, new_y);
    if (old_index >= terrain.blocks.length || new_index >= terrain.blocks.length) {
        console.log('Invalid terrain index.');
        return true;
    }
    let old_height = terrain_get_count(old_index);
    let new_height = terrain_get_count(new_index);
    return (new_height - old_height) <= -2;
}

function is_tile(gx, gy) {
    if (!terrain_valid_index(gx, gy)) return false;
    let index = terrain_index(gx, gy);
    if (index > terrain.blocks.length) {
        console.log('Invalid terrain index.');
        return false;
    }
    return terrain_get_count(index) > 0;
}

function Block(block_height, block_colour, center_y, block_name) {
    this.block_height = block_height;
    this.block_colour = block_colour;
    this.center_y = center_y === undefined ? 0 : center_y;
    this.block_name = block_name === undefined ? "" : block_name;
}
