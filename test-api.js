/**
 * API 测试脚本
 * 用于快速测试评估 API 是否正常工作
 */

const testData = {
  directions: "Translate the following sentence into English",
  essayContext: "Education is the foundation of social development.",
  studentSentence: "Education plays a crucial role in society."
};

async function testAPI() {
  console.log('🧪 Testing NNU SmartWrite API...\n');
  console.log('📝 Test Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n⏳ Sending request...\n');

  try {
    const response = await fetch('http://localhost:3000/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.json();
      console.error('\n❌ Error Response:');
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    const result = await response.json();
    console.log('\n✅ Success! Response:');
    console.log(JSON.stringify(result, null, 2));

    // 检查是否为测试模式
    if (result.analysis && result.analysis.includes('【测试模式】')) {
      console.log('\n⚠️  Running in MOCK mode (no API key configured)');
      console.log('   To use real AI evaluation, configure DEEPSEEK_API_KEY in .env.local');
    } else {
      console.log('\n🎉 Using real DeepSeek API!');
    }

  } catch (error) {
    console.error('\n❌ Request failed:');
    console.error(error.message);
  }
}

// 运行测试
testAPI();
