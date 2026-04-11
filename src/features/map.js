/**
 * Berlin Konuşuyor — İnteraktif Şehir Haritası Modülü
 * Kategorize edilmiş lokasyon verileri ve Leaflet entegrasyonu.
 */

const MAP_LOCATIONS = [
  // Resmi Kurumlar
  { id: 1, cat: 'official', name: 'T.C. Berlin Başkonsolosluğu', coords: [52.4965, 13.2985], desc: 'Resmi işlemler ve vatandaşlık başvuruları için ana merkez.' },
  { id: 2, cat: 'official', name: 'Alman Dışişleri Bakanlığı', coords: [52.5144, 13.3986], desc: 'Auswärtiges Amt' },
  { id: 3, cat: 'official', name: 'Bürgeramt Mitte', coords: [52.5222, 13.3855], desc: 'Anmeldung (Adres Kaydı) işlemleri için popüler lokasyon.' },
  
  // Konut ve Yaşam
  { id: 4, cat: 'housing', name: 'Kreuzberg', coords: [52.5003, 13.4243], desc: 'Berlin\'in kalbinde Türk toplumunun en yoğun olduğu bölge.' },
  { id: 5, cat: 'housing', name: 'Neukölln (Sonnenallee)', coords: [52.4831, 13.4354], desc: 'Sosyal yaşam ve uygun konut arayışında popüler lokasyon.' },
  { id: 6, cat: 'housing', name: 'Prenzlauer Berg', coords: [52.5398, 13.4143], desc: 'Aileler için ideal, nezih yerleşim bölgesi.' },

  // Kültür ve Gezi
  { id: 7, cat: 'culture', name: 'East Side Gallery', coords: [52.5050, 13.4397], desc: 'Berlin Duvarı\'nın kalan en uzun parçası üzerinde açık hava galerisi.' },
  { id: 8, cat: 'culture', name: 'Müzeler Adası', coords: [52.5186, 13.3976], desc: 'UNESCO Dünya Mirası listesindeki müze kompleksi.' },
  { id: 9, cat: 'culture', name: 'Brandenburg Kapısı', coords: [52.5163, 13.3777], desc: 'Berlin\'in dünyaca ünlü sembolü.' },

  // Yeme & İçme
  { id: 10, cat: 'food', name: 'Hasır Restaurant', coords: [52.4998, 13.4182], desc: 'Geleneksel Türk mutfağının Berlin\'deki simgelerinden.' },
  { id: 11, cat: 'food', name: 'Markthalle Neun', coords: [52.5019, 13.4312], desc: 'Sokak lezzetleri ve taze ürünler için tarihi pazar yeri.' },
  
  // Ulaşım
  { id: 12, cat: 'transit', name: 'Hauptbahnhof (Merkez İstasyon)', coords: [52.5250, 13.3694], desc: 'Berlin\'in ana ulaşım merkezi.' },
  { id: 13, cat: 'transit', name: 'Alexanderplatz', coords: [52.5219, 13.4132], desc: 'U-Bahn, S-Bahn ve Bölgesel trenlerin kavşak noktası.' }
];

const COLORS = {
  official: '#e50914', // Kırmızı
  housing: '#22c55e',  // Yeşil
  culture: '#f59e0b',  // Turuncu/Altın
  food: '#8b5cf6',     // Mor
  transit: '#3b82f6'   // Mavi
};

let map = null;
let currentLayerGroup = null;
let markerRefs = {}; // Store markers by ID

export function initMap() {
  const mapEl = document.getElementById('berlinMap');
  if (!mapEl || typeof L === 'undefined') return;

  // Haritayı başlat
  map = L.map('berlinMap', { 
    scrollWheelZoom: false,
    zoomControl: false 
  }).setView([52.5150, 13.4000], 12);

  // Dark Mode Tile Layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Zoom kontrolünü sağ alta al
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  currentLayerGroup = L.layerGroup().addTo(map);

  // Başlangıçta tüm markerları göster
  renderMarkers('all');

  // Filtre butonlarına event ekle
  initMapFilters();

  checkMapHash();
  window.addEventListener('hashchange', checkMapHash);

  const locateBtn = document.getElementById('locateMeBtn');
  if (locateBtn) {
    locateBtn.addEventListener('click', locateUser);
  }
}

function checkMapHash() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#map-')) {
    const id = parseInt(hash.replace('#map-', ''));
    if (markerRefs[id] && map) {
      map.setView(markerRefs[id].getLatLng(), 16);
      markerRefs[id].openPopup();
    }
  }
}

function locateUser() {
  if (!navigator.geolocation) {
    alert('Tarayıcınız konum özelliğini desteklemiyor.');
    return;
  }
  
  const btn = document.getElementById('locateMeBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 15);
      
      L.marker([latitude, longitude]).addTo(map)
        .bindPopup('Siz buradasınız')
        .openPopup();
        
      if (btn) btn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    },
    () => {
      alert('Konum alınamadı. Lütfen izinleri kontrol edin.');
      if (btn) btn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    }
  );
}

function renderMarkers(filter) {
  if (!currentLayerGroup) return;
  currentLayerGroup.clearLayers();

  const filteredData = filter === 'all' 
    ? MAP_LOCATIONS 
    : MAP_LOCATIONS.filter(loc => loc.cat === filter);

  filteredData.forEach(loc => {
    const color = COLORS[loc.cat] || '#ffffff';
    
    // Özel Marker İkonu
    const markerHtml = `
      <div class="custom-marker" style="background-color: ${color};">
        <i class="${getIconClass(loc.cat)}"></i>
      </div>
    `;

    const customIcon = L.divIcon({
      html: markerHtml,
      className: 'marker-container',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const marker = L.marker(loc.coords, { icon: customIcon });
    
    // Stilize edilmiş Popup
    const popupHtml = `
      <div class="map-popup-premium">
        <div class="popup-tag" style="background: ${color}">${getCatName(loc.cat)}</div>
        <h4 class="popup-title">${loc.name}</h4>
        <p class="popup-desc">${loc.desc}</p>
        <button class="popup-btn" onclick="window.history.pushState('', '', '#rehber')">Rehbere Göz At</button>
      </div>
    `;

    marker.bindPopup(popupHtml, {
      className: 'premium-popup-wrapper',
      maxWidth: 250
    }).addTo(currentLayerGroup);
    
    // Cache marker ref
    markerRefs[loc.id] = marker;
  });

  // Eğer filtre seçilmişse haritayı sınırları kapsayacak şekilde odakla
  if (filter !== 'all' && filteredData.length > 0) {
    const latLngs = filteredData.map(loc => loc.coords);
    map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 14 });
  }
}

function getIconClass(cat) {
  const icons = {
    official: 'fas fa-file-signature',
    housing: 'fas fa-home',
    culture: 'fas fa-landmark',
    food: 'fas fa-utensils',
    transit: 'fas fa-train'
  };
  return icons[cat] || 'fas fa-map-marker-alt';
}

function getCatName(cat) {
  const names = {
    official: 'Resmi Kurum',
    housing: 'Konut & Yaşam',
    culture: 'Kültür & Sanat',
    food: 'Yeme & İçme',
    transit: 'Ulaşım'
  };
  return names[cat] || 'Diğer';
}

function initMapFilters() {
  document.querySelectorAll('.map-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Aktif buton stilini güncelle
      document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      renderMarkers(filter);
    });
  });
}
