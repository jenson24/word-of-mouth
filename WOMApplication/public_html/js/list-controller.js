/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function showLists(uid) {
    current_user = uid;
    if (current_user.toString() !== user_id.toString()) {
        temp_lists = get_lists(uid);
        list_data = temp_lists["responseJSON"];
        current_user_lists = list_data["lists"];
    } else {
        current_user_lists = user_lists;
    }
    getMarkerInfo({},"new");
    getListMarkerInfo(current_user_lists);
    $('.rec-section-header').empty();
    if (current_user_lists.length > 0) {
        $('.rec-section-header').append("<span>Recommendation Lists...</span>");    
    } else {
        if (uid.toString() === user_id.toString()) {
            $('.rec-section-header').append("<span>You do not have any saved lists</span>");    
        } else {
            $('.rec-section-header').append("<span>This user does not have any saved lists</span>");    
        }
    }
    if (uid.toString() === user_id.toString()) {
        create_list_html = "<div class=\"create-list\"><button class=\"create-list-button\"  data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"openNewListModal('None')\"><i class=\"fa fa-plus\"></i> Create New List</div>";
        $('.rec-section-header').append(create_list_html);
    }
    $('.content-header').css("height","116px");
    $('#scroll').css("height","calc( 100% - 92px - 32px - 84px)");            
    $('.filter-bar').empty();
    $('.filter-content').css('display','none');
    html_start = "<div class=\"list-container\"><ol class=\"list-items\">";
    html_body = "";
    for (var i = 0; i < current_user_lists.length; i++) {
        html_body += getListHtml(current_user_lists[i],i,uid);
    }
    html_end = "</ol></div>";
    $('#scroll').empty();
    $('#scroll').append(html_start+html_body+html_end);    
}

function getListMarkerInfo(lists) {
    marker_list = {};
    for (var i = 0; i < lists.length; i++) {
        if (lists[i]["list_lat"]) {
            marker_list[lists[i]["list_id"]] = {};
            lat = lists[i]["list_lat"];
            lon = lists[i]["list_lon"];
            marker_list[lists[i]["list_id"]]["lat"] = lat;
            marker_list[lists[i]["list_id"]]["long"] = lon;
            marker_list[lists[i]["list_id"]]["name"] = lists[i]["list_name"];
            marker_list[lists[i]["list_id"]]["description"] = [lists[i]["list_description"]];
            marker_list[lists[i]["list_id"]]["location"] = [lists[i]["list_location"]];
            marker_list[lists[i]["list_id"]]["rec_count"] = lists[i]["rec_count"];
        }
    }
    if (Object.keys(marker_list).length > 0) {
        addListMarkers(marker_list);    
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < list_markers.length; i++) {
            bounds.extend(list_markers[i].getPosition());
        }
        map.fitBounds(bounds);        
        if (map.getZoom() > 11) {
            map.setZoom(11);
        }
    }
}

function addListMarkers(marker_list) {
    for (var id in marker_list) {
        var myLatLng = {lat: parseFloat(marker_list[id]["lat"]), lng: parseFloat(marker_list[id]["long"])};
        marker_icon = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            title: marker_list[id]["name"],
            icon: marker_icon
        });
        list_markers.push(marker);
        var infowindow = new google.maps.InfoWindow({
            maxWidth: 250
        });
        marker_content = getListMarkerContent(marker_list[id]);
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

function getListMarkerContent(obj) {
    marker_html = "";
    marker_html += "<div class=\"marker-item-context\">";
    marker_html += "<div class=\"marker-item-header\">";
    marker_html += "<span class=\"loc-info\"><strong>"+obj["name"]+"</strong></span>";
    marker_html += "</div>";
    marker_html += "<div class=\"marker-item-container\">";
    marker_html += "<span class=\"marker-comment\">"+obj["description"]+"</span>";
    marker_html += "<span class=\"marker-comment\">Total Recommendations: "+obj["rec_count"].toString()+"</span>";
    marker_html += "</div>";
    marker_html += "</div>";
    return marker_html;
}

function get_lists(user_id) {
    post_data = {
        uid: user_id
    };
    return $.ajax({
        url: host_type+"://"+server_host+"/getLists",
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

function getListHtml(list,i,uid) {
    card_html = "";
    card_html += "<li class=\"js-stream-item\" id=\"list-item-"+i.toString()+"\"><div class=\"list-item\">";
    card_html += "<div class=\"list-header\">";
    card_html += "<a href=\"#\" id=\"list-name-"+i.toString()+"\" onClick=\"loadList("+list["list_id"].toString()+", '"+list["list_name"]+"', "+list["user_id"]+")\">"+list["list_name"]+"</a>";
    if ((active_menu === 'searchRecs' || active_menu === 'aroundMe') && uid.toString() !== list["user_id"].toString()) {
        card_html += "<span> (</span><a href=\"#\" onClick=\"changeUser("+uid.toString()+")\">"+list["username"]+"</a><span>)</span>";
    }
    card_html +="</div>";
    card_html += "<span id=\"list-desc-"+i.toString()+"\" class=\"listDesc\">"+list["list_description"]+"</span>";
    card_html += "<div><strong>Total Recommendations: "+list["rec_count"].toString()+"</strong></div>";
    card_html += "</div>";

    // Only have the edit and delete tools if you're looking at your own lists
    if (uid.toString() === user_id.toString() && list["list_name"] !== save_list_name) {
        card_html += "<div class=\"rec-tools-container\">";
        card_html += "<button class=\"fa fa-wrench tool-container\" data-toggle=\"collapse\" data-target=\"#list-tools-collapse-"+i.toString()+"\"></button>";
        card_html += "<div id=\"list-tools-collapse-"+i.toString()+"\" class=\"collapse\">";
        card_html += "<div class=\"edit-list-button\"><button title=\"Edit List Details\" class=\"fa fa-pencil-square-o rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"editListController('"+list["list_id"]+"')\"></button></div>";
        card_html += "<div class=\"delete-list-button\"><button title=\"Delete List\" class=\"fa fa-trash-o rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"deleteListController('"+list["list_id"]+"')\"></button></div>";
        card_html += "</div></div>";
    }
    card_html += "</li>";
    return card_html;
}

function get_recs_for_list(list_id,list_name,user_id) {
    post_data = {
        list_id: list_id,
        user_id: user_id
    };
    return $.ajax({
        url: host_type+"://"+server_host+"/getListRecs",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(list_rec_obj) {
            var list_recs = list_rec_obj["recommendations"];
            recommendations["user_list"] = list_recs;
            getMarkerInfo(list_recs,"new");
            html_start = "<div class=\"list-container\">";
            if (list_recs.length > 0) {
                html_body = "<ol class=\"follow-items\">";
                for (var i = 0; i < list_recs.length; i++) {
                    html_body += getCardHtml(list_recs[i],i);
                }
                html_end = "</ol></div>";
            } else {
                html_body = "<div class=\"empty-action\">This list doesn't have any recommendations added to it yet.</div>";
                html_end = "</div>";
            }
            $('.rec-section-header').empty();
            $('.rec-section-header').append("<span>Recommendations for "+list_name+"...</span>");
            $('.filter-bar').empty();
            $('#scroll').empty();
            $('#scroll').append(html_start+html_body+html_end);
            $.notify("Found list recommendations", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}

function updateTryList(r_id,type) {
    for (var i = 0; i < user_lists.length; i++) {
        if (user_lists[i]["list_name"] === save_list_name) {
            list_id = user_lists[i]["list_id"];
        }
    }
    if (type === 'add') {
        post_data = {
            r_id: r_id,
            list_id: list_id
        }
        $.ajax({
            url: host_type+"://"+server_host+"/editRec",
            type: 'POST',
            data: JSON.stringify(post_data),
            dataType: 'text',
            success: function() {
                $.notify("Successfully Added Recommendation", {className: "success", position: "bottom center"});
                var tabs = Object.keys(recommendations);
                for (var m in tabs) {
                    for (var i = 0; i < recommendations[tabs[m]].length; i++) {
                        if (recommendations[tabs[m]][i]['r_id'].toString() === r_id.toString()) {
                            recommendations[tabs[m]][i]['r_lists'].push(list_id);
                            recommendations[tabs[m]][i]['r_list_names'].push(save_list_name);
                            if (tabs[m] === active_menu) {
                                var element = document.getElementById("add-to-try-list-"+i.toString());
                                element.innerHTML = "";
                                element.innerHTML = "<button title=\"Remove from my Lists\" class=\"fa fa-star added-to-try-list\" onClick=\"updateTryList("+r_id.toString()+",'remove')\"></button>";
                            }
                        }
                    }
                }
                for (var i = 0; i < user_lists.length; i++) {
                    if (user_lists[i]["list_id"] === list_id) {
                        user_lists[i]["rec_count"] += 1;
                    }
                }
            },
            error: function(jqXHR, exception) {
                errorHandling(jqXHR, exception);
            }
        });
    } else {
        post_data = {
            r_id: r_id,
            list_id: list_id,
            type: 'remove'
        };
        $.ajax({
            url: host_type+"://"+server_host+"/editList",
            type: 'POST',
            data: JSON.stringify(post_data),
            dataType: 'text',
            success: function(ex_out) {
                $.notify("Edited List", {className: "success", position: "bottom center"});
                var tabs = Object.keys(recommendations);
                for (var m in tabs) {
                    for (var i = 0; i < recommendations[tabs[m]].length; i++) {
                        if (recommendations[tabs[m]][i]['r_id'].toString() === r_id.toString()) {
                            var index = recommendations[tabs[m]][i]['r_lists'].indexOf(list_id);
                            if (index > -1) {
                                recommendations[tabs[m]][i]['r_lists'].splice(index,1);
                                recommendations[tabs[m]][i]['r_list_names'].splice(index,1);                            
                            }
                            if (tabs[m] === active_menu) {
                                var element = document.getElementById("add-to-try-list-"+i.toString());
                                element.innerHTML = "";
                                element.innerHTML = "<button title=\"Save to my Lists\" class=\"fa fa-star rec-tool-icons\" onClick=\"updateTryList("+r_id.toString()+",'add')\"></button>";
                            }
                        }
                    }
                }
                for (var i = 0; i < user_lists.length; i++) {
                    if (user_lists[i]["list_id"] === list_id) {
                        user_lists[i]["rec_count"] -= 1;
                    }
                }
            },
            error: function(jqXHR, exception) {
                errorHandling(jqXHR, exception);
            },
            async: false
        });
        
    }
}
function addRecToUserList(r_id) {
    temp_lists = get_lists(user_id);
    list_data = temp_lists["responseJSON"];
    var lists = list_data["lists"];

    $('#modal-title').empty();
    $("<h3 class=\"modal-title-header fa fa-list\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
    $('#modal-title-header').append("   ");
    $('#modal-title-header').append("Add Recommendation to List");
    $('#modal-body').empty();
    var temp_obj;
    
    if (lists.length > 0) {
        for (var i = 0; i < recommendations[active_menu].length; i++) {
            if (recommendations[active_menu][i]["r_id"].toString() === r_id.toString()) {
                temp_obj = recommendations[active_menu][i];
                if (recommendations[active_menu][i]["r_lists"] && recommendations[active_menu][i]["r_lists"].length > 0) {
                    $('#modal-body').append("<div>This recommendation is already included in the following lists:</div>");
                    for (var j = 0; j < recommendations[active_menu][i]["r_lists"].length; j++) {
                        $('#modal-body').append("<span>   "+recommendations[active_menu][i]["r_list_names"][j]+"    </span>");
                        $('#modal-body').append("<button onclick=\"removeRecFromListController("+r_id+",'"+recommendations[active_menu][i]["r_name"].replace(/'/g, "\\'")+"','"+recommendations[active_menu][i]["r_list_names"][j]+"',"+recommendations[active_menu][i]["r_lists"][j]+")\" title=\"Remove from List\" class=\"fa fa-minus-circle remove-rec\" data-dismiss=\"modal\"></button><p></p>");
                    }
                }
            }
        }
        if (temp_obj && (!temp_obj["r_list_names"] || lists.length > temp_obj["r_list_names"].length)) {
            $('#modal-body').append("<div>Select a list for the recommendation to be added to...</div>");
            var dropdown = "<select id=\"user-list-select\" class=\"list-select list-inputs\">";
            for (var i = 0; i < lists.length; i++) {
                if (!temp_obj["r_list_names"] || temp_obj["r_list_names"].indexOf(lists[i]["list_name"]) === -1) {
                    dropdown += "<option value=\""+lists[i]["list_name"]+"\">"+lists[i]["list_name"]+"</option>";
                }
            }
            dropdown += "</select>";
            $('#modal-body').append(dropdown);
        } 
        $('.modal-footer').empty();
        $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
        $('.modal-footer').append("<button type=\"button\" class=\"btn btn-save\" id=\"addRecToListBtn\" data-dismiss=\"modal\" onclick=\"addRecToListController("+r_id+")\">Save</button>");
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
    $('#modal-title').empty();
    $("<h3 class=\"modal-title-header fa fa-list\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
    $('#modal-title-header').append("   ");
    $('#modal-title-header').append("Create New List");
    $('#modal-body').empty();
    $('#modal-body').append("<div>Provide a Name for the New List</div>");
    $('#modal-body').append("<div><input type=\"text\" placeholder=\"New List...\" id=\"list-name\" class=\"list-inputs\"></div>");
    $('#modal-body').append("<div>Provide a Description for the New List</div>");
    $('#modal-body').append("<textarea rows=\"3\" maxlength=\"360\" placeholder=\"Description...\" id=\"list-description\" class=\"list-inputs\">");
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
            if (list_info['lat']) {
                createNewList(list_info['list_name'],list_info['list_description'],list_info['list_location'],list_info['lat'],list_info['lon'],list_info['place_id'],r_id);
            } else {
                createNewList(list_info['list_name'],list_info['list_description'],null,null,null,null,r_id);                
            }
        } else {
            alert("List details incomplete...");
        }
    });

}

function verifyListConditions(input) {
    var list_name = document.getElementById('list-name').value;
    var list_description = document.getElementById('list-description').value;
    var list_location = document.getElementById('list-geo').value;
    if (list_name.length > 0 && list_description.length > 0 && list_name !== save_list_name) {
        document.getElementById('save-list').disabled=false;
        list_info['list_name'] = list_name;
        list_info['list_description'] = list_description;
        list_info['status'] = 'OK';
    } else {
        document.getElementById('save-list').disabled=true;
        list_info['status'] = 'check';
    }
    if (input === 'geo') {
        geocoder = new google.maps.Geocoder();
        geocoder.geocode( { 'address': list_location}, function(results, status) {
            if (status === 'OK') {
                list_info['list_location'] = list_location;
                list_info['lat'] = results[0].geometry.location.lat();
                list_info['lon'] = results[0].geometry.location.lng();
                list_info['place_id'] = results[0].place_id;
                list_info['status'] = status;
                document.getElementById('save-list').disabled=false;
            } else {
                list_info['status'] = 'check';
                list_info['list_location'] = null;
                list_info['lat'] = null;
                list_info['lon'] = null;
                list_info['place_id'] = null;
                document.getElementById('save-list').disabled=true;
            }
        });
    } 
}

function createNewList(list_name,list_description,list_location,lat,lon,place_id,r_id) {
    post_data = {
        list_name: list_name,
        list_description: list_description,
        user_id: user_id
    };
    if (lat !== null) {
        post_data['list_location'] = list_location;
        post_data['lat'] = lat;
        post_data['lon'] = lon;
        post_data['google_place_id'] = place_id;
    };
    $.ajax({
        url: host_type+"://"+server_host+"/createList",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(list_id) {
            //console.log("New list ID is "+list_id);
            $.notify("Created List", {className: "success", position: "bottom center"});
            if (r_id !== 'None') {
                editRecommendation(r_id, [list_id,list_name], 'list')
            } else {
                user_lists.push(post_data);
                user_list_ids.push(list_id);
                post_data['list_id'] = list_id;
                post_data['rec_count'] = 0;
                addListToPage(post_data);
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}

function loadList(list_id,list_name,uid) {
    active_menu = 'user_list';
    profile_html = getProfileHTML(uid);
    current_user = uid;
    $('.content-header').empty();
    $('.content-header').append(profile_html);
    $('.content-header').append("<div class=\"rec-section-header\"><span>List recommendations...</span></div>");
    $('.content-header').css("height","84px");        
    $('#scroll').css("height","calc( 100% - 92px - 32px - 52px)");            
    get_recs_for_list(list_id,list_name,uid);
}

function addListToPage(list) {
    var lists = user_lists;
    new_list_html = getListHtml(list,lists.length-1,user_id);
    $('.list-items').prepend(card_html);
    getMarkerInfo({},"new");
    getListMarkerInfo(lists);
    updateProfileCounts('list',1);
}

function editListController(list_id) {
    if (active_menu === 'local') {
        if (current_user.toString() === user_id.toString()) {
            temp_lists = user_lists;
        } else {
            temp_lists = current_user_lists;
        }
    } else if (active_menu === 'around_me') {
        temp_lists = around_me_data['list_matches'];
    } else if (active_menu === 'searchRecs') {
        temp_lists = list_matches;
    }
    for (var i = 0; i < temp_lists.length; i++) {
        if (temp_lists[i]["list_id"].toString() === list_id.toString()) {
            list_name = temp_lists[i]["list_name"];
            list_description = temp_lists[i]["list_description"].replace(/'/g, "\\'");
        }
    }
 
    $('#modal-title').empty();
    $("<h3 class=\"modal-title-header fa fa-list\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
    $('#modal-title-header').append("   ");
    $('#modal-title-header').append("Edit List");
    $('#modal-body').empty();
    $('#modal-body').append("<div>Provide a List Name</div>");
    $('#modal-body').append("<div><input type=\"text\" id=\"list-name\" class=\"list-inputs\" value=\""+list_name+"\"></div>");
    $('#modal-body').append("<div>Provide a List Description</div>");
    $('#modal-body').append("<textarea rows=\"3\" maxlength=\"360\" id=\"list-description\" class=\"list-inputs\">"+list_description+"</textarea>");
    $('#modal-body').append("<div>Provide a Location Associated with this List</div>");
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
            if (list_info['lat']) {
                editListRequest(list_info['list_name'],list_info['list_description'],list_info['list_location'],list_info['lat'],list_info['lon'],list_info['place_id'],list_id);
            } else {
                editListRequest(list_info['list_name'],list_info['list_description'],null,null,null,null,list_id);
            }
            updateListHtml(list_info['list_name'],list_info['list_description'],list_id);
        } else {
            alert("List details incomplete...");
        }
    });

}

function deleteListController(list_id) {
    if (active_menu === 'local') {
        if (current_user.toString() === user_id.toString()) {
            temp_lists = user_lists;
        } else {
            temp_lists = current_user_lists;
        }
    } else if (active_menu === 'around_me') {
        temp_lists = around_me_data['list_matches'];
    } else if (active_menu === 'searchRecs') {
        temp_lists = list_matches;
    }
    for (var i = 0; i < temp_lists.length; i++) {
        if (temp_lists[i]["list_id"].toString() === list_id.toString()) {
            list_name = temp_lists[i]["list_name"];
        }
    }

    $('#modal-title').empty();
    $("<h3 class=\"modal-title-header fa fa-list\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");    
    $('#modal-title-header').append("   ");
    $('#modal-title-header').append(list_name);
    $('#modal-body').empty();
    $('#modal-body').append("<p>Are you sure you wish to delete this list?</p><p>Note: This will not delete any recommendations that have been added to this list.</p>");
    $('.modal-footer').empty();
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-delete\" data-dismiss=\"modal\" onClick=\"deleteList("+list_id+")\">Delete</button>");    
}

function deleteList(list_id) {
    post_data = {
        list_id: list_id,
        user_id: user_id
    };
    $.ajax({
        url: host_type+"://"+server_host+"/deleteList",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function() {
            $.notify("Deleted List", {className: "success", position: "bottom center"});
            deleteListFromPage(list_id);
            user_list_ids.splice(user_list_ids.indexOf(list_id),1);
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}

function editListRequest(list_name,list_description,list_location,lat,lon,place_id,list_id) {
    post_data = {
        list_name: list_name,
        list_description: list_description,
        user_id: user_id,
        list_id: list_id,
        type: 'content'
    };
    if (lat !== null) {
        post_data['list_location'] = list_location;
        post_data['lat'] = lat;
        post_data['lon'] = lon;
        post_data['google_place_id'] = place_id;
    }
    $.ajax({
        url: host_type+"://"+server_host+"/editList",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(list_id) {
            for (var i = 0; i < user_lists.length; i++) {
                if (user_lists[i]["list_id"].toString() === list_id.toString()) {
                    user_lists[i]["list_name"] = list_name;
                    user_lists[i]["list_name"] = list_description;
                    if (lat !== null) {
                        user_lists[i]['list_location'] = list_location;
                        user_lists[i]['lat'] = lat;
                        user_lists[i]['lon'] = lon;
                        user_lists[i]['google_place_id'] = place_id;
                    } else {
                        user_lists[i]['list_location'] = null;
                        user_lists[i]['lat'] = null;
                        user_lists[i]['lon'] = null;
                        user_lists[i]['google_place_id'] = null;
                    }
                }
            }
            $.notify("Edited List", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}

function removeRecFromListController(r_id,r_name,list_name,list_id) {
    
    $('#myModal').modal('show');
    $('#modal-title').empty();
    $('#modal-title').append("   ");
    $('#modal-title').append(r_name);
    $('#modal-body').empty();
    $('#modal-body').append("Are you sure you wish to remove this recommendation from the "+list_name+" list?");
    $('.modal-footer').empty();
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\" onclick=\"addRecToUserList("+r_id+")\">Cancel</button>");
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-delete\" data-dismiss=\"modal\" onClick=\"removeRecFromList("+r_id+","+list_id+")\">Delete</button>");

}
function removeRecFromList(r_id,list_id) {
    post_data = {
        r_id: r_id,
        list_id: list_id,
        type: 'remove'
    };
    $.ajax({
        url: host_type+"://"+server_host+"/editList",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function(ex_out) {
            $.notify("Edited List", {className: "success", position: "bottom center"});
            var tabs = Object.keys(recommendations);
            for (var m in tabs) {
                for (var i = 0; i < recommendations[tabs[m]].length; i++) {
                    if (recommendations[tabs[m]][i]['r_id'].toString() === r_id.toString()) {
                        
                        var index = recommendations[tabs[m]][i]['r_lists'].indexOf(list_id.toString());
                        if (index > -1) {
                            recommendations[tabs[m]][i]['r_lists'].splice(index,1);
                            recommendations[tabs[m]][i]['r_list_names'].splice(index,1);                            
                        }

                    }
                }
            }
            for (var i = 0; i < recommendations[active_menu].length; i++) {
                if (recommendations[active_menu][i]['r_id'].toString() === r_id.toString()) {
                    var list_el = document.getElementById('rec-lists-'+i.toString());
                    list_el.innerHTML = "";
                    var card_html = "";
                    for (var j = 0; j < recommendations[active_menu][i]["r_lists"].length; j++) {
                        var l_id = recommendations[active_menu][i]["r_lists"][j];
                        var l_name = recommendations[active_menu][i]["r_list_names"][j];
                        var u_id = recommendations[active_menu][i]["user_id"];
                        card_html += "<a href=\"#\" onclick=\"loadList("+l_id.toString()+", '"+l_name+"', "+u_id.toString()+")\">#"+l_name+"</a>";
                        if (j < recommendations[active_menu][i]["r_lists"].length - 1) {
                            card_html += "<span>, </span>";
                        }
                    }
                    list_el.innerHTML = card_html;
                }
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}

function updateListHtml(list_name, list_description, list_id) {
    for (var i = 0; i < user_lists.length; i++) {
        list = user_lists[i];
        if (list['list_id'].toString() == list_id.toString()) {
            document.getElementById('list-name-'+i.toString()).text = list_name;
            document.getElementById('list-name-'+i.toString()).setAttribute("onClick", "loadList("+list_id.toString()+", '"+list_name+"', "+user_id.toString()+")");
            document.getElementById('list-desc-'+i.toString()).textContent = list_description;
        }
    }
}

function deleteListFromPage(list_id) {
    if (active_menu === 'local' || active_menu === 'user_list') {
        updateProfileCounts('list',-1);
    }
    var ind_to_remove = null;
    var mark_ind = null;
    for (var i = 0; i < user_lists.length; i++) {
        list = user_lists[i];
        if (list['list_id'].toString() === list_id.toString()) {
            ind_to_remove = i;
        }
        for (var j = 0; j < list_markers.length; j++) {
            if (list['list_id'].toString() === list_id.toString() && list_markers[j]['title'] === list['list_name'].toString()) {
                list_markers[j].setMap(null);
                mark_ind = j;
            }
        }
    }
    if (ind_to_remove !== null) {
        user_lists.splice(ind_to_remove, 1);
        $("#list-item-"+ind_to_remove.toString()).remove();
    }
    if (mark_ind !== null) {
       list_markers.splice(mark_ind,1);
    }
}