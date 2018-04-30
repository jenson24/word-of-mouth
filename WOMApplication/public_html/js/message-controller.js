/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function messageController() {
    current_user = user_id;
    getMarkerInfo({},'new');
    getListMarkerInfo({});
    recommendations['searchRecs'] = [];
    active_menu = 'messages';
    $('.filter-content').css('display','none');
    $('#scroll').empty();
    $('.content-header').empty();
    $('.content-header').css("height","26px");
    $('#scroll').css("height","calc( 100% - 92px - 40px)");
    getMessages(1);
}

function getMessages(page) {
    post_data = {
        to_user: user_id,
        page: page
    };
    $.ajax({
        url: host_type+"://"+server_host+"/getMessagesByUser",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'json',
        success: function(messages) {
            addMessagesToPage(messages);
            fetched_messages = messages;
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
    html_start = "<div class=\"stream-container\"><div class=\"stream-items\">";
    html_body_final = '';
    html_body = '';
    ind = 0;
    if (Object.keys(messages).length > 0) {
        for (rec in messages) {
            temp_rec_obj = [messages[rec]["rec_data"]];
            getMarkerInfo(temp_rec_obj,'continue');
            html_body += "<div class=\"message-container-li\"><div class=\"modified-rec-container\">";
            html_body += "<div class=\"message-expand-container\">";
            html_body += "<div class=\"message-expand-icon\"><button id=\message-expand-button-"+ind.toString()+"\" class=\"message-expand-button fa fa-angle-double-down\" title=\"Show/Hide Thread\" onClick=\"messageExpandController("+ind.toString()+")\"></button></div>";
            html_body += "<div class=\"message-expand-summary\" id=\"message-expand-summary-"+ind.toString()+"\">";
            if (messages[rec]["messages"][0]["from_id"].toString() === user_id.toString()) {
                html_body += "<a href=\"#\" onclick=\"changeUser("+messages[rec]["messages"][0]["to_id"].toString()+")\">@"+messages[rec]["messages"][0]["to_name"]+"</a>";
            } else {
                html_body += "<a href=\"#\" onclick=\"changeUser("+messages[rec]["messages"][0]["from_id"].toString()+")\">@"+messages[rec]["messages"][0]["from_name"]+"</a>";
            }
            html_body += "<span class=\"message-expand-span\">: "+messages[rec]["rec_data"]["r_name"]+"  >>  "+messages[rec]["messages"][0]["comment"]+"</span>";
            html_body += "</div></div>";
            if (messages[rec]["messages"][0]["from_id"].toString() === user_id.toString()) {
                html_body += "<div class=\"contact-name\" id=\"contact-name-"+ind.toString()+"\" hidden=true><a href=\"#\" onclick=\"changeUser("+messages[rec]["messages"][0]["to_id"].toString()+")\">@"+messages[rec]["messages"][0]["to_name"]+"</a></div>";
            } else {
                html_body += "<div class=\"contact-name\" id=\"contact-name-"+ind.toString()+"\" hidden=true><a href=\"#\" onclick=\"changeUser("+messages[rec]["messages"][0]["from_id"].toString()+")\">@"+messages[rec]["messages"][0]["from_name"]+"</a></div>";
            }
            html_body += getModifiedCardHtml(messages[rec]['rec_data'],ind);
            html_body += "<div id=\"message-list-"+ind.toString()+"\" class=\"message-list\" hidden=true><div class=\"message-list-container\">";
            for (i = 0; i < messages[rec]['messages'].length; i++) {
                html_body += getMessageHtml(messages[rec]['messages'][i]);
            }
            html_body += "</div></div>";
            html_body += "<div id=\"reply-message-input-li-"+ind.toString()+"\" class=\"reply-message-input-li\" hidden=true><div class=\"reply-message-wrapper\">";
            html_body += "<div class=\"message-reply-button\"><button type=\"button\" class=\"btn-reply\" id=\"btn-send-"+ind.toString()+"\" onClick=\"sendMessage("+user_id.toString()+","+messages[rec]['rec_data']["user_id"]+","+messages[rec]['rec_data']["r_id"].toString()+", "+ind.toString()+")\">Send</button></div>"
            html_body += "<div class=\"message-textarea\"><textarea rows='2' data-min-rows='2' placeholder=\" Reply to thread...\" id=\"reply-message-input-"+ind.toString()+"\" class=\"reply-message-input autoExpand\"></textarea></div>";
            html_body += "</div></div>";
            html_body += "</div></div>";
            ind += 1;
        }
    } else {
        html_body = "<div class=\"empty-action\">You don't have any messages! Reply to a recommendation to begin a message thread.</div>";
    }
    html_end = "</div></div>";
    $('#scroll').append(html_start+html_body+html_end);    
}

function getMessageHtml(message) {
    if (message['from_id'].toString() === user_id.toString()) {
        messageHtml = "<div class=\"speech-container\"><div class=\"speech-bubble speech-bubble-right\">"+message['comment']+"</div></div>"
    } else {
        messageHtml = "<div class=\"speech-container\"><div class=\"speech-bubble speech-bubble-left\">"+message['comment']+"</div></div>"
    }
    return messageHtml;
}

function getModifiedCardHtml(recObj,ind) {
    card_html = "";
    card_html += "<div id=\"message-rec-item-"+ind.toString()+"\" class=\"message-rec-item\" hidden=true>";
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
    card_html += "</div>";
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
    $('#modal-title').empty();
    $("<h3 class=\"modal-title-header fa fa-envelope\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
    $('#modal-title-header').append("   ");
    $('#modal-title-header').append("Send Message");
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
        url: host_type+"://"+server_host+"/storeMessage",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function() {
            $.notify("Sent Message", {className: "success", position: "bottom center"});
            if (active_menu === 'messages') {
                insert_str = "<div class=\"speech-container\"><div class=\"speech-bubble speech-bubble-right\">"+comment+"</div></div>";
                $(".message-list-container:eq("+ind.toString()+")").append(insert_str);
                document.getElementById("reply-message-input-"+ind.toString()).value = '';
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}

function messageExpandController(ind) {
    if ($("#message-expand-summary-"+ind).css('display') === 'none') {
        var ic = document.getElementsByClassName("message-expand-button")[ind];
        ic.classList.add("fa-angle-double-down");
        ic.classList.remove("fa-angle-double-up");
        $("#message-expand-summary-"+ind).css('display','block');
        $("#contact-name-"+ind).css('display','none');
        $("#message-rec-item-"+ind).css('display','none');
        $("#message-list-"+ind).css('display','none');
        $("#reply-message-input-li-"+ind).css('display','none');        

    } else {
        var ic = document.getElementsByClassName("message-expand-button")[ind];
        ic.classList.add("fa-angle-double-up");
        ic.classList.remove("fa-angle-double-down");
        $("#message-expand-summary-"+ind).css('display','none');
        $("#contact-name-"+ind).css('display','block');
        $("#message-rec-item-"+ind).css('display','block');
        $("#message-list-"+ind).css('display','block');
        $("#reply-message-input-li-"+ind).css('display','block');        
    }
}