/*global require, module, _, d3, initialize_user*/

window.onload = function(){
    (function(session_info){
        var svg = d3.select("svg");
        var rad = _.min([window.innerHeight, window.innerWidth])/4;
        var padding = rad/5;

        svg.attr({
            height: rad + padding*2,
            width: rad*3 + padding*4
        });

        var data = [
            {name: "自主練", link: "user_problem", i: 0, description: "自分で登録した単語をテストする."},
            {name: "大会", link: "global_problem", i: 1, description: "他の人が登録した単語をテストする."},
            {name: "単語を登録", link: "register_word", i: 2, description: "新しい単語を追加する."}
        ];

       var gs = svg
               .selectAll("g")
               .data(data)
               .enter()
               .append("g");

        gs
            .append("circle")
            .attr({
                cx: function(d){return rad*d.i + rad/2 + padding*(d.i+1);},
                cy: rad/2 + padding,
                r: rad/2,
                fill: "#86B397",
                stroke: "#548072",
                "stroke-width": 3
            })
            .style("cursor", "pointer")
            .on("mouseover", function(d){
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr("r", 1.1*(rad/2));

                d3.select("#description")
                    .text(d.description);
            })
            .on("mouseout", function(){
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr("r", rad/2);

                d3.select("#description")
                    .text(" ");
            })
            .on("click", function(d){
                window.location = "/" + d.link;
            });

        gs
            .append("text")
            .attr({
                x: function(d){return rad*d.i + rad/2 + padding*(d.i+1);},
                y: rad/2 + padding,
                "text-anchor": "middle",
                "dominant-baseline": "middle",
                "font-size": "20px"
            })
            .text(function(d){return d.name;});


        if(session_info.login){
            initialize_user(session_info.image_url);
            d3.select("#description").text(" ");
        }else{
            d3.select("svg").style("display", "none");
            d3.select("#login_area").style("display", "table");

            d3.select("#twitter_button")
                .style("cursor", "pointer")
                .on("click", function(){
                    d3.select("#dialog_area")
                        .style("display", "table");

                    d3.json("/begin_authorize.json", function(err, json){
                        d3.select("#dialog")
                            .select("a")
                            .attr("href", json.url);
                    });
                });

            d3.select("form")
                .on("submit", function(){
                    var pin = d3.select("input")[0][0].value;
                    d3.event.preventDefault();
                    
                    d3.json("/complete_authorize.json?pin=" + pin, function(err, json){
                        d3.select("#login_area").style("display", "none");
                        d3.select("#dialog_area").style("display", "none");
                        d3.select("svg").style("display", "inline");
                        d3.select("#description").text("");
                        
                        initialize_user(json.image_url);
                    });
                });
        }
    })(window.session_info);
};
