import { LogClusterInterface, NodeInterface } from "../types.js";

class LogCluster implements LogClusterInterface {
  id: number;
  size: number;
  template: string[];

  constructor(templateTokens: string[], id: number) {
    this.id = id;
    this.template = templateTokens;
    this.size = 1;
  }
}

class Node implements NodeInterface {
  children: Map<string, NodeInterface>;
  clusterIds: number[];

  constructor() {
    this.children = new Map<string, NodeInterface>();
    this.clusterIds = [];
  }
}

export { LogCluster, Node };
