// Author - Ariel Mendez | A01020690
// Resouces or tutorials that inspired this project
// tutorial - https://www.youtube.com/watch?v=kB0ZVUrI4Aw
// webgl fundamentals blog - https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
// lighting in webgl - https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Lighting_in_WebGL#building_the_normals_for_the_vertices

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
  var texCoordAttrLocation = gl.getAttribLocation(program, 'vertTexCoord');
  var normalAttrLocation = gl.getAttribLocation(program, 'vertNormal');

  // get uniform locations
  var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
  var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

  // draws main scene
  requestAnimationFrame(drawScene);

  function drawBricks(transforms, texture) {
    const { translation, scale, worldProps } = transforms;

    // create wall vertex buffer
    var wallVertexBufferObj = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wallVertexBufferObj);
    setWallVertexData(gl, translation, scale);

    // create normal vertex buffer
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    setWallNormalsData(gl);

    // create wall index buffer
    var wallIndexBufferObj = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wallIndexBufferObj);
    setWallIndexBuffer(gl);

    // Tell OpenGL state machine which program should be active.
    gl.useProgram(program);

    // enable position attr
    gl.enableVertexAttribArray(positionAttrLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, wallVertexBufferObj);
    gl.vertexAttribPointer(
      positionAttrLocation, // Attribute location
      3, // Number of elements per attribute
      gl.FLOAT, // Type of elements
      gl.FALSE,
      5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
      0 // Offset from the beginning of a single vertex to this attribute
    );

    // enable color attr
    gl.enableVertexAttribArray(texCoordAttrLocation);

    gl.vertexAttribPointer(
      texCoordAttrLocation, // Attribute location
      2, // Number of elements per attribute
      gl.FLOAT, // Type of elements
      gl.FALSE,
      5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
      3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
    );
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // enable normal attr
    gl.enableVertexAttribArray(normalAttrLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(normalAttrLocation, 3, gl.FLOAT, gl.TRUE, 0, 0);

    const { rotate } = worldProps;
    if (rotate) {
      const { rotationFunction, angle } = worldProps;
      var identityMatrix = new Float32Array(16);
      glMatrix.mat4.identity(identityMatrix);

      glMatrix.mat4.rotate(
        worldProps.worldMatrix,
        identityMatrix,
        rotationFunction(angle),
        [1, 0, 0]
      );
      gl.uniformMatrix4fv(
        worldProps.matWorldUniformLocation,
        gl.FALSE,
        worldProps.worldMatrix
      );
    }

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    // reset rotation props
    if (rotate) {
      glMatrix.mat4.identity(worldProps.worldMatrix);
      gl.uniformMatrix4fv(
        worldProps.matWorldUniformLocation,
        gl.FALSE,
        worldProps.worldMatrix
      );
    }
  }

  function drawPlane(planeTransforms) {

    // destructure plane transformation attrs
    const { translation, scale, worldProps } = planeTransforms;

    const planeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, planeBuffer);
    setPlaneData(gl, translation, scale);

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

    const { rotate, angle } = worldProps;
    
    if (rotate) {
      var identityMatrix = new Float32Array(16);
      glMatrix.mat4.identity(identityMatrix);

      glMatrix.mat4.rotate(
        worldProps.worldMatrix,
        identityMatrix,
        angle,
        [1, 0, 0]
      );
      gl.uniformMatrix4fv(
        worldProps.matWorldUniformLocation,
        gl.FALSE,
        worldProps.worldMatrix
      );
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // reset rotation props
    if (rotate) {
      glMatrix.mat4.identity(worldProps.worldMatrix);
      gl.uniformMatrix4fv(
        worldProps.matWorldUniformLocation,
        gl.FALSE,
        worldProps.worldMatrix
      );
    }
  }

  function createTextures(images) {
    var textures = [];
    for (var i = 0; i < images.length; i++) {

      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        document.getElementById(images[i])
      );
      // gl.activeTexture(gl.TEXTURE0);

      textures.push(texture);;
    }
    return textures;
  }

  function drawScene(time) {
    time *= 0.00009;

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
    var distance = 30;

    glMatrix.mat4.identity(worldMatrix);
    // lookAt value [30, 17, -25]
    glMatrix.mat4.lookAt(viewMatrix, [distance * Math.cos(time), 13, distance * Math.sin(time)], [0, 0, 0], [0, 1, 0]);
    glMatrix.mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);
  
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    // create textures
    const images = [
      "tower-bricks-img",
      "castle-door-img",
      "bricks-img",
      "house-img",
      "grass-img",
      "water-img",
      "path-img",
      "trunk-img",
      "leaves-img"
    ];
    var textureArray = createTextures(images);

    // draw objects
    const mainTowerTransforms = {
      translation: {
        tx: 0.0,
        ty: 3.0,
        tz: 5.0,
      },
      scale: {
        sx: 1.0,
        sy: 3.0,
        sz: 1.0,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(mainTowerTransforms, textureArray[0]);

    var x = time % 2;
    if (x <= 1) {
      doorAngle = x;
    } else {
      doorAngle = -x + 2;
    }

    const doorTransforms = {
      translation: {
        tx: 0.0,
        ty: 1.5,
        tz: 0.0,
      },
      scale: {
        sx: 2.0,
        sy: 1.5,
        sz: 0.3,
      },
      worldProps: {
        rotate: true,
        angle: doorAngle,
        rotationFunction: (angle) => -Math.asin(angle),
        worldMatrix,
        matWorldUniformLocation,
      },
    };
    drawBricks(doorTransforms, textureArray[1]);

    const houseTransforms = {
      translation: {
        tx: 0.0,
        ty: 7.0,
        tz: 5.0,
      },
      scale: {
        sx: 1.5,
        sy: 1.5,
        sz: 1.5,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    };
    drawBricks(houseTransforms, textureArray[3]);

    // Front walls
    const wall1Transforms = {
      translation: {
        tx: 6.0,
        ty: 1.5,
        tz: 0.0,
      },
      scale: {
        sx: 4.0,
        sy: 1.5,
        sz: 1.0,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(wall1Transforms, textureArray[2]);

    const wall2Transforms = {
      translation: {
        tx: -6.0,
        ty: 1.5,
        tz: 0.0,
      },
      scale: {
        sx: 4.0,
        sy: 1.5,
        sz: 1.0,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(wall2Transforms, textureArray[2]);

    // Back walls
    const leftBackWall = {
      translation: {
        tx: 4.0,
        ty: 1.5,
        tz: 8.9,
      },
      scale: {
        sx: 4.5,
        sy: 1.5,
        sz: 1.0,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(leftBackWall, textureArray[2]);

    const rightBackWall = {
      translation: {
        tx: -4.5,
        ty: 1.5,
        tz: 8.9,
      },
      scale: {
        sx: 4.0,
        sy: 1.5,
        sz: 1.0,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(rightBackWall, textureArray[2]);

    // Lateral walls
    const leftWall = {
      translation: {
        tx: 9.1,
        ty: 1.5,
        tz: 4.4,
      },
      scale: {
        sx: 1.0,
        sy: 1.5,
        sz: 5.5,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(leftWall, textureArray[2]);

    const rightWall = {
      translation: {
        tx: -9.1,
        ty: 1.5,
        tz: 4.4,
      },
      scale: {
        sx: 1.0,
        sy: 1.5,
        sz: 5.5,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(rightWall, textureArray[2]);

    // draw trees
    const baseTree1 = {
      translation: {
        tx: 1.7,
        ty: 1.0,
        tz: -6.0,
      },
      scale: {
        sx: 0.2,
        sy: 0.7,
        sz: 0.2,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(baseTree1, textureArray[7]);

    const treeTop1 = {
      translation: {
        tx: 1.7,
        ty: 2.1,
        tz: -6.0,
      },
      scale: {
        sx: 0.5,
        sy: 0.5,
        sz: 0.5,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(treeTop1, textureArray[8]);

    const baseTree2 = {
      translation: {
        tx: -1.7,
        ty: 1.0,
        tz: -6.0,
      },
      scale: {
        sx: 0.2,
        sy: 0.7,
        sz: 0.2,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(baseTree2, textureArray[7]);

    const treeTop2 = {
      translation: {
        tx: -1.7,
        ty: 2.1,
        tz: -6.0,
      },
      scale: {
        sx: 0.5,
        sy: 0.5,
        sz: 0.5,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(treeTop2, textureArray[8]);

    const baseTree3 = {
      translation: {
        tx: 1.7,
        ty: 1.0,
        tz: -10.0,
      },
      scale: {
        sx: 0.2,
        sy: 0.7,
        sz: 0.2,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(baseTree3, textureArray[7]);

    const treeTop3 = {
      translation: {
        tx: 1.7,
        ty: 2.1,
        tz: -10.0,
      },
      scale: {
        sx: 0.5,
        sy: 0.5,
        sz: 0.5,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(treeTop3, textureArray[8]);

    const baseTree4 = {
      translation: {
        tx: -1.7,
        ty: 1.0,
        tz: -10.0,
      },
      scale: {
        sx: 0.2,
        sy: 0.7,
        sz: 0.2,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(baseTree4, textureArray[7]);

    const treeTop4 = {
      translation: {
        tx: -1.7,
        ty: 2.1,
        tz: -10.0,
      },
      scale: {
        sx: 0.5,
        sy: 0.5,
        sz: 0.5,
      },
      worldProps: {
        rotate: false,
        worldMatrix,
        matWorldUniformLocation,
      },
    }
    drawBricks(treeTop4, textureArray[8]);

    // draw planes
    const pathTransforms = {
      translation: {
        tx: 0.0,
        ty: -6.9,
        tz: 0.0,
      },
      scale: {
        sx: 1.5,
        sy: 3.9,
        sz: 1.0,
      },
      worldProps: {
        rotate: true,
        angle: 1.58825,
        worldMatrix,
        matWorldUniformLocation,
      },
    };
    gl.bindTexture(gl.TEXTURE_2D, textureArray[6]);
    drawPlane(pathTransforms);

    const waterTransforms = {
      translation: {
        tx: 0.0,
        ty: -1.5,
        tz: 0.0,
      },
      scale: {
        sx: 11.0,
        sy: 1.5,
        sz: 1.0,
      },
      worldProps: {
        rotate: true,
        angle: 1.58825,
        worldMatrix,
        matWorldUniformLocation,
      },
    };
    gl.bindTexture(gl.TEXTURE_2D, textureArray[5]);
    drawPlane(waterTransforms);

    const grassTransforms = {
      translation: {
        tx: 0.0,
        ty: 0.0,
        tz: 0.0,
      },
      scale: {
        sx: 11.0,
        sy: 11.0,
        sz: 1.0,
      },
      worldProps: {
        rotate: true,
        angle: Math.PI / 2,
        worldMatrix,
        matWorldUniformLocation,
      },
    };
    gl.bindTexture(gl.TEXTURE_2D, textureArray[4]);
    drawPlane(grassTransforms);

    requestAnimationFrame(drawScene);
  }
};

const setWallVertexData = (gl, translation, scale) => {
  const { tx, ty, tz } = translation;
  const { sx, sy, sz } = scale;

  var wallVertices = 
  [ // X, Y, Z                                        U, V
		// Top
		-1.0 * sx + tx, 1.0 * sy + ty, -1.0 * sz + tz,    0, 0,
		-1.0 * sx + tx, 1.0 * sy + ty, 1.0 * sz + tz,     0, 1,
		1.0 * sx + tx, 1.0 * sy + ty, 1.0 * sz + tz,      1, 1,
		1.0 * sx + tx, 1.0 * sy + ty, -1.0 * sz + tz,     1, 0,

		// Left
		-1.0 * sx + tx, 1.0 * sy + ty, 1.0 * sz + tz,    0, 0,
		-1.0 * sx + tx, -1.0 * sy + ty, 1.0 * sz + tz,   1, 0,
		-1.0 * sx + tx, -1.0 * sy + ty, -1.0 * sz + tz,  1, 1,
		-1.0 * sx + tx, 1.0 * sy + ty, -1.0 * sz + tz,   0, 1,

		// Right
		1.0 * sx + tx, 1.0 * sy + ty, 1.0 * sz + tz,    1, 1,
		1.0 * sx + tx, -1.0 * sy + ty, 1.0 * sz + tz,   0, 1,
		1.0 * sx + tx, -1.0 * sy + ty, -1.0 * sz + tz,  0, 0,
		1.0 * sx + tx, 1.0 * sy + ty, -1.0 * sz + tz,   1, 0,

		// Front
		1.0 * sx + tx, 1.0 * sy + ty, 1.0 * sz + tz,     1, 1,
		1.0 * sx + tx, -1.0 * sy + ty, 1.0 * sz + tz,    1, 0,
		-1.0 * sx + tx, -1.0 * sy + ty, 1.0 * sz + tz,   0, 0,
		-1.0 * sx + tx, 1.0 * sy + ty, 1.0 * sz + tz,    0, 1,

		// Back
		1.0 * sx + tx, 1.0 * sy + ty, -1.0 * sz + tz,    0, 0,
		1.0 * sx + tx, -1.0 * sy + ty, -1.0 * sz + tz,   0, 1,
		-1.0 * sx + tx, -1.0 * sy + ty, -1.0 * sz + tz,  1, 1,
		-1.0 * sx + tx, 1.0 * sy + ty, -1.0 * sz + tz,   1, 0,

		// Bottom
		-1.0 * sx + tx, -1.0 * sy + ty, -1.0 * sz + tz,   1, 1,
		-1.0 * sx + tx, -1.0 * sy + ty, 1.0 * sz + tz,    1, 0,
		1.0 * sx + tx, -1.0 * sy + ty, 1.0 * sz + tz,     0, 0,
		1.0 * sx + tx, -1.0 * sy + ty, -1.0 * sz + tz,    0, 1,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wallVertices), gl.STATIC_DRAW);
}

const setWallNormalsData = (gl) => {
  const vertexNormals = [
    // Front
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,

    // Back
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,

    // Top
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,

    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,

    // Right
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,

    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
  ]

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexNormals),
    gl.STATIC_DRAW
  );
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

const setPlaneData = (gl, translation, scale) => {
  const { tx, ty, tz } = translation;
  const { sx, sy } = scale;
  const positions = [
    -1.0 * sx + tx,  1.0 * sy + ty,
     1.0 * sx + tx,  1.0 * sy + ty,
    -1.0 * sx + tx, -1.0 * sy + ty,
     1.0 * sx + tx, -1.0 * sy + ty,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}

main();