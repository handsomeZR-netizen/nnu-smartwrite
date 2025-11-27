/**
 * 四六级评分标准测试脚本
 * 
 * 测试场景：
 * 1. 写作题 - 简单句（需要词汇升级和句式改进）
 * 2. 写作题 - 中式英语（需要指出不地道表达）
 * 3. 翻译题 - 基础翻译（测试四六级翻译标准）
 */

const API_ENDPOINT = 'http://localhost:3000/api/evaluate';

// 测试用例 1: 写作题 - 简单句（词汇低幼，句式单一）
const testCase1 = {
  directions: 'Write an essay about the importance of learning English.',
  essayContext: '',
  studentSentence: 'I think learning English is very good. It can help us find good jobs. Many people think English is important.',
  mode: 'sentence',
  evaluationType: 'writing'
};

// 测试用例 2: 写作题 - 中式英语
const testCase2 = {
  directions: 'Write about environmental protection.',
  essayContext: '',
  studentSentence: 'We should do exercise to protect environment. Government must take measures to solve this problem.',
  mode: 'sentence',
  evaluationType: 'writing'
};

// 测试用例 3: 翻译题 - 四六级标准
const testCase3 = {
  directions: '将下列句子翻译成英文：随着科技的发展，人们的生活变得越来越便利。',
  essayContext: '',
  studentSentence: 'With the development of technology, people\'s life becomes more and more convenient.',
  mode: 'sentence',
  evaluationType: 'translation'
};

// 测试用例 4: 全文写作 - 四六级议论文
const testCase4 = {
  directions: 'Directions: For this part, you are allowed 30 minutes to write an essay on the importance of reading. You should write at least 120 words.',
  essayContext: '',
  studentSentence: `Reading is very important for students. First, reading can help us learn knowledge. We can know many things from books. Second, reading is good for our study. It can make us smart. Third, reading can make us happy. When we read interesting books, we feel good.

In conclusion, I think reading is very important. We should read more books every day.`,
  mode: 'article',
  evaluationType: 'writing'
};

async function testEvaluation(testCase, testName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`测试: ${testName}`);
  console.log(`${'='.repeat(80)}`);
  console.log('输入内容:', testCase.studentSentence);
  console.log('题目要求:', testCase.directions);
  console.log('评估模式:', testCase.mode === 'sentence' ? '单句评估' : '全文评估');
  console.log('题目类型:', testCase.evaluationType === 'writing' ? '写作题' : '翻译题');
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('\n❌ API 错误:', errorData);
      return;
    }

    const result = await response.json();
    
    console.log('\n📊 评估结果:');
    console.log('─'.repeat(80));
    console.log(`评分: ${result.score} (${getScoreDescription(result.score)})`);
    console.log(`语义正确: ${result.isSemanticallyCorrect ? '✓' : '✗'}`);
    console.log(`评估类型: ${result.evaluationType === 'writing' ? '四六级写作' : '四六级翻译'}`);
    
    console.log('\n💬 总体分析:');
    console.log(result.analysis);
    
    if (result.analysisBreakdown) {
      console.log('\n✨ 优点 (Strengths):');
      result.analysisBreakdown.strengths?.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s}`);
      });
      
      console.log('\n⚠️  不足 (Weaknesses):');
      result.analysisBreakdown.weaknesses?.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w}`);
      });
      
      console.log('\n🎯 语境匹配 (Context Match):');
      console.log(`  ${result.analysisBreakdown.contextMatch}`);
    }
    
    console.log('\n✍️  润色建议 (Polished Version):');
    console.log(result.polishedVersion);
    
    if (result.radarDimensions) {
      console.log('\n📈 雷达图维度 (四六级标准):');
      const labels = result.radarDimensions.labels;
      console.log(`  ${labels[0]}: ${result.radarDimensions.dim1}/100`);
      console.log(`  ${labels[1]}: ${result.radarDimensions.dim2}/100`);
      console.log(`  ${labels[2]}: ${result.radarDimensions.dim3}/100`);
      console.log(`  ${labels[3]}: ${result.radarDimensions.dim4}/100`);
    }
    
    if (result.reasoningProcess) {
      console.log('\n🧠 推理过程:');
      console.log(result.reasoningProcess.substring(0, 500) + '...');
    }
    
    // 验证四六级标准特征
    console.log('\n✅ 四六级标准验证:');
    validateCETStandard(result, testCase.evaluationType);
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

function getScoreDescription(score) {
  const descriptions = {
    'S': '13-15分 - Excellent (优秀)',
    'A': '10-12分 - Good (良好)',
    'B': '7-9分 - Average (中等)',
    'C': '<7分 - Poor (较差)'
  };
  return descriptions[score] || '未知';
}

function validateCETStandard(result, evaluationType) {
  const checks = [];
  
  // 检查雷达图标签是否符合四六级标准
  if (result.radarDimensions) {
    const labels = result.radarDimensions.labels;
    if (evaluationType === 'writing') {
      const expectedLabels = ['切题', '丰富', '连贯', '规范'];
      const hasCorrectLabels = expectedLabels.every(label => 
        labels.some(l => l.includes(label))
      );
      checks.push({
        name: '雷达图标签（写作）',
        passed: hasCorrectLabels,
        expected: '切题/丰富/连贯/规范',
        actual: labels.join(', ')
      });
    } else {
      const expectedLabels = ['准确', '通顺', '词汇', '句法'];
      const hasCorrectLabels = expectedLabels.every(label => 
        labels.some(l => l.includes(label))
      );
      checks.push({
        name: '雷达图标签（翻译）',
        passed: hasCorrectLabels,
        expected: '准确/通顺/词汇/句法',
        actual: labels.join(', ')
      });
    }
  }
  
  // 检查是否提到词汇升级
  if (evaluationType === 'writing') {
    const mentionsVocab = result.analysis.includes('词汇') || 
                          result.analysisBreakdown?.weaknesses?.some(w => 
                            w.includes('词汇') || w.includes('think') || w.includes('good')
                          );
    checks.push({
      name: '词汇升级建议',
      passed: mentionsVocab,
      expected: '应提到词汇升级（如 think → maintain）',
      actual: mentionsVocab ? '✓ 已提及' : '✗ 未提及'
    });
    
    // 检查是否提到句式多样性
    const mentionsSentence = result.analysis.includes('句式') || result.analysis.includes('从句') ||
                             result.analysisBreakdown?.weaknesses?.some(w => 
                               w.includes('句式') || w.includes('简单句') || w.includes('从句')
                             );
    checks.push({
      name: '句式多样性建议',
      passed: mentionsSentence,
      expected: '应提到句式改进（如简单句 → 从句）',
      actual: mentionsSentence ? '✓ 已提及' : '✗ 未提及'
    });
  }
  
  // 检查 polished_version 是否为英文
  const isEnglish = result.polishedVersion && 
                    !/[\u4e00-\u9fa5]/.test(result.polishedVersion);
  checks.push({
    name: 'Polished Version 语言',
    passed: isEnglish,
    expected: '必须是英文',
    actual: isEnglish ? '✓ 英文' : '✗ 包含中文'
  });
  
  // 检查分析是否为中文
  const isChinese = result.analysis && /[\u4e00-\u9fa5]/.test(result.analysis);
  checks.push({
    name: 'Analysis 语言',
    passed: isChinese,
    expected: '必须是中文',
    actual: isChinese ? '✓ 中文' : '✗ 非中文'
  });
  
  // 输出验证结果
  checks.forEach(check => {
    const icon = check.passed ? '✓' : '✗';
    const status = check.passed ? '通过' : '失败';
    console.log(`  ${icon} ${check.name}: ${status}`);
    if (!check.passed) {
      console.log(`     期望: ${check.expected}`);
      console.log(`     实际: ${check.actual}`);
    }
  });
  
  const allPassed = checks.every(c => c.passed);
  console.log(`\n  总体: ${allPassed ? '✓ 全部通过' : '✗ 部分失败'}`);
}

async function runAllTests() {
  console.log('🚀 开始四六级评分标准测试...\n');
  console.log('测试服务器: ' + API_ENDPOINT);
  console.log('请确保开发服务器正在运行 (npm run dev)\n');
  
  await testEvaluation(testCase1, '测试1: 写作题 - 简单句（词汇低幼）');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testEvaluation(testCase2, '测试2: 写作题 - 中式英语');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testEvaluation(testCase3, '测试3: 翻译题 - 四六级标准');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testEvaluation(testCase4, '测试4: 全文写作 - 四六级议论文');
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 所有测试完成！');
  console.log('='.repeat(80));
}

// 运行测试
runAllTests().catch(console.error);
