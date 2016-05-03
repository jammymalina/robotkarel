THREE.CombinedCamera = function(width, height, fov, near, far, orthoNear, orthoFar) {
    THREE.Camera.call(this);

    this.fov = fov;

    this.left = -width / 2;
    this.right = width / 2;
    this.top = height / 2;
    this.bottom = -height / 2;

    this.cameraO = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, orthoNear, orthoFar);
    this.cameraP = new THREE.PerspectiveCamera(fov, width / height, near, far);

    this.zoom = 1;

    this.toPerspective();
};

THREE.CombinedCamera.prototype = Object.create(THREE.Camera.prototype);
THREE.CombinedCamera.prototype.constructor = THREE.CombinedCamera;

THREE.CombinedCamera.prototype.toPerspective = function() {
    this.near = this.cameraP.near;
    this.far = this.cameraP.far;

    this.cameraP.fov = this.fov / this.zoom;

    this.cameraP.updateProjectionMatrix();

    this.projectionMatrix = this.cameraP.projectionMatrix;

    this.inPerspectiveMode = true;
    this.inOrthographicMode = false;
};

THREE.CombinedCamera.prototype.toOrthographic = function() {
    var fov = this.fov;
    var aspect = this.cameraP.aspect;
    var near = this.cameraP.near;
    var far = this.cameraP.far;

    var hyperfocus = (near + far) / 2;

    var halfHeight = Math.tan(fov * Math.PI / 180 / 2) * hyperfocus;
    var planeHeight = 2 * halfHeight;
    var planeWidth = planeHeight * aspect;
    var halfWidth = planeWidth / 2;

    halfHeight /= this.zoom;
    halfWidth /= this.zoom;

    this.cameraO.left = -halfWidth;
    this.cameraO.right = halfWidth;
    this.cameraO.top = halfHeight;
    this.cameraO.bottom = -halfHeight;

    this.cameraO.updateProjectionMatrix();

    this.near = this.cameraO.near;
    this.far = this.cameraO.far;
    this.projectionMatrix = this.cameraO.projectionMatrix;

    this.inPerspectiveMode = false;
    this.inOrthographicMode = true;

};

THREE.CombinedCamera.prototype.setSize = function(width, height) {
    this.cameraP.aspect = width / height;
    this.left = -width / 2;
    this.right = width / 2;
    this.top = height / 2;
    this.bottom = -height / 2;
};

THREE.CombinedCamera.prototype.setFov = function(fov) {
    this.fov = fov;
    if (this.inPerspectiveMode) {
        this.toPerspective();
    } else {
        this.toOrthographic();
    }
};

THREE.CombinedCamera.prototype.updateProjectionMatrix = function() {
    if (this.inPerspectiveMode) {
        this.toPerspective();
    } else {

        this.toPerspective();
        this.toOrthographic();

    }
};


THREE.CombinedCamera.prototype.setZoom = function(zoom) {
    this.zoom = zoom;
    if (this.inPerspectiveMode) {
        this.toPerspective();
    } else {
        this.toOrthographic();
    }
};

THREE.CombinedCamera.prototype.toFrontView = function() {
    this.rotation.x = 0;
    this.rotation.y = 0;
    this.rotation.z = 0;
    this.rotationAutoUpdate = false;
};

THREE.CombinedCamera.prototype.toBackView = function() {
    this.rotation.x = 0;
    this.rotation.y = Math.PI;
    this.rotation.z = 0;
    this.rotationAutoUpdate = false;
};

THREE.CombinedCamera.prototype.toLeftView = function() {
    this.rotation.x = 0;
    this.rotation.y = -Math.PI / 2;
    this.rotation.z = 0;
    this.rotationAutoUpdate = false;
};

THREE.CombinedCamera.prototype.toRightView = function() {
    this.rotation.x = 0;
    this.rotation.y = Math.PI / 2;
    this.rotation.z = 0;
    this.rotationAutoUpdate = false;
};

THREE.CombinedCamera.prototype.toTopView = function() {
    this.rotation.x = -Math.PI / 2;
    this.rotation.y = 0;
    this.rotation.z = 0;
    this.rotationAutoUpdate = false;
};

THREE.CombinedCamera.prototype.toBottomView = function() {
    this.rotation.x = Math.PI / 2;
    this.rotation.y = 0;
    this.rotation.z = 0;
    this.rotationAutoUpdate = false;
};
