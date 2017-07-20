/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//------------------------------------------
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(document.getElementById('map'));
};

var rec_object = {};
function initAutocomplete(event) {
    var map, infoWindow;
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 11
    });
    infoWindow = new google.maps.InfoWindow;
    var clickHandler = new ClickEventHandler(map, origin, infoWindow);    

    fixInfoWindow();
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
            rec_object = set_rec_object(places[0]);

            // Clear out the old markers.
            markers.forEach(function(marker) {
                marker.setMap(null);
            });
            markers = [];
        }

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
            return;
            }

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
        // Clear out the old markers.
        markers.forEach(function(marker) {
            marker.setMap(null);
        });
        markers = [];
    });
};

function set_rec_object(place) {
    rec_object = {
        g_formatted_address: place.formatted_address,
        g_lat: place.geometry.location.lat(),
        g_lon: place.geometry.location.lng(),
        g_id: place.id,
        g_place_id: place.place_id,
        g_rating: place.rating,
        g_name: place.name,
        g_types: place.types,
        g_website: place.website                          
    };
    return rec_object;
};

function fixInfoWindow() {
    //Here we redefine set() method.
    //If it is called for map option, we hide InfoWindow, if "noSupress" option isnt true.
    //As Google doesn't know about this option, its InfoWindows will not be opened.
    var set = google.maps.InfoWindow.prototype.set;
    google.maps.InfoWindow.prototype.set = function (key, val) {
        var self = this;
        if (key === "map") {
            if (!this.get("noSupress") && !this.get("externalLinkAlreadyAdded")) {
                var link = $("<p></p><button type=\"button\" class=\"btn btn-info btn-lg\" data-toggle=\"modal\" data-target=\"#myModal\">Add Recommendation</button><p></p>");
                //var link = $("<p><a id='myLink' href='#' data-toggle=\"modal\"'>Add Recommendation</a></p>");
                link.click(function() {
                    console.log("link clicked",self,self.getContent(),self.content);
                });
                $(this.content).find("div.address").append($("<div>").append(link).append($("</div>")));
                this.set("externalLinkAlreadyAdded",true);
            }
        }
        set.apply(this,arguments);
    }
};

var ClickEventHandler = function(map, origin, infoWindow) {
    this.origin = origin;
    this.map = map;
    this.infowindow = infoWindow;
    this.placesService = new google.maps.places.PlacesService(map);

    // Listen for clicks on the map.
    this.map.addListener('click', this.handleClick.bind(this));
};

ClickEventHandler.prototype.handleClick = function(event) {
    if (event.placeId) {
        this.getPlaceInformation(event.placeId);
    }
};
ClickEventHandler.prototype.getPlaceInformation = function(placeId) {
    var me = this;
    this.placesService.getDetails({placeId: placeId}, function(place, status) {
        if (status === 'OK') {
            rec_object = set_rec_object(place);
        }
    });
};