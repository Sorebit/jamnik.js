var Twit = require('twit')
var fs = require('fs');
var readline = require('readline');

function rand(a, b){
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

var przyslowia = loadLines('./przyslowia.txt');

console.log("Done.");

var jamnik = new Twit({
	consumer_key:         '',
	consumer_secret:      '',
	access_token:         '',
	access_token_secret:  '',
	timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

function handleError(err) {
	console.error('Error', err.code);
	console.error('> response status:', err.statusCode);
	console.error('> message:', err.message);
}

function isConjuction(word){
	return (['a', 'i', 'że', 'oraz', 'tudzież', 'albo',
	'bądź', 'czy', 'lub', 'ani', 'ni', 'aczkolwiek', 
	'ale', 'jednak', 'lecz', 'natomiast', 'zaś', 
	'czyli', 'mianowicie', 'dlatego', 'przeto', 'tedy', 
	'więc', 'zatem', 'toteż', 'aby', 'bo', 'choć', 'jeżeli',
	'ponieważ', 'na', 'w'].indexOf(word) >= 0);
}

function commaBefore(word){
	return (['a', 'aby', 'ale', 'bo', 'bowiem', 'chociaż', 
			'choć', 'gdyż', 'jednak', 'jeśli', 'jeżeli',
			'lecz', 'natomiast', 'ponieważ', 'żeby', 'toteż'].indexOf(word) >= 0);

}

function tweet(message){
	jamnik.post('statuses/update', { status: message }, function(err, data, response) {
		if(err)
			return handleError(err);
		// console.log(data);
		console.log("Tweet id: " + data.id);
		console.log("text: " + data.text);
	});
}

function destroyTweet(id, force){
	jamnik.post('statuses/destroy/:id', { id: id }, function (err, data, response) {
		if(err)
			return handleError(err);
	console.log("Destroyed tweet: " + id);
	});
}

function destroyAllTweets(screen_name){
	var destroyLoop = setInterval(function(){
		jamnik.get('statuses/user_timeline', { screen_name: screen_name, count: 200 }, function(err, data, response){
			if(err)
				return handleError(err);
			console.log("Got timeline of " + screen_name);
			// console.log(data);f
			if(data.length <= 0){
				console.log("End of timeline.");
				clearInterval(destroyLoop);
			}
			for(var t in data){
				id = data[t].id_str;
				if(data[t].favorite_count === 0)
					destroyTweet(id);
			}
		});
	}, 5*1000);
}

function randomProverb(){
	var i1 = rand(0, przyslowia.length);
	var i2 = rand(0, przyslowia.length);
	if(i1 == i2)
		i2 = (i2 + 1) % przyslowia.length;

	var p1 = (przyslowia[i1].substr(0, przyslowia[i1].length - 1)).split(' ');
	var p2 = (przyslowia[i2].charAt(0).toLowerCase() + przyslowia[i2].substr(1)).split(' ');

	var lastConj = false;
	var out = "";
	var l1 = rand(2, p1.length - 2);
	var l2 = rand(2, p2.length - 2);
	for(var i = 0; i < l1 + l2; ++i){
		if(i < l1) {
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
				out = out.substr(0, out.length-2);
			out += word + ( (i >= l1 + l2 - 1) ? '' : ' ');
		}
	}
	var b = out.indexOf(' ,');
	if(b >= 0) // Should actually never be true
		out = out.substr(0, b) + ',' + out.substr(b + 2, out.length);
	return out;
}

if(process.argv[2] === 'clear'){
	console.log('Destroying all unfavorited tweets...')
	destroyAllTweets('dHd1anN0YXJ5');
} else {
	console.log("Jamnik wystartował...");
	setInterval(function(){
		// console.log(randomProverb());
		tweet(randomProverb());
	}, 10*60*1000);
}