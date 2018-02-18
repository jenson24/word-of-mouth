/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function editRecommendationController(r_id, comment, r_name, r_type) {
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
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-save\" data-dismiss=\"modal\" onClick=\"editRecommendation("+r_id+")\">Send</button>");
}

function editRecommendation(r_id, val, type) {
    //console.log(recObj)
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
        url: "http://"+server_host+":8080/editRec",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function() {
            $.notify("Successfully Updated Recommendation", {className: "success", position: "bottom center"});
            if (type === 'comment') {
                updateRecHtml(r_id,comment,'comment');
            } else if (type === 'list') {
                updateRecHtml(r_id,val,'list');
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        }
    });
};

function updateRecHtml(r_id, val, type) {
    if (active_menu === 'local') {
        recs = fetched_my_recommendations;
    } else {
        recs = fetched_all_recommendations;
    }
    for (var i = 0; i < recs.length; i++) {
        rec = recs[i];
        if (rec['r_id'] === r_id) {
            if (type === 'comment') {
                //console.log("Updated Rec "+r_id.toString()+" to comment "+val);
                $(".rec-comment:eq("+i.toString()+")").text(val);
                $(".rec-date:eq("+i.toString()+")").text("Just now...");                    
            } else if (type === 'list') {
                list_id = val[0];
                list_name = val[1];
                //$(".rec-lists:eq("+i.toString()+")").empty();
                if (rec['r_lists'] !== null && rec['r_lists'].length > 0) {
                    $(".rec-lists:eq("+i.toString()+")").append("<span>, </span>");
                }
                $(".rec-lists:eq("+i.toString()+")").append("<a href=\"#\" onclick=\"loadList("+list_id.toString()+", '"+list_name+"', "+user_id.toString()+")\">#"+list_name+"</a>");
                $(".rec-date:eq("+i.toString()+")").text("Just now...");                    
            }
        }
    }
}

function deleteRecommendationController(r_id, comment, r_name, r_type) {
    $('.temp-modal-title').empty();
    if (r_type === '1') {
        $("<h3 class=\"modal-title fa fa-thumbs-up\" id=\"modal-title\"></h3>").appendTo(".temp-modal-title");    
    } else {
        $("<h3 class=\"modal-title fa fa-thumbs-down\" id=\"modal-title\"></h3>").appendTo(".temp-modal-title");            
    }
    $('.modal-title').append("   ");
    $('.modal-title').append(r_name);
    $('#modal-body').empty();
    $('#modal-body').append("Are you sure you wish to delete this recommendation?");
    $('#modal-body').append("<textarea rows=\"4\" id=\"rec-comment\">"+comment+"</textarea>");
    $('.modal-footer').empty();
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-cancel\" data-dismiss=\"modal\">Cancel</button>");
    $('.modal-footer').append("<button type=\"button\" class=\"btn btn-delete\" data-dismiss=\"modal\" onClick=\"deleteRecommendation("+r_id+")\">Delete</button>");
}

function deleteRecommendation(r_id) {
    post_data = {
        r_id: r_id,
    };
    $.ajax({
        url: "http://"+server_host+":8080/deleteRec",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function() {
            $.notify("Successfully Deleted Recommendation", {className: "success", position: "bottom center"});
            //if (active_menu === 'local') {
            deleteRecFromList(r_id);
            //}
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        }
    });
};

function deleteRecFromList(r_id) {
    for (var i = 0; i < recommendations['recommendations'].length; i++) {
        rec = recommendations['recommendations'][i];
        if (rec['r_id'] === r_id) {
            delete recommendations['recommendations']['r_id'];
            $(".js-stream-item:eq("+i.toString()+")").remove();
        }
        for (var j = 0; j < markers.length; j++) {
            if (rec['r_id'].toString() === r_id && markers[j]['title'] === rec['r_name'].toString()) {
                markers[j].setMap(null);
                delete markers[j];
            }
        }
    }
}