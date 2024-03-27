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

{
    /*  standard PEGUtil integration code  */
    var unroll = options.util.makeUnroll(location, options)
    var ast    = options.util.makeAST   (location, options)
}

/*
**  ==== EXPRESSION ====
*/

expression
    =   _ e:expr _ eof {
            return e
        }

expr
    =   exprParallel

exprParallel
    =   head:exprSequential tail:(_ "," _ exprSequential)+ {
            return tail.reduce((result, element) => {
                return result.add(element[3])
            }, ast("Parallel").add(head))
        }
    /   exprSequential

exprSequential
    =   head:exprNode tail:(_ "|" _ exprNode)+ {
            return tail.reduce((result, element) => {
                return result.add(element[3])
            }, ast("Sequential").add(head))
        }
    /   exprNode

exprNode
    =   id:id _ "(" _ p:exprNodeParams? _ ")" {
            return ast("Node").merge(id).add(p)
        }
    /   id:id {
            return ast("Node").merge(id)
        }
    /   exprGroup

exprNodeParams
    =   head:exprNodeParam tail:(_ "," _ exprNodeParam)* {
            return tail.reduce((result, element) => {
                return [ ...result, element[3] ]
            }, [ head ])
        }

exprNodeParam
    =   id:id _ ":" _ p:exprNodeParamValue {
            return ast("NodeParamNamed").merge(id).add(p)
        }
    /   p:exprNodeParamValue {
            return ast("NodeParamPositional").add(p)
        }

exprNodeParamValue
    =   exprLiteralArray
    /   exprLiteralObject
    /   exprLiteralOther
    /   exprVariable

exprGroup
    =   "{" _ e:expr _ "}" {  /* RECURSION */
             return e
        }

exprLiteralArray
    =   "[" _ "]" {
            return ast("LiteralArray")
        }
    /   "[" _ l:exprLiteralArrayItems _ "]" {
            return ast("LiteralArray").add(l)
        }

exprLiteralArrayItems
    =   f:exprNodeParamValue l:(_ "," _ exprNodeParamValue)* { /* RECURSION */
            return unroll(f, l, 3)
        }

exprLiteralObject
    =   "{" _ "}" {
            return ast("LiteralObject")
        }
    /   "{" _ l:exprLiteralObjectItems _ "}" {
            return ast("LiteralObject").add(l)
        }

exprLiteralObjectItems
    =   f:exprLiteralObjectItem l:(_ "," _ exprLiteralObjectItem)* {
            return unroll(f, l, 3)
        }

exprLiteralObjectItem
    =   key:id _ ":" _ e:exprNodeParamValue { /* RECURSION */
            return ast("LiteralObjectItem").set({ key: key.get("id") }).add(e)
        }
    /   key:string _ ":" _ e:exprNodeParamValue { /* RECURSION */
            return ast("LiteralObjectItem").set({ key: key.get("value") }).add(e)
        }

exprVariable "variable"
    =   v:variable {
            return v
        }

exprLiteralOther
    =   template
    /   string
    /   number
    /   value

/*
**  ==== LITERALS ====
*/

variable "variable"
    =   v:$(!value [a-zA-Z_][a-zA-Z0-9_]* ("." [a-zA-Z_][a-zA-Z0-9_]*)*) {
            return ast("Variable").set({ id: v })
        }

id "identifier"
    =   id:$(!value [a-zA-Z_][a-zA-Z0-9_-]*) {
            return ast("Identifier").set({ id: id })
        }

template "template"
    =   "`" l:(templateInterpolation / templateString)* "`" {
            return ast("LiteralTemplate").add(l)
        }

templateInterpolation "template interpolation"
    =   "${" _ e:exprVariable _ "}" {
            return e
        }

templateString "template string"
    =   s:$((templateEscapedChar / templateChar)+) {
            return ast("LiteralString").set({ value: s })
        }

templateChar "template string character"
    =   $(!"`" !"${" .)

templateEscapedChar "escaped template string character"
    =   "\\\\" { return "\\"   }
    /   "\\`"  { return "`"    }
    /   "\\b"  { return "\b"   }
    /   "\\v"  { return "\x0B" }
    /   "\\f"  { return "\f"   }
    /   "\\t"  { return "\t"   }
    /   "\\r"  { return "\r"   }
    /   "\\n"  { return "\n"   }
    /   "\\e"  { return "\x1B" }
    /   "\\x" n:$([0-9a-fA-F][0-9a-fA-F]) {
            return String.fromCharCode(parseInt(n, 16))
        }
    /   "\\u" n:$([0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) {
            return String.fromCharCode(parseInt(n, 16))
        }

string "quoted string literal"
    =   "\"" s:((stringEscapedCharDQ / [^"])*) "\"" {
            return ast("LiteralString").set({ value: s.join("") })
        }
    /   "'" s:((stringEscapedCharSQ / [^'])*) "'" {
            return ast("LiteralString").set({ value: s.join("") })
        }

stringEscapedCharDQ "escaped double-quoted-string character"
    =   "\\\\" { return "\\"   }
    /   "\\\"" { return "\""   }
    /   "\\b"  { return "\b"   }
    /   "\\v"  { return "\x0B" }
    /   "\\f"  { return "\f"   }
    /   "\\t"  { return "\t"   }
    /   "\\r"  { return "\r"   }
    /   "\\n"  { return "\n"   }
    /   "\\e"  { return "\x1B" }
    /   "\\x" n:$([0-9a-fA-F][0-9a-fA-F]) {
            return String.fromCharCode(parseInt(n, 16))
        }
    /   "\\u" n:$([0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) {
            return String.fromCharCode(parseInt(n, 16))
        }

stringEscapedCharSQ "escaped single-quoted-string character"
    =   "\\'"  { return "'"    }

number "numeric literal"
    =   s:$([+-]?) "0b" n:$([01]+) {
            return ast("LiteralNumber").set({ value: parseInt(s + n, 2) })
        }
    /   s:$([+-]?) "0o" n:$([0-7]+) {
            return ast("LiteralNumber").set({ value: parseInt(s + n, 8) })
        }
    /   s:$([+-]?) "0x" n:$([0-9a-fA-F]+) {
            return ast("LiteralNumber").set({ value: parseInt(s + n, 16) })
        }
    /   n:$([+-]? [0-9]* "." [0-9]+ ([eE] [+-]? [0-9]+)?) {
            return ast("LiteralNumber").set({ value: parseFloat(n) })
        }
    /   n:$([+-]? [0-9]+) {
            return ast("LiteralNumber").set({ value: parseInt(n, 10) })
        }

value "value literal"
    =   "true"      { return ast("LiteralValue").set({ value: true      }) }
    /   "false"     { return ast("LiteralValue").set({ value: false     }) }
    /   "null"      { return ast("LiteralValue").set({ value: null      }) }
    /   "NaN"       { return ast("LiteralValue").set({ value: NaN       }) }
    /   "undefined" { return ast("LiteralValue").set({ value: undefined }) }

/*
**  ==== GLUE ====
*/

_ "optional blank"
    =   (co / ws)*

co "multi-line comment"
    =   "/*" (!"*/" .)* "*/"

ws "any whitespaces"
    =   [ \t\r\n]+

eof "end of file"
    =   !.

