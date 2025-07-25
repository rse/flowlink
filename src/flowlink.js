/*
**  FlowLink -- Flow Expression Language
**  Copyright (c) 2024-2025 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  load external depdendencies  */
import CacheLRU    from "cache-lru"
import ASTY        from "asty"
import PEGUtil     from "pegjs-util"

/*  get expression evaluator  */
import FlowLinkEval    from "./flowlink-eval.js"
import FlowLinkError   from "./flowlink-error.js"

/*  get expression parser (by loading and on-the-fly compiling PEG.js grammar)  */
const PEG = require("pegjs-otf")
const FlowLinkParser = PEG.generateFromFile(
    /* eslint n/no-path-concat: off */
    __dirname + "/flowlink-parse.pegjs",
    { optimize: "speed", cache: true }
)

/*  define the FlowLink class  */
class FlowLink {
    /*  create a new FlowLink instance  */
    constructor (options = {}) {
        /*  provide parameter defaults  */
        this.options = {
            cache: 100,
            trace: null,
            ...options
        }

        /*  create LRU cache  */
        this._cache = new CacheLRU()
        this._cache.limit(this.options.cache)
    }

    /*  individual step 1: compile expression into AST  */
    compile (expr) {
        /*  sanity check usage  */
        if (arguments.length < 1)
            throw new Error("FlowLink#compile: too less arguments")
        if (arguments.length > 2)
            throw new Error("FlowLink#compile: too many arguments")

        /*  tracing operation  */
        if (this.options.trace !== null)
            this.options.trace("compile: +---(expression string)-----------------" +
                "----------------------------------------------------------------\n" +
                expr.replace(/\n$/, "").replace(/^/mg, "compile: | "))

        /*  try to fetch pre-compiled AST  */
        let ast = this._cache.get(expr)
        if (ast === undefined) {
            /*  compile AST from scratch  */
            const asty = new ASTY()
            const result = PEGUtil.parse(FlowLinkParser, expr, {
                startRule: "expression",
                makeAST: (line, column, offset, args) => {
                    return asty.create.apply(asty, args).pos(line, column, offset)
                }
            })
            if (result.error !== null) {
                const message = "parsing failed: " +
                    `"${result.error.location.prolog}" "${result.error.location.token}" "${result.error.location.epilog}": ` +
                    result.error.message
                throw new FlowLinkError(message, {
                    origin: "parser",
                    code:   expr,
                    line:   result.error.line,
                    column: result.error.column
                })
            }
            ast = result.ast
            ast.set("__expr", expr)

            /*  cache AST for subsequent usages  */
            this._cache.set(expr, ast)
        }

        /*  tracing operation  */
        if (this.options.trace !== null)
            this.options.trace("compile: +---(abstract syntax tree)--------------" +
                "----------------------------------------------------------------\n" +
                ast.dump().replace(/\n$/, "").replace(/^/mg, "compile: | "))

        return ast
    }

    /*  individual step 2: execute AST  */
    execute (ast, options) {
        /*  sanity check usage  */
        if (arguments.length !== 2)
            throw new Error("FlowLink#execute: invalid number of arguments")
        if (!(typeof options === "object" && typeof options.resolveVariable === "function" && typeof options.createNode === "function" && typeof options.connectNode))
            throw new Error("FlowLink#execute: invalid options")

        /*  tracing operation  */
        if (this.options.trace !== null)
            this.options.trace("execute: +---(evaluation recursion tree)---------" +
                "----------------------------------------------------------------")

        /*  evaluate the AST  */
        const expr = ast.get("__expr")
        const evaluator = new FlowLinkEval(expr, options, this.options.trace)
        return evaluator.eval(ast)
    }

    /*  all-in-one step  */
    evaluate (expr, options) {
        /*  sanity check usage  */
        if (arguments.length !== 2)
            throw new Error("FlowLink#evaluate: invalid number of arguments")

        /*  compile and evaluate expression  */
        const ast = this.compile(expr)
        return this.execute(ast, options)
    }
}

/*  export the traditional way for interoperability reasons
    (as Babel would export an object with a 'default' field)  */
module.exports = FlowLink

