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

var DEBUG = false;


var cc = {
    configFile: 'config.json',
    configFolder: null,
    realm: 'default'
};


function Confront(options) {
    /*
        Your friendly environment configuration frontloader

        Usage:
            confront = require('confront');
            confront(usageOptions)

            var config = confront.detect();

     */
    if(options) configure(options);
    return Confront;
}



// privates

function configure(_config) {
    if(!_config) return;
    if(_config instanceof Object) {
        if(_config.debug === true) DEBUG = true;
        extend(cc, options);
    }
}

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

function toCamel(myString) {
    if(!myString) return myString;
    return myString.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
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


// working, but not convinced we need this functionality
function realmFilter(data) {
    var realmOverride = null;
    if(data.realm) {
        realmOverride = data.realm[cc.realm];
        delete data.realm;
    }
    if(realmOverride) extend(data, realmOverride)
    return data;
}




function getBaseDirectory() {
    var baseDir = process.cwd();
    if(process.mainModule)
        baseDir = path.dirname(process.mainModule.filename);

    return baseDir;
}



function getFileData(fullpath){

    if(!fs.existsSync(fullpath)) return null;

    var fileData = fs.readFileSync(fullpath);
    if (!fileData) return null;
   
    return makeJSON(fileData.toString());
}









// statics


Confront.getConfigFile = function(cfgFile) {
    var mainDir = getBaseDirectory();
    var configFile = path.resolve(mainDir, cc.configFolder || '', cfgFile);
    console.log('trying for [%s]...', cfgFile, configFile);
    return getFileData(configFile);
};



Confront.getPackageConfig = function() {
    var mainDir = getBaseDirectory();
    var pkgFile = path.resolve(mainDir, 'package.json');
    console.log('trying for /package.json ...', pkgFile);
    var pkgData = getFileData(pkgFile);
    if(pkgData && pkgData.config)
        return pkgData.config;
    return null;
};



Confront.getLocalConfig = function() {
    return Confront.getConfigFile(cc.configFile)
};


Confront.getRealmConfig = function(realm) {
    if(!realm) return null;
    return Confront.getConfigFile(realm + '.json')
};




Confront.getCommandLineConfig = function() {

    var options = {};

    var currentCommand = '',
        currentOptions = '';

    var allargs = [].concat(process.argv).concat(process.execArgv);

    allargs.forEach(function(opt, idx) {

        if(!currentCommand) currentOptions = '';

        if (opt.match(/^--debug/)) { // node REPL flag
            options.debug = true;
            return; 
        }

        if (opt.match(/^--/)) return; // other node options, ignore/skip

        if (opt.match(/^-[a-z]/)) {
            currentCommand = opt.slice(1); // remove the leading dash
            currentCommand = toCamel(currentCommand);
            currentOptions = '';
        }
        else {
            if(opt) currentOptions += opt + ' ';
        }

        if(currentCommand) {
            options[currentCommand] = currentOptions.trim() || true;
            currentOptions = '';
        }

        if(currentCommand && currentOptions) {
            currentCommand = '';
            currentOptions = '';
        }
    });
    
    return options;
};







Confront.detect = // alias
Confront.determineConfig = function() {

    var finalConfig = {};

    // (1) environment variables first
    var realm = process.env.NODE_ENV || process.env.SERVER_ENV || "default";
    realm = String(realm).toLowerCase();

    var cliConfig = Confront.getCommandLineConfig();
    if(cliConfig.realm) realm = cliConfig.realm;

    // realm should be settled by this point
    cc.realm = realm;

    var pkgConfig   = Confront.getPackageConfig();
    var localConfig = Confront.getLocalConfig();
    var realmConfig = Confront.getRealmConfig(realm);

    finalConfig.realm = realm;

    // (+) now merge in predetermined order
    if(pkgConfig)   finalConfig = extend(finalConfig, pkgConfig);
    if(localConfig) finalConfig = extend(finalConfig, localConfig);
    if(realmConfig) finalConfig = extend(finalConfig, realmConfig);
    if(cliConfig)   finalConfig = extend(finalConfig, cliConfig);

    return finalConfig;
};




exports = module.exports = Confront;

