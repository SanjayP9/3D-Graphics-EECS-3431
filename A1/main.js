var canvas;
var gl;

var program;

var near = -100;
var far = 100;


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

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = true;

// Used to store array of bubble objects (x, y, z, launch time)
var bubbleArray = [];
// Time that the last 4-5 set of bubbles were launched
var lastLaunch = 0;
// Array of launch time for the set of 4-5 bubbles
var launchTimes = [];


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

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    setColor(materialDiffuse);

    Cube.init(program);
    Cylinder.init(9, program);
    Cone.init(9, program);
    Sphere.init(36, program);


    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");


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


    /*document.getElementById("sliderXi").onchange = function () {
        RX = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderYi").onchange = function () {
        RY = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderZi").onchange = function () {
        RZ = this.value;
        window.requestAnimFrame(render);
    };

    document.getElementById("animToggleButton").onclick = function () {
        if (animFlag) {
            animFlag = false;
        } else {
            animFlag = true;
            resetTimerFlag = true;
            window.requestAnimFrame(render);
        }
        console.log(animFlag);
    };*/


    render();
};

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
// and replaces the modeling matrix with the result
function gTranslate(x, y, z) {
    modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta, x, y, z) {
    modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx, sy, sz) {
    modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}


function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0, 0, 10);
    MS = []; // Initialize modeling matrix stack

    modelMatrix = mat4();

    // set the camera matrix
    viewMatrix = lookAt(eye, at, up);

    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);


    gRotate(RZ, 0, 0, 1);
    gRotate(RY, 0, 1, 0);
    gRotate(RX, 1, 0, 0);


    setAllMatrices();

    var curTime;
    if (animFlag) {
        curTime = (new Date()).getTime() / 1000;
        if (resetTimerFlag) {
            prevTime = curTime;
            resetTimerFlag = false;
        }
        TIME = TIME + curTime - prevTime;
        prevTime = curTime;
    }

    // Global scales
    var globalScale = 0.7;
    gScale(globalScale, globalScale, globalScale);
    gTranslate(0.0, -2, 0.0);

    // Ground Box
    gPush();
    {
        gTranslate(0, -6, 0);
        gScale(100, 1, 1);
        setColor(vec4(0.0, 0.0, 0.0, 1.0));
        drawCube();
    }
    gPop();
    // Ground Box

    // Seaweed
    // X, Y, Z locations for the seaweed bases
    var seaweedLocations = [
        [-0.7, -4.5, 0],
        [0, -4.05, 0],
        [0.7, -4.5, 0]
    ];

    // Iterates through the seaweed locations array and draws the seaweed bases at those locations
    var i;
    for (i = 0; i < seaweedLocations.length; i++) {
        drawSeaweed(seaweedLocations[i][0], seaweedLocations[i][1], seaweedLocations[i][2])
    }
    // Seaweed

    // Two Rocks
    gPush();
    {
        gTranslate(0, -4.3, 0);
        gScale(0.7, 0.7, 0.7);
        setColor(vec4(0.3, 0.3, 0.3, 1.0));
        drawSphere();
    }
    gPop();
    gPush();
    {
        gTranslate(-1.1, -4.63, 0);
        gScale(0.35, 0.35, 0.35);
        setColor(vec4(0.3, 0.3, 0.3, 1.0));
        drawSphere();
    }
    gPop();
    // Two Rocks

    // Fish
    gPush();
    {
        // Rotates and translates the fish around the two sphere in a circle pattern and
        // is tangent to the circle
        gRotate(TIME * 120 / 3.14159, 0, -1, 0);
        gScale(-1, 1, 1);
        gTranslate(0, -7.5 + 0.04 * Math.sin(TIME / 0.9) * 45 / 3.14159, 0);
        gPush();
        {
            gTranslate(4, 4, 0);

            // Fish Body
            gPush();
            {
                gScale(0.6, 0.6, 2.5);
                setColor(vec4(0.6, 0.1, 0.1, 1.0));
                drawCone();
            }
            gPop();

            // Fish Face
            gPush();
            {
                gTranslate(0, 0, -1.6);
                gScale(0.6, 0.6, -0.7);
                setColor(vec4(0.6, 0.6, 0.6, 1.0));
                drawCone();
            }
            gPop();

            // Fish Tail
            gPush();
            {
                // Tails oscillates
                gTranslate(0, 0, 1.3);
                gRotate(Math.sin(TIME / 0.1) * 90 / 3.14159, 0, 1, 0);

                // Top Tail
                gPush();
                {
                    gTranslate(0, 0.45, 0.4);
                    gRotate(-45, 1, 0, 0);
                    gScale(0.25, 0.25, 1.4);
                    setColor(vec4(0.6, 0.1, 0.1, 1.0));
                    drawCone();
                }
                gPop();

                // Bottom Tail
                gPush();
                {
                    gTranslate(0, -0.25, 0.2);
                    gRotate(45, 1, 0, 0);
                    gScale(0.25, 0.25, 0.7);
                    setColor(vec4(0.6, 0.1, 0.1, 1.0));
                    drawCone();
                }
                gPop();
            }
            gPop();

            // Fish Eyes
            gPush();
            {
                gTranslate(0.35, 0.3, -1.5);
                gScale(0.15, 0.15, 0.15);
                setColor(vec4(1.0, 1.0, 1.0, 1.0));
                drawSphere();
            }
            gPop();
            gPush();
            {
                gTranslate(-0.35, 0.3, -1.5);
                gScale(0.15, 0.15, 0.15);
                setColor(vec4(1.0, 1.0, 1.0, 1.0));
                drawSphere();
            }
            gPop();
            gPush();
            {
                gTranslate(0.35, 0.3, -1.65);
                gScale(0.07, 0.07, 0.07);
                setColor(vec4(0.0, 0.0, 0.0, 0.0));
                drawSphere();
            }
            gPop();
            gPush();
            {
                gTranslate(-0.35, 0.3, -1.65);
                gScale(0.07, 0.07, 0.07);
                setColor(vec4(0.0, 0.0, 0.0, 0.0));
                drawSphere();
            }
            gPop();

        }
        gPop();
    }
    gPop();
    // Fish

    // Diver
    gPush();
    {
        // Diver oscillates in x and y world directions
        gTranslate(5 + Math.sin(TIME / 2), 5 + Math.sin(TIME / 2), 0);
        gRotate(20, 0, -1, 0);

        // Head
        gPush();
        {
            gScale(0.4, 0.4, 0.4);
            setColor(vec4(0.5, 0.0, 0.5, 1.0));
            drawSphere();
        }
        gPop();

        // Bubbles
        // Launches a set of 4-5 bubbles over a 2.4 - 3.0 second time period every 4 seconds
        if ((TIME - lastLaunch) > 6.4 || lastLaunch === 0) {

            // Random number of bubbles from 4 to 5
            var bubblesToAdd = Math.floor(Math.random() * Math.floor(2)) + 3;
            launchTimes.push(Math.round(TIME));

            // Adds launch times to launchTimes array
            for (; bubblesToAdd >= 1; bubblesToAdd--) {
                var time = Math.round(TIME) + bubblesToAdd * 0.6;
                launchTimes.push(time);
            }
            lastLaunch = TIME;
        }

        //  If the launch time has been passed bubble is launched from divers mouth and removed
        //  from launchTimes array
        var b;
        for (b = 0; b < launchTimes.length; b++) {
            if (launchTimes[b] < TIME) {
                bubbleArray.push([5 + Math.sin(TIME / 2), 5 + Math.sin(TIME / 2), 1, TIME]);
                launchTimes.splice(b, 1);
                b--;
            }
        }
        // Bubbles

        // Torso
        gPush();
        {
            gTranslate(0, -1.6, 0);
            gScale(1.0, 1.2, 0.4);
            setColor(vec4(0.5, 0.0, 0.5, 1.0));
            drawCube()
        }
        gPop();

        // Legs
        gPush();
        {
            gTranslate(0, -3.2, 0);
            setColor(vec4(0.5, 0.0, 0.5, 1.0));

            // Leg 1
            gPush();
            {
                // Legs kick with sin function
                gTranslate(-0.5, 0, -0.2);
                gRotate(-(Math.sin(TIME) * 25) + 32.5, 1, 0, 0);

                // Thigh
                gPush();
                {
                    gScale(0.2, 0.7, 0.2);
                    drawCube();
                }
                gPop();

                // Shin
                gTranslate(0, -1.4, -0.3);
                gRotate(25, 1, 0, 0);

                gPush();
                {
                    gScale(0.2, 0.7, 0.2);
                    drawCube();
                }
                gPop();

                // Foot
                // Foot does not move
                gTranslate(0, -0.6, 0.5);

                gPush();
                {
                    gScale(0.2, 0.1, 0.6);
                    drawCube();
                }
                gPop();
            }
            gPop();

            // Leg 2
            gPush();
            {

                gTranslate(0.5, 0, -0.2);
                gRotate((Math.sin(TIME) * 25) + 32.5, 1, 0, 0);

                // Thigh
                gPush();
                {
                    gScale(0.2, 0.7, 0.2);
                    drawCube();
                }
                gPop();

                // Shin
                gTranslate(0, -1.4, -0.3);
                gRotate(25, 1, 0, 0);

                gPush();
                {
                    gScale(0.2, 0.7, 0.2);
                    drawCube();
                }
                gPop();

                // Foot
                gTranslate(0, -0.6, 0.5);

                gPush();
                {
                    gScale(0.2, 0.1, 0.6);
                    drawCube();
                }
                gPop();
            }
            gPop();
        }
        gPop();
    }
    gPop();
    //Diver

    // Bubbles
    // Draws bubbles
    var num;
    for (num = 0; num < bubbleArray.length; num++) {

        // If the bubble has been active for more than 12 seconds remove it from the array
        if (Math.round(TIME - bubbleArray[num][3]) > 12) {
            bubbleArray.splice(num, 1);
            num--;
        } else {
            bubbleArray[num][1] += 0.015;
            drawBubble(bubbleArray[num][0], bubbleArray[num][1], bubbleArray[num][2]);
        }
    }
    // Bubbles

    if (animFlag)
        window.requestAnimFrame(render);
}

// Drawing seaweed function
function drawSeaweed(x, y, z) {
    gPush();
    {
        gTranslate(x, y, z);

        // Draws 10 seaweed ellipses
        var i;
        for (i = 0; i < 10; i++) {
            gTranslate(0, 0.95, 0);

            // Seaweed animation
            gRotate((1 / 3) * Math.sin(TIME + i) * 90 / 3.14159, 0, 0, 1);

            gPush();
            {
                gScale(0.2, 0.5, 0.7);
                setColor(vec4(0.0, 1.0, 0.0, 1.0));
                drawSphere();
            }
            gPop();
        }
    }
    gPop();
}

// Draws individual bubbles
function drawBubble(x, y, z) {
    gPush();
    {
        // Bubbles oscillate with time
        gTranslate(x, y, z);
        gRotate((TIME % 360) * 100, 5, 5, 5);
        gScale(0.2, 0.24, 0.2);
        setColor(vec4(1.0, 1.0, 1.0, 1.0));
        drawSphere()
    }
    gPop();
}
