import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, FileText, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface TestReportData {
  projectName: string;
  testDate: string;
  totalTestCases: number;
  passedCases: number;
  failedCases: number;
  skippedCases: number;
  passRate: number;
  bugCount: number;
  criticalBugs: number;
  highBugs: number;
  mediumBugs: number;
  lowBugs: number;
  executionTime: number;
  coverage: number;
}

export default function TestReport() {
  const [activeTab, setActiveTab] = useState("overview");
  const [reportData] = useState<TestReportData>({
    projectName: "AI 智能测试平台",
    testDate: "2026-05-19",
    totalTestCases: 245,
    passedCases: 218,
    failedCases: 18,
    skippedCases: 9,
    passRate: 89.0,
    bugCount: 18,
    criticalBugs: 2,
    highBugs: 5,
    mediumBugs: 8,
    lowBugs: 3,
    executionTime: 3456,
    coverage: 82.5
  });

  const testCaseData = [
    { name: "通过", value: reportData.passedCases, color: "#22c55e" },
    { name: "失败", value: reportData.failedCases, color: "#ef4444" },
    { name: "跳过", value: reportData.skippedCases, color: "#f59e0b" }
  ];

  const bugSeverityData = [
    { name: "严重", value: reportData.criticalBugs, color: "#dc2626" },
    { name: "高", value: reportData.highBugs, color: "#ea580c" },
    { name: "中", value: reportData.mediumBugs, color: "#f59e0b" },
    { name: "低", value: reportData.lowBugs, color: "#22c55e" }
  ];

  const trendData = [
    { day: "第 1 天", passed: 180, failed: 25, coverage: 60 },
    { day: "第 2 天", passed: 195, failed: 20, coverage: 68 },
    { day: "第 3 天", passed: 205, failed: 18, coverage: 75 },
    { day: "第 4 天", passed: 210, failed: 16, coverage: 78 },
    { day: "第 5 天", passed: 215, failed: 15, coverage: 80 },
    { day: "第 6 天", passed: 218, failed: 18, coverage: 82.5 }
  ];

  const failedTestCases = [
    {
      id: "TC-045",
      name: "用户登录 - 密码错误处理",
      module: "认证模块",
      severity: "high",
      errorMessage: "期望显示错误提示，但页面重定向到首页"
    },
    {
      id: "TC-067",
      name: "数据导出 - Excel 格式",
      module: "数据管理",
      severity: "medium",
      errorMessage: "导出文件损坏，无法打开"
    },
    {
      id: "TC-089",
      name: "并发操作 - 重复提交",
      module: "业务逻辑",
      severity: "critical",
      errorMessage: "允许重复提交，导致数据重复"
    }
  ];

  const handleDownloadReport = () => {
    const reportContent = `
# 测试报告

## 项目信息
- 项目名称: ${reportData.projectName}
- 测试日期: ${reportData.testDate}
- 代码覆盖率: ${reportData.coverage}%

## 测试统计
- 总测试用例: ${reportData.totalTestCases}
- 通过用例: ${reportData.passedCases}
- 失败用例: ${reportData.failedCases}
- 跳过用例: ${reportData.skippedCases}
- 通过率: ${reportData.passRate}%
- 执行时间: ${Math.floor(reportData.executionTime / 60)} 分钟

## Bug 统计
- 总 Bug 数: ${reportData.bugCount}
- 严重级: ${reportData.criticalBugs}
- 高级: ${reportData.highBugs}
- 中级: ${reportData.mediumBugs}
- 低级: ${reportData.lowBugs}

## 失败用例详情
${failedTestCases.map(tc => `
### ${tc.id} - ${tc.name}
- 模块: ${tc.module}
- 严重级: ${tc.severity}
- 错误信息: ${tc.errorMessage}
`).join("")}

## 建议
1. 立即修复严重级 Bug
2. 在下一个迭代中修复高级 Bug
3. 提高代码覆盖率到 90% 以上
4. 加强并发场景的测试
`;

    const blob = new Blob([reportContent], { type: "text/markdown;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `test-report-${reportData.testDate}.md`;
    link.click();
    toast.success("报告已下载");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="heading-lg">测试报告</h1>
        <p className="text-muted-foreground">
          汇总测试执行结果，展示用例统计、通过率、缺陷列表等关键指标
        </p>
      </div>

      {/* 报告头部 */}
      <div className="blueprint-card p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{reportData.projectName}</h2>
            <p className="text-sm text-muted-foreground">测试日期: {reportData.testDate}</p>
          </div>
          <Button
            onClick={handleDownloadReport}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            下载报告
          </Button>
        </div>

        {/* 关键指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-input/50 border border-border rounded-sm">
            <p className="text-xs text-muted-foreground">通过率</p>
            <p className="text-2xl font-bold text-green-400">{reportData.passRate}%</p>
          </div>
          <div className="p-3 bg-input/50 border border-border rounded-sm">
            <p className="text-xs text-muted-foreground">代码覆盖率</p>
            <p className="text-2xl font-bold text-blue-400">{reportData.coverage}%</p>
          </div>
          <div className="p-3 bg-input/50 border border-border rounded-sm">
            <p className="text-xs text-muted-foreground">Bug 总数</p>
            <p className="text-2xl font-bold text-red-400">{reportData.bugCount}</p>
          </div>
          <div className="p-3 bg-input/50 border border-border rounded-sm">
            <p className="text-xs text-muted-foreground">执行时间</p>
            <p className="text-2xl font-bold text-yellow-400">{Math.floor(reportData.executionTime / 60)}m</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="details">详情</TabsTrigger>
          <TabsTrigger value="bugs">缺陷</TabsTrigger>
          <TabsTrigger value="trend">趋势</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 用例统计 */}
            <div className="blueprint-card p-6">
              <h3 className="text-sm font-semibold text-accent uppercase mb-4">用例执行统计</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={testCaseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name} ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {testCaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bug 严重级分布 */}
            <div className="blueprint-card p-6">
              <h3 className="text-sm font-semibold text-accent uppercase mb-4">Bug 严重级分布</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bugSeverityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" />
                  <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(26, 42, 74, 0.9)", border: "1px solid rgba(0, 212, 255, 0.3)" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="value" fill="#00d4ff">
                    {bugSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* 详情标签页 */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "总测试用例", value: reportData.totalTestCases, color: "text-blue-400" },
              { label: "通过用例", value: reportData.passedCases, color: "text-green-400" },
              { label: "失败用例", value: reportData.failedCases, color: "text-red-400" },
              { label: "跳过用例", value: reportData.skippedCases, color: "text-yellow-400" },
              { label: "严重 Bug", value: reportData.criticalBugs, color: "text-red-500" },
              { label: "高级 Bug", value: reportData.highBugs, color: "text-orange-400" }
            ].map((item, idx) => (
              <div key={idx} className="stat-card">
                <p className="stat-label">{item.label}</p>
                <p className={`stat-value ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 缺陷标签页 */}
        <TabsContent value="bugs" className="space-y-4">
          <div className="space-y-3">
            {failedTestCases.map((testCase) => (
              <div key={testCase.id} className="blueprint-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs font-mono text-accent">{testCase.id}</code>
                      <Badge className={
                        testCase.severity === "critical" ? "bg-red-500/10 text-red-400" :
                        testCase.severity === "high" ? "bg-orange-500/10 text-orange-400" :
                        "bg-yellow-500/10 text-yellow-400"
                      }>
                        {testCase.severity === "critical" ? "严重" : testCase.severity === "high" ? "高" : "中"}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-foreground">{testCase.name}</h4>
                  </div>
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground"><span className="text-accent font-semibold">模块:</span> {testCase.module}</p>
                  <p className="text-muted-foreground"><span className="text-accent font-semibold">错误:</span> {testCase.errorMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 趋势标签页 */}
        <TabsContent value="trend" className="space-y-4">
          <div className="blueprint-card p-6">
            <h3 className="text-sm font-semibold text-accent uppercase mb-4">测试进度趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.5)" />
                <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(26, 42, 74, 0.9)", border: "1px solid rgba(0, 212, 255, 0.3)" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line type="monotone" dataKey="passed" stroke="#22c55e" name="通过用例" dot={false} />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" name="失败用例" dot={false} />
                <Line type="monotone" dataKey="coverage" stroke="#00d4ff" name="覆盖率 (%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
