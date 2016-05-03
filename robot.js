const ROBOT_DIRECTION = {
    NORTH: 1,
    EAST: 2,
    SOUTH: 3,
    WEST: 4
};

let ROBOT_ANGLES = {};
ROBOT_ANGLES[ROBOT_DIRECTION.NORTH] = 0;
ROBOT_ANGLES[ROBOT_DIRECTION.SOUTH] = Math.PI;
ROBOT_ANGLES[ROBOT_DIRECTION.EAST] = -0.5 * Math.PI;
ROBOT_ANGLES[ROBOT_DIRECTION.WEST] = 0.5 * Math.PI;

const ROBOT_MESH = {
    SCALE: 2.5,
    DELTA_HEIGHT: 30,
    PROP_SPEED: 5000,
    PROP_DIST: {
        TOP: 10,
        LEFT: 10,
    }
};

let robot = {
    direction: ROBOT_DIRECTION.NORTH,
    x: 0,
    y: 0
};

function reset_robot(x, y, direction) {
    robot.x = x;
    robot.y = y;
    robot.direction = direction;
}

function robot_turn_left() {
    switch (robot.direction) {
        case ROBOT_DIRECTION.NORTH:
            robot.direction = ROBOT_DIRECTION.WEST;
            break;
        case ROBOT_DIRECTION.EAST:
            robot.direction = ROBOT_DIRECTION.NORTH;
            break;
        case ROBOT_DIRECTION.SOUTH:
            robot.direction = ROBOT_DIRECTION.EAST;
            break;
        case ROBOT_DIRECTION.WEST:
            robot.direction = ROBOT_DIRECTION.SOUTH;
            break;
        default:
            robot.direction = ROBOT_DIRECTION.NORTH;
    }
}

function robot_turn_right() {
    switch (robot.direction) {
        case ROBOT_DIRECTION.NORTH:
            robot.direction = ROBOT_DIRECTION.EAST;
            break;
        case ROBOT_DIRECTION.EAST:
            robot.direction = ROBOT_DIRECTION.SOUTH;
            break;
        case ROBOT_DIRECTION.SOUTH:
            robot.direction = ROBOT_DIRECTION.WEST;
            break;
        case ROBOT_DIRECTION.WEST:
            robot.direction = ROBOT_DIRECTION.NORTH;
            break;
        default:
            robot.direction = ROBOT_DIRECTION.NORTH;
    }
}

function robot_get_forward_field() {
    let new_x = robot.x, new_y = robot.y;
    switch (robot.direction) {
        case ROBOT_DIRECTION.NORTH:
            new_y += 1;
            break;
        case ROBOT_DIRECTION.EAST:
            new_x += 1;
            break;
        case ROBOT_DIRECTION.SOUTH:
            new_y -= 1;
            break;
        case ROBOT_DIRECTION.WEST:
            new_x -= 1;
            break;
        default:
            new_x = robot.x;
            new_y = robot.y;
    }
    return {
        x: new_x,
        y: new_y
    };
}

function robot_move_forward(pit_col_function, wall_col_func) {
    let new_coords = robot_get_forward_field();
    if (is_pit(robot.x, robot.y, new_coords.x, new_coords.y)) {
        if (pit_col_function && pit_col_function.type == "function") {
            if (interpreter) {
                interpreter.execution_stack.unshift({
                    node: pit_col_function.node.body
                });
            }
        }
        return;
    } else if (is_wall(robot.x, robot.y, new_coords.x, new_coords.y)) {
        if (wall_col_func && wall_col_func.type == "function") {
            if (interpreter) {
                interpreter.execution_stack.unshift({
                    node: wall_col_func.node.body
                });
            }
        }
    }
    robot.x = new_coords.x;
    robot.y = new_coords.y;
}

function robot_lay_tile_colour(col)  {
    terrain_add_block(robot.x, robot.y, new Block(BLOCK_HEIGHT, col), scene);
}

function robot_remove_tile(failed_rem_func) {
    if (!robot_is_tile()) {
        if (failed_rem_func && failed_rem_func.type == "function") {
            if (interpreter) {
                interpreter.execution_stack.unshift({
                    node: failed_rem_func.node.body
                });
            }
        }
    }
    terrain_remove_block(robot.x, robot.y, scene);
}

function robot_is_wall() {
    let new_coords = robot_get_forward_field();
    return is_wall(robot.x, robot.y, new_coords.x, new_coords.y);
}

function robot_is_pit() {
    let new_coords = robot_get_forward_field();
    return is_pit(robot.x, robot.y, new_coords.x, new_coords.y);
}

function robot_is_tile() {
    return is_tile(robot.x, robot.y);
}
