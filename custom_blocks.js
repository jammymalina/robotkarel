console.log(app_settings.block_command_colour);

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
            .appendField("choď dopredu")
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(app_settings.block_command_colour);
        this.setTooltip('Posunie robota dopredu');
    }
};

Blockly.JavaScript['move_forward'] = function(block) {
    var code = 'robot_move_forward();';
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
    var code = 'robot_remove_tile();';
    return code;
};

Blockly.Blocks['procedure'] = {
    init: function() {
        this.appendValueInput("function_name")
            .setCheck("String")
            .appendField("funkcia");
        this.appendStatementInput("function_body")
            .setCheck(null);
        this.setColour(120);
        this.setTooltip('Vytvor si vlastnú funkciu');
    }
};

Blockly.JavaScript['procedure'] = function(block) {
    var value_function_name = Blockly.JavaScript.valueToCode(block, 'function_name', Blockly.JavaScript.ORDER_ATOMIC);
    var statements_function_body = Blockly.JavaScript.statementToCode(block, 'function_body');
    var code = 'function ' +  value_function_name.trim() + '() { ' + statements_function_body + ' }';
    return code;
};
