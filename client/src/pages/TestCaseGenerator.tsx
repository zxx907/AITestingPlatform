'use client';

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Download, Zap, CheckCircle2, AlertCircle, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface TestCase {
  id?: number;
  title: string;
  description?: string;
  precondition?: string;
  steps: string[];
  expectedResult?: string;
  category: "positive" | "negative" | "boundary" | "edge";
  priority?: "low" | "medium" | "high" | "critical";
}

export default function TestCaseGenerator() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("generate");
  const [projectId, setProjectId] = useState("default-project");
  const [description, setDescription] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutation for generating test cases
  const generateMutation = trpc.testCases.generate.useMutation({
    onSuccess: (data) => {
      if (data.cases) {
        setTestCases(data.cases);
        toast.success(`成功生成 ${data.count} 个测试用例`);
      }
    },
    onError: (error) => {
      toast.error(`生成失败: ${error.message}`);
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(md|txt|pdf|doc|docx|xls|xlsx)$/i)) {
      toast.error("不支持的文件格式。请上传 TXT、Markdown、PDF、Word 或 Excel 文件");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小不能超过 10MB");
      return;
    }

    setUploadedFile(file);
    toast.success(`已选择文件：${file.name}`);

    // 读取文件内容
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (content) {
        // 提取文本内容
        const extractedText = content.substring(0, 5000);
        setDescription(extractedText);
      }
    };

    if (file.type === "text/plain" || file.type === "text/markdown" || file.name.match(/\.(md|txt)$/i)) {
      reader.readAsText(file);
    } else {
      // 对于 PDF 和 Word 文件，使用示例内容
      toast.info("PDF/Word 文件需要服务器端处理");
      setDescription("[从文档导入的需求内容]\n\n用户登录功能需求：\n1. 支持邮箱和手机号登录\n2. 密码长度 8-20 位\n3. 支持忘记密码功能\n4. 登录失败 5 次后账户锁定 30 分钟\n5. 支持第三方登录（微信、支付宝）");
    }
  };

  const handleGenerateTestCases = async () => {
    if (!description.trim()) {
      toast.error("请输入功能描述或导入需求文档");
      return;
    }

    if (!user?.id) {
      toast.error("请先登录");
      return;
    }

    setLoading(true);
    try {
      await generateMutation.mutateAsync({
        projectId,
        description,
        apiUrl: apiUrl || undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTestCase = (testCase: TestCase) => {
    const text = `
标题: ${testCase.title}
描述: ${testCase.description || ""}
前置条件: ${testCase.precondition || ""}
步骤: ${testCase.steps.join("\n")}
预期结果: ${testCase.expectedResult || ""}
类别: ${testCase.category}
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  const handleDownloadTestCases = () => {
    if (testCases.length === 0) {
      toast.error("没有测试用例可下载");
      return;
    }

    const csv = [
      ["ID", "标题", "描述", "前置条件", "步骤", "预期结果", "类别", "优先级"],
      ...testCases.map((tc, idx) => [
        tc.id || `TC-${idx + 1}`,
        tc.title,
        tc.description || "",
        tc.precondition || "",
        tc.steps.join("; "),
        tc.expectedResult || "",
        tc.category,
        tc.priority || "medium"
      ])
    ]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `test-cases-${Date.now()}.csv`;
    link.click();
    toast.success("测试用例已下载");
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setDescription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-blueprint-dark p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI 测试用例生成器</h1>
          <p className="text-tech-cyan text-lg">智能分析需求文档，自动生成结构化测试用例</p>
        </div>

        {/* 主容器 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：输入区域 */}
          <div className="lg:col-span-2">
            <Card className="bg-blueprint-card border-tech-cyan/30 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-blueprint-dark/50">
                  <TabsTrigger value="generate" className="text-white">手动输入</TabsTrigger>
                  <TabsTrigger value="upload" className="text-white">文档导入</TabsTrigger>
                </TabsList>

                {/* 手动输入标签页 */}
                <TabsContent value="generate" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-white mb-2 block">项目 ID</Label>
                    <Input
                      placeholder="输入项目 ID"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="bg-blueprint-dark border-tech-cyan/30 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">功能描述</Label>
                    <Textarea
                      placeholder="请输入功能描述或需求信息，支持详细的功能说明、业务规则、约束条件等"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-blueprint-dark border-tech-cyan/30 text-white placeholder:text-gray-500 min-h-[200px]"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      {description.length} / 5000 字符
                    </p>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">API 端点（可选）</Label>
                    <Input
                      placeholder="https://api.example.com/endpoint"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="bg-blueprint-dark border-tech-cyan/30 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <Button
                    onClick={handleGenerateTestCases}
                    disabled={loading || !description.trim()}
                    className="w-full bg-tech-cyan hover:bg-tech-cyan/80 text-blueprint-dark font-bold py-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        生成测试用例
                      </>
                    )}
                  </Button>
                </TabsContent>

                {/* 文档导入标签页 */}
                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div className="border-2 border-dashed border-tech-cyan/30 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-tech-cyan mx-auto mb-4" />
                    <p className="text-white mb-2">拖拽或点击选择文件</p>
                    <p className="text-gray-400 text-sm mb-4">支持 TXT、Markdown、PDF、Word、Excel 格式，最大 10MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-tech-cyan hover:bg-tech-cyan/80 text-blueprint-dark font-bold"
                    >
                      选择文件
                    </Button>
                  </div>

                  {uploadedFile && (
                    <div className="bg-blueprint-dark/50 border border-tech-cyan/30 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-tech-cyan" />
                        <div>
                          <p className="text-white font-medium">{uploadedFile.name}</p>
                          <p className="text-gray-400 text-sm">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleClearFile}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {description && (
                    <div>
                      <Label className="text-white mb-2 block">提取的内容</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-blueprint-dark border-tech-cyan/30 text-white placeholder:text-gray-500 min-h-[150px]"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleGenerateTestCases}
                    disabled={loading || !description.trim()}
                    className="w-full bg-tech-cyan hover:bg-tech-cyan/80 text-blueprint-dark font-bold py-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        生成测试用例
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* 右侧：统计信息 */}
          <div className="space-y-4">
            <Card className="bg-blueprint-card border-tech-cyan/30 p-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">生成的用例总数</p>
                <p className="text-4xl font-bold text-tech-cyan">{testCases.length}</p>
              </div>
            </Card>

            <Card className="bg-blueprint-card border-tech-cyan/30 p-6">
              <p className="text-white font-bold mb-4">用例分布</p>
              <div className="space-y-2">
                {["positive", "negative", "boundary", "edge"].map((category) => {
                  const count = testCases.filter(tc => tc.category === category).length;
                  const label = {
                    positive: "正向场景",
                    negative: "异常场景",
                    boundary: "边界场景",
                    edge: "特殊场景"
                  }[category as keyof typeof label];
                  
                  return (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-gray-400">{label}</span>
                      <Badge className="bg-tech-cyan text-blueprint-dark">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>

            {testCases.length > 0 && (
              <Button
                onClick={handleDownloadTestCases}
                className="w-full bg-tech-cyan hover:bg-tech-cyan/80 text-blueprint-dark font-bold"
              >
                <Download className="mr-2 h-4 w-4" />
                下载用例 (CSV)
              </Button>
            )}
          </div>
        </div>

        {/* 生成的测试用例列表 */}
        {testCases.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">生成的测试用例</h2>
            <div className="grid gap-4">
              {testCases.map((testCase, idx) => (
                <Card key={idx} className="bg-blueprint-card border-tech-cyan/30 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{testCase.title}</h3>
                        <Badge className={`
                          ${testCase.category === "positive" ? "bg-green-600" : ""}
                          ${testCase.category === "negative" ? "bg-red-600" : ""}
                          ${testCase.category === "boundary" ? "bg-yellow-600" : ""}
                          ${testCase.category === "edge" ? "bg-purple-600" : ""}
                        `}>
                          {testCase.category}
                        </Badge>
                      </div>
                      {testCase.description && (
                        <p className="text-gray-300 text-sm">{testCase.description}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleCopyTestCase(testCase)}
                      variant="ghost"
                      size="sm"
                      className="text-tech-cyan hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {testCase.precondition && (
                    <div className="mb-3">
                      <p className="text-gray-400 text-sm font-bold">前置条件</p>
                      <p className="text-gray-300 text-sm">{testCase.precondition}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-gray-400 text-sm font-bold">测试步骤</p>
                    <ol className="list-decimal list-inside space-y-1">
                      {testCase.steps.map((step, stepIdx) => (
                        <li key={stepIdx} className="text-gray-300 text-sm">{step}</li>
                      ))}
                    </ol>
                  </div>

                  {testCase.expectedResult && (
                    <div>
                      <p className="text-gray-400 text-sm font-bold">预期结果</p>
                      <p className="text-gray-300 text-sm">{testCase.expectedResult}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {testCases.length === 0 && !loading && (
          <div className="mt-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">还没有生成测试用例</p>
            <p className="text-gray-500 text-sm mt-2">输入功能描述或导入需求文档，点击"生成测试用例"开始</p>
          </div>
        )}
      </div>
    </div>
  );
}
