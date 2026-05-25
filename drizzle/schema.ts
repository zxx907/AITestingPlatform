import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  json,
  longtext,
  index,
  foreignKey
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 测试用例表 - 存储 AI 生成的测试用例
 */
export const testCases = mysqlTable("test_cases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  precondition: text("precondition"),
  steps: json("steps").$type<string[]>().notNull(),
  expectedResult: text("expected_result"),
  category: mysqlEnum("category", ["positive", "negative", "boundary", "edge"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium"),
  tags: json("tags").$type<string[]>(),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft"),
  sourceDocument: varchar("source_document", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_user_id").on(table.userId),
  projectIdIdx: index("idx_project_id").on(table.projectId),
}));

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = typeof testCases.$inferInsert;

/**
 * 接口配置表 - 存储 API 测试配置
 */
export const apiConfigs = mysqlTable("api_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  method: mysqlEnum("method", ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  headers: json("headers").$type<Record<string, string>>(),
  body: longtext("body"),
  bodyType: mysqlEnum("body_type", ["json", "form", "xml", "text"]).default("json"),
  queryParams: json("query_params").$type<Record<string, string>>(),
  pathParams: json("path_params").$type<Record<string, string>>(),
  authentication: json("authentication").$type<{type: string; value: string}>(),
  timeout: int("timeout").default(30000),
  retries: int("retries").default(0),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_api_user_id").on(table.userId),
  projectIdIdx: index("idx_api_project_id").on(table.projectId),
}));

export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = typeof apiConfigs.$inferInsert;

/**
 * 接口执行记录表 - 存储 API 测试执行结果
 */
export const apiExecutions = mysqlTable("api_executions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  apiConfigId: int("api_config_id").notNull(),
  status: mysqlEnum("status", ["success", "failed", "timeout"]).notNull(),
  statusCode: int("status_code"),
  responseTime: int("response_time"),
  requestBody: longtext("request_body"),
  responseBody: longtext("response_body"),
  responseHeaders: json("response_headers").$type<Record<string, string>>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_exec_user_id").on(table.userId),
  apiConfigIdIdx: index("idx_api_config_id").on(table.apiConfigId),
}));

export type ApiExecution = typeof apiExecutions.$inferSelect;
export type InsertApiExecution = typeof apiExecutions.$inferInsert;

/**
 * 性能测试配置表
 */
export const performanceTests = mysqlTable("performance_tests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  apiConfigId: int("api_config_id").notNull(),
  concurrentUsers: int("concurrent_users").notNull(),
  rampUpTime: int("ramp_up_time").notNull(), // 秒
  holdTime: int("hold_time").notNull(), // 秒
  coolDownTime: int("cool_down_time").notNull(), // 秒
  status: mysqlEnum("status", ["draft", "running", "completed", "failed"]).default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_perf_user_id").on(table.userId),
  projectIdIdx: index("idx_perf_project_id").on(table.projectId),
}));

export type PerformanceTest = typeof performanceTests.$inferSelect;
export type InsertPerformanceTest = typeof performanceTests.$inferInsert;

/**
 * 性能测试结果表
 */
export const performanceResults = mysqlTable("performance_results", {
  id: int("id").autoincrement().primaryKey(),
  performanceTestId: int("performance_test_id").notNull(),
  totalRequests: int("total_requests").notNull(),
  successfulRequests: int("successful_requests").notNull(),
  failedRequests: int("failed_requests").notNull(),
  avgResponseTime: decimal("avg_response_time", { precision: 10, scale: 2 }),
  minResponseTime: decimal("min_response_time", { precision: 10, scale: 2 }),
  maxResponseTime: decimal("max_response_time", { precision: 10, scale: 2 }),
  p95ResponseTime: decimal("p95_response_time", { precision: 10, scale: 2 }),
  p99ResponseTime: decimal("p99_response_time", { precision: 10, scale: 2 }),
  throughput: decimal("throughput", { precision: 10, scale: 2 }), // 请求/秒
  errorRate: decimal("error_rate", { precision: 5, scale: 2 }), // 百分比
  dataPoints: json("data_points").$type<Array<{timestamp: number; tps: number; avgTime: number}>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  perfTestIdIdx: index("idx_perf_test_id").on(table.performanceTestId),
}));

export type PerformanceResult = typeof performanceResults.$inferSelect;
export type InsertPerformanceResult = typeof performanceResults.$inferInsert;

/**
 * Bug 分析表
 */
export const bugAnalysis = mysqlTable("bug_analysis", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  errorLog: longtext("error_log").notNull(),
  rootCause: text("root_cause"),
  affectedComponents: json("affected_components").$type<string[]>(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  reproductionSteps: json("reproduction_steps").$type<string[]>(),
  suggestedFix: text("suggested_fix"),
  testCases: json("test_cases").$type<string[]>(),
  status: mysqlEnum("status", ["open", "assigned", "fixed", "closed"]).default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_bug_user_id").on(table.userId),
  projectIdIdx: index("idx_bug_project_id").on(table.projectId),
}));

export type BugAnalysis = typeof bugAnalysis.$inferSelect;
export type InsertBugAnalysis = typeof bugAnalysis.$inferInsert;

/**
 * SQL 生成记录表
 */
export const sqlGenerations = mysqlTable("sql_generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  requirement: text("requirement").notNull(),
  generatedSql: longtext("generated_sql").notNull(),
  sqlType: mysqlEnum("sql_type", ["select", "insert", "update", "delete", "join", "aggregate"]).notNull(),
  explanation: text("explanation"),
  optimizationSuggestions: json("optimization_suggestions").$type<string[]>(),
  executionPlan: json("execution_plan").$type<Record<string, any>>(),
  status: mysqlEnum("status", ["draft", "validated", "executed"]).default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_sql_user_id").on(table.userId),
  projectIdIdx: index("idx_sql_project_id").on(table.projectId),
}));

export type SqlGeneration = typeof sqlGenerations.$inferSelect;
export type InsertSqlGeneration = typeof sqlGenerations.$inferInsert;

/**
 * 测试报告表
 */
export const testReports = mysqlTable("test_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: varchar("project_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  totalTestCases: int("total_test_cases").notNull(),
  passedTestCases: int("passed_test_cases").notNull(),
  failedTestCases: int("failed_test_cases").notNull(),
  skippedTestCases: int("skipped_test_cases").notNull(),
  passRate: decimal("pass_rate", { precision: 5, scale: 2 }),
  totalBugs: int("total_bugs").notNull(),
  criticalBugs: int("critical_bugs").notNull(),
  highBugs: int("high_bugs").notNull(),
  mediumBugs: int("medium_bugs").notNull(),
  lowBugs: int("low_bugs").notNull(),
  executionTime: int("execution_time"), // 毫秒
  coverage: decimal("coverage", { precision: 5, scale: 2 }), // 代码覆盖率百分比
  environment: varchar("environment", { length: 64 }),
  testData: json("test_data").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_report_user_id").on(table.userId),
  projectIdIdx: index("idx_report_project_id").on(table.projectId),
}));

export type TestReport = typeof testReports.$inferSelect;
export type InsertTestReport = typeof testReports.$inferInsert;

/**
 * 脚本导出记录表
 */
export const scriptExports = mysqlTable("script_exports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  apiConfigId: int("api_config_id").notNull(),
  scriptType: mysqlEnum("script_type", ["postman", "jmeter", "python"]).notNull(),
  scriptContent: longtext("script_content").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: int("file_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_script_user_id").on(table.userId),
  apiConfigIdIdx: index("idx_script_api_id").on(table.apiConfigId),
}));

export type ScriptExport = typeof scriptExports.$inferSelect;
export type InsertScriptExport = typeof scriptExports.$inferInsert;

/**
 * 项目表 - 用于组织测试资源
 */
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "archived"]).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_project_user_id").on(table.userId),
}));

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
