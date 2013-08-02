var exec = require('child_process').exec;
var fs = require('fs');
var util = require('util');
var MongoClient = require('./mongoUtil');
var fs = require('fs');
var tmpFile = 'tmp';
var filesMap = {};

var mongoClient = new MongoClient('127.0.0.1', '27017', 'pomelo', 'rpc14');

var collect = function(dir, pattern) {
	fs.readdir(dir, function(err, files) {
		if(!!err) {
			console.error('read directory error.');
			return;
		}
		var results = [];
		files.forEach(function(filename) {
			if(startsWith(filename, pattern)) {
				results.push(filename);
			}
		});

		results.forEach(function(filename) {
			var count = getReadLine(filename);
			var total = getTotalLine(dir + filename);
      var addition = total - count;
      if(addition < 0) {
      	throw new Error(util.format('log file is error, current file is %s but read lines is %s', total, count));
      }
      filesMap[filename] = count;
			var child = exec(util.format('tail -f -n %s %s', addition, dir + filename));
			child.stdout.on('data', function (chunk) {
      	var msg = chunk.toString();
      	console.log(msg);
      	formatMessage(filename, count, msg);
    	});
  	
		});

	});
};

var formatMessage = function(filename, count, str) {
	var lines = str.split('\n');
	for(var i =0; i<lines.length; i++) {
		var start = lines[i].indexOf('{', 0);
		if(start < 0)
			continue;
		lines[i] = lines[i].substring(start);
		mongoClient.insert(JSON.parse(lines[i]));
		var num = filesMap[filename];
		filesMap[filename] = ++num;
	}
	setWriteLine(filename, filesMap[filename]);
};

var startsWith = function (str, prefix) {
  if(typeof str !== 'string' || typeof prefix !== 'string' ||
    prefix.length > str.length) {
    return false;
  }

  return str.indexOf(prefix) === 0;
};

var setWriteLine = function(filename, line) {
	if(!fs.existsSync(tmpFile)) {
		fs.writeFileSync(tmpFile, filename + ':' + line + '\n');
	}
	else {
		var str = fs.readFileSync(tmpFile).toString();
		var flag = false;
		//clear content
		fs.writeFileSync(tmpFile, '');
		var lines = str.split('\n');
		for(var i =0; i< lines.length; i++) {
			if(lines[i].indexOf(':') < 0)
				continue;
			var name = lines[i].split(':')[0];
			if(filename == name) {
				flag = true;
				fs.appendFileSync(tmpFile, filename + ':' + line + '\n');
			}
			else {
				fs.appendFileSync(tmpFile, lines[i] + '\n');
			}
		}
		if(!flag) {
			fs.appendFileSync(tmpFile, filename + ':' + line + '\n');
		}
	}
};

var getReadLine = function (filename) {
		var str = fs.readFileSync(tmpFile).toString();
		var lines = str.split('\n');
		for(var i =0; i< lines.length; i++) {
			if(lines[i].indexOf(':') < 0)
				continue;
			var name = lines[i].split(':')[0];
			if(filename === name) {
				return lines[i].split(':')[1];
			}
		}
		return 0;
};

var getTotalLine = function(file) {
	var str = fs.readFileSync(file).toString();
	var lines = str.split('\n');
	var count = lines.length -1;
	if(count < 0)
		return 0;
	return count;
}

//console.log(getTotalLine('/home/py/Workspace/nodejs/development/chatofpomelo/game-server/logs/rpc-debug-connector-server-2.log'));

collect('/home/py/Workspace/nodejs/development/chatofpomelo/game-server/logs/', 'rpc-debug');
	
//collect('./', 'test');

//setWriteLine('aaa',5);

//console.log(getReadLine('aaa'));