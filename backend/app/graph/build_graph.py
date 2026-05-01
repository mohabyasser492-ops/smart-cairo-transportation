from app.graph.graph import Graph
from app.services.data_service import load_json

def build_graph():
    graph = Graph()
    for node in load_json('neighborhoods.json') + load_json('facilities.json'):
        graph.add_node(node['id'], node)
    for road in load_json('existing_roads.json'):
        graph.add_edge(road['from'], road['to'], road)
    return graph
