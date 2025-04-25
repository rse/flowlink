
FlowLink
====

**Flow Expression Language (FlowLink)**

<p/>
<img src="https://nodei.co/npm/flowlink.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/flowlink.png" alt=""/>

About
-----

FlowLink is a JavaScript library for use in the Browser and Node.js to
parse/compile expressions describing data flows. The expressions are
based on sequental flows, parallel flows and groups of nodes. FlowLink
is primarily intended to be used for configuring a complex data flow.
What the particular nodes represent is up to the caller.

Installation
------------

```shell
$ npm install flowlink
```

Usage
-----

```
$ cat sample.js
const FlowLink = require("..")

const flowlink = new FlowLink({
    trace: (msg) => console.log(msg)
})

class Node {
    constructor (id, opts, args) {
        this.id    = id
        this.opts  = opts
        this.args  = args
        this.piped = []
    }
    pipe (node) {
        this.piped.push(node)
    }
}

const expr = `
    begin(42, id: \`foo\${sample}bar\`) |
    { foo1("foo"), foo2('bar') } |
    { bar1, bar2 } |
    end,
    sidechain
`

try {
    const ast = flowlink.compile(expr)
    const stream = flowlink.execute(ast, {
        resolveVariable (id) {
            if (id === "sample")
                return "SAMPLE"
            throw new Error(`failed to resolve variable "${id}"`)
        },
        createNode (id, opts, args) {
            return new Node(id, opts, args)
        },
        connectNode (node1, node2) {
            node1.pipe(node2)
        }
    })
}
catch (ex) {
    console.log("ERROR", ex.toString())
}
```

Expression Language
-------------------

The following BNF-style grammar shows the supported expression language:

```
expr             ::= parallel
                   | sequential
                   | node
                   | group
parallel         ::= sequential ("," sequential)+
sequential       ::= node ("|" node)+
node             ::= id ("(" (param ("," param)*)? ")")?
param            ::= array | object | variable | template | string | number | value
group            ::= "{" expr "}"
id               ::= /[a-zA-Z_][a-zA-Z0-9_-]*/
variable         ::= id
array            ::= "[" (param ("," param)*)? "]"
object           ::= "{" (id ":" param ("," id ":" param)*)? "}"
template         ::= "`" ("${" variable "}" / ("\\`"|.))* "`"
string           ::= /"(\\"|.)*"/
                   | /'(\\'|.)*'/
number           ::= /[+-]?/ number-value
number-value     ::= "0b" /[01]+/
                   | "0o" /[0-7]+/
                   | "0x" /[0-9a-fA-F]+/
                   | /[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/
                   | /[0-9]+/
value            ::= "true" | "false" | "null" | "NaN" | "undefined"
```

Application Programming Interface (API)
---------------------------------------

The following TypeScript definition shows the supported Application Programming Interface (API):

```ts
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
```

Implementation Notice
---------------------

Although FlowLink is written in ECMAScript 2023, it is transpiled to older
environments and this way runs in really all current (as of 2024)
JavaScript environments, of course.

Additionally, there are two transpilation results: first, there is a
compressed `flowlink.browser.js` for Browser environments. Second, there is
an uncompressed `flowlink.node.js` for Node.js environments.

The Browser variant `flowlink.browser.js` has all external dependencies
`asty`, `pegjs-otf`, `pegjs-util`, and `cache-lru` directly embedded.
The Node.js variant `flowlink.node.js` still requires the external
dependencies `asty`, `pegjs-otf`, `pegjs-util`, and `cache-lru`.

License
-------

Copyright &copy; 2024-2025 Dr. Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

