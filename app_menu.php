<div id="menubar" class="navbar navbar-inverse navbar-static-top">
    <div class="container-fluid">
        <a href="#" class="navbar-brand">Robot Karel</a>
        <button class="navbar-toggle" data-toggle="collapse" data-target=".navHeaderCollapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
        </button>
        <div class="collapse navbar-collapse navHeaderCollapse">
            <ul class="nav navbar-nav navbar-left">
                <li class="dropdown">
                    <div class="navbar-left" style="margin-left: 10px;">
                        <button type="button" id="new_button" class="btn btn-default navbar-btn" data-toggle="tooltip" data-placement="bottom" title="Nový program"><span class="glyphicon glyphicon-new-window"></span></button>
                        <button type="button" id="save_button" class="btn btn-default navbar-btn" data-toggle="tooltip" data-placement="bottom" title="Uložiť program"><span class="glyphicon glyphicon-floppy-disk"></span></button>
                        <button type="button" id="open_button" class="btn btn-default navbar-btn" data-toggle="tooltip" data-placement="bottom" title="Otvoriť program"><span class="glyphicon glyphicon-folder-open"></span></button>
                    </div>
                    <div class="btn-group" style="margin-left: 20px;">
                        <button type="button" id="play_button" class="btn btn-default navbar-btn" title="Spustí program"><span class="glyphicon glyphicon-play"></span></button>
                        <button type="button" id="step_button" class="btn btn-default navbar-btn" title="Začne krokovať program"><span class="glyphicon glyphicon-step-forward"></span></button>
                        <button type="button" id="time_button" class="btn btn-default navbar-btn" title="Začne animovať program"><span class="glyphicon glyphicon-time"></span></button>
                        <button type="button" class="btn btn-default dropdown-toggle navbar-btn" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <span class="caret"></span>
                            <span class="sr-only">Toggle Dropdown</span>
                        </button>
                        <ul id="speed_menu" class="dropdown-menu">
                            <li><a href="#" id="slow_menu">Pomaly</a></li>
                            <li class="active"><a href="#" id="mid_menu">Stredne rýchlo</a></li>
                            <li><a href="#" id="fast_menu">Rýchlo</a></li>
                        </ul>
                    </div>
                    <div class="btn-group" style="margin-left: 20px;">
                        <button type="button" class="btn btn-default dropdown-toggle navbar-btn" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <span class="glyphicon glyphicon-eye-open"></span> <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu">
                            <li class="active"><a id="persp_button" href="#">Perspektívna kamera</a></li>
                            <li><a id="ortho_button" href="#">Ortogonálna kamera</a></li>
                            <li role="separator" class="divider"></li>
                            <li><a id="top_camera_button" href="#">Vrch</a></li>
                            <li><a id="left_camera_button" href="#">Ľavá strana</a></li>
                            <li><a id="right_camera_button" href="#">Pravá strana</a></li>
                            <li><a id="front_camera_button" href="#">Predná strana</a></li>
                            <li><a id="back_camera_button" href="#">Zadná strana</a></li>
                        </ul>
                    </div>

                    <!-- <form class="navbar-form navbar-right" role="mode select">
                        <div class="form-group">
                            <select id="mode_change" class="form-control">
                                <option value="1">Začiatočník</option>
                                <option value="2">Mierne pokročilý</option>
                                <option value="3">Expert</option>
                            </select>
                        </div>
                    </form> -->
                </li>
            </ul>
        </div>
    </div>
</div>
