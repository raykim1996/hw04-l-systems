// A Turtle class to represent the current drawing state of your 
// L-System. It should at least keep track of its current position, 
// current orientation, and recursion depth (how many [ characters 
// have been found while drawing before ]s)

import {vec3, vec4, mat4} from 'gl-matrix';

export default class Turtle {
  position: vec3;
  forwardVector: vec3;
  rightVector: vec3;
  upVector: vec3;
  recursionDepth: number;
  scaleVal: vec3;


  constructor(pos: vec3, f: vec3, r: vec3, u: vec3,recDepth: number) {
    this.position = pos;
    this.forwardVector = f;
    this.rightVector = r;
    this.upVector = u;

    this.recursionDepth = recDepth;
    this.scaleVal = vec3.fromValues(0.3, 3.0, 0.3);
  }

  moveForward() {
    // add(this.position, this.position, this.orientation * 10.0);
    let moveVal = this.scaleVal[1];
    let offset = vec3.fromValues(this.upVector[0] * moveVal, this.upVector[1] * moveVal, this.upVector[2] * moveVal);
    vec3.add(this.position, this.position, offset);
  }

  getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  fruitMoveForward() {
    // add(this.position, this.position, this.orientation * 10.0);
    // let moveVal = this.getRandomArbitrary(1.0, 3.0);
    let offset = vec3.fromValues(this.getRandomArbitrary(0.2, 1.0), this.getRandomArbitrary(0.2, 1.0), this.getRandomArbitrary(0.2, 1.0));
    vec3.add(this.position, this.position, offset);
  }

  currentMatrix() {
    let mat = mat4.fromValues(this.rightVector[0],   this.rightVector[1],   this.rightVector[2],   0,
                              this.upVector[0],      this.upVector[1],      this.upVector[2],      0,
                              this.forwardVector[0], this.forwardVector[1], this.forwardVector[2], 0,
                              0,                     0,                     0,                     1);
    return mat;
  }

  getTransformationMatrix() {
    let tMat = mat4.create();
    mat4.fromTranslation(tMat, this.position);

    let rMat = this.currentMatrix();

    let sMat = mat4.fromValues(this.scaleVal[0], 0, 0, 0,
                               0, this.scaleVal[1], 0, 0,
                               0, 0, this.scaleVal[2], 0, 
                               0, 0, 0, 1);
    // let sMat = mat4.create();
    mat4.identity(sMat);

    let transformMat = mat4.create();
    mat4.multiply(transformMat, rMat, sMat);
    mat4.multiply(transformMat, tMat, transformMat);
    return transformMat;
  }

  updateOrientation(mat: mat4) {
    this.rightVector = vec3.fromValues(mat[0], mat[1], mat[2]);
    this.upVector = vec3.fromValues(mat[4], mat[5], mat[6]);
    this.forwardVector = vec3.fromValues(mat[8], mat[9], mat[10]);
  }

  clone() {
    let clonePos = vec3.fromValues(this.position[0], this.position[1], this.position[2])
    let cloneForward = vec3.fromValues(this.forwardVector[0], this.forwardVector[1], this.forwardVector[2])
    let cloneRight = vec3.fromValues(this.rightVector[0], this.rightVector[1], this.rightVector[2])
    let cloneUp = vec3.fromValues(this.upVector[0], this.upVector[1], this.upVector[2])
    // let cloneScale = vec3.fromValues(this.scaleVal[0], this.scaleVal[1], this.scaleVal[2]);

    let cloneTurtle = new Turtle(clonePos, cloneForward, cloneRight, cloneUp, this.recursionDepth);
    return cloneTurtle;
  }
}