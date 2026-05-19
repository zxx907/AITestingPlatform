import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Copy, Download, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface APIRequest {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers: Record<string, string>;
  body: string;
}

interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  timestamp: string;
}

export default function APITesting() {
  const [activeTab, setActiveTab] = useState("request");
  const [request, setRequest] = useState<APIRequest>({
    method: "GET",
    url: "https://api.example.com/users",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_TOKEN"
    },
    body: ""
  });
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddHeader = () => {
    setRequest({
      ...request,
      headers: {
        ...request.headers,
        "X-Custom-Header": ""
      }
    });
  };

  const handleUpdateHeader = (key: string, newKey: string, value: string) => {
    const newHeaders = { ...request.headers };
    if (key !== newKey) {
      delete newHeaders[key];
    }
    newHeaders[newKey] = value;
    setRequest({ ...request, headers: newHeaders });
  };

  const handleDeleteHeader = (key: string) => {
    const newHeaders = { ...request.headers };
    delete newHeaders[key];
    setRequest({ ...request, headers: newHeaders });
  };

  const handleExecuteRequest = async () => {
    if (!request.url.trim()) {
      toast.error("请输入 API 地址");
      return;
    }

    setLoading(true);
    try {
      const startTime = Date.now();
      
      // 模拟 API 请求
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const duration = Date.now() - startTime;
      
      const mockResponse: APIResponse = {
        status: 200,
        statusText: "OK",
        headers: {
          "content-type": "application/json",
          "content-length": "256",
          "server": "nginx/1.21.0"
        },
        body: JSON.stringify({
          code: 0,
          message: "success",
          data: {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            createdAt: "2026-05-19T13:00:00Z"
          }
        }, null, 2),
        duration,
        timestamp: new Date().toISOString()
      };

      setResponse(mockResponse);
      toast.success("请求成功");
    } catch (error) {
      toast.error("请求失败");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500/10 text-green-400";
    if (status >= 300 && status < 400) return "bg-blue-500/10 text-blue-400";
    if (status >= 400 && status < 500) return "bg-yellow-500/10 text-yellow-400";
    return "bg-red-500/10 text-red-400";
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500/10 text-blue-400";
      case "POST":
        return "bg-green-500/10 text-green-400";
      case "PUT":
        return "bg-yellow-500/10 text-yellow-400";
      case "DELETE":
        return "bg-red-500/10 text-red-400";
      case "PATCH":
        return "bg-purple-500/10 text-purple-400";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="heading-lg">接口测试</h1>
        <p className="text-muted-foreground">
          配置并执行 HTTP 请求，实时查看响应结果和性能指标
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="request">请求配置</TabsTrigger>
          <TabsTrigger value="response">响应结果</TabsTrigger>
        </TabsList>

        {/* 请求配置标签页 */}
        <TabsContent value="request" className="space-y-4">
          <div className="blueprint-card p-6 space-y-4">
            {/* 请求方法和 URL */}
            <div className="flex gap-2">
              <Select value={request.method} onValueChange={(value) => setRequest({ ...request, method: value as any })}>
                <SelectTrigger className="w-32 bg-input border border-border rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={request.url}
                onChange={(e) => setRequest({ ...request, url: e.target.value })}
                className="flex-1 bg-input border border-border rounded-sm p-3 text-foreground"
              />
              <Button
                onClick={handleExecuteRequest}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                发送
              </Button>
            </div>

            {/* Headers */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">Headers</Label>
                <Button
                  onClick={handleAddHeader}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  + 添加
                </Button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {Object.entries(request.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <Input
                      placeholder="Header 名"
                      value={key}
                      onChange={(e) => handleUpdateHeader(key, e.target.value, value)}
                      className="flex-1 bg-input border border-border rounded-sm p-2 text-sm text-foreground"
                    />
                    <Input
                      placeholder="Header 值"
                      value={value}
                      onChange={(e) => handleUpdateHeader(key, key, e.target.value)}
                      className="flex-1 bg-input border border-border rounded-sm p-2 text-sm text-foreground"
                    />
                    <Button
                      onClick={() => handleDeleteHeader(key)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            {(request.method === "POST" || request.method === "PUT" || request.method === "PATCH") && (
              <div className="space-y-2">
                <Label htmlFor="body" className="text-sm font-semibold">
                  Body (JSON)
                </Label>
                <Textarea
                  id="body"
                  placeholder='{"key": "value"}'
                  value={request.body}
                  onChange={(e) => setRequest({ ...request, body: e.target.value })}
                  className="min-h-[150px] bg-input border border-border rounded-sm p-3 text-foreground font-mono text-sm"
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* 响应结果标签页 */}
        <TabsContent value="response" className="space-y-4">
          {response === null ? (
            <div className="blueprint-card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无响应数据，请先发送请求</p>
            </div>
          ) : (
            <>
              {/* 响应状态 */}
              <div className="blueprint-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {response.statusText}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {response.timestamp}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={`${getStatusColor(response.status)}`}>
                      {response.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{response.duration}ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 响应 Headers */}
              <div className="blueprint-card p-4 space-y-2">
                <h3 className="text-sm font-semibold text-accent uppercase">Response Headers</h3>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-mono">{key}:</span>
                      <span className="text-foreground font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 响应 Body */}
              <div className="blueprint-card p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-accent uppercase">Response Body</h3>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(response.body);
                      toast.success("已复制到剪贴板");
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </Button>
                </div>
                <pre className="code-blueprint overflow-x-auto text-xs">
                  {response.body}
                </pre>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
