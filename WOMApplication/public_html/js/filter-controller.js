/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function showFilters() {
    if ( $('.filter-content').css('display') === 'none' ) {
        //$('.fa-ban').css('visibility','visible');
        $('.filter-content').css('display','block');
        if (active_menu === 'local') {
            $('#scroll').css("height","calc( 100% - 92px - 32px - 52px - 24px )");            
        } else {
            $('#scroll').css("height","calc( 100% - 92px - 32px - 24px )");        
        }
        type_list = getTypes();
        var options = $("#type-list");
        options.empty();
        options.append($("<option />").val("None").text(""));            
        for (var i = 0; i < type_list.length; i++) {
            options.append($("<option />").val(type_list[i]).text(type_list[i].replace(/_/g," ")));            
        }
        if (typeSelection !== "") {
            var element = document.getElementById('type-list');
            element.value = typeSelection;            
        }
    } else {
        $('.fa-ban').css('visibility','hidden');
        typeSelection = document.getElementById("type-list").value;
        $('.filter-content').css('display','none');
        if (active_menu === 'local') {
            $('#scroll').css("height","calc( 100% - 92px - 32px - 52px)");            
        } else {
            $('#scroll').css("height","calc( 100% - 92px - 32px)");        
        }
    }
};
function filter_by_type(all_recs, recType) {
    if (recType !== "None") {
        new_filtered_objects = [];
        for (var i = 0; i < all_recs.length; i++) {
            if (all_recs[i]["r_google_type"].indexOf(recType) !== -1) {
                new_filtered_objects.push(all_recs[i]);
            }
        }
        return new_filtered_objects;
    } else {
        return all_recs;
    }
}

function filter_by_rating(all_recs, rating) {
    new_filtered_objects = [];
    for (var i = 0; i < all_recs.length; i++) {
        if (parseFloat(all_recs[i]["r_google_rating"]) > rating) {
            new_filtered_objects.push(all_recs[i]);
        }
    }
    return new_filtered_objects;
}

function filter_by_price(all_recs, price) {
    new_filtered_objects = [];
    for (var i = 0; i < all_recs.length; i++) {
        if ('r_price' in all_recs[i] && all_recs[i]["r_price"] === price) {
            new_filtered_objects.push(all_recs[i]);
        } else if (all_recs[i]["r_price"] === null && price === 1) {
            new_filtered_objects.push(all_recs[i]);
        }
    }
    return new_filtered_objects;
}
function filter_controller(price, rating, type) {
    all_recs = recommendations[active_menu];
    if (price === "") {
        price_filter = 0;
        dollar_ids = ["dollar1","dollar2","dollar3","dollar4"];
        for (var i = 0; i < dollar_ids.length; i++) {
            if($("#"+dollar_ids[i]).is(':checked')) { 
                price_filter = i+1; 
            }
        }
        if (price_filter !== 0) {
            price_filtered_objects = filter_by_price(all_recs, price_filter);
        } else {
            price_filtered_objects = all_recs;
        }
    } else {
        price_filtered_objects = filter_by_price(all_recs, price);
        $('.fa-ban').css('visibility','visible');
    }
    if (rating === "") {
        rating_filter = 0;
        star_ids = ["starhalf","star1","star1half","star2","star2half","star3","star3half","star4","star4half","star5"];
        star_vals = [0.5,1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0];
        for (var i = 0; i < star_ids.length; i++) {
            if($("#"+star_ids[i]).is(':checked')) { 
                rating_filter = star_vals[i]; 
            }
        }
        if (rating_filter !== 0) {
            rating_filtered_objects = filter_by_rating(price_filtered_objects, rating_filter);
        } else {
            rating_filtered_objects = price_filtered_objects;
        }
    } else {
        rating_filtered_objects = filter_by_rating(price_filtered_objects, rating);
        $('.fa-ban').css('visibility','visible');
    }
    if (type === "") {
        typeFilter = $('#type-list option:selected').val();
        if (typeFilter !== "None") {
            type_filtered_objects = filter_by_type(rating_filtered_objects, typeFilter);
        } else {
            type_filtered_objects = rating_filtered_objects;
        }
    } else {
        type_filtered_objects = filter_by_type(rating_filtered_objects, type);        
        $('.fa-ban').css('visibility','visible');
    }
    setRecommendations(active_menu,type_filtered_objects,'new');
}
function checkFilters() {
    filt = false;
    dollar_ids = ["dollar1","dollar2","dollar3","dollar4"];
    for (var i = 0; i < dollar_ids.length; i++) {
        if($("#"+dollar_ids[i]).is(':checked')) { 
            filt = true; 
        }
    }
    star_ids = ["starhalf","star1","star1half","star2","star2half","star3","star3half","star4","star4half","star5"];
    for (var i = 0; i < star_ids.length; i++) {
        if($("#"+star_ids[i]).is(':checked')) { 
            filt = true; 
        }
    }
    typeFilter = $('#type-list option:selected').val();
    if (typeof typeFilter === 'undefined' || !typeFilter){
        //test = 'test';
    } else {
        if (typeFilter !== "None") {
            filt = true;
        }   
    }
    return filt;
}
function clearFilters() {
    $('.price-radio').prop('checked', false);
    $('.rating-radio').prop('checked', false);
    $(".type-list").val("None");
    $('.fa-ban').css('visibility','hidden');
}
function removeFilters() {
    clearFilters();
    setRecommendations(active_menu,recommendations[active_menu],'new');
}
