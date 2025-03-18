let currentIndex = 0;
const items = document.querySelectorAll('.carousel-item');
const totalItems = items.length;


document.getElementById('nextBtn').addEventListener('click', () => {
    moveToNextItem();
});

document.getElementById('prevBtn').addEventListener('click', () => {
    moveToPrevItem();
});

document.querySelectorAll('.carousel-item').forEach(item => {
    item.addEventListener('click', () => {
        const celebrityName = item.querySelector('h2').innerText;
        openTextBox(celebrityName);
    });
});

function openTextBox(celebrityName) {
    const textBoxContainer = document.getElementById('text-box-container');
    document.getElementById('selected-celebrity').innerText = celebrityName;
    
    // Set initial opacity and display the text box container
    textBoxContainer.style.opacity = 0;
    textBoxContainer.style.display = 'flex';

    // Smoothly transition to full opacity
    setTimeout(() => {
        textBoxContainer.style.opacity = 1;
        textBoxContainer.style.transform = 'scale(1)';
    }, 10); // Small timeout to ensure the transition effect takes place
}

function closeTextBox() {
    const textBoxContainer = document.getElementById('text-box-container');

    // Smoothly transition to zero opacity before hiding the element
    textBoxContainer.style.opacity = 0;
    textBoxContainer.style.transform = 'scale(0.9)';

    // Wait for the transition to complete before setting display to 'none'
    setTimeout(() => {
        textBoxContainer.style.display = 'none';
    }, 300); // This should match the duration of the CSS transition
}

function submitMessage() {
    let userInput = document.getElementById('user-input').value;
    let selectedCelebrity = document.getElementById('selected-celebrity').innerText;
    let statusText = document.getElementById('status-text');

    if (userInput.trim() === '') {
        alert('Please enter a message.');
        return;
    }

    // Example of how to get the CAPTCHA response
    let captchaResponse = grecaptcha.getResponse(); // Assuming you're using Google reCAPTCHA

    if (!captchaResponse) {
        alert('Please complete the CAPTCHA.');
        return;
    }

    // Show the status text
    statusText.innerText = "Your audio is being generated and sent to the clock now.";
    statusText.style.display = "block";

    // Map the celebrity to the correct voice_id
    const voiceIdMap = {
        'Gilbert Gottfried': 'gilbert-gottfried',
        'Mike Tyson': 'mike-tyson',
        'Kermit': 'kermit',
        'Donald Trump': 'donald-trump',
        'Joe Biden': 'joe-biden',
        'Andrew Tate': 'andrew-tate',
        'Kanye West': 'kanye-west',
        'Snoop Dogg': 'snoop-dogg',
        'Elon Musk': 'elon-musk',
        'Lil Wayne': 'lil-wayne'
    };
    let voiceId = voiceIdMap[selectedCelebrity];

    // Send data to your backend API instead of directly to Neets.ai
    fetch('/generate-audio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: userInput,
            voice_id: voiceId,
            captcha: captchaResponse
        })
    })
    .then(response => response.blob())
    .then(blob => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        console.log('Playing audio.');
        audio.play();

        // After playing the audio, upload the file to the server
        uploadAudio(blob, selectedCelebrity);
        
        // Hide the status text once audio starts playing
        statusText.style.display = "none";
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An unexpected error occurred.');
        statusText.style.display = "none";  // Hide the status text in case of error
    });
}

function uploadAudio(blob, celebrity) {
    // Create a FormData object to hold the audio blob and metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format the timestamp to be filesystem-friendly
    const formData = new FormData();
    formData.append('audio', blob, `${celebrity}_${timestamp}.wav`);
    formData.append('celebrity', celebrity);

    // Send the audio blob to the server
    fetch('/submit-audio', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            console.log('Audio file uploaded successfully.');
        } else {
            console.error('Failed to upload audio file.');
        }
    })
    .catch(error => {
        console.error('Error uploading audio file:', error);
    });
}






function updateCarousel() {
    // Immediately switch to the next item
    items.forEach((item, index) => {
        item.classList.toggle('active', index === currentIndex);
    });

    const carousel = document.getElementById('celebrityCarousel');
    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Trigger the WebGL animation and glow effect
    triggerAnimation();
}

function startCarousel() {
    // Immediately switch to the next item
    items.forEach((item, index) => {
        item.classList.toggle('active', index === currentIndex);
    });

    const carousel = document.getElementById('celebrityCarousel');
    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;


}

function moveToNextItem() {
    currentIndex = (currentIndex + 1) % totalItems;
    updateCarousel();
}

function moveToPrevItem() {
    currentIndex = (currentIndex - 1 + totalItems) % totalItems;
    updateCarousel();
}

function triggerAnimation() {
    stopCreatingDrops = false;
    createDrops();

    anim(); // Start the WebGL animation loop


    // Continue creating new drops for 2 seconds
    setTimeout(() => {
        stopCreatingDrops = true;
    }, 2000);

    // Apply glow effect with smooth fade in/out
    const activeItem = items[currentIndex].querySelector('img');
    activeItem.classList.add('glow');

    // After some time, ease the glow out by directly modifying the filter property
    setTimeout(() => {
        activeItem.style.filter = 'drop-shadow(0 0 0px white) blur(0px)'; // Remove glow smoothly
    }, 500);

    // Remove the glow class after the transition completes
    setTimeout(() => {
        activeItem.classList.remove('glow');
        activeItem.style.filter = ''; // Reset the filter
    }, 1000); // Adjust timing to match the transition duration
}

// WebGL Setup and Animation

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

webgl.draw = function (glType) {
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

// Initialize the carousel
startCarousel();
