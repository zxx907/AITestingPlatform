import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PerformanceMetrics {
  timestamp: string;
  tps: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
  activeThreads: number;
}

interface TestConfig {
  url: string;
  method: string;
  concurrentUsers: number;
  duration: number;
  rampUpTime: number;
}

export default function PerformanceTesting() {
  const [activeTab, setActiveTab] = useState("config");
  const [config, setConfig] = useState<TestConfig>({
    url: "https://api.example.com/users",
    method: "GET",
    concurrentUsers: 10,
    duration: 60,
    rampUpTime: 10
  });
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const generateMockMetrics = () => {
    const data: PerformanceMetrics[] = [];
    for (let i = 0; i < 60; i++) {
      data.push({
        timestamp: `${i}s`,
        tps: Math.floor(Math.random() * 100 + 50),
        avgResponseTime: Math.floor(Math.random() * 200 + 100),
        minResponseTime: Math.floor(Math.random() * 50 + 10),
        maxResponseTime: Math.floor(Math.random() * 500 + 300),
        errorRate: Math.random() * 5,
        activeThreads: Math.floor((config.concurrentUsers * i) / config.rampUpTime)
      });
    }
    return data;
  };

  const handleStartTest = async () => {
    if (!config.url.trim()) {
      toast.error("请输入测试 URL");
      return;
    }

    setIsRunning(true);
    setMetrics([]);
    setSummary(null);

    try {
      // 模拟性能测试
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockMetrics = generateMockMetrics();
      setMetrics(mockMetrics);

      const avgTps = mockMetrics.reduce((sum, m) => sum + m.tps, 0) / mockMetrics.length;
      const avgResponseTime = mockMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / mockMetrics.length;
      const avgErrorRate = mockMetrics.reduce((sum, m) => sum + m.errorRate, 0) / mockMetrics.length;
      const maxResponseTime = Math.max(...mockMetrics.map(m => m.maxResponseTime));

      setSummary({
        totalRequests: Math.floor(avgTps * config.duration),
        successfulRequests: Math.floor(avgTps * config.duration * (1 - avgErrorRate / 100)),
        failedRequests: Math.floor(avgTps * config.duration * (avgErrorRate / 100)),
        avgTps: Math.round(avgTps),
        avgResponseTime: Math.round(avgResponseTime),
        minResponseTime: Math.min(...mockMetrics.map(m => m.minResponseTime)),
        maxResponseTime,
        errorRate: avgErrorRate.toFixed(2),
        p95ResponseTime: Math.round(avgResponseTime * 1.5),
        p99ResponseTime: Math.round(avgResponseTime * 2)
      });

      toast.success("性能测试完成");
    } catch (error) {
      toast.error("测试失败");
    } finally {
      setIsRunning(false);
    }
  };

  const handlePauseTest = () => {
    setIsRunning(false);
    toast.info("测试已暂停");
  };

  const handleResetTest = () => {
    setMetrics([]);
    setSummary(null);
    toast.info("测试已重置");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="heading-lg">性能测试</h1>
        <p className="text-muted-foreground">
          配置并发用户数、测试时长，实时监控 TPS、响应时间、错误率等性能指标
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">测试配置</TabsTrigger>
          <TabsTrigger value="results">测试结果</TabsTrigger>
        </TabsList>

        {/* 测试配置标签页 */}
        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 配置表单 */}
            <div className="blueprint-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-accent uppercase">测试参数</h3>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">目标 URL</Label>
                <Input
                  placeholder="https://api.example.com/endpoint"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  className="bg-input border border-border rounded-sm p-3 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">请求方法</Label>
                <Input
                  placeholder="GET"
                  value={config.method}
                  onChange={(e) => setConfig({ ...config, method: e.target.value })}
                  className="bg-input border border-border rounded-sm p-3 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  并发用户数: <span className="text-accent font-bold">{config.concurrentUsers}</span>
                </Label>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  value={config.concurrentUsers}
                  onChange={(e) => setConfig({ ...config, concurrentUsers: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  测试时长 (秒): <span className="text-accent font-bold">{config.duration}s</span>
                </Label>
                <input
                  type="range"
                  min="10"
                  max="600"
                  value={config.duration}
                  onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  升温时间 (秒): <span className="text-accent font-bold">{config.rampUpTime}s</span>
                </Label>
                <input
                  type="range"
                  min="1"
                  max={config.duration}
                  value={config.rampUpTime}
                  onChange={(e) => setConfig({ ...config, rampUpTime: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleStartTest}
                  disabled={isRunning}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  开始测试
                </Button>
                <Button
                  onClick={handlePauseTest}
                  disabled={!isRunning}
                  variant="outline"
                  className="flex-1"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  暂停
                </Button>
                <Button
                  onClick={handleResetTest}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重置
                </Button>
              </div>
            </div>

            {/* 配置说明 */}
            <div className="space-y-4">
              <div className="blueprint-card p-4 space-y-2">
                <h4 className="text-xs font-semibold text-accent uppercase">参数说明</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground">并发用户数</p>
                    <p>同时发送请求的虚拟用户数量</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">测试时长</p>
                    <p>性能测试持续的总时间</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">升温时间</p>
                    <p>从 0 个用户逐步增加到目标用户数的时间</p>
                  </div>
                </div>
              </div>

              <div className="blueprint-card p-4 space-y-2">
                <h4 className="text-xs font-semibold text-accent uppercase">最佳实践</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 从小并发开始，逐步增加用户数</li>
                  <li>• 设置合理的升温时间避免突发流量</li>
                  <li>• 关注 P95/P99 响应时间而非平均值</li>
                  <li>• 监控错误率，及时发现问题</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 测试结果标签页 */}
        <TabsContent value="results" className="space-y-4">
          {metrics.length === 0 ? (
            <div className="blueprint-card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无测试数据，请先运行性能测试</p>
            </div>
          ) : (
            <>
              {/* 汇总指标 */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "总请求数", value: summary.totalRequests, color: "text-blue-400" },
                    { label: "成功请求", value: summary.successfulRequests, color: "text-green-400" },
                    { label: "失败请求", value: summary.failedRequests, color: "text-red-400" },
                    { label: "平均 TPS", value: summary.avgTps, color: "text-yellow-400" }
                  ].map((metric, idx) => (
                    <div key={idx} className="stat-card">
                      <p className="stat-label">{metric.label}</p>
                      <p className={`stat-value ${metric.color}`}>{metric.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 响应时间图表 */}
              <div className="blueprint-card p-6">
                <h3 className="text-sm font-semibold text-accent uppercase mb-4">响应时间趋势</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                    <XAxis dataKey="timestamp" stroke="rgba(255, 255, 255, 0.5)" />
                    <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(26, 42, 74, 0.9)", border: "1px solid rgba(0, 212, 255, 0.3)" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#00d4ff"
                      name="平均响应时间"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="maxResponseTime"
                      stroke="#ff6b6b"
                      name="最大响应时间"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* TPS 和错误率 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="blueprint-card p-6">
                  <h3 className="text-sm font-semibold text-accent uppercase mb-4">TPS 趋势</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                      <XAxis dataKey="timestamp" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "rgba(26, 42, 74, 0.9)", border: "1px solid rgba(0, 212, 255, 0.3)" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="tps" fill="#00d4ff" name="TPS" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="blueprint-card p-6">
                  <h3 className="text-sm font-semibold text-accent uppercase mb-4">错误率趋势</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                      <XAxis dataKey="timestamp" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "rgba(26, 42, 74, 0.9)", border: "1px solid rgba(0, 212, 255, 0.3)" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="errorRate"
                        stroke="#ff6b6b"
                        name="错误率 (%)"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 详细指标 */}
              {summary && (
                <div className="blueprint-card p-6 space-y-3">
                  <h3 className="text-sm font-semibold text-accent uppercase">详细指标</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">平均响应时间</p>
                      <p className="text-lg font-bold text-accent">{summary.avgResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">最小响应时间</p>
                      <p className="text-lg font-bold text-green-400">{summary.minResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">最大响应时间</p>
                      <p className="text-lg font-bold text-red-400">{summary.maxResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">P95 响应时间</p>
                      <p className="text-lg font-bold text-yellow-400">{summary.p95ResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">P99 响应时间</p>
                      <p className="text-lg font-bold text-yellow-400">{summary.p99ResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">错误率</p>
                      <p className="text-lg font-bold text-red-400">{summary.errorRate}%</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
