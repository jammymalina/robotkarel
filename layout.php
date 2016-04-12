<?php require_once('./global.php') ?>
<!DOCTYPE html>
<html lang="sk">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo $app_settings['title']; ?></title>

  <link href="css/bootstrap.min.css" rel="stylesheet">
  <link href="css/common.css" rel="stylesheet">
  <?php
  if (isset($page_includes['stylesheets'])) {
      if (is_array($page_includes['stylesheets'])) {
          foreach ($page_includes['stylesheets'] as $stylesheet) {
              echo '<link href="'.$stylesheet.'" rel="stylesheet">';
          }
      } else {
          echo '<link href="'.$page_includes['stylesheets'].'" rel="stylesheet">';
      }
  }
  ?>

  <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
  <![endif]-->

  <body>
    <?php
    if (isset($page_content['body'])) {
        echo $page_content['body'];
    }
    ?>

    <script src="js/jquery-2.2.2.min.js"></script>
    <script src="js/bootstrap.min.js"></script>
    <?php
    if (isset($page_includes['scripts'])) {
        if (is_array($page_includes['scripts'])) {
            foreach ($page_includes['scripts'] as $script_obj) {
                $script_type = 'js';
                $script_src = '';
                if (is_array($script_obj) && count($script_obj) >= 2) {
                    $script_type = $script_obj[0];
                    $script_src = $script_obj[1];
                } else {
                    $script_src = $script_obj;
                }
                if ($script_type == 'js') {
                    echo '<script src="'.$script_src.'"></script>';
                } else {
                    echo '<script src="'.$script_src.'" type="'.$script_type.'"></script>';
                }
            }
        } else {
            echo '<script src="'.$page_includes['scripts'].'"></script>';
        }
    }

    if (isset($page_includes['toolboxes'])) {
        if (is_array($page_includes['toolboxes'])) {
            foreach ($page_includes['toolboxes'] as $toolbox) {
                echo PHP_EOL.file_get_contents($toolbox).PHP_EOL;
            }
        } else {
            echo PHP_EOL.file_get_contents($page_includes['toolboxes']).PHP_EOL;
        }
    }
    ?>
  </body>

</html>
