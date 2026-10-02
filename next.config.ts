import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The layout library is read from disk at runtime, so the tracer has to be told to ship it.
  outputFileTracingIncludes: { "/api/**": ["./src/lib/agent/examples/crello.json.gz"] },
};

export default nextConfig;
