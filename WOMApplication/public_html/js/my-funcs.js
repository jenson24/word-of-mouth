/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var user_id = 0;
var current_user = 0;
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
var profile_info = {};
var list_info = {};
    
window.onload = function(){
    user_id = getCookie('user_id');
    current_user = user_id;
    username = getCookie('username');
    if (user_id !== "") {
        page = 1;
        setRecommendations('global','new','new');
        login_html = "<span>Logged in as </span><a href=\"http://localhost:8383/WOMApplication/login.html\" class=\"login-link\">"+username+"</a>"
        $('.login-info-bar').append(login_html);
        $('a.icon-select.global').addClass('active')
    } else {
        login_html = "<a href=\"http://localhost:8383/WOMApplication/login.html\" class=\"login-link\">Login</a>"
        $('.login-info-bar').append(login_html);
    };
};
function loadDefaultProfile() {
    current_user = user_id;
    fetched_my_recommendations = [];
    setRecommendations('local','new','new');
}
function setRecommendations(rec_type, temp_obj, marker_flag) {
    recs = temp_obj;
    if (temp_obj === 'new') {
        if (rec_type === 'global' && fetched_all_recommendations.length > 0) {
            recs = fetched_all_recommendations;
        } else if (rec_type === 'local' && fetched_my_recommendations.length > 0) {
            recs = fetched_my_recommendations;
        } else {
            page = 1;
            get_recommendations(rec_type, page);
            recs = recommendations["recommendations"];            
            jQuery('#scroll').animate({scrollTop:0},0);
        }
        clearFilters();
    }
    if (rec_type === 'global') {
        html_head = "<div class=\"rec-section-header\"><span>What people are recommending...</span></div><div class=\"filter-bar\"><a href=\"#\"><i class=\"fa fa-ban\" onClick=\"removeFilters()\"></i></a><a href=\"#\"><i class=\"fa fa-filter\" onClick=\"showFilters()\"></i></a></div>";
        $('.content-header').css("height","32px");
        $('#scroll').css("height","calc( 100% - 92px - 32px)");        
    } else if (rec_type === 'local') {
        html_head = "<div class=\"rec-section-header\"><span>My recommendations...</span></div><div class=\"filter-bar\"><a href=\"#\"><i class=\"fa fa-ban\" onClick=\"removeFilters()\"></i></a><a href=\"#\"><i class=\"fa fa-filter\" onClick=\"showFilters()\"></i></a></div>";
        $('.content-header').css("height","84px");        
        $('#scroll').css("height","calc( 100% - 92px - 32px - 52px)");            
    };
    html_start = "<div class=\"list-container\"><ol class=\"stream-items\">";
    getMarkerInfo(recs,marker_flag);
    html_body = "";
    for (var i = 0; i < recs.length; i++) {
        html_body += getCardHtml(recs[i],i);
    }
    
    html_end = "</ol></div>";
    $('#scroll').empty();
    $('#scroll').append(html_start+html_body+html_end);
    if (rec_type !== active_menu || temp_obj === 'new') {
        clearFilters();
        $('.filter-content').css('display','none');
        active_menu = rec_type;    
        $('.content-header').empty();
        if (rec_type === 'local') {
            profile_html = getProfileHTML(current_user);
            $('.content-header').append(profile_html);    
        }
        $('.content-header').append(html_head);
    }
}

function getProfileHTML(uid) {
    temp_profile_info = getProfile(uid);
    profile_info = temp_profile_info["responseJSON"];
    var followers_count = profile_info["followers"].toString();
    var following_count = profile_info["following"].toString();
    var first_name = profile_info["first_name"];
    var last_name = profile_info["last_name"];
    var rec_count = profile_info["recommendations"].toString();
    var list_count = profile_info["lists"].toString();
    profile_html = '';
    profile_html += "<div class=\"profile-header\">";
    profile_html += "<span class=\"full-name\">"+first_name+" "+last_name+"</span>";
    profile_html += "<span class=\"profile-follow-content\">Following: </span><a href=\"#\" onclick=\"showFollowing("+uid.toString()+")\">"+following_count+"</a>";
    profile_html += "<span class=\"profile-follow-content\">Followers: </span><a href=\"#\" onclick=\"showFollowers("+uid.toString()+")\">"+followers_count+"</a>";
    profile_html += "<span class=\"profile-follow-content\">Recommendations: </span><a href=\"#\" onclick=\"setRecommendations('local','new','new')\">"+rec_count.toString()+"</a>";
    profile_html += "<span class=\"profile-follow-content\">Lists: </span><a href=\"#\" onclick=\"showLists("+uid.toString()+")\">"+list_count.toString()+"</a></div>";
    return profile_html;
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
    card_html += "<a href=\"#\" onclick=\"changeUser("+recObj["user_id"].toString()+")\">"+recObj["username"]+"</a>";
    card_html += "<div class=\"stream-item-container\">";
    card_html += "<span class=\"rec-name\"><strong class=\"recName\">"+recObj["r_name"]+"</strong></span>";
    card_html += "<span class=\"rec-comment\">"+recObj["r_comment"]+"</span>";
    card_html += "<div class=\"rec-lists\">";
    if (recObj["r_lists"].length > 0) {
        list_ids = recObj["r_lists"];
        list_names = recObj["r_list_names"];
        for (i = 0; i < list_ids.length; i++) {
            card_html += "<a href=\"#\" onclick=\"loadRecList("+list_ids[i].toString()+")\">#"+list_names[i]+"</a>";
            if (i < list_ids.length - 1) {
                card_html += "<span>, </span>";
            }
        }
    }
    card_html += "</div>";
    card_html += "<span class=\"rec-date\" style=\"float:right\">"+recObj["r_date"].slice(0,recObj["r_date"].indexOf(" "))+"</span>";
    card_html += "</div>";
    card_html += "</div>";
    card_html += "<div class=\"stream-item-footer\">";
    card_html += "<button class=\"fa fa-angle-down\" data-toggle=\"collapse\" data-target=\"#stream-item-collapse-"+i.toString()+"\"></button>";
    card_html += "<div id=\"stream-item-collapse-"+i.toString()+"\" class=\"collapse\">";
    if (recObj["r_price"]) {
        price_string = "";
        for (i = 0; i < recObj["r_price"]; i++) {
            price_string += "$";
        }
        card_html += "<span class=\"rec-footer-content\">Price: "+price_string+"</span>";
    } 
    if (recObj["r_google_rating"]) {
        card_html += "<span class=\"rec-footer-content\">Google Rating: "+recObj["r_google_rating"]+"</span>";
    }
    if (recObj["r_google_type"] ) {
        card_html += "<span class=\"rec-footer-content\">Type: "+recObj["r_google_type"].replace(/_/g," ")+"</span>";
    }
    if ( recObj["r_website"] ) {
        card_html += "<span>Website: </span><a href=\""+recObj["r_website"]+"\" class=\"website-footer-content\">"+recObj["r_website"]+"</a>";
    }
    card_html += "</div>";
    card_html += "</div>";
    card_html += "</div>";
    if (recObj["user_id"] === user_id) {
        card_html += "<div class=\"rec-tools-container\">";
        card_html += "<button class=\"fa fa-wrench tool-container\" data-toggle=\"collapse\" data-target=\"#rec-tools-collapse-"+i.toString()+"\"></button>";
        card_html += "<div id=\"rec-tools-collapse-"+i.toString()+"\" class=\"collapse\">";
        card_html += "<div class=\"edit-rec-button\"><button title=\"Edit Recommendation\" class=\"fa fa-pencil-square-o rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"editRecommendationController('"+recObj["r_id"]+"', '"+recObj["r_comment"].replace(/'/g, "\\'")+"', '"+recObj["r_name"]+"', '"+recObj["r_type"]+"')\"></button></div>";
        card_html += "<div class=\"delete-rec-button\"><button title=\"Delete Recommendation\" class=\"fa fa-trash-o rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"deleteRecommendationController('"+recObj["r_id"]+"', '"+recObj["r_comment"].replace(/'/g, "\\'")+"', '"+recObj["r_name"]+"', '"+recObj["r_type"]+"')\"></button></div>";
        //if ( !recObj["r_lists"] ) {
        card_html += "<div class=\"list-button\"><button title=\"Add to List\" class=\"fa fa-list rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"addRecToUserList("+recObj["user_id"]+","+recObj["r_id"]+")\"></button></div>";
        //}
        card_html += "</div></div>";
    } else {
        card_html += "<div class=\"message-button\"><button title=\"Send Message\" class=\"fa fa-envelope rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"composeMessage("+user_id.toString()+","+recObj["user_id"]+",'"+recObj["username"]+"',"+recObj["r_id"]+")\"></button></div>";    
    }
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
            errorHandling(jqXHR, exception);
        }
    });
};

function get_recommendations(lookup_type, page) {
    post_data = {
        uid: current_user,
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
            errorHandling(jqXHR, exception);
        },
        async: false
    });
};

function getProfile(uid) {
    post_data = {
        uid: uid
    };
    return $.ajax({
        url: 'http://localhost:8080/getProfile',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(profile_data) {
            //console.log(profile_data);
            $.notify("Found profile", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
};

function get_following(user_id,page) {
    post_data = {
        uid: user_id,
        page: page
    };
    return $.ajax({
        url: 'http://localhost:8080/getFollowing',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(following_data) {
            //console.log(following_data);
            $.notify("Found following", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
};

function get_followers(user_id,page) {
    post_data = {
        uid: user_id,
        page: page
    };
    return $.ajax({
        url: 'http://localhost:8080/getFollowers',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(follower_data) {
            //console.log(follower_data);
            $.notify("Found following", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
};

function showFilters() {
    if ( $('.filter-content').css('display') === 'none' ) {
        //$('.fa-ban').css('visibility','visible');
        $('.filter-content').css('display','block');
        if (active_menu === 'local') {
            $('#scroll').css("height","calc( 100% - 92px - 32px - 52px - 24px )");            
        } else {
            $('#scroll').css("height","calc( 100% - 92px - 32px - 24px )");        
        }
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
        if (active_menu === 'local') {
            $('#scroll').css("height","calc( 100% - 92px - 32px - 52px)");            
        } else {
            $('#scroll').css("height","calc( 100% - 92px - 32px)");        
        }
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
        $('.fa-ban').css('visibility','visible');
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
        $('.fa-ban').css('visibility','visible');
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
        $('.fa-ban').css('visibility','visible');
    }
    setRecommendations(active_menu,type_filtered_objects,'new');
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
    $('.fa-ban').css('visibility','hidden');
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
    $('.filter-content').css('display','none');
    $('#scroll').empty();
    $('.content-header').empty();
    html_search = "<form autocomplete=\"on\"><input type=\"text\" placeholder=\"Search Word of Mouth...\" id=\"search-input\" class=\"search-input\" onchange=searchController($(this).val())></form>";
    $('.content-header').append(html_search);
}
function searchRecs(term,page) {
    post_data = {
        uid: user_id,
        term: term,
        page: page
    };
    $.ajax({
        url: 'http://localhost:8080/search',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(search_results) {
            //console.log(search_results);
            addSearchResultsToList(search_results);
            for (i=0;i<search_results.length;i++) {
                search_rec_results.push(search_results[i]);
            }
            $.notify("Found search results", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}
function searchController(term) {
    //console.log(term);
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
        getMarkerInfo(search_rec_results,'new');
    }
}
function addSearchResultsToList(search_results) {
    html_body = "";
    term_matches = search_results["term_matches"];
    for (var i = 0; i < term_matches.length; i++) {
        html_body += getCardHtml(term_matches[i],i);
    }
    user_matches = search_results["users"];
    for (var i = 0; i < user_matches.length; i++) {
        html_body += getFollowHtml(user_matches[i],i);
    }
    //$('.stream-items').append(html_body);
    html_start = "<div class=\"list-container\"><ol class=\"stream-items\">";
    html_end = "</ol></div>";
    $('#scroll').append(html_start+html_body+html_end);
}
function showFollowing(uid) {
    temp_following = get_following(uid,1);
    following_info = temp_following["responseJSON"];
    var following = following_info["following"];
    html_start = "<div class=\"list-container\"><ol class=\"follow-items\">";
    html_body = "";
    //console.log(following);
    for (var i = 0; i < following.length; i++) {
        following[i]["following"] = true;
        html_body += getFollowHtml(following[i],i);
    }
    html_end = "</ol></div>";
    $('.rec-section-header').empty();
    $('.rec-section-header').append("<span>Following...</span>");
    $('.filter-bar').empty();
    $('#scroll').empty();
    $('#scroll').append(html_start+html_body+html_end);
}
function showFollowers(uid) {
    temp_followers = get_followers(uid,1);
    followers_info = temp_followers["responseJSON"];
    var followers = followers_info["followers"];
    html_start = "<div class=\"list-container\"><ol class=\"follow-items\">";
    html_body = "";
    for (var i = 0; i < followers.length; i++) {
        html_body += getFollowHtml(followers[i],i);
    }
    html_end = "</ol></div>";
    $('.rec-section-header').empty();
    $('.rec-section-header').append("<span>Followers...</span>");
    $('.filter-bar').empty();
    $('#scroll').empty();
    $('#scroll').append(html_start+html_body+html_end);    
}
function showLists(uid) {
    temp_lists = get_lists(uid);
    list_data = temp_lists["responseJSON"];
    var lists = list_data["lists"];
    html_start = "<div class=\"list-container\"><ol class=\"list-items\">";
    html_body = "";
    for (var i = 0; i < lists.length; i++) {
        html_body += getListHtml(lists[i],i);
    }
    html_end = "</ol></div>";
    $('.rec-section-header').empty();
    $('.rec-section-header').append("<span>Recommendation Lists...</span>");
    $('.filter-bar').empty();
    $('#scroll').empty();
    $('#scroll').append(html_start+html_body+html_end);    
}
function get_lists(user_id) {
    post_data = {
        uid: user_id
    };
    return $.ajax({
        url: 'http://localhost:8080/getLists',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(list_data) {
            //console.log(list_data);
            $.notify("Found lists", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
};
function getListHtml(list,i) {
    card_html = "";
    card_html += "<li class=\"js-stream-item\" id=\"list-item-"+i.toString()+"\"><div class=\"list-container\">";
    card_html += "<div class=\"list-header\">";
    card_html += "<a href=\"#\" onclick=\"loadList("+list["list_id"].toString()+","+i.toString()+")\">"+list["list_name"]+"</a></div>";
    card_html += "<span class=\"ListDesc\">"+list["list_description"]+"</span>";
    card_html += "</div></li>";
    return card_html;
}
function loadList(list_id,i) {
    recs = get_recs_for_list(list_id);
    getMarkerInfo(recs,"new");
    html_body = "";
    for (var i = 0; i < recs.length; i++) {
        html_body += getCardHtml(recs[i],i);
    }
    
    $('#list-item-'+i.toString()).after(html_body);
}
function get_recs_for_list(list_id) {
    post_data = {
        list_id: list_id
    };
    return $.ajax({
        url: 'http://localhost:8080/getListRecs',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(list_recs) {
            //console.log(list_recs);
            $.notify("Found list recommendations", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}
function getFollowHtml(follow,i) {
    card_html = "";
    card_html += "<li class=\"js-stream-item\"><div class=\"follow-container\">";
    card_html += "<div class=\"follow-header\">";
    card_html += "<span class=\"UserName\"><strong class=\"userName\">"+follow["first_name"]+" "+follow["last_name"]+"</strong></span>";
    card_html += "<a href=\"#\" onclick=\"changeUser("+follow["user_id"].toString()+")\">"+follow["username"]+"</a></div>";
    if(follow["following"]) {
        card_html += "<div class=\"follow-icon\"><button type=\"button\" class=\"button button-follow\" id=\"follow-item-"+i.toString()+"\" data-hover=\"Unfollow\" onClick=\"unfollow("+current_user.toString()+","+follow["user_id"].toString()+","+i.toString()+")\"><span>Following</span></button></div>";    
    } else {
        card_html += "<div class=\"follow-icon\"><button type=\"button\" class=\"button new-follow\" id=\"follow-item-"+i.toString()+"\" data-hover=\"Follow\" onClick=\"follow("+current_user.toString()+","+follow["user_id"].toString()+","+i.toString()+")\"><span>Follow</span></button></div>";    
    }
    card_html += "</div></li>";
    return card_html;
}
function changeUser(uid) {
    current_user = uid;
    fetched_my_recommendations = [];
    $('.content-header').empty();
    profile_html = getProfileHTML(current_user);
    $('.content-header').append(profile_html);
    setRecommendations('local','new','new');
}
function unfollow(from_user,to_user,i) {
    //console.log("Unfollow from user "+from_user.toString()+" to user "+to_user.toString());
    $('#follow-item-'+i+' span').text("Follow");
    $('#follow-item-'+i).attr('onClick', "follow("+from_user.toString()+","+to_user.toString()+","+i.toString()+")");
    $('#follow-item-'+i).toggleClass('button-follow new-follow');
    manageFollowers(from_user,to_user,'unfollow');
}
function follow(from_user,to_user,i) {
    //console.log("Follow from user "+from_user.toString()+" to user "+to_user.toString());
    $('#follow-item-'+i+' span').text("Following");
    $('#follow-item-'+i).attr('data-hover', 'Unfollow');
    $('#follow-item-'+i).attr('onClick', "unfollow("+from_user.toString()+","+to_user.toString()+","+i.toString()+")");
    $('#follow-item-'+i).toggleClass('new-follow button-follow');
    manageFollowers(from_user,to_user,'follow');
}
function manageFollowers(from_user,to_user,follow_type) {
    post_data = {
        from_user: from_user,
        to_user: to_user,
        follow_type: follow_type
    };
    $.ajax({
        url: 'http://localhost:8080/updateFollowers',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function(result) {
            //console.log(result);
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}

function errorHandling(jqXHR, exception) {
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
function composeMessage(from_user,to_user,to_username,r_id) {
    //console.log("From "+from_user+" to "+to_user);
    $('.temp-modal-title').empty();
    $("<h3 class=\"modal-title fa fa-envelope\" id=\"modal-title\"></h3>").appendTo(".temp-modal-title");
    $('.modal-title').append("   ");
    $('.modal-title').append("Send Message");
    $('#modal-body').empty();
    $('#modal-body').append("Replying to "+to_username);
    $('#modal-body').append("<textarea rows=\"4\" id=\"message-comment\" placeholder=\"Compose your message\">");
    $('.modal-footer').empty();
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>")
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-send\" data-dismiss=\"modal\" onClick=\"sendMessage("+from_user+","+to_user+","+r_id+")\">Send</button>")
}
function sendMessage(from_user,to_user,r_id) {
    var comment = document.getElementById("message-comment").value;
    storeMessage(from_user,to_user,comment,r_id);
}
function storeMessage(from_user,to_user,comment,r_id) {
    post_data = {
        from_user: from_user,
        to_user: to_user,
        comment: comment,
        r_id: r_id
    };
    $.ajax({
        url: 'http://localhost:8080/storeMessage',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function() {
            $.notify("Sent Message", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}
function getMessages() {
    post_data = {
        to_user: user_id,
        page: 1
    };
    $.ajax({
        url: 'http://localhost:8080/getMessagesByUser',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(messages) {
            //console.log(messages);
            
            $.notify("Found Messages", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}
function addRecToUserList(uid,r_id) {
    temp_lists = get_lists(uid);
    list_data = temp_lists["responseJSON"];
    var lists = list_data["lists"];

    $('.temp-modal-title').empty();
    $("<h3 class=\"modal-title fa fa-list\" id=\"modal-title\"></h3>").appendTo(".temp-modal-title");
    $('.modal-title').append("   ");
    $('.modal-title').append("Add Recommendation to List");
    $('#modal-body').empty();
    
    if (lists.length > 0) {
        $('#modal-body').append("<div>Select a list for the recommendation to be added to...</div>");
        $('#modal-body').append("<input id=\"user-list-select\" class=\"list-select list-inputs\" type=\"text\" list=\"userLists\" placeholder=\"Select from your created lists...\">");
        $('#modal-body').append("<datalist id=\"userLists\"></datalist>");
        for (var i = 0; i < lists.length; i++) {
            var listElement = document.getElementById('userLists');
            var option = document.createElement('option');
            option.value = lists[i]['list_name'];
            listElement.appendChild(option);
        }
        $('#user-list-select').on('change', function () {
            document.getElementById('addRecToListBtn').disabled=false;
        });

        $('.modal-footer').empty();
        $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
        $('.modal-footer').append("<button type=\"button\" class=\"btn btn-save\" id=\"addRecToListBtn\" data-dismiss=\"modal\" disabled=\"true\" onclick=\"addRecToListController("+r_id+")\">Save</button>");
    } else {
        $('#modal-body').append("You haven't created any lists yet. Would you like to create one?");
        $('.modal-footer').empty();
        $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
        $('.modal-footer').append("<button type=\"button\" class=\"btn btn-create\" data-dismiss=\"modal\" data-target=\"#myModal\" onClick=\"openNewListModal("+r_id+")\">Create New List</button>");
    }
}
function addRecToListController(r_id) {
    temp_lists = get_lists(user_id);
    list_data = temp_lists["responseJSON"];
    var lists = list_data["lists"];

    var list_name = document.getElementById('user-list-select').value;
    for (var i = 0; i < lists.length; i++) {
        if (lists[i]['list_name'] === list_name) {
            list_id = lists[i]['list_id'];
        }
    }
    editRecommendation(r_id,[list_id,list_name],'list');    
}

function openNewListModal(r_id) {
    $('.temp-modal-title').empty();
    $("<h3 class=\"modal-title fa fa-list\" id=\"modal-title\"></h3>").appendTo(".temp-modal-title");
    $('.modal-title').append("   ");
    $('.modal-title').append("Create New List");
    $('#modal-body').empty();
    $('#modal-body').append("<div>Provide a Name for the New List</div>");
    $('#modal-body').append("<div><input type=\"text\" placeholder=\"New List...\" id=\"list-name\" class=\"list-inputs\"></div>");
    $('#modal-body').append("<div>Provide a Description for the New List</div>");
    $('#modal-body').append("<textarea rows=\"3\" placeholder=\"Description...\" id=\"list-description\" class=\"list-inputs\">");
    $('#modal-body').append("<div>Input a Location Associated with this List</div>");
    $('#modal-body').append("<input id=\"list-geo\" class=\"list-geo list-inputs\" type=\"text\" list=\"predictionList\" placeholder=\"Enter a Location (City, State or ZIP)\">");
    $('#modal-body').append("<datalist id=\"predictionList\"></datalist>");

    $('#list-geo').on('keyup', function() {
        if (this.value.length > 1) {
            $('#predictionList').find('option').remove();
            var displaySuggestions = function(predictions, status) {
                if (status != google.maps.places.PlacesServiceStatus.OK) {
                    alert(status);
                    return;
                }

                predictions.forEach(function(prediction) {
                    var listInput = document.getElementById('predictionList');
                    var option = document.createElement('option');
                    option.value = prediction.description;
                    listInput.appendChild(option);
                });
            };

            var service = new google.maps.places.AutocompleteService();
            service.getPlacePredictions({input:this.value}, displaySuggestions);
            this.focus();
        }
    });
    var vals;
    $('#list-geo').on('change', function () {
        verifyListConditions('geo');
    });
    $('#list-name').on('keyup', function() {
        verifyListConditions('name');
    });
    $('#list-description').on('keyup', function() {
        verifyListConditions('desc');
    });
    $('.modal-footer').empty();
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-save\" id=\"save-list\" data-dismiss=\"modal\" disabled=\"true\">Save</button>");    

    document.getElementById("save-list").addEventListener("click", function() {
        verifyListConditions('all');
        if (list_info['status'] === 'OK') {
            //console.log(list_info);
            createNewList(list_info['list_name'],list_info['list_description'],list_info['list_location'],list_info['lat'],list_info['lon'],list_info['place_id'],r_id);
        }
    });

}
function verifyListConditions(input) {
    var list_name = document.getElementById('list-name').value;
    var list_description = document.getElementById('list-description').value;
    var list_location = document.getElementById('list-geo').value;
    list_info['list_name'] = list_name;
    list_info['list_description'] = list_description;
    list_info['list_location'] = list_location;
    if ((list_name.length > 0 && list_description.length > 0 && list_location.length > 0) || (list_name.length > 0 && list_description.length > 0 && input === 'geo')) {
        geocoder = new google.maps.Geocoder();
        geocoder.geocode( { 'address': list_location}, function(results, status) {
            if (status === 'OK') {
                list_info['lat'] = results[0].geometry.location.lat();
                list_info['lon'] = results[0].geometry.location.lng();
                list_info['place_id'] = results[0].place_id;
                list_info['status'] = status;
                document.getElementById('save-list').disabled=false;
            } else {
                list_info['status'] = 'check';
            }
        });
    } else {
        document.getElementById('save-list').disabled=true;
        list_info['status'] = 'check';
    }
}
function createNewList(list_name,list_description,list_location,lat,lon,place_id,r_id) {
    post_data = {
        list_name: list_name,
        list_description: list_description,
        list_location: list_location,
        lat: lat,
        lon: lon,
        google_place_id: place_id,
        user_id: user_id
    };
    $.ajax({
        url: 'http://localhost:8080/createList',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(list_id) {
            //console.log("New list ID is "+list_id);
            $.notify("Created List", {className: "success", position: "bottom center"});
            if (r_id) {
                editRecommendation(r_id, [list_id,list_name], 'list')
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}
