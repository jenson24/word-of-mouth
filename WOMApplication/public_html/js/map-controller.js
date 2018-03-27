/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function getMarkerInfo(temp_obj,type) {
    if (type === 'new') {
        deleteMarkers();
        marker_list = {};        
    }
    for (var i = 0; i < temp_obj.length; i++) {
        if (temp_obj[i]["r_google_place_id"] in marker_list) {
            marker_list[temp_obj[i]["r_google_place_id"]]["comment"].push(temp_obj[i]["r_comment"]);
            marker_list[temp_obj[i]["r_google_place_id"]]["username"].push(temp_obj[i]["username"]);
            if (temp_obj[i]["r_type"] !== marker_list[temp_obj[i]["r_google_place_id"]]["type"]) {
                marker_list[temp_obj[i]["r_google_place_id"]]["type"] = 0;
            }
        } else {
            marker_list[temp_obj[i]["r_google_place_id"]] = {};
            marker_list[temp_obj[i]["r_google_place_id"]]["lat"] = temp_obj[i]["r_lat"];
            marker_list[temp_obj[i]["r_google_place_id"]]["long"] = temp_obj[i]["r_lon"];
            marker_list[temp_obj[i]["r_google_place_id"]]["name"] = temp_obj[i]["r_name"];
            marker_list[temp_obj[i]["r_google_place_id"]]["comment"] = [temp_obj[i]["r_comment"]];
            marker_list[temp_obj[i]["r_google_place_id"]]["username"] = [temp_obj[i]["username"]];
            marker_list[temp_obj[i]["r_google_place_id"]]["address"] = temp_obj[i]["r_address"];
            marker_list[temp_obj[i]["r_google_place_id"]]["website"] = temp_obj[i]["r_website"];
            marker_list[temp_obj[i]["r_google_place_id"]]["type"] = temp_obj[i]["r_type"];            
        }
    };
    if (Object.keys(marker_list).length > 0) {
        addMarkers(marker_list);    
        if (type !== 'keep') {
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < markers.length; i++) {
                bounds.extend(markers[i].getPosition());
            }
            map.fitBounds(bounds);
        }
    }
}
function addMarkers(marker_list) {
    for (var id in marker_list) {
        var myLatLng = {lat: parseFloat(marker_list[id]["lat"]), lng: parseFloat(marker_list[id]["long"])};
        if (marker_list[id]["type"] === 1) {
            marker_icon = "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
        } else if (marker_list[id]["type"] === -1) {
            marker_icon = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
        } else {
            marker_icon = "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        }
        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            title: marker_list[id]["name"],
            icon: marker_icon
        });
        markers.push(marker);
        var infowindow = new google.maps.InfoWindow({
            maxWidth: 250
        });
        marker_content = getMarkerContent(marker_list[id]);
        google.maps.event.addListener(marker,'click', (function(marker,marker_content,infowindow){ 
            return function() {
                closeInfos();
                infowindow.setContent(marker_content);
                infowindow.open(map,marker);
                infos[0]=infowindow;
            };
        })(marker,marker_content,infowindow));
    }
}

function closeInfos(){
    if(infos.length > 0){
        /* detach the info-window from the marker ... undocumented in the API docs */
        infos[0].set("marker", null);
        /* and close it */
        infos[0].close();
        /* blank the array */
        infos.length = 0;
   }
}
function closeAllInfoWindows() {
    for (var i=0;i<infoWindows.length;i++) {
       infoWindows[i].close();
    }
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    if (markers.length > 0) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
    }
    if (list_markers.length > 0) {
        for (var i = 0; i < list_markers.length; i++) {
            list_markers[i].setMap(map);
        }
    }
}
// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}
// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    clearMarkers();
    markers = [];
    list_markers = [];
}  
function getMarkerContent(obj) {
    marker_html = "";
    marker_html += "<div class=\"marker-item-context\">";
    marker_html += "<div class=\"marker-item-header\">";
    marker_html += "<span class=\"loc-info\"><strong>"+obj["name"]+"</strong></span>";
    marker_html += "<span class=\"loc-info\">"+obj["address"].replace(',', '<br>')+"</span>";
    marker_html += "<a target=\"_blank\" href=\""+obj["website"]+"\" class=\"website-footer-content\">"+obj["website"]+"</a>";
    marker_html += "</div>";
    marker_html += "<div class=\"marker-item-container\">";
    for (var i=0; i<obj["comment"].length; i++) {
        marker_html +="<br>";
        marker_html += "<span class=\"marker-comment\"><i>"+obj["comment"][i]+"</i></span>";
        marker_html += "<span class=\"marker-comment\" style=\"float:right\">"+obj["username"][i]+"</span>";
        marker_html +="<br>";
    }
    marker_html += "</div>";
    marker_html += "</div>";
    return marker_html;
}

