/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(document).ready(function(){
    $("button").click(function(){
        $.get("http://localhost:8080/?location=test&id=yep", function(data){
            //alert("Data: " + data);
            document.getElementById("py_data").value = data;
            //$("#py_data").value=data;
        });
        
    });
});

