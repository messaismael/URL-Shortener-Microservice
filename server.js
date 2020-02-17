  'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
let dns = require('dns')
var validUrl = require('valid-url');


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLDB_URI, {useNewUrlParser: true, useUnifiedTopology: true} );

let Schema = mongoose.Schema;
let urlSchema = new Schema({
  url: {type: String, required: true},
  short_url: Number
})
let UrlModel = mongoose.model('UrlModel', urlSchema);

let findByUrl = async function(url, short){
   let data1 = await UrlModel.findOne({url: url}).select('-_id -__v');
  
   if(!data1){
     let n = new UrlModel({
       url: url,
       short_url: short
     })
     await n.save();
     return {
       url: url,
       short_url: short
     } ;
   }else{
     return data1;
   }
}


app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});

app.post("/api/shorturl/new", function(req, res){
  let url = req.body.url;
  let short = Math.floor(Math.random()* 1000)
  
  if (validUrl.is_web_uri(url)) {
    dns.lookup(new URL(url).hostname, async function(err, add, fam){
      
      console.log("err:  " + err, "add: " + add, "fam: " + fam);
      
      if(!err && add){
        
        res.json(await findByUrl(url, short))
        
      }else{
        res.json({error: "invalid hostname"})
      }
    })
  }
  else{
    res.json({error: "invalid URL"})
  }    
})

// target url
app.get("/api/shorturl/:id",async function(req, res){
  let id = req.params.id; 
  let redirection = await UrlModel.findOne({short_url: id})
  res.redirect(redirection.url)
})