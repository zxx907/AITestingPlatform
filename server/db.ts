import { eq, and, desc, asc, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  testCases,
  apiConfigs,
  apiExecutions,
  performanceTests,
  performanceResults,
  bugAnalysis,
  sqlGenerations,
  testReports,
  scriptExports,
  projects,
  type TestCase,
  type ApiConfig,
  type ApiExecution,
  type PerformanceTest,
  type PerformanceResult,
  type BugAnalysis,
  type SqlGeneration,
  type TestReport,
  type ScriptExport,
  type Project
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== 项目相关 ====================

export async function createProject(userId: number, projectId: string, name: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(projects).values({
    id: projectId,
    userId,
    name,
    description,
    status: "active"
  });
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(projects).where(
    and(eq(projects.userId, userId), eq(projects.status, "active"))
  ).orderBy(desc(projects.createdAt));
}

// ==================== 测试用例相关 ====================

export async function createTestCase(userId: number, data: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(testCases).values({
    ...data,
    userId
  });
}

export async function getTestCasesByProject(userId: number, projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(testCases).where(
    and(eq(testCases.userId, userId), eq(testCases.projectId, projectId))
  ).orderBy(desc(testCases.createdAt));
}

export async function getTestCaseById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(testCases).where(
    and(eq(testCases.id, id), eq(testCases.userId, userId))
  ).limit(1);
  
  return result[0];
}

export async function updateTestCase(id: number, userId: number, data: Partial<TestCase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(testCases).set(data).where(
    and(eq(testCases.id, id), eq(testCases.userId, userId))
  );
}

// ==================== 接口配置相关 ====================

export async function createApiConfig(userId: number, data: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(apiConfigs).values({
    ...data,
    userId
  });
}

export async function getApiConfigsByProject(userId: number, projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(apiConfigs).where(
    and(eq(apiConfigs.userId, userId), eq(apiConfigs.projectId, projectId))
  ).orderBy(desc(apiConfigs.createdAt));
}

export async function getApiConfigById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(apiConfigs).where(
    and(eq(apiConfigs.id, id), eq(apiConfigs.userId, userId))
  ).limit(1);
  
  return result[0];
}

export async function updateApiConfig(id: number, userId: number, data: Partial<ApiConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(apiConfigs).set(data).where(
    and(eq(apiConfigs.id, id), eq(apiConfigs.userId, userId))
  );
}

// ==================== 接口执行相关 ====================

export async function createApiExecution(userId: number, data: Omit<ApiExecution, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(apiExecutions).values({
    ...data,
    userId
  });
}

export async function getApiExecutionsByConfig(apiConfigId: number, userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(apiExecutions).where(
    and(eq(apiExecutions.apiConfigId, apiConfigId), eq(apiExecutions.userId, userId))
  ).orderBy(desc(apiExecutions.createdAt)).limit(limit);
}

// ==================== 性能测试相关 ====================

export async function createPerformanceTest(userId: number, data: Omit<PerformanceTest, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(performanceTests).values({
    ...data,
    userId
  });
}

export async function getPerformanceTestsByProject(userId: number, projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(performanceTests).where(
    and(eq(performanceTests.userId, userId), eq(performanceTests.projectId, projectId))
  ).orderBy(desc(performanceTests.createdAt));
}

export async function createPerformanceResult(data: Omit<PerformanceResult, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(performanceResults).values(data);
}

export async function getPerformanceResultByTest(performanceTestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(performanceResults).where(
    eq(performanceResults.performanceTestId, performanceTestId)
  ).limit(1);
  
  return result[0];
}

// ==================== Bug 分析相关 ====================

export async function createBugAnalysis(userId: number, data: Omit<BugAnalysis, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(bugAnalysis).values({
    ...data,
    userId
  });
}

export async function getBugAnalysisByProject(userId: number, projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(bugAnalysis).where(
    and(eq(bugAnalysis.userId, userId), eq(bugAnalysis.projectId, projectId))
  ).orderBy(desc(bugAnalysis.createdAt));
}

// ==================== SQL 生成相关 ====================

export async function createSqlGeneration(userId: number, data: Omit<SqlGeneration, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(sqlGenerations).values({
    ...data,
    userId
  });
}

export async function getSqlGenerationsByProject(userId: number, projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(sqlGenerations).where(
    and(eq(sqlGenerations.userId, userId), eq(sqlGenerations.projectId, projectId))
  ).orderBy(desc(sqlGenerations.createdAt));
}

// ==================== 测试报告相关 ====================

export async function createTestReport(userId: number, data: Omit<TestReport, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(testReports).values({
    ...data,
    userId
  });
}

export async function getTestReportsByProject(userId: number, projectId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(testReports).where(
    and(eq(testReports.userId, userId), eq(testReports.projectId, projectId))
  ).orderBy(desc(testReports.createdAt));
}

// ==================== 脚本导出相关 ====================

export async function createScriptExport(userId: number, data: Omit<ScriptExport, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(scriptExports).values({
    ...data,
    userId
  });
}

export async function getScriptExportsByApi(apiConfigId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(scriptExports).where(
    and(eq(scriptExports.apiConfigId, apiConfigId), eq(scriptExports.userId, userId))
  ).orderBy(desc(scriptExports.createdAt));
}
