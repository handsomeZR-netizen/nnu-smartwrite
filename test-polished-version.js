/**
 * 测试 polished_version 是否返回英文
 * 
 * 运行方式：node test-polished-version.js
 */

const testCases = [
  {
    name: "翻译题测试",
    input: {
      directions: "Translate the following Chinese sentence into English.",
      essayContext: "这是一篇关于数字化转型的文章。",
      studentSentence: "然而，这种数字化转型也引发了诸如隐私担忧和数字成瘾等挑战。",
      mode: "sentence"
    }
  },
  {
    name: "写作题测试（有错误）",
    input: {
      directions: "Write a sentence about climate change.",
      essayContext: "Climate change is a global issue.",
      studentSentence: "The climate change is cause by human activities and it effect everyone.",
      mode: "sentence"
    }
  },
  {
    name: "写作题测试（完美句子）",
    input: {
      directions: "Write a sentence about education.",
      essayContext: "Education is important for society.",
      studentSentence: "Education plays a crucial role in shaping individuals and fostering societal progress.",
      mode: "sentence"
    }
  }
];

async function testPolishedVersion() {
  console.log('🧪 Testing polished_version field...\n');
  
  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`   Input: ${testCase.input.studentSentence.substring(0, 50)}...`);
    
    try {
      const response = await fetch('http://localhost:3000/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.input)
      });
      
      if (!response.ok) {
        console.log(`   ❌ API Error: ${response.status}`);
        continue;
      }
      
      const result = await response.json();
      const polishedVersion = result.polished_version || result.polishedVersion;
      
      if (!polishedVersion) {
        console.log(`   ⚠️  No polished_version in response`);
        continue;
      }
      
      // 检查是否包含中文字符
      const hasChinese = /[\u4e00-\u9fa5]/.test(polishedVersion);
      
      if (hasChinese) {
        console.log(`   ❌ FAILED: polished_version contains Chinese`);
        console.log(`      Content: ${polishedVersion}`);
      } else {
        console.log(`   ✅ PASSED: polished_version is in English`);
        console.log(`      Content: ${polishedVersion}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// 运行测试
testPolishedVersion().catch(console.error);
