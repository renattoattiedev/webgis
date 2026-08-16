// GEO Portal — CurrentLocation (portado de current-location.component.ts)
// Centraliza o mapa na posição do usuário via Geolocation API.
import { useEffect, useRef, useState } from 'react';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useMapa } from '../../contexts/MapaContext';
import './CurrentLocation.css';

export default function CurrentLocation() {
  const { mapa } = useMapa();
  const [isActive, setIsActive] = useState(false);
  const [coordsMessage, setCoordsMessage] = useState('');
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!mapa) return;

    const showCoordinates = () => {
      if (!isActiveRef.current) return;
      const center = mapa.getView().getCenter();
      if (!center) return;
      const [lon, lat] = toLonLat(center);
      setCoordsMessage(`Latitude: ${lat.toFixed(6)}, Longitude: ${lon.toFixed(6)}`);
    };

    mapa.on('pointerdrag', showCoordinates);
    return () => {
      mapa.un('pointerdrag', showCoordinates);
    };
  }, [mapa]);

  function toggleLocation() {
    if (isActive) {
      setIsActive(false);
      return;
    }
    if (!mapa || !('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      mapa.getView().setCenter(fromLonLat([longitude, latitude]));
      mapa.getView().setZoom(13);
      setCoordsMessage(`Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`);
    });
    setIsActive(true);
  }

  return (
    <>
      {isActive && <div className="currentlocation-coords">{coordsMessage}</div>}
      <button
        type="button"
        className={`currentlocation-btn${isActive ? ' currentlocation-active' : ''}`}
        onClick={toggleLocation}
        title="Minha Localização"
        aria-label="Minha Localização"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
    </>
  );
}
