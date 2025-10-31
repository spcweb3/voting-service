package main

import (
	"context"
	"testing"

	"voting-service/gen/proto/voting"

	"connectrpc.com/connect"
)

// TestGetVotingOptions 测试获取投票选项
func TestGetVotingOptions(t *testing.T) {
	// 创建服务器实例
	server := NewVotingServer()

	// 创建请求
	req := connect.NewRequest(&voting.GetVotingOptionsRequest{})

	// 调用方法
	resp, err := server.GetVotingOptions(context.Background(), req)
	if err != nil {
		t.Fatalf("GetVotingOptions failed: %v", err)
	}

	// 验证响应
	if resp.Msg.Topic != "你最喜欢的编程语言是什么？" {
		t.Errorf("Expected topic '你最喜欢的编程语言是什么？', got '%s'", resp.Msg.Topic)
	}

	if len(resp.Msg.Options) != 4 {
		t.Errorf("Expected 4 options, got %d", len(resp.Msg.Options))
	}
}

// TestVote 测试投票功能
func TestVote(t *testing.T) {
	server := NewVotingServer()

	// 测试有效投票
	req := connect.NewRequest(&voting.VoteRequest{OptionId: "1"})
	resp, err := server.Vote(context.Background(), req)
	if err != nil {
		t.Fatalf("Vote failed: %v", err)
	}

	if !resp.Msg.Success {
		t.Error("Expected vote to be successful")
	}

	// 测试无效投票
	req = connect.NewRequest(&voting.VoteRequest{OptionId: "invalid"})
	resp, err = server.Vote(context.Background(), req)
	if err != nil {
		t.Fatalf("Vote failed: %v", err)
	}

	if resp.Msg.Success {
		t.Error("Expected vote to fail for invalid option")
	}
}

// TestGetResults 测试获取结果
func TestGetResults(t *testing.T) {
	server := NewVotingServer()

	// 先投一票
	voteReq := connect.NewRequest(&voting.VoteRequest{OptionId: "1"})
	_, err := server.Vote(context.Background(), voteReq)
	if err != nil {
		t.Fatalf("Vote failed: %v", err)
	}

	// 获取结果
	req := connect.NewRequest(&voting.GetResultsRequest{})
	resp, err := server.GetResults(context.Background(), req)
	if err != nil {
		t.Fatalf("GetResults failed: %v", err)
	}

	// 验证结果
	if len(resp.Msg.Results) != 4 {
		t.Errorf("Expected 4 results, got %d", len(resp.Msg.Results))
	}

	// 检查选项1的票数
	for _, result := range resp.Msg.Results {
		if result.OptionId == "1" && result.Votes != 1 {
			t.Errorf("Expected 1 vote for option 1, got %d", result.Votes)
		}
	}
}

// TestConcurrentVoting 测试并发投票
func TestConcurrentVoting(t *testing.T) {
	server := NewVotingServer()

	// 使用 channel 来等待所有 goroutine 完成
	done := make(chan bool, 100)

	// 启动 100 个并发投票
	for i := 0; i < 100; i++ {
		go func() {
			req := connect.NewRequest(&voting.VoteRequest{OptionId: "2"})
			_, err := server.Vote(context.Background(), req)
			if err != nil {
				t.Errorf("Concurrent vote failed: %v", err)
			}
			done <- true
		}()
	}

	// 等待所有投票完成
	for i := 0; i < 100; i++ {
		<-done
	}

	// 检查结果
	req := connect.NewRequest(&voting.GetResultsRequest{})
	resp, err := server.GetResults(context.Background(), req)
	if err != nil {
		t.Fatalf("GetResults failed: %v", err)
	}

	// 查找选项2的票数
	for _, result := range resp.Msg.Results {
		if result.OptionId == "2" {
			if result.Votes != 100 {
				t.Errorf("Expected 100 votes for option 2, got %d", result.Votes)
			}
			return
		}
	}
	t.Error("Option 2 not found in results")
}