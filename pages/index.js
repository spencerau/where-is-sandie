// pages/index.js

import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [isNapping, setIsNapping] = useState(false);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const response = await fetch('/api/get_coordinates');
        if (response.ok) {
          const csvData = await response.text();

          Papa.parse(csvData, {
            header: true,
            complete: (results) => {
              const data = results.data[0];
              const lat = parseFloat(data['location|latitude']);
              const lng = parseFloat(data['location|longitude']);

              if (!isNaN(lat) && !isNaN(lng)) {
                if (lat === 0 && lng === 0) {
                  setIsNapping(true);
                  if (map) {
                    mapRef.current.innerHTML = '';
                    setMap(null);
                  }
                } else {
                  setIsNapping(false);
                  initMap(lat, lng);
                }
              } else {
                console.error('Invalid coordinates in CSV file.');
              }
            },
            error: (err) => {
              console.error('Error parsing CSV:', err);
            },
          });
        } else if (response.status === 404) {
          console.error('Coordinates not available.');
        } else {
          console.error('Failed to fetch coordinates.');
        }
      } catch (error) {
        console.error('Error fetching coordinates:', error);
      }
    };

    fetchCoordinates();

    const intervalId = setInterval(fetchCoordinates, 5000); // fetch every 5 seconds

    return () => clearInterval(intervalId);
  }, [map]);

  const initMap = (lat, lng) => {
    if (!map) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=loadMap`;
      //script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initMapCallback`;
      script.async = true;
      window.initMapCallback = () => {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 18,
        });
        setMap(mapInstance);

        const newMarker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
          icon: {
            url: '/assets/corgi.svg',
            scaledSize: new google.maps.Size(50, 50),
          },
          title: 'Sandie Location',
        });
        setMarker(newMarker);
      };
      document.head.appendChild(script);
    } else {
      map.setCenter({ lat, lng });
      if (marker) {
        marker.setPosition({ lat, lng });
      }
    }
  };

  return (
    <div>
      <Head>
        <title>Where is Sandie?</title>
      </Head>

      <h1 className={styles.header}>
        {isNapping ? 'Sandie is Currently Napping at Home' : 'Find Sandie on Campus!'}
      </h1>

      {!isNapping ? (
        <div id="map" className={styles.map} ref={mapRef}></div>
      ) : (
        <div id="sleepingCorgi" className="sleepingCorgi">
          <img src="/assets/sleep.jpg" alt="Sleeping Corgi" />
        </div>
      )}
    </div>
  );
}
