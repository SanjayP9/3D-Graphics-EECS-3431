var canvas;
var gl;

var program;

var near = 0.001;
var far = 50000;

var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;

var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0);
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0);

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye = vec3(0, 0, 0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var resetTimerFlag = true;
var animFlag = false;
var prevTime = 0.0;
var useTextures = 1;

var fps, fpsNode;
var elapsed = 0;

// Classes for vector and turret
class Vector {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }
}

class Turret {
    constructor() {
        this.pos = new Vector();
        this.rot = new Vector();
        this.gunRot = new Vector();
    }

    rotateTurret(rotX, rotY) {
        this.rot.y = rotX;
        //this.gunRot.y = rotX;
        this.gunRot.z = rotY;
    }
}

// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array()
for (var i = 0; i < texSize; i++) image1[i] = new Array();
for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
        image1[i][j] = new Float32Array(4);
for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++) {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
        image1[i][j] = [c, c, c, 1];
    }

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
        for (var k = 0; k < 4; k++)
            image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];

var textureArray = [];

function isLoaded(im) {
    if (im.complete) {
        console.log("loaded");
        return true;
    } else {
        console.log("still not loaded!!!!");
        return false;
    }
}

function loadFileTexture(tex, filename) {
    tex.textureWebGL = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename;
    tex.isTextureReady = false;
    tex.image.onload = function () {
        handleTextureLoaded(tex);
    }
    // The image is going to be loaded asyncronously (lazy) which could be
    // after the program continues to the next functions. OUCH!
}

function loadImageTexture(tex, image) {
    tex.textureWebGL = gl.createTexture();
    tex.image = new Image();
    //tex.image.src = "CheckerBoard-from-Memory" ;

    gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true;
}

function initTextures() {
    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "metal1.jpg");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "metal2.png");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1],  "wood1.jpg");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1],  "wood2.jpg");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1],  "water.jpg");

    textureArray.push({});
    loadImageTexture(textureArray[textureArray.length - 1], image2);
}


function handleTextureLoaded(textureObj) {
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src);

    textureObj.isTextureReady = true;
}

//----------------------------------------------------------------

function setColor(c) {
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program,
        "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);
}

function toggleTextures() {
    useTextures = 1 - useTextures;
    gl.uniform1i(gl.getUniformLocation(program,
        "useTextures"), useTextures);
}

function waitForTextures1(tex) {
    setTimeout(function () {
        console.log("Waiting for: " + tex.image.src);
        wtime = (new Date()).getTime();
        if (!tex.isTextureReady) {
            console.log(wtime + " not ready yet");
            waitForTextures1(tex);
        } else {
            console.log("ready to render");
            window.requestAnimFrame(render);
        }
    }, 5);
}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
    setTimeout(function () {
        var n = 0;
        for (var i = 0; i < texs.length; i++) {
            console.log("boo" + texs[i].image.src);
            n = n + texs[i].isTextureReady;
        }
        wtime = (new Date()).getTime();
        if (n != texs.length) {
            console.log(wtime + " not ready yet");
            waitForTextures(texs);
        } else {
            console.log("ready to render");
            window.requestAnimFrame(render);
        }
    }, 5);
}

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    console.log(gl.getParameter(gl.VERSION));
    console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
    console.log(gl.getParameter(gl.VENDOR));

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load canonical objects and their attributes
    Cube.init(program);
    Cylinder.init(9, program);
    Cone.init(9, program);
    Sphere.init(36, program);
    Quad.init(program);
    Triangle.init(program);

    gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);

    // record the locations of the matrices that are used in the shaders
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // set a default material
    setColor(materialDiffuse);

    document.getElementById("textureToggleButton").onclick = function () {
        toggleTextures();
        window.requestAnimFrame(render);
    };

    var controller = new CameraController(canvas);
    controller.onchange = function (xRot, yRot) {
        RX = xRot;
        RY = yRot;
    };

    // load and initialize the textures
    initTextures();

    // Recursive wait for the textures to load
    waitForTextures(textureArray);
    //setTimeout (render, 100) ;

    // Initializes the element for displaying the framerate
    fps = document.getElementById("fps");
    fpsNode = document.createTextNode("");

    fps.appendChild(fpsNode);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    setMV();
}

// Draws a 2x2 Triangle in xy centered at the origin (z=0)
function drawTriangle() {
    setMV();
    Triangle.draw();
}

// Draws a 2x2 Quad in xy centered at the origin (z=0)
function drawQuad() {
    setMV();
    Quad.draw();
}
// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV();
    Sphere.draw();
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x, y, z) {
    modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta, x, y, z) {
    modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx, sy, sz) {
    modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

// Starting offsets for the eye and where its pointing at
var atOffset = vec3(0, 0, 0);
var eyeOffset = vec3(0, 0, 0);

var sceneTimes = [7.0, 13.0, 20.0, 30.0];
var curScene = 0;
// Used for tracking the total elapsed time of the animation
var totalTime = 0;
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var curTime = (performance.now()) / 1000;
    if (resetTimerFlag) {
        prevTime = curTime;
        resetTimerFlag = false;
    }
    var deltaTime = curTime - prevTime;
    TIME += deltaTime;
    prevTime = curTime;

    at = vec3(at[0], at[1], at[2]);
    eye = vec3(eye[0], eye[1], eye[2]);
    
    eye[1] = eye[1] + 0;

    // set the projection matrix
    projectionMatrix = perspective(90, 1, near, far);
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at, up);

    // initialize the modeling matrix stack
    MS = [];
    modelMatrix = mat4();

    // send all the matrices to the shaders
    setAllMatrices();

    // Scene management
    if (totalTime >= sceneTimes[curScene]) {
        sceneTime = 0;
        curScene++;
    }

    // Render the appropriate scene
    switch (curScene) {
        case 0:
        scene1(deltaTime);
        break;
        case 1: 
        scene2(deltaTime);
        break;
        case 2:
        scene3(deltaTime);
        break;
        case 3:
        scene4(deltaTime);
        break;
    }
    totalTime += deltaTime;

    // Used to calculate FPS.FPS is calculated every 500 milliseconds
    elapsed += deltaTime;
    if (elapsed >= 0.5) {
        fpsNode.nodeValue = (1 / deltaTime).toFixed(2);
        elapsed = 0;
    }

    window.requestAnimFrame(render);
}

var waterOffset = new Vector();
function drawWater() {
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[4].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture4"), 4);
    // Draw water
    gPush(); {
        gTranslate(waterOffset.x, waterOffset.y, waterOffset.z);
        gRotate(90, 1, 0, 0);
        setColor(vec4(1, 1, 1, 1));
        gScale(1000, 1000, 1);
        drawQuad();       
    }
    gPop();
}

// Object for one of the ships
var bismarck = {
    // Absolute position of the object
    pos : new Vector(),
    rot : new Vector(),

    // Each turret object
    turrets : [new Turret(), new Turret(), new Turret(), new Turret()],
    
    // Render function for drawing the entire ship
    render : function() {
        gPush(); {
            // Moves and rotates the entire ship
            gTranslate(this.pos.x, this.pos.y, this.pos.z);
            gRotate(this.rot.z, 0, 0, 1);
            gRotate(this.rot.y, 0, 1, 0);
            gRotate(this.rot.x, 1, 0, 0);

            // Deck texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
            gl.uniform1i(gl.getUniformLocation(program, "texture2"), 0);

            // Draw the deck
            gPush(); {
                gTranslate(0, 5, 0);
                gRotate(90, 1, 0, 0);
                gScale(20, 20, 10);
                setColor(vec4(1, 1, 1, 1));

                gTranslate(-3, 0, 0);
                for (var i = 0; i < 6; i++) {
                    drawQuad();
                    gTranslate(1, 0, 0);
                }
            }
            gPop();

            // Draw the tips of the ship
            gPush(); {
                gTranslate(-74, 5, 0);
                setColor(vec4(1, 1, 1, 1));

                // Deck triangle
                gPush(); {
                    
                    // Back deck triangle
                    gPush(); {
                        gRotate(90, 1, 0, 0);
                        gRotate(90, 0, 0, 1);
                        gScale(10, 4, 20);
                        drawTriangle();
                    }
                    gPop();

                    // Front deck triangle
                    gTranslate(128, 0, 0);
                    gRotate(-90, 1, 0, 0);
                    gRotate(-90, 0, 0, 1);
                    gScale(10, 4, 20);
                    drawTriangle();
                }
                gPop();

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
                gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

                // Deck sides
                gTranslate(0, -5, -5);
                
                // Back deck sides
                gPush(); {
                    gPush(); {
                        gRotate(51, 0, 1, 0);
                        gScale(13, 10, 1);
                        drawQuad();
                    }
                    gPop();

                    gTranslate(0, 0, 10);
                    gRotate(-51, 0, 1, 0);
                    gScale(13, 10, 1);
                    drawQuad();
                }  
                gPop();

                gTranslate(128, 0, 0);
                // Front deck sides
                gPush(); {

                    gPush(); {
                        gRotate(-51, 0, 1, 0);
                        gScale(13, 10, 1);
                        drawQuad();
                    }
                    gPop();

                    gTranslate(0, 0, 10);
                    gRotate(51, 0, 1, 0);
                    gScale(13, 10, 1);
                    drawQuad();
                }
                gPop();
                
            }
            gPop();

            // Draw the sides plates
            gPush(); {
                gTranslate(0, 0, 10);
                gScale(20, 10, 1);
                setColor(vec4(1, 1, 1, 1));

                gTranslate(-3, 0, 0);
                for (var i = 0; i < 6; i++) {
                    drawQuad();
                    gTranslate(1, 0 ,0);
                }

                gTranslate(-6, 0, -20);
                for (var i = 0; i < 6; i++) {
                    drawQuad();
                    gTranslate(1, 0, 0);
                }
            }
            gPop();

            // Draw superstructure

            gPush(); {
                gTranslate(-10, 5, 0);
                gScale(20, 3, 5);
                setColor(vec4(1, 1, 1, 1));
                drawCube();
            }
            gPop();

            gPush(); {
                gTranslate(0, 10, 0);
                gScale(5, 10, 5);
                setColor(vec4(1, 1, 1, 1));
                drawCube();
            }
            gPop();

            // Turret superstructure
            gPush(); {
                gTranslate(20, 5, 0);
                gRotate(90, 1, 0, 0);
                gScale(8, 8, 10);
                setColor(vec4(1, 1, 1, 1));
                drawCylinder();
            }
            gPop();

            gPush(); {
                gTranslate(32, 5, 0);
                gRotate(90, 1, 0, 0);
                gScale(8, 8, 4);
                setColor(vec4(1, 1, 1, 1));
                drawCylinder();
            }
            gPop();

            gPush(); {
                gTranslate(-42, 5, 0);
                gRotate(90, 1, 0, 0);
                gScale(8, 8, 10);
                setColor(vec4(1, 1, 1, 1));
                drawCylinder();
            }
            gPop();

            gPush(); {
                gTranslate(-55, 5, 0);
                gRotate(90, 1, 0, 0);
                gScale(8, 8, 4);
                setColor(vec4(1, 1, 1, 1));
                drawCylinder();
            }
            gPop();

            
            // Renders each turret
            for (var i = 0; i < this.turrets.length; i++) { 
                this.renderTurret(this.turrets[i]); 
            }      
        }
        gPop();
    },

    // Turret positions L-R: -55, -42, 32, 20
    renderTurret : function(turret) {
        gPush(); {
            gTranslate(turret.pos.x, turret.pos.y, turret.pos.z);
            setColor(vec4(0, 0, 0, 1));
            gRotate(turret.rot.z, 0, 0, 1);
            gRotate(turret.rot.y, 0, 1, 0);
            gRotate(turret.rot.x, 1, 0, 0,);

            // Draw turret base
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
            gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

            gPush(); {

                gScale(5, 1.4, 3.5);
                drawCube();
            }
            gPop();

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
            gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

            // Draw turret guns
            gPush(); {
                gTranslate(10, 0, -1);
                gPush(); {
                    gTranslate(-5, 0, 0);
                    gRotate(turret.gunRot.z, 0, 0, 1);
                    gRotate(turret.gunRot.y, 0, 1, 0);
                    gRotate(turret.gunRot.x, 1, 0, 0);
                    gTranslate(5, 0, 0);
                    gScale(5, 0.5, 0.5);
                    drawCube();
                }
                gPop();

                gTranslate(0, 0, 2);
                gPush(); {
                    gTranslate(-5, 0, 0);
                    gRotate(turret.gunRot.z, 0, 0, 1);
                    gRotate(turret.gunRot.y, 0, 1, 0);
                    gRotate(turret.gunRot.x, 1, 0, 0);
                    gTranslate(5, 0, 0);
                    gScale(5, 0.5, 0.5);
                    drawCube();
                }
                gPop();
            }
            gPop();
        }
        gPop();
    }
}

// Object for one of the ships
var hood = {
    // Absolute position of the object
    pos : new Vector(),
    rot : new Vector(),

    // Each turret object
    turrets : [new Turret(), new Turret(), new Turret(), new Turret()],
    
    // Render function for drawing the entire ship
    render : function() {
        gPush(); {
            // Moves and rotates the entire ship
            gTranslate(this.pos.x, this.pos.y, this.pos.z);
            gRotate(this.rot.z, 0, 0, 1);
            gRotate(this.rot.y, 0, 1, 0);
            gRotate(this.rot.x, 1, 0, 0);

            // Deck texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureArray[3].textureWebGL);
            gl.uniform1i(gl.getUniformLocation(program, "texture2"), 0);

            // Draw the deck
            gPush(); {
                gTranslate(0, 5, 0);
                gRotate(90, 1, 0, 0);
                gScale(20, 20, 10);
                setColor(vec4(1, 1, 1, 1));

                gTranslate(-3, 0, 0);
                for (var i = 0; i < 6; i++) {
                    drawQuad();
                    gTranslate(1, 0, 0);
                }
            }
            gPop();

            // Draw the tips of the ship
            gPush(); {
                gTranslate(-74, 5, 0);
                setColor(vec4(1, 1, 1, 1));

                // Deck triangle
                gPush(); {
                    
                    // Back deck triangle
                    gPush(); {
                        gRotate(90, 1, 0, 0);
                        gRotate(90, 0, 0, 1);
                        gScale(10, 4, 20);
                        drawTriangle();
                    }
                    gPop();

                    // Front deck triangle
                    gTranslate(128, 0, 0);
                    gRotate(-90, 1, 0, 0);
                    gRotate(-90, 0, 0, 1);
                    gScale(10, 4, 20);
                    drawTriangle();
                }
                gPop();

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
                gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

                // Deck sides
                gTranslate(0, -5, -5);
                
                // Back deck sides
                gPush(); {
                    gPush(); {
                        gRotate(51, 0, 1, 0);
                        gScale(13, 10, 1);
                        drawQuad();
                    }
                    gPop();

                    gTranslate(0, 0, 10);
                    gRotate(-51, 0, 1, 0);
                    gScale(13, 10, 1);
                    drawQuad();
                }  
                gPop();

                gTranslate(128, 0, 0);
                // Front deck sides
                gPush(); {

                    gPush(); {
                        gRotate(-51, 0, 1, 0);
                        gScale(13, 10, 1);
                        drawQuad();
                    }
                    gPop();

                    gTranslate(0, 0, 10);
                    gRotate(51, 0, 1, 0);
                    gScale(13, 10, 1);
                    drawQuad();
                }
                gPop();
                
            }
            gPop();

            // Draw the sides plates
            gPush(); {
                gTranslate(0, 0, 10);
                gScale(20, 10, 1);
                setColor(vec4(1, 1, 1, 1));

                gTranslate(-3, 0, 0);
                for (var i = 0; i < 6; i++) {
                    drawQuad();
                    gTranslate(1, 0 ,0);
                }

                gTranslate(-6, 0, -20);
                for (var i = 0; i < 6; i++) {
                    drawQuad();
                    gTranslate(1, 0, 0);
                }
            }
            gPop();

            // Draw superstructure

            gPush(); {
                gTranslate(-10, 5, 0);
                gScale(20, 3, 5);
                setColor(vec4(1, 1, 1, 1));
                drawCube();
            }
            gPop();


            gPush(); {
                gTranslate(0, 10, 0);
                gScale(5, 10, 5);
                setColor(vec4(1, 1, 1, 1));
                drawCube();
            }
            gPop();

            gPush(); {
                gTranslate(-15, 10, 0);
                gScale(5, 10, 5);
                setColor(vec4(1, 1, 1, 1));
                drawCube();
            }
            gPop();

            // Turret superstructure
            gPush(); {
                gTranslate(20, 5, 0);
                gRotate(90, 1, 0, 0);
                gScale(8, 8, 10);
                setColor(vec4(1, 1, 1, 1));
                drawCylinder();
            }
            gPop();

            gPush(); {
                gTranslate(32, 5, 0);
                gRotate(90, 1, 0, 0);
                gScale(8, 8, 4);
                setColor(vec4(1, 1, 1, 1));
                drawCylinder();
            }
            gPop();

            gPush(); {
                gTranslate(-42, 5, 0);
                gRotate(90, 1, 0, 0);
                gScale(8, 8, 10);
                setColor(vec4(1, 1, 1, 1));
                drawCylinder();
            }
            gPop();

            gPush(); {
                gTranslate(-55, 5, 0);
                gRotate(90, 1, 0, 0);
                gScale(8, 8, 4);
                setColor(vec4(1, 1, 1, 1));
                drawCylinder();
            }
            gPop();

            
            // Renders each turret
            for (var i = 0; i < this.turrets.length; i++) { 
                this.renderTurret(this.turrets[i]); 
            }      
        }
        gPop();
    },



    // Turret positions L-R: -55, -42, 32, 20
    renderTurret : function(turret) {
        gPush(); {
            gTranslate(turret.pos.x, turret.pos.y, turret.pos.z);
            setColor(vec4(0, 0, 0, 1));
            gRotate(turret.rot.z, 0, 0, 1);
            gRotate(turret.rot.y, 0, 1, 0);
            gRotate(turret.rot.x, 1, 0, 0,);

            // Draw turret base
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
            gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

            gPush();
            {
                gScale(5, 1.4, 3.5);
                drawCube();
            }
            gPop();

            // Draw turret guns
            gPush(); {
                gTranslate(10, 0, -1);
                gPush(); {
                    gTranslate(-5, 0, 0);
                    gRotate(turret.gunRot.z, 0, 0, 1);
                    gRotate(turret.gunRot.y, 0, 1, 0);
                    gRotate(turret.gunRot.x, 1, 0, 0);
                    gTranslate(5, 0, 0);
                    gScale(5, 0.5, 0.5);
                    drawCube();
                }
                gPop();

                gTranslate(0, 0, 2);
                gPush(); {
                    gTranslate(-5, 0, 0);
                    gRotate(turret.gunRot.z, 0, 0, 1);
                    gRotate(turret.gunRot.y, 0, 1, 0);
                    gRotate(turret.gunRot.x, 1, 0, 0);
                    gTranslate(5, 0, 0);
                    gScale(5, 0.5, 0.5);
                    drawCube();
                }
                gPop();
            }
            gPop();
        }
        gPop();
    }
}

var sceneTime = 0;
function scene1(deltaTime) {
    // Initial setup
    if (sceneTime == 0) {
        // Initial positions for the turret
        bismarck.turrets[0].pos.x = -55;
        bismarck.turrets[0].pos.y = 8;
        

        bismarck.turrets[1].pos.x = -42;
        bismarck.turrets[1].pos.y = 10;

        bismarck.turrets[2].pos.x = 20;
        bismarck.turrets[2].pos.y = 10;

        bismarck.turrets[3].pos.x = 32;
        bismarck.turrets[3].pos.y = 8;

        bismarck.turrets[0].rotateTurret(-180, 0);
        bismarck.turrets[1].rotateTurret(-180, 0);

        at[0] = -45;
        eye = vec3(10, 5, 10);
    }


    at[0] += 0.05;
    eye[0] += 0.05;
    
    if (sceneTime >= 2) {
        at[0] += 0.05;
        eye[2] += 0.05;
        eye[1] += 0.05;
    } else {
        eye[2] += 0.02;
    }


    // Renders the water
    drawWater();
    // Ship rocking motion
    bismarck.rot.z = 0.5 * Math.sin(sceneTime);
    bismarck.pos.y = Math.sin(sceneTime);
    bismarck.rot.x = 2 * Math.cos(sceneTime);
    bismarck.render();

    waterOffset.x += -15 * deltaTime;
    sceneTime += deltaTime;
}

var explosionScale = 0;
function scene2(deltaTime) {
    // Initial setup
    if (sceneTime == 0) {
        waterOffset.x = 0;
        // Initial positions for the turret
        bismarck.turrets[0].pos.x = -55;
        bismarck.turrets[0].pos.y = 8;
        

        bismarck.turrets[1].pos.x = -42;
        bismarck.turrets[1].pos.y = 10;

        bismarck.turrets[2].pos.x = 20;
        bismarck.turrets[2].pos.y = 10;

        bismarck.turrets[3].pos.x = 32;
        bismarck.turrets[3].pos.y = 8;

        bismarck.turrets[0].rotateTurret(-180, 0);
        bismarck.turrets[1].rotateTurret(-180, 0);

        at[0] = 0;
        eye = vec3(65, 15, 25);
    }

    drawWater();

    // Ship rocking motion
    bismarck.rot.z = 0.5 * Math.sin(sceneTime);
    bismarck.pos.y = Math.sin(sceneTime);
    bismarck.rot.x = 2 * Math.cos(sceneTime);
    bismarck.render();

 
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[4].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture4"), 4);
    if (sceneTime >= 2 && sceneTime <= 7) {
        if (sceneTime <= 2.4) {
            bismarck.pos.z += -10 * deltaTime;
            bismarck.pos.x += 10 * deltaTime;
            bismarck.rot.y += 10 * deltaTime;
            explosionScale += deltaTime * 80;
        } else if (explosionScale >= 0) {
            explosionScale -= deltaTime * 50;
            bismarck.pos.z -= -10 * deltaTime;
            bismarck.rot.y -= 10 * deltaTime;
        }
       
        gPush(); {
            gTranslate(30, 1, 25);
            gScale(explosionScale / 2, explosionScale, explosionScale / 2);
            setColor(vec4(0, 0, 1, 1));
            drawSphere();
        }
        gPop();
    }

    waterOffset.x += -15 * deltaTime;
    sceneTime += deltaTime;
}

var bismarckTurretRot = 0;
function scene3(deltaTime) {
    // Initial setup
    if (sceneTime == 0) {
        waterOffset.x = 0;
        // Initial positions for the turret
        bismarck.turrets[0].pos.x = -55;
        bismarck.turrets[0].pos.y = 8;
        

        bismarck.turrets[1].pos.x = -42;
        bismarck.turrets[1].pos.y = 10;

        bismarck.turrets[2].pos.x = 20;
        bismarck.turrets[2].pos.y = 10;

        bismarck.turrets[3].pos.x = 32;
        bismarck.turrets[3].pos.y = 8;

        bismarck.turrets[0].rotateTurret(-90, 10);
        bismarck.turrets[1].rotateTurret(-90, 10);

        bismarck.turrets[2].rotateTurret(-90, 10);
        bismarck.turrets[3].rotateTurret(-90, 10);

        at = vec3(20, 5, 10)
        eye = vec3(50, 9, 20);
    }

    if (sceneTime <= 1.4) {
        bismarckTurretRot -= 64.2857 * deltaTime;
        bismarck.turrets[0].rotateTurret(-180 - bismarckTurretRot, 10);
        bismarck.turrets[1].rotateTurret(-180 - bismarckTurretRot, 10);

        bismarck.turrets[2].rotateTurret(bismarckTurretRot, 10);
        bismarck.turrets[3].rotateTurret(bismarckTurretRot, 10);
    }

    if (sceneTime >= 1.5 && sceneTime <= 1.75 ||
    sceneTime >= 4 && sceneTime <= 4.25) {
        toggleTextures();
        for (var i = 0; i < 4; i++) {
            gPush(); {
                gTranslate(bismarck.turrets[i].pos.x,
                    bismarck.turrets[i].pos.y + 4 + Math.sin(sceneTime),
                    bismarck.turrets[i].pos.z + 27);
                    gRotate(-10, 1, 0, 0);
                    setColor(vec4(1, 0, 0, 0.5));
                    gScale(1.4, 1.4, 10);
                    drawSphere();
            }
            gPop();
        }
        toggleTextures();
    }


    drawWater();

    // Ship rocking motion
    bismarck.rot.z = 0.5 * Math.sin(sceneTime);
    bismarck.pos.y = Math.sin(sceneTime);
    bismarck.rot.x = 2 * Math.cos(sceneTime);
    bismarck.render();
    
    waterOffset.x += -15 * deltaTime;
    sceneTime += deltaTime;
}

var bombTimer = 0;
var bombCounter = 0;
var bombLocation;
var turretVelocity = 10;
var bombColour = 0;
function scene4(deltaTime) {
    // Initial setup
    if (sceneTime == 0) {
        waterOffset.x = 0;
        // Initial positions for the turret
        hood.turrets[0].pos.x = -55;
        hood.turrets[0].pos.y = 8;

        hood.turrets[1].pos.x = -42;
        hood.turrets[1].pos.y = 10;

        hood.turrets[2].pos.x = 20;
        hood.turrets[2].pos.y = 10;

        hood.turrets[3].pos.x = 32;
        hood.turrets[3].pos.y = 8;

        hood.turrets[0].rotateTurret(-270, 10);
        hood.turrets[1].rotateTurret(-270, 10);

        hood.turrets[2].rotateTurret(90, 10);
        hood.turrets[3].rotateTurret(90, 10);

        at[0] = -42;
        eye = vec3(0, 20, -60);

        bombLocation = vec3(Math.random() * 60, 1, Math.random() * 5);
    }

    eye = vec3(-42 + 60 * Math.cos(sceneTime), 20, 60 * Math.sin(sceneTime));

    if (sceneTime <= 1) {
        gPush(); {
            toggleTextures();
            gTranslate(-42, 0, 0);
            gScale(20 * sceneTime, 30 * sceneTime, 20 * sceneTime);
            setColor(vec4(1, 0, 0, 1));
            drawSphere();
            toggleTextures();
        }
        gPop();
    } else {
        hood.pos.y -= 2 * deltaTime;

        if (sceneTime <= 7) {
            if (bombTimer <= 0.15) {
                bombTimer += deltaTime;
                
                toggleTextures();
                gPush(); {
                    gTranslate(bombLocation[0], 5, bombLocation[2]);
                    gScale(10, 10, 10);
                    setColor(vec4(bombColour, 0, 0, 1));
                    drawSphere();
                }
                gPop();
                toggleTextures();
            } else {
                bombTimer = 0;
                bombLocation = vec3(60 - Math.random() * 120, 1, Math.random() * 5);
                bombColour = 0.5 + Math.random() * 0.5;
            }
        }  
    }

    hood.turrets[1].rot.x += 10;
    hood.turrets[1].rot.y -= 2;
    hood.turrets[1].rot.z += 3;
    if (sceneTime <= 1.5) {
        hood.turrets[1].pos.z += 0.2;
        hood.turrets[1].pos.y += turretVelocity * deltaTime;
    } else {
        hood.turrets[1].pos.z += 0.2;
        hood.turrets[1].pos.y += turretVelocity * deltaTime;
    }

    turretVelocity -= 15 * deltaTime;

    drawWater();
    hood.render();

    waterOffset.x += -8 * deltaTime;
    sceneTime += deltaTime;
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 3.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;

    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function (ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };

    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function (ev) {
        controller.dragging = false;
    };

    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function (ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };
}