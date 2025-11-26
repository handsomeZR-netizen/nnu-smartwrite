// 测试评估功能
async function testEvaluation() {
  console.log('='.repeat(80));
  console.log('测试 1: 写作题 - 社会责任感');
  console.log('='.repeat(80));
  
  const test1 = {
    directions: 'Write a sentence about the importance of social responsibility in modern society. Consider how individuals contribute to their communities.',
    essayContext: 'In modern society, every individual plays a role in the community structure. We are bound not just by laws, but by unwritten rules. Citizens have both rights and responsibilities that help maintain social harmony and progress.',
    studentSentence: 'Social responsibility is essential for building a harmonious and progressive society where every citizen actively contributes to the common good.',
  };

  try {
    const response1 = await fetch('http://localhost:3000/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test1),
    });

    const result1 = await response1.json();
    console.log('\n✅ 测试结果:');
    console.log('评分:', result1.score);
    console.log('语义正确:', result1.isSemanticallyCorrect);
    console.log('评估类型:', result1.evaluationType);
    console.log('\n分析:', result1.analysis);
    
    if (result1.analysisBreakdown) {
      console.log('\n优点:');
      result1.analysisBreakdown.strengths.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
      console.log('\n需要改进:');
      result1.analysisBreakdown.weaknesses.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
      console.log('\n语境契合度:', result1.analysisBreakdown.contextMatch);
    }
    
    if (result1.radarDimensions) {
      console.log('\n雷达图维度:');
      result1.radarDimensions.labels.forEach((label, i) => {
        const score = result1.radarDimensions[`dim${i + 1}`];
        console.log(`  ${label}: ${score}/100`);
      });
    }
    
    console.log('\n润色建议:', result1.polishedVersion);
  } catch (error) {
    console.error('❌ 测试 1 失败:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('测试 2: 写作题 - 科技与生活（全文评价）');
  console.log('='.repeat(80));
  
  const test2 = {
    directions: 'Write a sentence that expresses your view on balancing technology use with personal well-being.',
    essayContext: 'Technology has revolutionized the way we communicate and work. Smartphones and the internet have made information accessible to billions of people worldwide. However, this digital transformation also brings challenges such as privacy concerns and digital addiction. Finding the right balance is crucial for our mental and physical health.',
    studentSentence: 'Technology has revolutionized the way we communicate and work. Smartphones and the internet have made information accessible to billions of people worldwide. However, this digital transformation also brings challenges such as privacy concerns and digital addiction. Finding the right balance is crucial for our mental and physical health.',
  };

  try {
    const response2 = await fetch('http://localhost:3000/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test2),
    });

    const result2 = await response2.json();
    console.log('\n✅ 测试结果:');
    console.log('评分:', result2.score);
    console.log('语义正确:', result2.isSemanticallyCorrect);
    console.log('评估类型:', result2.evaluationType);
    console.log('\n分析:', result2.analysis);
    
    if (result2.radarDimensions) {
      console.log('\n雷达图维度:');
      result2.radarDimensions.labels.forEach((label, i) => {
        const score = result2.radarDimensions[`dim${i + 1}`];
        console.log(`  ${label}: ${score}/100`);
      });
    }
  } catch (error) {
    console.error('❌ 测试 2 失败:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('测试 3: 翻译题（验证自动识别）');
  console.log('='.repeat(80));
  
  const test3 = {
    directions: 'Translate the underlined sentence into Chinese.',
    essayContext: 'Education is the foundation of social development. It plays a vital role in modern society.',
    studentSentence: '教育是社会发展的基础。',
  };

  try {
    const response3 = await fetch('http://localhost:3000/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test3),
    });

    const result3 = await response3.json();
    console.log('\n✅ 测试结果:');
    console.log('评分:', result3.score);
    console.log('评估类型:', result3.evaluationType, '(应该是 translation)');
    
    if (result3.radarDimensions) {
      console.log('\n雷达图维度:');
      result3.radarDimensions.labels.forEach((label, i) => {
        const score = result3.radarDimensions[`dim${i + 1}`];
        console.log(`  ${label}: ${score}/100`);
      });
    }
  } catch (error) {
    console.error('❌ 测试 3 失败:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('测试完成！');
  console.log('='.repeat(80));
}

testEvaluation();
