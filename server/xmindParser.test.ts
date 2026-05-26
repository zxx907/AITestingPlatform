import { describe, it, expect } from "vitest";
import { parseXMind, parseXMindJSON, parseXMindText } from "./xmindParser";

describe("XMind Parser", () => {
  describe("parseXMindJSON", () => {
    it("should parse XMind JSON format correctly", () => {
      const xmindData = {
        rootTopic: {
          title: "测试套件",
          children: [
            {
              title: "登录功能测试",
              notes: "测试用户登录功能",
              children: [
                { title: "输入正确的用户名和密码" },
                { title: "点击登录按钮" },
                { title: "预期: 成功登录" }
              ]
            },
            {
              title: "异常场景测试",
              children: [
                { title: "异常: 输入错误的密码" },
                { title: "点击登录按钮" },
                { title: "预期: 显示错误提示" }
              ]
            }
          ]
        }
      };

      const result = parseXMindJSON(JSON.stringify(xmindData));

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("登录功能测试");
      expect(result[0].description).toBe("测试用户登录功能");
      expect(result[0].steps).toContain("输入正确的用户名和密码");
      expect(result[0].expectedResult).toBe("预期: 成功登录");
      expect(result[0].category).toBe("positive");

      expect(result[1].title).toBe("异常场景测试");
      expect(result[1].category).toBe("negative");
    });

    it("should handle missing children gracefully", () => {
      const xmindData = {
        rootTopic: {
          title: "测试套件",
          children: [
            {
              title: "简单测试用例",
              notes: "没有子节点"
            }
          ]
        }
      };

      const result = parseXMindJSON(JSON.stringify(xmindData));

      expect(result).toHaveLength(1);
      expect(result[0].steps).toContain("执行测试");
      expect(result[0].expectedResult).toBe("测试通过");
    });

    it("should detect test case categories from keywords", () => {
      const xmindData = {
        rootTopic: {
          children: [
            {
              title: "边界值测试",
              children: [
                { title: "边界: 输入最大值" }
              ]
            },
            {
              title: "特殊场景测试",
              children: [
                { title: "特殊: 输入空值" }
              ]
            }
          ]
        }
      };

      const result = parseXMindJSON(JSON.stringify(xmindData));

      expect(result[0].category).toBe("boundary");
      expect(result[1].category).toBe("edge");
    });
  });

  describe("parseXMindText", () => {
    it("should parse XMind text format correctly", () => {
      const textContent = `
测试套件
  登录功能测试
    输入正确的用户名和密码
    点击登录按钮
    预期: 成功登录
  异常场景测试
    异常: 输入错误的密码
    点击登录按钮
    预期: 显示错误提示
      `;

      const result = parseXMindText(textContent);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("登录功能测试");
      expect(result[0].steps).toContain("输入正确的用户名和密码");
      expect(result[0].expectedResult).toBe("成功登录");

      expect(result[1].title).toBe("异常场景测试");
      expect(result[1].category).toBe("negative");
    });

    it("should handle description lines", () => {
      const textContent = `
测试套件
  用户注册测试
    描述: 测试用户注册功能
    输入邮箱地址
    输入密码
    预期: 注册成功
      `;

      const result = parseXMindText(textContent);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe("测试用户注册功能");
    });

    it("should detect boundary and edge cases", () => {
      const textContent = `
测试套件
  边界值测试
    边界: 输入最大值
    验证结果
    预期: 通过
  特殊场景测试
    特殊: 输入空值
    验证结果
    预期: 显示错误
      `;

      const result = parseXMindText(textContent);

      expect(result[0].category).toBe("boundary");
      expect(result[1].category).toBe("edge");
    });

    it("should handle empty lines and trim whitespace", () => {
      const textContent = `
测试套件

  测试用例1
    步骤1
    
    步骤2
    预期: 通过
      `;

      const result = parseXMindText(textContent);

      expect(result).toHaveLength(1);
      expect(result[0].steps).toHaveLength(2);
    });
  });

  describe("parseXMind", () => {
    it("should auto-detect and parse JSON format", () => {
      const xmindData = {
        rootTopic: {
          children: [
            {
              title: "测试用例",
              children: [{ title: "步骤1" }]
            }
          ]
        }
      };

      const result = parseXMind(JSON.stringify(xmindData), "json");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("测试用例");
    });

    it("should parse text format when specified", () => {
      const textContent = `
测试套件
  测试用例
    步骤1
    预期: 通过
      `;

      const result = parseXMind(textContent, "text");

      expect(result).toHaveLength(1);
      expect(result[0].steps).toContain("步骤1");
    });

    it("should fallback to text parsing if JSON parsing fails", () => {
      const textContent = `
测试套件
  测试用例
    步骤1
    预期: 通过
      `;

      const result = parseXMind(textContent, "json");

      expect(result).toHaveLength(1);
      expect(result[0].steps).toContain("步骤1");
    });
  });

  describe("Edge cases", () => {
    it("should handle complex nested structures", () => {
      const xmindData = {
        rootTopic: {
          children: [
            {
              title: "复杂测试用例",
              notes: "包含多个步骤",
              children: [
                { title: "步骤1: 打开应用" },
                { title: "步骤2: 输入数据" },
                { title: "步骤3: 提交表单" },
                { title: "步骤4: 验证结果" },
                { title: "预期: 数据保存成功" }
              ]
            }
          ]
        }
      };

      const result = parseXMindJSON(JSON.stringify(xmindData));

      expect(result[0].steps).toHaveLength(4);
      expect(result[0].expectedResult).toBe("预期: 数据保存成功");
    });

    it("should handle multiple test case categories in one suite", () => {
      const xmindData = {
        rootTopic: {
          children: [
            { title: "正常流程", children: [{ title: "步骤1" }] },
            { title: "异常流程", children: [{ title: "异常: 错误处理" }] },
            { title: "边界值", children: [{ title: "边界: 最大值" }] },
            { title: "特殊场景", children: [{ title: "特殊: 空值" }] }
          ]
        }
      };

      const result = parseXMindJSON(JSON.stringify(xmindData));

      expect(result).toHaveLength(4);
      expect(result[0].category).toBe("positive");
      expect(result[1].category).toBe("negative");
      expect(result[2].category).toBe("boundary");
      expect(result[3].category).toBe("edge");
    });

    it("should handle English keywords as well", () => {
      const xmindData = {
        rootTopic: {
          children: [
            {
              title: "Login Test",
              children: [
                { title: "Enter username" },
                { title: "Enter password" },
                { title: "Expected: Login successful" }
              ]
            }
          ]
        }
      };

      const result = parseXMindJSON(JSON.stringify(xmindData));

      expect(result[0].expectedResult).toBe("Expected: Login successful");
    });
  });
});
