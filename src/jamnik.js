'use strict';

const Twit = require('twit')
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');

const Util = require(__dirname + '/util.js')
const TweetUtil = require(__dirname + '/tweetUtil.js')

// Dictionary
let dict = [];
let markov = {};
let keys = [];

let instream = fs.createReadStream(__dirname + '/../dict.txt');
let outstream = new Stream;
let dictLoader = readline.createInterface(instream, outstream);

dictLoader.on('line', function(line) {
  dict.push(line);
});

var jamnik = new Twit({
  consumer_key:         '',
  consumer_secret:      '',
  access_token:         '',
  access_token_secret:  '',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

jamnik.screen_name = 'andrzejamnik';


// Greeting
Util.log('Jamnik Andrzeja');

dictLoader.on('close', function() {
  Util.log('Dictionary loaded.');
  init();
  Util.log('Chain constructed.');

  Util.log("Jamnik wystartował...");
  
  // Main tweet loop
  // var tweetLoop = setInterval(function() {  
    let res = false;
    while(!res) {
      res = generate();
    }

    let first = res.charAt(0);
    res = first.toLocaleUpperCase() + res.substring(1, res.length);
    Util.log('Trying to tweet ' + '\"' + res + '\"');
    TweetUtil.tweet(jamnik, res);
  // }, 8*60*1000);
});

// Initialize 
function init() {
  // Collect connections
  for(let line = 0; line < dict.length; line++) {
    let s = dict[line].split(' ');
    s.push('');

    for(let i = 0; i < s.length - 1; i++) {
      markov[s[i]] = markov[s[i]] || [];
      markov[s[i]].push(s[i + 1]);
    }
  }

  // Collect possible keys to start with
  for(let key in markov) {
    if(markov[key].constructor === Array) {
      if(markov[key].length === 1 && markov[key][0] === '') {
        continue;
      }
      if(key === '–') {
        continue;
      }
      keys.push(key);
    }
  }
}

// Generate tweet
function generate(prev) {

  let res = prev || '';
  let act = keys[Math.floor(Math.random() * keys.length)];

  while(act != '') {
    res += act;
    act = markov[act][Math.floor(Math.random() * markov[act].length)];
    if(act !== '') {
      res += ' ';
    }
  }

  if(dict.indexOf(res) >= 0) {
    res = '';
    return res;
  }

  if(res.split(' ').length <= 4) {
    res += ' ';
    // 60% chance to put '-'' between parts
    if(Math.random() < 0.6) {
      res += '- ';
    }
    res = generate(res); 
  }
  return res;
}