import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Download, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface SQLGeneration {
  query: string;
  explanation: string;
  complexity: "simple" | "moderate" | "complex";
  optimizationTips: string[];
  executionPlan: string;
}

export default function SQLGenerator() {
  const [activeTab, setActiveTab] = useState("input");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SQLGeneration | null>(null);

  const handleGenerateSQL = async () => {
    if (!description.trim()) {
      toast.error("请输入查询需求描述");
      return;
    }

    setLoading(true);
    try {
      // 模拟 AI 生成 SQL
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResult: SQLGeneration = {
        query: `SELECT 
  u.id,
  u.username,
  u.email,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_spent,
  MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND o.status IN ('completed', 'shipped')
GROUP BY u.id, u.username, u.email
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC
LIMIT 100;`,
        explanation: "此查询用于获取过去 30 天内有订单的活跃用户列表，并统计每个用户的订单数、总消费金额和最后订单日期。使用 LEFT JOIN 确保即使没有订单的用户也会被包含（如果需要）。",
        complexity: "moderate",
        optimizationTips: [
          "在 users.created_at 和 orders.user_id 上创建索引以加快 JOIN 操作",
          "考虑添加 orders.status 的索引以优化 WHERE 子句",
          "如果数据量很大，考虑使用分区表按日期分区",
          "可以使用 EXPLAIN 命令查看执行计划并进一步优化"
        ],
        executionPlan: `id | select_type | table | type | key | rows | Extra
1  | SIMPLE     | u     | ALL  | NULL | 5000 | Using where; Using temporary; Using filesort
1  | SIMPLE     | o     | ref  | user_id | 2 | Using where`
      };

      setResult(mockResult);
      toast.success("SQL 生成成功");
    } catch (error) {
      toast.error("生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySQL = () => {
    if (result) {
      navigator.clipboard.writeText(result.query);
      toast.success("SQL 已复制到剪贴板");
    }
  };

  const handleDownloadSQL = () => {
    if (result) {
      const blob = new Blob([result.query], { type: "text/plain;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "query.sql";
      link.click();
      toast.success("SQL 文件已下载");
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return "bg-green-500/10 text-green-400";
      case "moderate":
        return "bg-yellow-500/10 text-yellow-400";
      case "complex":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  const getComplexityLabel = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return "简单";
      case "moderate":
        return "中等";
      case "complex":
        return "复杂";
      default:
        return complexity;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="heading-lg">SQL 生成</h1>
        <p className="text-muted-foreground">
          通过自然语言描述自动生成 SQL 查询语句，支持语法高亮、复制和下载
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">输入需求</TabsTrigger>
          <TabsTrigger value="output">生成结果</TabsTrigger>
        </TabsList>

        {/* 输入需求标签页 */}
        <TabsContent value="input" className="space-y-4">
          <div className="blueprint-card p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">查询需求描述</label>
              <Textarea
                placeholder={`例如：
查询过去 30 天内有订单的活跃用户，显示用户 ID、用户名、邮箱、订单数、总消费金额和最后订单日期。
只显示订单状态为已完成或已发货的订单，按总消费金额降序排列，限制结果为 100 行。`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[150px] bg-input border border-border rounded-sm p-3 text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                提示：描述越详细，生成的 SQL 质量越高。包括表名、字段、条件、排序等信息
              </p>
            </div>

            <Button
              onClick={handleGenerateSQL}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  生成 SQL
                </>
              )}
            </Button>
          </div>

          {/* 常见查询示例 */}
          <div className="blueprint-card p-6">
            <h3 className="text-sm font-semibold text-accent uppercase mb-4">常见查询类型</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "SELECT 查询 - 数据检索",
                "JOIN 查询 - 多表关联",
                "聚合查询 - GROUP BY、COUNT、SUM",
                "子查询 - 嵌套查询",
                "UPDATE 更新 - 数据修改",
                "DELETE 删除 - 数据删除",
                "CREATE 创建 - 表结构创建",
                "INDEX 索引 - 性能优化"
              ].map((type, idx) => (
                <div key={idx} className="p-3 bg-input/50 border border-border rounded-sm">
                  <p className="text-sm text-foreground">{type}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 生成结果标签页 */}
        <TabsContent value="output" className="space-y-4">
          {result === null ? (
            <div className="blueprint-card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无生成结果，请先输入查询需求</p>
            </div>
          ) : (
            <>
              {/* SQL 查询 */}
              <div className="blueprint-card p-6 space-y-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-accent uppercase">SQL 查询</h3>
                  <Badge className={`${getComplexityColor(result.complexity)}`}>
                    {getComplexityLabel(result.complexity)} 复杂度
                  </Badge>
                </div>
                <pre className="code-blueprint overflow-x-auto text-xs p-4">
                  {result.query}
                </pre>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopySQL}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制
                  </Button>
                  <Button
                    onClick={handleDownloadSQL}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载
                  </Button>
                </div>
              </div>

              {/* 查询解释 */}
              <div className="blueprint-card p-6 space-y-3">
                <h3 className="text-sm font-semibold text-accent uppercase">查询解释</h3>
                <p className="text-foreground leading-relaxed">{result.explanation}</p>
              </div>

              {/* 优化建议 */}
              <div className="blueprint-card p-6 space-y-3">
                <h3 className="text-sm font-semibold text-accent uppercase">优化建议</h3>
                <div className="space-y-2">
                  {result.optimizationTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-input/50 border border-border rounded-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 执行计划 */}
              <div className="blueprint-card p-6 space-y-3">
                <h3 className="text-sm font-semibold text-accent uppercase">执行计划示例</h3>
                <pre className="code-blueprint overflow-x-auto text-xs p-4">
                  {result.executionPlan}
                </pre>
                <p className="text-xs text-muted-foreground">
                  提示：使用 EXPLAIN 命令查看实际执行计划，根据结果进一步优化查询
                </p>
              </div>

              {/* 最佳实践 */}
              <div className="blueprint-card p-6 space-y-3">
                <h3 className="text-sm font-semibold text-accent uppercase">最佳实践</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• 始终使用 EXPLAIN 分析查询性能</li>
                  <li>• 在经常查询的列上创建索引</li>
                  <li>• 避免在 WHERE 子句中使用函数</li>
                  <li>• 使用 LIMIT 限制结果集大小</li>
                  <li>• 定期更新表统计信息</li>
                  <li>• 考虑使用查询缓存或物化视图</li>
                </ul>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
