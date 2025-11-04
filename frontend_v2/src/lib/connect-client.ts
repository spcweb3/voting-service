import {
    VotingService,
    GetVotingOptionsRequest,
    GetVotingOptionsResponse,
    VoteRequest,
    VoteResponse,
    GetResultsRequest,
    GetResultsResponse,
} from "@/types/voting";

// 创建模拟的 Connect 客户端
class VotingServiceClient implements VotingService {
    private baseUrl: string;

    constructor(baseUrl: string = "http://localhost:8080") {
        this.baseUrl = baseUrl;
    }

    // 通用的 HTTP 请求方法 - 使用 ConnectRPC 兼容的格式
    private async request<T>(path: string, request: any): Promise<T> {
        const url = `${this.baseUrl}${path}`;

        console.log(`Making request to: ${url}`);
        console.log("Request data:", request);

        try {
            // 对于空请求，发送空的 JSON 对象
            const requestBody = Object.keys(request).length === 0 ? "{}" : JSON.stringify(request);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: requestBody,
            });

            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error:", errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log("Response data:", data);
            return data;
        } catch (error) {
            console.error(`Request to ${path} failed:`, error);
            throw new Error(`请求失败: ${error instanceof Error ? error.message : "未知错误"}`);
        }
    }

    // 获取投票选项
    async getVotingOptions(request: GetVotingOptionsRequest): Promise<GetVotingOptionsResponse> {
        return this.request<GetVotingOptionsResponse>("/voting.VotingService/GetVotingOptions", request);
    }

    // 提交投票
    async vote(request: VoteRequest): Promise<VoteResponse> {
        return this.request<VoteResponse>("/voting.VotingService/Vote", request);
    }

    // 获取投票结果
    async getResults(request: GetResultsRequest): Promise<GetResultsResponse> {
        return this.request<GetResultsResponse>("/voting.VotingService/GetResults", request);
    }

    // 直接调用测试 API（备用方案）
    async getVotingOptionsDirect(): Promise<GetVotingOptionsResponse> {
        const url = `${this.baseUrl}/api/getVotingOptions`;
        console.log(`Making direct request to: ${url}`);

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Direct API response:", data);
            return data;
        } catch (error) {
            console.error("Direct API request failed:", error);
            throw error;
        }
    }
}

// 创建并导出客户端实例
export const votingClient = new VotingServiceClient();

// 为了兼容性，也导出创建客户端的方法
export const createPromiseClient = () => votingClient;
