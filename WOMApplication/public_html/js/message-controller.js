/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function messageController() {
    getMarkerInfo({},'new');
    getListMarkerInfo({});
    active_menu = 'messages';
    $('.filter-content').css('display','none');
    $('#scroll').empty();
    $('.content-header').empty();
    $('.content-header').css("height","26px");
    $('#scroll').css("height","calc( 100% - 92px - 26px)");
    getMessages(1);
}

function getMessages(page) {
    post_data = {
        to_user: user_id,
        page: page
    };
    $.ajax({
        url: 'http://localhost:8080/getMessagesByUser',
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(messages) {
            addMessagesToPage(messages);
            $.notify("Found Messages", {className: "success", position: "bottom center"});
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}

function addMessagesToPage(messages) {
    $('.content-header').append("<div class=\"rec-section-header\"><span>Message Board...</span></div>"); 
    html_start = "<div class=\"stream-container\"><ol class=\"stream-items\">";
    html_body_final = '';
    html_body = '';
    ind = 0;
    for (rec in messages) {
        html_body += "<li class=\"message-container-li\"><ol class=\"modified-rec-container\">";
        //html_body += "<li class=\"message-icon\"><i class=\"fa fa-at\" aria-hidden=\"true\"></i></li>";
        html_body += getModifiedCardHtml(messages[rec]['rec_data'],ind);
        html_body += "<li class=\"message-list\"><ol class=\"message-list-container\">";
        for (i = 0; i < messages[rec]['messages'].length; i++) {
            html_body += getMessageHtml(messages[rec]['messages'][i]);
        }
        html_body += "</ol></li>";
        html_body += "<li class=\"reply-message-input-li\"><div class=\"reply-message-wrapper\">";
        html_body += "<div class=\"message-reply-button\"><button type=\"button\" class=\"btn-reply\" id=\"btn-send-"+ind.toString()+"\" onClick=\"sendMessage("+user_id.toString()+","+messages[rec]['rec_data']["user_id"]+","+messages[rec]['rec_data']["r_id"].toString()+", "+ind.toString()+")\">Send</button></div>"
        html_body += "<div class=\"message-textarea\"><textarea rows='2' data-min-rows='2' placeholder=\" Reply to thread...\" id=\"reply-message-input-"+ind.toString()+"\" class=\"reply-message-input autoExpand\"></textarea></div>";
        html_body += "</div></li>";
        html_body += "</ol></li>";
        ind += 1;
    }
    html_end = "</ol></div>";
    $('#scroll').append(html_start+html_body+html_end);    
}

function getMessageHtml(message) {
    if (message['from_id'].toString() === user_id.toString()) {
        messageHtml = "<li class=\"speech-container\"><div class=\"speech-bubble speech-bubble-right\">"+message['comment']+"</div></li>"
    } else {
        messageHtml = "<li class=\"speech-container\"><div class=\"speech-bubble speech-bubble-left\">"+message['comment']+"</div></li>"
    }
    return messageHtml;
}

function getModifiedCardHtml(recObj,ind) {
    r_date = "Just now...";
    card_html = "";
    card_html += "<li class=\"message-rec-item\">";
    card_html += "<div class=\"rec-item\">";
    card_html += "<div class=\"stream-item-header\">";
    card_html += "<a href=\"#\" onclick=\"changeUser("+recObj["user_id"].toString()+")\">"+recObj["username"]+"</a>";
    card_html += "</div>";
    card_html += "<div class=\"stream-item-container\">";
    card_html += "<span class=\"rec-name\"><strong class=\"recName\">"+recObj["r_name"]+"</strong></span>";
    card_html += "<span class=\"rec-comment\">"+recObj["r_comment"]+"</span>";
    card_html += "</div>";
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
    card_html += "<span class=\"rec-date\" style=\"float:right\">"+recObj["r_date"].slice(0,recObj["r_date"].indexOf(" "))+"</span>";
    card_html += "</div>";
    card_html += "</div>";
    card_html += "</li>";
    return card_html;
}

$(document).one('focus.autoExpand', 'textarea.autoExpand', function(){
    var savedValue = this.value;
    this.value = '';
    this.baseScrollHeight = this.scrollHeight;
    this.value = savedValue;
}).on('input.autoExpand', 'textarea.autoExpand', function(){
    var minRows = this.getAttribute('data-min-rows')|0, rows;
    this.rows = minRows;
    rows = Math.ceil((this.scrollHeight - this.baseScrollHeight) / 16);
    this.rows = minRows + rows;
});

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
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-send\" data-dismiss=\"modal\" onClick=\"sendMessage("+from_user+","+to_user+","+r_id+", 'comment')\">Send</button>")
}
function sendMessage(from_user,to_user,r_id,type) {
    if (type === 'comment') {
        var comment = document.getElementById("message-comment").value;    
    } else {
        var comment = document.getElementById("reply-message-input-"+type.toString()).value;
        console.log(comment);
    }
    if (comment.length > 0) {
        storeMessage(from_user,to_user,comment,r_id,type);
    }
}
function storeMessage(from_user,to_user,comment,r_id,ind) {
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
            if (active_menu === 'messages') {
                insert_str = "<li class=\"speech-container\"><div class=\"speech-bubble speech-bubble-right\">"+comment+"</div></li>";
                $(".message-list-container:eq("+ind.toString()+")").append(insert_str);
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}

function messageThreadController(from_id, to_id, r_id, ind) {

}