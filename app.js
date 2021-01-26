// Author - Ariel Mendez | A01020690
// Resouces or tutorials that inspired this project
// tutorial - https://www.youtube.com/watch?v=kB0ZVUrI4Aw
// blog - https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

const createShader = (gl, type, source) => {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.log("Error while creating the shader", gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
};

const createProgram = (gl, vertexShader, fragmentShader) => {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  console.log(
    "Error while creating the program",
    gl.getProgramInfoLog(program)
  );
  gl.deleteProgram(program);
};

var main = function () {

  const canvas = document.getElementById("surface");
  // gets WebGLRenderingContext
  var gl = canvas.getContext("webgl");

  if (!gl) {
    console.log("WebGL not supported, falling back on experimental-webgl");
    gl = canvas.getContext("experimental-webgl");
  }

  if (gl === null) {
    alert("Browser does not support WebGL");
    return;
  }

  // get shaders text
  var vertexShaderTxt = document.querySelector("#vertex-shader").text;
  var fragmentShaderTxt = document.querySelector("#fragment-shader").text;

  // create the shaders
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderTxt);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderTxt);

  // create program
  var program = createProgram(gl, vertexShader, fragmentShader);

  // get vertex attribute locations
  var positionAttrLocation = gl.getAttribLocation(program, 'vertPosition');
  var colorAttrLocation = gl.getAttribLocation(program, 'vertColor');

  // get uniform locations
  var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
  var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

  // draws main scene
  drawScene();

  function drawWall(transforms) {
    // create wall vertex buffer
    var wallVertexBufferObj = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wallVertexBufferObj);
    setWallData(gl, transforms.tx, transforms.ty, transforms.tz);
    
    // create wall index buffer
    var wallIndexBufferObj = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wallIndexBufferObj);setWallIndexBuffer(gl);

    // Tell OpenGL state machine which program should be active.
    gl.useProgram(program);
  
    // enable position attr
    gl.enableVertexAttribArray(positionAttrLocation);
  
    gl.vertexAttribPointer(
      positionAttrLocation, // Attribute location
      3, // Number of elements per attribute
      gl.FLOAT, // Type of elements
      gl.FALSE,
      6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
      0 // Offset from the beginning of a single vertex to this attribute
    );
  
    // enable color attr
    gl.enableVertexAttribArray(colorAttrLocation);
  
    gl.vertexAttribPointer(
      colorAttrLocation, // Attribute location
      3, // Number of elements per attribute
      gl.FLOAT, // Type of elements
      gl.FALSE,
      6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
      3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
    );

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
  }

  function drawPlane(planeTransforms) {

    // destructure plane transformation attrs
    const { tx, ty, tz, worldProps } = planeTransforms;

    const planeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, planeBuffer);
    setPlaneData(gl, tx, ty);

    // Tell OpenGL state machine which program should be active.
    gl.useProgram(program);

    // enable position attr
    gl.enableVertexAttribArray(positionAttrLocation);

    gl.vertexAttribPointer(
      positionAttrLocation, // Attribute location
      2, // Number of elements per attribute
      gl.FLOAT, // Type of elements
      gl.FALSE,
      0, // Size of an individual vertex
      0 // Offset from the beginning of a single vertex to this attribute
    );

    var identityMatrix = new Float32Array(16);
    glMatrix.mat4.identity(identityMatrix);

    glMatrix.mat4.rotate(worldProps.worldMatrix, identityMatrix, Math.PI / 2, [1, 0, 0]);
    gl.uniformMatrix4fv(worldProps.matWorldUniformLocation, gl.FALSE, worldProps.worldMatrix);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function drawScene() {
    // clear canvas
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // enable culling and depth_test
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    // Tell OpenGL state machine which program should be active.
    gl.useProgram(program);
  
    // compute the matrices
    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);

    glMatrix.mat4.identity(worldMatrix);
    glMatrix.mat4.lookAt(viewMatrix, [0, 1, -15], [0, 0, 0], [0, 1, 0]);
    glMatrix.mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);
  
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    const wall1Transforms = {
      tx: 2.0,
      ty: 1.0,
      tz: 0.0,
    }
    drawWall(wall1Transforms);

    const wall2Transforms = {
      tx: -2.0,
      ty: 1.0,
      tz: 0.0,
    }
    drawWall(wall2Transforms);

    const planeTransforms = {
      tx: 0.0,
      ty: 0.0,
      tz: 0.0,
      worldProps: {
        worldMatrix,
        matWorldUniformLocation,
      },
    };

    drawPlane(planeTransforms);
  }
};

const setWallData = (gl, tx, ty, tz) => {

  var wallVertices = 
  [ // X, Y, Z                         R, G, B
		// Top
		-1.0 + tx, 1.0 + ty, -1.0 + tz,    0.5, 0.5, 0.5,
		-1.0 + tx, 1.0 + ty, 1.0 + tz,     0.5, 0.5, 0.5,
		1.0 + tx, 1.0 + ty, 1.0 + tz,      0.5, 0.5, 0.5,
		1.0 + tx, 1.0 + ty, -1.0 + tz,     0.5, 0.5, 0.5,

		// Left
		-1.0 + tx, 1.0 + ty, 1.0 + tz,    0.75, 0.25, 0.5,
		-1.0 + tx, -1.0 + ty, 1.0 + tz,   0.75, 0.25, 0.5,
		-1.0 + tx, -1.0 + ty, -1.0 + tz,  0.75, 0.25, 0.5,
		-1.0 + tx, 1.0 + ty, -1.0 + tz,   0.75, 0.25, 0.5,

		// Right
		1.0 + tx, 1.0 + ty, 1.0 + tz,    0.25, 0.25, 0.75,
		1.0 + tx, -1.0 + ty, 1.0 + tz,   0.25, 0.25, 0.75,
		1.0 + tx, -1.0 + ty, -1.0 + tz,  0.25, 0.25, 0.75,
		1.0 + tx, 1.0 + ty, -1.0 + tz,   0.25, 0.25, 0.75,

		// Front
		1.0 + tx, 1.0 + ty, 1.0 + tz,     1.0, 0.0, 0.15,
		1.0 + tx, -1.0 + ty, 1.0 + tz,    1.0, 0.0, 0.15,
		-1.0 + tx, -1.0 + ty, 1.0 + tz,   1.0, 0.0, 0.15,
		-1.0 + tx, 1.0 + ty, 1.0 + tz,    1.0, 0.0, 0.15,

		// Back
		1.0 + tx, 1.0 + ty, -1.0 + tz,    0.0, 1.0, 0.15,
		1.0 + tx, -1.0 + ty, -1.0 + tz,   0.0, 1.0, 0.15,
		-1.0 + tx, -1.0 + ty, -1.0 + tz,  0.0, 1.0, 0.15,
		-1.0 + tx, 1.0 + ty, -1.0 + tz,   0.0, 1.0, 0.15,

		// Bottom
		-1.0 + tx, -1.0 + ty, -1.0 + tz,   0.5, 0.5, 1.0,
		-1.0 + tx, -1.0 + ty, 1.0 + tz,    0.5, 0.5, 1.0,
		1.0 + tx, -1.0 + ty, 1.0 + tz,     0.5, 0.5, 1.0,
		1.0 + tx, -1.0 + ty, -1.0 + tz,    0.5, 0.5, 1.0,
	];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wallVertices), gl.STATIC_DRAW);
}

const setWallIndexBuffer = (gl) => {
  var boxIndices =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);
}

const setPlaneData = (gl, tx, ty) => {
  const positions = [
    -1.0 + tx,  1.0 + ty,
     1.0 + tx,  1.0 + ty,
    -1.0 + tx, -1.0 + ty,
     1.0 + tx, -1.0 + ty,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}

main();