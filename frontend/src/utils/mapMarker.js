import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { getMediaUrl, getDefaultPhoto } from './media.js';

/**
 * Helper to build custom leaflet DivIcon for Experts
 * Platinum: Thick cyan/blue border with Diamond icon badge in top-right
 * Premium: Thick amber/gold border with Medal/Star icon badge in top-right
 * Regular: Brown border
 */
export function createExpertMapIcon(expert, isSelected = false) {
  const pkg = String(expert.package_name || expert.package?.name || expert.package?.slug || '').toLowerCase();
  const mem = String(expert.membership_level || '').toLowerCase();
  const isPlatinum = Boolean(expert.is_platinum || pkg.includes('platinum') || pkg.includes('eksklusif') || pkg.includes('ekslusif') || pkg.includes('esklusif') || mem.includes('platinum') || mem.includes('eksklusif') || mem.includes('ekslusif'));
  const isPremium = !isPlatinum && Boolean(
    expert.is_premium || 
    (expert.package_id && Number(expert.package_id) > 1) || 
    (expert.package && expert.package.price > 0) || 
    expert.featured || 
    pkg.includes('premium') || 
    pkg.includes('ekonomis') || 
    mem.includes('premium') || 
    mem.includes('ekonomis') || 
    mem.includes('gold')
  );

  let borderColor = '#8B4513';
  let borderGlow = 'rgba(0,0,0,0.3)';
  let badgeHtml = '';

  if (isPlatinum) {
    borderColor = '#0284c7'; // Vibrant Platinum / Cyan
    borderGlow = 'rgba(2, 132, 199, 0.6)';
    badgeHtml = `
      <div style="position:absolute;top:-6px;right:-6px;background:linear-gradient(135deg,#0284c7,#38bdf8);color:#ffffff;border-radius:9999px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;box-shadow:0 2px 5px rgba(0,0,0,0.35);z-index:10;">
        <span class="material-symbols-outlined" style="font-size:12px;color:#ffffff;font-variation-settings:'FILL' 1;line-height:1;display:block;">diamond</span>
      </div>`;
  } else if (isPremium) {
    borderColor = '#f59e0b'; // Amber Gold
    borderGlow = 'rgba(245, 158, 11, 0.6)';
    badgeHtml = `
      <div style="position:absolute;top:-6px;right:-6px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#ffffff;border-radius:9999px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;box-shadow:0 2px 5px rgba(0,0,0,0.35);z-index:10;">
        <span class="material-symbols-outlined" style="font-size:12px;color:#ffffff;font-variation-settings:'FILL' 1;line-height:1;display:block;">workspace_premium</span>
      </div>`;
  }

  const borderWidth = isSelected ? '4px' : '3.5px';
  const scale = isSelected ? 'scale(1.15)' : 'scale(1)';
  const photoSrc = expert.photo_url || expert.photo || getDefaultPhoto(expert.id);
  const resolvedPhoto = getMediaUrl(photoSrc, getDefaultPhoto(expert.id));

  return L.divIcon({
    className: 'custom-expert-marker',
    html: `<div style="position:relative;width:44px;height:44px;border-radius:9999px;border:${borderWidth} solid ${borderColor};overflow:visible;box-shadow:0 3px 10px ${borderGlow};background:#ffffff;transform:${scale};transition:all 0.25s ease;">
             <img src="${resolvedPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;display:block;" alt="${expert.name || 'Expert'}" />
             ${badgeHtml}
           </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

/**
 * Creates a configured MarkerClusterGroup for clustering and spiderfying markers at same coordinates
 */
export function createExpertClusterGroup() {
  return L.markerClusterGroup({
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: true,
    spiderfyDistanceMultiplier: 1.8,
    maxClusterRadius: 40,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      const children = cluster.getAllChildMarkers();
      
      let hasPlatinum = false;
      let hasPremium = false;
      children.forEach((marker) => {
        if (marker.options?.isPlatinum) hasPlatinum = true;
        if (marker.options?.isPremium) hasPremium = true;
      });

      let clusterBg = 'linear-gradient(135deg, #8B4513, #6B3410)';
      let clusterBorder = '#ffffff';
      let clusterShadow = 'rgba(107, 52, 16, 0.45)';
      let badgeIcon = '';

      if (hasPlatinum) {
        clusterBg = 'linear-gradient(135deg, #0284c7, #0369a1)';
        clusterBorder = '#bae6fd';
        clusterShadow = 'rgba(2, 132, 199, 0.55)';
        badgeIcon = '<span class="material-symbols-outlined" style="font-size:11px;color:#fff;font-variation-settings:\'FILL\' 1;margin-right:2px;display:inline-block;vertical-align:middle;">diamond</span>';
      } else if (hasPremium) {
        clusterBg = 'linear-gradient(135deg, #d97706, #f59e0b)';
        clusterBorder = '#fef3c7';
        clusterShadow = 'rgba(245, 158, 11, 0.55)';
        badgeIcon = '<span class="material-symbols-outlined" style="font-size:11px;color:#fff;font-variation-settings:\'FILL\' 1;margin-right:2px;display:inline-block;vertical-align:middle;">workspace_premium</span>';
      }

      const size = count < 10 ? 40 : (count < 100 ? 46 : 52);

      return L.divIcon({
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 9999px;
            background: ${clusterBg};
            border: 3px solid ${clusterBorder};
            box-shadow: 0 4px 12px ${clusterShadow};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: ${count < 10 ? '13px' : '12px'};
            font-family: system-ui, -apple-system, sans-serif;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <span style="display:inline-flex;align-items:center;justify-content:center;line-height:1;">
              ${badgeIcon}${count}
            </span>
          </div>
        `,
        className: 'custom-expert-cluster',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    },
  });
}

/**
 * Helper to build rich popup HTML for map markers
 */
export function getExpertPopupHtml(expert, t = (k, d) => d || k) {
  const pkg = String(expert.package_name || expert.package?.name || expert.package?.slug || '').toLowerCase();
  const mem = String(expert.membership_level || '').toLowerCase();
  const isPlatinum = Boolean(expert.is_platinum || pkg.includes('platinum') || pkg.includes('eksklusif') || pkg.includes('ekslusif') || pkg.includes('esklusif') || mem.includes('platinum') || mem.includes('eksklusif') || mem.includes('ekslusif'));
  const isPremium = !isPlatinum && Boolean(
    expert.is_premium || 
    (expert.package_id && Number(expert.package_id) > 1) || 
    (expert.package && expert.package.price > 0) || 
    expert.featured || 
    pkg.includes('premium') || 
    pkg.includes('ekonomis') || 
    mem.includes('premium') || 
    mem.includes('ekonomis') || 
    mem.includes('gold')
  );

  const tierBadge = '';

  const profileUrl = expert.slug ? `/profil/${expert.slug}` : (expert.id ? `/profil/${expert.id}` : null);
  const openMapsText = typeof t === 'function' ? t('search.open_in_google_maps', 'Buka di Google Maps') : 'Buka di Google Maps';

  return `
    <div style="min-width:210px;max-width:280px;font-family:system-ui,-apple-system,sans-serif;padding:2px 0;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <b style="font-size:13.5px;color:#1F2A22;line-height:1.3;font-weight:800;">${expert.name || 'Tenaga Ahli'}</b>
        ${tierBadge}
      </div>
      <div style="color:#5B6660;font-size:11.5px;line-height:1.4;margin-bottom:8px;">${expert.field || ''}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f1f5f9;padding-top:8px;margin-top:4px;">
        ${expert.lat && expert.lng ? `
          <a href="https://www.google.com/maps/search/?api=1&query=${expert.lat},${expert.lng}" 
             target="_blank" 
             style="color:#8B4513;text-decoration:none;font-size:11.5px;font-weight:600;display:inline-flex;align-items:center;gap:3px;">
            <span style="font-size:13px">📍</span> ${openMapsText}
          </a>
        ` : '<div></div>'}
        ${profileUrl ? `
          <a href="${profileUrl}" style="background:#8B4513;color:#ffffff;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;display:inline-block;">
            Profil
          </a>
        ` : ''}
      </div>
    </div>
  `;
}
