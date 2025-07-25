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
import util from "./flowlink-util.js"

/*  the exported class  */
export default class FlowLinkTrace {
    constructor (trace = null) {
        this.trace = trace
    }

    /*  determine output prefix based on tree depth  */
    prefixOf (N) {
        let depth = 0
        let node = N
        while ((node = node.parent()) !== null)
            depth++
        return util.pad("", 4 * depth)
    }

    /*  begin tracing step  */
    traceBegin (N) {
        if (this.trace === null)
            return
        const prefix = this.prefixOf(N)
        this.trace("execute: | " + prefix + N.type() + " {")
    }

    /*  end tracing step  */
    traceEnd (N, val) {
        if (this.trace === null)
            return
        const prefix = this.prefixOf(N)
        let result
        if (val === undefined)
            result = "undefined"
        else if (typeof val === "function")
            result = `[Function: ${val.name}]`
        else if (typeof val === "object" && val instanceof RegExp)
            result = val.toString()
        else
            result = JSON.stringify(val)
        if (result.length > 40)
            result = result.substr(0, 40) + "..."
        this.trace("execute: | " + prefix + "}: " + result)
    }
}

