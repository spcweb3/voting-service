// 投票相关的 TypeScript 类型定义

// 投票选项
export interface Option {
    id: string;
    text: string;
}

// 投票结果
export interface Result {
    optionId: string;
    optionText: string;
    votes: number;
}

// RPC 请求和响应类型
export interface GetVotingOptionsRequest {}

export interface GetVotingOptionsResponse {
    topic: string;
    options: Option[];
}

export interface VoteRequest {
    optionId: string;
}

export interface VoteResponse {
    success: boolean;
    message: string;
}

export interface GetResultsRequest {}

export interface GetResultsResponse {
    results: Result[];
}

// 客户端服务接口
export interface VotingService {
    getVotingOptions(request: GetVotingOptionsRequest): Promise<GetVotingOptionsResponse>;
    vote(request: VoteRequest): Promise<VoteResponse>;
    getResults(request: GetResultsRequest): Promise<GetResultsResponse>;
}
