const ROBOT_DIRECTION = {
    NORTH: 1,
    EAST: 2,
    SOUTH: 3,
    WEST: 4
};

class Robot {
    constructor(x, y, direction, terrain) {
        this.x = x;
        this.y = y;
        this._direction = direction;
        this._terrain = terrain;
    }

    turn_left() {
        switch (this._direction) {
            case ROBOT_DIRECTION.NORTH:
                this._direction = ROBOT_DIRECTION.WEST;
                break;
            case ROBOT_DIRECTION.EAST:
                this._direction = ROBOT_DIRECTION.NORTH;
                break;
            case ROBOT_DIRECTION.SOUTH:
                this._direction = ROBOT_DIRECTION.EAST;
                break;
            case ROBOT_DIRECTION.WEST:
                this._direction = ROBOT_DIRECTION.SOUTH;
                break;
            default:
                this._direction = ROBOT_DIRECTION.NORTH;
        }
    }

    turn_right() {
        switch (this._direction) {
            case ROBOT_DIRECTION.NORTH:
                this._direction = ROBOT_DIRECTION.EAST;
                break;
            case ROBOT_DIRECTION.EAST:
                this._direction = ROBOT_DIRECTION.SOUTH;
                break;
            case ROBOT_DIRECTION.SOUTH:
                this._direction = ROBOT_DIRECTION.WEST;
                break;
            case ROBOT_DIRECTION.WEST:
                this._direction = ROBOT_DIRECTION.NORTH;
                break;
            default:
                this._direction = ROBOT_DIRECTION.NORTH;
        }
    }

    get direction() {
        return this._direction;
    }
}
