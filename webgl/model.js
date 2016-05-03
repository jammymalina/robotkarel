let models_3d = {};

function load_model(model_names, model_path, texture_path, position, rotation, scale, scene) {
    let manager = new THREE.LoadingManager();
    manager.onProgress = function(item, loaded, total) {
        console.log(item, loaded, total);
    };
    let texture = new THREE.Texture();

    let onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            let percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };

    let onError = function(xhr) {
        console.err('Error while loading model: ' + model_path + ', ' + texture_path);
    };
    
    let loader = new THREE.ImageLoader(manager);
    loader.load(texture_path, function(image) {
        texture.image = image;
        texture.needsUpdate = true;
    });

    // model
    loader = new THREE.OBJLoader(manager);
    loader.load(model_path, function(object) {
        object.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
                child.material.map = texture;
            }
        });
        object.matrixAutoUpdate = false;
        object.position.set(position.x, position.y, position.z);
        object.rotation.set(rotation.x, rotation.y, rotation.z);
        object.scale.set(scale.x, scale.y, scale.z);
        object.updateMatrix();
        for (let i = 0; i < model_names.length; i++) {
            models_3d[model_names[i]] = object.clone();
            scene.add(models_3d[model_names[i]]);
        }
    }, onProgress, onError);
}
