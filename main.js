// --------------------------------------------------------
// 1. Three.js 3D Background Setup (The "Immersive" GenZ feel)
// --------------------------------------------------------
const scene = new THREE.Scene();
// Deep dark background
scene.background = new THREE.Color('#050505');
scene.fog = new THREE.FogExp2('#050505', 0.001);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Create a particle system (Abstract Atmosphere/Globe)
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 2000;
const posArray = new Float32Array(particlesCount * 3);
const colorsArray = new Float32Array(particlesCount * 3);

const color1 = new THREE.Color('#00ffcc'); // Neon Cyan
const color2 = new THREE.Color('#bf00ff'); // Neon Purple

for(let i = 0; i < particlesCount * 3; i+=3) {
    // Sphere distribution
    const r = 5 + Math.random() * 2;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    posArray[i] = r * Math.sin(phi) * Math.cos(theta);     // x
    posArray[i+1] = r * Math.sin(phi) * Math.sin(theta);   // y
    posArray[i+2] = r * Math.cos(phi);                     // z

    // Mix colors based on position
    const mixedColor = color1.clone().lerp(color2, Math.random());
    colorsArray[i] = mixedColor.r;
    colorsArray[i+1] = mixedColor.g;
    colorsArray[i+2] = mixedColor.b;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

// Setup material with additive blending for glowing effect
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particleMesh);

// Center it and move camera back
particleMesh.position.x = 2; // Offset slightly to right to balance UI on left
camera.position.z = 8;

// Mouse interaction for 3D scene
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Auto rotation
    particleMesh.rotation.y = elapsedTime * 0.05;
    particleMesh.rotation.x = elapsedTime * 0.02;

    // Mouse parallax
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    particleMesh.rotation.y += 0.05 * (targetX - particleMesh.rotation.y);
    particleMesh.rotation.x += 0.05 * (targetY - particleMesh.rotation.x);

    // Pulse effect
    particlesMaterial.size = 0.03 + Math.sin(elapsedTime * 2) * 0.005;

    renderer.render(scene, camera);
}
animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Adjust layout for mobile
    if(window.innerWidth < 900) {
        particleMesh.position.x = 0;
    } else {
        particleMesh.position.x = 2;
    }
});


// --------------------------------------------------------
// 2. Weather Logic & Data Fetching
// --------------------------------------------------------

// WMO Weather Codes to text and icons
const weatherCodes = {
    0: { desc: 'Clear sky', icon: 'ph-sun', color: '#ffd700' },
    1: { desc: 'Mainly clear', icon: 'ph-sun', color: '#ffd700' },
    2: { desc: 'Partly cloudy', icon: 'ph-cloud-sun', color: '#a0a0a0' },
    3: { desc: 'Overcast', icon: 'ph-cloud', color: '#808080' },
    45: { desc: 'Fog', icon: 'ph-cloud-fog', color: '#a0a0a0' },
    48: { desc: 'Depositing rime fog', icon: 'ph-cloud-fog', color: '#a0a0a0' },
    51: { desc: 'Light drizzle', icon: 'ph-cloud-rain', color: '#00ffcc' },
    53: { desc: 'Moderate drizzle', icon: 'ph-cloud-rain', color: '#00ffcc' },
    55: { desc: 'Dense drizzle', icon: 'ph-cloud-rain', color: '#00ffcc' },
    61: { desc: 'Slight rain', icon: 'ph-cloud-rain', color: '#00ffcc' },
    63: { desc: 'Moderate rain', icon: 'ph-cloud-rain', color: '#00ffcc' },
    65: { desc: 'Heavy rain', icon: 'ph-cloud-rain', color: '#00ffcc' },
    71: { desc: 'Slight snow fall', icon: 'ph-snowflake', color: '#ffffff' },
    73: { desc: 'Moderate snow fall', icon: 'ph-snowflake', color: '#ffffff' },
    75: { desc: 'Heavy snow fall', icon: 'ph-snowflake', color: '#ffffff' },
    95: { desc: 'Thunderstorm', icon: 'ph-cloud-lightning', color: '#bf00ff' },
    96: { desc: 'Thunderstorm with hail', icon: 'ph-cloud-lightning', color: '#bf00ff' },
    99: { desc: 'Thunderstorm heavy hail', icon: 'ph-cloud-lightning', color: '#bf00ff' }
};

const getDayName = (dateStr, isToday = false) => {
    if (isToday) return 'Today';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
};

async function getCityName(lat, lon) {
    try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const data = await res.json();
        return data.city || data.locality || data.principalSubdivision || 'Unknown Location';
    } catch (e) {
        return 'Local Area';
    }
}

async function fetchWeather(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&current_weather=true&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        return data;
    } catch (e) {
        console.error("Failed to fetch weather", e);
        return null;
    }
}

function updateUI(weatherData, cityName) {
    // Hide Loader
    gsap.to('#loader', { opacity: 0, duration: 0.5, onComplete: () => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('weather-content').classList.remove('hidden');
        
        // Animate UI elements in
        gsap.from('.header', { y: -50, opacity: 0, duration: 1, ease: 'power3.out' });
        gsap.from('.current-weather', { x: -50, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out' });
        gsap.from('.forecast-section', { y: 50, opacity: 0, duration: 1, delay: 0.4, ease: 'power3.out' });
        gsap.from('.forecast-item', { 
            y: 30, 
            opacity: 0, 
            duration: 0.6, 
            stagger: 0.1, 
            delay: 0.6, 
            ease: 'back.out(1.7)' 
        });
    }});

    // Populate Current Weather
    const current = weatherData.current_weather;
    const todayDaily = {
        max: weatherData.daily.temperature_2m_max[0],
        min: weatherData.daily.temperature_2m_min[0]
    };
    
    document.getElementById('location-name').textContent = cityName;
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('current-temp').textContent = `${Math.round(current.temperature)}°`;
    
    const codeInfo = weatherCodes[current.weathercode] || { desc: 'Unknown', icon: 'ph-cloud', color: '#ffffff' };
    
    const iconEl = document.getElementById('current-icon');
    iconEl.className = `ph-fill ${codeInfo.icon}`;
    iconEl.style.color = codeInfo.color;
    
    document.getElementById('current-desc').textContent = codeInfo.desc;
    document.getElementById('current-desc').style.color = codeInfo.color;
    
    document.getElementById('current-wind').textContent = `${current.windspeed} km/h`;
    document.getElementById('current-hl').textContent = `${Math.round(todayDaily.max)}° / ${Math.round(todayDaily.min)}°`;

    // Populate 7-Day Forecast
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; // Clear existing

    // Open-Meteo returns 7 days of daily data
    for (let i = 0; i < 7; i++) {
        const dateStr = weatherData.daily.time[i];
        const max = Math.round(weatherData.daily.temperature_2m_max[i]);
        const min = Math.round(weatherData.daily.temperature_2m_min[i]);
        const code = weatherData.daily.weathercode[i];
        const dayInfo = weatherCodes[code] || { desc: 'Unknown', icon: 'ph-cloud', color: '#ffffff' };
        
        const isToday = i === 0;

        const item = document.createElement('div');
        item.className = 'forecast-item glass-panel';
        item.innerHTML = `
            <span class="day">${getDayName(dateStr, isToday)}</span>
            <i class="ph-fill ${dayInfo.icon}" style="color: ${dayInfo.color}"></i>
            <div class="temps">
                <span class="high">${max}°</span>
                <span class="low">${min}°</span>
            </div>
        `;
        forecastContainer.appendChild(item);
    }
    
    // Change particle color based on temperature
    const temp = current.temperature;
    let targetColor1, targetColor2;
    
    if (temp < 5) {
        // Cold - Blue/White
        targetColor1 = new THREE.Color('#00aaff');
        targetColor2 = new THREE.Color('#ffffff');
    } else if (temp > 25) {
        // Hot - Orange/Red
        targetColor1 = new THREE.Color('#ff5500');
        targetColor2 = new THREE.Color('#ff0055');
    } else {
        // Mild - Cyan/Purple
        targetColor1 = new THREE.Color('#00ffcc');
        targetColor2 = new THREE.Color('#bf00ff');
    }
    
    // Animate color transition (simplified approach by just recreating colors for simplicity or tweening)
    const newColors = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i+=3) {
        const mixedColor = targetColor1.clone().lerp(targetColor2, Math.random());
        newColors[i] = mixedColor.r;
        newColors[i+1] = mixedColor.g;
        newColors[i+2] = mixedColor.b;
    }
    particleMesh.geometry.setAttribute('color', new THREE.BufferAttribute(newColors, 3));
    particleMesh.geometry.attributes.color.needsUpdate = true;
}

// --------------------------------------------------------
// 3. App Initialization
// --------------------------------------------------------

function init() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                const [weatherData, cityName] = await Promise.all([
                    fetchWeather(lat, lon),
                    getCityName(lat, lon)
                ]);

                if (weatherData) {
                    updateUI(weatherData, cityName);
                } else {
                    document.getElementById('loader').innerHTML = '<p>Error loading weather data.</p>';
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                // Fallback to London if geolocation is denied
                fetchWeather(51.5074, -0.1278).then(data => {
                    updateUI(data, "London (Fallback)");
                });
            }
        );
    } else {
        // Geolocation not supported, fallback
        fetchWeather(51.5074, -0.1278).then(data => {
            updateUI(data, "London (Fallback)");
        });
    }
}

// Start app
init();
