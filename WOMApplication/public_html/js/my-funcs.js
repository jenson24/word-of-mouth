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

function sendData($rec_object) {
    $.ajax({
        url: 'http://localhost:8080/data-api',
        type: 'POST',
        data: JSON.stringify($rec_object),
        dataType: 'json'
    }).then(function(data) {
            $('#py_data').val(data);
    });
}
