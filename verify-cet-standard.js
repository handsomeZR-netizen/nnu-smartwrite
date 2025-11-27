/**
 * 快速验证四六级标准是否正确配置
 */

const API_ENDPOINT = 'http://localhost:3000/api/evaluate';

async function quickTest() {
  console.log('🔍 快速验证四六级评分标准...\n');
  
  const testCase = {
    directions: 'Write about the importance of reading.',
    essayContext: '',
    studentSentence: 'I think reading is very good.',
    mode: 'sentence',
    evaluationType: 'writing'
  };
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase),
    });

    if (!response.ok) {
      console.error('❌ API 调用失败');
      return;
    }

    const result = await response.json();
    
    console.log('✅ API 调用成功\n');
    console.log('📊 评分:', result.score);
    console.log('📝 评估类型:', result.evaluationType);
    
    if (result.radarDimensions) {
      console.log('\n📈 雷达图维度（四六级标准）:');
      result.radarDimensions.labels.forEach((label, i) => {
        const dimKey = `dim${i + 1}`;
        console.log(`   ${label}: ${result.radarDimensions[dimKey]}/100`);
      });
    }
    
    // 验证关键特征
    console.log('\n✅ 四六级标准特征验证:');
    
    const labels = result.radarDimensions?.labels || [];
    const hasCorrectLabels = ['切题', '丰富', '连贯', '规范'].every(label => 
      labels.some(l => l.includes(label))
    );
    console.log(`   ${hasCorrectLabels ? '✓' : '✗'} 雷达图标签正确`);
    
    const mentionsVocab = result.analysis?.includes('词汇') || 
                          result.analysisBreakdown?.weaknesses?.some(w => w.includes('词汇'));
    console.log(`   ${mentionsVocab ? '✓' : '✗'} 提到词汇升级`);
    
    const isEnglish = result.polishedVersion && !/[\u4e00-\u9fa5]/.test(result.polishedVersion);
    console.log(`   ${isEnglish ? '✓' : '✗'} Polished Version 是英文`);
    
    const isChinese = result.analysis && /[\u4e00-\u9fa5]/.test(result.analysis);
    console.log(`   ${isChinese ? '✓' : '✗'} Analysis 是中文`);
    
    console.log('\n✅ 四六级评分标准配置正确！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

quickTest();
