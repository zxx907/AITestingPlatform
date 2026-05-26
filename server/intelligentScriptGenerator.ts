/**
 * 智能接口测试脚本生成引擎
 * 
 * 功能：
 * 1. 解析 OpenAPI/Swagger 文档
 * 2. 自动识别接口参数、认证方式、响应格式
 * 3. 生成多种测试场景（正常、异常、边界）
 * 4. 智能生成测试数据
 * 5. 导出为多种格式脚本
 */

import { z } from "zod";

// ==================== 类型定义 ====================

interface OpenAPIParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required: boolean;
  schema: {
    type: string;
    format?: string;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: any[];
    items?: any;
  };
  description?: string;
}

interface OpenAPIEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters: OpenAPIParameter[];
  requestBody?: {
    required: boolean;
    content: {
      [key: string]: {
        schema: any;
      };
    };
  };
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        [key: string]: {
          schema: any;
        };
      };
    };
  };
  security?: Array<{ [key: string]: string[] }>;
}

interface TestScenario {
  name: string;
  description: string;
  type: "positive" | "negative" | "boundary" | "security";
  endpoint: OpenAPIEndpoint;
  parameters: Record<string, any>;
  headers: Record<string, string>;
  body?: any;
  expectedStatus: number;
  expectedAssertions: string[];
}

// ==================== 参数生成器 ====================

export class ParameterGenerator {
  /**
   * 根据参数类型生成测试数据
   */
  static generateValue(paramType: string, paramName: string, format?: string): any {
    // 根据参数名称推断类型
    const lowerName = paramName.toLowerCase();

    if (lowerName.includes("email")) {
      return "test@example.com";
    }
    if (lowerName.includes("phone") || lowerName.includes("mobile")) {
      return "13800138000";
    }
    if (lowerName.includes("id")) {
      return Math.floor(Math.random() * 10000) + 1;
    }
    if (lowerName.includes("name")) {
      return "测试用户";
    }
    if (lowerName.includes("password") || lowerName.includes("pwd")) {
      return "Test@123456";
    }
    if (lowerName.includes("date") || lowerName.includes("time")) {
      return new Date().toISOString();
    }
    if (lowerName.includes("url") || lowerName.includes("uri")) {
      return "https://example.com";
    }

    // 根据类型生成
    switch (paramType) {
      case "string":
        if (format === "email") return "test@example.com";
        if (format === "date") return new Date().toISOString().split("T")[0];
        if (format === "date-time") return new Date().toISOString();
        if (format === "uuid") return "550e8400-e29b-41d4-a716-446655440000";
        return "test_value";

      case "integer":
      case "number":
        return Math.floor(Math.random() * 1000) + 1;

      case "boolean":
        return true;

      case "array":
        return [1, 2, 3];

      case "object":
        return { key: "value" };

      default:
        return null;
    }
  }

  /**
   * 生成边界值
   */
  static generateBoundaryValue(paramType: string, constraints?: any): any {
    switch (paramType) {
      case "string":
        return constraints?.maxLength ? "x".repeat(constraints.maxLength + 1) : "x".repeat(1001);

      case "integer":
      case "number":
        return constraints?.maximum ? constraints.maximum + 1 : 999999999;

      case "array":
        return [];

      default:
        return null;
    }
  }

  /**
   * 生成异常值
   */
  static generateInvalidValue(paramType: string): any {
    switch (paramType) {
      case "string":
        return 12345; // 期望字符串，传数字

      case "integer":
      case "number":
        return "not_a_number"; // 期望数字，传字符串

      case "boolean":
        return "yes"; // 期望布尔值，传字符串

      case "array":
        return "not_an_array"; // 期望数组，传字符串

      default:
        return null;
    }
  }
}

// ==================== 测试场景生成器 ====================

export class TestScenarioGenerator {
  /**
   * 为接口生成所有测试场景
   */
  static generateScenarios(endpoint: OpenAPIEndpoint): TestScenario[] {
    const scenarios: TestScenario[] = [];

    // 1. 正常场景
    scenarios.push(this.generatePositiveScenario(endpoint));

    // 2. 缺少必填参数
    const requiredParams = endpoint.parameters.filter((p) => p.required);
    if (requiredParams.length > 0) {
      scenarios.push(this.generateMissingParameterScenario(endpoint, requiredParams[0]));
    }

    // 3. 无效参数值
    scenarios.push(this.generateInvalidParameterScenario(endpoint));

    // 4. 边界值
    scenarios.push(this.generateBoundaryScenario(endpoint));

    // 5. 认证失败
    if (endpoint.security && endpoint.security.length > 0) {
      scenarios.push(this.generateUnauthorizedScenario(endpoint));
    }

    // 6. 资源不存在
    scenarios.push(this.generateNotFoundScenario(endpoint));

    return scenarios;
  }

  /**
   * 正常场景
   */
  private static generatePositiveScenario(endpoint: OpenAPIEndpoint): TestScenario {
    const parameters = this.generateParameters(endpoint.parameters, "valid");
    const headers = this.generateHeaders(endpoint);
    const body = this.generateRequestBody(endpoint.requestBody);

    return {
      name: `${endpoint.method} ${endpoint.path} - 正常请求`,
      description: `测试 ${endpoint.summary || endpoint.path} 的正常流程`,
      type: "positive",
      endpoint,
      parameters,
      headers,
      body,
      expectedStatus: 200,
      expectedAssertions: [
        "响应状态码为 200",
        "响应体包含必要字段",
        "响应时间 < 1000ms"
      ]
    };
  }

  /**
   * 缺少必填参数场景
   */
  private static generateMissingParameterScenario(
    endpoint: OpenAPIEndpoint,
    missingParam: OpenAPIParameter
  ): TestScenario {
    const parameters = this.generateParameters(
      endpoint.parameters.filter((p) => p.name !== missingParam.name),
      "valid"
    );
    const headers = this.generateHeaders(endpoint);

    return {
      name: `${endpoint.method} ${endpoint.path} - 缺少必填参数 ${missingParam.name}`,
      description: `测试缺少必填参数 ${missingParam.name} 时的错误处理`,
      type: "negative",
      endpoint,
      parameters,
      headers,
      expectedStatus: 400,
      expectedAssertions: [
        "响应状态码为 400",
        "错误信息包含参数名称",
        "错误信息清晰明确"
      ]
    };
  }

  /**
   * 无效参数值场景
   */
  private static generateInvalidParameterScenario(endpoint: OpenAPIEndpoint): TestScenario {
    const parameters = this.generateParameters(endpoint.parameters, "invalid");
    const headers = this.generateHeaders(endpoint);

    return {
      name: `${endpoint.method} ${endpoint.path} - 无效参数值`,
      description: `测试参数值类型错误时的处理`,
      type: "negative",
      endpoint,
      parameters,
      headers,
      expectedStatus: 400,
      expectedAssertions: [
        "响应状态码为 400 或 422",
        "错误信息指出参数错误",
        "错误信息包含期望的类型"
      ]
    };
  }

  /**
   * 边界值场景
   */
  private static generateBoundaryScenario(endpoint: OpenAPIEndpoint): TestScenario {
    const parameters = this.generateParameters(endpoint.parameters, "boundary");
    const headers = this.generateHeaders(endpoint);

    return {
      name: `${endpoint.method} ${endpoint.path} - 边界值测试`,
      description: `测试参数边界值的处理`,
      type: "boundary",
      endpoint,
      parameters,
      headers,
      expectedStatus: 400,
      expectedAssertions: [
        "响应状态码为 400 或 200（取决于业务规则）",
        "边界值被正确处理"
      ]
    };
  }

  /**
   * 认证失败场景
   */
  private static generateUnauthorizedScenario(endpoint: OpenAPIEndpoint): TestScenario {
    const parameters = this.generateParameters(endpoint.parameters, "valid");
    const headers = this.generateHeaders(endpoint);
    headers["Authorization"] = "Bearer invalid_token";

    return {
      name: `${endpoint.method} ${endpoint.path} - 认证失败`,
      description: `测试无效认证令牌的处理`,
      type: "negative",
      endpoint,
      parameters,
      headers,
      expectedStatus: 401,
      expectedAssertions: [
        "响应状态码为 401",
        "错误信息指出认证失败"
      ]
    };
  }

  /**
   * 资源不存在场景
   */
  private static generateNotFoundScenario(endpoint: OpenAPIEndpoint): TestScenario {
    const parameters = this.generateParameters(endpoint.parameters, "valid");
    // 修改 ID 参数为不存在的值
    const idParam = endpoint.parameters.find((p) => p.name.toLowerCase().includes("id"));
    if (idParam) {
      parameters[idParam.name] = 999999999;
    }

    const headers = this.generateHeaders(endpoint);

    return {
      name: `${endpoint.method} ${endpoint.path} - 资源不存在`,
      description: `测试访问不存在的资源时的处理`,
      type: "negative",
      endpoint,
      parameters,
      headers,
      expectedStatus: 404,
      expectedAssertions: [
        "响应状态码为 404",
        "错误信息指出资源不存在"
      ]
    };
  }

  /**
   * 生成参数值
   */
  private static generateParameters(
    parameters: OpenAPIParameter[],
    mode: "valid" | "invalid" | "boundary"
  ): Record<string, any> {
    const result: Record<string, any> = {};

    parameters.forEach((param) => {
      const paramType = param.schema.type;

      if (mode === "valid") {
        result[param.name] = ParameterGenerator.generateValue(paramType, param.name, param.schema.format);
      } else if (mode === "invalid") {
        result[param.name] = ParameterGenerator.generateInvalidValue(paramType);
      } else if (mode === "boundary") {
        result[param.name] = ParameterGenerator.generateBoundaryValue(paramType, param.schema);
      }
    });

    return result;
  }

  /**
   * 生成 Headers
   */
  private static generateHeaders(endpoint: OpenAPIEndpoint): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "AI-Testing-Platform/1.0"
    };

    // 如果需要认证
    if (endpoint.security && endpoint.security.length > 0) {
      const securityScheme = endpoint.security[0];
      if (securityScheme["bearerAuth"]) {
        headers["Authorization"] = "Bearer test_token_" + Math.random().toString(36).substring(7);
      } else if (securityScheme["apiKey"]) {
        headers["X-API-Key"] = "test_key_" + Math.random().toString(36).substring(7);
      }
    }

    return headers;
  }

  /**
   * 生成请求体
   */
  private static generateRequestBody(requestBody?: any): any {
    if (!requestBody) return undefined;

    const jsonSchema = requestBody.content?.["application/json"]?.schema;
    if (!jsonSchema) return undefined;

    return this.generateFromSchema(jsonSchema);
  }

  /**
   * 从 JSON Schema 生成数据
   */
  private static generateFromSchema(schema: any): any {
    if (schema.type === "object") {
      const result: Record<string, any> = {};
      const properties = schema.properties || {};

      Object.entries(properties).forEach(([key, prop]: [string, any]) => {
        result[key] = this.generateFromSchema(prop);
      });

      return result;
    } else if (schema.type === "array") {
      return [this.generateFromSchema(schema.items || {})];
    } else {
      return ParameterGenerator.generateValue(schema.type, "", schema.format);
    }
  }
}

// ==================== 脚本生成器 ====================

export class ScriptGenerator {
  /**
   * 生成 Python 测试脚本
   */
  static generatePythonScript(scenarios: TestScenario[], baseUrl: string): string {
    const scenarioTests = scenarios
      .map((scenario, index) => this.generatePythonTest(scenario, baseUrl, index))
      .join("\n\n");

    return `import requests
import json
from typing import Dict, Any
import pytest

class TestAPI:
    """API 自动化测试套件"""
    
    BASE_URL = "${baseUrl}"
    
    def setup_method(self):
        """每个测试前的准备"""
        self.session = requests.Session()
        self.response = None
    
    def teardown_method(self):
        """每个测试后的清理"""
        if self.session:
            self.session.close()
    
    def _make_request(self, method: str, path: str, **kwargs) -> requests.Response:
        """发送 HTTP 请求"""
        url = f"{self.BASE_URL}{path}"
        response = self.session.request(method, url, **kwargs)
        self.response = response
        return response
    
${scenarioTests}
`;
  }

  /**
   * 生成单个 Python 测试方法
   */
  private static generatePythonTest(scenario: TestScenario, baseUrl: string, index: number): string {
    const methodName = `test_${index + 1}_${scenario.type}_${String(scenario.endpoint.method).toLowerCase()}`;
    const paramStr = this.formatPythonParams(scenario.parameters);
    const headersStr = this.formatPythonDict(scenario.headers);
    const bodyStr = scenario.body ? JSON.stringify(scenario.body, null, 12) : "None";

    const assertions = scenario.expectedAssertions
      .map((assertion) => `        assert response.status_code == ${scenario.expectedStatus}, "${assertion}"`)
      .join("\n");

    return `    def ${methodName}(self):
        """${scenario.description}"""
        # 准备参数
        params = ${paramStr}
        headers = ${headersStr}
        data = ${bodyStr}
        
        # 发送请求
        response = self._make_request(
            "${String(scenario.endpoint.method).toUpperCase()}",
            "${scenario.endpoint.path}",
            params=params,
            headers=headers,
            json=data if data != "None" else None
        )
        
        # 断言
${assertions}
        assert response.elapsed.total_seconds() < 1.0, "响应时间超过 1 秒"
`;
  }

  /**
   * 生成 Postman Collection
   */
  static generatePostmanCollection(scenarios: TestScenario[], baseUrl: string): any {
    const items = scenarios.map((scenario, index) => ({
      name: scenario.name,
      request: {
        method: String(scenario.endpoint.method).toUpperCase(),
        header: Object.entries(scenario.headers).map(([key, value]) => ({
          key,
          value,
          type: "text"
        })),
        body: scenario.body
          ? {
              mode: "raw",
              raw: JSON.stringify(scenario.body, null, 2),
              options: { raw: { language: "json" } }
            }
          : undefined,
        url: {
          raw: `${baseUrl}${scenario.endpoint.path}`,
          protocol: baseUrl.split("://")[0],
          host: baseUrl.split("://")[1]?.split("/")[0].split("?")[0],
          path: scenario.endpoint.path.split("/").filter((p) => p),
          query: Object.entries(scenario.parameters).map(([key, value]) => ({
            key,
            value: String(value)
          }))
        },
        description: scenario.description
      },
      response: [],
      event: [
        {
          listen: "test",
          script: {
            exec: [
              `pm.test("Status code is ${scenario.expectedStatus}", function () {`,
              `    pm.response.to.have.status(${scenario.expectedStatus});`,
              `});`,
              `pm.test("Response time is less than 1000ms", function () {`,
              `    pm.expect(pm.response.responseTime).to.be.below(1000);`,
              `});`
            ]
          }
        }
      ]
    }));

    return {
      info: {
        name: "AI Generated API Tests",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: items,
      variable: [
        {
          key: "base_url",
          value: baseUrl,
          type: "string"
        }
      ]
    };
  }

  /**
   * 生成 cURL 命令
   */
  static generateCurlCommand(scenario: TestScenario, baseUrl: string): string {
    let cmd = `curl -X ${String(scenario.endpoint.method).toUpperCase()} "${baseUrl}${scenario.endpoint.path}"`;

    // 添加 Headers
    Object.entries(scenario.headers).forEach(([key, value]) => {
      cmd += ` \\\n  -H "${key}: ${value}"`;
    });

    // 添加参数
    const queryParams = new URLSearchParams(scenario.parameters).toString();
    if (queryParams) {
      cmd += `?${queryParams}`;
    }

    // 添加 Body
    if (scenario.body) {
      cmd += ` \\\n  -d '${JSON.stringify(scenario.body)}'`;
    }

    return cmd;
  }

  // ==================== 辅助方法 ====================

  private static formatPythonParams(params: Record<string, any>): string {
    return JSON.stringify(params, null, 8).replace(/"/g, "'");
  }

  private static formatPythonDict(dict: Record<string, string>): string {
    return JSON.stringify(dict, null, 8).replace(/"/g, "'");
  }
}

// ==================== 主入口 ====================

export class IntelligentScriptGenerator {
  /**
   * 从 OpenAPI 文档生成完整的测试脚本
   */
  static generateFromOpenAPI(
    openAPIDoc: any,
    baseUrl: string,
    format: "python" | "postman" | "curl" = "python"
  ): string {
    // 1. 解析 OpenAPI 文档
    const endpoint = this.parseOpenAPIEndpoint(openAPIDoc);

    // 2. 生成测试场景
    const scenarios = TestScenarioGenerator.generateScenarios(endpoint);

    // 3. 生成脚本
    switch (format) {
      case "python":
        return ScriptGenerator.generatePythonScript(scenarios, baseUrl);
      case "postman":
        return JSON.stringify(ScriptGenerator.generatePostmanCollection(scenarios, baseUrl), null, 2);
      case "curl":
        return scenarios.map((s) => ScriptGenerator.generateCurlCommand(s, baseUrl)).join("\n\n");
      default:
        return "";
    }
  }

  /**
   * 解析 OpenAPI 端点
   */
  private static parseOpenAPIEndpoint(doc: any): OpenAPIEndpoint {
    // 这是一个简化版本，实际应该遍历所有端点
    const paths = doc.paths || {};
    const firstPath = Object.keys(paths)[0];
    const firstMethod = Object.keys(paths[firstPath])[0];
    const operation = paths[firstPath][firstMethod];

    return {
      path: firstPath,
      method: String(firstMethod).toLowerCase(),
      summary: operation.summary,
      description: operation.description,
      parameters: operation.parameters || [],
      requestBody: operation.requestBody,
      responses: operation.responses || {},
      security: operation.security
    };
  }
}
