import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface MapItem {
  id: string;
  category: 'tickets' | 'rides' | 'blood' | 'food' | 'subscriptions';
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  badge?: string;
  linkUrl: string;
}

interface ServiceMapViewProps {
  userLat?: number;
  userLon?: number;
  radiusKm: number | null; // null means 'All'
  items: MapItem[];
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  tickets: '#2563eb', // blue
  rides: '#0d9488', // teal
  blood: '#e11d48', // rose
  food: '#d97706', // amber
  subscriptions: '#7c3aed', // violet
};

const CATEGORY_ICONS: Record<string, string> = {
  tickets: '🎟️',
  rides: '🚗',
  blood: '🩸',
  food: '🍲',
  subscriptions: '👥',
};

export const ServiceMapView: React.FC<ServiceMapViewProps> = ({
  userLat,
  userLon,
  radiusKm,
  items,
  onDetectLocation,
  isDetectingLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const navigate = useNavigate();

  const effectiveLat = userLat ?? 13.0827; // Default to Chennai if not set
  const effectiveLon = userLon ?? 80.2707;
  const hasUserLocation = userLat !== undefined && userLon !== undefined;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [effectiveLat, effectiveLon],
        zoom: radiusKm ? (radiusKm <= 5 ? 13 : radiusKm <= 10 ? 12 : 11) : 12,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center, radius circle, and markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Center map on user location
    map.setView([effectiveLat, effectiveLon], map.getZoom());

    // Update or create user location pulse marker
    const userMarkerIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="
          position: relative;
          width: 20px;
          height: 20px;
          background-color: #2563eb;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
        ">
          <div style="
            position: absolute;
            top: -6px;
            left: -6px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: rgba(37, 99, 235, 0.3);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const userMarker = L.marker([effectiveLat, effectiveLon], {
      icon: userMarkerIcon,
      zIndexOffset: 1000,
    }).addTo(map);
    userMarker.bindPopup('<b>Your Current Location</b>');

    // Update or draw Radius Circle
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    if (hasUserLocation && radiusKm) {
      const radiusMeters = radiusKm * 1000;
      const circle = L.circle([effectiveLat, effectiveLon], {
        radius: radiusMeters,
        color: '#2563eb',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
      }).addTo(map);

      circleRef.current = circle;
      map.fitBounds(circle.getBounds(), { padding: [30, 30] });
    }

    // Clear old item markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [userMarker];

    // Filter items within radius if specified
    const filteredItems = items.filter((item) => {
      if (!radiusKm || !hasUserLocation) return true;
      if (item.distanceKm !== undefined) {
        return item.distanceKm <= radiusKm;
      }
      return true;
    });

    // Add item markers
    filteredItems.forEach((item) => {
      const color = CATEGORY_COLORS[item.category] || '#2563eb';
      const iconEmoji = CATEGORY_ICONS[item.category] || '📍';

      const itemIcon = L.divIcon({
        className: 'custom-item-marker',
        html: `
          <div style="
            background: ${color};
            color: white;
            padding: 5px;
            border-radius: 9999px;
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            font-size: 15px;
            cursor: pointer;
          ">
            ${iconEmoji}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([item.latitude, item.longitude], { icon: itemIcon }).addTo(map);

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1';
      popupContent.innerHTML = `
        <div style="font-family: inherit; min-width: 180px;">
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${color}; letter-spacing: 0.05em;">
              ${item.category}
            </span>
            ${item.badge ? `<span style="font-size: 9px; background: #f1f5f9; color: #475569; padding: 1px 5px; border-radius: 4px; font-weight: 600;">${item.badge}</span>` : ''}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2; margin-bottom: 4px;">
            ${item.title}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ${item.subtitle}
            ${item.distanceKm !== undefined ? ` • <b>${item.distanceKm < 1 ? Math.round(item.distanceKm * 1000) + 'm' : item.distanceKm + 'km'} away</b>` : ''}
          </div>
          <button id="marker-btn-${item.id}" style="
            width: 100%;
            background: #0f172a;
            color: white;
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          ">
            View Details &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`marker-btn-${item.id}`);
        if (btn) {
          btn.onclick = () => {
            navigate(item.linkUrl);
          };
        }
      });

      markersRef.current.push(marker);
    });
  }, [effectiveLat, effectiveLon, radiusKm, items, hasUserLocation, navigate]);

  return (
    <div className="relative w-full h-[400px] md:h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating GPS Status Pill / Refresh Button */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <button
          onClick={onDetectLocation}
          disabled={isDetectingLocation}
          className="bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-700 hover:text-primary px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Navigation className={`w-3.5 h-3.5 text-primary ${isDetectingLocation ? 'animate-spin' : ''}`} />
          <span>{hasUserLocation ? 'GPS Matched' : 'Detect My Location'}</span>
        </button>

        {radiusKm && (
          <div className="bg-primary/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
            Radius: {radiusKm} km
          </div>
        )}
      </div>

      {/* Recenter Button */}
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([effectiveLat, effectiveLon], radiusKm && radiusKm <= 5 ? 13 : 12);
          }
        }}
        title="Center on me"
        className="absolute bottom-4 left-3 z-10 p-2.5 bg-white rounded-xl shadow-md border border-slate-200 text-slate-700 hover:text-primary active:scale-95 transition-all"
      >
        <Compass className="w-4 h-4 text-primary" />
      </button>

      {/* Notice if user location is not set */}
      {!hasUserLocation && (
        <div className="absolute bottom-4 right-3 left-16 z-10 bg-white/95 backdrop-blur-sm border border-amber-200 p-2.5 rounded-xl shadow-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-[11px] font-medium text-slate-700 truncate">
              Showing default city view. Tap to enable live GPS!
            </p>
          </div>
          <button
            onClick={onDetectLocation}
            className="bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-lg shrink-0"
          >
            Enable GPS
          </button>
        </div>
      )}
    </div>
  );
};
