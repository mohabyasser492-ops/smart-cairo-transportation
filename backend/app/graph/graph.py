class Graph:
    def __init__(self):
        self.nodes = {}
        self.adj = {}

    def add_node(self, node_id, data=None):
        self.nodes[node_id] = data or {}
        self.adj.setdefault(node_id, [])

    def add_edge(self, source, target, data=None, undirected=True):
        self.adj.setdefault(source, []).append({'to': target, **(data or {})})
        if undirected:
            self.adj.setdefault(target, []).append({'to': source, **(data or {})})

    def neighbors(self, node_id):
        return self.adj.get(node_id, [])
