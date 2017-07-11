/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(document.getElementById('map'));
};

var rec_object = {};
function initAutocomplete() {
    var map, infoWindow;
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -34.397, lng: 150.644},
      zoom: 11
    });
    infoWindow = new google.maps.InfoWindow;

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        map.setCenter(pos);
      }, function() {
        handleLocationError(true, infoWindow, map.getCenter());
      });
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }

    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
      searchBox.setBounds(map.getBounds());
    });

    var markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();
      if (places.length === 0) {
        return;
      } else if (places.length === 1) {
          rec_object = {
            g_formatted_address: places[0].formatted_address,
            g_lat: places[0].geometry.location.lat(),
            g_lon: places[0].geometry.location.lng(),
            g_id: places[0].id,
            g_place_id: places[0].place_id,
            g_rating: places[0].rating,
            g_name: places[0].name,
            g_types: places[0].types,
            g_website: places[0].website                          
          };
      }

      // Clear out the old markers.
      markers.forEach(function(marker) {
        marker.setMap(null);
      });
      markers = [];

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();
      places.forEach(function(place) {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        }

        //var icon = {
        //  url: place.icon,
        //  size: new google.maps.Size(71, 71),
        //  origin: new google.maps.Point(0, 0),
        //  anchor: new google.maps.Point(17, 34),
        //  scaledSize: new google.maps.Size(25, 25)
        //};
        // Create a marker for each place.
        //markers.push(new google.maps.Marker({
        //  map: map,
        //  icon: icon,
        //  title: place.name,
        //  position: place.geometry.location
        //}));

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      map.fitBounds(bounds);

    });        

    google.maps.event.addListener(map, "click", function(event) {
     // get lat/lon of click
     var clickLat = event.latLng.lat();
     var clickLon = event.latLng.lng();                
     // show in input box
     document.getElementById("lat").value = clickLat.toFixed(5);
     document.getElementById("lon").value = clickLon.toFixed(5);

    });
};
