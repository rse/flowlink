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

export default class FlowLinkUtil {
    /*  pad a string with spaces to the left/right  */
    static pad (str, num) {
        const n = num < 0 ? -num : num
        if (str.length > n)
            str = str.substr(0, n)
        else {
            const pad = Array((n + 1) - str.length).join(" ")
            str = num < 0 ? (str + pad) : (pad + str)
        }
        return str
    }

    /*  check whether value is "true" (or can be considered to be true)  */
    static truthy (value) {
        let result
        switch (typeof value) {
            case "boolean":
                result = value
                break
            case "number":
                result = (value !== 0 && !isNaN(value))
                break
            case "string":
                result = (value !== "")
                break
            case "object":
                result = false
                if (value !== null) {
                    result = true
                    if (value instanceof Array)
                        result = value.length > 0
                    else
                        result = Object.keys(value).length > 0
                }
                break
            default:
                result = false
        }
        return result
    }

    /*  coerce value to particular type  */
    static coerce (value, type) {
        /* eslint valid-typeof: off */
        if (typeof value !== type) {
            try {
                switch (type) {
                    case "boolean":
                        if (typeof value !== "boolean")
                            value = Boolean(value)
                        break
                    case "number":
                        if (typeof value !== "number")
                            value = Number(value)
                        break
                    case "string":
                        if (typeof value !== "string")
                            value = String(value)
                        break
                    case "regexp":
                        if (!(typeof value === "object" && value instanceof RegExp))
                            value = new RegExp(value)
                        break
                    case "array":
                        if (typeof value === "object" && !(value instanceof Array) && value !== null)
                            value = Object.keys(value)
                        else if (!(typeof value === "object" && value instanceof Array))
                            value = [ String(value) ]
                        break
                    case "object":
                        if (typeof value === "object" && value instanceof Array)
                            value = value.reduce((obj, el) => { obj[el] = true; return obj }, {})
                        else if (!(typeof value === "object"))
                            value = { [String(value)]: true }
                        break
                }
            }
            catch (e) {
                throw new Error("cannot coerce value into type " + type)
            }
        }
        return value
    }

    /*  determine type pair  */
    static typePair (v1, v2) {
        if (typeof v1 === "string")
            return "string:any"
        else if (typeof v1 === "object" && v1 !== null) {
            if (v1 instanceof Array) {
                if (typeof v2 === "object" && v2 instanceof Array && v2 !== null)
                    return "array:array"
                else if (typeof v2 === "object" && !(v2 instanceof Array) && v2 !== null)
                    return "array:object"
                else
                    return "array:scalar"
            }
            else {
                if (typeof v2 === "object" && v2 instanceof Array && v2 !== null)
                    return "object:array"
                else if (typeof v2 === "object" && !(v2 instanceof Array) && v2 !== null)
                    return "object:object"
                else
                    return "object:scalar"
            }
        }
        else
            return "any:any"
    }
}

