/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var user_id = 0;
var username = '';
var recommendations = {};
var fetched_all_recommendations = [];
var fetched_my_recommendations = [];
var active_menu = 'global';
var markers = [];
var infos = [];
var typeSelection = '';
var page_size = 10;
var marker_list = {};
var search_rec_results = [];
    
window.onload = function(){
    user_id = getCookie('user_id');
    username = getCookie('username');
    if (user_id !== "") {
        page = 1;
        //get_recommendations('global', page);
        //temp_obj = recommendations["recommendations"];
        setRecommendations('global','new','new');
        login_html = "<span>Logged in as </span><a href=\"http://localhost:8383/WOMApplication/login.html\" class=\"login-link\">"+username+"</a>"
        $('.login-info-bar').append(login_html);
        $('a.icon-select.global').addClass('active')
    } else {
        login_html = "<a href=\"http://localhost:8383/WOMApplication/login.html\" class=\"login-link\">Login</a>"
        $('.login-info-bar').append(login_html);
    };
};

function setRecommendations(rec_type, temp_obj, marker_flag) {
    if (temp_obj === 'new') {
        if (rec_type === 'global' && fetched_all_recommendations.length > 0) {
            temp_obj = fetched_all_recommendations;
        } else if (rec_type === 'local' && fetched_my_recommendations.length > 0) {
            temp_obj = fetched_my_recommendations;
        } else {
            page = 1;
            get_recommendations(rec_type, page);
            temp_obj = recommendations["recommendations"];            
            jQuery('#scroll').animate({scrollTop:0},0);
        }
        clearFilters();
    }
    active_menu = rec_type;
    if (rec_type === 'global') {
        html_head = "<div class=\"rec-section-header\"><span>What people are recommending...</span></div><div class=\"filter-bar\"><a href=\"#\"><i class=\"fa fa-ban\" onClick=\"removeFilters()\"></i></a><a href=\"#\"><i class=\"fa fa-filter\" onClick=\"showFilters()\"></i></a></div>";
    } else if (rec_type === 'local') {
        html_head = "<div class=\"rec-section-header\"><span>My recommendations...</span></div><div class=\"filter-bar\"><a href=\"#\"><i class=\"fa fa-ban\" onClick=\"removeFilters()\"></i></a><a href=\"#\"><i class=\"fa fa-filter\" onClick=\"showFilters()\"></i></a></div>";
    };
    html_start = "<div class=\"list-container\"><ol class=\"stream-items\">";
    getMarkerInfo(temp_obj,marker_flag);
    html_body = "";
    for (var i = 0; i < temp_obj.length; i++) {
        html_body += getCardHtml(temp_obj[i],i);
    }
    
    html_end = "</ol></div>";
    $('.content-header').empty();
    $('.content-header').append(html_head);
    $('#scroll').empty();
    $('#scroll').append(html_start+html_body+html_end);
}

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
            lat = temp_obj[i]["r_geom"].slice(temp_obj[i]["r_geom"].indexOf("(")+1,temp_obj[i]["r_geom"].indexOf(" "));
            long = temp_obj[i]["r_geom"].slice(temp_obj[i]["r_geom"].indexOf(" ")+1,temp_obj[i]["r_geom"].indexOf(")"));
            marker_list[temp_obj[i]["r_google_place_id"]]["lat"] = lat;
            marker_list[temp_obj[i]["r_google_place_id"]]["long"] = long;
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
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++) {
            bounds.extend(markers[i].getPosition());
        }
        map.fitBounds(bounds);        
    }
}

function addRecToList(recObj) {
    if (active_menu === 'local') {
        rec_num = fetched_my_recommendations.length;            
    } else {
        rec_num = fetched_all_recommendations.length;    
    }
    card_html = getCardHtml(recObj,rec_num);
    $('.stream-items').prepend(card_html);
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
    card_html += "<button class=\"fa fa-angle-down\" data-toggle=\"collapse\" data-target=\"#stream-item-collapse-"+i.toString()+"\"></button>";
    card_html += "<div id=\"stream-item-collapse-"+i.toString()+"\" class=\"collapse\">";
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
        //card_html += "<span class=\"rec-footer-content\">Website: "+recObj["r_website"]+"</span>";
        card_html += "<span>Website: </span><a href=\""+recObj["r_website"]+"\" class=\"website-footer-content\">"+recObj["r_website"]+"</a>";
    }
    card_html += "</div>";
    card_html += "</div>";
    card_html += "</div>";
    card_html += "</div>";
    card_html += "</li>";
    return card_html;
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
            } else if (jqXHR.status === 404) {
                $.notify("Requested page not found", {className: "error", position: "bottom center"});
            } else if (jqXHR.status === 500) {
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

function get_recommendations(lookup_type, page) {
    post_data = {
        uid: user_id,
        lookup_type: lookup_type,
        page: page
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
            for (var i = 0; i < recommendations["recommendations"].length; i++) {
                if (lookup_type === 'global') {
                    fetched_all_recommendations.push(recommendations["recommendations"][i]);                                 
                } else if (lookup_type === 'local') {
                    fetched_my_recommendations.push(recommendations["recommendations"][i]);                                    
                }
            }
            $.notify("Found data", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            //console.log(jqXHR);
            if (jqXHR.status === 0) {
                $.notify("Error: No Connection to Database", {className: "error", position: "bottom center"});
            } else if (jqXHR.status === 404) {
                $.notify("Requested page not found", {className: "error", position: "bottom center"});
            } else if (jqXHR.status === 500) {
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
        $('.fa-ban').css('visibility','visible');
        $('.filter-content').css('display','block');
        $('#scroll').css("height","calc( 100% - 92px - 32px - 24px )");
        type_list = getTypes();
        var options = $("#type-list");
        options.empty();
        options.append($("<option />").val("None").text(""));            
        for (var i = 0; i < type_list.length; i++) {
            options.append($("<option />").val(type_list[i]).text(type_list[i].replace(/_/g," ")));            
        }
        if (typeSelection !== "") {
            var element = document.getElementById('type-list');
            element.value = typeSelection;            
        }
    } else {
        $('.fa-ban').css('visibility','hidden');
        typeSelection = document.getElementById("type-list").value;
        $('.filter-content').css('display','none');
        $('#scroll').css("height","calc( 100% - 92px - 32px )");
    }
};

function getTypes() {
    if (active_menu === 'global') {
        temp_obj = fetched_all_recommendations;        
    } else if (active_menu === 'local') {
        temp_obj = fetched_my_recommendations;
    }    
    var type_list = [];
    for (var i = 0; i < temp_obj.length; i++) {
        types_string = temp_obj[i]["r_google_type"];
        var types_array = types_string.split(', ');
        for (var j = 0; j < types_array.length; j++) {
            if ( type_list.indexOf(types_array[j]) === -1 ) {
                type_list.push(types_array[j]);
            }
        }
    }
    return type_list;
}

function filter_by_type(all_recs, recType) {
    if (recType !== "None") {
        new_filtered_objects = [];
        for (var i = 0; i < all_recs.length; i++) {
            if (all_recs[i]["r_google_type"].indexOf(recType) !== -1) {
                new_filtered_objects.push(all_recs[i]);
            }
        }
        return new_filtered_objects;
    } else {
        return all_recs;
    }
}

function filter_by_rating(all_recs, rating) {
    new_filtered_objects = [];
    for (var i = 0; i < all_recs.length; i++) {
        if (parseFloat(all_recs[i]["r_google_rating"]) > rating) {
            new_filtered_objects.push(all_recs[i]);
        }
    }
    return new_filtered_objects;
}

function filter_by_price(all_recs, price) {
    new_filtered_objects = [];
    for (var i = 0; i < all_recs.length; i++) {
        if ('r_price' in all_recs[i] && all_recs[i]["r_price"] === price) {
            new_filtered_objects.push(all_recs[i]);
        } else if (all_recs[i]["r_price"] === null && price === 1) {
            new_filtered_objects.push(all_recs[i]);
        }
    }
    return new_filtered_objects;
}
function filter_controller(price, rating, type) {
    if (active_menu === 'global') {
        all_recs = fetched_all_recommendations;        
    } else if (active_menu === 'local') {
        all_recs = fetched_my_recommendations;
    }    
    if (price === "") {
        price_filter = 0;
        dollar_ids = ["dollar1","dollar2","dollar3","dollar4"];
        for (var i = 0; i < dollar_ids.length; i++) {
            if($("#"+dollar_ids[i]).is(':checked')) { 
                price_filter = i+1; 
            }
        }
        if (price_filter !== 0) {
            price_filtered_objects = filter_by_price(all_recs, price_filter);
        } else {
            price_filtered_objects = all_recs;
        }
    } else {
        price_filtered_objects = filter_by_price(all_recs, price);
    }
    if (rating === "") {
        rating_filter = 0;
        star_ids = ["starhalf","star1","star1half","star2","star2half","star3","star3half","star4","star4half","star5"];
        star_vals = [0.5,1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0];
        for (var i = 0; i < star_ids.length; i++) {
            if($("#"+star_ids[i]).is(':checked')) { 
                rating_filter = star_vals[i]; 
            }
        }
        if (rating_filter !== 0) {
            rating_filtered_objects = filter_by_rating(price_filtered_objects, rating_filter);
        } else {
            rating_filtered_objects = price_filtered_objects;
        }
    } else {
        rating_filtered_objects = filter_by_rating(price_filtered_objects, rating);
    }
    if (type === "") {
        typeFilter = $('#type-list option:selected').val();
        if (typeFilter !== "None") {
            type_filtered_objects = filter_by_type(rating_filtered_objects, typeFilter);
        } else {
            type_filtered_objects = rating_filtered_objects;
        }
    } else {
        type_filtered_objects = filter_by_type(rating_filtered_objects, type);        
    }
    setRecommendations(active_menu,type_filtered_objects,'new');
    $('.fa-ban').css('visibility','visible');
}
 
$(document).ready(function() {
    $('#scroll').scroll(function() {
        var div = $(this);
        //console.log(Math.ceil(div[0].scrollHeight - div.scrollTop()));
        //console.log(Math.ceil(div.height()));
        if (Math.ceil(div[0].scrollHeight - div.scrollTop()) <= Math.ceil(div.height())) { // If scroll to bottom, load next page
            //console.log("Reached the bottom!");
            if (active_menu === 'searchRecs') {
                next_page = getPage();
                term = $('.search-input').val();
                if (term.length > 3) {
                    if (next_page !== 'None') {
                        searchRecs(term,next_page);
                    }
                }
            } else {
                filt = checkFilters();
                if (filt === false) {
                    next_page = getPage();
                    if (next_page !== 'None') {
                        //console.log(next_page);
                        get_recommendations(active_menu,next_page);
                        addRecsToPage();                
                    }                
                }                
            }
        } 
    });
    $('.icon-select').click(function(){
        $('.icon-select').removeClass("active");
        $(this).addClass("active");
    });
 });

function checkFilters() {
    filt = false;
    dollar_ids = ["dollar1","dollar2","dollar3","dollar4"];
    for (var i = 0; i < dollar_ids.length; i++) {
        if($("#"+dollar_ids[i]).is(':checked')) { 
            filt = true; 
        }
    }
    star_ids = ["starhalf","star1","star1half","star2","star2half","star3","star3half","star4","star4half","star5"];
    for (var i = 0; i < star_ids.length; i++) {
        if($("#"+star_ids[i]).is(':checked')) { 
            filt = true; 
        }
    }
    typeFilter = $('#type-list option:selected').val();
    if (typeof typeFilter === 'undefined' || !typeFilter){
        //test = 'test';
    } else {
        if (typeFilter !== "None") {
            filt = true;
        }   
    }
    return filt;
}
function getPage() {
    if (active_menu === 'global') {
        rec_length = fetched_all_recommendations.length;
    } else if (active_menu === 'local') {
        rec_length = fetched_my_recommendations.length;
    } else if (active_menu === 'searchRecs') {
        rec_length = search_rec_results.length;
    }
    //console.log(rec_length % page_size);
    if (rec_length % page_size !== 0) {
        page = 'None';
    } else {
        page = (rec_length / page_size) + 1;    
    }
    return page;
}
function addRecsToPage() {
    new_recs = recommendations["recommendations"];
    getMarkerInfo(new_recs,'continue');
    if (active_menu === 'local') {
        rec_num = fetched_my_recommendations.length - new_recs.length;            
    } else {
        rec_num = fetched_all_recommendations.length - new_recs.length;    
    }
    html_body = "";
    for (var i = 0; i < new_recs.length; i++) {
        html_body += getCardHtml(new_recs[i],i+rec_num);
    }
    $('.stream-items').append(html_body);
}
function clearFilters() {
    $('.price-radio').prop('checked', false);
    $('.rating-radio').prop('checked', false);
    $(".type-list").val("None");
}
function removeFilters() {
    clearFilters();
    if (active_menu === 'local') {
        setRecommendations('local',fetched_my_recommendations,'new');
    } else {
        setRecommendations(active_menu,fetched_all_recommendations,'new');
    }
}
function getMarkerContent(obj) {
    marker_html = "";
    //marker_html += "<div class=\"rec-item\">";
    marker_html += "<div class=\"marker-item-context\">";
    marker_html += "<div class=\"marker-item-header\">";
    marker_html += "<span class=\"loc-info\"><strong>"+obj["name"]+"</strong></span>";
    marker_html += "<span class=\"loc-info\">"+obj["address"].replace(',', '<br>')+"</span>";
    marker_html += "<a href=\""+obj["website"]+"\" class=\"website-footer-content\">"+obj["website"]+"</a>";
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
function enableSearch() {
    active_menu = 'searchRecs';
    $('#scroll').empty();
    $('.content-header').empty();
    html_search = "<form autocomplete=\"on\"><input type=\"text\" placeholder=\"Search your network's recommendations...\" id=\"search-input\" class=\"search-input\" onchange=searchController($(this).val())></form>";
    $('.content-header').append(html_search);
}
function searchRecs(term,page) {
    post_data = {
        uid: user_id,
        term: term,
        page: page
    };
    $.ajax({
        url: 'http://localhost:8080/searchRecs',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(search_results) {
            //console.log(search_results);
            addSearchResultsToList(search_results);
            search_rec_results.push(search_results);
            $.notify("Found search results", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            if (jqXHR.status === 0) {
                $.notify("Error: No Connection to Database", {className: "error", position: "bottom center"});
            } else if (jqXHR.status === 404) {
                $.notify("Requested page not found", {className: "error", position: "bottom center"});
            } else if (jqXHR.status === 500) {
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
}
function searchController(term) {
   console.log(term);
    if (term.length > 3) {
        search_rec_results = [];
        $('#scroll').empty();
        if (search_rec_results.length === 0) {
            searchRecs(term,1);
        } else {
            next_page = getPage();
            if (next_page !== 'None') {
                searchRecs(term,next_page);
            }
        }
        //searchRecs(term);    
    }
}
function addSearchResultsToList(search_results) {
    html_body = "";
    for (var i = 0; i < search_results.length; i++) {
        html_body += getCardHtml(search_results[i],i);
    }
    //$('.stream-items').append(html_body);
    html_start = "<div class=\"list-container\"><ol class=\"stream-items\">";
    html_end = "</ol></div>";
    $('#scroll').append(html_start+html_body+html_end);
}