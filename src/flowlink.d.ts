/*
**  FlowLink -- Flow Expression Language
**  Copyright (c) 2024 Dr. Ralf S. Engelschall <rse@engelschall.com>
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

declare module "flowlink" {
    type FlowLinkCallbacks<T> = {
        resolveVariable(id: string): string,
        createNode(id: string, opts: { [ id: string ]: any }, args: any[]): T,
        connectNode(node1: T, node2: T): void
    }
    type FlowLinkAST = unknown
    type FlowLinkResult<T> = { head: T[], tail: T[] }
    class FlowLink<T> {
        constructor(
            options?: {
                cache?: number,
                trace?: (msg: string) => void
            }
        )
        compile(
            expr: string
        ): FlowLinkAST
        execute(
            ast: FlowLinkAST,
            callbacks: FlowLinkCallbacks<T>
        ): FlowLinkResult<T>
        evaluate(
            expr: string,
            callbacks: FlowLinkCallbacks<T>
        ): FlowLinkResult<T>
    }
    export = FlowLink
}

