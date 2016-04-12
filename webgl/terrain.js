function Octree(origin, half_dimension, data) {
    this.origin = origin ? origin : { x: 0, y: 0, z: 0 };
    this.half_dimension = half_dimension ? half_dimension : 0;
    this.data = data ? data : null;
    this.children = new Array(8);
    for (var i = 0; i < this.children.length; i++) {
        this.children[i] = null;
    }
}

Octree.prototype.is_leaf_node = function() {
    return this.children[0] === null;
};

function Terrain(block_size, grid_size) {
    this.list_of_block_names = [];
    this.block_size = block_size;
    this.grid_size = grid_size;
    this.dimensions = new THREE.Vector2(block_size * grid_size.x, block_size * grid_size.y);
    this.line_offset = 2 * block_size;
    this.grid_middle = Math.round(grid_size / 2);
    this.blocks = new Array(grid_size.x * grid_size.y);
    this.num_blocks = 0;
}

function generate_random_block_name() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 13; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function terrain_add_block(terrain, gx, gy, block, scene) {
    var index = gx + terrain.grid_size.x * gy;
    if (index >= terrain.blocks.length) {
        console.log('Invalid terrain index.');
        return;
    }
    if (!terrain.blocks[index] || !(terrain.blocks[index] instanceof Array)) {
        terrain.blocks[index] = [];
    }

    var sum_height = 0;
    for (var i = 0; i < terrain.blocks[index].length; i++) {
        sum_height += terrain.blocks[index][i].block_height;
    }

    var block_name = generate_random_block_name();
    while (terrain.list_of_block_names.indexOf(block_name) != -1) {
        block_name = generate_random_block_name();
    }
    terrain.list_of_block_names.push(block_name);

    block.block_name = block_name;
    block.center_y = sum_height + block.block_height * 0.5;
    terrain.blocks[index].push(block);
    terrain.num_blocks++;
    var geometry = new THREE.BoxGeometry(terrain.block_size, block.block_height, terrain.block_size);
    var material = new THREE.MeshBasicMaterial( {color: block.block_colour} );
    var cube = new THREE.Mesh(geometry, material);
    cube.name = block.block_name;
    scene.add(cube);
}

function terrain_remove_block(terrain, gx, gy, block, scene) {
    var index = gx + terrain.grid_size.x * gy;
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

    var block_name = terrain.blocks[index][terrain.blocks[index].length - 1].block_name;
    terrain.blocks[index].pop();
    var index = jQuery.inArray(block_name, terrain.list_of_block_names);
    if (index !== -1) {
        terrain.list_of_block_names.splice(index, 1);
    }
    var selectedObject = scene.getObjectByName(block_name);
    scene.remove(selectedObject);
}

function Block(block_height, block_colour, center_y, block_name) {
    this.block_height = block_height;
    this.block_colour = block_colour;
    this.center_y = center_y == undefined ? 0 : center_y;
    this.block_name = block_name == undefined ? "" : block_name;
}
