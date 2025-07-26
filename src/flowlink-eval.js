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

/*  load internal depdendencies  */
import FlowLinkTrace from "./flowlink-trace.js"
import FlowLinkError from "./flowlink-error.js"

/*  the exported class  */
export default class FlowLinkEval extends FlowLinkTrace {
    constructor (expr, options, trace) {
        super(trace)
        this.expr    = expr
        this.options = options
    }

    /*  raise an error  */
    error (N, origin, message) {
        const pos = N.pos()
        return new FlowLinkError(message, {
            origin,
            code:   this.expr,
            line:   pos.line,
            column: pos.column
        })
    }

    /*  evaluate an arbitrary top-level node  */
    eval (N) {
        switch (N.type()) {
            case "Parallel":   return this.evalParallel(N)
            case "Sequential": return this.evalSequential(N)
            case "Node":       return this.evalNode(N)
            default:
                throw this.error(N, "eval", "invalid AST node (should not happen)")
        }
    }

    /*  evaluate parallel  */
    evalParallel (N) {
        this.traceBegin(N)
        const result = { head: [], tail: [] }
        for (const child of N.childs()) {
            const sub = this.eval(child)
            sub.head.forEach((node) => result.head.push(node))
            sub.tail.forEach((node) => result.tail.push(node))
        }
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate sequential  */
    evalSequential (N) {
        this.traceBegin(N)
        const result = { head: null, tail: null }
        for (const child of N.childs()) {
            const sub = this.eval(child)
            if (result.head === null)
                result.head = sub.head
            if (result.tail !== null) {
                result.tail.forEach((node1) => {
                    sub.head.forEach((node2) => {
                        this.options.connectNode(node1, node2)
                    })
                })
            }
            result.tail = sub.tail
        }
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate node  */
    evalNode (N) {
        this.traceBegin(N)
        const id = N.get("id")
        const opts = {}
        const args = []
        N.childs().forEach((node) => {
            if (node.type() === "NodeParamNamed") {
                const [ key, val ] = this.evalNodeParamNamed(node)
                opts[key] = val
            }
            else if (node.type() === "NodeParamPositional") {
                const val = this.evalNodeParamPositional(node)
                args.push(val)
            }
            else
                throw this.error(node, "eval", "invalid AST node (should not happen)")
        })
        const node = this.options.createNode(id, opts, args)
        const result = { head: [ node ], tail: [ node ] }
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate named parameter  */
    evalNodeParamNamed (N) {
        this.traceBegin(N)
        const key = N.get("id")
        const val = this.evalNodeParamValue(N.child(0))
        const result = [ key, val ]
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate positional parameter  */
    evalNodeParamPositional (N) {
        this.traceBegin(N)
        const result = this.evalNodeParamValue(N.child(0))
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate parameter value  */
    evalNodeParamValue (N) {
        switch (N.type()) {
            case "LiteralArray":    return this.evalLiteralArray(N)
            case "LiteralObject":   return this.evalLiteralObject(N)
            case "Variable":        return this.evalVariable(N)
            case "LiteralTemplate": return this.evalLiteralTemplate(N)
            case "LiteralString":   return this.evalLiteralString(N)
            case "LiteralNumber":   return this.evalLiteralNumber(N)
            case "LiteralValue":    return this.evalLiteralValue(N)
            default:
                throw this.error(N, "eval", "invalid AST node (should not happen)")
        }
    }

    /*  evaluate array literal  */
    evalLiteralArray (N) {
        this.traceBegin(N)
        const result = []
        for (const node of N.childs())
            result.push(this.evalNodeParamValue(node))
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate object literal  */
    evalLiteralObject (N) {
        this.traceBegin(N)
        const result = {}
        for (const node of N.childs()) {
            const key = node.get("key")
            const val = this.evalNodeParamValue(node.child(0))
            result[key] = val
        }
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate variable  */
    evalVariable (N) {
        this.traceBegin(N)
        const id = N.get("id")
        const result = this.options.resolveVariable(id)
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate template literal  */
    evalLiteralTemplate (N) {
        this.traceBegin(N)
        const result = N.childs()
            .map((node) => {
                if (node.type() === "LiteralString")
                    return this.evalLiteralString(node)
                else if (node.type() === "Variable")
                    return this.evalVariable(node)
                else
                    throw this.error(node, "eval", "invalid AST node (should not happen)")
            })
            .join("")
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate string literal  */
    evalLiteralString (N) {
        this.traceBegin(N)
        const result = N.get("value")
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate number literal  */
    evalLiteralNumber (N) {
        this.traceBegin(N)
        const result = N.get("value")
        this.traceEnd(N, result)
        return result
    }

    /*  evaluate special value literal  */
    evalLiteralValue (N) {
        this.traceBegin(N)
        const result = N.get("value")
        this.traceEnd(N, result)
        return result
    }
}

