export interface LogClusterInterface {
  id: number;
  template: string[];
  size: number;
}

export interface NodeInterface {
  children: Map<string, NodeInterface>;
  clusterIds: number[];
}
