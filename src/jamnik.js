'use strict';

const Twit = require('twit')
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');

const Util = require(__dirname + '/util.js')
const TweetUtil = require(__dirname + '/tweetUtil.js')


let dict = [];
let markov = {};
let keys = [];

// Load dictionary
let istream = fs.createReadStream(__dirname + '/../assets/dict.txt');
let ostream = new Stream;
let dictLoader = readline.createInterface(istream, ostream);

dictLoader.on('line', function(line) {
  dict.push(line);
});

// Main Twit object
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

// Main 
dictLoader.on('close', function() {
  Util.log('Dictionary loaded.');
  init();

  Util.log("Jamnik wystartował...");

  // Main tweet loop
  // var tweetLoop = setInterval(function() {
    let res = false;
    while(!res) res = generate();
    // Uppercase first letter
    let first = res.charAt(0);
    res = first.toLocaleUpperCase() + res.substring(1, res.length);
    // Dot at the end
    let last = res.charAt(res.length - 1);
    if(last !== '?' && last !== '!')
      res += '.';
    // Tweet
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
      // Don't take words that lead only to an end
      if(markov[key].length === 1 && markov[key][0] === '') {
        continue;
      }
      // Don't start with a hyphen
      if(key === '-') {
        continue;
      }
      keys.push(key);
    }
  }

  Util.log('Lookup constructed.');
}

// Generate tweet
function generate(prev) {
  // Result is empty if not specified otherwise
  let res = prev || '';
  // Get random key to begin with
  let act = keys[Math.floor(Math.random() * keys.length)];

  // Markov through
  while(act != '') {
    res += act;
    act = markov[act][Math.floor(Math.random() * markov[act].length)];
    if(act !== '') {
      res += ' ';
    }
  }

  // If we recreated a line from the dictionary, throw it away
  if(!prev && dict.indexOf(res) >= 0) {
    return '';
  }

  // If word is too short generate more
  if(res.split(' ').length <= 4) {
    res += ' ';
    // 60% chance to put hyphens between parts
    if(Math.random() < 0.6) {
      res += '- ';
    }
    res = generate(res);
  }
  return res;
}