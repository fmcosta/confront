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


var cc = {
    configFile: 'config.json',
    configFolder: null
};


function Confront(options) {

    if(options && typeof options === 'object') {
        // configure some stuff...
        if(options.debug === true) _debug = true;
        extend(cc, options);
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

    var cliConfig = Confront.getCommandLineConfig();
    realm = cliConfig.realm || realm; // override, if found

    var pkgConfig    = Confront.getPackageConfig();
    var localConfig  = Confront.getLocalConfig();
    var realmConfig = Confront.getRealmConfig(realm);

    finalConfig.realm = realm;

    // (+) now merge in predetermined order
    if(pkgConfig)   finalConfig = extend(finalConfig, pkgConfig);
    if(localConfig) finalConfig = extend(finalConfig, localConfig);
    if(realmConfig) finalConfig = extend(finalConfig, realmConfig);
    if(cliConfig)   finalConfig = extend(finalConfig, cliConfig);

    return finalConfig;
};




Confront.getConfig = function(cfgFile) {

    var mainDir = process.cwd();
    if(process.mainModule)
        mainDir = path.dirname(process.mainModule.filename);

    var configFile = path.resolve(mainDir, cfgFile);

    var fileData = getFileData(configFile);
    if(!fileData) return null;

    var someConfig = makeJSON(fileData.toString());

    return someConfig;
}



Confront.getPackageConfig = function() {

    var mainDir = process.cwd();
    if(process.mainModule)
        mainDir = path.dirname(process.mainModule.filename);

    var pkgFile = path.resolve(mainDir, 'package.json');

    console.log('trying for package.json...', pkgFile);

    var fileData = getFileData(pkgFile);
    if(!fileData) return null;

    var pkgData = makeJSON(fileData.toString());

    return pkgData.config || null;
}



Confront.getLocalConfig = function() {

    var mainDir = process.cwd();
    if(process.mainModule)
        mainDir = path.dirname(process.mainModule.filename);
            
    var localConfig = path.resolve( mainDir, cc.configFolder || '', cc.configFile )

    console.log('trying for local...', localConfig);

    var fileData = getFileData(localConfig);
    if(!fileData) return null;

    var localConfig = makeJSON(fileData.toString());

    return localConfig;
}



Confront.getRealmConfig = function(realm) {
    if(!realm) return null;

    var mainDir = process.cwd();
    if(process.mainModule)
        mainDir = path.dirname(process.mainModule.filename);
        
    var realmConfig = path.resolve( mainDir, cc.configFolder || '', realm + '.json' )

    console.log('trying for realm...', realmConfig);

    var fileData = getFileData(realmConfig);
    if(!fileData) return null;

    var localConfig = makeJSON(fileData.toString());

    return localConfig;
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
            currentOptions = '';
        }
        else {
            if(opt) currentOptions += opt + ' ';
        }

        if(currentCommand) {
            options[currentCommand] = currentOptions.trim();
            currentOptions = '';
        }

        if(currentCommand && currentOptions) {
            currentCommand = '';
            currentOptions = '';
        }
    });
    
    return options;
};






exports = module.exports = Confront;







