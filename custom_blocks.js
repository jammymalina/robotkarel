const FUNC_PREFIX = 'func_';

function convert_blockly_colour_to_num(blockly_colour) {
    if (blockly_colour[0] == '#') {
        return '0x' + blockly_colour.substr(1);
    }
    return blockly_colour;
}

Blockly.Blocks['run_block'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Po spustení");
        this.appendStatementInput("run_block")
            .setCheck(null);
        this.setColour(120);
        this.setTooltip('Čo sa udeje po spustení');
    }
};

Blockly.JavaScript['run_block'] = function(block) {
    var statements_run_block = Blockly.JavaScript.statementToCode(block, 'run_block');
    var code = '' + statements_run_block + '';
    return code;
};

Blockly.Blocks['wall_col_block'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Po takmer narazení robota do steny");
        this.appendStatementInput("wall_col_block")
            .setCheck(null);
        this.setColour(120);
        this.setTooltip('Čo sa udeje po narazení robota do steny');
    }
};

Blockly.JavaScript['wall_col_block'] = function(block) {
    var statements_run_block = Blockly.JavaScript.statementToCode(block, 'wall_col_block');
    var code = 'custom_func["wall"] = function() {' + statements_run_block + '}';
    return code;
};

Blockly.Blocks['pit_col_block'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Po takmer spadnutí robota do priepasti");
        this.appendStatementInput("pit_col_block")
            .setCheck(null);
        this.setColour(120);
        this.setTooltip('Čo sa udeje po takmer spadnutí robota do priepasti');
    }
};

Blockly.JavaScript['pit_col_block'] = function(block) {
    var statements_run_block = Blockly.JavaScript.statementToCode(block, 'pit_col_block');
    var code = 'custom_func["pit"] = function() {' + statements_run_block + '}';
    return code;
};

Blockly.Blocks['remove_fail_block'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Po zlyhaní odstránenia dlaždice");
        this.appendStatementInput("remove_fail_block")
            .setCheck(null);
        this.setColour(120);
        this.setTooltip('Čo sa udeje po zlyhaní odstránenia dlaždice');
    }
};

Blockly.JavaScript['remove_fail_block'] = function(block) {
    var statements_run_block = Blockly.JavaScript.statementToCode(block, 'remove_fail_block');
    var code = 'custom_func["tile"] = function() {' + statements_run_block + '}';
    return code;
};

Blockly.Blocks['turn_left'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("otoč vľavo");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(app_settings.block_command_colour);
        this.setTooltip('Otočí robota vľavo');
    }
};

Blockly.JavaScript['turn_left'] = function(block) {
    var code = 'robot_turn_left();';
    return code;
};

Blockly.Blocks['turn_right'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("otoč vpravo");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(app_settings.block_command_colour);
        this.setTooltip('Otočí robota vpravo');
    }
};

Blockly.JavaScript['turn_right'] = function(block) {
    var code = 'robot_turn_right();';
    return code;
};

Blockly.Blocks['move_forward'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("choď dopredu");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(app_settings.block_command_colour);
        this.setTooltip('Posunie robota dopredu');
    }
};

Blockly.JavaScript['move_forward'] = function(block) {
    var code = 'robot_move_forward(custom_func["pit"], custom_func["wall"]);';
    return code;
};

Blockly.Blocks['lay_tile'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("polož dlaždicu")
            .appendField(new Blockly.FieldColour("#ff0000"), "tile_colour");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(app_settings.block_command_colour);
        this.setTooltip('Položí dlaždicu na pozíciu robota');
    }
};

Blockly.JavaScript['lay_tile'] = function(block) {
    var colour_tile_colour = block.getFieldValue('tile_colour');
    var code = 'robot_lay_tile_colour(' + convert_blockly_colour_to_num(colour_tile_colour) + ');';
    return code;
};

Blockly.Blocks['remove_tile'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("odstráň dlaždicu");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(app_settings.block_command_colour);
        this.setTooltip('Odstráni dlaždicu spod robota');
    }
};

Blockly.JavaScript['remove_tile'] = function(block) {
    var code = 'robot_remove_tile(custom_func["tile"]);';
    return code;
};

Blockly.Blocks['is_wall'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("stena");
    this.setOutput(true, "Boolean");
    this.setColour(160);
    this.setTooltip('Zisťuje či je pred robotom stena');
  }
};

Blockly.JavaScript['is_wall'] = function(block) {
  var code = 'robot_is_wall()';
  return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

Blockly.Blocks['is_pit'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("priepasť");
    this.setOutput(true, "Boolean");
    this.setColour(160);
    this.setTooltip('Zisťuje či je pred robotom priepasť alebo okraj vymedzenej plochy');
  }
};

Blockly.JavaScript['is_pit'] = function(block) {
  var code = 'robot_is_pit()';
  return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

Blockly.Blocks['is_tile'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("dlaždica");
    this.setOutput(true, "Boolean");
    this.setColour(160);
    this.setTooltip('Zisťuje či je pod robotom dlaždica');
  }
};

Blockly.JavaScript['is_tile'] = function(block) {
  var code = 'robot_is_tile()';
  return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

Blockly.Blocks['function_create'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("funkcia")
        .appendField(new Blockly.FieldTextInput("tvoj_podprogram"), "function_name");
    this.appendStatementInput("function_body")
        .setCheck(null);
    this.setColour(260);
    this.setTooltip('Vytvor si vlastný podprogram');
  }
};

Blockly.JavaScript['function_create'] = function(block) {
  var text_function_name = block.getFieldValue('function_name');
  var statements_function_body = Blockly.JavaScript.statementToCode(block, 'function_body');
  var code = 'function ' + (FUNC_PREFIX + text_function_name).trim() + '() {' + statements_function_body + '}';
  return code;
};

Blockly.Blocks['function_call'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("funkcia")
        .appendField(new Blockly.FieldTextInput("tvoj_podprogram"), "function_name");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(260);
    this.setTooltip('Zavolá tvoj podprogram');
    }
};

Blockly.JavaScript['function_call'] = function(block) {
  var text_function_name = block.getFieldValue('function_name');
  var code = 'if (typeof ' + (FUNC_PREFIX +  text_function_name).trim() + ' == "function")' + FUNC_PREFIX + text_function_name + '();' ;
  return code;
};
