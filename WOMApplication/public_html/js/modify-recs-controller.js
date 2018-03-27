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

    $('.temp-modal-title').empty();
    if (r_type === '1') {
        $("<h3 class=\"modal-title fa fa-thumbs-up\" id=\"modal-title\"></h3>").appendTo(".temp-modal-title");    
    } else {
        $("<h3 class=\"modal-title fa fa-thumbs-down\" id=\"modal-title\"></h3>").appendTo(".temp-modal-title");            
    }
    $('.modal-title').append("   ");
    $('.modal-title').append(r_name);
    $('#modal-body').empty();
    $('#modal-body').append("Edit comment...");
    $('#modal-body').append("<textarea rows=\"4\" id=\"rec-comment\">"+comment+"</textarea>");
    $('.modal-footer').empty();
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-save\" data-dismiss=\"modal\" onClick=\"editRecommendation("+r_id+",'','comment')\">Send</button>");
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
                tabs = ['local','global','aroundMe','searchRecs'];
                for (var m in tabs) {
                    for (var i = 0; i < recommendations[tabs[m]].length; i++) {
                        if (recommendations[tabs[m]][i]['r_id'].toString() === r_id.toString()) {
                            recommendations[tabs[m]][i]['r_lists'].push(val[0].toString());
                            recommendations[tabs[m]][i]['r_list_names'].push(val[1].toString());
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
        $(".rec-date:eq("+index.toString()+")").text("Just now...");                    
    } else if (type === 'list') {
        list_id = val[0];
        list_name = val[1];
        if (rec['r_lists'] !== null && rec['r_lists'].length > 0) {
            $(".rec-lists:eq("+index.toString()+")").append("<span>, </span>");
        }
        $(".rec-lists:eq("+index.toString()+")").append("<a href=\"#\" onclick=\"loadList("+list_id.toString()+", '"+list_name+"', "+user_id.toString()+")\">#"+list_name+"</a>");
        $(".rec-date:eq("+index.toString()+")").text("Just now...");                    
    }
}

function deleteRecommendationController(r_id) {
    $('.temp-modal-title').empty();
    temp_recs = recommendations[active_menu];
    for (var i = 0; i < temp_recs.length; i++) {
        if (temp_recs[i]["r_id"].toString() === r_id.toString()) {
            r_name = temp_recs[i]["r_name"];
            comment = temp_recs[i]["r_comment"].replace(/'/g, "\\'");
            r_type = temp_recs[i]["r_type"];
        }
    }
    if (r_type === '1') {
        $("<h3 class=\"modal-title fa fa-thumbs-up\" id=\"modal-title\"></h3>").appendTo(".temp-modal-title");    
    } else {
        $("<h3 class=\"modal-title fa fa-thumbs-down\" id=\"modal-title\"></h3>").appendTo(".temp-modal-title");            
    }
    $('.modal-title').append("   ");
    $('.modal-title').append(r_name);
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
    tabs = ['local','global','aroundMe','searchRecs'];
    for (var m in tabs) {
        for (var i = 0; i < recommendations[tabs[m]].length; i++) {
            if (recommendations[tabs[m]][i]['r_id'].toString() === r_id.toString()) {
                var index = i;
            }
        }
        recommendations[tabs[m]].splice(index,1);
    }
}