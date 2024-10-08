// script.js
const map = L.map('map').setView([23.6345, -102.5528], 5); // Centrado en México

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

let userMarkers = []; // Array para almacenar los marcadores
let selectedLatLng = null; // Variable para almacenar la posición seleccionada
let currentMarker = null; // Marcador actual

// Manejo del clic en el mapa
map.on('click', function(e) {
    selectedLatLng = e.latlng; // Guardar la posición seleccionada

    // Si hay un marcador existente, lo actualizamos o creamos uno nuevo
    if (currentMarker) {
        currentMarker.setLatLng(selectedLatLng); // Actualiza la posición del marcador existente
        currentMarker.bindPopup("Haz clic en 'Registrar Ubicación' para guardar.").openPopup();
    } else {
        currentMarker = L.marker(selectedLatLng).addTo(map); // Crea un nuevo marcador
        currentMarker.bindPopup("Haz clic en 'Registrar Ubicación' para guardar.").openPopup();
    }
});

// Manejo del formulario
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const orgName = document.getElementById('orgName').value;
    const activityDescription = document.getElementById('activityDescription').value;

    // Verificar si se ha seleccionado una ubicación
    if (selectedLatLng) {
        // Crear un nuevo marcador si no existe uno
        const newMarker = L.marker(selectedLatLng).addTo(map);
        
        // Agregar información al popup del marcador
        newMarker.bindPopup(`
            <strong>Organización:</strong> ${orgName}<br>
            <strong>Descripción:</strong> ${activityDescription}
        `).openPopup();

        // Almacenar el nuevo marcador en el array
        userMarkers.push({ orgName, activityDescription, lat: selectedLatLng.lat, lng: selectedLatLng.lng });

        // Agregar datos al contenedor
        const userData = document.createElement('div');
        userData.innerHTML = `
            <strong>Organización:</strong> ${orgName}<br>
            <strong>Descripción:</strong> ${activityDescription}<br><br>
        `;
        
        userDataContainer.appendChild(userData);
        
        // Mostrar alerta
        alert(`Ubicación registrada para ${orgName}.`);

        // Limpiar el formulario y restablecer la selección
        this.reset();
        selectedLatLng = null; // Reiniciar la posición seleccionada

        // Cerrar el popup anterior si es necesario
        if (currentMarker) {
            currentMarker.closePopup();
            currentMarker = null; // Reiniciar el marcador actual
        }
        
    } else {
        alert("Por favor, selecciona una ubicación en el mapa.");
    }
});

// Función para descargar los datos como CSV
document.getElementById('downloadCSV').addEventListener('click', function() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Organización,Descripción,Latitud,Longitud\n"; // Encabezados

    userMarkers.forEach(marker => {
        const row = `${marker.orgName},${marker.activityDescription},${marker.lat},${marker.lng}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ubicaciones.csv");
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the data file named "ubicaciones.csv"
});

// Placeholder para descarga de SHP (deberías implementar la lógica según tus necesidades)
document.getElementById('downloadSHP').addEventListener('click', function() {
    alert("La funcionalidad para descargar como SHP aún no está implementada.");
});
