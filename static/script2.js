let currentIndex = 0;
const items = document.querySelectorAll('.carousel-item');
const totalItems = items.length;
const rainbowWave = document.getElementById('rainbowWave');

document.getElementById('nextBtn').addEventListener('click', () => {
    moveToNextItem();
});

document.getElementById('prevBtn').addEventListener('click', () => {
    moveToPrevItem();
});

function updateCarousel() {
    items.forEach((item, index) => {
        item.classList.remove('active');
        item.querySelector('img').classList.remove('glow');
        if (index === currentIndex) {
            item.classList.add('active');
            triggerRainbowWave(item.querySelector('img'));
        }
    });

    const carousel = document.getElementById('celebrityCarousel');
    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
}

// Remove the fade-in/out CSS from the active class
document.querySelectorAll('.carousel-item').forEach(item => {
    item.style.transition = 'none'; // Disable transition effect for direct switch
});

function moveToNextItem() {
    currentIndex = (currentIndex + 1) % totalItems;
    updateCarousel();
}

function moveToPrevItem() {
    currentIndex = (currentIndex - 1 + totalItems) % totalItems;
    updateCarousel();
}

function triggerRainbowWave(imageElement) {
    const waveContainer = document.createElement('div');
    waveContainer.classList.add('rainbow-wave');
    
    const waveSurface = document.createElement('div');
    waveSurface.classList.add('wave-surface');
    
    waveContainer.appendChild(waveSurface);
    document.body.appendChild(waveContainer);

    // Force a reflow to ensure the initial state is applied
    waveContainer.offsetHeight;

    waveContainer.classList.add('active');

    // Remove the wave after the animation completes
    waveContainer.addEventListener('animationend', () => {
        waveContainer.remove();
    });

    // Fallback removal
    setTimeout(() => {
        if (document.body.contains(waveContainer)) {
            waveContainer.remove();
        }
    }, 2100);

    setTimeout(() => {
        imageElement.classList.add('glow');
    }, 200);

    setTimeout(() => {
        imageElement.classList.remove('glow');
    }, 1700);
}


// Initialize the carousel
updateCarousel();

// Existing functions for text box
document.querySelectorAll('.carousel-item').forEach(item => {
    item.addEventListener('click', () => {
        const celebrityName = item.querySelector('h2').innerText;
        openTextBox(celebrityName);
    });
});

function openTextBox(celebrityName) {
    document.getElementById('selected-celebrity').innerText = celebrityName;
    document.getElementById('text-box-container').style.display = 'flex';
}

function closeTextBox() {
    document.getElementById('text-box-container').style.display = 'none';
}

function submitMessage() {
    let userInput = document.getElementById('user-input').value;
    let selectedCelebrity = document.getElementById('selected-celebrity').innerText;

    if (userInput.trim() === '') {
        alert('Please enter a message.');
        return;
    }

    // Add your CAPTCHA validation here

    // Send data to API
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            celebrity: selectedCelebrity,
            message: userInput
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Your message has been submitted!');
        closeTextBox();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

var gl = c.getContext("experimental-webgl", {
    preserveDrawingBuffer: true 
}),

w = (c.width = window.innerWidth),
h = (c.height = window.innerHeight),
opts = {
    dropWidth: 0.5,
    dropSpacing: 1,
    dropsParColumn: 3,
    dropBaseSpeed: 0.01,
    dropAddedSpeed: 0.005,
    dropAlpha: 0.6,
    dropRespawnChance: 0.1,
    acc: 0.1,
    tickSpeed: 1 / 360
};

var webgl = {};
webgl.vertexShaderSource = `
attribute vec2 a_pos;
uniform vec2 u_res;
uniform vec2 u_params;
varying float hue;

void main() {
    gl_Position = vec4( vec2(1, -1) * ((( a_pos + vec2(.5, 0)) / u_res ) * 2. - 1. ), 0, 1 );
    hue = u_params.y == 1. ? -1. : (a_pos.x + a_pos.y * .1 ) / u_res.x + u_params.x;
}

`;

webgl.fragmentShaderSource = `

precision mediump float;
varying float hue;

void main(){
    gl_FragColor = hue == -1. ? vec4( 0, 0, 0, .04 ) : vec4( clamp ( abs ( mod( hue * 6. + vec3 (0, 4, 2), 6. ) -3. ) -1., 0., 1. ), ${opts.dropAlpha} );
}

`;

webgl.vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(webgl.vertexShader, webgl.vertexShaderSource);
gl.compileShader(webgl.vertexShader);

webgl.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(webgl.fragmentShader, webgl.fragmentShaderSource);
gl.compileShader(webgl.fragmentShader);

webgl.shaderProgram = gl.createProgram();
gl.attachShader(webgl.shaderProgram, webgl.vertexShader);
gl.attachShader(webgl.shaderProgram, webgl.fragmentShader);

gl.linkProgram(webgl.shaderProgram);
gl.useProgram(webgl.shaderProgram);

webgl.posAttribLoc = gl.getAttribLocation(webgl.shaderProgram, "a_pos");
webgl.posBuffer = gl.createBuffer();

gl.enableVertexAttribArray(webgl.posAttribLoc);
gl.bindBuffer(gl.ARRAY_BUFFER, webgl.posBuffer);
gl.vertexAttribPointer(webgl.posAttribLoc, 2, gl.FLOAT, false, 0, 0);

webgl.resUniformLoc = gl.getUniformLocation(webgl.shaderProgram, "u_res");
webgl.paramsUniformLoc = gl.getUniformLocation(webgl.shaderProgram, "u_params");

gl.viewport(0, 0, w, h);
gl.uniform2f(webgl.resUniformLoc, w, h);

gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.BLEND);

gl.lineWidth(opts.dropWidth);

webgl.posData = [];
webgl.clear = function () {
    webgl.posData = [0, 0, w, 0, 0, h, 0, h, w, 0, w, h];
    gl.uniform2f(webgl.paramsUniformLoc, 0, 1);
    webgl.draw(gl.TRIANGLES);
    webgl.posData.length = 0;
};

webgl.draw =function (glType) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(webgl.posData),
        gl.STATIC_DRAW
    );

    gl.drawArrays(glType, 0, webgl.posData.length / 2);
};

function Drop(x) {
    this.x = x;
    this.reset();
    this.y = Math.random() * h;


}
Drop.prototype.reset = function () {
    this.y = 0;
    this.vy = opts.dropBaseSpeed + opts.dropAddedSpeed * Math.random();

};

Drop.prototype.step = function () {
    if (this.y > h) {
        if (Math.random() < opts.dropRespawnChance) return this.reset();
        else return 0;
    }

    var ny = this.y + (this.vy += opts.acc);
    webgl.posData.push(this.x, this.y, this.x, ny);
    this.y = ny;
};
var stopCreatingDrops = true; // Start with not creating drops
var drops = [],
    tick = 0;

function createDrops() {
    if (stopCreatingDrops) return; // Stop creating new drops if the flag is true
    for (var i = 0; i < w; i += opts.dropSpacing) {
        for (var j = 0; j < opts.dropsParColumn; ++j) {
            drops.push(new Drop(i));
        }
    }
}

function anim() {
    window.requestAnimationFrame(anim);
    tick += opts.tickSpeed;

    webgl.clear();
    gl.uniform2f(webgl.paramsUniformLoc, tick, 0);

    // Continue animating the existing drops, even if new drops are no longer being created
    drops = drops.filter(function (drop) {
        drop.step();
        return drop.y <= h; // Keep the drop if it hasn't fallen off the screen
    });

    webgl.draw(gl.LINES);
}

// Trigger the animation and drop creation when carousel buttons are clicked
function triggerAnimation() {
    stopCreatingDrops = false; // Allow drop creation
    createDrops(); // Start creating drops

    // Start the animation
    anim();

    // Stop creating new drops after 2 seconds
    setTimeout(() => {
        stopCreatingDrops = true;
    }, 2000);
}

// Attach the animation trigger to the carousel buttons
document.getElementById('prevBtn').addEventListener('click', triggerAnimation);
document.getElementById('nextBtn').addEventListener('click', triggerAnimation);

window.addEventListener("resize", function () {
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(webgl.resUniformLoc, w, h);

    // Only create new drops if we haven't stopped creating them
    if (!stopCreatingDrops) {
        createDrops();
    }
});
