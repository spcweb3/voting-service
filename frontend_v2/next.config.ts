import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,

    // 配置重写规则，将前端请求代理到后端
    async rewrites() {
        return [
            {
                source: "/voting.VotingService/:path*",
                destination: "http://localhost:8080/voting.VotingService/:path*",
            },
        ];
    },

    // 允许跨域请求（可选，如果遇到 CORS 问题可以启用）
    async headers() {
        return [
            {
                source: "/voting.VotingService/:path*",
                headers: [
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
                    { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
                ],
            },
        ];
    },
};

export default nextConfig;
