/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var user_id = 0;
var recommendations = {};

$(document).ready(function(){
    user_id = getCookie('user_id');
    console.log(user_id);
    if (user_id !== "") {
        get_recommendations('global');
        temp_obj = recommendations["recommendations"];
        html_start = "<h2>What people are recommending...</h2><ol class=\"stream-items\">"
        html_body = "";
        for (var i = 0; i < temp_obj.length; i++) {
            console.log(temp_obj[i]["r_date"]);
            console.log(temp_obj[i]["r_comment"]);
            html_body += "<li class=\"js-stream-item\">";
            html_body += "<div class=\"rec-item\">";
            html_body += "<div class=\"stream-item-context\">";
            html_body += "<div class=\"stream-item-header\">";
            html_body += "<span class=\"FullName\"><strong class=\"fullname\">"+temp_obj[i]["username"]+"</strong></span>";
            html_body += "<div class=\"stream-item-container\">";
            html_body += "<span class=\"rec-name\"><strong class=\"recName\">"+temp_obj[i]["r_name"]+"</strong></span>";
            html_body += "<span class=\"rec-comment\">"+temp_obj[i]["r_comment"]+"</span>";
            html_body += "<span class=\"rec-date\">"+temp_obj[i]["r_date"]+"</span>";
            html_body += "</div>";
            html_body += "</div>";
            html_body += "</div>";
            html_body += "</div>";
            html_body += "</li>";
        };
        html_end = "</ol>"
        $('.content-header').append(html_start+html_body+html_end);
    };
});


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
    console.log(comment);
    rec_object["comment"] = comment;
    $.ajax({
        url: 'http://localhost:8080/createRec',
        type: 'POST',
        data: JSON.stringify(rec_object),
        dataType: 'text',
        success: function() {
            $.notify("Successfully Added Recommendation", {className: "success", position: "bottom center"});
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
    //user_id = '13';
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
