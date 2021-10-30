import {vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Mesh from './geometry/Mesh';
import cylinderObjStr from './geometry/cylinderObj';
import LSystem from './LSystem';
import dodecObjStr from './geometry/dodecObj';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {	
  angle: 25,	
  iterations: 2,
  currColor: [130, 130, 130, 1]
};

let square: Square;
let screenQuad: ScreenQuad;
let cylinder: Mesh;
let time: number = 0.0;
let lsystem: LSystem;
let dodec: Mesh;

let prevIter = 2;
let prevAngle = 25;
let prevColor = vec4.fromValues(0.5, 0.5, 0.5, 1.0);

function loadScene() {
  let newColor = vec4.fromValues((controls.currColor[0] / 255.0), 
                                    (controls.currColor[1] / 255.0), 
                                    (controls.currColor[2] / 255.0), 1);
  lsystem = new LSystem(controls.iterations, controls.angle, newColor);
  // lsystem.expandGrammar();
  
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  cylinder = new Mesh(cylinderObjStr, vec3.fromValues(0.0, 0.0, 0.0));
  // cylinder = new Mesh(wahooObjStr, vec3.fromValues(0.0, 0.0, 0.0));
  cylinder.create();
  dodec = new Mesh(dodecObjStr, vec3.fromValues(0.0, 0.0, 0.0));
  dodec.create();

  // Set up instanced rendering data arrays here.
  // This example creates a set of positional
  // offsets and gradiated colors for a 100x100 grid
  // of squares, even though the VBO data for just
  // one square is actually passed to the GPU
  let offsetsArray = [];
  let colorsArray = [];

  let n: number = 100.0;
  for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
      offsetsArray.push(i);
      offsetsArray.push(j);
      offsetsArray.push(0);

      colorsArray.push(i / n);
      colorsArray.push(j / n);
      colorsArray.push(1.0);
      colorsArray.push(1.0); // Alpha channel
    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(n * n); // grid of "particles"
  let col0 = [1.0, 0.0, 0.0, 0.0];
  let col1 = [0.0, 1.0, 0.0, 0.0];
  let col2 = [0.0, 0.0, 1.0, 0.0];
  let col3 = [0.0, 0.0, 0.0, 1.0];
  lsystem.runOperations();

  let colArr0: Float32Array = new Float32Array(lsystem.cylinderTransformCol0);
  let colArr1: Float32Array = new Float32Array(lsystem.cylinderTransformCol1);
  let colArr2: Float32Array = new Float32Array(lsystem.cylinderTransformCol2);
  let colArr3: Float32Array = new Float32Array(lsystem.cylinderTransformCol3);
  let colorArr: Float32Array = new Float32Array(lsystem.cylinderColorCol);
  cylinder.setInstanceVBOs(colArr0, colArr1, colArr2, colArr3, colorArr);
  cylinder.setNumInstances(lsystem.cylinderNum);

  let dodecColArr0: Float32Array = new Float32Array(lsystem.dodecTransformCol0);
  let dodecColArr1: Float32Array = new Float32Array(lsystem.dodecTransformCol1);
  let dodecColArr2: Float32Array = new Float32Array(lsystem.dodecTransformCol2);
  let dodecColArr3: Float32Array = new Float32Array(lsystem.dodecTransformCol3);
  let dodecColorArr: Float32Array = new Float32Array(lsystem.dodecColorCol);
  dodec.setInstanceVBOs(dodecColArr0, dodecColArr1, dodecColArr2, dodecColArr3, dodecColorArr);
  dodec.setNumInstances(lsystem.dodecNum);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'angle', 10, 80).step(1);	
  gui.add(controls, 'iterations', 1, 6).step(1);
  gui.addColor(controls, "currColor");

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(10, 20, -20), vec3.fromValues(0, 30, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.ONE, gl.ONE); // Additive blending
  gl.enable(gl.DEPTH_TEST);

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    let newColor = vec4.fromValues((controls.currColor[0] / 255.0), 
                                    (controls.currColor[1] / 255.0), 
                                    (controls.currColor[2] / 255.0), 1);
    if (controls.angle != prevAngle || controls.iterations != prevIter || (newColor[0] != prevColor[0] || newColor[1] != prevColor[1] || newColor[2] != prevColor[2])) {
      prevAngle = controls.angle;
      prevIter = controls.iterations;
      prevColor = vec4.fromValues((controls.currColor[0] / 255.0), 
      (controls.currColor[1] / 255.0), 
      (controls.currColor[2] / 255.0), 1);

      lsystem = new LSystem(controls.iterations, controls.angle, newColor);
      lsystem.expandGrammar();
      lsystem.runOperations();

      let colArr0: Float32Array = new Float32Array(lsystem.cylinderTransformCol0);
      let colArr1: Float32Array = new Float32Array(lsystem.cylinderTransformCol1);
      let colArr2: Float32Array = new Float32Array(lsystem.cylinderTransformCol2);
      let colArr3: Float32Array = new Float32Array(lsystem.cylinderTransformCol3);
      let colorArr: Float32Array = new Float32Array(lsystem.cylinderColorCol);
      cylinder.setInstanceVBOs(colArr0, colArr1, colArr2, colArr3, colorArr);
      cylinder.setNumInstances(lsystem.cylinderNum);

      let dodecColArr0: Float32Array = new Float32Array(lsystem.dodecTransformCol0);
      let dodecColArr1: Float32Array = new Float32Array(lsystem.dodecTransformCol1);
      let dodecColArr2: Float32Array = new Float32Array(lsystem.dodecTransformCol2);
      let dodecColArr3: Float32Array = new Float32Array(lsystem.dodecTransformCol3);
      let dodecColorArr: Float32Array = new Float32Array(lsystem.dodecColorCol);
      dodec.setInstanceVBOs(dodecColArr0, dodecColArr1, dodecColArr2, dodecColArr3, dodecColorArr);
      dodec.setNumInstances(lsystem.dodecNum);
    }
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      // square, 
      cylinder, dodec
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
