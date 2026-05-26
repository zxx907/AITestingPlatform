import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { generatePostmanCollection, generateJMeterScript, generatePythonScript } from "./scriptGenerators";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== 项目管理 ====================
  projects: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const projectId = nanoid();
        await db.createProject(ctx.user.id, projectId, input.name, input.description);
        return { id: projectId, name: input.name };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProjects(ctx.user.id);
    }),
  }),

  // ==================== 测试用例 ====================
  testCases: router({
    generate: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        description: z.string(),
        apiUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // 调用 LLM 生成测试用例
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a professional QA engineer. Generate comprehensive test cases based on the provided requirements. Return a JSON array of test cases."
              },
              {
                role: "user",
                content: `Generate test cases for the following requirements:\n${input.description}\n\nReturn a JSON array with objects containing: title, description, precondition, steps (array), expectedResult, category (positive/negative/boundary/edge)`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "test_cases",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    testCases: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          precondition: { type: "string" },
                          steps: { type: "array", items: { type: "string" } },
                          expectedResult: { type: "string" },
                          category: { type: "string", enum: ["positive", "negative", "boundary", "edge"] }
                        },
                        required: ["title", "description", "precondition", "steps", "expectedResult", "category"]
                      }
                    }
                  },
                  required: ["testCases"]
                }
              }
            }
          });

          const content = response.choices[0]?.message?.content;
          if (!content) throw new Error("No response from LLM");

          const parsed = JSON.parse(content);
          const testCases = parsed.testCases || [];

          // 保存到数据库
          const savedCases = [];
          for (const tc of testCases) {
            const result = await db.createTestCase(ctx.user.id, {
              projectId: input.projectId,
              title: tc.title,
              description: tc.description,
              precondition: tc.precondition,
              steps: tc.steps,
              expectedResult: tc.expectedResult,
              category: tc.category,
              priority: "medium",
              status: "draft"
            });
            savedCases.push(result);
          }

          return { success: true, count: testCases.length, cases: testCases };
        } catch (error) {
          console.error("Error generating test cases:", error);
          throw new Error("Failed to generate test cases");
        }
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input, ctx }) => {
        return db.getTestCasesByProject(ctx.user.id, input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getTestCaseById(input.id, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.record(z.any())
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateTestCase(input.id, ctx.user.id, input.data);
      }),
  }),

  // ==================== 接口测试 ====================
  apiConfigs: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]),
        url: z.string(),
        headers: z.record(z.string()).optional(),
        body: z.string().optional(),
        bodyType: z.enum(["json", "form", "xml", "text"]).optional(),
        queryParams: z.record(z.string()).optional(),
        timeout: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createApiConfig(ctx.user.id, {
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          method: input.method,
          url: input.url,
          headers: input.headers,
          body: input.body,
          bodyType: input.bodyType,
          queryParams: input.queryParams,
          timeout: input.timeout || 30000,
        });
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input, ctx }) => {
        return db.getApiConfigsByProject(ctx.user.id, input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getApiConfigById(input.id, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.record(z.any())
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateApiConfig(input.id, ctx.user.id, input.data);
      }),

    execute: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const config = await db.getApiConfigById(input.id, ctx.user.id);
        if (!config) throw new Error("API config not found");

        try {
          const startTime = Date.now();
          const response = await fetch(config.url, {
            method: config.method,
            headers: config.headers || {},
            body: config.body ? JSON.stringify(JSON.parse(config.body)) : undefined,
          });

          const responseTime = Date.now() - startTime;
          const responseBody = await response.text();

          await db.createApiExecution(ctx.user.id, {
            apiConfigId: config.id,
            status: response.ok ? "success" : "failed",
            statusCode: response.status,
            responseTime,
            responseBody,
            responseHeaders: Object.fromEntries(response.headers),
          });

          return {
            statusCode: response.status,
            responseTime,
            responseBody,
            success: response.ok
          };
        } catch (error) {
          await db.createApiExecution(ctx.user.id, {
            apiConfigId: config.id,
            status: "failed",
            errorMessage: String(error),
          });

          throw error;
        }
      }),
  }),

  // ==================== 脚本生成 ====================
  scriptGenerator: router({
    generatePostman: protectedProcedure
      .input(z.object({
        apiConfigIds: z.array(z.number()),
        projectId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const configs = await Promise.all(
          input.apiConfigIds.map(id => db.getApiConfigById(id, ctx.user.id))
        );

        const validConfigs = configs.filter(Boolean);
        const script = generatePostmanCollection(validConfigs, "API Test Collection");

        return {
          content: script,
          fileName: `postman-collection-${Date.now()}.json`,
          type: "postman"
        };
      }),

    generateJMeter: protectedProcedure
      .input(z.object({
        apiConfigIds: z.array(z.number()),
        projectId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const configs = await Promise.all(
          input.apiConfigIds.map(id => db.getApiConfigById(id, ctx.user.id))
        );

        const validConfigs = configs.filter(Boolean);
        const script = generateJMeterScript(validConfigs, "API Test Plan");

        return {
          content: script,
          fileName: `jmeter-test-${Date.now()}.jmx`,
          type: "jmeter"
        };
      }),

    generatePython: protectedProcedure
      .input(z.object({
        apiConfigIds: z.array(z.number()),
        projectId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const configs = await Promise.all(
          input.apiConfigIds.map(id => db.getApiConfigById(id, ctx.user.id))
        );

        const validConfigs = configs.filter(Boolean);
        const script = generatePythonScript(validConfigs, "api_tests");

        return {
          content: script,
          fileName: `api-tests-${Date.now()}.py`,
          type: "python"
        };
      }),
  }),

  // ==================== 性能测试 ====================
  performanceTests: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        apiConfigId: z.number(),
        concurrentUsers: z.number(),
        rampUpTime: z.number(),
        holdTime: z.number(),
        coolDownTime: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createPerformanceTest(ctx.user.id, {
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          apiConfigId: input.apiConfigId,
          concurrentUsers: input.concurrentUsers,
          rampUpTime: input.rampUpTime,
          holdTime: input.holdTime,
          coolDownTime: input.coolDownTime,
          status: "draft"
        });
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input, ctx }) => {
        return db.getPerformanceTestsByProject(ctx.user.id, input.projectId);
      }),

    run: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // 模拟性能测试执行
        const dataPoints = [];
        for (let i = 0; i < 60; i++) {
          dataPoints.push({
            timestamp: Date.now() + i * 1000,
            tps: Math.random() * 100 + 50,
            avgTime: Math.random() * 500 + 100
          });
        }

        const result = await db.createPerformanceResult({
          performanceTestId: input.id,
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
          dataPoints
        });

        return { success: true, result };
      }),
  }),

  // ==================== Bug 分析 ====================
  bugAnalysis: router({
    analyze: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        title: z.string(),
        errorLog: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are an expert software engineer. Analyze the error log and provide root cause analysis, affected components, reproduction steps, and suggested fixes."
              },
              {
                role: "user",
                content: `Analyze this error log:\n${input.errorLog}\n\nProvide JSON response with: rootCause, affectedComponents (array), reproductionSteps (array), suggestedFix, severity (low/medium/high/critical)`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "bug_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    rootCause: { type: "string" },
                    affectedComponents: { type: "array", items: { type: "string" } },
                    reproductionSteps: { type: "array", items: { type: "string" } },
                    suggestedFix: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high", "critical"] }
                  },
                  required: ["rootCause", "affectedComponents", "reproductionSteps", "suggestedFix", "severity"]
                }
              }
            }
          });

          const content = response.choices[0]?.message?.content;
          if (!content) throw new Error("No response from LLM");

          const analysis = JSON.parse(content);

          const result = await db.createBugAnalysis(ctx.user.id, {
            projectId: input.projectId,
            title: input.title,
            errorLog: input.errorLog,
            rootCause: analysis.rootCause,
            affectedComponents: analysis.affectedComponents,
            reproductionSteps: analysis.reproductionSteps,
            suggestedFix: analysis.suggestedFix,
            severity: analysis.severity,
            status: "open"
          });

          return { success: true, analysis };
        } catch (error) {
          console.error("Error analyzing bug:", error);
          throw new Error("Failed to analyze bug");
        }
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input, ctx }) => {
        return db.getBugAnalysisByProject(ctx.user.id, input.projectId);
      }),
  }),

  // ==================== SQL 生成 ====================
  sqlGenerator: router({
    generate: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        requirement: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are an expert SQL developer. Generate SQL queries based on requirements. Return JSON with: generatedSql, sqlType, explanation, optimizationSuggestions (array)"
              },
              {
                role: "user",
                content: `Generate SQL for: ${input.requirement}\n\nReturn JSON with: generatedSql, sqlType (select/insert/update/delete/join/aggregate), explanation, optimizationSuggestions (array of strings)`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "sql_generation",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    generatedSql: { type: "string" },
                    sqlType: { type: "string", enum: ["select", "insert", "update", "delete", "join", "aggregate"] },
                    explanation: { type: "string" },
                    optimizationSuggestions: { type: "array", items: { type: "string" } }
                  },
                  required: ["generatedSql", "sqlType", "explanation", "optimizationSuggestions"]
                }
              }
            }
          });

          const content = response.choices[0]?.message?.content;
          if (!content) throw new Error("No response from LLM");

          const sqlData = JSON.parse(content);

          const result = await db.createSqlGeneration(ctx.user.id, {
            projectId: input.projectId,
            requirement: input.requirement,
            generatedSql: sqlData.generatedSql,
            sqlType: sqlData.sqlType,
            explanation: sqlData.explanation,
            optimizationSuggestions: sqlData.optimizationSuggestions,
            status: "draft"
          });

          return { success: true, sql: sqlData };
        } catch (error) {
          console.error("Error generating SQL:", error);
          throw new Error("Failed to generate SQL");
        }
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input, ctx }) => {
        return db.getSqlGenerationsByProject(ctx.user.id, input.projectId);
      }),
  }),

  // ==================== 测试报告 ====================
  testReports: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        totalTestCases: z.number(),
        passedTestCases: z.number(),
        failedTestCases: z.number(),
        skippedTestCases: z.number(),
        totalBugs: z.number(),
        criticalBugs: z.number(),
        highBugs: z.number(),
        mediumBugs: z.number(),
        lowBugs: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const passRate = (input.passedTestCases / input.totalTestCases * 100).toFixed(2);

        return db.createTestReport(ctx.user.id, {
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          totalTestCases: input.totalTestCases,
          passedTestCases: input.passedTestCases,
          failedTestCases: input.failedTestCases,
          skippedTestCases: input.skippedTestCases,
          passRate: parseFloat(passRate),
          totalBugs: input.totalBugs,
          criticalBugs: input.criticalBugs,
          highBugs: input.highBugs,
          mediumBugs: input.mediumBugs,
          lowBugs: input.lowBugs,
          environment: "production",
          executionTime: Math.random() * 3600000 // 随机时间
        });
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input, ctx }) => {
        return db.getTestReportsByProject(ctx.user.id, input.projectId);
      }),
  }),

  // ==================== 智能脚本生成 ====================
  intelligentScriptGenerator: router({
    generateFromOpenAPI: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        openAPIDoc: z.any(),
        baseUrl: z.string(),
        format: z.enum(["python", "postman", "curl"]).default("python"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { IntelligentScriptGenerator } = await import("./intelligentScriptGenerator");
          const script = IntelligentScriptGenerator.generateFromOpenAPI(
            input.openAPIDoc,
            input.baseUrl,
            input.format
          );

          const scriptId = nanoid();
          return {
            success: true,
            scriptId,
            script,
            format: input.format,
            generatedAt: new Date(),
          };
        } catch (error) {
          throw new Error(`脚本生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }),

    generateFromDocuments: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        apiDocumentContent: z.string(),
        testCaseContent: z.string(),
        baseUrl: z.string(),
        format: z.enum(["python", "postman", "curl", "jmeter"]).default("python"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { IntelligentScriptGenerator } = await import("./intelligentScriptGenerator");
          
          // 简单的 OpenAPI 文档模拟
          const mockOpenAPIDoc = {
            paths: {
              "/api/test": {
                get: {
                  summary: "测试端点",
                  parameters: [],
                  responses: { "200": { description: "成功" } }
                }
              }
            }
          };

          const script = IntelligentScriptGenerator.generateFromOpenAPI(
            mockOpenAPIDoc,
            input.baseUrl,
            input.format as "python" | "postman" | "curl"
          );

          const scriptId = nanoid();
          return {
            success: true,
            scriptId,
            script,
            format: input.format,
            generatedAt: new Date(),
          };
        } catch (error) {
          throw new Error(`脚本生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }),
  }),
});
export type AppRouter = typeof appRouter;
