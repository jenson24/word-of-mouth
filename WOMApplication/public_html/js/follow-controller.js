/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


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
            card_html += "<div class=\"follow-icon\"><button type=\"button\" class=\"button button-follow\" id=\"follow-item-"+i.toString()+"\" data-hover=\"Unfollow\" onClick=\"unfollow("+user_id.toString()+","+follow["user_id"].toString()+","+i.toString()+")\"><span>Following</span></button></div>";    
        } else {
            card_html += "<div class=\"follow-icon\"><button type=\"button\" class=\"button new-follow\" id=\"follow-item-"+i.toString()+"\" data-hover=\"Follow\" onClick=\"follow("+user_id.toString()+","+follow["user_id"].toString()+","+i.toString()+")\"><span>Follow</span></button></div>";    
        }
    }
    card_html += "</div></li>";
    return card_html;
}
function unfollow(from_user,to_user,i) {
    $('#follow-item-'+i+' span').text("Follow");
    $('#follow-item-'+i).attr('onClick', "follow("+from_user.toString()+","+to_user.toString()+","+i.toString()+")");
    $('#follow-item-'+i).toggleClass('button-follow new-follow');
    manageFollowers(from_user,to_user,'unfollow');
    if (active_menu === 'local') {
        updateProfileCounts('following',-1);
    }
}
function follow(from_user,to_user,i) {
    $('#follow-item-'+i+' span').text("Following");
    $('#follow-item-'+i).attr('data-hover', 'Unfollow');
    $('#follow-item-'+i).attr('onClick', "unfollow("+from_user.toString()+","+to_user.toString()+","+i.toString()+")");
    $('#follow-item-'+i).toggleClass('new-follow button-follow');
    manageFollowers(from_user,to_user,'follow');
    if (active_menu === 'local') {
        updateProfileCounts('following',1);
    }
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
