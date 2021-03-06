// Copyright (c) 2012-2017, Matt Godbolt
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright notice,
//       this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

const Compile = require('../base-compiler'),
      _ = require('underscore-node'),
      logger = require('../logger').logger,
      utils = require('../utils');

const getOptions = function(compiler, helpArg) {
    return compiler.exec(compiler.compiler.exe, [helpArg])
            .then(_.bind(function (result) {
                var options = {};
                if (result.code === 0) {
                    var splitness = /--?[-a-zA-Z]+( ?[-a-zA-Z]+)/;
                
                    utils.eachLine(result.stdout + result.stderr, function (line) {
                        var match = line.match(splitness);
                        if (!match) return;
                        options[match[0]] = true;
                    });
                }
                compiler.compiler.supportedOptions = options;
                logger.debug("compiler options: ", compiler.compiler.supportedOptions);
                return compiler;
        }));
};

const gccparser = function(compiler) {
    return getOptions(compiler, "--target-help").then(function(compiler) {
        if (compiler.compiler.supportedOptions['-masm']) {
            compiler.compiler.intelAsm = "-masm=intel";
            compiler.compiler.supportsIntel = true;
        }
        return compiler;
    });
};

const clangparser = function(compiler) {
    return getOptions(compiler, "--help").then(function(compiler) {
        if (compiler.compiler.supportedOptions['-fsave-optimization-record']) {
            compiler.compiler.optArg = "-fsave-optimization-record";
            compiler.compiler.supportsOptOutput = true;
        }
        return compiler;
    });
};

var argumentParsers = {
    "clang": clangparser,
    "gcc": gccparser
};

module.exports = function (info, env) {
    var comp = new Compile(info, env);
    return comp.initialise(argumentParsers[info.type]);
};