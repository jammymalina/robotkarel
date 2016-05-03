$(window).load(function() {
    const BASIC_MODE = 1;
    const INTERMEDIATE_MODE = 2;
    const EXPERT_MODE = 3;

    let app_info = {
        workspace_hidden: false,
        mode: BASIC_MODE
    };

    let save_link = $("#save_link");
    let file_program_input = $("#file_program_input");

    let key_info = {
        camera_key: {
            pressed: false,
            keycode: 17
        }
    };

    let save_options = {
        pattern: new RegExp("[^a-zA-Z_0-9]")
    };

    let robot_settings = {
        x: 10,
        y: 10,
        direction: ROBOT_DIRECTION.NORTH
    };
    let canvas_container = $('#webgl_board_container');

    let blocks_div = $('#blocks_workspace');
    let blocks_container = $('#blocks_container');

    bootbox.setDefaults({
        locale: "sk"
    });

    function init() {
        init_interpreter(blocks_div[0]);
        init_WebGL(canvas_container);
        resize();
        reset_robot(robot_settings.x, robot_settings.y, robot_settings.direction);
        $('[data-toggle="tooltip"]').tooltip();
    }

    function resize() {
        let navbar_offset = ($('#menubar').height() + $('#menubar').offset().top);
        let width = $(window).width();
        let height = $(window).height() - navbar_offset;
        resize_canvas(
            width - (app_settings.canvas_offset.left + app_settings.canvas_offset.right),
            height - (app_settings.canvas_offset.top + app_settings.canvas_offset.bottom),
            navbar_offset
        );
        resize_blocks_workspace(
            width - (app_settings.workspace_offset.left + app_settings.workspace_offset.right),
            height - (app_settings.workspace_offset.top + app_settings.workspace_offset.bottom),
            navbar_offset
        );
    }

    function resize_canvas(width, height, navbar_offset) {
        width = Math.round(width);
        height = Math.round(height);
        canvas_container.css({
            width: width + 'px',
            height: height + 'px',
            top: (navbar_offset + app_settings.canvas_offset.top) + 'px',
            left: app_settings.canvas_offset.left + 'px'
        });
        resize_WebGL(canvas_container.innerWidth(), canvas_container.innerHeight());
    }

    function resize_blocks_workspace(width, height, navbar_offset) {
        blocks_container.css({
            width: width + 'px',
            height: height + 'px',
            top: (navbar_offset + app_settings.workspace_offset.top) + 'px',
            left: app_settings.workspace_offset.left + 'px'
        });
        blocks_div.css({
            width: blocks_container.width() + 'px',
            height: blocks_container.height() + 'px'
        });
        setTimeout(function() {
            Blockly.fireUiEvent(window, 'resize');
        }, 75);
    }

    function mouse_coords_inside_canvas(relX, relY) {
        return !(relX < 0 || relX > canvas_container.width() || relY < 0 || relY > canvas_container.height());
    }

    $('body').on('contextmenu', canvas_container, function(e) {
        return false;
    });

    $(window).on({
        resize: function() {
            resize();
        }
    });

    $(document).on({
        mousemove: function(e) {
            let offset = canvas_container.offset();
            let relX = e.pageX - offset.left;
            let relY = e.pageY - offset.top;
            if (mouse_coords_inside_canvas(relX, relY)) {
                canvas_mouse_info.current_mouse_position.set(relX, relY);
                canvas_mouse_info.delta_position.subVectors(canvas_mouse_info.current_mouse_position, canvas_mouse_info.last_mouse_position);
                canvas_mouse_info.last_mouse_position.set(relX, relY);

                if (key_info.camera_key.pressed) {
                    camera_move(camera, canvas_mouse_info);
                }
            }
        },
        mousedown: function(e) {
            let offset = canvas_container.offset();
            let relX = e.pageX - offset.left;
            let relY = e.pageY - offset.top;
            if (e.which == 1) {
                if (mouse_coords_inside_canvas(relX, relY)) {
                    canvas_mouse_info.left_button_pressed = true;
                    camera_mouse_down(camera, relX, relY);
                }
            } else if (e.which == 3) {
                if (mouse_coords_inside_canvas(relX, relY)) {
                    canvas_mouse_info.right_button_pressed = true;
                }
            }
        },
        mouseup: function(e) {
            if (e.which == 1) {
                canvas_mouse_info.left_button_pressed = false;
            } else if (e.which == 3) {
                canvas_mouse_info.right_button_pressed = false;
            }
        },
        keydown: function(e) {
            if (e.keyCode == key_info.camera_key.keycode) {
                if (!app_info.workspace_hidden) {
                    blocks_container.hide();
                    app_info.workspace_hidden = true;
                }
                key_info.camera_key.pressed = true;
            }
        },
        keyup: function(e) {
            if (e.keyCode == key_info.camera_key.keycode) {
                if (app_info.workspace_hidden) {
                    blocks_container.show();
                    app_info.workspace_hidden = false;
                }
                key_info.camera_key.pressed = false;
            } else if (e.keyCode == 13) {
                step_code();
            }
        }
    });

    canvas_container.on('mousewheel', function(e, delta) {
        if (key_info.camera_key.pressed) {
            camera_zoom(camera, delta);
        }
        e.preventDefault();
    });

    $("#play_button").on({
        click: function() {
            run_code();
        }
    });
    $("#step_button").on({
        click: function() {
            parse_code();
            step_code(true);
        }
    });
    $("#time_button").on({
        click: function() {
            if (!interpreter_is_animating) {
                start_animation();
            } else {
                stop_animation();
            }
        }
    });

    $("#ortho_button").on({
        click: function() {
            camera_to_ortho();
            $("#persp_button").parent().removeClass("active");
            $("#ortho_button").parent().addClass("active");
        }
    });
    $("#persp_button").on({
        click: function() {
            camera_to_perspective();
            $("#ortho_button").parent().removeClass("active");
            $("#persp_button").parent().addClass("active");
        }
    });
    $("#top_camera_button").on({
        click: function() {
            camera_top(camera);
        }
    });
    $("#right_camera_button").on({
        click: function() {
            camera_right(camera);
        }
    });
    $("#left_camera_button").on({
        click: function() {
            camera_left(camera);
        }
    });
    $("#front_camera_button").on({
        click: function() {
            camera_front(camera);
        }
    });
    $("#back_camera_button").on({
        click: function() {
            camera_back(camera);
        }
    });

    $("#slow_menu").on({
        click: function() {
            $("#speed_menu li").removeClass("active");
            $(this).parent().addClass("active");
            current_interpreter_speed = INTERPRETER_SPEED.SLOW;
        }
    });
    $("#mid_menu").on({
        click: function() {
            $("#speed_menu li").removeClass("active");
            $(this).parent().addClass("active");
            current_interpreter_speed = INTERPRETER_SPEED.MID;
        }
    });
    $("#fast_menu").on({
        click: function() {
            $("#speed_menu li").removeClass("active");
            $(this).parent().addClass("active");
            current_interpreter_speed = INTERPRETER_SPEED.FAST;
        }
    });

    $("#new_button").on({
        click: function() {
            total_clear();
        }
    });
    $("#save_button").on({
        click: function() {
            init_save();
        }
    });
    $("#open_button").click(function() {
        file_program_input.trigger("click");
    });

    file_program_input.on("change", function(e) {
        var files = e.target.files;
        if (files.length > 0) {
            load(files[0]);
        }
    });

    function total_clear() {
        bootbox.confirm("Chceš zmazať svoju pracovnú plochu?", function(result) {
            if (result) {
                Blockly.mainWorkspace.clear();
            }
            clear_blocks_dialog();
        });
    }

    function clear_workspace_dialog() {
        bootbox.confirm("Chceš zmazať svoju pracovnú plochu?", function(result) {
            if (result) {
                Blockly.mainWorkspace.clear();
            }
        });
    }

    function clear_blocks_dialog() {
        bootbox.confirm("Chceš zmazať všetky bloky?", function(result) {
            if (result) {
                terrain_clear();
                reset_robot(robot_settings.x, robot_settings.y, robot_settings.direction);
            }
        });
    }

    function init_save() {
        bootbox.prompt("Názov súboru", function(result) {
            if (result !== null) {
                if (result === "" || result.length < 3) {
                    bootbox.alert("Názov súboru musí obsahovať aspoň 3 znaky.", function() {
                        init_save();
                    });
                } else if (save_options.pattern.test(result)) {
                    bootbox.alert("Názov súboru môže obsahovať len písmená, číslice a podtržník.", function() {
                        init_save();
                    });
                } else {
                    save(result + ".json");
                }
            }
        });
    }

    function save(file_name) {
        file_name = file_name || "program.json";
        let data = JSON.stringify(workspace_to_obj());
        let json = JSON.stringify(data);
        let blob = new Blob([json], {type: "application/json"});
        let url  = URL.createObjectURL(blob);

        save_link[0].download    = file_name;
        save_link[0].href        = url;
        save_link[0].textContent = "Download json";
        save_link[0].click();
        window.URL.revokeObjectURL(url);
    }

    function load(file) {
        if (!file.name.endsWith(".json")) {
            bootbox.alert('<div class="alert alert-danger" style="margin-top: 15px;">Vybrali ste zlý typ súboru.</div>');
            return;
        }
        var file_reader = new FileReader();
        file_reader.onload = function() {
            init_file(file_reader.result);
        };
        file_reader.onerror = function() {
            bootbox.alert('<div class="alert alert-danger" style="margin-top: 15px;">Pri čítaní súboru došlo k chybe.</div>');
        };
        file_reader.onabort = function() {
            bootbox.alert('<div class="alert alert-danger" style="margin-top: 15px;">Došlo k prerušeniu čítania súboru.</div>');
        };
        file_reader.onloadstart = function() {
            bootbox.alert("Čítam súbor");
        };
        file_reader.onloadend = function() {
            bootbox.hideAll();
        };

        file_reader.readAsText(file);
    }

     function init_file(json_string) {
         if (!json_string) return;
         Blockly.mainWorkspace.clear();
         obj_to_workspace(JSON.parse(json_string));
     }

    init();
});
