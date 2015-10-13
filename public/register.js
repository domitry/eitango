/*global require, module, _, d3, initialize_user*/

window.onload = function(){
    (function(session_info){
        initialize_user(session_info.image_url);

        function register(){
            var english = d3.select("#english")[0][0].value;
            var japanese = d3.select("#japanese")[0][0].value;
            var example = d3.select("#example")[0][0].value;

            if(english == "" || japanese == "")return;

            var data = {
                word: english,
                japanese: japanese
            };

            if(example != "")data.example = example;

            d3.json("register")
                .post(JSON.stringify(data), function(json, err){});
            
            d3.select("#english")[0][0].value="";
            d3.select("#japanese")[0][0].value="";
            d3.select("#example")[0][0].value="";
        }

        d3.select("#next_button")
            .on("click", function(){
                register();
            });

        d3.select("form")
            .on("submit", function(){
                d3.event.preventDefault();
                register();
            });

    })(window.session_info);
};
