/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(document).ready(function(){
    $("send-get").click(function(){
        $.get("http://localhost:8080/data-api/?location=test&id=yep", function(data){
            //alert("Data: " + data);
            document.getElementById("py_data").value = data;
        });
    });
});

//function sendData($rec_object) {
function sendData() {
    //console.log(rec_object)
    var comment = document.getElementById("rec-comment").value;
    console.log(comment);
    rec_object["comment"] = comment;
    $.ajax({
        url: 'http://localhost:8080/data-api',
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
