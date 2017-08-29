/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var user_id = 0;
var username = '';
var recommendations = {};
var active_menu = 'global';
var markers = [];
var infos = [];
    
//$(document).ready(function(){
window.onload = function(){
    user_id = getCookie('user_id');
    username = getCookie('username');
    if (user_id !== "") {
        setRecommendations('global');
        login_html = "<span>Logged in as </span><a href=\"http://localhost:8383/WOMApplication/login.html\" class=\"login-link\">"+username+"</a>"
        $('.login-info-bar').append(login_html);
    } else {
        login_html = "<a href=\"http://localhost:8383/WOMApplication/login.html\" class=\"login-link\">Login</a>"
        $('.login-info-bar').append(login_html);
    };
};

function setRecommendations(rec_type) {
    active_menu = rec_type;
    get_recommendations(rec_type);
    temp_obj = recommendations["recommendations"];
    if (rec_type === 'global') {
        html_head = "<div class=\"rec-section-header\"><span>What people are recommending...</span></div><div class=\"filter-bar\"><a href=\"#\"><i class=\"fa fa-filter\" onClick=\"showFilters()\"></i></a></div>";
        html_start = "<div class=\"list-container\"><ol class=\"stream-items\">";
    } else if (rec_type === 'local') {
        html_head = "<div class=\"rec-section-header\"><span>My recommendations...</span></div>";
        html_start = "<div class=\"list-container\"><ol class=\"stream-items\">";
    };
    deleteMarkers();
    html_body = "";
    marker_list = {};
    for (var i = 0; i < temp_obj.length; i++) {
        if (temp_obj[i]["r_google_place_id"] in marker_list) {
            if (temp_obj[i]["r_type"] !== marker_list[temp_obj[i]["r_google_place_id"]]["type"]) {
                marker_list[temp_obj[i]["r_google_place_id"]]["type"] = 0;
            }
        } else {
            marker_list[temp_obj[i]["r_google_place_id"]] = {};
            lat = temp_obj[i]["r_geom"].slice(temp_obj[i]["r_geom"].indexOf("(")+1,temp_obj[i]["r_geom"].indexOf(" "));
            long = temp_obj[i]["r_geom"].slice(temp_obj[i]["r_geom"].indexOf(" ")+1,temp_obj[i]["r_geom"].indexOf(")"));
            marker_list[temp_obj[i]["r_google_place_id"]]["lat"] = lat;
            marker_list[temp_obj[i]["r_google_place_id"]]["long"] = long;
            marker_list[temp_obj[i]["r_google_place_id"]]["name"] = temp_obj[i]["r_name"];
            marker_list[temp_obj[i]["r_google_place_id"]]["type"] = temp_obj[i]["r_type"];            
        }
        html_body += getCardHtml(temp_obj[i],i);
    };
    if (Object.keys(marker_list).length > 0) {
        addMarkers(marker_list);    
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++) {
            bounds.extend(markers[i].getPosition());
        }
        map.fitBounds(bounds);        
    }
    
    html_end = "</ol></div>"
    $('.content-header').empty();
    $('.content-header').append(html_head);
    $('#scroll').empty();
    $('#scroll').append(html_start+html_body+html_end);
}

function getCardHtml(recObj,i) {
    r_date = "Just now...";
    card_html = "";
    card_html += "<li class=\"js-stream-item\">";
    card_html += "<div class=\"rec-item\">";
    card_html += "<div class=\"stream-item-context\">";
    card_html += "<div class=\"stream-item-header\">";
    card_html += "<span class=\"UserName\"><strong class=\"userName\">"+recObj["username"]+"</strong></span>";
    card_html += "<div class=\"stream-item-container\">";
    card_html += "<span class=\"rec-name\"><strong class=\"recName\">"+recObj["r_name"]+"</strong></span>";
    card_html += "<span class=\"rec-comment\">"+recObj["r_comment"]+"</span>";
    card_html += "<span class=\"rec-date\" style=\"float:right\">"+recObj["r_date"].slice(0,recObj["r_date"].indexOf(" "))+"</span>";
    card_html += "</div>";
    card_html += "</div>";
    card_html += "<div class=\"stream-item-footer\">";
    card_html += "<button class=\"fa fa-angle-down\" data-toggle=\"collapse\" data-target=\"#stream-item-collapse-"+i.toString()+"\"></button>"
    card_html += "<div id=\"stream-item-collapse-"+i.toString()+"\" class=\"collapse\">"
    if ( recObj["r_price"] ) {
        price_string = "";
        for (i = 0; i < recObj["r_price"]; i++) {
            price_string += "$";
        }
        card_html += "<span class=\"rec-footer-content\">Price: "+price_string+"</span>";
    } 
    if ( recObj["r_google_rating"] ) {
        card_html += "<span class=\"rec-footer-content\">Google Rating: "+recObj["r_google_rating"]+"</span>";
    }
    if (recObj["r_google_type"] ) {
        card_html += "<span class=\"rec-footer-content\">Type: "+recObj["r_google_type"].replace(/_/g," ")+"</span>";
    }
    if ( recObj["r_website"] ) {
        card_html += "<span class=\"rec-footer-content\">Website: "+recObj["r_website"]+"</span>";
    }
    card_html += "</div>";
    card_html += "</div>";
    card_html += "</div>";
    card_html += "</div>";
    card_html += "</li>";
    return card_html
}

function addRecToList(recObj) {
    card_html = getCardHtml(recObj);
    $('.stream-items').prepend(card_html);
}

function addMarkers(marker_list) {
    for (var id in marker_list) {
        var myLatLng = {lat: parseFloat(marker_list[id]["lat"]), lng: parseFloat(marker_list[id]["long"])};
        if (marker_list[id]["type"] === 1) {
            marker_icon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
        } else if (marker_list[id]["type"] === -1) {
            marker_icon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        } else {
            marker_icon = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        }
        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            title: marker_list[id]["name"],
            icon: marker_icon
        });
        markers.push(marker);
        var infowindow = new google.maps.InfoWindow();
        content = "<p>Test Content - "+marker_list[id]["name"]+"</p>";
        //console.log(content);
        google.maps.event.addListener(marker,'click', (function(marker,content,infowindow){ 
            return function() {
                closeInfos();
                infowindow.setContent(content);
                infowindow.open(map,marker);
                infos[0]=infowindow;
            };
        })(marker,content,infowindow));
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

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
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
}      

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function sendData() {
    //console.log(rec_object)
    var comment = document.getElementById("rec-comment").value;
    rec_object["comment"] = comment;
    rec_object["user_id"] = user_id;
    rec_object["username"] = username;
    $.ajax({
        url: 'http://localhost:8080/createRec',
        type: 'POST',
        data: JSON.stringify(rec_object),
        dataType: 'text',
        success: function() {
            $.notify("Successfully Added Recommendation", {className: "success", position: "bottom center"});
            if (active_menu === 'local') {
                temp_obj = {username: username, r_comment: comment, r_name: rec_object["g_name"], r_date: "Just Added..."};
                addRecToList(temp_obj);
            }
        },
        error: function(jqXHR, exception) {
            //console.log(jqXHR);
            if (jqXHR.status === 0) {
                $.notify("Error: No Connection to Database", {className: "error", position: "bottom center"});
            } else if (jqXHR.status == 404) {
                $.notify("Requested page not found", {className: "error", position: "bottom center"});
            } else if (jqXHR.status == 500) {
                $.notify("Error: Internal Server Error", {className: "error", position: "bottom center"});
            } else if (exception === 'parsererror') {
                $.notify("Error: JSON parse failed", {className: "error", position: "bottom center"});
            } else if (exception === 'timeout') {
                $.notify("Error: Timeout", {className: "error", position: "bottom center"});
            } else if (exception === 'abort') {
                $.notify("Error: Ajax request aborted", {className: "error", position: "bottom center"});
            } else {
                $.notify("Error: Unknown Error" + jqXHR.responseText, {className: "error", position: "bottom center"});
            }
        }
    });
};

function get_recommendations(lookup_type) {
    post_data = {
        uid: user_id,
        lookup_type: lookup_type
    };
    $.ajax({
        url: 'http://localhost:8080/getRecs',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(recommendation_data) {
            temp_obj = recommendation_data["recommendations"];
            recommendations = {
                "recommendations": temp_obj
            };
            $.notify("Found data", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            //console.log(jqXHR);
            if (jqXHR.status === 0) {
                $.notify("Error: No Connection to Database", {className: "error", position: "bottom center"});
            } else if (jqXHR.status == 404) {
                $.notify("Requested page not found", {className: "error", position: "bottom center"});
            } else if (jqXHR.status == 500) {
                $.notify("Error: Internal Server Error", {className: "error", position: "bottom center"});
            } else if (exception === 'parsererror') {
                $.notify("Error: JSON parse failed", {className: "error", position: "bottom center"});
            } else if (exception === 'timeout') {
                $.notify("Error: Timeout", {className: "error", position: "bottom center"});
            } else if (exception === 'abort') {
                $.notify("Error: Ajax request aborted", {className: "error", position: "bottom center"});
            } else {
                $.notify("Error: Unknown Error" + jqXHR.responseText, {className: "error", position: "bottom center"});
            }
        },
        async: false
    });
};

function showFilters() {
    if ( $('.filter-content').css('display') === 'none' ) {
        $('.filter-content').css('display','block');
        type_list = getTypes();
        var options = $("#type-list");
        $.each(type_list, function(type) {
            options.append($("<option />").val(type).text(type));
        });
    } else {
        $('.filter-content').css('display','none');
    }
};

function getTypes() {
    temp_obj = recommendations["recommendations"];
    type_list = [];
    for (var i = 0; i < temp_obj.length; i++) {
        types_string = temp_obj[i]["r_type"];
        types_array = types_string.split(', ');
        for (var j = 0; j < types_array.length; j++) {
            if ( type_list.indexOf(types_array[j]) === -1 ) {
                type_list.append(types_array[j])
            }
        }
    }
    console.log(type_list);
    return type_list;
}