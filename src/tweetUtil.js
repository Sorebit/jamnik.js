'use strict';

var TweetUtil = function(){};
const Util = require(__dirname + '/util.js')

// Tweet specified message
TweetUtil.tweet = function(jamnik, message){
  jamnik.post('statuses/update', { status: message }, function(err, data, response) {
    if(err) {
      return handleError(err);
    }
    Util.log('Success');
    Util.log('Tweet id: ' + data.id);
    Util.log('=>  text: ' + data.text + '\n');
  });
}

// Destroy tweet by id (It has to belong to you user)
// WARNING: Not tested since forever
TweetUtil.destroyTweet = function(jamnik, id){
  jamnik.post('statuses/destroy/:id', { id: id }, function (err, data, response) {
    if(err) {
      return handleError(err);
    }
  Util.log("Destroyed tweet: " + id + '\n');
  });
}

// Destroy all tweets which favorite count is equal to 0
// Should be fixed to use next_cursor
// WARNING: Not tested since forever
TweetUtil.destroyAllTweets = function(jamnik, screen_name){
  var destroyed = 0;
  var destroyLoop = setInterval(function(){
    jamnik.get('statuses/user_timeline', { screen_name: screen_name, count: 200 }, function(err, data, response){
      if(err) {
        return handleError(err);
      }
      Util.log("Got timeline of " + screen_name);
      // console.log(data);
      for(var t in data){
        id = data[t].id_str;
        if(data[t].favorite_count === 0)
        {
          destroyTweet(id);
          ++destroyed;
        }
      }
      if(destroyed === 0) {
        Util.log("End of timeline.");
        clearInterval(destroyLoop);
        process.exit();
      }
    });
  }, 10*1000);
}

// Start following a user by id
// WARNING: Not tested since forever
TweetUtil.follow = function(jamnik, id){
  if(id)
  jamnik.post('friendships/create', { id: id, follow: true }, function(err, data, response){
    if(err) {
      return handleError(err);
    }
    Util.log('Now following: ' + data.id + " | " + data.name + '\n');
  });
}

// Retweet a tweet by id
// WARNING: Not tested since forever
TweetUtil.retweet = function(jamnik, id){
  jamnik.post('statuses/retweet/:id', { id: id }, function(err, data, response){
    if(err) {
      return handleError(err);
    }
    Util.log('Retweeted: ' + id);
    Util.log('> ' + data.text + '\n');
  }); 
}

// Unfollow users that don't follow you
// WARNING: Not tested since forever
TweetUtil.scrapUnfollowing = function(jamnik){
  // Start from current top of friends list
  var cur = -1;
  var scrapLoop = setInterval(function(){
    jamnik.get('friends/list', { count: 10, cursor: cur }, function(err, data, response){
      if(err) {
        return handleError(err);
      }
      for(var f in data.users){
        jamnik.get('friendships/show', { source_screen_name: jamnik.screen_name, target_screen_name: data.users[f].screen_name}, function(err, data, response){
          if(err){
            Util.log('Error - exiting scrap loop');
            clearInterval(scrapLoop);
            return handleError(err);
          }
          if(!data.relationship.target.following)
            jamnik.post('friendships/destroy', { screen_name: data.relationship.target.screen_name }, function(err, dData, response){
              if(err){
                Util.log('Destroy error - exiting scrap loop');
                clearInterval(scrapLoop);
                return handleError(err);
              }
              Util.log('Scrapping ' + data.relationship.target.screen_name);
            })
          else
            Util.log('Keeping ' + data.relationship.target.screen_name);
        })
      }
      Util.log('Next cursor: ' + data.next_cursor_str);
      cur = data.next_cursor_str;
    });
  }, 10*1000);
}

module.exports = TweetUtil;