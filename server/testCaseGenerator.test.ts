import { describe, it, expect, vi } from "vitest";

/**
 * 测试用例生成器单元测试
 * 验证文档导入和测试用例生成的核心逻辑
 */

interface TestCase {
  id: string;
  title: string;
  description: string;
  precondition: string;
  steps: string[];
  expectedResult: string;
  category: "positive" | "negative" | "boundary" | "edge";
}

// 模拟 AI 生成测试用例的函数
function generateTestCasesFromDescription(description: string): TestCase[] {
  if (!description || description.trim().length === 0) {
    throw new Error("描述不能为空");
  }

  // 简化的生成逻辑（实际应由 LLM 完成）
  const cases: TestCase[] = [
    {
      id: "TC-001",
      title: "正常场景 - 成功创建",
      description: "验证在正常输入下能成功创建资源",
      precondition: "用户已登录，具有创建权限",
      steps: ["打开创建页面", "填写所有必填字段", "点击保存按钮"],
      expectedResult: "资源成功创建，显示成功提示",
      category: "positive"
    },
    {
      id: "TC-002",
      title: "异常场景 - 缺少必填字段",
      description: "验证缺少必填字段时的错误处理",
      precondition: "用户已登录",
      steps: ["打开创建页面", "不填写必填字段", "点击保存按钮"],
      expectedResult: "显示错误提示，不允许保存",
      category: "negative"
    }
  ];

  return cases;
}

// 验证文件类型的函数
function isValidFileType(fileName: string, fileType: string): boolean {
  const allowedExtensions = [".txt", ".md", ".pdf", ".doc", ".docx", ".xls", ".xlsx"];
  const allowedMimeTypes = [
    "text/plain",
    "text/markdown",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];

  const hasValidExtension = allowedExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  const hasValidMimeType = allowedMimeTypes.includes(fileType);

  return hasValidExtension || hasValidMimeType;
}

// 验证文件大小的函数
function isValidFileSize(fileSizeInBytes: number, maxSizeInMB: number = 10): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return fileSizeInBytes <= maxSizeInBytes;
}

// 从文本内容提取关键信息的函数
function extractKeywordsFromContent(content: string): string[] {
  const keywords = content
    .split(/[\s\n]+/)
    .filter(word => word.length > 3)
    .slice(0, 10);
  return keywords;
}

describe("TestCaseGenerator", () => {
  describe("generateTestCasesFromDescription", () => {
    it("应该从有效的描述生成测试用例", () => {
      const description = "用户登录功能，支持邮箱和手机号登录";
      const cases = generateTestCasesFromDescription(description);

      expect(cases).toHaveLength(2);
      expect(cases[0].category).toBe("positive");
      expect(cases[1].category).toBe("negative");
    });

    it("应该为每个用例分配唯一的 ID", () => {
      const description = "测试功能";
      const cases = generateTestCasesFromDescription(description);
      const ids = cases.map(c => c.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it("应该包含所有必需的字段", () => {
      const description = "测试功能";
      const cases = generateTestCasesFromDescription(description);

      cases.forEach(testCase => {
        expect(testCase).toHaveProperty("id");
        expect(testCase).toHaveProperty("title");
        expect(testCase).toHaveProperty("description");
        expect(testCase).toHaveProperty("precondition");
        expect(testCase).toHaveProperty("steps");
        expect(testCase).toHaveProperty("expectedResult");
        expect(testCase).toHaveProperty("category");
      });
    });

    it("应该包含不同类型的测试用例", () => {
      const description = "测试功能";
      const cases = generateTestCasesFromDescription(description);
      const categories = cases.map(c => c.category);

      expect(categories).toContain("positive");
      expect(categories).toContain("negative");
    });

    it("应该在描述为空时抛出错误", () => {
      expect(() => generateTestCasesFromDescription("")).toThrow("描述不能为空");
      expect(() => generateTestCasesFromDescription("   ")).toThrow("描述不能为空");
    });

    it("应该在描述为 null 时抛出错误", () => {
      expect(() => generateTestCasesFromDescription(null as any)).toThrow();
    });
  });

  describe("isValidFileType", () => {
    it("应该接受 TXT 文件", () => {
      expect(isValidFileType("requirements.txt", "text/plain")).toBe(true);
    });

    it("应该接受 Markdown 文件", () => {
      expect(isValidFileType("requirements.md", "text/markdown")).toBe(true);
    });

    it("应该接受 PDF 文件", () => {
      expect(isValidFileType("requirements.pdf", "application/pdf")).toBe(true);
    });

    it("应该接受 Word 文件", () => {
      expect(isValidFileType("requirements.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true);
    });

    it("应该接受 Excel 文件", () => {
      expect(isValidFileType("requirements.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe(true);
    });

    it("应该拒绝不支持的文件类型", () => {
      expect(isValidFileType("requirements.exe", "application/x-msdownload")).toBe(false);
      expect(isValidFileType("requirements.zip", "application/zip")).toBe(false);
    });

    it("应该基于文件扩展名进行验证", () => {
      expect(isValidFileType("requirements.md", "application/octet-stream")).toBe(true);
      expect(isValidFileType("requirements.txt", "application/octet-stream")).toBe(true);
    });
  });

  describe("isValidFileSize", () => {
    it("应该接受小于 10MB 的文件", () => {
      const fileSizeInBytes = 5 * 1024 * 1024; // 5MB
      expect(isValidFileSize(fileSizeInBytes)).toBe(true);
    });

    it("应该接受恰好 10MB 的文件", () => {
      const fileSizeInBytes = 10 * 1024 * 1024; // 10MB
      expect(isValidFileSize(fileSizeInBytes)).toBe(true);
    });

    it("应该拒绝超过 10MB 的文件", () => {
      const fileSizeInBytes = 11 * 1024 * 1024; // 11MB
      expect(isValidFileSize(fileSizeInBytes)).toBe(false);
    });

    it("应该支持自定义大小限制", () => {
      const fileSizeInBytes = 15 * 1024 * 1024; // 15MB
      expect(isValidFileSize(fileSizeInBytes, 20)).toBe(true);
      expect(isValidFileSize(fileSizeInBytes, 10)).toBe(false);
    });

    it("应该接受空文件", () => {
      expect(isValidFileSize(0)).toBe(true);
    });
  });

  describe("extractKeywordsFromContent", () => {
    it("应该从内容中提取关键词", () => {
      const content = "用户登录功能需要支持邮箱和手机号登录";
      const keywords = extractKeywordsFromContent(content);

      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(10);
    });

    it("应该过滤掉短词", () => {
      const content = "a b c 用户登录功能";
      const keywords = extractKeywordsFromContent(content);

      keywords.forEach(keyword => {
        expect(keyword.length).toBeGreaterThan(3);
      });
    });

    it("应该处理空内容", () => {
      const keywords = extractKeywordsFromContent("");
      expect(keywords).toEqual([]);
    });

    it("应该限制返回的关键词数量", () => {
      const content = "这是一个很长的需求文档 包含很多很多的关键词 需要进行提取 但是只返回前十个";
      const keywords = extractKeywordsFromContent(content);

      expect(keywords.length).toBeLessThanOrEqual(10);
    });
  });

  describe("TestCase 数据结构", () => {
    it("应该有有效的 category 值", () => {
      const validCategories = ["positive", "negative", "boundary", "edge"];
      const description = "测试功能";
      const cases = generateTestCasesFromDescription(description);

      cases.forEach(testCase => {
        expect(validCategories).toContain(testCase.category);
      });
    });

    it("应该有非空的步骤列表", () => {
      const description = "测试功能";
      const cases = generateTestCasesFromDescription(description);

      cases.forEach(testCase => {
        expect(Array.isArray(testCase.steps)).toBe(true);
        expect(testCase.steps.length).toBeGreaterThan(0);
        testCase.steps.forEach(step => {
          expect(typeof step).toBe("string");
          expect(step.length).toBeGreaterThan(0);
        });
      });
    });

    it("应该有非空的标题和描述", () => {
      const description = "测试功能";
      const cases = generateTestCasesFromDescription(description);

      cases.forEach(testCase => {
        expect(testCase.title.length).toBeGreaterThan(0);
        expect(testCase.description.length).toBeGreaterThan(0);
        expect(testCase.precondition.length).toBeGreaterThan(0);
        expect(testCase.expectedResult.length).toBeGreaterThan(0);
      });
    });
  });
});
