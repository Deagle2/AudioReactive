function init() {
  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, depth: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //Group Cube
  const cubeGroup = new THREE.Group();
  scene.add(cubeGroup);

  // Cube Grid
  const cubes = [];
  const gridSize = 5;
  const spacing = 2;
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const material = new THREE.MeshStandardMaterial({ color: 0x44aaff });

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (i - (gridSize - 1) / 2) * spacing,
        0,
        (j - (gridSize - 1) / 2) * spacing
      );
      cubeGroup.add(cube);
      cubes.push(cube); //Adding Cube to array from loop
    }
  }

  // Lights Scene
  //scene.add(new THREE.HemisphereLight(0xffd1a4, 0xff5733, 1.2)); 

  // Other lighting options I had fun trying (some lighting might break!)
  // scene.add(new THREE.PointLight(0xfaeae05454, 100, 100));
   scene.add(new THREE.SpotLight(0x3affcc, 3.2, 200, Math.PI / 3));
  // scene.add(new THREE.DirectionalLight(0xffffff, 13));

  // Scene Audio Listener
  const listener = new THREE.AudioListener(); 
  camera.add(listener);

  // create a global audio source
  const sound = new THREE.Audio(listener);

  // play audio on mouse left click
  const resumeAudio = () => {   
    if (listener.context.state === 'suspended') {
      listener.context.resume().then(() => {
        console.log('AudioContext resumed');
        document.getElementById('info').textContent = 'Audio context active';
      });
    }
    document.removeEventListener('click', resumeAudio);
  };
  document.addEventListener('click', resumeAudio); // On mouse left click

  // Song Selection & Analyser setup
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('audio/Crysta-NCS.mp3', (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.6);
    sound.play();

    analyser = new THREE.AudioAnalyser(sound, 64); // Use higher fftSize (like 128 or 256) if some cubes don’t respond due to low amplitude
    console.log('Audio file loaded and playing');
    document.getElementById('info').textContent = 'Audio file playing, processing audio...';
    animate();
  }, undefined, (err) => {
    console.error('Audio loading error:', err);
    document.getElementById('info').textContent = 'Failed to load audio file. Check console for details.';
    animate();
  });

  // Rotation toggle flag & target rotations
  let rotateLocked = false;
  let targetRotationX = 0;
  let targetRotationY = 0;

  // Toggle Rotation
  document.addEventListener('click', (event) => {
    if (event.button === 0) {
      rotateLocked = !rotateLocked;
    }
  });

  // MOUSE ROTATION
  document.addEventListener('mousemove', (event) => {
    if (!rotateLocked) return;

    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const maxRotation = Math.PI*2;

    targetRotationY = (mouseX / window.innerWidth - 0.5) * 2 * maxRotation;
    targetRotationX = (mouseY / window.innerHeight - 0.5) * 2 * maxRotation;
  });

  // Window Management
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);

    if (analyser) {
      const data = analyser.getFrequencyData();
      for (let i = 0; i < cubes.length; i++) {
        const freqIndex = i % data.length;
        const scale = 0.5 + data[freqIndex] / 100;
        const height = data[freqIndex] / 50;
        cubes[i].scale.set(1, scale, 1);
        cubes[i].position.y = height;
        cubes[i].material.color.setHSL(data[freqIndex] / 255, 1, 0.5);
      }
      document.getElementById('info').textContent = `Audio active, avg frequency: ${(data.reduce((a, b) => a + b, 0) / data.length).toFixed(2)}`;
    } else {
      for (let i = 0; i < cubes.length; i++) {
        cubes[i].position.y = Math.sin(Date.now() * 0.001 + i) * 0.5;
      }
      document.getElementById('info').textContent = 'No audio input, using fallback animation';
    }

    // Smoothly interpolate rotation (LERP)
    const lerpFactor = 0.1;
    cubeGroup.rotation.x += (targetRotationX - cubeGroup.rotation.x) * lerpFactor;
    cubeGroup.rotation.y += (targetRotationY - cubeGroup.rotation.y) * lerpFactor;

    renderer.render(scene, camera);
  }
}

init();
