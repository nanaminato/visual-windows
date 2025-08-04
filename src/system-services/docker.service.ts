export interface DockerContainerInfo {
  id: string;
  name: string;
  image: string;
  status: 'created' | 'running' | 'paused' | 'exited' | 'dead';
  createdAt: Date;
  ports?: Array<{ hostPort: number; containerPort: number; protocol: string }>;
  cpuUsage?: number;         // 百分比
  memoryUsage?: number;      // 单位MB
}

export interface IDockerService {
  listContainers(all?: boolean): Promise<DockerContainerInfo[]>;
  startContainer(containerId: string): Promise<void>;
  stopContainer(containerId: string): Promise<void>;
  restartContainer(containerId: string): Promise<void>;
  removeContainer(containerId: string): Promise<void>;
  getContainerLogs(containerId: string, options?: { tail?: number }): Promise<string>;
  watchContainerStats(containerId: string, callback: (stats: { cpu: number; memory: number }) => void): void;
  unwatchContainerStats(containerId: string): void;
}
