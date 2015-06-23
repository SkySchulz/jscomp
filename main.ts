// Copyright (c) 2015 Tzvetan Mikov.
// Licensed under the Apache License v2.0. See LICENSE in the project
// root for complete license information.

/// <reference path="typings/tsd.d.ts" />

import compiler = require("./src/compiler");


function printSyntax (): void
{
    console.error(
"syntax: jscomp [options] filename\n"+
"   -h                this help\n"+
"   --dump-ast        dump AST\n"+
"   --dump-hir        dump HIR\n"+
"   --strict-mode     (default) enable strict mode\n"+
"   --no-strict-mode  disable strict mode\n"+
"   -g                enable debug\n"+
"   -c                compile only (do not link)\n"+
"   -S                compile to C source\n"+
"   -o filename       output file\n"+
"   -v                verbose\n"
    );
}

function main (argv: string[]): void
{
    var options = new compiler.Options();
    var fname: string = null;

    if (argv.length === 1) {
        printSyntax();
        process.exit(1);
    }

    for ( var i = 1; i < argv.length; ++i ) {
        var arg = argv[i];
        if (arg[0] === "-") {
            switch (arg) {
                case "--help":
                case "-h":
                    printSyntax();
                    process.exit(0);
                    break;
                case "--dump-ast": options.dumpAST = true; break;
                case "--dump-hir": options.dumpHIR = true; break;
                case "--strict-mode": options.strictMode = true; break;
                case "--no-strict-mode": options.strictMode = false; break;
                case "-g": options.debug = true; break;
                case "-c": options.compileOnly = true; break;
                case "-S": options.sourceOnly = true; break;
                case "-o":
                    ++i;
                    if (i === argv.length) {
                        console.error("'-o' missing argument");
                        process.exit(1);
                    }
                    options.outputName = argv[i];
                    break;
                case "-v": options.verbose = true; break;
                default:
                    console.error("error: unknown option '%s'", arg);
                    process.exit(1);
                    break;
            }
        } else {
            if (fname) {
                console.error("error: more than one file name specified");
                process.exit(1);
            }
            fname = arg;
        }
    }

    if (!fname) {
        console.error("error: no filename specified");
        process.exit(1);
    }

    var errCnt = 0;
    var reporter: compiler.IErrorReporter = {
        error: (loc: ESTree.SourceLocation, msg: string) => {
            ++errCnt;
            if (loc)
                console.error(`${loc.source}:${loc.start.line}:${loc.start.column + 1}: error: ${msg}`);
            else
                console.error(`error: ${msg}`);
        },
        warning: (loc: ESTree.SourceLocation, msg: string) => {
            if (loc)
                console.warn(`${loc.source}:${loc.start.line}:${loc.start.column + 1}: warning: ${msg}`);
            else
                console.warn(`warning: ${msg}`);
        },
        note: (loc: ESTree.SourceLocation, msg: string) => {
            if (loc)
                console.warn(`${loc.source}:${loc.start.line}:${loc.start.column + 1}: note: ${msg}`);
            else
                console.warn(`note: ${msg}`);
        },
        errorCount: () => {
            return errCnt;
        }
    };

    compiler.compile(fname, reporter, options, () => {
        if (reporter.errorCount() > 0)
            process.exit(1);
    });
}

main(process.argv.slice(1));