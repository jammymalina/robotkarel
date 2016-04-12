<?php

$app_info = array(
    'root' => $_SERVER['DOCUMENT_ROOT'].'RobotKarel'.'/'
);

$app_settings = array(
    'title' => 'Robot Karel'
);

function get_file_url($file = "") {
    return sprintf(
        '%s://%s%s%s',
        isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off' ? 'https' : 'http',
        $_SERVER['SERVER_NAME'],
        $_SERVER['REQUEST_URI'],
        $file
    );
}
