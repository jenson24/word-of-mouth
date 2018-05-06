/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function loadDefaultProfile() {
    active_menu = 'local';
    current_user = user_id;
    setRecommendations(active_menu,'new','new');
}
function getProfileHTML(uid) {
    temp_profile_info = getProfile(uid);
    profile_info = temp_profile_info["responseJSON"];
    var followers_count = profile_info["followers"].length.toString();
    var following_count = profile_info["following"].length.toString();
    var first_name = profile_info["first_name"];
    var last_name = profile_info["last_name"];
    var rec_count = profile_info["recommendations"].toString();
    var list_count = profile_info["lists"].toString();
    profile_html = '';
    profile_html += "<div class=\"profile-header\">";
    profile_html += "<div id=\"profile-name-wrapper\"><div class=\"full-name\"><span>"+first_name+" "+last_name+"</span></div>";
    if (uid.toString() !== user_id) {
        if (my_following.indexOf(uid) > -1) {
            profile_html += "<div class=\"follow-icon\" style=\"padding-right:15px\"><button type=\"button\" class=\"button button-follow\" id=\"follow-item-1\" data-hover=\"Unfollow\" onClick=\"unfollow("+user_id.toString()+","+uid.toString()+",'1')\"><span>Following</span></button></div>";    
        } else {
            profile_html += "<div class=\"follow-icon\" style=\"padding-right:15px\"><button type=\"button\" class=\"button new-follow\" id=\"follow-item-1\" data-hover=\"Follow\" onClick=\"follow("+user_id.toString()+","+uid.toString()+",'1')\"><span>Follow</span></button></div>";    
        }
    }
    profile_html += "</div>";
    profile_html += "<span class=\"profile-follow-content\">Following: </span><a id=\"followingLink\" href=\"#\" onclick=\"showFollowing("+uid.toString()+")\">"+following_count+"</a>";
    profile_html += "<span class=\"profile-follow-content\">Followers: </span><a id=\"follwerLink\" href=\"#\" onclick=\"showFollowers("+uid.toString()+")\">"+followers_count+"</a>";
    profile_html += "<span class=\"profile-follow-content\">Recommendations: </span><a id=\"recLink\" href=\"#\" onclick=\"setRecommendations('local','new','new')\">"+rec_count.toString()+"</a>";
    profile_html += "<span class=\"profile-follow-content\">Lists: </span><a id=\"listLink\" href=\"#\" onclick=\"showLists("+uid.toString()+")\">"+list_count.toString()+"</a></div>";
    return profile_html;
}
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
function changeUser(uid) {
    current_user = uid;
    recommendations['local'] = [];
    //fetched_my_recommendations = [];
    $('.content-header').empty();
    profile_html = getProfileHTML(current_user);
    $('.content-header').append(profile_html);
    setRecommendations('local','new','new');
}

function updateProfileCounts(type,val) {
    if (type === 'following') {
        var old_val = parseInt($('#followingLink').text());
        $('#followingLink').text(old_val + val);
    } else if (type === 'list') {
        var old_val = parseInt($('#listLink').text());
        $('#listLink').text(old_val + val);
    } else if (type === 'recs') {
        var old_val = parseInt($('#recLink').text());
        $('#recLink').text(old_val + val);
    }
}

