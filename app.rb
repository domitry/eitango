require 'sinatra/base'
require 'redis'
require 'oauth'
require 'json'
require_relative './secret.rb'

module Eitango
  class WebApp < Sinatra::Base
    enable :sessions

    helpers do
      def authorized?
        !(session[:screen_name].nil?)
      end

      def authorize_required
        redirect "/" unless authorized?
      end

      def parameter_required(*names)
        halt 400, "The request lacks some parameters." unless names.all?{|name| !(params[name].nil?)}
      end

      def json_to_params(str)
        json = JSON.parse(str, symbolize_names: true)
        params.merge!(json)
      end

      def get_consumer
        OAuth::Consumer.new(CONSUMER_KEY, CONSUMER_KEY_SECRET, {site: "https://api.twitter.com"})
      end

      def get_current_user_info(atoken)
        res = atoken.request(:get, "https://api.twitter.com/1.1/account/verify_credentials.json")
        json = JSON.parse(res.body)
        {
          screen_name: json["screen_name"],
          image_url: json["profile_image_url"]
        }
      end

      def get_session_json
        {
          login: !(session[:screen_name].nil?),
          name: session[:screen_name],
          image_url: session[:image_url]
        }.to_json
      end

      def key_global_set
        "global_problems"
      end

      def key_user_set_all
        "user_problems_all_"+session[:screen_name]
      end

      def key_user_set_unfinished
        "user_problems_unfinished_"+session[:screen_name]
      end

      def key_japanese(word)
        "japanese_"+word
      end

      def key_examples(word)
        "examples_"+word
      end

      def words_json(words)
        jps =[]; exps=[];
        unless(words.length==0)
          jps = db.mget(*(words.map{|word| key_japanese(word)}))
          exps = db.mget(*(words.map{|word| key_examples(word)}))
        end
        {
          num: jps.length,
          contents: words.map.with_index {|word, i|
            {
              word: word,
              japanese: jps[i],
              example: (exps[i].nil? ? "" : exps[i])
            }
          }
        }.to_json
      end

      def db
        Redis.current
      end
    end
    
    configure do
      Redis.new(path: PATH_TO_REDIS, db: REDIS_DB_NUM)
    end

    get '/' do
      erb :index, {locals: {
          json: get_session_json
        }
      }
    end

    get '/logout' do
      session.clear
      redirect '/'
    end

    get '/user_problem' do
      authorize_required
      erb :problem, {locals: {
          json: get_session_json,
          type: "user"
        }}
    end

    get '/global_problem' do
      authorize_required
      erb :problem, {locals: {
          json: get_session_json,
          type: "global"
        }}
    end

    get '/register_word' do
      authorize_required
      erb :register, {locals: {
          json: get_session_json
        }}
    end

    get '/begin_authorize.json' do
      rtoken = get_consumer.get_request_token
      session[:oauth_token] = rtoken.token
      session[:oauth_secret] = rtoken.secret
      {
        url: rtoken.authorize_url
      }.to_json
    end

    get '/complete_authorize.json' do
      parameter_required :pin

      if session[:oauth_token].nil? || session[:oauth_secret].nil? || params[:pin].nil?
        halt 404, "Restart login."
      end

      rtoken = OAuth::RequestToken.new(get_consumer, session[:oauth_token], session[:oauth_secret])
      begin
        atoken = rtoken.get_access_token(oauth_verifier: params["pin"])
        info = get_current_user_info(atoken)
        session.merge!(info)
        session.delete(:oauth_token)
        session.delete(:oauth_secret)
        {
          authorized: true,
          screen_name: info[:screen_name],
          image_url: info[:image_url]
        }.to_json
      rescue OAuth::Unauthorized => e
        halt 400, "Invalid PIN."
      end
    end

    get '/global_problem.json' do
      authorize_required
      parameter_required :length
      words_json(db.srandmember(key_global_set, params[:length]))
    end

    get '/user_problem.json' do
      authorize_required
      parameter_required :length
      if params[:type] == "all"
        words_json(db.srandmember(key_user_set_all, params[:length]))
      else
        words_json(db.srandmember(key_user_set_unfinished, params[:length]))
      end
    end

    get '/statistics.json' do
      authorize_required
      num_all = db.scard(key_user_set_all)
      {
        num: num_all,
        solved_num: num_all - db.scard(key_user_set_unfinished)
      }.to_json
    end

    post '/result' do
      authorize_required
      json_to_params(request.body.read)
      parameter_required :solved, :unsolved

      solved = params[:solved]
      unsolved = params[:unsolved]
      db.srem(key_user_set_unfinished, solved) if solved.length > 0
      unless params[:global].nil?
        db.sadd(key_user_set_all, solved+unsolved) 
        db.sadd(key_user_set_unfinished, unsolved)
      end
      status 200
    end
    
    post '/register' do
      authorize_required
      json_to_params(request.body.read)
      parameter_required :word, :japanese
      
      word = params[:word]
      db.set(key_japanese(word), params[:japanese])
      db.set(key_examples(word), params[:example]) unless params[:example].nil?
      db.sadd(key_user_set_all, word)
      db.sadd(key_user_set_unfinished, word)
      db.sadd(key_global_set, word)
      status 200
    end
  end
end
