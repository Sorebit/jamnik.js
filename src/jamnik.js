var Twit = require('twit')
var fs = require('fs');
var readline = require('readline');

function rand(a, b){
	var c; if(a > b) { c = a; a = b; b = c; }
	return Math.floor(Math.random() * (b - a + 1)) + a;
}

function loadLines(filename){
	var out = [];
	console.log('Reading lines from ' + filename + '...');
	readline.createInterface({
		input: fs.createReadStream(filename),
		terminal: false
	}).on('line', function(line) {
		out.push(line);
	});
	return out;
}

var dictionary = loadLines('./dict.txt');

console.log("Done.");

var jamnik = new Twit({
	consumer_key:         'cFdf58gFVsJgCDXXrPAxo7HdP',
	consumer_secret:      'XddaaBlJ7CaGCfa3ga3JHXAGbBEcw6A1SBqQP2Ku5zlKW8CHj1',
	access_token:         '713839630702022656-SQV1u8Rtkelot1o4akkFsEYB0sW7s98',
	access_token_secret:  'rXyNqJ9ROWdeXdGD7UDhvT2GBfel0jmuQtA6Q70EzdiLL',
	timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

jamnik.screen_name = 'dHd1anN0YXJ5';

function dateTime() {
  var d = new Date(Date.now() + 1*60*60*1000);  //est timezone
  return d.getDate() + '/'
	+   (d.getUTCMonth() + 1) + ' '
	+    d.getUTCHours() + ':'
	+    d.getUTCMinutes();
};


function handleError(err) {
	if(err.code == 327)
		return;
	var d = dateTime(); 
	console.error('[' + d + '] Error', err.code);
	console.error('> response status:', err.statusCode);
	console.error('> message:', err.message);
}

// Check if word is a conjuction
function isConjuction(word){
	return ([
	'a', 'i', 'że', 'oraz', 'tudzież', 'albo',
	'bądź', 'czy', 'lub', 'ani', 'ni', 'aczkolwiek', 
	'ale', 'jednak', 'lecz', 'natomiast', 'zaś', 
	'czyli', 'mianowicie', 'dlatego', 'przeto', 'tedy', 
	'więc', 'zatem', 'toteż', 'aby', 'bo', 'choć', 'jeżeli',
	'ponieważ', 'na', 'w'].indexOf(word) >= 0);
}

// Check if you should pu a comma before word
function commaBefore(word){
	return ([
	'a', 'aby', 'ale', 'bo', 'bowiem', 'chociaż', 
	'choć', 'gdyż', 'jednak', 'jeśli', 'jeżeli',
	'lecz', 'natomiast', 'ponieważ', 'żeby', 'toteż'].indexOf(word) >= 0);

}

// Tweet specified message
function tweet(message){
	jamnik.post('statuses/update', { status: message }, function(err, data, response) {
		if(err)
			return handleError(err);
		console.log("[" + dateTime() + "] Tweet id: " + data.id);
		console.log("text: " + data.text + '\n');
	});
}

// Destroy tweet by id (It has to belong to you user)
function destroyTweet(id){
	jamnik.post('statuses/destroy/:id', { id: id }, function (err, data, response) {
		if(err)
			return handleError(err);
	console.log("Destroyed tweet: " + id + '\n');
	});
}

// Destroy all tweets which favorite count is equal to 0
// Should be fixed to use next_cursor
function destroyAllTweets(screen_name){
	var destroyed = 0;
	var destroyLoop = setInterval(function(){
		jamnik.get('statuses/user_timeline', { screen_name: screen_name, count: 200 }, function(err, data, response){
			if(err)
				return handleError(err);
			console.log("Got timeline of " + screen_name);
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
				console.log("End of timeline.");
				clearInterval(destroyLoop);
				process.exit();
			}
		});
	}, 10*1000);
}

// Construct a random proverb from 2 of those specified in dictionary
function randomProverb(){
	// Get random lines from dictionary
	var i1 = rand(0, dictionary.length);
	var i2 = rand(0, dictionary.length);
	if(i1 == i2)
		i2 = (i2 + 1) % dictionary.length;

	var p1 = dictionary[i1].split(' ');
	var p2 = (dictionary[i2].charAt(0).toLowerCase() + dictionary[i2].substr(1)).split(' ');

	// Get random amount of words from each
	var l1 = Math.max(1, rand(2, p1.length - 2));
	var l2 = Math.max(1, rand(2, p2.length - 2));

	var out = "";
	var lastConj = false;
	// Append checking for conjuctions and commas
	for(var i = 0; i < l1 + l2; ++i){
		if(i < l1){
			if(i == l1 - 1){
				lastConj = isConjuction(p1[i]);
				if(p1[i].charAt(p1[i].length-1) === ',')
					p1[i] = p1[i].substr(0, p1[i].length-1);
			}

			out += p1[i] + ' ';
		} else {
			var word = p2[i - l1 + p2.length - l2];
			if(i == l1 && isConjuction(word) && lastConj)
				word = '';
			if(i == l1 && commaBefore(word) && !lastConj)
			{
				if(out.charAt(out.length-1) === ' ')
					out = out.substr(0, out.length-1);
				word = ', ' + word;
			}
			if(out.charAt(out.length - 1) == ',')
				out = out.substr(0, out.length-1);
			out += word + ( (i >= l1 + l2 - 1) ? '' : ' ');
		}
	}
	// Add a period just because it looks good
	if(['.', '?', '!'].indexOf(out.charAt(out.length - 1)) < 0)
		out += '.';
	// Trim unwanted spaces
	while(true){
		var d = out.indexOf('  ');
		var k = out.indexOf(' .');
		var p = out.indexOf(' ,');
		if(p >= 0)
			out = out.substr(0, p) + ',' + out.substr(p + 2, out.length);
		else if(d >= 0)
			out = out.substr(0, d) + ' ' + out.substr(d + 2, out.length);
		else if(k >= 0)
			out = out.substr(0, k) + '.' + out.substr(k + 2, out.length);
		else
			break;

	}
	// Make the first character upper case
	return out.charAt(0).toUpperCase() + out.substr(1);
}

// Start following a user by id
function follow(id){
	if(id)
	jamnik.post('friendships/create', { id: id, follow: true }, function(err, data, response){
		if(err)
			return handleError(err);
		console.log('Now following: ' + data.id + " | " + data.name + '\n');
	});
}

// Retweet a tweet by id
function retweet(id){
	jamnik.post('statuses/retweet/:id', { id: id }, function(err, data, response){
		if(err)
			return handleError(err);
		console.log('Retweeted: ' + id);
		console.log('> ' + data.text + '\n');
	});	
}

// Unfollow users that don't follow you
function scrapUnfollowing(){
	// Start from current top of friends list
	var cur = -1;
	var scrapLoop = setInterval(function(){
		jamnik.get('friends/list', { count: 10, cursor: cur }, function(err, data, response){
			if(err)
				return handleError(err);
			for(var f in data.users){
				jamnik.get('friendships/show', { source_screen_name: jamnik.screen_name, target_screen_name: data.users[f].screen_name}, function(err, data, response){
					if(err){
						console.log('Error - exiting scrap loop');
						clearInterval(scrapLoop);
						return handleError(err);
					}
					if(!data.relationship.target.following)
						jamnik.post('friendships/destroy', { screen_name: data.relationship.target.screen_name }, function(err, dData, response){
							if(err){
								console.log('Destroy error - exiting scrap loop');
								clearInterval(scrapLoop);
								return handleError(err);
							}
							console.log('Scrapping ' + data.relationship.target.screen_name);
						})
					else
						console.log('Keeping ' + data.relationship.target.screen_name);
				})
			}
			console.log('Next cursor: ' + data.next_cursor_str);
			cur = data.next_cursor_str;
		});
	}, 10*1000);
}

// Main
if(process.argv.indexOf('clear') >= 0){
	console.log('Destroying all unfavorited tweets...');
	destroyAllTweets(jamnik.screen_name);
} else {
	console.log("Jamnik wystartował...");
	var tweetLoop = setInterval(function(){
		// console.log(randomProverb());
		tweet(randomProverb());
	}, 8*60*1000);
}
// Track and retweet and follow
// I don't use this anymore since it can get you blocked if done too aggresively
if(process.argv.indexOf('egzamin') >= 0){
	var stream = jamnik.stream('statuses/filter', { track: '#egzamingimnazjalny,#matura,#100rzeczyktoremniewkurwiaja' })
	stream.on('tweet', function (tweet) {
		// console.log(tweet.user);
		if(tweet.user.screen_name != jamnik.screen_name){
			// retweet(tweet.id_str);
			follow(tweet.user.id_str);
		}
	});
}

// Unfollow
if(process.argv.indexOf('scrap') >= 0){
	scrapUnfollowing();
}

// Poems WIP
if(process.argv.indexOf('poem') >= 0){

	console.log(randomProverb());
	console.log("Jamnik Andrzeja");
	console.log("randomWord()");

	var count = rand(6, 12);
	for(var i = 0; i < count; ++i){
		line = randomProverb().toLowerCase();
		console.log(line);
	}

	// process.exit();
}