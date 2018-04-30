/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function editRecommendationController(r_id) {
    var temp_recs = [];
    temp_recs = recommendations[active_menu];
    for (var i = 0; i < temp_recs.length; i++) {
        if (temp_recs[i]["r_id"].toString() === r_id.toString()) {
            r_name = temp_recs[i]["r_name"];
            comment = temp_recs[i]["r_comment"].replace(/'/g, "\\'");
            r_type = temp_recs[i]["r_type"];
        }
    }

    $('#modal-title').empty();
    if (r_type.toString() === '1') {
        $("<h3 class=\"modal-title-header fa fa-thumbs-up\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");    
        $('#modal-title-header').append("   ");
    } else if (r_type.toString() === '-1') {
        $("<h3 class=\"modal-title-header fa fa-thumbs-down\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");            
        $('#modal-title-header').append("   ");
    } else {
        $("<h3 class=\"modal-title-header\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");            
    }
    $('#modal-title-header').append(r_name);
    $('#modal-body').empty();
    $('#modal-body').append("Edit comment...");
    $('#modal-body').append("<textarea rows=\"4\" maxlength=\"1000\" id=\"rec-comment\">"+comment+"</textarea>");
    $('.modal-footer').empty();
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
    if (r_type.toString() !== '0') {
        $('.modal-footer').append("<button type=\"button\" class=\"btn btn-save\" data-dismiss=\"modal\" onClick=\"editRecommendation("+r_id+",'','comment')\">Send</button>");
    } else {
        $('.modal-footer').append("<button type=\"button\" class=\"addRec fa fa-thumbs-up\" data-dismiss=\"modal\" onClick=\"editRecommendation("+r_id+",'','like')\">Like</button>");
        $('.modal-footer').append("<button type=\"button\" class=\"addRec fa fa-thumbs-down\" data-dismiss=\"modal\" onClick=\"editRecommendation("+r_id+",'','dislike')\">Dislike</button>");
    }
}

function editRecommendation(r_id, val, type) {
    if (type === 'comment') {
        var comment = document.getElementById("rec-comment").value;
        post_data = {
            comment: comment,
            r_id: r_id
        };
    } else if (type === 'list') {
        post_data = {
            list_id: val[0],
            r_id: r_id
        };
    } else if (type === 'like') {
        var comment = document.getElementById("rec-comment").value;
        post_data = {
            comment: comment,
            r_id: r_id,
            r_type: 1
        };
    } else if (type === 'dislike') {
        var comment = document.getElementById("rec-comment").value;
        post_data = {
            comment: comment,
            r_id: r_id,
            r_type: -1
        };
    }
    $.ajax({
        url: host_type+"://"+server_host+"/editRec",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function() {
            $.notify("Successfully Updated Recommendation", {className: "success", position: "bottom center"});
            if (type === 'comment') {
                for (var i = 0; i < recommendations['local'].length; i++) {
                    if (recommendations['local'][i]['r_id'].toString() === r_id.toString()) {
                        recommendations['local'][i]['r_comment'] = comment;
                    }
                }
                updateRecHtml(r_id,comment,'comment');
            } else if (type === 'list') {
                updateRecHtml(r_id,val,'list');
                var tabs = Object.keys(recommendations);
                for (var m in tabs) {
                    for (var i = 0; i < recommendations[tabs[m]].length; i++) {
                        if (recommendations[tabs[m]][i]['r_id'].toString() === r_id.toString()) {
                            recommendations[tabs[m]][i]['r_lists'].push(val[0].toString());
                            recommendations[tabs[m]][i]['r_list_names'].push(val[1].toString());
                        }
                    }
                }
            } else if (type === 'like') {
                updateRecHtml(r_id,comment,'like');
                var tabs = Object.keys(recommendations);
                for (var m in tabs) {
                    for (var i = 0; i < recommendations[tabs[m]].length; i++) {
                        if (recommendations[tabs[m]][i]['r_id'].toString() === r_id.toString()) {
                            recommendations[tabs[m]][i]['r_type'] = 1;
                        }
                    }
                }
            } else if (type === 'dislike') {
                updateRecHtml(r_id,comment,'dislike');
                var tabs = Object.keys(recommendations);
                for (var m in tabs) {
                    for (var i = 0; i < recommendations[tabs[m]].length; i++) {
                        if (recommendations[tabs[m]][i]['r_id'].toString() === r_id.toString()) {
                            recommendations[tabs[m]][i]['r_type'] = -1;
                        }
                    }
                }
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        }
    });
};

function updateRecHtml(r_id, val, type) {
    recs = recommendations[active_menu];
    var cards = document.getElementsByClassName("recName");
    
    for (var i = 0; i < recs.length; i++) {
        if (recs[i]['r_id'].toString() === r_id.toString()) {
            var rec = recs[i];
        }
    }
    for (var c = 0; c < cards.length; c++) {
        var disp_name = cards.item(c).innerText;
        if (disp_name === rec["r_name"]) {
            var index = c;
        }
    }

    if (type === 'comment') {
        $(".rec-comment:eq("+index.toString()+")").text(val);
    } else if (type === 'list') {
        list_id = val[0];
        list_name = val[1];
        if (rec['r_lists'] !== null && rec['r_lists'].length > 0) {
            $(".rec-lists:eq("+index.toString()+")").append("<span>, </span>");
        }
        $(".rec-lists:eq("+index.toString()+")").append("<a href=\"#\" onclick=\"loadList("+list_id.toString()+", '"+list_name+"', "+user_id.toString()+")\">#"+list_name+"</a>");
    } else if (type === 'like') {
        $(".rec-comment:eq("+index.toString()+")").text(val);
        $(".stream-item-header:eq("+index.toString()+")").prepend("<i class=\"fa fa-thumbs-up card-type thumbs-up\"/>");
    } else if (type === 'dislike') {
        $(".rec-comment:eq("+index.toString()+")").text(val);
        $(".stream-item-header:eq("+index.toString()+")").prepend("<i class=\"fa fa-thumbs-down card-type thumbs-down\"/>");        
    }
    $(".rec-date:eq("+index.toString()+")").text("Just now...");                    
}

function deleteRecommendationController(r_id) {
    $('#modal-title').empty();
    temp_recs = recommendations[active_menu];
    for (var i = 0; i < temp_recs.length; i++) {
        if (temp_recs[i]["r_id"].toString() === r_id.toString()) {
            r_name = temp_recs[i]["r_name"];
            comment = temp_recs[i]["r_comment"].replace(/'/g, "\\'");
            r_type = temp_recs[i]["r_type"];
        }
    }
    if (r_type.toString() === '1') {
        $("<h3 class=\"modal-title-header fa fa-thumbs-up\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");    
        $('#modal-title-header').append("   ");
    } else if (r_type.toString() === '-1') {
        $("<h3 class=\"modal-title-header fa fa-thumbs-down\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");            
        $('#modal-title-header').append("   ");
    } else {
        $("<h3 class=\"modal-title-header\" id=\"modal-title-header\"></h3>").appendTo("#modal-title");
    }
    $('#modal-title-header').append(r_name);
    $('#modal-body').empty();
    $('#modal-body').append("Are you sure you wish to delete this recommendation?");
    $('#modal-body').append("<textarea disabled rows=\"4\" id=\"rec-comment\">"+comment+"</textarea>");
    $('.modal-footer').empty();
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-delete\" data-dismiss=\"modal\" onClick=\"deleteRecommendation("+r_id+")\">Delete</button>");
}

function deleteRecommendation(r_id) {
    post_data = {
        r_id: r_id,
    };
    $.ajax({
        url: host_type+"://"+server_host+"/deleteRec",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function() {
            $.notify("Successfully Deleted Recommendation", {className: "success", position: "bottom center"});
            deleteRecFromList(r_id);
            if (active_menu === 'local') {
                updateProfileCounts('recs',-1);
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        }
    });
};

function deleteRecFromList(r_id) {
    temp_recs = recommendations[active_menu];
    // Remove Map Marker
    for (var i = 0; i < temp_recs.length; i++) {
        for (var j = 0; j < markers.length; j++) {
            if (temp_recs[i]['r_id'].toString() === r_id.toString() && markers[j]['title'] === temp_recs[i]['r_name']) {
                markers[j].setMap(null);
                var index = j;
                markers.splice(index,1);
                break;
            }
        }
    }

    // Remove recommendation card
    var cards = document.getElementsByClassName("recName");
    for (var i = 0; i < cards.length; i++) {
        var disp_name = cards.item(i).innerText;
        for (var j = 0; j < temp_recs.length; j++) {
            if (disp_name === temp_recs[j]["r_name"] && temp_recs[j]["r_id"].toString() === r_id.toString()) {
                $(".js-stream-item:eq("+i.toString()+")").remove();
            }
        }
    }

    // Remove recommendation from backend array
    var tabs = Object.keys(recommendations);
    for (var m in tabs) {
        for (var i = 0; i < recommendations[tabs[m]].length; i++) {
            if (recommendations[tabs[m]][i]['r_id'].toString() === r_id.toString()) {
                var index = i;
            }
        }
        recommendations[tabs[m]].splice(index,1);
    }
}