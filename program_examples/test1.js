function blockly_program_init() {
    robot_turn_left();
    robot_turn_left();
    robot_turn_right();
    robot_lay_tile_colour(0xffff66);
    for (var count = 0; count < 4; count++) {
        robot_move_forward();
        robot_move_forward();
    }
}
