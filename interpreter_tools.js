const INTERPRETER_SPEED = {
    SLOW: 500,
    MID: 250,
    FAST: 50
};

function is_valid_function_name(s) {
    let valid_name = /^[$A-Z_][0-9A-Z_$]*$/i;
    return valid_name.test(s);
}

let interpreter, finished_interpreter, interpreter_is_animating, step_button, highlight_pause, workspace, robot_toolboxes, current_interpreter_speed, interpreter_timeout, current_program_file;

function error(msg) {
    bootbox.alert(msg);
}

function init_interpreter(blocks_div) {
    interpreter = null;
    finished_interpreter = true;
    interpreter_is_animating = false;
    current_interpreter_speed = INTERPRETER_SPEED.MID;
    robot_toolboxes = {
        "1": $('#robot_toolbox_beginner')[0],
    };
    workspace = Blockly.inject(blocks_div, {
        toolbox: robot_toolboxes[1],
        zoom: {
            controls: true,
            wheel: false,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        trashcan: true
    });
    workspace.addChangeListener(function(event) {
        check_workspace();
    });

    Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
    Blockly.JavaScript.addReservedWords('highlightBlock');
    Blockly.JavaScript.addReservedWords('log');
    Blockly.JavaScript.addReservedWords('robot_move_forward');
    Blockly.JavaScript.addReservedWords('robot_lay_tile_colour');
    Blockly.JavaScript.addReservedWords('robot_remove_tile');
    Blockly.JavaScript.addReservedWords('robot_lay_tile_colour');
    Blockly.JavaScript.addReservedWords('robot_is_wall');
    Blockly.JavaScript.addReservedWords('robot_is_pit');
    Blockly.JavaScript.addReservedWords('robot_turn_right');
    Blockly.JavaScript.addReservedWords('robot_turn_left');

    //step_button.prop("disabled", true);
    restore_workspace();
}

function highlightBlock(id) {
    workspace.highlightBlock(id);
    highlight_pause = true;
}

function init_interpreter_api(interpreter, scope) {
    let wrapper = function(id) {
        id = id ? id.toString() : '';
        return interpreter.create_primitive(highlightBlock(id));
    };
    interpreter.set_property(scope, 'highlightBlock', interpreter.to_basic_js_function(wrapper));
    wrapper = function(pit_col_func, wall_col_func) {
        return interpreter.create_primitive(robot_move_forward(pit_col_func, wall_col_func));
    };
    interpreter.set_property(scope, 'robot_move_forward', interpreter.to_basic_js_function(wrapper));
    wrapper = function() {
        return interpreter.create_primitive(robot_turn_left());
    };
    interpreter.set_property(scope, 'robot_turn_left', interpreter.to_basic_js_function(wrapper));
    wrapper = function() {
        return interpreter.create_primitive(robot_turn_right());
    };
    interpreter.set_property(scope, 'robot_turn_right', interpreter.to_basic_js_function(wrapper));
    wrapper = function() {
        return interpreter.create_primitive(robot_is_wall());
    };
    interpreter.set_property(scope, 'robot_is_wall', interpreter.to_basic_js_function(wrapper));
    wrapper = function() {
        return interpreter.create_primitive(robot_is_pit());
    };
    interpreter.set_property(scope, 'robot_is_pit', interpreter.to_basic_js_function(wrapper));
    wrapper = function() {
        return interpreter.create_primitive(robot_is_tile());
    };
    interpreter.set_property(scope, 'robot_is_tile', interpreter.to_basic_js_function(wrapper));
    wrapper = function(col) {
        col = col ? col.toNumber() : 0x000000;
        return interpreter.create_primitive(robot_lay_tile_colour(col));
    };
    interpreter.set_property(scope, 'robot_lay_tile_colour', interpreter.to_basic_js_function(wrapper));
    wrapper = function(remove_fail_func) {
        return interpreter.create_primitive(robot_remove_tile(remove_fail_func));
    };
    interpreter.set_property(scope, 'robot_remove_tile', interpreter.to_basic_js_function(wrapper));
    wrapper = function(msg) {
        console.log(msg);
    };
    interpreter.set_property(scope, 'log', interpreter.to_basic_js_function(wrapper));
}

function parse_code() {
    if (!finished_interpreter) {
        return;
    }
    let code = assemble_code();
    //code = 'var custom_func = {}; custom_func["pit"] = function() { var x = 1 + 1; }; log("hej hej hej"); custom_func["pit"]();';
    if (!code || code === "") {
        finished_interpreter = true;
        return;
    }
    //step_button.prop("disabled", false);

    interpreter = new Interpreter(code, init_interpreter_api);
    finished_interpreter = false;

    highlight_pause = false;
    workspace.traceOn(true);
    workspace.highlightBlock(null);
}

function step_code(msg) {
    if (!interpreter) return;
    let ok = interpreter.step();
    if (!ok) {
        finished_interpreter = true;
        if (msg)
            error('Program skončil.');
        return;
    }
    if (highlight_pause) {
        highlight_pause = false;
    } else {
        step_code();
    }
}

function check_workspace() {
    let top_blocks = Blockly.mainWorkspace.getTopBlocks();
    let exclusive_blocks = {
        "run_block": {
            msg: 'blok po spustení',
            found: false
        },
        "wall_col_block": {
            msg: 'blok, ktorý reaguje na narazenie do steny',
            found: false
        },
        "pit_col_block": {
            msg: 'blok, ktorý reaguje na spadnutie do priepasti',
            found: false
        },
        "remove_fail_block": {
            msg: 'blok, ktorý reaguje na spadnutie do priepasti',
            found: false
        }
    };
    let i = 0;
    while (i < top_blocks.length) {
        if (exclusive_blocks.hasOwnProperty(top_blocks[i].type)) {
            if (exclusive_blocks[top_blocks[i].type].found) {
                error('Môžeš mať na pracovnej ploche len 1 ' + exclusive_blocks[top_blocks[i].type].msg + '.');
                top_blocks[i].dispose();
            }
            exclusive_blocks[top_blocks[i].type].found = true;
        }
        i++;
    }
    save_workspace();
}

function workspace_to_obj() {
    let xml = Blockly.Xml.workspaceToDom(workspace);
    let xml_text = Blockly.Xml.domToText(xml);

    let obj = {
        xml: xml_text
    };
    return obj;
}

function obj_to_workspace(obj) {
    if (!obj || !obj.xml) obj = JSON.parse(obj);
    if (!obj || !obj.xml) return;
    let xml = Blockly.Xml.textToDom(obj.xml);
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
}

function save_workspace() {
    let xml = Blockly.Xml.workspaceToDom(workspace);
    let xml_text = Blockly.Xml.domToText(xml);

    let obj = {
        xml: xml_text
    };
    localStorage.setItem("program", JSON.stringify(obj));
}

function restore_workspace() {
    let obj = localStorage.getItem("program");
    if (!obj) return;
    obj = JSON.parse(obj);
    if (!obj.xml) return;
    let xml = Blockly.Xml.textToDom(obj.xml);
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
}

function check_before_run() {
    let run_block_found = false;
    let top_blocks = Blockly.mainWorkspace.getTopBlocks();
    for (let i = 0; i < top_blocks.length; i++) {
        if (top_blocks[i].type == 'run_block') {
            return true;
        }
    }
    error('Chýba ti štartovací blok.');
    return false;
}

function start_animation() {
    if (interpreter_is_animating) return;
    if (finished_interpreter) parse_code();
    $("#play_button").prop("disabled", true);
    $("#step_button").prop("disabled", true);
    $("#time_button").html('<span class="glyphicon glyphicon-stop"></span>');
    interpreter_is_animating = true;
    interpreter_timeout = setTimeout(function() {
        interpreter_animate();
    }, current_interpreter_speed);
    if (finished_interpreter) stop_animation();
}

function interpreter_animate() {
    console.log(current_interpreter_speed);
    if (finished_interpreter || !interpreter_is_animating) {
        stop_animation();
    } else {
        step_code();
        setTimeout(function() {
            interpreter_animate();
        }, current_interpreter_speed);
    }
}

function stop_animation() {
    clearTimeout(interpreter_timeout);
    $("#play_button").prop("disabled", false);
    $("#step_button").prop("disabled", false);
    $("#time_button").html('<span class="glyphicon glyphicon-time"></span>');
    interpreter_is_animating = false;
}

function get_code_from_top_blocks(block_name, default_code, is_exclusive, prefix, postfix) {
    let top_blocks = Blockly.mainWorkspace.getTopBlocks();
    let result = "";
    for (let i = 0; i < top_blocks.length; i++) {
        if (top_blocks[i].type == block_name) {
            result += prefix + Blockly.JavaScript.statementToCode(top_blocks[i], top_blocks[i].type) + postfix;
            if (is_exclusive) return result;
        }
    }
    return result.trim() === "" ? default_code : result;
}

function get_code_functions() {
    let top_blocks = Blockly.mainWorkspace.getTopBlocks();
    let result = "";
    for (let i = 0; i < top_blocks.length; i++) {
        if (top_blocks[i].type == 'function_create') {
            result += Blockly.JavaScript['function_create'](top_blocks[i]);
        }
    }
    return result;
}

function assemble_code() {
    if (!check_before_run()) {
        return "";
    }
    let code = "var custom_func = {};";
    code += get_code_functions();
    code += get_code_from_top_blocks('wall_col_block', '', true, 'custom_func["wall"] = function() { ', '};');
    code += get_code_from_top_blocks('pit_col_block', '', true, 'custom_func["pit"] = function() { ', '};');
    code += get_code_from_top_blocks('remove_fail_block', '', true, 'custom_func["pit"] = function() { ', '};');
    code += get_code_from_top_blocks('run_block', '', true, '', '');
    return code;
}

function run_code() {
    if (!interpreter) {
        let code = assemble_code();
        if (code === "") return;
        interpreter = new Interpreter(code, init_interpreter_api);
        interpreter.run();
        finished_interpreter = true;
    } else if (!finished_interpreter) {
        while (!finished_interpreter) {
            step_code();
        }
    } else {
        let code = assemble_code();
        if (code === "") return;
        interpreter = new Interpreter(code, init_interpreter_api);
        interpreter.run();
        finished_interpreter = true;
    }
}

/*function save_file() {
    bootbox.dialog({
            title: "Ulož program",
            message: '<div class="row">  ' +
                '<div class="col-md-12"> ' +
                '<form class="form-horizontal"> ' +
                '<div class="form-group"> ' +
                '<label class="col-md-4 control-label" for="name">Name</label> ' +
                '<div class="col-md-4"> ' +
                '<input id="file_name" name="name" type="text" placeholder="Meno súboru class="form-control input-md"> ' +
                '<span class="help-block">Meno súboru</span> </div> ' +
                '</div> ' +
                '<div class="form-group"> ' +
                '<label class="col-md-4 control-label" for="awesomeness">How awesome is this?</label> ' +
                '<div class="col-md-4"> <div class="radio"> <label for="awesomeness-0"> ' +
                '<input type="radio" name="awesomeness" id="awesomeness-0" value="Really awesome" checked="checked"> ' +
                'Really awesome </label> ' +
                '</div><div class="radio"> <label for="awesomeness-1"> ' +
                '<input type="radio" name="awesomeness" id="awesomeness-1" value="Super awesome"> Super awesome </label> ' +
                '</div> ' +
                '</div> </div>' +
                '</form> </div>  </div>',
            buttons: {
                success: {
                    label: "Save",
                    className: "btn-success",
                    callback: function () {
                        var name = $('#name').val();
                        var answer = $("input[name='awesomeness']:checked").val()
                        Example.show("Hello " + name + ". You've chosen <b>" + answer + "</b>");
                    }
                }
            }
        }
    );
}*/
