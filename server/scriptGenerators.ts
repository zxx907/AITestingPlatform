import { ApiConfig } from "../drizzle/schema";

/**
 * 生成 Postman Collection JSON 格式
 */
export function generatePostmanCollection(apiConfigs: ApiConfig[], collectionName: string = "API Collection") {
  const collection = {
    info: {
      name: collectionName,
      description: "Generated API collection for testing",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: apiConfigs.map(config => ({
      name: config.name,
      request: {
        method: config.method,
        header: Object.entries(config.headers || {}).map(([key, value]) => ({
          key,
          value,
          type: "text"
        })),
        body: config.body ? {
          mode: config.bodyType || "json",
          raw: config.body
        } : undefined,
        url: {
          raw: config.url,
          protocol: config.url.split("://")[0],
          host: config.url.split("://")[1]?.split("/")[0]?.split("?")[0] || "",
          path: config.url.split("://")[1]?.split("/").slice(1) || [],
          query: Object.entries(config.queryParams || {}).map(([key, value]) => ({
            key,
            value
          }))
        }
      },
      response: []
    }))
  };

  return JSON.stringify(collection, null, 2);
}

/**
 * 生成 JMeter JMX 格式
 */
export function generateJMeterScript(apiConfigs: ApiConfig[], testPlanName: string = "API Test Plan") {
  const timestamp = Date.now();
  
  const samplers = apiConfigs.map((config, index) => `
    <HTTPSampler guiclass="HttpTestSampleGui" testclass="HTTPSampler" testname="${config.name}" enabled="true">
      <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" enabled="true">
        <collectionProp name="Arguments.arguments">
          ${Object.entries(config.queryParams || {}).map(([key, value]) => `
          <elementProp name="${key}" elementType="HTTPArgument">
            <boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.name">${key}</stringProp>
            <stringProp name="Argument.value">${value}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
            <boolProp name="HTTPArgument.use_equals">true</boolProp>
          </elementProp>`).join("")}
        </collectionProp>
      </elementProp>
      <stringProp name="HTTPSampler.domain">${new URL(config.url).hostname}</stringProp>
      <stringProp name="HTTPSampler.port">${new URL(config.url).port || ""}</stringProp>
      <stringProp name="HTTPSampler.protocol">${new URL(config.url).protocol.replace(":", "")}</stringProp>
      <stringProp name="HTTPSampler.contentEncoding"></stringProp>
      <stringProp name="HTTPSampler.path">${new URL(config.url).pathname}</stringProp>
      <stringProp name="HTTPSampler.method">${config.method}</stringProp>
      <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
      <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
      <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
      <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
      <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
      <stringProp name="HTTPSampler.connect_timeout"></stringProp>
      <stringProp name="HTTPSampler.response_timeout"></stringProp>
      ${config.body ? `<elementProp name="HTTPsampler.PostBody" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" enabled="true">
        <boolProp name="HTTPArgument.always_encode">false</boolProp>
        <stringProp name="Argument.value">${escapeXml(config.body)}</stringProp>
        <stringProp name="Argument.metadata">=</stringProp>
      </elementProp>` : ""}
    </HTTPSampler>`).join("");

  const jmx = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.0 r1840935">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="${testPlanName}" enabled="true">
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" enabled="true">
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
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">1</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">1</stringProp>
        <stringProp name="ThreadGroup.ramp_time">1</stringProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
        <stringProp name="ThreadGroup.duration"></stringProp>
        <stringProp name="ThreadGroup.delay"></stringProp>
      </ThreadGroup>
      <hashTree>
        ${samplers}
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;

  return jmx;
}

/**
 * 生成 Python requests 脚本
 */
export function generatePythonScript(apiConfigs: ApiConfig[], scriptName: string = "api_tests") {
  const imports = `import requests
import json
from typing import Dict, Any
import time

class ${toPascalCase(scriptName)}:
    """API Test Suite"""
    
    def __init__(self, base_url: str = ""):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = []
    
    def _make_request(self, method: str, url: str, headers: Dict = None, 
                     params: Dict = None, data: Any = None, timeout: int = 30) -> Dict:
        """Make HTTP request and return response"""
        try:
            start_time = time.time()
            
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params, timeout=timeout)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=headers, params=params, json=data, timeout=timeout)
            elif method.upper() == "PUT":
                response = self.session.put(url, headers=headers, params=params, json=data, timeout=timeout)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, params=params, timeout=timeout)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, headers=headers, params=params, json=data, timeout=timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            elapsed_time = (time.time() - start_time) * 1000  # Convert to ms
            
            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.text,
                "elapsed_time": elapsed_time,
                "success": 200 <= response.status_code < 300
            }
        except Exception as e:
            return {
                "status_code": 0,
                "headers": {},
                "body": str(e),
                "elapsed_time": 0,
                "success": False,
                "error": str(e)
            }
    
    def close(self):
        """Close the session"""
        self.session.close()
`;

  const methods = apiConfigs.map((config, index) => {
    const methodName = toSnakeCase(config.name || `api_${index + 1}`);
    const headers = config.headers ? JSON.stringify(config.headers, null, 8) : "{}";
    const params = config.queryParams ? JSON.stringify(config.queryParams, null, 8) : "{}";
    const body = config.body ? JSON.stringify(JSON.parse(config.body), null, 8) : "None";

    return `
    def ${methodName}(self) -> Dict:
        """${config.description || config.name}"""
        url = "${config.url}"
        method = "${config.method}"
        headers = ${headers}
        params = ${params}
        data = ${body}
        
        response = self._make_request(method, url, headers=headers, params=params, data=data, timeout=${config.timeout || 30000})
        self.results.append({
            "name": "${config.name}",
            "method": method,
            "url": url,
            "response": response
        })
        
        return response
`;
  }).join("\n");

  const testRunner = `

def run_all_tests():
    """Run all API tests"""
    suite = ${toPascalCase(scriptName)}()
    
    try:
        ${apiConfigs.map((config, index) => {
          const methodName = toSnakeCase(config.name || `api_${index + 1}`);
          return `print(f"Testing: ${config.name}...")
        result = suite.${methodName}()
        print(f"  Status: {result['status_code']}")
        print(f"  Response Time: {result['elapsed_time']:.2f}ms")
        print()`;
        }).join("\n        ")}
    finally:
        suite.close()
    
    # Print summary
    print("\\n=== Test Summary ===")
    total = len(suite.results)
    passed = sum(1 for r in suite.results if r['response']['success'])
    print(f"Total: {total}, Passed: {passed}, Failed: {total - passed}")


if __name__ == "__main__":
    run_all_tests()
`;

  return imports + methods + testRunner;
}

// ==================== 辅助函数 ====================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .replace(/[-\s]+/g, "_")
    .toLowerCase()
    .replace(/^_+|_+$/g, "");
}

export { escapeXml, toPascalCase, toSnakeCase };
