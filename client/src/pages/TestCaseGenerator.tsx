import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Download, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TestCase {
  id: string;
  title: string;
  description: string;
  precondition: string;
  steps: string[];
  expectedResult: string;
  category: "positive" | "negative" | "boundary" | "edge";
}

export default function TestCaseGenerator() {
  const [activeTab, setActiveTab] = useState("generate");
  const [description, setDescription] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const handleGenerateTestCases = async () => {
    if (!description.trim()) {
      toast.error("请输入功能描述");
      return;
    }

    setLoading(true);
    try {
      // 模拟 AI 生成测试用例
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedCases: TestCase[] = [
        {
          id: "TC-001",
          title: "正常场景 - 成功创建",
          description: "验证在正常输入下能成功创建资源",
          precondition: "用户已登录，具有创建权限",
          steps: [
            "打开创建页面",
            "填写所有必填字段",
            "点击保存按钮"
          ],
          expectedResult: "资源成功创建，显示成功提示",
          category: "positive"
        },
        {
          id: "TC-002",
          title: "异常场景 - 缺少必填字段",
          description: "验证缺少必填字段时的错误处理",
          precondition: "用户已登录",
          steps: [
            "打开创建页面",
            "不填写必填字段",
            "点击保存按钮"
          ],
          expectedResult: "显示错误提示，不允许保存",
          category: "negative"
        },
        {
          id: "TC-003",
          title: "边界场景 - 最大长度输入",
          description: "验证字段最大长度限制",
          precondition: "用户已登录",
          steps: [
            "打开创建页面",
            "输入超过最大长度的文本",
            "点击保存按钮"
          ],
          expectedResult: "字段被截断至最大长度，成功保存",
          category: "boundary"
        },
        {
          id: "TC-004",
          title: "特殊字符处理",
          description: "验证特殊字符的正确处理",
          precondition: "用户已登录",
          steps: [
            "打开创建页面",
            "输入特殊字符（<, >, &, \"）",
            "点击保存按钮"
          ],
          expectedResult: "特殊字符被正确转义，数据保存正确",
          category: "edge"
        }
      ];

      setTestCases(generatedCases);
      toast.success("成功生成 4 个测试用例");
    } catch (error) {
      toast.error("生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTestCases = () => {
    const csv = [
      ["ID", "标题", "描述", "前置条件", "步骤", "预期结果", "类别"].join(","),
      ...testCases.map(tc => [
        tc.id,
        tc.title,
        tc.description,
        tc.precondition,
        tc.steps.join("; "),
        tc.expectedResult,
        tc.category
      ].map(v => `"${v}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "test-cases.csv";
    link.click();
    toast.success("测试用例已下载");
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "positive":
        return "bg-green-500/10 text-green-400";
      case "negative":
        return "bg-red-500/10 text-red-400";
      case "boundary":
        return "bg-yellow-500/10 text-yellow-400";
      case "edge":
        return "bg-purple-500/10 text-purple-400";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "positive":
        return "正向";
      case "negative":
        return "异常";
      case "boundary":
        return "边界";
      case "edge":
        return "特殊";
      default:
        return category;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="heading-lg">AI 测试用例生成</h1>
        <p className="text-muted-foreground">
          通过自然语言描述自动生成结构化测试用例，涵盖正向、异常、边界和特殊场景
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">生成用例</TabsTrigger>
          <TabsTrigger value="results">生成结果</TabsTrigger>
        </TabsList>

        {/* 生成用例标签页 */}
        <TabsContent value="generate" className="space-y-4">
          <div className="blueprint-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                功能描述
              </Label>
              <Textarea
                id="description"
                placeholder="请描述要测试的功能，例如：用户登录功能，需要支持邮箱和手机号登录，密码长度8-20位，支持忘记密码功能..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[150px] bg-input border border-border rounded-sm p-3 text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                提示：描述越详细，生成的测试用例质量越高
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiUrl" className="text-sm font-semibold">
                API 端点（可选）
              </Label>
              <Input
                id="apiUrl"
                placeholder="https://api.example.com/users/login"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="bg-input border border-border rounded-sm p-3 text-foreground"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateTestCases}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    生成测试用例
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 生成参数说明 */}
          <div className="blueprint-card p-6">
            <h3 className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">
              生成参数说明
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">正向测试用例</h4>
                <p className="text-sm text-muted-foreground">
                  验证系统在正常输入和操作下的预期行为
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">异常测试用例</h4>
                <p className="text-sm text-muted-foreground">
                  验证系统对错误输入和异常情况的处理
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">边界测试用例</h4>
                <p className="text-sm text-muted-foreground">
                  验证系统在边界条件下的表现（最大值、最小值等）
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">特殊场景测试</h4>
                <p className="text-sm text-muted-foreground">
                  验证系统对特殊字符、并发等特殊情况的处理
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 生成结果标签页 */}
        <TabsContent value="results" className="space-y-4">
          {testCases.length === 0 ? (
            <div className="blueprint-card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无生成的测试用例，请先生成</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    生成结果 ({testCases.length} 个用例)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    点击用例查看详细信息
                  </p>
                </div>
                <Button
                  onClick={handleDownloadTestCases}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载 CSV
                </Button>
              </div>

              <div className="space-y-3">
                {testCases.map((testCase) => (
                  <div
                    key={testCase.id}
                    className="blueprint-card p-4 hover:border-accent/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs font-mono text-accent">{testCase.id}</code>
                          <Badge className={`text-xs ${getCategoryColor(testCase.category)}`}>
                            {getCategoryLabel(testCase.category)}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-foreground">{testCase.title}</h4>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">{testCase.description}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-accent uppercase">前置条件</p>
                        <p className="text-muted-foreground">{testCase.precondition}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-accent uppercase">测试步骤</p>
                        <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                          {testCase.steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-accent uppercase">预期结果</p>
                        <p className="text-muted-foreground">{testCase.expectedResult}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
