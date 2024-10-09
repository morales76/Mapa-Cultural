const map = L.map('map').setView([23.6345, -102.5528], 5); // Centrado en México
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

const locations = []; // Array para almacenar los proyectos registrados
const markers = []; // Array para almacenar los marcadores de proyectos registrados
let canSelectLocation = false; // Controlar cuándo se puede seleccionar ubicación

// Función para centrar el mapa en la ubicación del usuario
function centerMapOnUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            map.setView([lat, lon], 13); // Ajusta el zoom según sea necesario
            L.marker([lat, lon]).addTo(map).bindPopup('Tu ubicación actual').openPopup();
        }, (error) => {
            console.error("Error al obtener la ubicación: ", error);
            alert("No se pudo obtener la ubicación.");
        });
    } else {
        alert("La geolocalización no es soportada por este navegador.");
    }
}

// Llama a la función para centrar el mapa al cargar
centerMapOnUserLocation();

// Manejo del registro del proyecto
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const orgName = document.getElementById('orgName').value;
    const email = document.getElementById('email').value;
    const projectDescription = document.getElementById('projectDescription').value;

    // Verificar si ya existe un proyecto registrado con ese correo
    const existingProject = locations.find(location => location.email === email);
    
    if (existingProject) {
        alert("Ya existe un proyecto registrado con este correo electrónico.");
        return; // No permitir registrar otro proyecto con el mismo correo
    }

    // Habilitar la selección de ubicación después de registrar el proyecto
    canSelectLocation = true;
    alert("Proyecto registrado. Ahora puedes seleccionar la ubicación en el mapa.");
});

// Manejo del clic en el mapa para registrar ubicaciones
map.on('click', function(e) {
    if (canSelectLocation) { // Solo permitir seleccionar ubicación si está habilitado
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        // Colocar un marcador en la posición seleccionada
        const marker = L.marker([lat, lon]).addTo(map);
        
        // Almacenar la información del proyecto
        const orgName = document.getElementById('orgName').value;
        const email = document.getElementById('email').value;
        const projectDescription = document.getElementById('projectDescription').value;

        locations.push({ orgName, email, projectDescription, latitude: lat, longitude: lon });

        // Guardar el marcador en el array para futuras referencias
        markers.push(marker);

        // Actualizar la lista de proyectos registrados
        updateLocationList();

        // Añadir opción al selector de proyectos
        const projectSelect = document.getElementById('projectSelect');
        const option = document.createElement('option');
        option.value = locations.length - 1; // Usar el índice como valor
        option.textContent = `${orgName} - ${projectDescription}`; // Mostrar nombre de organización y descripción en el selector
        projectSelect.appendChild(option);
        
        marker.bindPopup(`Proyecto: ${orgName}<br>${projectDescription}`).openPopup();
        
        // Deshabilitar la selección de ubicación después de registrar un proyecto
        canSelectLocation = false;
    } else {
        alert("Por favor registra primero el proyecto.");
    }
});

// Función para actualizar la lista de proyectos registrados
function updateLocationList() {
    const locationList = document.getElementById('locationList');
    locationList.innerHTML = ''; // Limpiar la lista

    locations.forEach((location, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${location.orgName} (${location.email}): ${location.projectDescription} - ${location.latitude}, ${location.longitude}`;
        locationList.appendChild(listItem);
    });
}

// Manejo del formulario para borrar o corregir registro
document.getElementById('deleteForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const deleteProjectName = document.getElementById('deleteProjectName').value;
    const deleteEmail = document.getElementById('deleteEmail').value;

    // Buscar el registro que coincide con el nombre y correo electrónico proporcionados
    const indexToDelete = locations.findIndex(location => 
        location.orgName === deleteProjectName && location.email === deleteEmail);

    if (indexToDelete !== -1) {
        // Borrar el registro encontrado y eliminar su marcador del mapa
        markers[indexToDelete].remove(); // Eliminar marcador del mapa
        locations.splice(indexToDelete, 1); // Borrar registro

        // Actualizar la lista y los selectores
        updateLocationList();

        const projectSelect = document.getElementById('projectSelect');
        projectSelect.innerHTML = '<option value="" disabled selected>Selecciona un Proyecto</option>'; // Reiniciar selector
        locations.forEach((location, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${location.orgName} - ${location.projectDescription}`;
            projectSelect.appendChild(option);
        });

        alert("Proyecto eliminado correctamente.");
    } else {
        alert("No se encontró ningún proyecto con esa información.");
    }
});

// Manejo de la subida de archivos KML y SHP
document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const kmlFile = document.getElementById('kmlFile').files[0];
    const shpFile = document.getElementById('shpFile').files[0];

    if (kmlFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const kmlData = event.target.result;
            const parser = new DOMParser();
            const kmlDom = parser.parseFromString(kmlData, 'text/xml');
            const kmlLayer = L.kml(kmlDom);
            map.addLayer(kmlLayer);
            map.fitBounds(kmlLayer.getBounds());
        };
        reader.readAsText(kmlFile);
    }

    if (shpFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const shpBuffer = event.target.result;
            shp(shpBuffer).then(function(geojson) {
                const shpLayer = L.geoJSON(geojson);
                map.addLayer(shpLayer);
                map.fitBounds(shpLayer.getBounds());
            });
        };
        reader.readAsArrayBuffer(shpFile);
    }
});
// Función para descargar archivos CSV
document.getElementById('downloadCsv').addEventListener('click', function() {
    const csvContent = "data:text/csv;charset=utf-8," 
        + locations.map(loc => `${loc.orgName},${loc.email},${loc.projectDescription},${loc.latitude},${loc.longitude}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'proyectos.csv');
    document.body.appendChild(link); // Requerido para Firefox
    link.click();
});

// Función para descargar archivos KML
document.getElementById('downloadKml').addEventListener('click', function() {
    let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Proyectos Registrados</name>`;
    
    locations.forEach(loc => {
        kmlContent += `
      <Placemark>
        <name>${loc.orgName}</name>
        <description>${loc.projectDescription}</description>
        <Point>
          <coordinates>${loc.longitude},${loc.latitude},0</coordinates>
        </Point>
      </Placemark>`;
    });

    kmlContent += `
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'proyectos.kml';
    document.body.appendChild(link); // Requerido para Firefox
    link.click();
});

// Función para descargar archivos SHP (como archivo ZIP)
document.getElementById('downloadShp').addEventListener('click', function() {
    const geoJson = {
        type: "FeatureCollection",
        features: locations.map(loc => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [loc.longitude, loc.latitude]
            },
            properties: {
                orgName: loc.orgName,
                projectDescription: loc.projectDescription,
                email: loc.email
            }
        }))
    };

    // Convierte GeoJSON a SHP
    const shpBlob = shpwrite.zip(geoJson);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(shpBlob);
    link.download = 'proyectos.zip';
    document.body.appendChild(link); // Requerido para Firefox
    link.click();
});
