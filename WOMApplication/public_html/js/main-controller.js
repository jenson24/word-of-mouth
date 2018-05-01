/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var user_id = 0;
var current_user = 0;
var username = '';
var recommendations = {'local':[],'global':[],'aroundMe':[],'searchRecs':[],'user_list':[]};
var fetched_messages = [];
var active_menu = 'global';
var markers = [];
var list_markers = [];
var infos = [];
var typeSelection = '';
var page_size = 100;
var marker_list = {};
var search_rec_results = [];
var profile_info = {};
var list_info = {};
var user_lists = [];
var user_list_ids = [];
var current_user_lists = [];
var term_matches = [];
var user_matches = [];
var list_matches = [];
var search_data = {};
var suggestions = [];
var active_tab = 'terms';
var pos = {};
var infoWindows = [];
var user_role = 'user';
var around_me_data = {'list_matches': [], 'rec_matches': []};
var save_list_name = "Want to Try";
//var server_host = 'word-of-mouth-test.com/api';
var server_host = 'localhost:8080/api';
var host_type = 'http';

window.onload = function(){
    //var temp = document.cookie;
    //console.log(temp);
    user_id = getCookie('user_id');
    current_user = user_id;
    username = getCookie('username');
    user_role = getCookie('user_role');
    if (user_id !== "") {
        page = 1;
        login_html = "<a href=\"#\" style=\"float:left;margin-left:5px\" class=\"login-link\" onClick=\"showGuide()\">Tutorial</a><span>Logged in as </span><a href=\"#\" class=\"login-link\">"+username+"</a><span>. </span><a href=\"#\" class=\"login-link\" onClick=\"logout()\">Logout</a>";
        if (user_role === 'admin') {
            login_html += "<button id=\"open-admin\" onclick=\"openAdminConsole()\"><i class=\"fa fa-cog\"></button>";
        }

        var temp_lists = get_lists(user_id);
        var list_data = temp_lists["responseJSON"];
        user_lists = list_data["lists"];
        
        var try_list_exists = false;
        for (var i = 0; i < user_lists.length; i++) {
            if (user_list_ids.indexOf(user_lists[i]["list_id"]) === -1) {
                user_list_ids.push(user_lists[i]["list_id"]);
            }
            if (user_lists[i]["list_name"] === save_list_name) {
                try_list_exists = true;
            }
        }
        
        setRecommendations('global','new','new');
        $('a.icon-select.global').addClass('active');
        $('.login-info-bar').empty();
        $('.login-info-bar').append(login_html);
        
        if (!try_list_exists) {
            createNewList(save_list_name,"A list of all the places that I have saved that I want to try.",null,null,null,null,'None');
            var temp_lists = get_lists(user_id);
            var list_data = temp_lists["responseJSON"];
            user_lists = list_data["lists"];
        }

        $('#splashModal').modal('show');
    } else {
        //$('#tourGuideModal').modal('show');
        $('#loginModal').modal('show');
        login_html = "<a href=\"#\" style=\"float:left;margin-left:5px\" class=\"login-link\" onClick=\"showGuide()\">Tutorial</a><a href=\"#\" class=\"login-link\" onClick=\"showLoginModal()\">Login</a>";
        $('.login-info-bar').empty();
        $('.login-info-bar').append(login_html);
    };
};

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
                        addNextPageOfRecs();                
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
    $('.reset-input').on('keyup', function () {
        var empty = false;
        empty_count = 0;
        $('.reset-input').each(function() {
            if ($(this).val() === '') {
                empty = true;
                empty_count += 1;
            }
        });
        if (empty) {
            $('#reset-btn').attr('disabled', 'disabled');
        } else {
            $('#reset-btn').removeAttr('disabled');
        }
    });

 });

function setRecommendations(rec_type, temp_obj, marker_flag) {
    recs = temp_obj;
    recommendations['searchRecs'] = [];
    if (temp_obj === 'new') {
        page = 1;
        get_recommendations(rec_type, page);
        recs = recommendations["latest_pull"];            
        jQuery('#scroll').animate({scrollTop:0},0);
        clearFilters();
    }
    if (rec_type === 'global') {
        current_user = user_id;
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
            if (current_user !== user_id) {
                html_body = "<div class=\"empty-action\">This user has not added any recommendations yet! Tell them to get on it!</div>";
            } else {
                html_body = "<div class=\"empty-action\">You haven't added any recommendations yet! Use the map (and the search bar above the map) to find places to recommend.</div>";
            }
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

function addRecToPage(recObj) {
    if (active_menu === 'local' || active_menu === 'global') {
        rec_num = recommendations[active_menu].length;
        card_html = getCardHtml(recObj,rec_num);
        $('.stream-items').prepend(card_html);
    }

    getMarkerInfo([recObj],'keep');
    closeAllInfoWindows();
    
    var already_pulled = false;
    for (var j = 0; j < recommendations[active_menu].length; j++) {
        if (recObj["r_id"] === recommendations[active_menu][j]["r_id"]) {
            already_pulled = true;
        }
    }
    if (already_pulled === false) {
        recommendations[active_menu].push(recObj);
    }
}
function addNextPageOfRecs() {
    new_recs = recommendations["latest_pull"];
    getMarkerInfo(new_recs,'continue');
    rec_num = recommendations[active_menu].length - new_recs.length;
    html_body = "";
    for (var i = 0; i < new_recs.length; i++) {
        html_body += getCardHtml(new_recs[i],i+rec_num);
    }
    $('.stream-items').append(html_body);
}

function getCardHtml(recObj,ind) {
    card_html = "";
    card_html += "<li class=\"js-stream-item\">";
    card_html += "<div class=\"rec-item\">";
    card_html += "<div class=\"stream-item-context\">";
    card_html += "<div class=\"stream-item-header\">";
    if (recObj['r_type'] === 1) {
        card_html += "<i class=\"fa fa-thumbs-up card-type thumbs-up\"/><a href=\"#\" onclick=\"changeUser("+recObj["user_id"].toString()+")\">"+recObj["username"]+"</a>";
    } else if (recObj['r_type'] === -1) {
        card_html += "<i class=\"fa fa-thumbs-down card-type thumbs-down\"/><a href=\"#\" onclick=\"changeUser("+recObj["user_id"].toString()+")\">"+recObj["username"]+"</a>";
    } else {
        card_html += "<a href=\"#\" onclick=\"changeUser("+recObj["user_id"].toString()+")\">"+recObj["username"]+"</a>";
    }
    card_html += "<div class=\"stream-item-container\">";
    card_html += "<span class=\"rec-name\"><strong class=\"recName\">"+recObj["r_name"]+"</strong></span>";
    card_html += "<span class=\"rec-comment\">"+recObj["r_comment"]+"</span>";
    card_html += "<div id=\"rec-lists-"+ind.toString()+"\" class=\"rec-lists\">";
    if (recObj["r_lists"] && recObj["r_lists"] !== null && recObj["r_lists"].length > 0) {
        list_ids = recObj["r_lists"];
        list_names = recObj["r_list_names"];
        for (var i = 0; i < list_ids.length; i++) {
            if (recObj["user_id"].toString() === user_id.toString()) {
                if (user_list_ids.indexOf(list_ids[i]) > -1) {
                    card_html += "<a href=\"#\" onclick=\"loadList("+list_ids[i].toString()+", '"+list_names[i]+"', "+recObj["user_id"]+")\">#"+list_names[i]+"</a>";
                    if (i < list_ids.length - 1) {
                        card_html += "<span>, </span>";
                    }
                } 
            } else {
                var already_added = false;
                if (user_list_ids.indexOf(list_ids[i]) === -1) {
                    card_html += "<a href=\"#\" onclick=\"loadList("+list_ids[i].toString()+", '"+list_names[i]+"', "+recObj["user_id"]+")\">#"+list_names[i]+"</a>";
                    if (i < list_ids.length - 1) {
                        card_html += "<span>, </span>";
                    }
                } else {
                    already_added = true;
                }
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
        card_html += "<span>Website: </span><a target=\"_blank\" href=\""+recObj["r_website"]+"\" class=\"website-footer-content\">"+recObj["r_website"]+"</a>";
    }
    card_html += "</div>";
    card_html += "</div>";
    card_html += "</div>";
    if (recObj["user_id"].toString() === user_id.toString()) {
        card_html += "<div class=\"rec-tools-container\">";
        card_html += "<button class=\"fa fa-wrench tool-container\" data-toggle=\"collapse\" data-target=\"#rec-tools-collapse-"+ind.toString()+"\"></button>";
        card_html += "<div id=\"rec-tools-collapse-"+ind.toString()+"\" class=\"collapse\">";
        card_html += "<div class=\"edit-rec-button\"><button title=\"Edit Recommendation\" class=\"fa fa-pencil-square-o rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"editRecommendationController('"+recObj["r_id"].toString()+"')\"></button></div>";
        card_html += "<div class=\"delete-rec-button\"><button title=\"Delete Recommendation\" class=\"fa fa-trash-o rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"deleteRecommendationController('"+recObj["r_id"].toString()+"')\"></button></div>";
        card_html += "<div class=\"list-button\"><button title=\"Update Lists\" class=\"fa fa-list rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"addRecToUserList("+recObj["r_id"].toString()+")\"></button></div>";
        card_html += "</div></div>";
    } else {
        card_html += "<div class=\"message-button\"><button title=\"Send Message\" class=\"fa fa-envelope rec-tool-icons\" data-toggle=\"modal\" data-target=\"#myModal\" onClick=\"composeMessage("+user_id.toString()+","+recObj["user_id"].toString()+",'"+recObj["username"]+"',"+recObj["r_id"].toString()+")\"></button></div>";
        if (already_added) {
            card_html += "<div id=\"add-to-try-list-"+ind.toString()+"\" class=\"list-button\"><button title=\"Remove from my Lists\" class=\"fa fa-star added-to-try-list\" onClick=\"updateTryList("+recObj["r_id"].toString()+",'remove')\"></button></div>";
        } else {
            card_html += "<div id=\"add-to-try-list-"+ind.toString()+"\" class=\"list-button\"><button title=\"Save to my Lists\" class=\"fa fa-star rec-tool-icons\" onClick=\"updateTryList("+recObj["r_id"].toString()+",'add')\"></button></div>";
        }
    }
    card_html += "</div>";
    card_html += "</li>";
    return card_html;
}    

function sendData(type) {
    var comment = document.getElementById("rec-comment").value;
    rec_object["comment"] = comment;
    rec_object["user_id"] = user_id;
    rec_object["username"] = username;
    post_data = rec_object;
    if (type !== 'save') {
        list_id = document.getElementById('user-list-select').value;
        if (list_id !== 'null') {
            post_data["list_id"] = list_id;
            list_name = $('#user-list-select option:selected').text();
        }
    } else {
        for (var i = 0; i < user_lists.length; i++) {
            if (user_lists[i]["list_name"] === save_list_name) {
                list_id = user_lists[i]["list_id"];
                post_data["list_id"] = list_id;
                list_name = user_lists[i]["list_name"];
            }
        }
    }
    $.ajax({
        url: host_type+"://"+server_host+"/createRec",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function(rec_id) {
            $.notify("Successfully Added Recommendation", {className: "success", position: "bottom center"});
            temp_obj = {
                r_id: rec_id,
                r_lat: rec_object["g_lat"],
                r_lon: rec_object["g_lon"],
                r_address: rec_object["g_formatted_address"],
                r_website: rec_object["g_website"],
                r_type: rec_object["r_type"],
                user_id: user_id, 
                username: username, 
                r_comment: comment, 
                r_name: rec_object["g_name"], 
                r_date: "Just Added..."
            };
            if (list_id !== 'null') {
                temp_obj["r_lists"] = list_id;
                temp_obj["r_list_names"] = [list_name];
            }

            addRecToPage(temp_obj);
            if (active_menu === 'local') {
                updateProfileCounts('recs',1);
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        }
    });
};

function get_recommendations(lookup_type, page) {
    if(lookup_type === 'global') {
        current_user = user_id;
    }
    post_data = {
        uid: current_user,
        logged_in_user: user_id,
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
            recommendations['latest_pull'] = temp_obj;
            if (current_user !== user_id) {
                if (Object.keys(recommendations).indexOf(current_user) > -1) {
                    for (i = 0; i < temp_obj.length; i++) {
                        var already_pulled = false;
                        for (var j = 0; j < recommendations[current_user].length; j++) {
                            if (temp_obj[i]["r_id"] === recommendations[current_user][j]["r_id"]) {
                                already_pulled = true;
                            }
                        }
                        if (already_pulled === false) {
                            recommendations[current_user].push(temp_obj[i]);
                        }
                    }
                } else {
                    recommendations[current_user] = temp_obj;
                }
            }
            if (recommendations[active_menu].length > 0) {
                for (var i = 0; i < recommendations["latest_pull"].length; i++) {
                    var already_pulled = false;
                    for (var j = 0; j < recommendations[active_menu].length; j++) {
                        if (recommendations["latest_pull"][i]["r_id"] === recommendations[active_menu][j]["r_id"]) {
                            already_pulled = true;
                        }
                    }
                    if (already_pulled === false) {
                        recommendations[active_menu].push(recommendations["latest_pull"][i]);
                    }
                }
            } else {
                recommendations[active_menu] = temp_obj;
            }
            $.notify("Found data", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
};

function getTypes() {
    temp_obj = recommendations[active_menu];
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

function getPage() {
    if (active_menu === 'global') {
        rec_length = recommendations['global'].length;
    } else if (active_menu === 'local') {
        if (current_user !== user_id) {
            rec_length = recommendations[current_user].length;
        } else {
            rec_length = recommendations['local'].length;
        }
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

function enableSearch() {
    current_user = user_id;
    if (suggestions.length === 0) {
        get_suggestions();
    }
    $('#scroll').empty();
    addSuggestionHtml(suggestions);
    
    getMarkerInfo({},'new');
    getListMarkerInfo({});
    active_menu = 'searchRecs';
    $('.filter-content').css('display','none');
    $('.content-header').empty();
    $('.content-header').css("height","26px");
    $('#scroll').css("height","calc( 100% - 92px - 26px)");
    html_search = "<div class=\"searchBarWrapper\">";
    html_search += "<div class=\"searchBarInput\"><input type=\"text\" autocomplete=\"off\" placeholder=\"Search Word of Mouth...\" id=\"search-input\" class=\"search-input\" onchange=searchController($(this).val())></div>";
    html_search += "<div class=\"searchBarHelp\"><button data-toggle=\"modal\" data-target=\"#searchHelpModal\" title=\"Search Help\" id=\"searchHelp\"><i class=\"fa fa-question\"></i></button></div>";
    html_search += "</div>";
    $('.content-header').append(html_search);
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
            
            for (var i = 0; i < term_matches.length; i++) {
                var in_array = false;
                for (var j = 0; j < recommendations['searchRecs'].length; j++) {
                    if (recommendations['searchRecs'][j]['r_id'] === term_matches[i]['r_id']) {
                        in_array = true;
                    }
                }
                if (!in_array) {
                    recommendations['searchRecs'].push(term_matches[i]);
                }
            }

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
        $('#scroll').empty();
        var tab_html = "<div class=\"tab\" id=\"search-tabs\">";
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
    } else {
        enableSearch();
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
        getMarkerInfo(term_matches,'new');
        document.getElementById('search-results-terms').style.display = "block";
    } else if (list_matches.length > 0) {
        $("#button-tab-lists").addClass("active");
        document.getElementById('search-results-lists').style.display = "block";
    } else if (user_matches.length > 0) {
        $("#button-tab-users").addClass("active");
        document.getElementById('search-results-users').style.display = "block";
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
    if (jQuery.isEmptyObject(pos)) {
        navigator.geolocation.getCurrentPosition(function(position) {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            searchAroundMe(type);
        });
        if (jQuery.isEmptyObject(pos)) {
            alert("You need to allow access to your location to see what is around you!");
        }
    } else {
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
                recommendations['aroundMe'] = search_results["rec_matches"];
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
}
function selectAroundMe() {
    current_user = user_id;
    recommendations['searchRecs'] = [];
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

function get_suggestions() {
    post_data = {
        user_id: user_id
    };
    $.ajax({
        url: host_type+"://"+server_host+"/getSuggestions",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(results) {
            suggestions = results['suggested_followers'];
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}
function addSuggestionHtml(sugs) {
    html_start = "<div class=\"stream-container\"><ol class=\"follow-items\">";
    html_body = "<h4 style=\"padding-left:12px\">Suggested followers for you...</h4>";
    if (sugs.length > 0) {
        for (var i = 0; i < sugs.length; i++) {
            html_body += getFollowHtml(sugs[i],i);
        }        
    } else {
        html_body = "<div class=\"empty-action\">No suggestions right now. Use the search bar above to search your network's recommendtions or find people to follow.</div>";
    }
    html_end = "<get/ol></div>";
    $('.filter-bar').empty();
    $('.filter-content').css('display','none');
    $('#scroll').empty();
    $('.content-header').css("height","32px");
    $('#scroll').css("height","calc( 100% - 92px - 32px)");        
    $('#scroll').append(html_start+html_body+html_end);
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

function openAdminConsole() {
    $.ajax({
        url: host_type+"://"+server_host+"/getMetrics",
        type: 'GET',
        dataType: 'json',
        success: function(results) {
            metrics = results;
            num_users = metrics['users'];
            num_recs = metrics['recommendations'];
            var temp_users = document.getElementById("admin_num_users");
            temp_users.innerHTML = "<span>Total number of users: "+num_users.toString()+"</span>";
            var temp_recs = document.getElementById("admin_num_recs");
            temp_recs.innerHTML = "<span>Total number of recommendations: "+num_recs.toString()+"</span>";
            $('#adminModal').modal('show');
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}