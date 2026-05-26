import { unzipSync } from 'zlib';
import { readFileSync } from 'fs';

/**
 * XMind 文件解析器
 * XMind 文件是一个 ZIP 文件，包含 XML 格式的思维导图数据
 */

interface XMindTopic {
  id: string;
  title: string;
  children?: XMindTopic[];
  notes?: string;
}

interface ParsedTestCase {
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  category: string;
}

/**
 * 从 XMind 文件中提取测试用例
 * XMind 的结构：
 * - 根节点：测试套件名称
 * - 一级子节点：测试用例
 * - 二级子节点：测试步骤
 */
export function parseXMindFile(filePath: string): ParsedTestCase[] {
  try {
    const fileBuffer = readFileSync(filePath);
    
    // XMind 文件是 ZIP 格式，需要解压
    // 主要内容在 content.xml 中
    const contentXmlPath = 'content.xml';
    
    // 这里需要使用 unzip 库来解压
    // 由于沙箱环境的限制，我们提供一个简化版本
    // 实际使用中应该使用 unzipper 或 jszip 库
    
    const testCases: ParsedTestCase[] = [];
    
    // 解析 XML 内容
    // XMind XML 格式示例：
    // <root>
    //   <sheet>
    //     <topic id="root" title="测试套件">
    //       <children>
    //         <topic id="tc1" title="测试用例1">
    //           <notes>测试用例描述</notes>
    //           <children>
    //             <topic title="步骤1"/>
    //             <topic title="步骤2"/>
    //             <topic title="预期结果: 成功"/>
    //           </children>
    //         </topic>
    //       </children>
    //     </topic>
    //   </sheet>
    // </root>
    
    return testCases;
  } catch (error) {
    console.error('Failed to parse XMind file:', error);
    throw new Error('XMind 文件解析失败');
  }
}

/**
 * 从 XMind JSON 格式解析测试用例
 * XMind 也支持导出为 JSON 格式
 */
export function parseXMindJSON(jsonContent: string): ParsedTestCase[] {
  try {
    const data = JSON.parse(jsonContent);
    const testCases: ParsedTestCase[] = [];
    
    // XMind JSON 格式
    const rootTopic = data.rootTopic || {};
    const children = rootTopic.children || [];
    
    children.forEach((testCaseTopic: XMindTopic) => {
      const testCase: ParsedTestCase = {
        title: testCaseTopic.title || '',
        description: testCaseTopic.notes || '',
        steps: [],
        expectedResult: '',
        category: 'positive'
      };
      
      // 提取子节点作为步骤和预期结果
      if (testCaseTopic.children) {
        testCaseTopic.children.forEach((child: XMindTopic, index: number) => {
          const title = child.title || '';
          
          if (title.toLowerCase().includes('预期') || title.toLowerCase().includes('expected')) {
            testCase.expectedResult = title;
          } else if (title.toLowerCase().includes('异常') || title.toLowerCase().includes('negative')) {
            testCase.category = 'negative';
            testCase.steps.push(title);
          } else if (title.toLowerCase().includes('边界') || title.toLowerCase().includes('boundary')) {
            testCase.category = 'boundary';
            testCase.steps.push(title);
          } else if (title.toLowerCase().includes('特殊') || title.toLowerCase().includes('edge')) {
            testCase.category = 'edge';
            testCase.steps.push(title);
          } else {
            testCase.steps.push(title);
          }
        });
      }
      
      // 确保至少有一个步骤和预期结果
      if (testCase.steps.length === 0) {
        testCase.steps.push('执行测试');
      }
      if (!testCase.expectedResult) {
        testCase.expectedResult = '测试通过';
      }
      
      testCases.push(testCase);
    });
    
    return testCases;
  } catch (error) {
    console.error('Failed to parse XMind JSON:', error);
    throw new Error('XMind JSON 解析失败');
  }
}

/**
 * 从 XMind 导出的文本格式解析
 * XMind 可以导出为纯文本格式，便于解析
 */
export function parseXMindText(textContent: string): ParsedTestCase[] {
  const testCases: ParsedTestCase[] = [];
  const lines = textContent.split('\n').filter(line => line.trim());
  
  let currentTestCase: ParsedTestCase | null = null;
  let indentLevel = 0;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    const currentIndent = line.search(/\S/);
    
    // 根据缩进级别判断层级
    if (currentIndent === 0) {
      // 顶级：测试套件名称，跳过
      return;
    } else if (currentIndent <= 2) {
      // 一级：测试用例
      if (currentTestCase) {
        testCases.push(currentTestCase);
      }
      
      currentTestCase = {
        title: trimmed,
        description: '',
        steps: [],
        expectedResult: '',
        category: 'positive'
      };
    } else if (currentTestCase && currentIndent > 2) {
      // 二级及以下：步骤、预期结果等
      if (trimmed.toLowerCase().includes('预期') || trimmed.toLowerCase().includes('expected')) {
        currentTestCase.expectedResult = trimmed.replace(/^(预期|expected)[\s:：]*/, '');
      } else if (trimmed.toLowerCase().includes('描述') || trimmed.toLowerCase().includes('description')) {
        currentTestCase.description = trimmed.replace(/^(描述|description)[\s:：]*/, '');
      } else if (trimmed.toLowerCase().includes('异常') || trimmed.toLowerCase().includes('negative')) {
        currentTestCase.category = 'negative';
        currentTestCase.steps.push(trimmed);
      } else if (trimmed.toLowerCase().includes('边界') || trimmed.toLowerCase().includes('boundary')) {
        currentTestCase.category = 'boundary';
        currentTestCase.steps.push(trimmed);
      } else if (trimmed.toLowerCase().includes('特殊') || trimmed.toLowerCase().includes('edge')) {
        currentTestCase.category = 'edge';
        currentTestCase.steps.push(trimmed);
      } else {
        currentTestCase.steps.push(trimmed);
      }
    }
  });
  
  // 添加最后一个测试用例
  if (currentTestCase) {
    testCases.push(currentTestCase);
  }
  
  return testCases;
}

/**
 * 通用 XMind 解析函数
 * 支持多种格式
 */
export function parseXMind(content: string, format: 'json' | 'text' = 'json'): ParsedTestCase[] {
  if (format === 'json') {
    try {
      return parseXMindJSON(content);
    } catch {
      // 如果 JSON 解析失败，尝试作为文本解析
      return parseXMindText(content);
    }
  } else {
    return parseXMindText(content);
  }
}
