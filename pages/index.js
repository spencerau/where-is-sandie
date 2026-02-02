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
  const [lastUpdated, setLastUpdated] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [geofenceCenter, setGeofenceCenter] = useState(null);
  const [geofenceRadiusM, setGeofenceRadiusM] = useState(402.336); // default 0.25 miles
  const circleRef = useRef(null);
  const overlayRef = useRef(null);

  const formatLastSeen = (d) => {
    if (!d) return 'Last seen: unknown';
    const now = new Date();
    const then = new Date(d);

    const isSameDay = then.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = then.toDateString() === yesterday.toDateString();

    const timeStr = then.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isSameDay) return `Last seen today at ${timeStr}`;
    if (isYesterday) return `Last seen yesterday at ${timeStr}`;
    const monthDay = then.toLocaleString(undefined, { month: 'short', day: 'numeric' });
    return `Last seen ${monthDay} at ${timeStr}`;
  };

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        let apiUrl = '/api/get_coordinates';
        if (typeof window !== 'undefined' && window.location.search) {
          apiUrl += window.location.search;
        }

        const response = await fetch(apiUrl);
        if (response.ok) {
          const csvData = await response.text();

          Papa.parse(csvData, {
            header: true,
            complete: (results) => {

              const data = results.data[0];
              const lat = parseFloat(data['location|latitude']);
              const lng = parseFloat(data['location|longitude']);
              const updatedAtRaw = data['updated_at'] || data['timestamp'] || null;
              setLastUpdated(updatedAtRaw ? new Date(updatedAtRaw) : null);

              if (!isNaN(lat) && !isNaN(lng)) {
                if (lat === 0 && lng === 0) {
                  setIsNapping(true);
                  setCoordinates({ lat: null, lng: null });
                } else {
                  setIsNapping(false);
                  setCoordinates({ lat, lng });
                }
              }
            },
            error: (err) => console.error('Error parsing CSV:', err),
          });
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
    const fetchGeofence = async () => {
      try {
        const res = await fetch('/api/geofence');
        if (res.ok) {
          const json = await res.json();
          setGeofenceCenter(json.center);
          setGeofenceRadiusM(json.radius_m);
        }
      } catch (e) {
        console.warn('Failed to load geofence:', e);
      }
    };
    fetchGeofence();
  }, []);

  useEffect(() => {
    if (scriptLoaded && mapRef.current && coordinates.lat && coordinates.lng && !map) {
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
  }, [scriptLoaded, coordinates, map]); 

  useEffect(() => {
    if (!map || !geofenceCenter || !window.google) return;

    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    circleRef.current = new window.google.maps.Circle({
      strokeColor: '#FF8800',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FFCC80',
      fillOpacity: 0.15,
      map: map,
      center: { lat: geofenceCenter.lat, lng: geofenceCenter.lng },
      radius: geofenceRadiusM,
    });

  }, [map, geofenceCenter, geofenceRadiusM]);

  useEffect(() => {
    if (marker && coordinates.lat && coordinates.lng) {
      marker.setPosition({ lat: coordinates.lat, lng: coordinates.lng });
    }

    if (marker && map && !isNapping) {
      const contentHtml = `
        <div class="${styles.mapPopupContainer}">
          <div class="${styles.mapPopupBubble}">
            <div class="${styles.mapPopupTitle}">Sandie</div>
            <div>${formatLastSeen(lastUpdated)}</div>
          </div>
          <div class="${styles.mapPopupPointer}"></div>
        </div>`;

      if (overlayRef.current) {
        try {
          overlayRef.current.setContent(contentHtml);
          overlayRef.current.setPosition({ lat: coordinates.lat, lng: coordinates.lng });
        } catch (e) {
          overlayRef.current.setMap(null);
          overlayRef.current = null;
        }
      }

      if (!overlayRef.current && window.google) {
        class PopupOverlay extends window.google.maps.OverlayView {
          constructor(position, content) {
            super();
            this.position = position;
            this.content = content;
            this.container = null;
          }
          onAdd() {
            this.container = document.createElement('div');
            this.container.style.position = 'absolute';
            this.container.innerHTML = this.content;
            this.getPanes().floatPane.appendChild(this.container);
          }
          draw() {
            const projection = this.getProjection();
            if (!projection) return;
            const pos = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(this.position.lat, this.position.lng));
            const w = this.container.offsetWidth || 200;
            const h = this.container.offsetHeight || 70;
            this.container.style.left = Math.round(pos.x - w / 2) + 'px';
            this.container.style.top = Math.round(pos.y - h - 50) + 'px';
          }
          onRemove() {
            if (this.container?.parentNode) this.container.parentNode.removeChild(this.container);
            this.container = null;
          }
          setContent(html) {
            if (this.container) this.container.innerHTML = html;
            this.content = html;
          }
          setPosition(pos) {
            this.position = pos;
            this.draw();
          }
        }

        const overlay = new PopupOverlay({ lat: coordinates.lat, lng: coordinates.lng }, contentHtml);
        overlay.setMap(map);
        overlayRef.current = overlay;
      }
    }

    if (isNapping && marker) {
      marker.setMap(null);
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    }
  }, [coordinates, isNapping, lastUpdated, map, marker]);

  return (
    <div>
      <Head>
        <title>Where is Sandie?</title>
      </Head>

      <h1 className={styles.header}>
        {isNapping ? 'Sandie is Currently Napping at Home' : 'Find Sandie on Campus!'}
      </h1>

      {}

      {!isNapping ? (
        <>
          {/* Load the Google Maps script */}
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
            onLoad={() => setScriptLoaded(true)} 
          />
          {/* Map container */}
          <div id="map" className={styles.map} ref={mapRef}></div>
        </>
      ) : (
        <div id="sleepingCorgi" className="sleepingCorgi">
          <p>{formatLastSeen(lastUpdated)}</p>
          <img src="/assets/sleeping_corgi.gif" alt="Sleeping Corgi" />
        </div>
      )}
    </div>
  );
}
