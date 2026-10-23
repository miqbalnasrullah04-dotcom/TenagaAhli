import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon path bug on Vite / Webpack production hosting
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/**
 * Custom SVG Location Pin Icon (zero external HTTP requests, 100% reliable on production hosting)
 */
export const locationPinIcon = L.divIcon({
  className: 'custom-location-pin',
  html: `
    <div style="position:relative;width:34px;height:44px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));cursor:grab;">
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.61116 0 0 7.61116 0 17C0 29.75 17 44 17 44C17 44 34 29.75 34 17C34 7.61116 26.3888 0 17 0Z" fill="#1E88E5"/>
        <path d="M17 0C7.61116 0 0 7.61116 0 17C0 29.75 17 44 17 44C17 44 34 29.75 34 17C34 7.61116 26.3888 0 17 0Z" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="17" cy="17" r="6.5" fill="#FFFFFF"/>
      </svg>
    </div>
  `,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  popupAnchor: [0, -44],
});

export default locationPinIcon;
