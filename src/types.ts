export interface LogCluster {
  id: number;
  template: string[];
  size: number;
}

export type NodeChildren = Map<string, DrainNode>;

export interface DrainNode {
  children: NodeChildren;
  clusters: LogCluster[];
}
