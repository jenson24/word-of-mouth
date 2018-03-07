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
var fetched_messages = [];
var active_menu = 'global';
var markers = [];
var list_markers = [];
var infos = [];
var typeSelection = '';
var page_size = 25;
var marker_list = {};
var search_rec_results = [];
var profile_info = {};
var list_info = {};
var active_user_lists = {};
var term_matches = [];
var user_matches = [];
var list_matches = [];
var search_data = {};
var active_tab = 'terms';
var pos = {};
var around_me_data = {'list_matches': [], 'rec_matches': []};
var server_host = 'word-of-mouth-test.com/api';
var server_host = 'localhost:8080/api';
var host_type = 'http';

window.onload = function(){
    //var temp = document.cookie;
    //console.log(temp);
    user_id = getCookie('user_id');
    current_user = user_id;
    username = getCookie('username');
    if (user_id !== "") {
        page = 1;
        login_html = "<span>Logged in as </span><a href=\"#\" class=\"login-link\">"+username+"</a><span>. </span><a href=\"#\" class=\"login-link\" onClick=\"logout()\">Logout</a>"
        setRecommendations('global','new','new');
        $('a.icon-select.global').addClass('active')
        $('.login-info-bar').empty();
        $('.login-info-bar').append(login_html);
        $('#splashModal').modal('show');
    } else {
        $('#loginModal').modal('show');
        login_html = "<a href=\"#\" class=\"login-link\" onClick=\"showLoginModal()\">Login</a>"
        $('.login-info-bar').empty();
        $('.login-info-bar').append(login_html);
    };
};
function showLoginModal() {
    $('#loginModal').modal('show');
}
function login() {
    var uname = $("#login-uname").val();
    var pword = $("#login-pwd").val();
    var auth_object = {
        'uname': uname,
        'password': pword
    };
    $.ajax({
        url: host_type+"://"+server_host+"/auth",
        type: 'POST',
        data: JSON.stringify(auth_object),
        dataType: 'json',
        success: function(result) {
            $.notify("Logged In", {className: "success", position: "bottom center"});
            if(result['status'] === 'ok') {
                user_id = result['user_id'].toString();
                current_user = user_id;
                username = result['username'];
                document.cookie = "username="+username+"; path=/;";
                document.cookie = "user_id="+user_id+"; path=/;";
                console.log("Set cookie to: "+document.cookie);
                page = 1;
                login_html = "<span>Logged in as </span><a href=\"#\" class=\"login-link\">"+username+"</a><span>. </span><a href=\"#\" class=\"login-link\" onClick=\"logout()\">Logout</a>"
                setRecommendations('global','new','new');
                $('a.icon-select.global').addClass('active');
                $('.login-info-bar').empty();
                $('.login-info-bar').append(login_html);
                $('#splashModal').modal('show');
            } else {
                error_msg = result['status'];
                $('#loginModal').modal('show');
                alert(error_msg);
            };
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        }
    });
}
function loadDefaultProfile() {
    current_user = user_id;
    fetched_my_recommendations = [];
    setRecommendations('local','new','new');
}
function setRecommendations(rec_type, temp_obj, marker_flag) {
    recs = temp_obj;
    if (temp_obj === 'new') {
        //if (rec_type === 'global' && fetched_all_recommendations.length > 0) {
        //    recs = fetched_all_recommendations;
        //} else if (rec_type === 'local' && fetched_my_recommendations.length > 0) {
        //    recs = fetched_my_recommendations;
        //} else {
        page = 1;
        get_recommendations(rec_type, page);
        recs = recommendations["recommendations"];            
        jQuery('#scroll').animate({scrollTop:0},0);
        //}
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
    html_start = "<div class=\"stream-container\"><ol class=\"stream-items\">";
    getMarkerInfo(recs,marker_flag);
    html_body = "";
    if (recs.length > 0) {
        for (var i = 0; i < recs.length; i++) {
            html_body += getCardHtml(recs[i],i);
        }
    } else {
        if (rec_type === 'local') {
            html_body = "<div class=\"empty-action\">You haven't added any recommendations yet! Use the map (and the search bar above the map) to find places to recommend.</div>";
        } else {
            html_body = "<div class=\"empty-action\">Your network hasn't made any recommendations yet! Click on the Search icon above to find people to follow or use the map to the left (and the search bar above the map) to find places to recommend.</div>";
        }
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
            //lat = temp_obj[i]["r_geom"].slice(temp_obj[i]["r_geom"].indexOf("(")+1,temp_obj[i]["r_geom"].indexOf(" "));
            //long = temp_obj[i]["r_geom"].slice(temp_obj[i]["r_geom"].indexOf(" ")+1,temp_obj[i]["r_geom"].indexOf(")"));
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
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++) {
            bounds.extend(markers[i].getPosition());
        }
        map.fitBounds(bounds);        
    }
}

function addRecToPage(recObj) {
    if (active_menu === 'local') {
        rec_num = fetched_my_recommendations.length;            
    } else {
        rec_num = fetched_all_recommendations.length;    
    }
    card_html = getCardHtml(recObj,rec_num);
    $('.stream-items').prepend(card_html);
}

function getCardHtml(recObj,ind) {
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
    if (recObj["r_lists"] !== null && recObj["r_lists"].length > 0) {
        list_ids = recObj["r_lists"];
        list_names = recObj["r_list_names"];
        for (i = 0; i < list_ids.length; i++) {
            card_html += "<a href=\"#\" onclick=\"loadList("+list_ids[i].toString()+", '"+list_names[i]+"', "+recObj["user_id"]+")\">#"+list_names[i]+"</a>";
            if (i < list_ids.length - 1) {
                card_html += "<span>, </span>";
            }
        }
    }
    card_html += "</div>";
    if(recObj["r_date"].indexOf("Just") > -1) {
        date_text = recObj["r_date"];
    } else {
        date_text = recObj["r_date"].slice(0,recObj["r_date"].indexOf(" "));
    }
    card_html += "<span class=\"rec-date\" style=\"float:right\">"+date_text+"</span>";
    card_html += "</div>";
    card_html += "</div>";
    card_html += "<div class=\"stream-item-footer\">";
    card_html += "<button class=\"fa fa-angle-down\" data-toggle=\"collapse\" data-target=\"#stream-item-collapse-"+ind.toString()+"\"></button>";
    card_html += "<div id=\"stream-item-collapse-"+ind.toString()+"\" class=\"collapse\">";
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
    if (recObj["user_id"].toString() === user_id.toString()) {
        card_html += "<div class=\"rec-tools-container\">";
        card_html += "<button class=\"fa fa-wrench tool-container\" data-toggle=\"collapse\" data-target=\"#rec-tools-collapse-"+ind.toString()+"\"></button>";
        card_html += "<div id=\"rec-tools-collapse-"+ind.toString()+"\" class=\"collapse\">";
        card_html += "<div class=\"edit-rec-button\"><button title=\"Edit Recommendation\" class=\"fa fa-pencil-square-o rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"editRecommendationController('"+recObj["r_id"]+"')\"></button></div>";
        card_html += "<div class=\"delete-rec-button\"><button title=\"Delete Recommendation\" class=\"fa fa-trash-o rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"deleteRecommendationController('"+recObj["r_id"]+"')\"></button></div>";
        card_html += "<div class=\"list-button\"><button title=\"Add to List\" class=\"fa fa-list rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"addRecToUserList("+recObj["user_id"]+","+recObj["r_id"]+")\"></button></div>";
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

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
    for (var i = 0; i < list_markers.length; i++) {
        list_markers[i].setMap(map);
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
function deleteCookie( name ) {
    cookie_str = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
    document.cookie = cookie_str;
}
function logout() {
    user_id = '';
    username = '';
    deleteCookie('user_id');
    deleteCookie('username');
    console.log(document.cookie);
    location.reload();
}
function sendData() {
    var comment = document.getElementById("rec-comment").value;
    rec_object["comment"] = comment;
    rec_object["user_id"] = user_id;
    rec_object["username"] = username;
    $.ajax({
        url: host_type+"://"+server_host+"/createRec",
        type: 'POST',
        data: JSON.stringify(rec_object),
        dataType: 'text',
        success: function(rec_id) {
            $.notify("Successfully Added Recommendation", {className: "success", position: "bottom center"});
            temp_obj = {r_id: rec_id, user_id: user_id, username: username, r_comment: comment, r_name: rec_object["g_name"], r_date: "Just Added...", r_lists: []};
            addRecToPage(temp_obj);
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
        url: host_type+"://"+server_host+"/getRecs",
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
                    var already_pulled = false;
                    for (var j = 0; j < fetched_all_recommendations.length; j++) {
                        if (recommendations["recommendations"][i]["r_id"] === fetched_all_recommendations[j]["r_id"]) {
                            already_pulled = true;
                        }
                    }
                    if (already_pulled === false) {
                        fetched_all_recommendations.push(recommendations["recommendations"][i]);
                    }
                } else if (lookup_type === 'local') {
                    var already_pulled = false;
                    for (var j = 0; j < fetched_my_recommendations.length; j++) {
                        if (recommendations["recommendations"][i]["r_id"] === fetched_my_recommendations[j]["r_id"]) {
                            already_pulled = true;
                        }
                    }
                    if (already_pulled === false) {
                        fetched_my_recommendations.push(recommendations["recommendations"][i]);                                    
                    }
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
        url: host_type+"://"+server_host+"/getProfile",
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

function get_following(uid,page) {
    post_data = {
        uid: uid,
        active_user: user_id,
        page: page
    };
    return $.ajax({
        url: host_type+"://"+server_host+"/getFollowing",
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

function get_followers(uid,page) {
    post_data = {
        uid: uid,
        active_user: user_id,
        page: page
    };
    return $.ajax({
        url: host_type+"://"+server_host+"/getFollowers",
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
        if (Math.ceil(div[0].scrollHeight - div.scrollTop()) <= Math.ceil(div.height())) { // If scroll to bottom, load next page
            //console.log("Reached the bottom!");
            if (active_menu === 'searchRecs') {
                // Use load more button
                /*next_page = getPage();
                term = $('.search-input').val();
                if (term.length > 3) {
                    if (next_page !== 'None') {
                        searchRecs(term,next_page);
                    }
                }*/
            } else if (active_menu === 'messages') {
                next_page = getPage();
                // TODO: Figure out paging for messages
                //console.log(next_page);
                //getMessages(next_page);
            } else if (active_menu === 'aroundMe') {
                //next_page = getPage();
                // Handle in aroundMe page
                
            } else if (active_menu === 'global' || active_menu === 'local') {
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
    
    $('.join-input').on('keyup', function () {
        var empty = false;
        empty_count = 0;
        $('.join-input').each(function() {
            if ($(this).val() === '') {
                empty = true;
                empty_count += 1;
            }
        });
        if (empty) {
            $('#join-btn').attr('disabled', 'disabled');
        } else {
            $('#join-btn').removeAttr('disabled');
        }
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
        /*if (active_tab === 'terms') {
            rec_length = term_matches.length;
        } else if (active_tab === 'lists') {
            rec_length = list_matches.length;
        } else if (active_tab === 'users') {
            rec_length = user_matchces.length;
        }*/
    } else if (active_menu === 'messages') {
        rec_length = fetched_messages.length;
        // TODO:  Figure out paging for messages.  Right now just pulling 500 messages.
    } else if (active_menu === 'aroundMe') {
        
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
    getMarkerInfo({},'new');
    getListMarkerInfo({});
    active_menu = 'searchRecs';
    $('.filter-content').css('display','none');
    $('#scroll').empty();
    $('.content-header').empty();
    $('.content-header').css("height","26px");
    $('#scroll').css("height","calc( 100% - 92px - 26px)");
    html_search = "<input type=\"text\" autocomplete=\"off\" placeholder=\"Search Word of Mouth...\" id=\"search-input\" class=\"search-input\" onchange=searchController($(this).val())>";
    $('.content-header').append(html_search);
    tab_html = "<div class=\"tab\" id=\"search-tabs\">";
    tab_html += "<button class=\"tablinks\" id=\"button-tab-terms\" onclick=\"searchTabController(event,'search-results-terms')\">Recommendations</button>";
    tab_html += "<button class=\"tablinks\" id=\"button-tab-lists\" onclick=\"searchTabController(event,'search-results-lists')\">Lists</button>";
    tab_html += "<button class=\"tablinks\" id=\"button-tab-users\" onclick=\"searchTabController(event,'search-results-users')\">Users</button>";
    tab_html += "</div>";
    tab_html += "<div class=\"tabcontent-wrapper\">";
    tab_html += "<div id=\"search-results-terms\" class=\"tabcontent\"></div>";
    tab_html += "<div id=\"search-results-lists\" class=\"tabcontent\"></div>";
    tab_html += "<div id=\"search-results-users\" class=\"tabcontent\"></div>";
    tab_html += "</div>";
    $('#scroll').append(tab_html);
}
function searchRecs(term,page) {
    post_data = {
        uid: user_id,
        term: term,
        page: page,
        type: active_tab
    };
    $.ajax({
        url: host_type+"://"+server_host+"/search",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(search_results) {
            search_data = search_results;
            term_matches = search_results['term_matches'];
            user_matches = search_results['users'];
            list_matches = search_results['lists'];

            addSearchResultsToList();
            $.notify("Found search results", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}
function searchController(term) {
    if (term.length > 3) {
        $('.stream-items').empty();
        $("#button-tab-terms").text("Recommendations (0)");
        $("#button-tab-lists").text("Lists (0)");
        $("#button-tab-users").text("Users (0)");
        term_matches = [];
        list_matches = [];
        user_matches = [];
        if (active_tab === 'terms') {
            search_results = term_matches;
        } else if (active_tab === 'lists') {
            search_results = list_matches;
        } else if (active_tab === 'users') {
            search_results = user_matches;
        }
        if (search_results.length === 0) {
            searchRecs(term,1);
        } else {
            next_page = getPage();
            if (next_page !== 'None') {
                searchRecs(term,next_page);
            }
        }
    }
}
function addSearchResultsToList() {
    $("#button-tab-terms").removeClass("active");
    $("#button-tab-lists").removeClass("active");
    $("#button-tab-users").removeClass("active");
    html_start = "<div class=\"stream-container\" id=\"stream-container\"><ol class=\"stream-items\">";
    html_term_body = "";
    html_list_body = "";
    html_user_body = "";
    if (active_menu === 'aroundMe') {
        term_matches = around_me_data['rec_matches'];
        list_matches = around_me_data['list_matches'];
        user_matches = [];
        rec_count = around_me_data['rec_count'];
        list_count = around_me_data['list_count'];
        user_count = around_me_data['user_count'];
    } else {
        term = $('.search-input').val();
        rec_count = search_data['rec_count'];
        list_count = search_data['list_count'];
        user_count = search_data['user_count'];
    }
    if (term_matches.length > 0) {
        $('#search-results-terms').empty();
        for (var i = 0; i < term_matches.length; i++) {
            html_term_body += getCardHtml(term_matches[i],i);
        }
        $("#button-tab-terms").text("Recommendations ("+term_matches.length.toString()+")");
        if (term_matches.length < rec_count) {
            if (active_menu === 'aroundMe') {
                load_more_html = "<div class=\"load-more-around-me\"><button id=\"load-more-button\" onClick=\"searchAroundMe('geo-rec')\">Load More (Showing "+rec_matches.length.toString()+" of "+rec_count.toString()+")</button></div>";
            } else {
                next_page = (term_matches.length / page_size) + 1; 
                load_more_html = "<div class=\"load-more-around-me\"><button id=\"load-more-button\" onClick=\"searchRecs("+term+","+next_page.toString()+")\">Load More (Showing "+rec_matches.length.toString()+" of "+rec_count.toString()+")</button></div>";
            }
        } else {
            load_more_html = "";
        }
        html_end = "</ol>"+load_more_html+"</div>";
        $('#search-results-terms').append(html_start+html_term_body+html_end);
    }
    if (list_matches.length > 0) {
        $('#search-results-lists').empty();
        for (var i = 0; i < list_matches.length; i++) {
            html_list_body += getListHtml(list_matches[i],i,list_matches[i]['user_id']);
        }
        $("#button-tab-lists").text("Lists ("+list_matches.length.toString()+")");
        if (list_matches.length < list_count) {
            if (active_menu === 'aroundMe') {
                load_more_html = "<div class=\"load-more-around-me\"><button id=\"load-more-button\" onClick=\"searchAroundMe('geo-list')\">Load More (Showing "+list_matches.length.toString()+" of "+list_count.toString()+")</button></div>";
            } else {
                next_page = (list_matches.length / page_size) + 1; 
                load_more_html = "<div class=\"load-more-around-me\"><button id=\"load-more-button\" onClick=\"searchRecs("+term+","+next_page.toString()+")\">Load More (Showing "+list_matches.length.toString()+" of "+list_count.toString()+")</button></div>";
            }
        } else {
            load_more_html = "";
        }
        html_end = "</ol>"+load_more_html+"</div>";
        $('#search-results-lists').append(html_start+html_list_body+html_end);
    }
    if (user_matches.length > 0) {
        $('#search-results-users').empty();
        for (var i = 0; i < user_matches.length; i++) {
            html_user_body += getFollowHtml(user_matches[i],i);
        }
        load_more_html = '';
        $("#button-tab-users").text("Users ("+user_matches.length.toString()+")");
        if (user_matches.length < user_count) {
            if (active_menu === 'aroundMe') {
                load_more_html = "<div class=\"load-more-around-me\"><button id=\"load-more-button\" onClick=\"searchAroundMe('geo-list')\">Load More (Showing "+user_matches.length.toString()+" of "+user_count.toString()+")</button></div>";
            } else {
                next_page = (user_matches.length / page_size) + 1; 
                load_more_html = "<div class=\"load-more-around-me\"><button id=\"load-more-button\" onClick=\"searchRecs("+term+","+next_page.toString()+")\">Load More (Showing "+user_matches.length.toString()+" of "+user_count.toString()+")</button></div>";
            }
        } else {
            load_more_html = "";
        }
        html_end = "</ol>"+load_more_html+"</div>";
        $('#search-results-users').append(html_start+html_user_body+html_end);
    }
    if (term_matches.length > 0) {
        $("#button-tab-terms").addClass("active");
        document.getElementById('search-results-terms').style.display = "block";
    } else if (list_matches.length > 0) {
        $("#button-tab-lists").addClass("active");
        document.getElementById('search-results-lists').style.display = "block";
    } else if (user_matches.length > 0) {
        $("#button-tab-users").addClass("active");
        document.getElementById('search-results-users').style.display = "block";
    }
}
function showFollowing(uid) {
    temp_following = get_following(uid,1);
    following_info = temp_following["responseJSON"];
    var following = following_info["following"];
    html_start = "<div class=\"stream-container\"><ol class=\"follow-items\">";
    html_body = "";
    if (following.length > 0) {
        for (var i = 0; i < following.length; i++) {
            html_body += getFollowHtml(following[i],i);
        }        
    } else {
        html_body = "<div class=\"empty-action\">You aren't following anyone yet! Click the Search icon above to search for people to follow.</div>";
    }
    html_end = "<get/ol></div>";
    $('.rec-section-header').empty();
    $('.rec-section-header').append("<span>Following...</span>");
    $('.filter-bar').empty();
    $('.filter-content').css('display','none');
    $('#scroll').empty();
    $('.content-header').css("height","32px");
    $('#scroll').css("height","calc( 100% - 92px - 32px)");        
    $('#scroll').append(html_start+html_body+html_end);
}
function showFollowers(uid) {
    temp_followers = get_followers(uid,1);
    followers_info = temp_followers["responseJSON"];
    var followers = followers_info["followers"];
    html_start = "<div class=\"stream-container\"><ol class=\"follow-items\">";
    html_body = "";
    if (followers.length > 0) {
        for (var i = 0; i < followers.length; i++) {
            html_body += getFollowHtml(followers[i],i);
        }
    } else {
        html_body = "<div class=\"empty-action\">You don't have any followers yet!</div>";
    }
    html_end = "</ol></div>";
    $('.rec-section-header').empty();
    $('.rec-section-header').append("<span>Followers...</span>");
    $('.filter-bar').empty();
    $('.filter-content').css('display','none');
    $('#scroll').empty();
    $('.content-header').css("height","32px");
    $('#scroll').css("height","calc( 100% - 92px - 32px)");        
    $('#scroll').append(html_start+html_body+html_end);    
}
function getFollowHtml(follow,i) {
    card_html = "";
    card_html += "<li class=\"js-stream-item\"><div class=\"follow-container\">";
    card_html += "<div class=\"follow-header\">";
    card_html += "<span class=\"UserName\"><strong class=\"userName\">"+follow["first_name"]+" "+follow["last_name"]+"</strong></span>";
    card_html += "<a href=\"#\" onclick=\"changeUser("+follow["user_id"].toString()+")\">"+follow["username"]+"</a></div>";
    if(follow["user_id"].toString() !== user_id.toString()) {
        if(follow["following"]) {
            card_html += "<div class=\"follow-icon\"><button type=\"button\" class=\"button button-follow\" id=\"follow-item-"+i.toString()+"\" data-hover=\"Unfollow\" onClick=\"unfollow("+current_user.toString()+","+follow["user_id"].toString()+","+i.toString()+")\"><span>Following</span></button></div>";    
        } else {
            card_html += "<div class=\"follow-icon\"><button type=\"button\" class=\"button new-follow\" id=\"follow-item-"+i.toString()+"\" data-hover=\"Follow\" onClick=\"follow("+current_user.toString()+","+follow["user_id"].toString()+","+i.toString()+")\"><span>Follow</span></button></div>";    
        }
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
        url: host_type+"://"+server_host+"/updateFollowers",
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

function searchTabController(evt,tabName) {
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    
    if (tabName === 'search-results-terms') {
        active_tab = 'terms';
        getMarkerInfo(term_matches,'new');
        getListMarkerInfo({});
    }
    if (tabName === 'search-results-lists') {
        active_tab = 'lists';
        getMarkerInfo({},"new");
        getListMarkerInfo(list_matches);
    }
    if (tabName === 'search-results-users') {
        active_tab = 'users';
        getMarkerInfo({},'new');
        getListMarkerInfo({});
    }
}

function searchAroundMe(type) {
    if (type === 'geo') {
        page = 1;
    } else if (type === 'geo-rec') {
        page = (around_me_data['rec_matches'].length / page_size) + 1;
    } else if (type === 'geo-list') {
        page = (around_me_data['list_matches'].length / page_size) + 1;
    }
    dist = 25;
    post_data = {
        uid: user_id,
        term: 'null',
        page: page,
        type: type,
        dist: dist,
        lat: pos.lat,
        lon: pos.lng
    };
    $.ajax({
        url: host_type+"://"+server_host+"/search",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(search_results) {
            for (i=0; i<search_results['list_matches'].length; i++) {
                in_list = false;
                for (j=0; j<around_me_data['list_matches'].length; j++) {
                    if (around_me_data['list_matches'][j]['list_id'] === search_results['list_matches'][i]['list_id']) {
                        in_list = true;
                    }
                }
                if (!in_list) {
                    around_me_data['list_matches'].push(search_results['list_matches'][i]);
                }
            }
            for (i=0; i<search_results['rec_matches'].length; i++) {
                in_list = false;
                for (j=0; j<around_me_data['rec_matches'].length; j++) {
                    if (around_me_data['rec_matches'][j]['r_id'] === search_results['rec_matches'][i]['r_id']) {
                        in_list = true;
                    }
                }
                if (!in_list) {
                    around_me_data['rec_matches'].push(search_results['rec_matches'][i]);
                }
            }
            around_me_data['list_count'] = search_results['list_count'];
            around_me_data['rec_count'] = search_results['rec_count'];
            if (type !== 'geo') {
                $(".load-more-around-me").remove();
                addSearchResultsToList();
            }
            $.notify("Found search results", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}
function selectAroundMe() {
    searchAroundMe('geo');
    getListMarkerInfo(around_me_data['list_matches']);
    getMarkerInfo(around_me_data['rec_matches'],'new');
    active_menu = 'aroundMe';
    $('.filter-content').css('display','none');
    $('#scroll').empty();
    $('.content-header').empty();
    $('.content-header').css("height","26px");
    $('#scroll').css("height","calc( 100% - 92px - 34px)");
    html_head = "<div class=\"rec-section-header\"><span>Recommended around me...</span></div>";
    $('.content-header').append(html_head);
    tab_html = "<div class=\"tab\" id=\"search-tabs\">";
    tab_html += "<button class=\"tablinks\" id=\"button-tab-terms\" onclick=\"searchTabController(event,'search-results-terms')\">Recommendations (0)</button>";
    tab_html += "<button class=\"tablinks\" id=\"button-tab-lists\" onclick=\"searchTabController(event,'search-results-lists')\">Lists (0)</button>";
    tab_html += "</div>";
    tab_html += "<div class=\"tabcontent-wrapper\">";
    tab_html += "<div id=\"search-results-terms\" class=\"tabcontent\"></div>";
    tab_html += "<div id=\"search-results-lists\" class=\"tabcontent\"></div>";
    tab_html += "<div id=\"search-results-users\" class=\"tabcontent\"></div>";
    tab_html += "</div>";
    $('#scroll').append(tab_html);
    addSearchResultsToList();
}

function enableJoin() {
    $('#joinModal').modal('show');
}

function joinWom() {
    var first_name = $("#join-fname").val();
    var last_name = $("#join-lname").val();
    var email = $("#join-email").val();
    var uname = $("#join-uname").val();
    var pwd1 = $("#join-pwd1").val();
    var pwd2 = $("#join-pwd2").val();
    bad_chars = ['<','>','%','='];
    valid_fields = true;
    for (i=0; i < bad_chars.length; i++) {
        if (first_name.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad first name", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (last_name.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad last name", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (email.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad email", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (uname.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad username", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (pwd1.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad pwd1", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (pwd2.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad pwd2", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
    }
    if (pwd1 !== pwd2) {
        valid_fields = false;
        alert("Passwords do not match");
        $('#joinModal').modal('show');
    }
    if (valid_fields) {
        result = createUser(first_name, last_name, email, uname, pwd1);
    }
}
function cancelJoin() {
    $('#loginModal').modal('show');
}

function createUser(first_name, last_name, email, uname, pwd) {
    post_data = {
        fname: first_name,
        lname: last_name,
        email: email,
        uname: uname,
        password: pwd
    };
    //console.log(post_data);
    $.ajax({
        url: host_type+"://"+server_host+"/createUser",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function(create_result) {
            //console.log(create_result);
            if (create_result !== 'invalid') {
                $.notify("Created User", {className: "success", position: "bottom center"});
                user_id = parseInt(create_result);
                current_user = user_id;
                username = uname;
                loadDefaultProfile();
            } else {
                alert("Invalid username and password provided");
                $('#joinModal').modal('show');
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}