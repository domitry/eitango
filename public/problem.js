/*global require, module, _, d3, initialize_user*/

window.onload = function(){
    (function(session_info, problem_type){
        initialize_user(session_info.image_url);
        var url = problem_type + "_problem.json";// global or user
        
        d3.json(url + "?length=30&type=unfinished", function(err, json){
            var num = json.num;
            var contents = json.contents;
            var results = [];
            var cnt=-1;

            function next(){
                if(results.length>0)
                    results[results.length-1]["value"] = d3.select("#answer")[0][0].value;
                
                d3.select("#answer")[0][0].value = "";

                if(++cnt >= num){
                    finish();
                    return;
                }

                var content = contents[cnt];
                d3.select("#problem_num").text((cnt+1) + "/" + num);
                
                var max = (content.example!="" ? 3 : 2);
                var val = Math.floor(Math.random()*max);
                var word="", text="", answer="";

                switch(val){
                    case 0:
                    word = content.japanese;
                    text = "日本語を英語に直しなさい。";
                    answer = content.word;
                    break;
                    case 1:
                    word = content.word;
                    text = "英語を日本語に直しなさい。";
                    answer = content.japanese;
                    break;
                    case 3:
                    word = content.example.replace(word, "<word>");
                    text = "<word>に当てはまる語を答えなさい。";
                    answer = content.word;
                    break;
                }

                d3.select("#problem_text").text(text);
                d3.select("#problem_word").text(word);
                results.push({
                    problem: word,
                    type: val,
                    answer: answer,
                    word: content.word
                });
            }

            function finish(){
                var table = _.map(results, function(row){
                    return {
                        correct: (row.answer == row.value),
                        answer: row.answer,
                        value: row.value,
                        word: row.word,
                        problem: row.problem
                    };
                });

                var score = _.reduce(table, function(val, row){
                    return (row.correct ? val+1 : val);
                }, 0);

                d3.select("#problem").style("display", "none");
                d3.select("#score").style("display", "block");

                d3.select("score")
                    .append("div")
                    .style("text-align", "right")
                    .text(score + "/" + num);

                var tb = d3.select("#score")
                        .append("table")
                        .attr("id", "result_table");

                var tr = tb.append("tr");
                tr.append("th").text("O/X");
                tr.append("th").text("problem");
                tr.append("th").text("your answer");
                tr.append("th").text("correct answer");

                tr = tb
                    .selectAll("tr")
                    .data(table)
                    .enter()
                    .append("tr");

                tr.append("td")
                    .text(function(d){return (d.correct ? "O" : "X");});

                tr.append("td")
                    .text(function(d){return d.problem;});

                tr.append("td")
                    .text(function(d){return d.value;});
                
                tr.append("td")
                    .text(function(d){return d.answer;});

                d3.select("#next_button")
                    .on("click", function(){
                        var post_data = {
                            solved: _.map(_.select(table, function(row){
                                return row.correct;
                            }), function(d){return d.word;}),
                            unsolved: _.map(_.select(table, function(row){
                                return !(row.correct);
                            }), function(d){return d.word;})
                        };

                        var url="result" + (problem_type=="global" ? "?global=true" : "");

                        d3.json(url).post(JSON.stringify(post_data), function(){
                            window.location = "/";
                        });
                    });
            }

            d3.select("form")
                .on("submit", function(){
                    d3.event.preventDefault();
                    next();
                });

            d3.select("#next_button")
                .on("click", function(){
                    next();
                });

            next();
        });
    })(window.session_info, window.problem_type);
};
