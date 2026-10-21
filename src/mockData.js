export const mockStreams = [
  {
    id: "A",
    name: "Primary Server",
    status: "live",
    sequence: 6042,
    segmentDuration: 4.004,
    buffer: 80,
    latency: 2.1,
    error: null
  },
  {
    id: "B",
    name: "Backup Server",
    status: "delayed",
    sequence: 5972,
    segmentDuration: 4.004,
    buffer: 75,
    latency: 42.0,
    error: null
  },
  {
    id: "C",
    name: "Server 3",
    status: "offline",
    sequence: 0,
    segmentDuration: 4.004,
    buffer: 0,
    latency: 0,
    error: "404 Not Found"
  }
];
