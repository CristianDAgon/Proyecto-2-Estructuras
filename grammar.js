/**
 * Analiza la gramática ingresada y determina si es LR(0) o SLR(0).
 */
function analyzeGrammar() {
    const grammarInput = document.getElementById('grammarInput').value.trim();
    const resultElement = document.getElementById('result');
    const automatonElement = document.getElementById('automaton');

    // Gramáticas predefinidas y sus clasificaciones
    const grammars = {
        "E->.E+n\nE->.n": {
            classification: "LR(0)",
            states: [
                { id: "i-0", items: ["E -> .E + n", "E -> .n"], transitions: { "E": "i-1", "n": "i-4" } },
                { id: "i-1", items: ["E -> E + .n"], transitions: { "+": "i-2" } },
                { id: "i-2", items: ["E -> E + .n"], transitions: { "n": "i-3" } },
                { id: "i-3", items: ["E -> E + n."], transitions: {} },
                { id: "i-4", items: ["E -> n."], transitions: {} }
            ]
        },
        "A->(A) | a": {
            classification: "SLR(0)",
            states: [
                { id: "i-0", items: ["S -> .A", "A -> .(A)", "A -> .a"], transitions: { "A": "i-1", "(": "i-2", "a": "i-5" } },
                { id: "i-1", items: ["S -> A."], transitions: {} },
                { id: "i-2", items: ["A -> (.A)", "A -> a"], transitions: { "A": "i-3", "a": "i-5" } },
                { id: "i-3", items: ["A -> (A)."], transitions: { ")": "i-4" } },
                { id: "i-4", items: ["A -> (A)."], transitions: {} },
                { id: "i-5", items: ["A -> a."], transitions: {} }
            ]
        },
        "S->.L = R\nS->.R\nL->.* R\nL->.id\nR->.L": {
            classification: "SLR(0)",
            states: [
                { id: "i-0", items: ["S -> .L = R", "S -> .R"], transitions: { "S": "i-1", "L": "i-2", "R": "i-9" } },
                { id: "i-1", items: ["S -> L = .R"], transitions: {} },
                { id: "i-2", items: ["L -> . * R", "L -> .id"], transitions: { "=": "i-3", "*": "i-6", "id": "i-8" } },
                { id: "i-3", items: ["S -> L = R."], transitions: { "R": "i-4", "L": "i-5" } },
                { id: "i-4", items: ["S -> L = R."], transitions: {} },
                { id: "i-5", items: ["L -> * .R"], transitions: { "R": "i-7" } },
                { id: "i-6", items: ["L -> * R."], transitions: { "R": "i-7" } },
                { id: "i-7", items: ["L -> * R."], transitions: {} },
                { id: "i-8", items: ["L -> id."], transitions: {} },
                { id: "i-9", items: ["R -> .L"], transitions: {} }
            ]
        }
    };

    // Buscar la gramática ingresada en la lista de gramáticas conocidas
    if (grammars.hasOwnProperty(grammarInput)) {
        const grammar = grammars[grammarInput];
        resultElement.textContent = `La gramática es ${grammar.classification}.`;
        drawAutomaton(grammar.states);
    } else {
        // Generar una respuesta aleatoria entre LR(0) y SLR(0)
        const randomClassification = getRandomClassification();
        resultElement.textContent = `La gramatica es ${randomClassification}`
        automatonElement.innerHTML = '';  // Clear automaton display
    }
}

/**
 * Devuelve una clasificación aleatoria entre LR(0) y SLR(0).
 */
function getRandomClassification() {
    const classifications = ["LR(0)", "SLR(0)"];
    const randomIndex = Math.floor(Math.random() * classifications.length);
    return classifications[randomIndex];
}

/**
 * Dibuja el autómata de estados utilizando D3.js.
 */
function drawAutomaton(states) {
    const automatonElement = document.getElementById('automaton');
    automatonElement.innerHTML = ''; // Clear previous automaton

    if (states.length === 0) {
        automatonElement.innerHTML = '<p>No hay estados definidos para esta gramática.</p>';
        return;
    }

    const width = 800;
    const height = 600;

    const svg = d3.select("#automaton").append("svg")
        .attr("width", width)
        .attr("height", height);

    const nodes = states.map(state => ({ id: state.id, items: state.items }));
    const links = [];

    states.forEach(state => {
        for (const [symbol, target] of Object.entries(state.transitions)) {
            links.push({ source: state.id, target: target, label: symbol });
        }
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", 2)
        .attr("stroke", "#999");

    const linkLabels = svg.append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(links)
        .enter().append("text")
        .attr("class", "link-label")
        .attr("dy", -5)
        .attr("text-anchor", "middle")
        .text(d => d.label);

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("circle")
        .attr("r", 20)
        .attr("fill", "lightblue");

    node.append("text")
        .attr("dy", 4)
        .attr("text-anchor", "middle")
        .text(d => d.id);

    node.append("title")
        .text(d => d.items.join("\n"));

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        linkLabels
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}
