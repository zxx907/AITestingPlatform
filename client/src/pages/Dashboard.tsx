import { StatCard, TechLineDivider, DataFlowLine } from "@/components/BlueprintDecorations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Zap, Code, FileText, Cpu, Bug, Database, BarChart3, TrendingUp,
  ChevronRight, Activity, AlertCircle, CheckCircle2
} from "lucide-react";
import { useLocation } from "wouter";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

/**
 * Dashboard 首页
 * 展示平台整体数据概览与快速操作入口
 */
export default function Dashboard() {
  const [, setLocation] = useLocation();

  // 模拟数据
  const stats = {
    totalCases: 1234,
    totalBugs: 45,
    passRate: 92.5,
    recentTests: 8,
  };

  const recentExecutions = [
    { time: "09:00", cases: 120, passed: 110, failed: 10 },
    { time: "10:00", cases: 135, passed: 125, failed: 10 },
    { time: "11:00", cases: 150, passed: 142, failed: 8 },
    { time: "12:00", cases: 128, passed: 120, failed: 8 },
    { time: "13:00", cases: 145, passed: 138, failed: 7 },
    { time: "14:00", cases: 160, passed: 155, failed: 5 },
  ];

  const performanceData = [
    { name: "API-1", tps: 1200, responseTime: 45, errorRate: 0.5 },
    { name: "API-2", tps: 980, responseTime: 52, errorRate: 0.8 },
    { name: "API-3", tps: 1450, responseTime: 38, errorRate: 0.3 },
    { name: "API-4", tps: 1100, responseTime: 48, errorRate: 0.6 },
    { name: "API-5", tps: 1300, responseTime: 42, errorRate: 0.4 },
  ];

  const recentBugs = [
    { id: "BUG-001", title: "登录接口超时问题", severity: "high", status: "open" },
    { id: "BUG-002", title: "数据导出格式错误", severity: "medium", status: "open" },
    { id: "BUG-003", title: "并发请求丢失", severity: "high", status: "closed" },
  ];

  const quickActions = [
    { icon: Zap, label: "生成测试用例", path: "/test-case-generator", color: "from-blue-500 to-blue-600" },
    { icon: Code, label: "接口测试", path: "/api-testing", color: "from-cyan-500 to-cyan-600" },
    { icon: FileText, label: "导出脚本", path: "/script-generator", color: "from-purple-500 to-purple-600" },
    { icon: Cpu, label: "性能测试", path: "/performance-testing", color: "from-orange-500 to-orange-600" },
    { icon: Bug, label: "分析 Bug", path: "/bug-analysis", color: "from-red-500 to-red-600" },
    { icon: Database, label: "生成 SQL", path: "/sql-generator", color: "from-green-500 to-green-600" },
  ];

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="heading-lg">测试平台 Dashboard</h1>
        <p className="text-muted-foreground">欢迎使用 AI 驱动的智能测试平台</p>
      </div>

      <TechLineDivider />

      {/* 统计卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="测试用例总数"
          value={stats.totalCases}
          unit="个"
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={{ value: 12, direction: "up" }}
        />
        <StatCard
          label="发现缺陷"
          value={stats.totalBugs}
          unit="个"
          icon={<AlertCircle className="w-5 h-5" />}
          trend={{ value: 5, direction: "down" }}
        />
        <StatCard
          label="通过率"
          value={stats.passRate}
          unit="%"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 2.3, direction: "up" }}
        />
        <StatCard
          label="最近测试"
          value={stats.recentTests}
          unit="次"
          icon={<Activity className="w-5 h-5" />}
          trend={{ value: 8, direction: "up" }}
        />
      </div>

      {/* 快速操作 */}
      <div className="blueprint-card p-6">
        <h3 className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">快速操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => setLocation(action.path)}
                className="group flex flex-col items-center gap-2 p-4 rounded-sm border border-border/50 hover:border-accent/50 bg-blueprint-light/30 hover:bg-blueprint-light/60 transition-all duration-200"
              >
                <div className={`p-2 rounded-sm bg-gradient-to-br ${action.color} text-white group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center text-foreground group-hover:text-accent transition-colors">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 数据可视化区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近执行趋势 */}
        <div className="blueprint-card p-6">
          <h3 className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">最近执行趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={recentExecutions}>
              <defs>
                <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
              <XAxis dataKey="time" stroke="rgba(255, 255, 255, 0.5)" />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#2d3e5f", border: "1px solid rgba(0, 212, 255, 0.3)" }}
                labelStyle={{ color: "#ffffff" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="passed"
                stackId="1"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorPassed)"
                name="通过"
              />
              <Area
                type="monotone"
                dataKey="failed"
                stackId="1"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorFailed)"
                name="失败"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 性能指标概览 */}
        <div className="blueprint-card p-6">
          <h3 className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">性能指标概览</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
              <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#2d3e5f", border: "1px solid rgba(0, 212, 255, 0.3)" }}
                labelStyle={{ color: "#ffffff" }}
              />
              <Legend />
              <Bar dataKey="tps" fill="#00d4ff" name="TPS" />
              <Bar dataKey="responseTime" fill="#0099ff" name="响应时间(ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 最近缺陷 */}
      <div className="blueprint-card p-6">
        <h3 className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">最近发现的缺陷</h3>
        <div className="space-y-2">
          {recentBugs.map((bug) => (
            <div
              key={bug.id}
              className="flex items-center justify-between p-3 rounded-sm border border-border/50 hover:border-accent/50 bg-blueprint-light/20 hover:bg-blueprint-light/40 transition-all group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-accent">{bug.id}</code>
                  <h4 className="text-sm font-medium text-foreground">{bug.title}</h4>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-sm ${
                    bug.severity === "high"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {bug.severity === "high" ? "高" : "中"}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-sm ${
                    bug.status === "open"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {bug.status === "open" ? "开放" : "已关闭"}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 平台特性介绍 */}
      <div className="blueprint-card p-6">
        <h3 className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">平台特性</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-accent flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI 驱动的测试用例生成
            </h4>
            <p className="text-sm text-muted-foreground">
              通过自然语言描述自动生成结构化测试用例，涵盖正向、异常、边界场景
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-accent flex items-center gap-2">
              <FileText className="w-4 h-4" />
              多格式脚本导出
            </h4>
            <p className="text-sm text-muted-foreground">
              支持导出 Postman Collection、JMeter JMX、Python requests 脚本
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-accent flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              性能测试与分析
            </h4>
            <p className="text-sm text-muted-foreground">
              配置并发、持续时间，实时收集 TPS、响应时间、错误率等指标
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-accent flex items-center gap-2">
              <Bug className="w-4 h-4" />
              智能 Bug 分析
            </h4>
            <p className="text-sm text-muted-foreground">
              AI 自动分析错误日志，提供根因分析和修复建议
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
