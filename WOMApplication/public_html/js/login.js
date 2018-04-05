/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function enableJoin() {
    $('#joinModal').modal('show');
}

function joinWom() {
    var first_name = $("#join-fname").val().trim();
    var last_name = $("#join-lname").val().trim();
    var email = $("#join-email").val().trim();
    var uname = $("#join-uname").val().trim();
    var pwd1 = $("#join-pwd1").val().trim();
    var pwd2 = $("#join-pwd2").val().trim();
    bad_chars = ['<','>','%','=',' '];
    valid_fields = true;
    for (i=0; i < bad_chars.length; i++) {
        if (bad_chars[i] !== ' ' && first_name.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad first name", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (bad_chars[i] !== ' ' && last_name.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad last name", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (email.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad email", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (uname.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad username", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (pwd1.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad pwd1", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (pwd2.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad pwd2", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
    }
    if (pwd1 !== pwd2) {
        valid_fields = false;
        alert("Passwords do not match");
        $('#joinModal').modal('show');
    }
    if (valid_fields) {
        result = createUser(first_name, last_name, email, uname, pwd1);
    }
}
function cancelJoin() {
    $('#loginModal').modal('show');
}

function createUser(first_name, last_name, email, uname, pwd) {
    post_data = {
        fname: first_name,
        lname: last_name,
        email: email,
        uname: uname,
        password: pwd
    };
    //console.log(post_data);
    $.ajax({
        url: host_type+"://"+server_host+"/createUser",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function(create_result) {
            //console.log(create_result);
            if (create_result !== 'invalid') {
                $.notify("Created User", {className: "success", position: "bottom center"});
                user_id = parseInt(create_result);
                current_user = user_id;
                username = uname;
                loadDefaultProfile();
            } else {
                alert("Invalid username and password provided");
                $('#joinModal').modal('show');
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}

function showLoginModal() {
    $('#loginModal').modal('show');
}
function login() {
    var uname = $("#login-uname").val();
    var pword = $("#login-pwd").val();
    var auth_object = {
        'uname': uname,
        'password': pword
    };
    $.ajax({
        url: host_type+"://"+server_host+"/auth",
        type: 'POST',
        data: JSON.stringify(auth_object),
        dataType: 'json',
        success: function(result) {
            $.notify("Logged In", {className: "success", position: "bottom center"});
            if(result['status'] === 'ok') {
                user_id = result['user_id'].toString();
                current_user = user_id;
                username = result['username'];
                user_role = result['user_role'];
                document.cookie = "username="+username+"; path=/;";
                document.cookie = "user_id="+user_id+"; path=/;";
                document.cookie = "user_role="+user_role+"; path=/;";
                page = 1;
                login_html = "<span>Logged in as </span><a href=\"#\" class=\"login-link\">"+username+"</a><span>. </span><a href=\"#\" class=\"login-link\" onClick=\"logout()\">Logout</a>"
                setRecommendations('global','new','new');
                $('a.icon-select.global').addClass('active');
                $('.login-info-bar').empty();
                $('.login-info-bar').append(login_html);
                $('#splashModal').modal('show');
            } else {
                error_msg = result['status'];
                $('#loginModal').modal('show');
                alert(error_msg);
            };
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        }
    });
}
function logout() {
    user_id = '';
    username = '';
    deleteCookie('user_id');
    deleteCookie('username');
    console.log(document.cookie);
    location.reload();
}
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
function deleteCookie( name ) {
    cookie_str = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
    document.cookie = cookie_str;
}
function toggleForgotPassword() {
    console.log("click");
    var x = document.getElementById("forgot-password-text");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}
function checkNewPassword() {
    var uname = $("#reset-uname").val().trim();
    var temp_pwd = $("#reset-pwd").val().trim();
    var pwd1 = $("#reset-pwd1").val().trim();
    var pwd2 = $("#reset-pwd2").val().trim();
    bad_chars = ['<','>','%','=',' '];
    valid_fields = true;
    for (i=0; i < bad_chars.length; i++) {
        if (uname.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad username", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (temp_pwd.indexOf(bad_chars[i]) > -1) {
            $.notify("Incorrect Temporary Password", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (pwd1.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad Password", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
        if (pwd2.indexOf(bad_chars[i]) > -1) {
            $.notify("Bad Password", {className: "failure", position: "bottom center"});
            valid_fields = false;
        }
    }
    if (pwd1 !== pwd2) {
        valid_fields = false;
        alert("Passwords do not match");
        $('#resetPasswordModal').modal('show');
    }
    if (valid_fields) {
        result = resetPassword(uname, temp_pwd, pwd1);
    }
}
function resetPassword(uname, temp_pwd, pwd) {
    post_data = {
        uname: uname,
        temp_pwd: temp_pwd,
        password: pwd
    };
    //console.log(post_data);
    $.ajax({
        url: host_type+"://"+server_host+"/resetPassword",
        type: 'POST',
        data: JSON.stringify(post_data),
        dataType: 'text',
        success: function(result) {
            //console.log(create_result);
            if (result !== 'invalid') {
                $.notify("Successfully Changed Password", {className: "success", position: "bottom center"});
                $.notify("Please login with the new password", {className: "success", position: "bottom center"});
                $('#loginModal').modal('show');
            } else {
                alert("Invalid username and password provided");
                $('#joinModal').modal('show');
            }
        },
        error: function(jqXHR, exception) {
            errorHandling(jqXHR, exception);
        },
        async: false
    });
}
function enableResetPwdModal() {
    $('#resetPasswordModal').modal('show');
}