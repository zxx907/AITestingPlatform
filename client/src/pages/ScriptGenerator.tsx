import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Eye, Code2, AlertCircle, Upload, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type ScriptFormat = "postman" | "jmeter" | "python";

interface APIConfig {
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

interface TestCase {
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  category: string;
}

export default function ScriptGenerator() {
  const [activeFormat, setActiveFormat] = useState<ScriptFormat>("postman");
  const [showPreview, setShowPreview] = useState(true);
  const [apiDocUploaded, setApiDocUploaded] = useState(false);
  const [testCaseUploaded, setTestCaseUploaded] = useState(false);
  const [apiDocContent, setApiDocContent] = useState("");
  const [testCasesContent, setTestCasesContent] = useState<TestCase[]>([]);
  
  const apiDocInputRef = useRef<HTMLInputElement>(null);
  const testCaseInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<APIConfig>({
    name: "Get Users API",
    method: "GET",
    url: "https://api.example.com/users",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_TOKEN"
    },
    body: ""
  });

  // 解析 OpenAPI/Swagger 文档
  const parseOpenAPIDoc = (content: string): APIConfig => {
    try {
      const doc = JSON.parse(content);
      const paths = doc.paths || {};
      const firstPath = Object.keys(paths)[0];
      const firstMethod = Object.keys(paths[firstPath])[0];
      const endpoint = paths[firstPath][firstMethod];

      return {
        name: endpoint.summary || firstPath,
        method: firstMethod.toUpperCase(),
        url: `${doc.servers?.[0]?.url || "https://api.example.com"}${firstPath}`,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer YOUR_TOKEN"
        },
        body: endpoint.requestBody?.content?.["application/json"]?.schema ? 
          JSON.stringify(endpoint.requestBody.content["application/json"].schema, null, 2) : ""
      };
    } catch {
      toast.error("无法解析 OpenAPI 文档，请检查格式");
      return config;
    }
  };

  // 解析 Postman Collection
  const parsePostmanCollection = (content: string): APIConfig => {
    try {
      const collection = JSON.parse(content);
      const firstItem = collection.item?.[0];
      const request = firstItem?.request;

      return {
        name: firstItem?.name || "API",
        method: request?.method || "GET",
        url: typeof request?.url === "string" ? request.url : request?.url?.raw || "",
        headers: request?.header?.reduce((acc: any, h: any) => {
          acc[h.key] = h.value;
          return acc;
        }, {}) || {},
        body: request?.body?.raw || ""
      };
    } catch {
      toast.error("无法解析 Postman Collection，请检查格式");
      return config;
    }
  };

  // 处理接口文档上传
  const handleApiDocUpload = async (file: File) => {
    try {
      const content = await file.text();
      setApiDocContent(content);

      // 根据文件类型解析
      if (file.name.includes("openapi") || file.name.includes("swagger")) {
        const parsed = parseOpenAPIDoc(content);
        setConfig(parsed);
      } else if (file.name.includes("postman")) {
        const parsed = parsePostmanCollection(content);
        setConfig(parsed);
      } else {
        // 尝试作为 JSON 解析
        try {
          const parsed = parseOpenAPIDoc(content);
          setConfig(parsed);
        } catch {
          setApiDocContent(content);
        }
      }

      setApiDocUploaded(true);
      toast.success("接口文档已上传并解析");
    } catch (error) {
      toast.error("上传失败，请检查文件格式");
    }
  };

  // 处理测试用例上传
  const handleTestCaseUpload = async (file: File) => {
    try {
      const content = await file.text();

      let cases: TestCase[] = [];

      if (file.name.endsWith(".json")) {
        // 尝试作为 XMind JSON 或普通 JSON 解析
        const data = JSON.parse(content);
        if (data.rootTopic) {
          // XMind JSON 格式
          cases = parseXMindJSON(data);
        } else if (Array.isArray(data)) {
          // 普通 JSON 数组
          cases = data;
        } else {
          cases = [data];
        }
      } else if (file.name.endsWith(".csv")) {
        // 简单的 CSV 解析
        const lines = content.split("\n");
        const headers = lines[0].split(",");
        cases = lines.slice(1).map(line => {
          const values = line.split(",");
          return {
            title: values[0] || "",
            description: values[1] || "",
            steps: values[2]?.split("|") || [],
            expectedResult: values[3] || "",
            category: values[4] || "positive"
          };
        });
      } else if (file.name.endsWith(".xmind")) {
        // XMind 文件 - 导出为 JSON 或文本格式
        // XMind 文件是 ZIP 格式，需要特殊处理
        // 这里假设用户已将 XMind 导出为 JSON 或文本
        toast.info("请将 XMind 文件导出为 JSON 或文本格式后上传");
        return;
      } else if (file.name.endsWith(".txt")) {
        // XMind 导出的文本格式
        cases = parseXMindText(content);
      } else {
        // 尝试作为 JSON 解析
        cases = JSON.parse(content);
      }

      setTestCasesContent(cases);
      setTestCaseUploaded(true);
      toast.success(`已上传 ${cases.length} 个测试用例`);
    } catch (error) {
      toast.error("上传失败，请检查文件格式");
    }
  };

  // XMind JSON 解析
  const parseXMindJSON = (data: any): TestCase[] => {
    const testCases: TestCase[] = [];
    const rootTopic = data.rootTopic || {};
    const children = rootTopic.children || [];
    
    children.forEach((testCaseTopic: any) => {
      const testCase: TestCase = {
        title: testCaseTopic.title || "",
        description: testCaseTopic.notes || "",
        steps: [],
        expectedResult: "",
        category: "positive"
      };
      
      if (testCaseTopic.children) {
        testCaseTopic.children.forEach((child: any) => {
          const title = child.title || "";
          
          if (title.toLowerCase().includes("预期") || title.toLowerCase().includes("expected")) {
            testCase.expectedResult = title;
          } else if (title.toLowerCase().includes("异常") || title.toLowerCase().includes("negative")) {
            testCase.category = "negative";
            testCase.steps.push(title);
          } else if (title.toLowerCase().includes("边界") || title.toLowerCase().includes("boundary")) {
            testCase.category = "boundary";
            testCase.steps.push(title);
          } else if (title.toLowerCase().includes("特殊") || title.toLowerCase().includes("edge")) {
            testCase.category = "edge";
            testCase.steps.push(title);
          } else {
            testCase.steps.push(title);
          }
        });
      }
      
      if (testCase.steps.length === 0) {
        testCase.steps.push("执行测试");
      }
      if (!testCase.expectedResult) {
        testCase.expectedResult = "测试通过";
      }
      
      testCases.push(testCase);
    });
    
    return testCases;
  };

  // XMind 文本格式解析
  const parseXMindText = (textContent: string): TestCase[] => {
    const testCases: TestCase[] = [];
    const lines = textContent.split("\n").filter(line => line.trim());
    
    let currentTestCase: TestCase | null = null;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      const currentIndent = line.search(/\S/);
      
      if (currentIndent === 0) {
        return;
      } else if (currentIndent <= 2) {
        if (currentTestCase) {
          testCases.push(currentTestCase);
        }
        
        currentTestCase = {
          title: trimmed,
          description: "",
          steps: [],
          expectedResult: "",
          category: "positive"
        };
      } else if (currentTestCase && currentIndent > 2) {
        if (trimmed.toLowerCase().includes("预期") || trimmed.toLowerCase().includes("expected")) {
          currentTestCase.expectedResult = trimmed.replace(/^(预期|expected)[\s:：]*/, "");
        } else if (trimmed.toLowerCase().includes("描述") || trimmed.toLowerCase().includes("description")) {
          currentTestCase.description = trimmed.replace(/^(描述|description)[\s:：]*/, "");
        } else if (trimmed.toLowerCase().includes("异常") || trimmed.toLowerCase().includes("negative")) {
          currentTestCase.category = "negative";
          currentTestCase.steps.push(trimmed);
        } else if (trimmed.toLowerCase().includes("边界") || trimmed.toLowerCase().includes("boundary")) {
          currentTestCase.category = "boundary";
          currentTestCase.steps.push(trimmed);
        } else if (trimmed.toLowerCase().includes("特殊") || trimmed.toLowerCase().includes("edge")) {
          currentTestCase.category = "edge";
          currentTestCase.steps.push(trimmed);
        } else {
          currentTestCase.steps.push(trimmed);
        }
      }
    });
    
    if (currentTestCase) {
      testCases.push(currentTestCase);
    }
    
    return testCases;
  };

  const generatePostmanCollection = () => {
    const items = testCasesContent.length > 0 
      ? testCasesContent.map((tc, idx) => ({
          name: tc.title,
          request: {
            method: config.method,
            header: Object.entries(config.headers).map(([key, value]) => ({
              key,
              value,
              type: "text"
            })),
            body: config.method !== "GET" ? {
              mode: "raw",
              raw: config.body,
              options: { raw: { language: "json" } }
            } : undefined,
            url: {
              raw: config.url,
              protocol: config.url.split("://")[0],
              host: config.url.split("://")[1]?.split("/")[0].split("?")[0],
              path: config.url.split("://")[1]?.split("/").slice(1) || []
            },
            description: tc.description
          }
        }))
      : [{
          name: config.name,
          request: {
            method: config.method,
            header: Object.entries(config.headers).map(([key, value]) => ({
              key,
              value,
              type: "text"
            })),
            body: config.method !== "GET" ? {
              mode: "raw",
              raw: config.body,
              options: { raw: { language: "json" } }
            } : undefined,
            url: {
              raw: config.url,
              protocol: config.url.split("://")[0],
              host: config.url.split("://")[1]?.split("/")[0].split("?")[0],
              path: config.url.split("://")[1]?.split("/").slice(1) || []
            }
          }
        }];

    return JSON.stringify({
      info: {
        name: config.name,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: items
    }, null, 2);
  };

  const generateJMeterScript = () => {
    const urlObj = new URL(config.url);
    const testCaseItems = testCasesContent.length > 0
      ? testCasesContent.map((tc, idx) => `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${tc.title}" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">${urlObj.hostname}</stringProp>
          <stringProp name="HTTPSampler.port">${urlObj.port || (urlObj.protocol === "https:" ? "443" : "80")}</stringProp>
          <stringProp name="HTTPSampler.protocol">${urlObj.protocol.replace(":", "")}</stringProp>
          <stringProp name="HTTPSampler.path">${urlObj.pathname}</stringProp>
          <stringProp name="HTTPSampler.method">${config.method}</stringProp>
        </HTTPSamplerProxy>
        <hashTree/>
      `).join("")
      : `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${config.name}" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">${urlObj.hostname}</stringProp>
          <stringProp name="HTTPSampler.port">${urlObj.port || (urlObj.protocol === "https:" ? "443" : "80")}</stringProp>
          <stringProp name="HTTPSampler.protocol">${urlObj.protocol.replace(":", "")}</stringProp>
          <stringProp name="HTTPSampler.path">${urlObj.pathname}</stringProp>
          <stringProp name="HTTPSampler.method">${config.method}</stringProp>
        </HTTPSamplerProxy>
        <hashTree/>
      `;

    return `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.5">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Test Plan" enabled="true">
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Thread Group" enabled="true">
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">1</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">1</stringProp>
        <stringProp name="ThreadGroup.ramp_time">1</stringProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
      </ThreadGroup>
      <hashTree>
        ${testCaseItems}
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;
  };

  const generatePythonScript = () => {
    const methodName = config.name.toLowerCase().replace(/\s+/g, "_");
    
    const testCaseMethods = testCasesContent.length > 0
      ? testCasesContent.map((tc, idx) => `
    def test_${idx + 1}_${tc.title.toLowerCase().replace(/\s+/g, "_")}(self):
        """
        ${tc.title}
        
        Steps:
${tc.steps.map((s, i) => `        ${i + 1}. ${s}`).join("\n")}
        
        Expected: ${tc.expectedResult}
        """
        url = self.base_url
        
        try:
            if "${config.method}" == "GET":
                response = requests.get(url, headers=self.headers)
            elif "${config.method}" == "POST":
                response = requests.post(url, headers=self.headers, data=${JSON.stringify(config.body || "{}", null, 8)})
            elif "${config.method}" == "PUT":
                response = requests.put(url, headers=self.headers, data=${JSON.stringify(config.body || "{}", null, 8)})
            elif "${config.method}" == "DELETE":
                response = requests.delete(url, headers=self.headers)
            
            assert response.status_code in [200, 201, 204], f"Expected success, got {response.status_code}"
            return response
        except Exception as e:
            print(f"Test failed: {str(e)}")
            raise
`).join("\n")
      : "";

    return `import requests
import json
from typing import Dict, Any

class APITester:
    def __init__(self, base_url: str = "${config.url}"):
        self.base_url = base_url
        self.headers = ${JSON.stringify(config.headers, null, 8)}
    
    def ${methodName}(self, **kwargs) -> Dict[str, Any]:
        """
        ${config.name}
        
        Method: ${config.method}
        URL: ${config.url}
        """
        url = self.base_url
        
        try:
            if "${config.method}" == "GET":
                response = requests.get(url, headers=self.headers, **kwargs)
            elif "${config.method}" == "POST":
                response = requests.post(
                    url,
                    headers=self.headers,
                    data=${JSON.stringify(config.body || "{}", null, 8)},
                    **kwargs
                )
            elif "${config.method}" == "PUT":
                response = requests.put(
                    url,
                    headers=self.headers,
                    data=${JSON.stringify(config.body || "{}", null, 8)},
                    **kwargs
                )
            elif "${config.method}" == "DELETE":
                response = requests.delete(url, headers=self.headers, **kwargs)
            else:
                raise ValueError(f"Unsupported method: ${config.method}")
            
            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.json() if response.text else None,
                "elapsed": response.elapsed.total_seconds()
            }
        except Exception as e:
            return {
                "error": str(e),
                "status_code": None
            }
${testCaseMethods}

# Usage example
if __name__ == "__main__":
    tester = APITester()
    result = tester.${methodName}()
    print(json.dumps(result, indent=2))
`;
  };

  const getScript = () => {
    switch (activeFormat) {
      case "postman":
        return generatePostmanCollection();
      case "jmeter":
        return generateJMeterScript();
      case "python":
        return generatePythonScript();
      default:
        return "";
    }
  };

  const getFileExtension = () => {
    switch (activeFormat) {
      case "postman":
        return "json";
      case "jmeter":
        return "jmx";
      case "python":
        return "py";
      default:
        return "txt";
    }
  };

  const getFileName = () => {
    const baseName = config.name.toLowerCase().replace(/\s+/g, "-");
    return `${baseName}.${getFileExtension()}`;
  };

  const handleDownload = () => {
    const script = getScript();
    const blob = new Blob([script], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = getFileName();
    link.click();
    toast.success(`已下载 ${getFileName()}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getScript());
    toast.success("已复制到剪贴板");
  };

  const getFormatDescription = () => {
    switch (activeFormat) {
      case "postman":
        return "生成 Postman Collection 格式，可直接导入 Postman 应用";
      case "jmeter":
        return "生成 JMeter JMX 格式，可用于性能测试和负载测试";
      case "python":
        return "生成 Python requests 脚本，可集成到自动化测试框架";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="heading-lg">接口测试脚本生成</h1>
        <p className="text-muted-foreground">
          上传接口文档和测试用例，自动生成多种格式的自动化脚本
        </p>
      </div>

      {/* 文档上传区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 接口文档上传 */}
        <div className="blueprint-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-accent uppercase">接口文档上传</h3>
            {apiDocUploaded && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          </div>
          
          <p className="text-xs text-muted-foreground">
            支持格式：OpenAPI/Swagger JSON、Postman Collection、自定义 JSON
          </p>

          <div
            onClick={() => apiDocInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-semibold">点击上传接口文档</p>
            <p className="text-xs text-muted-foreground mt-1">或拖拽文件到此</p>
          </div>

          <input
            ref={apiDocInputRef}
            type="file"
            accept=".json,.yaml,.yml"
            onChange={(e) => e.target.files?.[0] && handleApiDocUpload(e.target.files[0])}
            className="hidden"
          />

          {apiDocUploaded && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-green-600">✓ 接口文档已上传</p>
            </div>
          )}
        </div>

        {/* 测试用例上传 */}
        <div className="blueprint-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-accent uppercase">测试用例上传</h3>
            {testCaseUploaded && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          </div>
          
          <p className="text-xs text-muted-foreground">
            支持格式：JSON、CSV、Excel、XMind、文本
          </p>

          <div
            onClick={() => testCaseInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-semibold">点击上传测试用例</p>
            <p className="text-xs text-muted-foreground mt-1">或拖拽文件到此</p>
          </div>

          <input
            ref={testCaseInputRef}
            type="file"
            accept=".json,.csv,.xlsx,.xls,.xmind,.txt"
            onChange={(e) => e.target.files?.[0] && handleTestCaseUpload(e.target.files[0])}
            className="hidden"
          />

          {testCaseUploaded && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-green-600">✓ 已上传 {testCasesContent.length} 个测试用例</p>
            </div>
          )}
        </div>
      </div>

      {/* API 配置和脚本生成 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：API 配置 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="blueprint-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-accent uppercase">API 配置</h3>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold">API 名称</Label>
              <Input
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="bg-input border border-border rounded-sm p-2 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">方法</Label>
              <Input
                value={config.method}
                onChange={(e) => setConfig({ ...config, method: e.target.value })}
                className="bg-input border border-border rounded-sm p-2 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">URL</Label>
              <Input
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="bg-input border border-border rounded-sm p-2 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Headers</Label>
              <Textarea
                value={JSON.stringify(config.headers, null, 2)}
                onChange={(e) => {
                  try {
                    setConfig({ ...config, headers: JSON.parse(e.target.value) });
                  } catch {}
                }}
                className="min-h-[80px] bg-input border border-border rounded-sm p-2 text-xs text-foreground font-mono"
              />
            </div>

            {config.method !== "GET" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Body (JSON)</Label>
                <Textarea
                  value={config.body}
                  onChange={(e) => setConfig({ ...config, body: e.target.value })}
                  className="min-h-[80px] bg-input border border-border rounded-sm p-2 text-xs text-foreground font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* 右侧：脚本预览和导出 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="blueprint-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-accent uppercase">脚本预览</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {showPreview ? "隐藏" : "显示"}
                </Button>
              </div>
            </div>

            {/* 格式选择 */}
            <div className="flex gap-2">
              {(["postman", "jmeter", "python"] as ScriptFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => setActiveFormat(format)}
                  className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all ${
                    activeFormat === format
                      ? "bg-accent text-background"
                      : "bg-input border border-border text-foreground hover:border-accent"
                  }`}
                >
                  {format === "postman" && "Postman"}
                  {format === "jmeter" && "JMeter"}
                  {format === "python" && "Python"}
                </button>
              ))}
            </div>

            {/* 格式说明 */}
            <div className="p-3 bg-input/50 border border-border rounded-sm">
              <p className="text-xs text-muted-foreground">{getFormatDescription()}</p>
              {testCasesContent.length > 0 && (
                <p className="text-xs text-accent mt-2">
                  ✓ 已包含 {testCasesContent.length} 个测试用例
                </p>
              )}
            </div>

            {/* 脚本预览 */}
            {showPreview && (
              <div className="space-y-2">
                <pre className="code-blueprint overflow-x-auto text-xs max-h-[400px]">
                  {getScript()}
                </pre>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                复制代码
              </Button>
              <Button
                onClick={handleDownload}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                下载 {getFileExtension().toUpperCase()}
              </Button>
            </div>
          </div>

          {/* 使用提示 */}
          <div className="blueprint-card p-4 space-y-2">
            <h4 className="text-xs font-semibold text-accent uppercase">使用提示</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Postman: 在 Postman 中点击 Import，选择生成的 JSON 文件</li>
              <li>• JMeter: 在 JMeter 中打开生成的 JMX 文件即可运行测试</li>
              <li>• Python: 将生成的脚本集成到你的测试框架中使用</li>
              <li>• 上传的测试用例会自动融入生成的脚本中</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
