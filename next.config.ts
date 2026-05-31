import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  async headers() {
    return [
      {
        source: "/backrooms/Build/:file*.wasm.unityweb",
        headers: [
          { key: "Content-Encoding", value: "gzip" },
          { key: "Content-Type", value: "application/wasm" },
        ],
      },
      {
        source: "/backrooms/Build/:file*.js.unityweb",
        headers: [
          { key: "Content-Encoding", value: "gzip" },
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
      {
        source: "/backrooms/Build/:file*.data.unityweb",
        headers: [
          { key: "Content-Encoding", value: "gzip" },
          { key: "Content-Type", value: "application/octet-stream" },
        ],
      },
    ];
  },
};

export default nextConfig;
