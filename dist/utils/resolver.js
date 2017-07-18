"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var win32 = process.platform === 'win32';
function requireTsoaPlugin(module) {
    var paths = getNpmPaths();
    for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
        var npmPath = paths_1[_i];
        var modulePath = path.join(npmPath, 'tsoa-' + module);
        if (fs.existsSync(modulePath)) {
            return require(modulePath);
        }
    }
}
exports.requireTsoaPlugin = requireTsoaPlugin;
// shameless copy from https://github.com/yeoman/environment/blob/master/lib/resolver.js
function getNpmPaths() {
    var paths = [];
    // Add NVM prefix directory
    if (process.env.NVM_PATH) {
        paths.push(path.join(path.dirname(process.env.NVM_PATH), 'node_modules'));
    }
    // Adding global npm directories
    // We tried using npm to get the global modules path, but it haven't work out
    // because of bugs in the parseable implementation of `ls` command and mostly
    // performance issues. So, we go with our best bet for now.
    if (process.env.NODE_PATH) {
        paths = _.compact(process.env.NODE_PATH.split(path.delimiter)).concat(paths);
    }
    // global node_modules should be 4 or 2 directory up this one (most of the time)
    paths.push(path.join(__dirname, '../../../..'));
    paths.push(path.join(__dirname, '../..'));
    // Adds support for generator resolving when yeoman-generator has been linked
    if (process.argv[1]) {
        paths.push(path.join(path.dirname(process.argv[1]), '../..'));
    }
    // Default paths for each system
    if (win32) {
        paths.push(path.join(process.env.APPDATA, 'npm/node_modules'));
    }
    else {
        paths.push('/usr/lib/node_modules');
        paths.push('/usr/local/lib/node_modules');
    }
    // Walk up the CWD and add `node_modules/` folder lookup on each level
    process.cwd().split(path.sep).forEach(function (part, i, parts) {
        var lookup = path.join.apply(path, parts.slice(0, i + 1).concat(['node_modules']));
        if (!win32) {
            lookup = "/" + lookup;
        }
        paths.push(lookup);
    });
    return paths.reverse();
}
//# sourceMappingURL=resolver.js.map