/*global require, module, _, d3*/

function initialize_user(image_url){
    d3.select("#user_area").style("display", "table");

    d3.select("#user_icon")
        .select("img")
        .attr("src", image_url);
    
    d3.select("#logout")
        .style("cursor", "pointer")
        .on("click", function(){
            window.location = "logout";
        });
}
