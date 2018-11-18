var pointLight, sun, moon, earth, earthOrbit, ring, controls, scene, camera, renderer, scene, myPlanet, stats,date;
var sunSize = 1391000;
var myDatas = [];
var spaceship;
var shipVal ={value: 10};
var animation ={init: Date.now(), isActive:false , date: ''};

var sunData = constructObjData(1, 0, 27/86400, 0, "Sun", 1);
var earthPosition  = new THREE.Vector3();
var distance_factor ={value: 1};
var last = -1;
var gui = new dat.GUI();
var folder2 = gui.addFolder('Planets');
var mercuryData = constructObjData(4880 / sunSize, 87.97, 58.65 / 86400, 57910000 / 2, "Mercury", 4880 / sunSize * 10);
var venusData = constructObjData(12104 / sunSize, 224.7, -243 / 86400, 108200000 / 2, "venus", 12104 / sunSize * 10);
var earthData = constructObjData(12742 / sunSize, 365.2564, 1 / 86400, 149600000 / 2, "Earth", 12742 / sunSize * 10);
var moonData = constructObjData(3474 / sunSize, 27.5, 27 / 86400, 146000000 / 2, "Moon", 3474 / sunSize * 10);
var marsData = constructObjData(6800 / sunSize, 689.98, 1026 / 86400, 227900000 / 2, "Mars", 6800 / sunSize * 10);
var jupiterData = constructObjData(139822 / sunSize, 11.86, 0.41 / 86400, 778500000 / 2, "Jupiter", 139822 / sunSize * 10);
var saturnData = constructObjData(116464 / sunSize, 29.46, 0.44 / 86400, 1434000000 / 2, "Saturn", 116464 / sunSize * 10);
var uranusData = constructObjData(50724 / sunSize, 30.685, 0.72 / 86400, 2871000000 / 2, "Uranus", 50724 / sunSize * 10);
var neptuneData = constructObjData(49244 / sunSize, 60.190, 0.67 / 86400, 4495000000 / 2, "Neptune", 49244 / sunSize * 10);
var shipData = constructObjData(4880 / sunSize, 87.97, 58.65 / 86400, 57910000 / 2, "ship", 4880 / sunSize *10);
var cameraOnShip = false;

var orbitData = { value: 1, runOrbit: true, runRotation: true };
var clock = new THREE.Clock();
var keyboard	= new THREEx.KeyboardState();



var chaseCamera, topCamera;
var chaseCameraActive = false;

function constructObjData(mySize, myOrbitRate, myRotationRate, myDistanceFromAxis, myName, mySunScale) {
    return {
          size: mySize
        , orbitRate: myOrbitRate
        , rotationRate: myRotationRate
        , distanceFromAxis: myDistanceFromAxis
        , name: myName
        , sunScale: mySunScale
    };
}


function getObj(name, myData) {
    var tmpMesh, mesh;
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath("models/").load(name + ".mtl", function (materials) {
        materials.preload();
        var loader = new THREE.OBJLoader();
        loader.setMaterials(materials);
        loader.setPath("models/");
        loader.load(name + '.obj', function (object) {
            tmpMesh = object; //store the object in a variable
            object.traverse(function (child) {
                child.castShadow = true;
                mesh = new THREE.Mesh(tmpMesh.children[0].geometry, tmpMesh.children[0].material);
                var bound = new THREE.Box3().setFromObject(tmpMesh);
                if (myData.name == "sun") {
                    
                    mesh.geometry.center();
                }

            });
            if(myData.name == "ship"){
                var bound = new THREE.Box3().setFromObject(tmpMesh);
                tmpMesh.scale.set(40 * myData.sunScale / bound.getSize().x, 40 * myData.sunScale / bound.getSize().x, 40 * myData.sunScale / bound.getSize().x);
                
                mesh.geometry.center();
                tmpMesh.position.x = myData.distanceFromAxis * 2 / sunSize;
                spaceship = tmpMesh;
            }else{
            
                var bound = new THREE.Box3().setFromObject(tmpMesh);
            tmpMesh.scale.set(40 * myData.sunScale / bound.getSize().x, 40 * myData.sunScale / bound.getSize().x, 40 * myData.sunScale / bound.getSize().x);
            update(tmpMesh, myData);
            mesh.geometry.center();
            tmpMesh.position.x = myData.distanceFromAxis / sunSize;
            
            var tempFolder = folder2.addFolder(myData.name);
            tempFolder.add(tmpMesh.position, 'x').min(-200).max(200).listen()
            tempFolder.add(tmpMesh.position, 'y').min(-200).max(200).listen();
            tempFolder.add(tmpMesh.position, 'z').min(-200).max(200).listen();
            tempFolder.add(mesh.material, 'wireframe',0,1).listen();


            }
            

            
            scene.add(tmpMesh);
            return tmpMesh;
        });
    });

}

function getPointLight(intensity, color) {
    var light = new THREE.PointLight(color, intensity);
    light.castShadow = true;

    light.shadow.bias = 0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    return light;
}


function movePlanet(myPlanet, myData, myTime, stopRotation) {
    if (orbitData.runRotation && !stopRotation) {
        myPlanet.rotation.y += myData.rotationRate;
    }
    if (orbitData.runOrbit) {
        date = myTime * orbitData.value / (myData.orbitRate*200);
        if (myData.name != "Sun") {
            if(myData.name == "Earth"){
                var temp = new THREE.Vector3(Math.cos(date) * myData.distanceFromAxis / 1000000,0,Math.sin(date) * myData.distanceFromAxis / 1000000)
                myPlanet.position.set(temp.x,temp.y,temp.z);   
                earthPosition=temp;
            }else{
                myPlanet.position.set(
                    Math.cos(date) * myData.distanceFromAxis / 1000000,
                    0,
                    Math.sin(date) * myData.distanceFromAxis / 1000000
                );
            }
        }
    }



}


function moveMoon(myPlanet, myData, myTime) {
 
    if (orbitData.runOrbit) {
        date = myTime * orbitData.value / (myData.orbitRate*200);
        if (myData.name != "Sun") {
            myPlanet.position.set(
                Math.cos(date) * (384400)/100000 +  earthPosition.x,
                0,
                Math.sin(date) * ( 384400)/100000 +  earthPosition.z
            );
        }
    }
}




var cont = 0;
function update(myPlanet, myData) {
   controls.update();
    var i = 0;
    if(animation.isActive){
        var time = animation.init;
        animation.date = toDateTime(animation.init);
    }else{
        var time = Date.now();
        animation.init = time;
        animation.date = toDateTime(animation.init);
    }
    if (myData.name != "Moon") {
        movePlanet(myPlanet, myData, time);
    } else {
        moveMoon(myPlanet, myData, time);
    }
   // setTimeout(scale(myPlanet),1000);
  
  
    requestAnimationFrame(function () {
	if (chaseCameraActive)
	{  renderer.render( scene, chaseCamera );  }
	else
	{  renderer.render( scene, topCamera );  }
        update(myPlanet, myData);
        moves();
    });
}

function scale(myPlanet){
    
    if(cont < 9 && last != distance_factor.value){
        if(last == -1){
            last = distance_factor.value;
        }else{
            myPlanet.scale.set(myPlanet.scale.x/last,myPlanet.scale.y/last,myPlanet.scale.z/last);
        }
        myPlanet.scale.set(myPlanet.scale.x*distance_factor.value,myPlanet.scale.y*distance_factor.value,myPlanet.scale.z*distance_factor.value);
    }
    cont++;
    if(cont >=9){
        cont =0;
        last = distance_factor.value;
    }
}


function init() {
    
    // Create the scene that holds all of the visible objects.
    scene = new THREE.Scene();

    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	// camera 1
	topCamera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(topCamera);
	topCamera.position.set(48,20,177);
    topCamera.lookAt(scene.position);
    
	// camera 2
	chaseCamera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(chaseCamera);
	// RENDERER
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    // Attach the renderer to the div element.
    document.getElementById('webgl').appendChild(renderer.domElement);

    // Create controls that allows a user to move the scene with a mouse.
    controls = new THREE.OrbitControls(topCamera, renderer.domElement);

    // Load the images used in the background.
    var path = 'universeCube/';
    var format = '.png';
    var urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];
    var reflectionCube = new THREE.CubeTextureLoader().load(urls);
    reflectionCube.format = THREE.RGBFormat;

    // Attach the background cube to the scene.
    scene.background = reflectionCube;

    // Create light from the sun.
    pointLight = getPointLight(1.5, "rgb(255, 220, 180)");
    scene.add(pointLight);

    // Create light that is viewable from all directions.
    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);


    getObj("ship", shipData);
   setTimeout(function () { getObj("sun", sunData); }, 1000);
    setTimeout(function () { getObj("mercury", mercuryData); }, 1000);
    setTimeout(function () { getObj("venus", venusData); }, 1000);
    setTimeout(function () { getObj("earth", earthData); }, 1000);
    setTimeout(function () { getObj("moon", moonData); }, 1000);
    setTimeout(function () { getObj("mars", marsData); }, 1000);
    setTimeout(function () { getObj("jupiter", jupiterData); }, 1000);
    setTimeout(function () { getObj("saturn", saturnData); }, 1000);
    setTimeout(function () { getObj("uranus", uranusData); }, 1000);
    setTimeout(function () { getObj("neptune", neptuneData); }, 1000);



    // Create the GUI that displays controls.
    var folder3 = gui.addFolder('Controls');
    folder3.add(pointLight, 'intensity', 0, 10).name("Sunlight Intensity");
    folder3.add(orbitData, 'value', 1, 10).step(1).name("Orbit Speed Value");
    folder3.add(orbitData, 'runOrbit', 0, 1).name("Run Orbit");
    folder3.add(orbitData, 'runRotation', 0, 1).name("Run Rotation");

    
    var folder5 = gui.addFolder('Spaceship');
    folder5.add(shipVal,'value', 1 ,30).name('speed').listen();
    // Start the animation.
    var folder6 = gui.addFolder('Animation ');
    folder6.add(animation ,'isActive',0,1);
    folder6.add(animation ,'init').min(animation.init).max(animation.init+150000).onChange(function() {animation.date = toDateTime(animation.init)}).name("Initial Date");
    folder6.add(animation ,'date').listen().name("Current Date");
    

}

function moves(){
    var delta = clock.getDelta(); // seconds.
	var moveDistance = shipVal.value * delta; // 200 pixels per second
	var rotateAngle = Math.PI / 6 * delta;   // pi/2 radians (90 degrees) per second
	

    
	// local transformations

	// move forwards/backwards/left/right
	if ( keyboard.pressed("W") )
        spaceship.translateX( -moveDistance );
	if ( keyboard.pressed("S") )
        spaceship.translateX(  moveDistance );
	if ( keyboard.pressed("Q") )
        spaceship.translateZ( -moveDistance );
    
	if ( keyboard.pressed("E") )
        spaceship.translateZ(  moveDistance );	
    

	// rotate left/right/up/down
	var rotation_matrix = new THREE.Matrix4().identity();
	if ( keyboard.pressed("A") )
        spaceship.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);

	if ( keyboard.pressed("D") )
        spaceship.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);
	if ( keyboard.pressed("R") )
        spaceship.rotateOnAxis( new THREE.Vector3(0,0,1), rotateAngle);
    
	if ( keyboard.pressed("F") )
        spaceship.rotateOnAxis( new THREE.Vector3(0,0,1), -rotateAngle);;
    
	
	if ( keyboard.pressed("Z") )
	{
		spaceship.position.set(0,25.1,0);
		spaceship.rotation.set(0,0,0);
	}
	var relativeCameraOffset = new THREE.Vector3(800000,0,0);

	var cameraOffset = relativeCameraOffset.applyMatrix4( spaceship.matrixWorld );

    chaseCamera.position.x = cameraOffset.x;
	chaseCamera.position.y = cameraOffset.y;
	chaseCamera.position.z = cameraOffset.z;
    chaseCamera.lookAt(spaceship.position);
    
    if ( keyboard.pressed("1") )
	{  chaseCameraActive = true;  }
	if ( keyboard.pressed("2") )
	{  chaseCameraActive = false;  }
	
	//camera.updateMatrix();
	//camera.updateProjectionMatrix();
    //controls.update(delta);
}




// Start everything.
init();
function toDateTime(secs) {
    var t = new Date(1,1,1970); // Epoch
    t.setSeconds(secs/1000);
    //var dd = t.getDate();
    //var mm = t.getMonth() + 1; //January is 0!
/*
    var yyyy = t.getFullYear();
    if (dd < 10) {
    dd = '0' + dd;
    } 
    if (mm < 10) {
    mm = '0' + mm;
    } 
    var t = dd + '/' + mm + '/' + yyyy;*/
    return t.toLocaleString() ;
}