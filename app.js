$(window).load(function() {
    let canvas_container = $('#webgl_board_container');

    let blocks_div = $('#blocks_workspace');
    let blocks_container = $('#blocks_container');
    blocks_div.hide();

    let workspace = Blockly.inject(blocks_div[0], {
        toolbox: $('#robot_toolbox')[0],
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        trashcan: true
    });

    function init() {
        init_WebGL(canvas_container);
        resize();
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
        }, 50);
    }

    function mouse_coords_inside_canvas(relX, relY) {
        return !(relX < 0 || relX > canvas_container.width() || relY < 0 || relY > canvas_container.height());
    }

    $('body').on('contextmenu', canvas_container, function(e){ return false; });

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
            }
        },
        mousedown: function(e) {
            let offset = canvas_container.offset();
            let relX = e.pageX - offset.left;
            let relY = e.pageY - offset.top;
            if (e.which == 1) {
                if (mouse_coords_inside_canvas(relX, relY)) {
                    canvas_mouse_info.left_button_pressed = true;
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
        }
    });

    canvas_container.on('mousewheel', function(e, delta) {
        camera_zoom(camera, delta);
        e.preventDefault();
    });

    $("#play_button").on({
        click: function() {
            eval(Blockly.JavaScript.workspaceToCode(workspace));
        }
    });

    init();
});
