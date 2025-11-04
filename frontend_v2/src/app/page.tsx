"use client";

import { useState, useEffect } from "react";
import { votingClient } from "@/lib/connect-client";
import type { Option, Result } from "@/types/voting";

export default function VotingPage() {
    // 状态管理
    const [topic, setTopic] = useState<string>(""); // 投票主题
    const [options, setOptions] = useState<Option[]>([]); // 投票选项
    const [selectedOption, setSelectedOption] = useState<string>(""); // 选中的选项
    const [results, setResults] = useState<Result[]>([]); // 投票结果
    const [loading, setLoading] = useState<boolean>(false); // 加载状态
    const [message, setMessage] = useState<string>(""); // 消息提示
    const [error, setError] = useState<string>(""); // 错误信息

    // 组件挂载时获取投票选项
    useEffect(() => {
        loadVotingOptions();
    }, []);

    // 加载投票选项
    const loadVotingOptions = async () => {
        try {
            setLoading(true);
            setError("");
            console.log("正在加载投票选项...");

            // 调用 GetVotingOptions 方法
            const response = await votingClient.getVotingOptions({});

            console.log("收到投票选项响应:", response);
            setTopic(response.topic); // 设置投票主题
            setOptions(response.options); // 设置投票选项
            setMessage(""); // 清空消息
        } catch (error) {
            console.error("加载投票选项失败:", error);
            const errorMessage = error instanceof Error ? error.message : "未知错误";
            setError(`加载投票选项失败: ${errorMessage}`);
            setMessage("加载投票选项失败，请检查后端服务是否运行");
        } finally {
            setLoading(false);
        }
    };

    // 提交投票
    const submitVote = async () => {
        if (!selectedOption) {
            setMessage("请选择一个选项");
            return;
        }

        try {
            setLoading(true);
            setError("");
            console.log(`正在提交投票，选项ID: ${selectedOption}`);

            // 创建投票请求
            const request = { optionId: selectedOption };

            // 调用 Vote 方法
            const response = await votingClient.vote(request);

            console.log("投票响应:", response);

            if (response.success) {
                setMessage("投票成功！");
                setSelectedOption(""); // 清空选择
                // 重新加载结果
                await loadResults();
            } else {
                setMessage(response.message || "投票失败");
            }
        } catch (error) {
            console.error("提交投票失败:", error);
            const errorMessage = error instanceof Error ? error.message : "未知错误";
            setError(`提交投票失败: ${errorMessage}`);
            setMessage("投票提交失败，请检查网络连接和后端服务");
        } finally {
            setLoading(false);
        }
    };

    // 加载投票结果
    const loadResults = async () => {
        try {
            setError("");
            console.log("正在加载投票结果...");

            // 调用 GetResults 方法
            const response = await votingClient.getResults({});

            console.log("收到投票结果:", response);
            setResults(response.results); // 设置投票结果
        } catch (error) {
            console.error("加载结果失败:", error);
            const errorMessage = error instanceof Error ? error.message : "未知错误";
            setError(`加载结果失败: ${errorMessage}`);
            setMessage("加载结果失败");
        }
    };

    // 处理选项选择
    const handleOptionSelect = (optionId: string) => {
        setSelectedOption(optionId);
        setMessage(""); // 清空消息
        setError(""); // 清空错误
    };

    // 重试连接
    const retryConnection = () => {
        setError("");
        setMessage("正在重新连接...");
        loadVotingOptions();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">编程语言投票系统</h1>
                    <p className="text-gray-600">选择你最喜欢的编程语言</p>
                </div>

                {/* 错误信息 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">连接错误</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={retryConnection}
                                        className="bg-red-100 text-red-800 px-3 py-2 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                                    >
                                        重试连接
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 投票主题 */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h2 className="text-xl font-semibold text-center text-blue-800">{topic || "正在加载投票主题..."}</h2>
                </div>

                {/* 加载状态 */}
                {loading && (
                    <div className="flex justify-center items-center mb-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-blue-600 font-medium">处理中...</span>
                    </div>
                )}

                {/* 消息提示 */}
                {message && !error && (
                    <div
                        className={`p-4 rounded-lg mb-6 text-center ${
                            message.includes("成功")
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        }`}
                    >
                        {message}
                    </div>
                )}

                {/* 投票选项 */}
                <div className="space-y-3 mb-8">
                    <h3 className="text-lg font-medium text-gray-700 mb-4">请选择：</h3>
                    {options.length > 0
                        ? options.map((option) => (
                              <div
                                  key={option.id}
                                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                      selectedOption === option.id
                                          ? "border-blue-500 bg-blue-50 shadow-md"
                                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25"
                                  }`}
                                  onClick={() => handleOptionSelect(option.id)}
                              >
                                  <div className="flex items-center">
                                      <div
                                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                                              selectedOption === option.id ? "border-blue-500 bg-blue-500" : "border-gray-400"
                                          }`}
                                      >
                                          {selectedOption === option.id && <div className="h-2 w-2 rounded-full bg-white"></div>}
                                      </div>
                                      <span className="text-gray-800 font-medium">{option.text}</span>
                                  </div>
                              </div>
                          ))
                        : !loading &&
                          !error && <div className="text-center py-8 text-gray-500">暂无投票选项，请检查后端服务</div>}
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <button
                        onClick={submitVote}
                        disabled={loading || !selectedOption || !!error}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md disabled:cursor-not-allowed"
                    >
                        {loading ? "提交中..." : "提交投票"}
                    </button>

                    <button
                        onClick={loadResults}
                        disabled={loading || !!error}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md disabled:cursor-not-allowed"
                    >
                        查看实时结果
                    </button>
                </div>

                {/* 投票结果 */}
                {results.length > 0 && (
                    <div className="border-t pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">当前投票结果</h2>
                        <div className="space-y-4">
                            {results
                                .sort((a, b) => b.votes - a.votes) // 按票数降序排列
                                .map((result, index) => (
                                    <div
                                        key={result.optionId}
                                        className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 shadow-sm border"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-gray-800 text-lg">{result.optionText}</span>
                                            {index === 0 && results[0].votes > 0 && (
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                                                    领先
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 bg-gray-200 rounded-full h-3 mr-4">
                                                <div
                                                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.max(
                                                            5,
                                                            (result.votes /
                                                                Math.max(1, Math.max(...results.map((r) => r.votes)))) *
                                                                100
                                                        )}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold min-w-16 text-center">
                                                {result.votes} 票
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* 总票数统计 */}
                        <div className="mt-6 text-center text-gray-600">
                            总票数: {results.reduce((total, result) => total + result.votes, 0)} 票
                        </div>
                    </div>
                )}

                {/* 调试信息（开发时显示） */}
                {process.env.NODE_ENV === "development" && (
                    <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                        <h3 className="text-sm font-mono text-gray-700 mb-2">调试信息：</h3>
                        <div className="text-xs text-gray-600 space-y-1">
                            <div>后端地址: http://localhost:8080</div>
                            <div>选中的选项: {selectedOption || "无"}</div>
                            <div>选项数量: {options.length}</div>
                            <div>结果数量: {results.length}</div>
                            <div>错误状态: {error || "无"}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
