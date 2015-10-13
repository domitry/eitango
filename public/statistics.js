/*global require, module, _, d3, initialize_user*/

window.onload = function(){
    (function(session_info){
        initialize_user(session_info.image_url);
        d3.json("statistics.json", function(err, json){
            var svg = d3.select("svg");
            var svg_width = svg[0][0].offsetWidth;
            var svg_height = svg[0][0].offsetHeight;
            var rect_height = 50;
            var rect_width = svg_width*0.8;
            var solve_per = json.solved_num/json.num;
            var rect_x = svg_width/2 - rect_width/2;
            var rect_y = svg_height/2 - rect_height/2;
            
            svg
                .append("rect")
                .attr({
                    x: rect_x,
                    y: rect_y,
                    width: rect_width,
                    height: rect_height,
                    fill: "#66c2a5"
                });

            svg
                .append("rect")
                .attr({
                    x: rect_x,
                    y: rect_y,
                    width: 0,
                    height: rect_height,
                    fill: "#fc8d62"
                })
                .transition()
                .duration(300)
                .attr("width", rect_width*solve_per);

            svg
                .append("text")
                .attr({
                    x: rect_x,
                    y: rect_y + rect_height,
                    "dominant-baseline": "text-before-edge"
                })
                .text("solved");

            svg
                .append("text")
                .attr({
                    x: rect_x + rect_width,
                    y: rect_y + rect_height,
                    "text-anchor": "end",
                    "dominant-baseline": "text-before-edge"
                })
                .text("unsolved");

            d3.select("#username").text("@" + session_info.name);
            d3.select("#solved_value").text(json.solved_num);
            d3.select("#unsolved_value").text(json.num - json.solved_num);
        });
    })(window.session_info);
}
