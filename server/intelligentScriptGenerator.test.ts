import { describe, it, expect } from "vitest";
import {
  ParameterGenerator,
  TestScenarioGenerator,
  ScriptGenerator,
  IntelligentScriptGenerator
} from "./intelligentScriptGenerator";

describe("智能脚本生成引擎", () => {
  // ==================== 参数生成器测试 ====================

  describe("ParameterGenerator", () => {
    it("应该根据参数名称生成邮箱", () => {
      const value = ParameterGenerator.generateValue("string", "email");
      expect(value).toContain("@");
      expect(value).toContain(".");
    });

    it("应该根据参数名称生成电话号码", () => {
      const value = ParameterGenerator.generateValue("string", "phone");
      expect(value).toMatch(/^\d+$/);
      expect(value.length).toBeGreaterThan(10);
    });

    it("应该根据参数名称生成 ID", () => {
      const value = ParameterGenerator.generateValue("string", "userId");
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThan(0);
    });

    it("应该根据参数名称生成密码", () => {
      const value = ParameterGenerator.generateValue("string", "password");
      expect(value).toMatch(/[A-Z]/);
      expect(value).toMatch(/[0-9]/);
      expect(value).toMatch(/[@#$%^&*]/);
    });

    it("应该根据参数名称生成日期", () => {
      const value = ParameterGenerator.generateValue("string", "createdDate");
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });

    it("应该根据类型生成字符串", () => {
      const value = ParameterGenerator.generateValue("string", "name");
      expect(typeof value).toBe("string");
    });

    it("应该根据类型生成数字", () => {
      const value = ParameterGenerator.generateValue("integer", "count");
      expect(typeof value).toBe("number");
      expect(Number.isInteger(value)).toBe(true);
    });

    it("应该根据类型生成布尔值", () => {
      const value = ParameterGenerator.generateValue("boolean", "isActive");
      expect(typeof value).toBe("boolean");
    });

    it("应该生成边界值 - 超长字符串", () => {
      const value = ParameterGenerator.generateBoundaryValue("string", { maxLength: 10 });
      expect(value.length).toBe(11);
    });

    it("应该生成边界值 - 超大数字", () => {
      const value = ParameterGenerator.generateBoundaryValue("integer", { maximum: 100 });
      expect(value).toBe(101);
    });

    it("应该生成异常值 - 字符串类型错误", () => {
      const value = ParameterGenerator.generateInvalidValue("string");
      expect(typeof value).toBe("number");
    });

    it("应该生成异常值 - 数字类型错误", () => {
      const value = ParameterGenerator.generateInvalidValue("integer");
      expect(typeof value).toBe("string");
    });

    it("应该生成异常值 - 布尔类型错误", () => {
      const value = ParameterGenerator.generateInvalidValue("boolean");
      expect(typeof value).toBe("string");
    });
  });

  // ==================== 测试场景生成器测试 ====================

  describe("TestScenarioGenerator", () => {
    const mockEndpoint = {
      path: "/api/users/{id}",
      method: "GET",
      summary: "获取用户信息",
      description: "根据用户 ID 获取用户详细信息",
      parameters: [
        {
          name: "id",
          in: "path" as const,
          required: true,
          schema: { type: "integer" },
          description: "用户 ID"
        },
        {
          name: "includeDetails",
          in: "query" as const,
          required: false,
          schema: { type: "boolean" },
          description: "是否包含详细信息"
        }
      ],
      requestBody: undefined,
      responses: {
        "200": { description: "成功" },
        "404": { description: "用户不存在" }
      },
      security: [{ bearerAuth: [] }]
    };

    it("应该为接口生成多个测试场景", () => {
      const scenarios = TestScenarioGenerator.generateScenarios(mockEndpoint);
      expect(scenarios.length).toBeGreaterThan(3);
    });

    it("应该生成正常场景", () => {
      const scenarios = TestScenarioGenerator.generateScenarios(mockEndpoint);
      const positiveScenario = scenarios.find((s) => s.type === "positive");
      expect(positiveScenario).toBeDefined();
      expect(positiveScenario?.expectedStatus).toBe(200);
    });

    it("应该生成缺少必填参数场景", () => {
      const scenarios = TestScenarioGenerator.generateScenarios(mockEndpoint);
      const missingParamScenario = scenarios.find(
        (s) => s.name.includes("缺少必填参数")
      );
      expect(missingParamScenario).toBeDefined();
      expect(missingParamScenario?.expectedStatus).toBe(400);
    });

    it("应该生成无效参数场景", () => {
      const scenarios = TestScenarioGenerator.generateScenarios(mockEndpoint);
      const invalidScenario = scenarios.find((s) => s.name.includes("无效参数值"));
      expect(invalidScenario).toBeDefined();
      expect(invalidScenario?.expectedStatus).toBe(400);
    });

    it("应该生成边界值场景", () => {
      const scenarios = TestScenarioGenerator.generateScenarios(mockEndpoint);
      const boundaryScenario = scenarios.find((s) => s.type === "boundary");
      expect(boundaryScenario).toBeDefined();
    });

    it("应该生成认证失败场景", () => {
      const scenarios = TestScenarioGenerator.generateScenarios(mockEndpoint);
      const unauthorizedScenario = scenarios.find(
        (s) => s.name.includes("认证失败")
      );
      expect(unauthorizedScenario).toBeDefined();
      expect(unauthorizedScenario?.expectedStatus).toBe(401);
      expect(unauthorizedScenario?.headers["Authorization"]).toContain("Bearer");
    });

    it("应该生成资源不存在场景", () => {
      const scenarios = TestScenarioGenerator.generateScenarios(mockEndpoint);
      const notFoundScenario = scenarios.find((s) => s.name.includes("资源不存在"));
      expect(notFoundScenario).toBeDefined();
      expect(notFoundScenario?.expectedStatus).toBe(404);
    });

    it("应该为每个场景生成正确的 Headers", () => {
      const scenarios = TestScenarioGenerator.generateScenarios(mockEndpoint);
      scenarios.forEach((scenario) => {
        expect(scenario.headers["Content-Type"]).toBe("application/json");
        expect(scenario.headers["User-Agent"]).toContain("AI-Testing-Platform");
      });
    });

    it("应该为每个场景生成预期的断言", () => {
      const scenarios = TestScenarioGenerator.generateScenarios(mockEndpoint);
      scenarios.forEach((scenario) => {
        expect(scenario.expectedAssertions.length).toBeGreaterThan(0);
      });
    });
  });

  // ==================== 脚本生成器测试 ====================

  describe("ScriptGenerator", () => {
    const mockScenarios = [
      {
        name: "GET /api/users - 正常请求",
        description: "测试获取用户列表的正常流程",
        type: "positive" as const,
        endpoint: {
          path: "/api/users",
          method: "GET",
          parameters: [],
          responses: {}
        },
        parameters: { page: 1, limit: 10 },
        headers: { "Content-Type": "application/json" },
        expectedStatus: 200,
        expectedAssertions: ["响应状态码为 200"]
      }
    ];

    it("应该生成 Python 测试脚本", () => {
      const script = ScriptGenerator.generatePythonScript(
        mockScenarios as any,
        "https://api.example.com"
      );

      expect(script).toContain("import requests");
      expect(script).toContain("class TestAPI");
      expect(script).toContain("def test_");
      expect(script).toContain("assert response.status_code");
    });

    it("生成的 Python 脚本应该包含正确的基础 URL", () => {
      const script = ScriptGenerator.generatePythonScript(
        mockScenarios as any,
        "https://api.example.com"
      );

      expect(script).toContain("https://api.example.com");
    });

    it("生成的 Python 脚本应该包含正确的请求方法", () => {
      const script = ScriptGenerator.generatePythonScript(
        mockScenarios as any,
        "https://api.example.com"
      );

      expect(script).toContain("GET");
    });

    it("应该生成 Postman Collection", () => {
      const collection = ScriptGenerator.generatePostmanCollection(
        mockScenarios as any,
        "https://api.example.com"
      );

      expect(collection.info).toBeDefined();
      expect(collection.info.name).toContain("API Tests");
      expect(collection.item).toBeDefined();
      expect(collection.item.length).toBe(1);
    });

    it("生成的 Postman Collection 应该包含正确的请求信息", () => {
      const collection = ScriptGenerator.generatePostmanCollection(
        mockScenarios as any,
        "https://api.example.com"
      );

      const item = collection.item[0];
      expect(item.request.method).toBe("GET");
      expect(item.request.url.raw).toContain("https://api.example.com");
    });

    it("应该生成 cURL 命令", () => {
      const curl = ScriptGenerator.generateCurlCommand(
        mockScenarios[0] as any,
        "https://api.example.com"
      );

      expect(curl).toContain("curl");
      expect(curl).toContain("-X GET");
      expect(curl).toContain("https://api.example.com");
    });

    it("生成的 cURL 命令应该包含 Headers", () => {
      const curl = ScriptGenerator.generateCurlCommand(
        mockScenarios[0] as any,
        "https://api.example.com"
      );

      expect(curl).toContain("-H");
      expect(curl).toContain("Content-Type");
    });
  });

  // ==================== 集成测试 ====================

  describe("IntelligentScriptGenerator", () => {
    const mockOpenAPIDoc = {
      paths: {
        "/api/users/{id}": {
          get: {
            summary: "获取用户信息",
            description: "根据用户 ID 获取用户详细信息",
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "integer" }
              }
            ],
            responses: {
              "200": { description: "成功" },
              "404": { description: "用户不存在" }
            },
            security: [{ bearerAuth: [] }]
          }
        }
      }
    };

    it("应该从 OpenAPI 文档生成 Python 脚本", () => {
      const script = IntelligentScriptGenerator.generateFromOpenAPI(
        mockOpenAPIDoc,
        "https://api.example.com",
        "python"
      );

      expect(script).toContain("import requests");
      expect(script).toContain("class TestAPI");
    });

    it("应该从 OpenAPI 文档生成 Postman Collection", () => {
      const collection = IntelligentScriptGenerator.generateFromOpenAPI(
        mockOpenAPIDoc,
        "https://api.example.com",
        "postman"
      );

      const parsed = JSON.parse(collection);
      expect(parsed.info).toBeDefined();
      expect(parsed.item).toBeDefined();
    });

    it("应该从 OpenAPI 文档生成 cURL 命令", () => {
      const curl = IntelligentScriptGenerator.generateFromOpenAPI(
        mockOpenAPIDoc,
        "https://api.example.com",
        "curl"
      );

      expect(curl).toContain("curl");
      expect(curl).toContain("-X GET");
    });
  });

  // ==================== 端到端测试 ====================

  describe("端到端测试", () => {
    it("完整流程：OpenAPI -> 测试场景 -> Python 脚本", () => {
      const openAPIDoc = {
        paths: {
          "/api/login": {
            post: {
              summary: "用户登录",
              parameters: [
                {
                  name: "username",
                  in: "query",
                  required: true,
                  schema: { type: "string" }
                },
                {
                  name: "password",
                  in: "query",
                  required: true,
                  schema: { type: "string" }
                }
              ],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        username: { type: "string" },
                        password: { type: "string" }
                      }
                    }
                  }
                }
              },
              responses: {
                "200": { description: "登录成功" },
                "401": { description: "登录失败" }
              }
            }
          }
        }
      };

      const script = IntelligentScriptGenerator.generateFromOpenAPI(
        openAPIDoc,
        "https://api.example.com",
        "python"
      );

      // 验证生成的脚本包含所有必要的元素
      expect(script).toContain("import requests");
      expect(script).toContain("class TestAPI");
      expect(script).toContain("def test_");
      expect(script).toContain("assert response.status_code");
      expect(script).toContain("https://api.example.com");
    });

    it("完整流程：OpenAPI -> 测试场景 -> Postman Collection", () => {
      const openAPIDoc = {
        paths: {
          "/api/products": {
            get: {
              summary: "获取产品列表",
              parameters: [
                {
                  name: "category",
                  in: "query",
                  required: false,
                  schema: { type: "string" }
                }
              ],
              responses: {
                "200": { description: "成功" }
              }
            }
          }
        }
      };

      const collection = IntelligentScriptGenerator.generateFromOpenAPI(
        openAPIDoc,
        "https://api.example.com",
        "postman"
      );

      const parsed = JSON.parse(collection);
      expect(parsed.info.name).toContain("API Tests");
      expect(parsed.item.length).toBeGreaterThan(0);
      expect(parsed.item[0].request.method).toBe("GET");
    });
  });
});
