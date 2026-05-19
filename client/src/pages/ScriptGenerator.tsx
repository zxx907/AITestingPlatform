import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Eye, Code2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ScriptFormat = "postman" | "jmeter" | "python";

interface APIConfig {
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

export default function ScriptGenerator() {
  const [activeFormat, setActiveFormat] = useState<ScriptFormat>("postman");
  const [showPreview, setShowPreview] = useState(true);
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

  const generatePostmanCollection = () => {
    return JSON.stringify({
      info: {
        name: config.name,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: [
        {
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
              options: {
                raw: {
                  language: "json"
                }
              }
            } : undefined,
            url: {
              raw: config.url,
              protocol: config.url.split("://")[0],
              host: config.url.split("://")[1]?.split("/")[0].split("?")[0],
              path: config.url.split("://")[1]?.split("/").slice(1) || []
            }
          }
        }
      ]
    }, null, 2);
  };

  const generateJMeterScript = () => {
    const urlObj = new URL(config.url);
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
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
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
        <stringProp name="ThreadGroup.duration"></stringProp>
        <stringProp name="ThreadGroup.delay"></stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
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
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;
  };

  const generatePythonScript = () => {
    return `import requests
import json
from typing import Dict, Any

class APITester:
    def __init__(self, base_url: str = "${config.url}"):
        self.base_url = base_url
        self.headers = ${JSON.stringify(config.headers, null, 8)}
    
    def ${config.name.toLowerCase().replace(/\\s+/g, "_")}(self, **kwargs) -> Dict[str, Any]:
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
                raise ValueError(f"Unsupported method: ${'${config.method}'}")
            
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

# Usage example
if __name__ == "__main__":
    tester = APITester()
    result = tester.${config.name.toLowerCase().replace(/\\s+/g, "_")}()
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
    const baseName = config.name.toLowerCase().replace(/\\s+/g, "-");
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
          将接口配置导出为多种格式的脚本，支持 Postman、JMeter、Python
        </p>
      </div>

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
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
