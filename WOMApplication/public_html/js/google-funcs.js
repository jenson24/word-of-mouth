/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//------------------------------------------
function handleLocationError(browserHasGeolocation, infoWindow, position) {
    infoWindow.setPosition(position);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(document.getElementById('map'));
};

var rec_object = {};
var map;
function initAutocomplete(event) {
    var infoWindow;
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 33.174, lng: -117.06757},
        zoom: 11
    });
    infoWindow = new google.maps.InfoWindow;
    var clickHandler = new ClickEventHandler(map, origin, infoWindow);    

    fixInfoWindow();
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            pos = {
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
            
            var split = places[0].formatted_address.indexOf(',');
            var address_1 = places[0].formatted_address.substring(1,split);
            var address_2 = places[0].formatted_address.substring(split+1,places[0].formatted_address.length);
            var content_string = "<div class=\"infoHeader\"><strong>"+places[0].name+"</strong><div>"+address_1+"</div><div>"+address_2+"</div></div>";
            var like_link = "<p></p><button type=\"button\" id=\"like-btn\" class=\"addRec fa fa-thumbs-up\" onclick=\"openRecModalFromSearch(1)\"> Like</button>";
            var dislike_link = "<button type=\"button\" id=\"dislike-btn\" class=\"addRec fa fa-thumbs-down\" onclick=\"openRecModalFromSearch(-1)\"> Dislike</button>";
            var try_link = "<button type=\"button\" id=\"try-btn\" class=\"addRec\" onclick=\"openRecModalFromSearch(0)\">"+save_list_name+"</button><p></p>";
            
            content_string += "<div style=\"display:inline-block\">"+like_link+dislike_link+try_link+"</div>";
            content_string += "<div class=\"view-link\"><a target=\"_blank\" href=\""+places[0].website+"\"><span> View on Google Maps </span></a></div>"
            
            var infowindow = new google.maps.InfoWindow({
                content: content_string,
                maxWidth: 230
            });
            infowindow.setPosition(new google.maps.LatLng(places[0].geometry.location.lat(), places[0].geometry.location.lng()));
            infowindow.open(map);
            infoWindows.push(infowindow);
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
        //var clickLat = event.latLng.lat();
        //var clickLon = event.latLng.lng();                
        // show in input box
        //document.getElementById("lat").value = clickLat.toFixed(5);
        //document.getElementById("lon").value = clickLon.toFixed(5);
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
        g_website: place.website,    
        g_price: place.price_level
    };
    //console.log(rec_object);
    return rec_object;
};

function fixInfoWindow() {
    //Here we redefine set() method.
    //If it is called for map option, we hide InfoWindow, if "noSupress" option isnt true.
    //As Google doesn't know about this option, its InfoWindows will not be opened.
    var set = google.maps.InfoWindow.prototype.set;
    google.maps.InfoWindow.prototype.set = function (key, val) {
        //var self = this;
        if (key === "map") {
            if (!this.get("noSupress") && !this.get("externalLinkAlreadyAdded")) {
                var like_link = $("<p></p><button type=\"button\" id=\"like-btn\" class=\"addRec fa fa-thumbs-up\" data-toggle=\"modal\" data-target=\"#myModal\"> Like</button>");
                var dislike_link = $("<button type=\"button\" id=\"dislike-btn\" class=\"addRec fa fa-thumbs-down\" data-toggle=\"modal\" data-target=\"#myModal\"> Dislike</button>");
                var try_link = $("<button type=\"button\" id=\"try-btn\" class=\"addRec\" data-toggle=\"modal\" data-target=\"#myModal\">"+save_list_name+"</button><p></p>");
                var add_list_html = "";
                if (user_lists.length > 1) {
                    add_list_html += "<div><strong>Optional:</strong> Select one of your lists for the recommendation to be added to...</div>";
                    add_list_html += "<select id=\"user-list-select\" class=\"list-select list-inputs\">";
                    add_list_html += "<option value=\"null\"></option>";
                    for (var i = 0; i < user_lists.length; i++) {
                        if (user_lists[i]["list_name"] !== save_list_name) {
                            add_list_html += "<option value=\""+user_lists[i]["list_id"]+"\">"+user_lists[i]["list_name"]+"</option>";
                        }
                    }
                    add_list_html += "</select>";
                }
                like_link.click(function() {
                    //console.log("link clicked",self,self.getContent(),self.content);
                    rec_object["r_type"] = 1;
                    $('#modal-title').empty();
                    $("<h3 class=\"modal-title-header fa fa-thumbs-up\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
                    $('#modal-title-header').append("   ");
                    $('#modal-title-header').append(rec_object["g_name"]);
                    $('#modal-body').empty();
                    $('#modal-body').append("Save a comment...");
                    $('#modal-body').append("<textarea rows=\"4\" maxlength=\"1000\" id=\"rec-comment\" placeholder=\"What do you like about this place?\">");
                    $('#modal-body').append(add_list_html);
                    $('.modal-footer').empty();
                    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
                    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-save\" data-dismiss=\"modal\" onClick=\"sendData('like')\">Send</button>");
                });
                dislike_link.click(function() {
                    //console.log("link clicked",self,self.getContent(),self.content);
                    rec_object["r_type"] = -1;
                    $('#modal-title').empty();
                    $("<h3 class=\"modal-title-header fa fa-thumbs-down\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
                    $('#modal-title-header').append("   ");
                    $('#modal-title-header').append(rec_object["g_name"]);
                    $('#modal-body').empty();
                    $('#modal-body').append("Save a comment...");
                    $('#modal-body').append("<textarea rows=\"4\" maxlength=\"1000\" id=\"rec-comment\" placeholder=\"What don't you like about this place?\">");
                    $('#modal-body').append(add_list_html);
                    $('.modal-footer').empty();
                    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
                    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-save\" data-dismiss=\"modal\" onClick=\"sendData('dislike')\">Send</button>");
                });
                try_link.click(function() {
                    rec_object["r_type"] = 0;
                    $('#modal-title').empty();
                    $("<h3 class=\"modal-title-header\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
                    $('#modal-title-header').append(rec_object["g_name"]);
                    $('#modal-body').empty();
                    $('#modal-body').append("Add a comment and click 'Save' to store this in your '"+save_list_name+"' list.");
                    $('#modal-body').append("<textarea rows=\"4\" maxlength=\"1000\" id=\"rec-comment\" placeholder=\"Save a comment...\">");
                    $('.modal-footer').empty();
                    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
                    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-save\" data-dismiss=\"modal\" onClick=\"sendData('save')\">Save</button>");
                });
                $(this.content).find("div.address").append($("<div>")).append(like_link).append(dislike_link).append(try_link).append($("</div>"));
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
    //var me = this;
    this.placesService.getDetails({placeId: placeId}, function(place, status) {
        if (status === 'OK') {
            rec_object = set_rec_object(place);
        }
    });
};

function openRecModalFromSearch(r_type) {
    rec_object["r_type"] = r_type;
    $('#myModal').modal('show');
    $('#modal-title').empty();
    if (r_type === 1) {
        $("<h3 class=\"modal-title-header fa fa-thumbs-up\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
        var input_header = "Save a comment...";
        var placeholder = "What do you like about this place?";
        var type = 'like';
    } else if (r_type === -1) {
        $("<h3 class=\"modal-title-header fa fa-thumbs-down\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
        var input_header = "Save a comment...";
        var placeholder = "What don't you like about this place?";
        var type = 'dislike';
    } else {
        $("<h3 class=\"modal-title-header\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
        var input_header = "Add a comment and click 'Save' to store this in your '"+save_list_name+"' list.";
        var placeholder = "Save a comment...";
        var type = 'save';
    }
    $('#modal-title-header').append("   ");
    $('#modal-title-header').append(rec_object["g_name"]);
    $('#modal-body').empty();
    $('#modal-body').append(input_header);
    $('#modal-body').append("<textarea rows=\"4\" maxlength=\"1000\" id=\"rec-comment\" placeholder=\""+placeholder+"\">");
    if (user_lists.length > 1) {
        $('#modal-body').append("<div><strong>Optional:</strong> Select one of your lists for the recommendation to be added to...</div>");
        var dropdown = "<select id=\"user-list-select\" class=\"list-select list-inputs\">";
        dropdown += "<option value=\"null\"></option>";
        for (var i = 0; i < user_lists.length; i++) {
            if (user_lists[i]["list_name"] !== save_list_name) {
                dropdown += "<option value=\""+user_lists[i]["list_id"]+"\">"+user_lists[i]["list_name"]+"</option>";
            }
        }
        dropdown += "</select>";
        $('#modal-body').append(dropdown);
    }
    $('.modal-footer').empty();
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-save\" data-dismiss=\"modal\" onClick=\"sendData('"+type+"')\">Send</button>");
}