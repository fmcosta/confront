/**
 * Confront - the easy configuration front loader
 *
 * @author fabio.costa
 * @copyright (c)2014
 * @license MIT
 */

var fs   = require('fs'),
    path = require('path');

var extend = require('util')._extend;

var _debug = false;




function Confront(options) {

    if(options && typeof options === 'object') {
        // configure some stuff...
        if(options.debug === true) _debug = true;
    }

    return Confront;
}



// privates

function makeJSON(alledgedJson){
    if (alledgedJson.toString)
        alledgedJson = ""+alledgedJson; // implicit

    var objFromJson = null;
    try {
        objFromJson = JSON.parse(alledgedJson);
    }
    catch(ex) {
        console.log('failed to parse json');
    }

    return objFromJson;
}


function getFileData(fullpath){
    if(!fs.existsSync(fullpath)) return null;

    var fileData = fs.readFileSync(fullpath);
    if (!fileData) return null;

    return fileData;
}


function tryUrlParse(suspectURL) {

    var urlParts;

    try {
        urlParts = url.parse(suspectURL);
    }
    catch(ex) {
        urlParts = null;
    }

    return urlParts;
}






// statics
Confront.detect = // alias
Confront.determineConfig = function() {

    var finalConfig = {};

    // (1) environment variables first
    var realm = process.env.NODE_ENV || process.env.SERVER_ENV || "default";
    realm = String(realm).toLowerCase();

    var execConfig = Confront.getCommandLineConfig();
    realm = execConfig.realm || realm; // override, if found

    // var pkgConfig  = Confront.getPackageInfo();

    var storedConfig = Confront.getRealmConfig(realm);

    var localConfig  = Confront.getLocalConfig();

    finalConfig.realm = realm;

    // (+) now merge in predetermined order
    // if(pkgConfig)    finalConfig = extend(finalConfig, pkgConfig);
    if(localConfig)  finalConfig = extend(finalConfig, localConfig);
    if(storedConfig) finalConfig = extend(finalConfig, storedConfig);
    if(execConfig)   finalConfig = extend(finalConfig, execConfig);

    return finalConfig;
};


Confront.getPackageInfo = function() {

    var dirname = path.dirname(process.mainModule.filename);

    var localPackageName = dirname + '/package.json';

    var fileData = getFileData(localPackageName);
    if(!fileData) return null;

    var packageConfig = makeJSON(fileData.toString());

    return packageConfig;
}



Confront.getConfig = function(cfgFile) {

    var dirname = path.dirname(process.mainModule.filename);
    var configFile = path.resolve(dirname, cfgFile);

    var fileData = getFileData(configFile);
    if(!fileData) return null;

    var someConfig = makeJSON(fileData.toString());

    return someConfig;
}



Confront.getLocalConfig = function() {

    var dirname = path.dirname(process.mainModule.filename);

    var localFilename = dirname + '/config/app.json';

    var fileData = getFileData(localFilename);
    if(!fileData) return null;

    var localConfig = makeJSON(fileData.toString());

    return localConfig;
}



Confront.getRealmConfig = function(realm) {
    if(!realm) return null;

    var dirname = path.dirname(process.mainModule.filename);

    var realmFilename = dirname + '/config/'+ realm + '.json';

    var fileData = getFileData(realmFilename);
    if(!fileData) return null;

    var localConfig = makeJSON(fileData.toString());

    return localConfig;
};




Confront.getCommandLineConfig = function() {

    var options = {};

    var currentCommand = '',
        currentOptions = '';

    var allargs = [].concat(process.execArgv).concat(process.argv);

    allargs.forEach(function(opt, idx) {

        if (opt.match(/--debug/)) { // node REPL flag
            options.debug = true;
            return; 
        }

        if (opt.match(/--/)) return; // other node options, ignore/skip

        if (opt.match(/-[a-z]/)) {
            currentCommand = opt.slice(1); // remove the leading dash
            currentOptions = '';
        }
        else {
            if(opt) currentOptions += opt + ' ';
        }

        if(currentCommand) options[currentCommand] = currentOptions.trim();
    });
    
    return options;
};






exports = module.exports = Confront;







