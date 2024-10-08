// pages/index.js

import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import styles from '../styles/Home.module.css';
import Script from 'next/script';

export default function Home() {
  const [isNapping, setIsNapping] = useState(false);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [scriptLoaded, setScriptLoaded] = useState(false);

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

              console.log('Fetched coordinates:', { lat, lng });

              if (!isNaN(lat) && !isNaN(lng)) {
                if (lat === 0 && lng === 0) {
                  setIsNapping(true);
                  setCoordinates({ lat: null, lng: null });
                } else {
                  setIsNapping(false);
                  setCoordinates({ lat, lng });
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
  }, []);

  useEffect(() => {
    if (scriptLoaded && mapRef.current && coordinates.lat !== null && coordinates.lng !== null && !map) {
      console.log('Initializing map for the first time');
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: coordinates.lat, lng: coordinates.lng },
        zoom: 18,
      });
      setMap(mapInstance);

      const markerInstance = new window.google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lng },
        map: mapInstance,
        icon: {
          url: '/assets/corgi.svg',
          scaledSize: new window.google.maps.Size(50, 50),
        },
        title: 'Sandie Location',
      });
      setMarker(markerInstance);
    }
  }, [scriptLoaded, coordinates]); 

  useEffect(() => {
    if (marker && coordinates.lat !== null && coordinates.lng !== null) {
      console.log('Updating marker position to:', coordinates);
      marker.setPosition({ lat: coordinates.lat, lng: coordinates.lng });
    }

    if (isNapping && marker) {
      console.log('Sandie is napping, removing marker.');
      marker.setMap(null); 
    }
  }, [coordinates, isNapping]);

  return (
    <div>
      <Head>
        <title>Where is Sandie?</title>
      </Head>

      <h1 className={styles.header}>
        {isNapping ? 'Sandie is Currently Napping at Home' : 'Find Sandie on Campus!'}
      </h1>

      {!isNapping ? (
        <>
          {/* Load the Google Maps script */}
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
            onLoad={() => setScriptLoaded(true)} 
          />
          {/* Map container */}
          <div id="map" style={{ height: '100vh', width: '100%' }} ref={mapRef}></div>
        </>
      ) : (
        <div id="sleepingCorgi" className="sleepingCorgi">
          <img src="/assets/sleep.jpg" alt="Sleeping Corgi" />
        </div>
      )}
    </div>
  );
}
