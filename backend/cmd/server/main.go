package main

import (
	"context"
	"log"
	"net/http"
	"sync"

	"voting-service/gen/proto/voting"
	"voting-service/gen/proto/voting/votingconnect"

	"connectrpc.com/connect"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

// VoteCounter 管理投票计数
type VoteCounter struct {
	mu      sync.RWMutex
	results map[string]*voting.Result
	options map[string]*voting.Option
}

// NewVoteCounter 创建新的投票计数器
func NewVoteCounter() *VoteCounter {
	options := map[string]*voting.Option{
		"1": {Id: "1", Text: "选项 A: TypeScript"},
		"2": {Id: "2", Text: "选项 B: Go"},
		"3": {Id: "3", Text: "选项 C: Python"},
		"4": {Id: "4", Text: "选项 D: Rust"},
	}

	results := make(map[string]*voting.Result)
	for id, option := range options {
		results[id] = &voting.Result{
			OptionId:   id,
			OptionText: option.Text,
			Votes:      0,
		}
	}

	return &VoteCounter{
		results: results,
		options: options,
	}
}

// Vote 对指定选项投票
func (vc *VoteCounter) Vote(optionID string) bool {
	vc.mu.Lock()
	defer vc.mu.Unlock()

	if result, exists := vc.results[optionID]; exists {
		result.Votes++
		return true
	}
	return false
}

// GetResults 获取所有结果
func (vc *VoteCounter) GetResults() []*voting.Result {
	vc.mu.RLock()
	defer vc.mu.RUnlock()

	results := make([]*voting.Result, 0, len(vc.results))
	for _, result := range vc.results {
		results = append(results, &voting.Result{
			OptionId:   result.OptionId,
			OptionText: result.OptionText,
			Votes:      result.Votes,
		})
	}
	return results
}

// GetOptions 获取所有选项
func (vc *VoteCounter) GetOptions() []*voting.Option {
	vc.mu.RLock()
	defer vc.mu.RUnlock()

	options := make([]*voting.Option, 0, len(vc.options))
	for _, option := range vc.options {
		options = append(options, &voting.Option{
			Id:   option.Id,
			Text: option.Text,
		})
	}
	return options
}

// VotingServer 实现 VotingService
type VotingServer struct {
	counter *VoteCounter
}

// NewVotingServer 创建新的投票服务器
func NewVotingServer() *VotingServer {
	return &VotingServer{
		counter: NewVoteCounter(),
	}
}

// GetVotingOptions 返回投票选项
func (s *VotingServer) GetVotingOptions(
	ctx context.Context,
	req *connect.Request[voting.GetVotingOptionsRequest],
) (*connect.Response[voting.GetVotingOptionsResponse], error) {
	log.Println("GetVotingOptions called")

	response := &voting.GetVotingOptionsResponse{
		Topic:   "你最喜欢的编程语言是什么？",
		Options: s.counter.GetOptions(),
	}

	return connect.NewResponse(response), nil
}

// Vote 处理投票
func (s *VotingServer) Vote(
	ctx context.Context,
	req *connect.Request[voting.VoteRequest],
) (*connect.Response[voting.VoteResponse], error) {
	log.Printf("Vote called for option: %s", req.Msg.OptionId)

	success := s.counter.Vote(req.Msg.OptionId)

	var response *voting.VoteResponse
	if success {
		response = &voting.VoteResponse{
			Success: true,
			Message: "投票成功！",
		}
	} else {
		response = &voting.VoteResponse{
			Success: false,
			Message: "投票失败：无效的选项ID",
		}
	}

	return connect.NewResponse(response), nil
}

// GetResults 获取投票结果
func (s *VotingServer) GetResults(
	ctx context.Context,
	req *connect.Request[voting.GetResultsRequest],
) (*connect.Response[voting.GetResultsResponse], error) {
	log.Println("GetResults called")

	response := &voting.GetResultsResponse{
		Results: s.counter.GetResults(),
	}

	return connect.NewResponse(response), nil
}

// CORS 中间件
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 设置 CORS 头
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Connect-Protocol-Version")
		
		// 处理预检请求
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}

func main() {
	// 创建服务器
	server := NewVotingServer()

	// 设置路由
	mux := http.NewServeMux()
	
	// 注册 Connect 服务 - 使用 JSON 编码
	path, handler := votingconnect.NewVotingServiceHandler(server)
	mux.Handle(path, handler)

	// 添加健康检查端点
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
		log.Println("Health check called")
	})

	// 添加测试端点 - 用于直接测试 JSON API
	mux.HandleFunc("/api/getVotingOptions", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		log.Println("Direct API: GetVotingOptions called")
		
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		
		// 手动编码 JSON
		jsonResponse := `{"topic":"你最喜欢的编程语言是什么？","options":[{"id":"1","text":"选项 A: TypeScript"},{"id":"2","text":"选项 B: Go"},{"id":"3","text":"选项 C: Python"},{"id":"4","text":"选项 D: Rust"}]}`
		w.Write([]byte(jsonResponse))
	})

	// 应用 CORS 中间件
	handlerWithCORS := enableCORS(mux)

	// 配置服务器地址
	addr := ":8080"
	log.Printf("Starting server on http://localhost%s", addr)
	log.Printf("Health check: http://localhost%s/health", addr)
	log.Printf("Direct API test: http://localhost%s/api/getVotingOptions", addr)
	log.Printf("ConnectRPC service available at http://localhost%s%s", addr, path)

	// 启动 HTTP/2 服务器
	err := http.ListenAndServe(
		addr,
		// 使用 h2c 以支持 HTTP/2 而不需要 TLS
		h2c.NewHandler(handlerWithCORS, &http2.Server{}),
	)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}