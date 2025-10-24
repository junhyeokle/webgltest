// Import Three.js modules
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Only mount inside the hero image area
const container = document.getElementById("hero3d");
if (!container) throw new Error("hero3d container not found");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 1; controls.maxDistance = 50;

scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2); dirLight.position.set(6,10,8); scene.add(dirLight);

// Load model (place your file at assets/models/eye/scene.glb)
const loader = new GLTFLoader();
let object = null;
loader.load(
  "assets/models/eye/scene.glb",
  (gltf)=>{
    object = gltf.scene;
    scene.add(object);
    fitCameraToObject(camera, object, 1.25, controls);
    const ph = container.querySelector(".placeholder"); if (ph) ph.remove();
  },
  (xhr)=>{
    if (xhr.total) console.log(((xhr.loaded/xhr.total)*100).toFixed(0) + "% loaded");
    else console.log(xhr.loaded + " bytes loaded");
  },
  (err)=>{
    console.error("Failed to load GLB:", err);
    const geo = new THREE.BoxGeometry(1,1,1);
    const mat = new THREE.MeshNormalMaterial();
    object = new THREE.Mesh(geo, mat);
    scene.add(object);
    fitCameraToObject(camera, object, 1.25, controls);
  }
);

function fitCameraToObject(cam, obj, offset=1.2, ctrl){
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const fov = cam.fov * Math.PI/180;
  let dist = (maxDim/2) / Math.tan(fov/2) * offset;
  cam.position.copy(center);
  cam.position.x += dist * 0.6;
  cam.position.y += dist * 0.35;
  cam.position.z += dist;
  cam.near = Math.max(0.1, maxDim/1000);
  cam.far = Math.max(2000, maxDim*10);
  cam.updateProjectionMatrix();
  if (ctrl){ ctrl.target.copy(center); ctrl.update(); }
}

function sizeToContainer(){
  const {width, height} = container.getBoundingClientRect();
  camera.aspect = Math.max(1e-6, width/height);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
sizeToContainer();
window.addEventListener("resize", sizeToContainer);
new ResizeObserver(sizeToContainer).observe(container);

// subtle follow effect
let mx=.5, my=.5;
container.addEventListener("mousemove",(e)=>{
  const r = container.getBoundingClientRect();
  mx = (e.clientX - r.left) / r.width;
  my = (e.clientY - r.top) / r.height;
});

function animate(){
  requestAnimationFrame(animate);
  if (object){
    const ty = -Math.PI/6 + mx*(Math.PI/3);
    const tx = -Math.PI/12 + my*(Math.PI/6);
    object.rotation.y += (ty - object.rotation.y) * 0.08;
    object.rotation.x += (tx - object.rotation.x) * 0.08;
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();