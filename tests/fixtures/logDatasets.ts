export interface DrainDataset {
  name: string;
  entries: string[];
  simTh?: number;
  expectedClusterCount: number;
}

export const drainDatasets: DrainDataset[] = [
  {
    name: "syslog authentication stream",
    simTh: 0.65,
    expectedClusterCount: 2,
    entries: [
      "Dec 10 07:07:38 LabSZ sshd[24206]: Failed password for invalid user test9 from 10.0.0.1 port 62891 ssh2",
      "Dec 10 07:08:28 LabSZ sshd[24208]: Failed password for invalid user webmaster from 10.0.0.1 port 62892 ssh2",
      "Dec 10 07:09:12 LabSZ sshd[24210]: Failed password for invalid user guest from 10.0.0.2 port 62893 ssh2",
      "Dec 10 07:10:05 LabSZ sshd[24211]: Accepted password for root from 10.0.0.5 port 51111 ssh2",
    ],
  },
  {
    name: "nginx access and error mix",
    simTh: 0.55,
    expectedClusterCount: 2,
    entries: [
      '10.0.0.1 - - [16/Apr/2026:10:00:00 +0000] "GET /api/v1/items?id=123 HTTP/1.1" 200 512 "-" "curl/8.0"',
      '10.0.0.1 - - [16/Apr/2026:10:00:01 +0000] "GET /api/v1/items?id=124 HTTP/1.1" 200 530 "-" "curl/8.0"',
      '10.0.0.2 - - [16/Apr/2026:10:00:02 +0000] "GET /api/v1/items?id=555 HTTP/1.1" 404 12 "-" "curl/8.0"',
      '2026/04/16 10:00:03 [error] 12#12: *1 open() "/var/www/html/favicon.ico" failed (2: No such file or directory), client: 10.0.0.1, server: _, request: "GET /favicon.ico HTTP/1.1", host: "example.com"',
    ],
  },
  {
    name: "application business events",
    simTh: 0.5,
    expectedClusterCount: 2,
    entries: [
      "INFO payment-service requestId=abc123 userId=42 action=charge amount=10 status=ok",
      "INFO payment-service requestId=abc124 userId=43 action=charge amount=12 status=ok",
      "INFO payment-service requestId=abc125 userId=44 action=charge amount=13 status=ok",
      "ERROR payment-service requestId=abc126 userId=44 action=refund amount=13 status=failed",
    ],
  },
];
