## Aero | 3D Weather Experience

Aero is a high-end, immersive weather application designed with a "Gen-Z" aesthetic, blending data-driven utility with an interactive 3D visual environment. By leveraging a glassmorphic UI and a dynamic particle system, it transforms a standard utility into a sensory experience.

---

### 🎨 Visual & Interactive Philosophy
* **Immersive Background**: The application utilizes a **Three.js** particle system that acts as a digital "atmosphere," featuring 2,000 individual points distributed in a spherical volume.
* **Adaptive Color Theory**: The background environment is not static; it dynamically shifts its color palette based on real-time temperature data.
    * **Cold (< 5°C)**: Shifts to blue and white tones.
    * **Hot (> 25°C)**: Transitions to vibrant orange and red hues.
    * **Mild**: Maintains a signature neon cyan and purple gradient.
* **Interactive Parallax**: The 3D scene responds to mouse movement, creating a sense of depth as the particle field tilts and rotates in response to user interaction.
* **Glassmorphism UI**: The interface uses high-transparency panels with `backdrop-filter: blur(20px)` and thin borders to create a "frosted glass" effect that floats above the 3D scene.

---

### 🛠️ Technical Implementation
* **Meteorological Data**: Weather information is sourced from the **Open-Meteo API**, providing high-accuracy current conditions and a 7-day forecast.
* **Smart Geolocation**: The app uses the browser's Geolocation API to find the user's coordinates, then utilizes **BigDataCloud's** reverse-geocoding to translate those coordinates into a readable city name.
* **Fluid Animations**: **GSAP (GreenSock)** is used to orchestrate a sophisticated entrance sequence, staggering the appearance of the header, current weather, and forecast cards for a premium feel.
* **Modern Iconography**: The app integrates **Phosphor Icons** in their "fill" variant to match the bold, neon-tinged aesthetic.

---

### 📂 File Structure
* `index.html`: The skeleton of the app, containing the UI layers and CDN links for Three.js and GSAP.
* `styles.css`: Defines the neon color palette, responsive grid layouts, and the heavy blur effects essential for the glassmorphic look.
* `main.js`: The "brain" of the app, handling the 3D rendering loop, API fetching logic, and UI state management.

---

### 🚀 Getting Started
1.  **Direct Launch**: Clone the repository and open `index.html` in any modern browser.
2.  **Location Access**: When prompted, allow location access for the most accurate local data. If denied, the app will gracefully fall back to displaying weather for London.
3.  **Responsive Check**: Resize your window to see how the 3D particle mesh automatically re-centers itself for mobile displays.
### 📝 License
This project is open-source. Feel free to use and modify it for your own creative weather projects!
