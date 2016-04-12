<?php
require_once('global.php');

$page_includes['stylesheets'] = 'css/app.css';
$page_includes['scripts'] = array(
    array('js', 'js/jquery.mousewheel.min.js'),
    array('js', 'app_settings.js'),
    array('js', 'js/three.min.js'),
    array('js', 'webgl/camera.js'),
    array('js', 'webgl/terrain.js'),
    array('js', 'webgl/renderer.js'),
    array('js', 'js/blockly_compressed.js'),
    array('js', 'js/blocks_compressed.js'),
    array('js', 'msg/js/sk.js'),
    array('js', 'js/javascript_compressed.js'),
    array('js', 'custom_blocks.js'),
    array('js', 'robot.js'),
    array('js', 'app.js')
);
$page_includes['toolboxes'] = array(
    'toolbox/robot_karel.xml'
);
$page_content['body'] = file_get_contents(get_file_url('app_body.php'));
include 'layout.php';
