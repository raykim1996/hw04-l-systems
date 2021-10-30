import {vec3, mat4, vec4} from 'gl-matrix';
import Mesh from './geometry/Mesh';
import Turtle from './Turtle';
// import ExpansionRule from './ExpansionRule'
// import DrawingRule from './DrawingRule'


class LSystem {
// //save and restore turtle states as traversing the grammar string
// QStack<Turtle> turtleStack;

// //mapping char to expanded string for the grammar expansion step
// std::map<QChar, QString> charToRule;

// //mapping char to function pointer(draw operations)
// typedef Turtle (LSystem::*Rule)(Turtle);
// std::map<QChar, Rule> charToDrawingOperation;
  axiom: string = "FX";
  expandedGrammar: string = ""
  iterationNum: number;
  angleVal: number;
  cylinderColor: vec4;
  charToExpansionRule: Map<string, string> = new Map();
  charToDrawingOperation: Map<string, ()=> any> = new Map();
  currTurtle: Turtle;
  turtleStack: Array<Turtle> = [];

  cylinderTransformCol0: number[] = [];
  cylinderTransformCol1: number[] = [];
  cylinderTransformCol2: number[] = [];
  cylinderTransformCol3: number[] = [];
  cylinderColorCol: number[] = [];
  cylinderNum: number = 0;

  dodecTransformCol0: number[] = [];
  dodecTransformCol1: number[] = [];
  dodecTransformCol2: number[] = [];
  dodecTransformCol3: number[] = [];
  dodecColorCol: number[] = [];
  dodecNum: number = 0;

  constructor(iterNum: number, angle: number, color: vec4) {
    this.iterationNum = iterNum;
    this.angleVal = angle;
    this.cylinderColor = color;
    this.currTurtle = new Turtle(vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, 1), vec3.fromValues(1, 0, 0), vec3.fromValues(0, 1, 0), 0);
    this.setExpansionRule();
    this.expandGrammar();
  }


  expandGrammar() {
    let expandStr = this.axiom;

    for (let i = 0; i < this.iterationNum; i++) {
        let expanding = "";
        for (let j = 0; j < expandStr.length; j++) {
            let currChar = expandStr[j];
            if (currChar == 'F') {
                expanding += this.charToExpansionRule.get('F');
            } else if (currChar == 'X') {
                if ((Math.random() % 10) > 5) {
                    expanding += this.charToExpansionRule.get('X');
                } else {
                    expanding += this.charToExpansionRule.get('Z');
                }
            } else if (currChar == 'Z') {
                expanding += this.charToExpansionRule.get('Z');
            } else {
                expanding += currChar;
            }
        }
        expandStr = expanding;
    }
    console.log("Expanded Grammar: " + expandStr);
    this.expandedGrammar = expandStr;
  }

  setExpansionRule() {
    this.charToExpansionRule.set('F', "F[-F]F*[+F]*");
    this.charToExpansionRule.set('X', "F-[[X]+FX]+F[+FX]-X");
    this.charToExpansionRule.set('Z', "F[+F]F[[-XF]+F]");
    // X
    // X->F-[[X]+X]+F[+FX]-X
    // F->FF*


    this.charToDrawingOperation.set('F', () => {this.drawLineMoveForward()});
    this.charToDrawingOperation.set('-', () => {this.rotateAroundForward()});
    this.charToDrawingOperation.set('+', () => {this.rotateAroundRight()});
    this.charToDrawingOperation.set('^', () => {this.rotateAroundUp()});
    this.charToDrawingOperation.set('*', () => {this.drawLeaf()});
    this.charToDrawingOperation.set('[', () => {this.pushState()});
    this.charToDrawingOperation.set(']', () => {this.popState()});
  }

  runOperations() {
    console.log("Run Operations for " + this.expandedGrammar);
    for (let i = 0; i < this.expandedGrammar.length; i++) {
      let currChar = this.expandedGrammar[i];
      // console.log("curr char: " + currChar);
      let currFunc = this.charToDrawingOperation.get(currChar);
      if (currFunc) {
        currFunc();
      }
    }
    // console.log(this.turtleStack.length);
  }

  drawLineMoveForward() {
    this.currTurtle.moveForward();
    let transformMat = this.currTurtle.getTransformationMatrix();
    this.cylinderTransformCol0.push(transformMat[0], transformMat[1], transformMat[2], transformMat[3]);
    this.cylinderTransformCol1.push(transformMat[4], transformMat[5], transformMat[6], transformMat[7]);
    this.cylinderTransformCol2.push(transformMat[8], transformMat[9], transformMat[10], transformMat[11]);
    this.cylinderTransformCol3.push(transformMat[12], transformMat[13], transformMat[14], transformMat[15]);
    this.cylinderColorCol.push(this.cylinderColor[0], this.cylinderColor[1], this.cylinderColor[2], this.cylinderColor[3]);
    this.cylinderNum += 1
  }

  drawLeaf() {
    // this.currTurtle.fruitMoveForward();
    let transformMat = this.currTurtle.getTransformationMatrix();
    this.dodecTransformCol0.push(transformMat[0], transformMat[1], transformMat[2], transformMat[3]);
    this.dodecTransformCol1.push(transformMat[4], transformMat[5], transformMat[6], transformMat[7]);
    this.dodecTransformCol2.push(transformMat[8], transformMat[9], transformMat[10], transformMat[11]);
    this.dodecTransformCol3.push(transformMat[12], transformMat[13], transformMat[14], transformMat[15]);
    this.dodecColorCol.push(0.8, 0.6, 0.2, 1.0);
    this.dodecNum += 1
  }

  getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  rotateAroundForward() {
    // math::RotationMatrix<float> mat(0,Deg2Rad*degrees); // X axis
    // math::RotationMatrix<float> world2local(forward, left, up); 
    // up =  world2local * mat * vec3(0,0,1);
    // left = world2local * mat * vec3(0,1,0);
    // forward = world2local * mat * vec3(1,0,0);
    let currMat = this.currTurtle.currentMatrix();
    let result = mat4.create();
    let angle = this.getRandomArbitrary(this.angleVal - 5, this.angleVal + 15);
    mat4.rotateZ(result, currMat, angle);
    this.currTurtle.updateOrientation(result);
  }

  rotateAroundRight() {
    let currMat = this.currTurtle.currentMatrix();
    let result = mat4.create();
    let angle = this.getRandomArbitrary(this.angleVal - 5, this.angleVal + 15);
    mat4.rotateX(result, currMat, angle);
    this.currTurtle.updateOrientation(result);
  }

  rotateAroundUp() {
    let currMat = this.currTurtle.currentMatrix();
    let result = mat4.create();
    let angle = this.getRandomArbitrary(this.angleVal - 5, this.angleVal + 15);
    mat4.rotateY(result, currMat, angle);
    this.currTurtle.updateOrientation(result);
  }

  pushState() {
    let cloneTurtle = this.currTurtle.clone();
    this.turtleStack.push(cloneTurtle)
    this.currTurtle.recursionDepth += 1
  }

  popState() {
    this.currTurtle = this.turtleStack.pop();
  }
}



export default LSystem;