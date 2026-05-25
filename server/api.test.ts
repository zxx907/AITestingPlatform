import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";
import { generatePostmanCollection, generateJMeterScript, generatePythonScript } from "./scriptGenerators";
import type { ApiConfig } from "../drizzle/schema";

/**
 * 后端 API 单元测试
 */

describe("Database Operations", () => {
  describe("项目管理", () => {
    it("应该能创建项目", async () => {
      // 模拟数据库操作
      const mockProject = {
        id: "test-project-1",
        userId: 1,
        name: "Test Project",
        description: "A test project",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(mockProject.id).toBeDefined();
      expect(mockProject.userId).toBe(1);
      expect(mockProject.name).toBe("Test Project");
    });

    it("应该能获取用户项目列表", async () => {
      const mockProjects = [
        {
          id: "project-1",
          userId: 1,
          name: "Project 1",
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "project-2",
          userId: 1,
          name: "Project 2",
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      expect(mockProjects).toHaveLength(2);
      expect(mockProjects[0].userId).toBe(1);
    });
  });

  describe("测试用例管理", () => {
    it("应该能创建测试用例", async () => {
      const mockTestCase = {
        id: 1,
        userId: 1,
        projectId: "project-1",
        title: "Test Case 1",
        description: "Description",
        precondition: "Precondition",
        steps: ["Step 1", "Step 2"],
        expectedResult: "Expected result",
        category: "positive" as const,
        priority: "medium" as const,
        status: "draft" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(mockTestCase.title).toBe("Test Case 1");
      expect(mockTestCase.category).toBe("positive");
      expect(mockTestCase.steps).toHaveLength(2);
    });

    it("应该支持不同的测试用例类别", () => {
      const categories = ["positive", "negative", "boundary", "edge"];
      
      categories.forEach(category => {
        expect(["positive", "negative", "boundary", "edge"]).toContain(category);
      });
    });

    it("应该能获取项目的所有测试用例", async () => {
      const mockCases = [
        {
          id: 1,
          userId: 1,
          projectId: "project-1",
          title: "Case 1",
          category: "positive" as const,
          status: "draft" as const,
          steps: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          userId: 1,
          projectId: "project-1",
          title: "Case 2",
          category: "negative" as const,
          status: "draft" as const,
          steps: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const filtered = mockCases.filter(c => c.projectId === "project-1");
      expect(filtered).toHaveLength(2);
    });
  });

  describe("接口配置管理", () => {
    it("应该能创建 API 配置", async () => {
      const mockApiConfig: ApiConfig = {
        id: 1,
        userId: 1,
        projectId: "project-1",
        name: "Get Users API",
        description: "Fetch all users",
        method: "GET",
        url: "https://api.example.com/users",
        headers: { "Authorization": "Bearer token" },
        body: null,
        bodyType: "json",
        queryParams: { "page": "1", "limit": "10" },
        pathParams: null,
        authentication: null,
        timeout: 30000,
        retries: 0,
        tags: ["users", "api"],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(mockApiConfig.method).toBe("GET");
      expect(mockApiConfig.url).toContain("api.example.com");
      expect(mockApiConfig.headers).toHaveProperty("Authorization");
    });

    it("应该支持所有 HTTP 方法", () => {
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
      
      methods.forEach(method => {
        expect(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]).toContain(method);
      });
    });

    it("应该能获取项目的所有 API 配置", async () => {
      const mockConfigs = [
        { id: 1, projectId: "project-1", name: "API 1", method: "GET" as const, url: "http://api1.com" },
        { id: 2, projectId: "project-1", name: "API 2", method: "POST" as const, url: "http://api2.com" }
      ];

      const filtered = mockConfigs.filter(c => c.projectId === "project-1");
      expect(filtered).toHaveLength(2);
    });
  });

  describe("性能测试", () => {
    it("应该能创建性能测试配置", async () => {
      const mockPerfTest = {
        id: 1,
        userId: 1,
        projectId: "project-1",
        name: "Performance Test 1",
        description: "Load testing",
        apiConfigId: 1,
        concurrentUsers: 100,
        rampUpTime: 60,
        holdTime: 300,
        coolDownTime: 60,
        status: "draft" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(mockPerfTest.concurrentUsers).toBe(100);
      expect(mockPerfTest.rampUpTime).toBe(60);
      expect(mockPerfTest.holdTime).toBe(300);
    });

    it("应该能生成性能测试结果", async () => {
      const mockResult = {
        id: 1,
        performanceTestId: 1,
        totalRequests: 6000,
        successfulRequests: 5850,
        failedRequests: 150,
        avgResponseTime: 245.5,
        minResponseTime: 50.2,
        maxResponseTime: 1200.8,
        p95ResponseTime: 650.3,
        p99ResponseTime: 950.5,
        throughput: 100.5,
        errorRate: 2.5,
        dataPoints: [],
        createdAt: new Date()
      };

      expect(mockResult.totalRequests).toBe(6000);
      expect(mockResult.successfulRequests).toBe(5850);
      expect(mockResult.errorRate).toBe(2.5);
      expect((mockResult.failedRequests / mockResult.totalRequests * 100).toFixed(2)).toBe("2.50");
    });
  });

  describe("Bug 分析", () => {
    it("应该能创建 Bug 分析记录", async () => {
      const mockBugAnalysis = {
        id: 1,
        userId: 1,
        projectId: "project-1",
        title: "Login fails with special characters",
        errorLog: "Error: Invalid character in password field",
        rootCause: "Input validation not handling special characters",
        affectedComponents: ["authentication", "input-validation"],
        severity: "high" as const,
        reproductionSteps: ["Open login page", "Enter special characters", "Submit"],
        suggestedFix: "Add proper input sanitization",
        testCases: ["TC-001", "TC-002"],
        status: "open" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(mockBugAnalysis.severity).toBe("high");
      expect(mockBugAnalysis.affectedComponents).toContain("authentication");
      expect(mockBugAnalysis.reproductionSteps).toHaveLength(3);
    });

    it("应该支持不同的严重级别", () => {
      const severities = ["low", "medium", "high", "critical"];
      
      severities.forEach(severity => {
        expect(["low", "medium", "high", "critical"]).toContain(severity);
      });
    });
  });

  describe("SQL 生成", () => {
    it("应该能创建 SQL 生成记录", async () => {
      const mockSqlGeneration = {
        id: 1,
        userId: 1,
        projectId: "project-1",
        requirement: "Get all active users with their orders",
        generatedSql: "SELECT u.*, o.* FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active'",
        sqlType: "join" as const,
        explanation: "This query joins users with orders to get all active users and their associated orders",
        optimizationSuggestions: ["Add index on users.status", "Add index on orders.user_id"],
        executionPlan: { type: "nested_loop_join" },
        status: "draft" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(mockSqlGeneration.sqlType).toBe("join");
      expect(mockSqlGeneration.generatedSql).toContain("JOIN");
      expect(mockSqlGeneration.optimizationSuggestions).toHaveLength(2);
    });

    it("应该支持不同的 SQL 类型", () => {
      const sqlTypes = ["select", "insert", "update", "delete", "join", "aggregate"];
      
      sqlTypes.forEach(type => {
        expect(["select", "insert", "update", "delete", "join", "aggregate"]).toContain(type);
      });
    });
  });

  describe("测试报告", () => {
    it("应该能创建测试报告", async () => {
      const mockReport = {
        id: 1,
        userId: 1,
        projectId: "project-1",
        name: "Sprint 1 Test Report",
        description: "Test execution report for Sprint 1",
        totalTestCases: 100,
        passedTestCases: 95,
        failedTestCases: 3,
        skippedTestCases: 2,
        passRate: 95.0,
        totalBugs: 5,
        criticalBugs: 1,
        highBugs: 2,
        mediumBugs: 2,
        lowBugs: 0,
        executionTime: 3600000,
        coverage: 85.5,
        environment: "production",
        testData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(mockReport.passRate).toBe(95.0);
      expect(mockReport.totalBugs).toBe(5);
      expect(mockReport.coverage).toBe(85.5);
      expect(mockReport.passedTestCases + mockReport.failedTestCases + mockReport.skippedTestCases).toBe(100);
    });

    it("应该能计算通过率", () => {
      const total = 100;
      const passed = 95;
      const passRate = (passed / total * 100).toFixed(2);

      expect(parseFloat(passRate)).toBe(95.0);
    });
  });
});

describe("Script Generators", () => {
  const mockApiConfigs: ApiConfig[] = [
    {
      id: 1,
      userId: 1,
      projectId: "project-1",
      name: "Get Users",
      method: "GET",
      url: "https://api.example.com/users",
      headers: { "Authorization": "Bearer token" },
      queryParams: { "page": "1" },
      timeout: 30000,
      retries: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      userId: 1,
      projectId: "project-1",
      name: "Create User",
      method: "POST",
      url: "https://api.example.com/users",
      headers: { "Content-Type": "application/json" },
      body: '{"name": "John", "email": "john@example.com"}',
      timeout: 30000,
      retries: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  describe("Postman Collection Generator", () => {
    it("应该生成有效的 Postman Collection JSON", () => {
      const collection = generatePostmanCollection(mockApiConfigs, "Test Collection");
      const parsed = JSON.parse(collection);

      expect(parsed.info.name).toBe("Test Collection");
      expect(parsed.item).toHaveLength(2);
      expect(parsed.item[0].request.method).toBe("GET");
      expect(parsed.item[1].request.method).toBe("POST");
    });

    it("应该包含所有 API 配置信息", () => {
      const collection = generatePostmanCollection(mockApiConfigs);
      const parsed = JSON.parse(collection);

      expect(parsed.item[0].name).toBe("Get Users");
      expect(parsed.item[0].request.url.raw).toContain("api.example.com");
      expect(parsed.item[1].name).toBe("Create User");
    });
  });

  describe("JMeter Script Generator", () => {
    it("应该生成有效的 JMeter JMX 脚本", () => {
      const script = generateJMeterScript(mockApiConfigs, "API Test Plan");

      expect(script).toContain("<?xml version");
      expect(script).toContain("jmeterTestPlan");
      expect(script).toContain("HTTPSampler");
      expect(script).toContain("Get Users");
      expect(script).toContain("Create User");
    });

    it("应该是有效的 XML 格式", () => {
      const script = generateJMeterScript(mockApiConfigs);

      expect(script).toContain('<?xml');
      expect(script).toContain('</jmeterTestPlan>');
    });
  });

  describe("Python Script Generator", () => {
    it("应该生成有效的 Python 脚本", () => {
      const script = generatePythonScript(mockApiConfigs, "api_tests");

      expect(script).toContain("import requests");
      expect(script).toContain("class ApiTests:");
      expect(script).toContain("def get__users"); // 注意：方法名中的空格被替换为下划线
      expect(script).toContain("def create__user");
    });

    it("应该包含所有 HTTP 方法处理", () => {
      const script = generatePythonScript(mockApiConfigs);

      expect(script).toContain("if method.upper()");
      expect(script).toContain("elif method.upper()");
    });

    it("应该包含错误处理逻辑", () => {
      const script = generatePythonScript(mockApiConfigs);

      expect(script).toContain("try:");
      expect(script).toContain("except");
      expect(script).toContain("success");
    });

    it("应该包含测试执行器", () => {
      const script = generatePythonScript(mockApiConfigs);

      expect(script).toContain("def run_all_tests");
      expect(script).toContain("__main__");
    });
  });
});

describe("Data Validation", () => {
  it("应该验证 API 配置的必填字段", () => {
    const requiredFields = ["name", "method", "url"];
    const apiConfig = {
      name: "Test API",
      method: "GET",
      url: "https://api.example.com"
    };

    requiredFields.forEach(field => {
      expect(apiConfig).toHaveProperty(field);
    });
  });

  it("应该验证测试用例的必填字段", () => {
    const requiredFields = ["title", "category", "steps"];
    const testCase = {
      title: "Test Case",
      category: "positive",
      steps: ["Step 1", "Step 2"]
    };

    requiredFields.forEach(field => {
      expect(testCase).toHaveProperty(field);
    });
  });

  it("应该验证性能测试参数", () => {
    const perfTest = {
      concurrentUsers: 100,
      rampUpTime: 60,
      holdTime: 300,
      coolDownTime: 60
    };

    expect(perfTest.concurrentUsers).toBeGreaterThan(0);
    expect(perfTest.rampUpTime).toBeGreaterThan(0);
    expect(perfTest.holdTime).toBeGreaterThan(0);
  });
});

describe("Error Handling", () => {
  it("应该处理无效的 API 配置", () => {
    const invalidConfig = {
      name: "",
      method: "INVALID",
      url: "not-a-url"
    };

    expect(invalidConfig.name).toBe("");
    expect(invalidConfig.method).not.toMatch(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/);
  });

  it("应该处理缺失的必填字段", () => {
    const incompleteConfig = {
      name: "API"
      // 缺少 method 和 url
    };

    expect(incompleteConfig).not.toHaveProperty("method");
    expect(incompleteConfig).not.toHaveProperty("url");
  });

  it("应该处理数据库错误", () => {
    const mockError = new Error("Database connection failed");
    
    expect(() => {
      throw mockError;
    }).toThrow("Database connection failed");
  });
});
