let map;
let marker;
let center = { lat: 33.793351, lng: -117.851700 };

// 33.793351,-117.851700

async function initMap() {
  try {
    const response = await fetch('/api/maps-key');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const apiKey = data.key;
    if (!apiKey) {
      throw new Error('No API key returned from server.');
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=loadMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  } catch (error) {
    console.error('Error during map initialization:', error);
  }
}

// This is the callback function that initializes the map
// It should not be async and should not have any awaits.
function loadMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 33.793351, lng: -117.851700},
    zoom: 18,
  });

  // Create the initial marker when the map is first loaded
  updateMarker();

  // Call updateMarker every minute
  setInterval(updateMarker, 30000);
}

function updateMarker() {
  fetch('coordinates.txt') // Fetch the coordinates.txt file
        .then(response => response.text())
        .then(data => {
            const [lat, lng] = data.trim().split(',').map(Number);

          if (lat === 0 && lng === 0) {
              // Replace the map with the image of Sandie napping and update the header text.
              document.getElementById('map').style.display = 'none'; // Hide the map
              document.getElementById('header').textContent = 'Sandie is Currently Napping'; // Update the header text
              // make sure the header is centered
              document.getElementById('header').style.margin = '0 auto';
              document.getElementById('header').style.width = 'fit-content';
              document.getElementById('header').style.padding = '0 1rem';
              document.getElementById('sleepingCorgi').style.display = 'block'; // Show the sleeping Corgi div

              if (marker) {
                  marker.setMap(null); // Remove the marker from the map
                  marker = null;
              }
          } else {
              // Show the map and hide the sleeping Corgi
              document.getElementById('map').style.display = 'block';
              document.getElementById('sleepingCorgi').style.display = 'none';

              // Update or create the marker
              const position = { lat, lng };
              if (marker) {
                  marker.setPosition(position);
              } else {
                  marker = new google.maps.Marker({
                      position: position,
                      map: map,
                      icon: {
                          url: 'assets/corgi.svg',  // Path to Corgi SVG
                          scaledSize: new google.maps.Size(50, 50)
                      },
                      title: 'Sandie Location'
                  });
              }

              // Center the map on the new position
              map.setCenter(position);
          }
      })
      .catch(error => console.error('Error fetching coordinates:', error));
}

// Make the loadMap function available globally
window.loadMap = loadMap;

// Make the initMap function available globally
window.initMap = initMap;
