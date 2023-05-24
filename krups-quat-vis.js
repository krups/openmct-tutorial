/*

KRUPS orientation visualization

This THREE.js model renders a KRUPS model. This page assumes there is an
 OpenMCT instance running that can be connected to and which provides quaternions 
 to use for visualizations

Evan Wells 2022
Updated May 2023 by Matt Ruffner
University of Kentucky
*/
import { OBJLoader} from 'https://unpkg.com/three@0.119.1/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.119.1/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.119.1/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'https://unpkg.com/three@0.119.1/build/three.module.js';


let camera, scene, renderer, controls, group, model;

const createWorld = () => {
  group = new THREE.Group();
  group.add(model);

  const axesHelper = new THREE.AxesHelper( 4 );
  scene.add( axesHelper );
  scene.add(group);
  
  camera.lookAt(group.position);
};

const init = () => {
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000.0);
  camera.position.set(10, 10, 10);
  camera.up.set(0,0,1);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333333);

  const light =  new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );

  scene.add(light);

  const amlight = new THREE.AmbientLight( 0xdddddd ); // soft white light
  scene.add(amlight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);
  
  controls = new OrbitControls(camera, renderer.domElement);
  
  createWorld();
}

const animate = () => {
  requestAnimationFrame(animate);
  
  controls.update();

  renderer.render(scene, camera); 
}

init();
animate();


// glb Loader
const loader = new GLTFLoader();

// load a resource
loader.load(
	// resource URL
  '3dmodels/krups.glb',
	// called when resource is loaded
	function ( object ) {
    
		model = object.scene;
    model.scale.set(0.035, 0.035, 0.035);
    model.position.x = 0;
    model.position.y = 0;
    model.position.z = 0;
    model.rotation.x = Math.PI / 2; // make Z face 'up'
    group.add(model);
	},
	// called when loading is in progresses
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );
    console.log(error);

	}
);

// connection to the wesocket server
var exampleSocket = new WebSocket("ws://127.0.0.1:8080/realtime");
var lp = 0;

exampleSocket.onopen = function(event) {

  console.log("connected to websocket");
  console.log(event);

  if( event.type == "open") {
    exampleSocket.send("subscribe quat_x");
    exampleSocket.send("subscribe quat_y");
    exampleSocket.send("subscribe quat_z");
    exampleSocket.send("subscribe quat_w");
  };
}

exampleSocket.onerror = function(event) {

  console.log("websocket error: ");
  console.log(event);
}
//            [W,X,Y,Z]
let newQuat = [1,0,0,0];
let renderFlag = [false,false,false,false];

// each part of the quat comes in as a separate message so only update after getting 
// a fresh set
exampleSocket.onmessage = function(event) {
  console.log(event.data)
  var jsonObj = JSON.parse(event.data);
  
  if ( jsonObj.hasOwnProperty("id") && jsonObj.hasOwnProperty("value") ){
    if ( jsonObj.id == "quat_z" ){
      newQuat[3] = jsonObj.value;
      renderFlag[3] = true;
    }
    if ( jsonObj.id == "quat_y" ){
      newQuat[2] = jsonObj.value;
      renderFlag[2] = true;
    } 
    if ( jsonObj.id == "quat_x" ){
      newQuat[1] = jsonObj.value;
      renderFlag[1] = true;
    }
    if ( jsonObj.id == "quat_w" ){
      newQuat[0] = jsonObj.value;
      renderFlag[0] = true;
    }
  } else {
    return;
  }

  if ( !renderFlag.every(Boolean) ){
    return;
  }
    
  var targetQuaternion = new THREE.Quaternion(newQuat[1], newQuat[2], newQuat[3], newQuat[0]);       
  
  group.quaternion.slerp(targetQuaternion, 0.9);
  
  renderer.render(scene, camera);

  renderFlag.fill(false);
  console.log("Rendered");
}
