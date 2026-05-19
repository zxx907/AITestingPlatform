import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";

interface BugAnalysis {
  rootCause: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedComponents: string[];
  impactAssessment: string;
  reproductionSteps: string[];
  suggestedFixes: string[];
  testCases: string[];
}

export default function BugAnalysis() {
  const [activeTab, setActiveTab] = useState("input");
  const [errorLog, setErrorLog] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<BugAnalysis | null>(null);

  const handleAnalyzeBug = async () => {
    if (!errorLog.trim()) {
      toast.error("请输入错误日志或异常信息");
      return;
    }

    setLoading(true);
    try {
      // 模拟 AI 分析
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockAnalysis: BugAnalysis = {
        rootCause: "数据库连接超时导致查询失败。在高并发场景下，连接池耗尽，新请求无法获取可用连接，最终导致超时异常。",
        severity: "high",
        affectedComponents: [
          "UserService.getUsers()",
          "Database Connection Pool",
          "MySQL Connection Handler"
        ],
        impactAssessment: "该 Bug 影响所有依赖用户数据的功能模块，在高并发场景下（>100 QPS）会导致服务不可用。预计影响 20% 的用户请求。",
        reproductionSteps: [
          "启动应用并配置数据库连接池大小为 10",
          "使用 JMeter 模拟 200 并发用户访问 /api/users 接口",
          "观察日志，在 30 秒内出现连接超时错误",
          "监控数据库连接数，确认连接池已耗尽"
        ],
        suggestedFixes: [
          "增加数据库连接池大小（建议 50-100）",
          "实现连接超时重试机制（指数退避）",
          "添加连接池监控和告警",
          "优化数据库查询性能，减少连接占用时间",
          "实现熔断器模式，防止级联故障"
        ],
        testCases: [
          "TC-001: 验证在 200 并发下连接池不会耗尽",
          "TC-002: 验证超时重试机制正确工作",
          "TC-003: 验证连接池监控数据准确",
          "TC-004: 验证熔断器在连接失败时正确触发",
          "TC-005: 验证长连接场景下连接正确释放"
        ]
      };

      setAnalysis(mockAnalysis);
      toast.success("Bug 分析完成");
    } catch (error) {
      toast.error("分析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-400";
      case "high":
        return "bg-orange-500/10 text-orange-400";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400";
      case "low":
        return "bg-green-500/10 text-green-400";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical":
        return "严重";
      case "high":
        return "高";
      case "medium":
        return "中";
      case "low":
        return "低";
      default:
        return severity;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="heading-lg">Bug 分析</h1>
        <p className="text-muted-foreground">
          输入错误日志或异常信息，AI 自动进行根因分析、影响评估和修复建议
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">输入日志</TabsTrigger>
          <TabsTrigger value="analysis">分析结果</TabsTrigger>
        </TabsList>

        {/* 输入日志标签页 */}
        <TabsContent value="input" className="space-y-4">
          <div className="blueprint-card p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">错误日志或异常信息</label>
              <Textarea
                placeholder={`例如：
[2026-05-19 13:45:23] ERROR [UserService] - Connection timeout after 30000ms
java.sql.SQLException: Cannot get a connection, pool error Timeout waiting for idle object
  at org.apache.commons.dbcp2.PoolingDataSource.getConnection(PoolingDataSource.java:143)
  at com.example.service.UserService.getUsers(UserService.java:45)
  at com.example.controller.UserController.list(UserController.java:23)`}
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
                className="min-h-[250px] bg-input border border-border rounded-sm p-3 text-foreground font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                提示：粘贴完整的错误堆栈跟踪，包括时间戳和相关上下文信息，分析效果更好
              </p>
            </div>

            <Button
              onClick={handleAnalyzeBug}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  开始分析
                </>
              )}
            </Button>
          </div>

          {/* 常见错误示例 */}
          <div className="blueprint-card p-6">
            <h3 className="text-sm font-semibold text-accent uppercase mb-4">常见错误类型</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "数据库连接错误", desc: "Connection timeout, pool exhausted" },
                { title: "内存溢出错误", desc: "OutOfMemoryError, heap space" },
                { title: "网络超时错误", desc: "SocketTimeoutException, connection reset" },
                { title: "业务逻辑错误", desc: "NullPointerException, index out of bounds" },
                { title: "并发冲突错误", desc: "Deadlock, race condition" },
                { title: "文件操作错误", desc: "FileNotFoundException, permission denied" }
              ].map((error, idx) => (
                <div key={idx} className="p-3 bg-input/50 border border-border rounded-sm">
                  <p className="text-sm font-semibold text-foreground">{error.title}</p>
                  <p className="text-xs text-muted-foreground">{error.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 分析结果标签页 */}
        <TabsContent value="analysis" className="space-y-4">
          {analysis === null ? (
            <div className="blueprint-card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无分析结果，请先输入错误日志</p>
            </div>
          ) : (
            <>
              {/* 根本原因 */}
              <div className="blueprint-card p-6 space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-accent uppercase">根本原因</h3>
                  <Badge className={`${getSeverityColor(analysis.severity)}`}>
                    {getSeverityLabel(analysis.severity)} 级
                  </Badge>
                </div>
                <p className="text-foreground leading-relaxed">{analysis.rootCause}</p>
              </div>

              {/* 受影响的组件 */}
              <div className="blueprint-card p-6 space-y-3">
                <h3 className="text-sm font-semibold text-accent uppercase">受影响的组件</h3>
                <div className="space-y-2">
                  {analysis.affectedComponents.map((component, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-input/50 border border-border rounded-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      <code className="text-sm text-foreground font-mono">{component}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* 影响评估 */}
              <div className="blueprint-card p-6 space-y-3">
                <h3 className="text-sm font-semibold text-accent uppercase">影响评估</h3>
                <p className="text-foreground leading-relaxed">{analysis.impactAssessment}</p>
              </div>

              {/* 复现步骤 */}
              <div className="blueprint-card p-6 space-y-3">
                <h3 className="text-sm font-semibold text-accent uppercase">复现步骤</h3>
                <ol className="space-y-2">
                  {analysis.reproductionSteps.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-accent font-bold flex-shrink-0">{idx + 1}.</span>
                      <span className="text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 修复建议 */}
              <div className="blueprint-card p-6 space-y-3">
                <h3 className="text-sm font-semibold text-accent uppercase">修复建议</h3>
                <div className="space-y-2">
                  {analysis.suggestedFixes.map((fix, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-input/50 border border-border rounded-sm">
                      <span className="text-accent font-bold flex-shrink-0">•</span>
                      <span className="text-foreground">{fix}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 验证测试用例 */}
              <div className="blueprint-card p-6 space-y-3">
                <h3 className="text-sm font-semibold text-accent uppercase">验证测试用例</h3>
                <div className="space-y-2">
                  {analysis.testCases.map((testCase, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-input/50 border border-border rounded-sm">
                      <span className="text-accent font-mono text-xs flex-shrink-0">{testCase.split(":")[0]}</span>
                      <span className="text-foreground text-sm">{testCase.split(":")[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
