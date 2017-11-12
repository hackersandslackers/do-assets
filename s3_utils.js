var path = require('path');
var mime = require('mime');

const http  = require('http'),
    https = require('https'),
    aws4  = require('aws4'),
    fs    = require('fs');

//var doCredentials = JSON.parse(fs.readFileSync(__dirname+'/config/do/credentials.json', "utf8"));

const { accessKeyId, secretAccessKey, regionName, bucketName, serviceName } = {
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  regionName: process.env.REGION_NAME,
  bucketName: process.env.BUCKET_NAME,
  serviceName: process.env.SERVICE_NAME
};

const spacesConfig = {
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey
};

const host = bucketName+'.'+regionName+'.digitaloceanspaces.com';
const regionHost = regionName+'.digitaloceanspaces.com';

var upload = function(key,mimeType,file_path,callback) {
  var body = fs.readFileSync(file_path);
  var opts = aws4.sign({
    host: host,
    method: 'PUT',
    path: '/'+key,
    region: regionName,
    service: serviceName,
    headers: {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': mimeType,
      'x-amz-acl': 'public-read',
      accept: 'application/json'
    },
    body: body
  },spacesConfig);
  //console.log(opts);
  var s3Req = https.request(opts, function(api_res){
    var data = "";
    //console.log("Status: "+api_res.statusCode);
    api_res.on('data', function (chunk) {
      data += chunk;
    });
    api_res.on('error', function (err) {
      callback(err,null);
    });
    api_res.on('end', function (chunk) {
      //console.log(data);
      callback(null,{
        url: "https://"+host+"/"+key
      });
    });
  });
  s3Req.write(body);
  s3Req.end();
}

var get = function(host, path, callback) {
  var opts = aws4.sign({
    host: host,
    method: 'GET',
    path: path,
    region: regionName,
    service: serviceName,
    headers: {
      accept: 'application/json'
    }
  },spacesConfig);
  //console.log(opts);
  var s3Req = https.request(opts, function(api_res){
    var data = "";
    //console.log("Status: "+api_res.statusCode);
    api_res.on('data', function (chunk) {
      data += chunk;
    });
    api_res.on('error', function (err) {
      callback(err,null);
    });
    api_res.on('end', function (chunk) {
      //console.log(data);
      try{
        callback(null, JSON.parse(data));
      } catch(error) {
        callback(error, null);
      }
    });
  });
  s3Req.end();
}

module.exports.uploadServerFile = function(file_path, folder, callback) {
  var file_name = path.basename(file_path).replace(/\s/g,'_');
  var key = folder+"/"+file_name;
  var body = fs.readFileSync(file_path);
  upload(key,mime.lookup(file_path),file_path,callback);
}

module.exports.uploadFile = function(file, folder, callback){
  var file_path = file.path;
  var file_name = file.originalname.replace(/\s/,'');
  var key = "uploads/"+file_name;
  console.log(file);
  upload(key,file.mimetype,file_path,callback);
}

module.exports.listBuckets = function(callback){
  get(regionHost,'',callback);
}

