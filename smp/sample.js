
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
    dump (depth = 0) {
        const prefix = "".padStart(depth * 4, " ")
        let opts = ""
        for (const key of Object.keys(this.opts)) {
            if (opts !== "")
                opts += ", "
            opts += `${key}: ${this.opts[key]}`
        }
        const args = this.args.join(", ")
        let sig = ""
        if (opts !== "" || args !== "")
            sig = "(" + opts + (opts !== "" && args !== "" ? ", " : "") + args + ")"
        console.log(`${prefix}${this.id}${sig}`)
        this.piped.forEach((node) => node.dump(depth + 1))
    }
}

const expr = `
    begin(42, id: \`foo\${sample}bar\`) |
    { foo1("foo"), foo2('bar') } |
    { bar1 >>foo, bar2 <foo } |
    end,
    sidechain
`

try {
    const ast = flowlink.compile(expr)
    flowlink.execute(ast, {
        resolveVariable: (id) => {
            if (id === "sample")
                return "SAMPLE"
            else
                throw new Error("failed to resolve variable")
        },
        createNode: (id, opts, args) => {
            console.log("CREATE", id, opts, args)
            const node = new Node(id, opts, args)
            return node
        },
        connectNodes: (node1, node2) => {
            console.log("CONNECT", node1.id, node2.id)
            node1.pipe(node2)
        }
    })
}
catch (ex) {
    console.log("ERROR", ex.toString(), ex.stack)
}

